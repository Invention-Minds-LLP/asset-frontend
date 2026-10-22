import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

/**
 * DPDP screen protection (ported from DocMinds). App-wide, every role:
 *  - blocks copy / cut / text selection / drag / right-click outside form fields
 *  - blocks Ctrl+P / Ctrl+S / Ctrl+U, F12, Ctrl+Shift+I/J/C/S, PrintScreen
 *  - blurs the app when the window loses focus or the tab is hidden (covers
 *    Snipping Tool / Win+Shift+S, which steal focus) and briefly on PrintScreen
 *  - tiles a faint name · employee ID · date watermark so any photo or capture
 *    that does get through is traceable to the viewer.
 *
 * Browsers cannot truly prevent OS-level screenshots or a phone camera; this is
 * deterrence + attribution, which is what the watermark is for.
 */
@Injectable({ providedIn: 'root' })
export class ScreenProtectionService {
  private started = false;
  private watermarkEl: HTMLElement | null = null;
  private watermarkKey = '';

  constructor(@Inject(PLATFORM_ID) private platformId: object, @Inject(DOCUMENT) private doc: Document) {}

  start(): void {
    if (this.started || !isPlatformBrowser(this.platformId)) return;
    this.started = true;
    const body = this.doc.body;
    const win = this.doc.defaultView!;
    body.classList.add('sa-protected');

    const block = (e: Event) => {
      if (!this.isEditable(e.target)) e.preventDefault();
    };
    this.doc.addEventListener('copy', block, true);
    this.doc.addEventListener('cut', block, true);
    this.doc.addEventListener('selectstart', block, true);
    this.doc.addEventListener('dragstart', block, true);
    this.doc.addEventListener('contextmenu', (e) => e.preventDefault(), true);
    this.doc.addEventListener('keydown', (e) => this.onKeyDown(e), true);
    this.doc.addEventListener('keyup', (e) => {
      if (e.key === 'PrintScreen') this.onPrintScreen();
    }, true);

    // Focus moving into an embedded iframe (PDF/report viewer) also fires
    // window blur; don't blur the app for that.
    win.addEventListener('blur', () =>
      setTimeout(() => {
        if (this.doc.activeElement?.tagName !== 'IFRAME') body.classList.add('sa-privacy-blur');
      })
    );
    win.addEventListener('focus', () => body.classList.remove('sa-privacy-blur'));
    this.doc.addEventListener('visibilitychange', () => {
      body.classList.toggle('sa-privacy-blur', this.doc.visibilityState === 'hidden');
    });
  }

  /** Shows/updates the watermark for the signed-in user; hides it when signed out. */
  refreshWatermark(loggedIn: boolean): void {
    if (!isPlatformBrowser(this.platformId)) return;
    let name = '';
    let id = '';
    try {
      if (loggedIn) {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        name = localStorage.getItem('name') || user?.name || '';
        id = user?.employeeID || '';
      }
    } catch {}
    const date = new Date().toLocaleDateString('en-IN');
    const key = loggedIn && (name || id) ? `${name}|${id}|${date}` : '';
    if (key === this.watermarkKey) return;
    this.watermarkKey = key;

    if (!key) {
      this.watermarkEl?.remove();
      this.watermarkEl = null;
      return;
    }
    if (!this.watermarkEl) {
      this.watermarkEl = this.doc.createElement('div');
      this.watermarkEl.className = 'sa-watermark';
      this.watermarkEl.setAttribute('aria-hidden', 'true');
      this.doc.body.appendChild(this.watermarkEl);
    }
    const label = [name, id, date].filter(Boolean).join(' · ');
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180">` +
      `<text x="20" y="110" transform="rotate(-24 160 90)" font-family="Arial" font-size="14" fill="#1e3a6b">` +
      `${this.escapeXml(label)}</text></svg>`;
    this.watermarkEl.style.backgroundImage = `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
  }

  private onKeyDown(e: KeyboardEvent): void {
    const key = (e.key || '').toLowerCase();
    const mod = e.ctrlKey || e.metaKey;
    const blocked =
      key === 'printscreen' ||
      key === 'f12' ||
      (mod && ['p', 's', 'u'].includes(key)) ||
      (mod && ['c', 'x', 'a'].includes(key) && !this.isEditable(e.target)) ||
      (mod && e.shiftKey && ['i', 'j', 'c', 's'].includes(key));
    if (blocked) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (key === 'printscreen') this.onPrintScreen();
  }

  private onPrintScreen(): void {
    const body = this.doc.body;
    body.classList.add('sa-privacy-blur');
    try {
      this.doc.defaultView?.navigator.clipboard?.writeText('Screenshots are disabled in Smart Assets.').catch(() => {});
    } catch {}
    setTimeout(() => body.classList.remove('sa-privacy-blur'), 1500);
  }

  private isEditable(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null;
    if (!el || typeof el.closest !== 'function') return false;
    return !!el.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]');
  }

  private escapeXml(s: string): string {
    return s.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]!));
  }
}
