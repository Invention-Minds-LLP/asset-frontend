import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { InputSwitchModule } from 'primeng/inputswitch';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TrialService } from '../../services/trial/trial';

/**
 * Demo trial console. Deliberately NOT behind authGuard: it authenticates with
 * the TRIAL_ADMIN_KEY header alone, so we can still extend or revoke a demo after
 * the trial has expired and normal logins have stopped working.
 */
@Component({
  selector: 'app-trial-admin',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TableModule, TagModule, ToastModule,
    InputTextModule, InputSwitchModule, SelectModule, DatePickerModule, ConfirmDialogModule,
  ],
  templateUrl: './trial-admin.html',
  styleUrl: './trial-admin.css',
  providers: [MessageService, ConfirmationService],
})
export class TrialAdmin implements OnInit {
  keyInput = '';
  unlocked = false;
  loading = false;
  saving = false;

  enabled = false;
  license: any = null;
  status: any = null;
  activeSessions = 0;

  violations: any[] = [];
  logins: any[] = [];
  tab: 'violations' | 'logins' = 'violations';

  // Edit form
  form = {
    clientName: '',
    expiresAt: null as Date | null,
    singleSession: true,
    allowedEmployeeIds: '',
    ipMode: 'ALERT',
    allowedIps: '',
    notes: '',
  };

  readonly ipModes = [
    { label: 'Off — do not track IP', value: 'OFF' },
    { label: 'Alert — allow, but flag new IPs (recommended)', value: 'ALERT' },
    { label: 'Lock to first IP — block any other address', value: 'LOCK_FIRST' },
    { label: 'Allowlist — only the addresses below', value: 'ALLOWLIST' },
  ];

  constructor(
    private svc: TrialService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (this.svc.getAdminKey()) {
      this.unlocked = true;
      this.load();
    }
  }

  unlock() {
    const key = this.keyInput.trim();
    if (!key) return;
    this.svc.setAdminKey(key);
    this.unlocked = true;
    this.keyInput = '';
    this.load();
  }

  lock() {
    this.svc.clearAdminKey();
    this.unlocked = false;
    this.license = null;
    this.status = null;
    this.violations = [];
    this.logins = [];
    this.cdr.detectChanges();
  }

  load() {
    this.loading = true;
    this.cdr.detectChanges();

    this.svc.get().subscribe({
      next: (res) => {
        this.enabled = !!res.enabled;
        this.license = res.license;
        this.status = res.status;
        this.activeSessions = res.activeSessions ?? 0;
        this.applyToForm();
        this.loading = false;
        this.cdr.detectChanges();
        this.loadLog();
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 401) {
          this.svc.clearAdminKey();
          this.unlocked = false;
          this.toastError('That admin key was not accepted.');
        } else if (err.status === 503) {
          this.toastError('TRIAL_ADMIN_KEY is not set on this instance.');
        } else {
          this.toastError(err.error?.message || 'Could not load the trial licence.');
        }
        this.cdr.detectChanges();
      },
    });
  }

  loadLog() {
    this.svc.violations(200).subscribe({
      next: (res) => { this.violations = res.violations ?? []; this.cdr.detectChanges(); },
      error: () => {},
    });
    this.svc.logins(200).subscribe({
      next: (res) => { this.logins = res.logins ?? []; this.cdr.detectChanges(); },
      error: () => {},
    });
  }

  private applyToForm() {
    const l = this.license;
    this.form = {
      clientName: l?.clientName ?? '',
      expiresAt: l?.expiresAt ? new Date(l.expiresAt) : null,
      singleSession: l?.singleSession ?? true,
      allowedEmployeeIds: (l?.allowedEmployeeIds ?? []).join(', '),
      ipMode: l?.ipMode ?? 'ALERT',
      allowedIps: (l?.allowedIps ?? []).join(', '),
      notes: l?.notes ?? '',
    };
  }

  private splitList(value: string): string[] {
    return value.split(',').map((s) => s.trim()).filter(Boolean);
  }

  save() {
    if (!this.form.clientName.trim()) {
      this.toastError('Client name is required.');
      return;
    }
    if (!this.form.expiresAt) {
      this.toastError('An expiry date is required.');
      return;
    }

    this.saving = true;
    this.cdr.detectChanges();

    this.svc.save({
      clientName: this.form.clientName.trim(),
      expiresAt: this.form.expiresAt.toISOString(),
      singleSession: this.form.singleSession,
      allowedEmployeeIds: this.splitList(this.form.allowedEmployeeIds),
      ipMode: this.form.ipMode,
      allowedIps: this.splitList(this.form.allowedIps),
      notes: this.form.notes,
    }).subscribe({
      next: () => {
        this.saving = false;
        this.toastOk('Trial licence saved.');
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.toastError(err.error?.message || 'Save failed.');
        this.cdr.detectChanges();
      },
    });
  }

  extend(days: number) {
    this.svc.extend(days).subscribe({
      next: (res) => { this.toastOk(res.message); this.load(); },
      error: (err) => this.toastError(err.error?.message || 'Extend failed.'),
    });
  }

  revoke() {
    this.confirmationService.confirm({
      header: 'Revoke demo access',
      message: 'This locks the client out immediately and ends every live session. Continue?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Revoke now',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.svc.revoke().subscribe({
          next: (res) => { this.toastOk(`${res.message} — ${res.sessionsEnded} session(s) ended.`); this.load(); },
          error: (err) => this.toastError(err.error?.message || 'Revoke failed.'),
        });
      },
    });
  }

  reactivate() {
    this.svc.reactivate().subscribe({
      next: (res) => { this.toastOk(res.message); this.load(); },
      error: (err) => this.toastError(err.error?.message || 'Reactivate failed.'),
    });
  }

  resetIp() {
    this.svc.resetLockedIp().subscribe({
      next: (res) => { this.toastOk(res.message); this.load(); },
      error: (err) => this.toastError(err.error?.message || 'Could not clear the bound IP.'),
    });
  }

  endSessions() {
    this.svc.endSessions().subscribe({
      next: (res) => { this.toastOk(`${res.sessionsEnded} session(s) ended.`); this.load(); },
      error: (err) => this.toastError(err.error?.message || 'Could not end sessions.'),
    });
  }

  // ── display helpers ──

  get expired(): boolean {
    return !!this.status && this.status.trial && !this.status.active;
  }

  timeLeft(): string {
    if (!this.status?.trial) return '—';
    if (!this.status.active) return 'ENDED';
    const d = this.status.daysLeft ?? 0;
    const h = this.status.hoursLeft ?? 0;
    if (h < 48) return `${h} hour${h === 1 ? '' : 's'} left`;
    return `${d} day${d === 1 ? '' : 's'} left`;
  }

  reasonLabel(reason: string): string {
    switch (reason) {
      case 'EXPIRED': return 'Blocked — trial expired';
      case 'REVOKED': return 'Blocked — access revoked';
      case 'IP_BLOCKED': return 'Blocked — IP not allowed';
      case 'NEW_IP': return 'New IP address';
      case 'USER_NOT_ALLOWED': return 'Blocked — user not permitted';
      case 'SESSION_TAKEOVER': return 'Second device — previous session ended';
      default: return reason;
    }
  }

  reasonSeverity(reason: string): 'danger' | 'warn' | 'info' {
    if (reason === 'NEW_IP') return 'warn';
    if (reason === 'SESSION_TAKEOVER') return 'warn';
    return 'danger';
  }

  private toastOk(detail: string) {
    this.messageService.add({ severity: 'success', summary: 'Done', detail });
  }

  private toastError(detail: string) {
    this.messageService.add({ severity: 'error', summary: 'Error', detail });
  }
}
