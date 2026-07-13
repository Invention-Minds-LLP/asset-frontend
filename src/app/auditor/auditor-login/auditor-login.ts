import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ExternalAuthService } from '../../services/external-auth/external-auth';

const RESEND_COOLDOWN_SECONDS = 60;

@Component({
  selector: 'app-auditor-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './auditor-login.html',
  styleUrl: './auditor-login.css',
})
export class AuditorLogin implements OnInit, OnDestroy {
  step: 'identifier' | 'otp' = 'identifier';

  email = '';
  otp = '';

  loading = false;
  errorMessage = '';
  currentYear = new Date().getFullYear();

  resendCountdown = 0;
  private resendIntervalId: any = null;

  constructor(
    private auth: ExternalAuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Already signed in as an auditor → skip straight to the audits list.
    if (this.auth.isExternalAuditor()) {
      this.router.navigate(['/auditor/audits'], { replaceUrl: true });
    }
  }

  ngOnDestroy(): void {
    this.clearResendTimer();
  }

  requestCode(): void {
    this.errorMessage = '';
    const addr = this.email.trim().toLowerCase();
    if (!addr || !addr.includes('@')) {
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }
    this.loading = true;
    this.auth.requestOtp(addr).subscribe({
      next: () => {
        this.loading = false;
        this.step = 'otp';
        this.otp = '';
        this.startResendCountdown(RESEND_COOLDOWN_SECONDS);
        this.cdr.markForCheck();
      },
      error: (err) => this.onCodeError(err),
    });
  }

  verifyCode(): void {
    const code = this.otp.trim();
    if (!/^\d{6}$/.test(code)) {
      this.errorMessage = 'Enter the 6-digit code from your email.';
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    this.auth.verifyOtp(this.email.trim().toLowerCase(), code).subscribe({
      next: (res) => {
        this.loading = false;
        if (res?.token) {
          this.clearResendTimer();
          this.router.navigate(['/auditor/audits'], { replaceUrl: true });
        } else {
          this.errorMessage = res?.message || 'Verification failed.';
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Could not verify code.';
        this.cdr.markForCheck();
      },
    });
  }

  resendCode(): void {
    if (this.resendCountdown > 0 || this.loading) return;
    this.requestCode();
  }

  backToIdentifier(): void {
    this.step = 'identifier';
    this.otp = '';
    this.errorMessage = '';
    this.clearResendTimer();
  }

  onOtpInput(value: string): void {
    this.otp = (value || '').replace(/\D/g, '').slice(0, 6);
  }

  private onCodeError(err: any): void {
    this.loading = false;
    if (err?.status === 429) {
      const retryAfter = Number(err?.headers?.get?.('Retry-After')) || RESEND_COOLDOWN_SECONDS;
      this.errorMessage = `Please wait ${retryAfter}s before requesting another code.`;
    } else {
      this.errorMessage = err?.error?.message || 'Could not send code. Check your connection.';
    }
    this.cdr.markForCheck();
  }

  private startResendCountdown(seconds: number): void {
    this.clearResendTimer();
    this.resendCountdown = seconds;
    this.resendIntervalId = setInterval(() => {
      this.resendCountdown -= 1;
      if (this.resendCountdown <= 0) this.clearResendTimer();
      this.cdr.markForCheck();
    }, 1000);
  }

  private clearResendTimer(): void {
    if (this.resendIntervalId !== null) {
      clearInterval(this.resendIntervalId);
      this.resendIntervalId = null;
    }
    this.resendCountdown = 0;
  }
}
