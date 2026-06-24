import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { DepreciationAuditService } from '../../services/depreciation-audit/depreciation-audit';

@Component({
  selector: 'app-depreciation-audit',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TableModule, TagModule, SelectModule,
    ToastModule, DialogModule, InputTextModule, TextareaModule, ProgressSpinnerModule,
  ],
  templateUrl: './depreciation-audit.html',
  styleUrl: './depreciation-audit.css',
  providers: [MessageService],
})
export class DepreciationAudit implements OnInit {
  role = '';
  loading = false;

  audits: any[] = [];
  yearOptions: { label: string; value: number }[] = [];

  // Create form (FINANCE)
  newFiscalYear: number | null = null;
  newNotes = '';
  creating = false;

  // Preview of the selected FY (assets + depreciation) shown before initiating.
  preview: any = null;
  previewLoading = false;
  showBreakdown = false;

  // Reject dialog (CFO)
  rejectVisible = false;
  rejectReason = '';
  rejectTarget: any = null;

  // Details dialog (any approver: review assets + depreciation before approving)
  detailVisible = false;
  detailLoading = false;
  detailData: any = null;
  detailFyLabel = '';

  constructor(
    private svc: DepreciationAuditService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.role = localStorage.getItem('role') || '';
    this.loadAudits();
    if (this.isFinance) this.loadYears();
  }

  get isFinance(): boolean { return this.role === 'FINANCE'; }
  get isCfo(): boolean { return this.role === 'CFO'; }

  loadAudits() {
    this.loading = true;
    this.svc.getAudits().subscribe({
      next: (res) => { this.audits = res || []; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.toast('error', 'Failed to load audits'); },
    });
  }

  loadYears() {
    this.svc.getAuditableYears().subscribe({
      next: (res) => {
        this.yearOptions = (res.years || []).map((y) => ({ label: y.label, value: y.fiscalYear }));
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  // Finance picks an FY → fetch the position so they can review before initiating.
  onYearChange() {
    this.preview = null;
    this.showBreakdown = false;
    if (!this.newFiscalYear) return;
    this.previewLoading = true;
    this.svc.getPreview(this.newFiscalYear).subscribe({
      next: (res) => { this.preview = res; this.previewLoading = false; this.cdr.detectChanges(); },
      error: () => { this.previewLoading = false; this.toast('error', 'Failed to load year preview'); },
    });
  }

  createAudit() {
    if (!this.newFiscalYear) { this.toast('warn', 'Select a financial year'); return; }
    if (this.preview?.alreadyExists) { this.toast('warn', 'An audit already exists for this year'); return; }
    this.creating = true;
    this.svc.createAudit({ fiscalYear: this.newFiscalYear, notes: this.newNotes || undefined }).subscribe({
      next: () => {
        this.creating = false;
        this.newFiscalYear = null;
        this.newNotes = '';
        this.preview = null;
        this.showBreakdown = false;
        this.toast('success', 'Audit initiated and approved by Finance. Awaiting CFO and External CA.');
        this.loadAudits();
        this.loadYears();
      },
      error: (e) => {
        this.creating = false;
        this.toast('error', e?.error?.message || 'Failed to create audit');
      },
    });
  }

  // Open the per-asset depreciation detail for a row so the approver can verify.
  viewDetails(a: any) {
    this.detailVisible = true;
    this.detailLoading = true;
    this.detailData = null;
    this.detailFyLabel = a.fyLabel;
    this.svc.getPreview(a.fiscalYear).subscribe({
      next: (res) => { this.detailData = res; this.detailLoading = false; this.cdr.detectChanges(); },
      error: () => { this.detailLoading = false; this.toast('error', 'Failed to load details'); },
    });
  }

  approve(a: any) {
    this.svc.cfoApprove(a.id).subscribe({
      next: () => { this.toast('success', 'CFO approval recorded'); this.loadAudits(); },
      error: (e) => this.toast('error', e?.error?.message || 'Failed to approve'),
    });
  }

  openReject(a: any) {
    this.rejectTarget = a;
    this.rejectReason = '';
    this.rejectVisible = true;
  }

  confirmReject() {
    if (!this.rejectTarget) return;
    this.svc.cfoReject(this.rejectTarget.id, this.rejectReason).subscribe({
      next: () => {
        this.rejectVisible = false;
        this.toast('success', 'Audit rejected');
        this.loadAudits();
      },
      error: (e) => this.toast('error', e?.error?.message || 'Failed to reject'),
    });
  }

  statusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'AUDITED': return 'success';
      case 'PENDING': return 'warn';
      case 'REJECTED': return 'danger';
      default: return 'secondary';
    }
  }

  // CFO can act only while pending and not yet CFO-approved.
  canCfoAct(a: any): boolean {
    return this.isCfo && a.status === 'PENDING' && !a.cfoApprovedAt;
  }

  formatCurrency(value: number): string {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  }

  toast(severity: string, detail: string) {
    this.messageService.add({ severity, summary: severity === 'error' ? 'Error' : 'Info', detail, life: 3500 });
  }
}
