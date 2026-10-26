import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { FyCloseService } from '../../services/fy-close/fy-close';

/**
 * Financial Year Close — Finance submits a year, the CFO finalizes or rejects.
 * Submitting locks the year; finalizing freezes its Fixed Assets Schedule. The
 * CFO can undo a finalization within 24 hours (the year goes back to Finance);
 * after that it is permanent.
 */
@Component({
  selector: 'app-fy-close',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TableModule, TagModule, ToastModule,
    DialogModule, TextareaModule, ProgressSpinnerModule,
  ],
  templateUrl: './fy-close.html',
  // Shares the Depreciation Audit page's look — the two screens sit side by side.
  styleUrls: ['../depreciation-audit/depreciation-audit.css', './fy-close.css'],
  providers: [MessageService],
})
export class FyClose implements OnInit {
  role = '';
  loading = false;
  years: any[] = [];

  // Preview dialog
  previewVisible = false;
  previewLoading = false;
  previewData: any = null;

  // Action dialog (submit / approve / reject / undo share one dialog)
  actionVisible = false;
  actionMode: 'submit' | 'approve' | 'reject' | 'undo' = 'submit';
  actionYear: any = null;
  actionText = '';
  acting = false;

  constructor(
    private svc: FyCloseService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.role = localStorage.getItem('role') || '';
    this.load();
  }

  get isFinance(): boolean { return this.role === 'FINANCE'; }
  get isCfo(): boolean { return this.role === 'CFO'; }

  load() {
    this.loading = true;
    this.svc.listYears().subscribe({
      next: (res) => { this.years = res.years || []; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.toast('error', 'Failed to load financial years'); this.cdr.detectChanges(); },
    });
  }

  // ── Row rules ──────────────────────────────────────────────────────────────
  canSubmit(y: any): boolean {
    return this.isFinance && y.ended && (y.status === 'OPEN' || y.status === 'REJECTED');
  }
  canCfoAct(y: any): boolean {
    return this.isCfo && y.status === 'PENDING_CFO';
  }

  /** The server sends undoUntil only while the 24-hour window is open. */
  inUndoWindow(y: any): boolean {
    return y.status === 'FINALIZED' && !!y.undoUntil && new Date(y.undoUntil).getTime() > Date.now();
  }
  canUndo(y: any): boolean {
    return this.isCfo && this.inUndoWindow(y);
  }

  statusLabel(y: any): string {
    switch (y.status) {
      case 'FINALIZED': return 'Finalized';
      case 'PENDING_CFO': return 'Awaiting CFO';
      // A year sent back by an undo reads differently from a plain rejection.
      case 'REJECTED': return y.undoneAt ? 'Undone by CFO' : 'Rejected';
      default: return 'Open';
    }
  }
  statusSeverity(s: string): 'success' | 'warn' | 'danger' | 'secondary' {
    switch (s) {
      case 'FINALIZED': return 'success';
      case 'PENDING_CFO': return 'warn';
      case 'REJECTED': return 'danger';
      default: return 'secondary';
    }
  }

  // ── Preview ────────────────────────────────────────────────────────────────
  openPreview(y: any) {
    this.previewVisible = true;
    this.previewLoading = true;
    this.previewData = null;
    this.svc.preview(y.fiscalYear).subscribe({
      next: (res) => { this.previewData = res; this.previewLoading = false; this.cdr.detectChanges(); },
      error: (e) => {
        this.previewLoading = false;
        this.toast('error', e?.error?.message || 'Failed to load the year preview');
        this.cdr.detectChanges();
      },
    });
  }

  // ── Submit / approve / reject ──────────────────────────────────────────────
  openAction(mode: 'submit' | 'approve' | 'reject' | 'undo', y: any) {
    this.actionMode = mode;
    this.actionYear = y;
    this.actionText = '';
    this.actionVisible = true;
  }

  get actionTitle(): string {
    const fy = this.actionYear?.fyLabel ?? '';
    return this.actionMode === 'submit' ? `Submit ${fy} for finalization`
      : this.actionMode === 'approve' ? `Finalize ${fy}`
      : this.actionMode === 'undo' ? `Undo finalization of ${fy}`
      : `Reject finalization of ${fy}`;
  }

  get needsReason(): boolean { return this.actionMode === 'reject' || this.actionMode === 'undo'; }

  confirmAction() {
    if (!this.actionYear) return;
    if (this.needsReason && !this.actionText.trim()) {
      this.toast('warn', 'A reason is required.');
      return;
    }
    const fy = this.actionYear.fiscalYear;
    const text = this.actionText.trim() || undefined;
    const call = this.actionMode === 'submit' ? this.svc.submit(fy, text)
      : this.actionMode === 'approve' ? this.svc.approve(fy, text)
      : this.actionMode === 'undo' ? this.svc.undo(fy, this.actionText.trim())
      : this.svc.reject(fy, this.actionText.trim());

    this.acting = true;
    call.subscribe({
      next: (res) => {
        this.acting = false;
        this.actionVisible = false;
        this.toast('success', res?.message || 'Done');
        this.load();
      },
      error: (e) => {
        this.acting = false;
        this.toast('error', e?.error?.message || 'Action failed');
        this.cdr.detectChanges();
      },
    });
  }

  formatCurrency(value: any): string {
    if (value === null || value === undefined || value === '') return '—';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value));
  }

  toast(severity: string, detail: string) {
    this.messageService.add({ severity, summary: severity === 'error' ? 'Error' : 'Info', detail, life: 4500 });
  }
}
