import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { ReconciliationService } from '../../services/reconciliation/reconciliation';

@Component({
  selector: 'app-reconciliation',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, DialogModule,
    InputTextModule, SelectModule, FloatLabelModule, DatePickerModule,
    TagModule, ToastModule, TextareaModule, TooltipModule, CheckboxModule,
  ],
  providers: [MessageService],
  templateUrl: './reconciliation.html',
  styleUrl: './reconciliation.css',
})
export class Reconciliation implements OnInit {
  snapshots: any[] = [];
  total = 0;
  loading = false;
  page = 1;

  filters: any = { asOf: null, scope: '', status: '', flaggedOnly: false };

  scopeOptions = [
    { label: 'All Scopes', value: '' },
    { label: 'Asset', value: 'ASSET' },
    { label: 'Category', value: 'CATEGORY' },
    { label: 'Pool', value: 'POOL' },
  ];

  statusOptions = [
    { label: 'All Status', value: '' },
    { label: 'Open', value: 'OPEN' },
    { label: 'Resolved', value: 'RESOLVED' },
    { label: 'Accepted (with variance)', value: 'ACCEPTED' },
  ];

  // Run dialog
  showRunDialog = false;
  runForm: any = { asOfDate: null, scope: 'CATEGORY' };
  running = false;

  // Detail dialog
  showDetailDialog = false;
  selectedSnapshot: any = null;
  drilldown: any[] = [];

  // Resolve dialog
  showResolveDialog = false;
  resolveForm: any = { status: 'RESOLVED', resolutionNotes: '' };

  constructor(
    private svc: ReconciliationService,
    private msg: MessageService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    const f = { ...this.filters, page: this.page, limit: 50 };
    if (f.asOf) f.asOf = new Date(f.asOf).toISOString().split('T')[0];
    this.svc.list(f).subscribe({
      next: (res: any) => {
        this.snapshots = res.data || [];
        this.total = res.pagination?.total || 0;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });
  }

  openRun() {
    this.runForm = { asOfDate: this._lastFYEnd(), scope: 'CATEGORY' };
    this.showRunDialog = true;
  }

  submitRun() {
    if (!this.runForm.asOfDate || !this.runForm.scope) {
      this.msg.add({ severity: 'warn', summary: 'Missing', detail: 'asOfDate + scope required' });
      return;
    }
    this.running = true;
    this.svc.run(this.runForm).subscribe({
      next: (res: any) => {
        this.running = false;
        this.showRunDialog = false;
        this.msg.add({
          severity: 'success', summary: 'Snapshot generated',
          detail: `${res.total} snapshots, ${res.flagged} variances flagged`,
        });
        this.load();
      },
      error: (e) => {
        this.running = false;
        this.msg.add({ severity: 'error', summary: 'Failed', detail: e?.error?.message });
      },
    });
  }

  viewDetail(row: any) {
    this.svc.detail(row.id).subscribe({
      next: (res: any) => {
        this.selectedSnapshot = res.snapshot;
        this.drilldown = res.drilldown || [];
        this.showDetailDialog = true;
      },
    });
  }

  openResolve(row: any) {
    this.selectedSnapshot = row;
    this.resolveForm = { status: 'RESOLVED', resolutionNotes: '' };
    this.showResolveDialog = true;
  }

  submitResolve() {
    this.svc.resolve(this.selectedSnapshot.id, this.resolveForm).subscribe({
      next: () => {
        this.showResolveDialog = false;
        this.msg.add({ severity: 'success', summary: 'Marked', detail: this.resolveForm.status });
        this.load();
      },
      error: (e) => this.msg.add({ severity: 'error', summary: 'Failed', detail: e?.error?.message }),
    });
  }

  exportSnapshot(row: any) {
    window.open(this.svc.exportUrl(row.id), '_blank');
  }

  statusSeverity(status: string): 'success' | 'warn' | 'info' | 'danger' | 'secondary' {
    return status === 'RESOLVED' ? 'success'
         : status === 'ACCEPTED' ? 'info'
         : 'warn';
  }

  fmt(v: any): string {
    if (v == null || v === '') return '—';
    return Number(v).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  isPositive(v: any): boolean { return v != null && Number(v) > 0; }
  isNegative(v: any): boolean { return v != null && Number(v) < 0; }

  private _lastFYEnd(): Date {
    const today = new Date();
    const m = today.getMonth();
    const y = today.getFullYear();
    // Last completed FY ends Mar 31 of previous calendar year (if today < Apr 1) or current year (if today >= Apr 1)
    const fyEndYear = m >= 3 ? y : y - 1;
    return new Date(fyEndYear, 2, 31); // Mar = 2
  }
}
