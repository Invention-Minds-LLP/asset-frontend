import { Component, computed, effect, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DownloadGateService, PictureCaptcha } from './download-gate.service';

/**
 * Host for the DPDP download prompt. Mounted once in app.html; opens whenever
 * DownloadGateService.verify() is awaiting. Two phases:
 *   1. email OTP  — skipped while a 60-min grant is still valid
 *   2. picture captcha + reason — every download
 * Signals throughout: the app is zoneless.
 */
@Component({
  selector: 'app-download-gate-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, ButtonModule, InputTextModule],
  templateUrl: './download-gate-dialog.html',
  styleUrl: './download-gate-dialog.css',
})
export class DownloadGateDialog {
  readonly label = computed(() => this.svc.request());
  readonly visible = computed(() => this.svc.request() !== null);

  phase = signal<'otp' | 'authorize'>('otp');
  needsOtp = signal(false);
  otp = signal('');
  sentTo = signal('');
  sending = signal(false);
  captcha = signal<PictureCaptcha | null>(null);
  tiles = signal<number[]>([]);
  selected = signal<Set<number>>(new Set());
  reason = signal('');
  busy = signal(false);
  error = signal('');

  constructor(private svc: DownloadGateService) {
    effect(() => {
      if (this.visible()) untracked(() => this.start());
    });
  }

  private start(): void {
    this.otp.set('');
    this.reason.set('');
    this.error.set('');
    this.busy.set(false);
    this.needsOtp.set(!this.svc.currentGrant());
    if (this.needsOtp()) {
      this.phase.set('otp');
      this.sendOtp();
    } else {
      this.toAuthorize();
    }
  }

  cancel(): void {
    this.svc.close(false);
  }

  sendOtp(): void {
    this.sending.set(true);
    this.error.set('');
    this.otp.set('');
    this.sentTo.set('');
    this.svc.requestOtp().subscribe({
      next: (r) => {
        this.sending.set(false);
        this.sentTo.set(r.sentTo);
      },
      error: (e) => {
        this.sending.set(false);
        this.error.set(e?.error?.message || 'Could not send the code. Please try again.');
      },
    });
  }

  submitOtp(): void {
    if (!/^\d{6}$/.test(this.otp().trim()) || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    this.svc.confirmOtp(this.otp().trim()).subscribe({
      next: (g) => {
        this.svc.storeGrant(g);
        this.busy.set(false);
        this.toAuthorize();
      },
      error: (e) => {
        this.busy.set(false);
        this.error.set(e?.error?.message || 'Verification failed. Please try again.');
      },
    });
  }

  private toAuthorize(): void {
    this.phase.set('authorize');
    this.error.set('');
    this.loadCaptcha();
  }

  loadCaptcha(): void {
    this.captcha.set(null);
    this.selected.set(new Set());
    this.svc.getCaptcha().subscribe({
      next: (c) => {
        this.captcha.set(c);
        this.tiles.set(Array.from({ length: c.grid * c.grid }, (_, i) => i));
      },
      error: (e) => this.error.set(e?.error?.message || 'Could not load the picture. Please try again.'),
    });
  }

  toggleTile(t: number): void {
    const next = new Set(this.selected());
    if (next.has(t)) next.delete(t);
    else next.add(t);
    this.selected.set(next);
  }

  canAuthorize(): boolean {
    return !this.busy() && !!this.captcha() && this.selected().size > 0 && this.reason().trim().length >= 5;
  }

  async submitAuthorize(): Promise<void> {
    const captcha = this.captcha();
    if (!captcha || !this.canAuthorize()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      await this.svc.authorize({
        captchaId: captcha.captchaId,
        captchaAnswer: [...this.selected()],
        reason: this.reason().trim(),
        label: this.label() || 'Unlabelled download',
      });
      this.busy.set(false);
      this.svc.close(true);
    } catch (e: any) {
      this.busy.set(false);
      this.error.set(e?.error?.message || 'Could not verify. Please try again.');
      if (e?.status === 428) {
        // Grant expired mid-flow → back to the email code.
        this.svc.dropGrant();
        this.needsOtp.set(true);
        this.phase.set('otp');
        this.sendOtp();
        return;
      }
      this.loadCaptcha(); // captchas are single use
    }
  }
}
