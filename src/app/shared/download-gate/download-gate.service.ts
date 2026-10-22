import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environment/environment.prod';
import {
  DownloadGrant,
  clearDownloadGrant,
  currentDownloadGrant,
  setDownloadTicket,
  storeDownloadGrant,
} from './download-grant.store';

export interface PictureCaptcha {
  captchaId: string;
  image: string;
  prompt: string;
  grid: number;
}

export interface DownloadLogRow {
  id: string;
  employeeID: string;
  name: string | null;
  role: string;
  label: string;
  page: string | null;
  reason: string;
  ipAddress: string | null;
  serverRoute: string | null;
  servedAt: string | null;
  createdAt: string;
}

/**
 * DPDP download gate. Every download / export / print handler starts with:
 *
 *   if (!(await this.downloadGate.verify('Asset register (Excel)'))) return;
 *
 * which shows the dialog (email OTP once per 60 min, then picture captcha +
 * reason every time), writes the DownloadLog row server-side and arms a
 * single-use ticket that the interceptor attaches to the next blob request.
 * Server file routes reject requests without it (HTTP 428).
 */
@Injectable({ providedIn: 'root' })
export class DownloadGateService {
  private apiUrl = `${environment.apiUrl}/download-otp`;

  /** Label of the pending download; non-null while the dialog is open. */
  readonly request = signal<string | null>(null);
  private resolver: ((ok: boolean) => void) | null = null;
  private pending: Promise<boolean> | null = null;

  constructor(private http: HttpClient) {}

  /** Resolves true once the user has passed OTP (if needed), captcha and reason. */
  verify(label = 'this download'): Promise<boolean> {
    // Several exports fired by one click share one prompt.
    if (!this.pending) {
      this.pending = new Promise<boolean>((resolve) => {
        this.resolver = resolve;
        this.request.set(label);
      }).finally(() => (this.pending = null));
    }
    return this.pending;
  }

  /** Called by the dialog host when the user finishes or cancels. */
  close(ok: boolean): void {
    this.request.set(null);
    const r = this.resolver;
    this.resolver = null;
    r?.(ok);
  }

  currentGrant(): string | null {
    return currentDownloadGrant();
  }

  requestOtp() {
    return this.http.post<{ sentTo: string; expiresAt: string }>(`${this.apiUrl}/request`, {});
  }

  confirmOtp(otp: string) {
    return this.http.post<DownloadGrant>(`${this.apiUrl}/verify`, { otp });
  }

  storeGrant(g: DownloadGrant): void {
    storeDownloadGrant(g);
  }

  dropGrant(): void {
    clearDownloadGrant();
  }

  getCaptcha() {
    return this.http.get<PictureCaptcha>(`${this.apiUrl}/captcha`);
  }

  async authorize(body: { captchaId: string; captchaAnswer: number[]; reason: string; label: string }): Promise<void> {
    const page = typeof window !== 'undefined' ? window.location.pathname : null;
    const res = await firstValueFrom(
      this.http.post<{ logId: string; ticket: string }>(
        `${this.apiUrl}/authorize`,
        { ...body, page },
        { headers: { 'X-Download-Grant': this.currentGrant() || '' } }
      )
    );
    setDownloadTicket(res.ticket);
  }

  getLogs(params: { page: number; pageSize: number; search?: string; from?: string; to?: string }) {
    const q: Record<string, string> = { page: String(params.page), pageSize: String(params.pageSize) };
    if (params.search) q['search'] = params.search;
    if (params.from) q['from'] = params.from;
    if (params.to) q['to'] = params.to;
    return this.http.get<{ data: DownloadLogRow[]; total: number; page: number; pageSize: number }>(
      `${this.apiUrl}/logs`,
      { params: q }
    );
  }
}
