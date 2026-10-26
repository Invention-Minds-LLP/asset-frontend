import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { TabViewModule } from 'primeng/tabview';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { ReclassificationService } from '../../services/reclassification/reclassification';
import { Assets } from '../../services/assets/assets';

/**
 * Asset Reclassification — correct assets' category (and depreciation
 * settings) from 1 April of the current year. Past years never change: the
 * previous year must be finalized first, and this year opens from its frozen
 * closing value. Finance/CFO raise; the CFO (not the requester) approves.
 */
@Component({
  selector: 'app-reclassification',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TableModule, TagModule, ToastModule, DialogModule,
    SelectModule, InputTextModule, InputNumberModule, TextareaModule, CheckboxModule, TabViewModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './reclassification.html',
  styleUrls: ['../depreciation-audit/depreciation-audit.css', './reclassification.css'],
  providers: [MessageService],
})
export class Reclassification implements OnInit {
  role = '';
  myEmployeeId: number | null = null;
  activeTab = 0;

  categories: any[] = [];
  methodOptions = [
    { label: 'Written Down Value (DB)', value: 'DB' },
    { label: 'Straight Line (SL)', value: 'SL' },
  ];

  // ── New request ──
  fromCategoryId: number | null = null;
  search = '';
  candidates: any[] = [];
  candidatesLoading = false;
  selected: any[] = [];

  toCategoryId: number | null = null;
  applyDepreciation = true;
  newMethod: string | null = null;
  newRate: number | null = null;
  newLifeYears: number | null = null;
  reason = '';

  preview: any = null;
  previewLoading = false;
  submitting = false;

  // ── Requests ──
  requests: any[] = [];
  requestsLoading = false;

  detailVisible = false;
  detail: any = null;
  detailLoading = false;

  actionVisible = false;
  actionMode: 'approve' | 'reject' = 'approve';
  actionTarget: any = null;
  actionText = '';
  acting = false;
  retryingGl = false;

  constructor(
    private svc: ReclassificationService,
    private assetsService: Assets,
    private route: ActivatedRoute,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.role = localStorage.getItem('role') || '';
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    this.myEmployeeId = user?.employeeDbId ?? null;
    if (!this.canRaise) this.activeTab = 1;

    this.assetsService.getCategories().subscribe({
      next: (c: any[]) => { this.categories = c || []; this.cdr.detectChanges(); },
      error: () => this.toast('error', 'Failed to load categories'),
    });
    this.loadRequests();

    // Arriving from an asset ("Reclassify" on the asset form): preselect it.
    const assetId = Number(this.route.snapshot.queryParamMap.get('assetId'));
    if (assetId && this.canRaise) {
      this.svc.candidates({ assetId }).subscribe({
        next: (rows) => {
          const a = rows?.[0];
          if (!a) return;
          this.fromCategoryId = a.category?.id ?? null;
          this.candidates = rows;
          this.selected = a.blockedReason ? [] : [a];
          if (a.blockedReason) this.toast('warn', `${a.assetCode} can't be reclassified now: ${a.blockedReason}`);
          this.cdr.detectChanges();
        },
      });
    }
  }

  get canRaise(): boolean { return this.role === 'FINANCE' || this.role === 'CFO'; }
  get isCfo(): boolean { return this.role === 'CFO'; }

  get toCategoryOptions(): any[] {
    return this.categories.filter((c) => c.id !== this.fromCategoryId);
  }

  // ── Picking assets ─────────────────────────────────────────────────────────
  loadCandidates() {
    this.preview = null;
    if (!this.fromCategoryId) { this.candidates = []; this.selected = []; return; }
    this.candidatesLoading = true;
    this.svc.candidates({ categoryId: this.fromCategoryId, search: this.search.trim() || undefined }).subscribe({
      next: (rows) => {
        this.candidates = rows || [];
        // Keep only selections still in the list (and still pickable).
        const ids = new Set(this.candidates.filter((c) => !c.blockedReason).map((c) => c.id));
        this.selected = this.selected.filter((s) => ids.has(s.id));
        this.candidatesLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.candidatesLoading = false; this.toast('error', 'Failed to load assets'); this.cdr.detectChanges(); },
    });
  }

  onToCategoryChange() {
    this.preview = null;
    const cat = this.categories.find((c) => c.id === this.toCategoryId);
    // Start from the new category's defaults; Finance can adjust them.
    this.newMethod = cat?.defaultDepreciationMethod ?? null;
    this.newRate = cat?.defaultDepreciationRate != null ? Number(cat.defaultDepreciationRate) : null;
    this.newLifeYears = cat?.defaultLifeYears ?? null;
  }

  onSelectionChange() {
    // The header checkbox selects every row; blocked ones can't be included.
    const before = this.selected.length;
    this.selected = this.selected.filter((s) => !s.blockedReason);
    if (this.selected.length < before) this.cdr.detectChanges();
    this.preview = null;
  }

  get blockedCount(): number { return this.candidates.filter((c) => c.blockedReason).length; }

  // ── Preview & submit ───────────────────────────────────────────────────────
  get canPreview(): boolean { return this.selected.length > 0 && !!this.toCategoryId; }

  runPreview() {
    if (!this.canPreview) return;
    this.previewLoading = true;
    this.svc.preview({
      assetIds: this.selected.map((s) => s.id),
      toCategoryId: this.toCategoryId!,
      applyDepreciation: this.applyDepreciation,
      newMethod: this.applyDepreciation ? this.newMethod : null,
      newRate: this.applyDepreciation ? this.newRate : null,
      newLifeYears: this.applyDepreciation ? this.newLifeYears : null,
    }).subscribe({
      next: (res) => { this.preview = res; this.previewLoading = false; this.cdr.detectChanges(); },
      error: (e) => { this.previewLoading = false; this.toast('error', e?.error?.message || 'Preview failed'); this.cdr.detectChanges(); },
    });
  }

  get canSubmit(): boolean {
    return !!this.preview && this.preview.errors?.length === 0 && this.preview.lines?.length > 0 && !!this.reason.trim();
  }

  submit() {
    if (!this.canSubmit) return;
    this.submitting = true;
    this.svc.create({
      assetIds: this.selected.map((s) => s.id),
      toCategoryId: this.toCategoryId,
      reason: this.reason.trim(),
      applyDepreciation: this.applyDepreciation,
      newMethod: this.applyDepreciation ? this.newMethod : null,
      newRate: this.applyDepreciation ? this.newRate : null,
      newLifeYears: this.applyDepreciation ? this.newLifeYears : null,
    }).subscribe({
      next: (res) => {
        this.submitting = false;
        this.toast('success', res?.message || 'Sent to the CFO');
        this.selected = [];
        this.preview = null;
        this.reason = '';
        this.loadCandidates();
        this.loadRequests();
        this.activeTab = 1;
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.submitting = false;
        this.toast('error', e?.error?.message || 'Failed to raise the request');
        // Show which assets failed, if the server said.
        if (e?.error?.errors && this.preview) this.preview = { ...this.preview, errors: e.error.errors };
        this.cdr.detectChanges();
      },
    });
  }

  // ── Requests ───────────────────────────────────────────────────────────────
  loadRequests() {
    this.requestsLoading = true;
    this.svc.list().subscribe({
      next: (rows) => { this.requests = rows || []; this.requestsLoading = false; this.cdr.detectChanges(); },
      error: () => { this.requestsLoading = false; this.toast('error', 'Failed to load requests'); this.cdr.detectChanges(); },
    });
  }

  view(r: any) {
    this.detailVisible = true;
    this.detailLoading = true;
    this.detail = null;
    this.svc.get(r.id).subscribe({
      next: (res) => { this.detail = res; this.detailLoading = false; this.cdr.detectChanges(); },
      error: () => { this.detailLoading = false; this.toast('error', 'Failed to load the request'); this.cdr.detectChanges(); },
    });
  }

  canDecide(r: any): boolean {
    return this.isCfo && r.status === 'PENDING_CFO' && r.requestedBy?.id !== this.myEmployeeId;
  }
  canCancel(r: any): boolean {
    return r.status === 'PENDING_CFO' && (r.requestedBy?.id === this.myEmployeeId || this.role === 'ADMIN');
  }

  openAction(mode: 'approve' | 'reject', r: any) {
    this.actionMode = mode;
    this.actionTarget = r;
    this.actionText = '';
    this.actionVisible = true;
  }

  confirmAction() {
    if (!this.actionTarget) return;
    if (this.actionMode === 'reject' && !this.actionText.trim()) { this.toast('warn', 'A reason is required to reject.'); return; }
    const call = this.actionMode === 'approve'
      ? this.svc.approve(this.actionTarget.id, this.actionText.trim() || undefined)
      : this.svc.reject(this.actionTarget.id, this.actionText.trim());
    this.acting = true;
    call.subscribe({
      next: (res) => {
        this.acting = false;
        this.actionVisible = false;
        this.toast('success', res?.message || 'Done');
        this.loadRequests();
      },
      error: (e) => {
        this.acting = false;
        const extra = e?.error?.errors?.length ? ` (${e.error.errors.map((x: any) => x.assetCode || x.assetId).join(', ')})` : '';
        this.toast('error', (e?.error?.message || 'Action failed') + extra);
        this.cdr.detectChanges();
      },
    });
  }

  /** Approved, but the GL entry never made it — Finance/CFO can re-try. */
  canRetryGl(r: any): boolean {
    return this.canRaise && r?.status === 'APPROVED' && [null, undefined, 'NO_GL_MAPPING', 'AUTO_VOUCHER_OFF', 'NOT_CREATED'].includes(r.glStatus);
  }

  retryGl(r: any) {
    this.retryingGl = true;
    this.svc.postGl(r.id).subscribe({
      next: (res) => {
        this.retryingGl = false;
        const ok = res?.glStatus === 'POSTED' || res?.glStatus === 'DRAFTED';
        this.toast(ok ? 'success' : 'warn', res?.message || 'Done');
        if (this.detail?.id === r.id) this.view(r);
        this.loadRequests();
      },
      error: (e) => { this.retryingGl = false; this.toast('error', e?.error?.message || 'Failed to post the GL entry'); this.cdr.detectChanges(); },
    });
  }

  cancel(r: any) {
    this.svc.cancel(r.id).subscribe({
      next: (res) => { this.toast('success', res?.message || 'Cancelled'); this.loadRequests(); },
      error: (e) => this.toast('error', e?.error?.message || 'Failed to cancel'),
    });
  }

  // ── Display helpers ────────────────────────────────────────────────────────
  statusLabel(s: string): string {
    switch (s) {
      case 'PENDING_CFO': return 'Awaiting CFO';
      case 'APPROVED': return 'Applied';
      case 'REJECTED': return 'Rejected';
      case 'CANCELLED': return 'Cancelled';
      default: return s;
    }
  }
  statusSeverity(s: string): 'success' | 'warn' | 'danger' | 'secondary' {
    switch (s) {
      case 'APPROVED': return 'success';
      case 'PENDING_CFO': return 'warn';
      case 'REJECTED': return 'danger';
      default: return 'secondary';
    }
  }
  glLabel(s: string | null): string {
    switch (s) {
      case 'POSTED': return 'GL entry posted';
      case 'DRAFTED': return 'GL draft — awaiting approval';
      case 'NOT_CREATED': return 'GL entry not created';
      case 'NO_GL_MAPPING': return 'No GL mapping';
      case 'AUTO_VOUCHER_OFF': return 'Auto voucher off';
      case 'NOTHING_TO_MOVE': return 'Nothing to move';
      default: return '—';
    }
  }
  sourceLabel(s: string): string {
    switch (s) {
      case 'FINALIZED_YEAR': return 'Frozen closing';
      case 'PRIOR_LOG': return 'Booked history';
      case 'MIGRATION': return 'Migration opening';
      case 'PURCHASE_COST': return 'Cost (acquired this year)';
      default: return s || '—';
    }
  }
  settingsText(method: any, rate: any, life: any): string {
    const parts: string[] = [];
    if (method) parts.push(method);
    if (rate != null) parts.push(`${Number(rate)}%`);
    if (life != null) parts.push(`${life} yrs`);
    return parts.join(' · ') || '—';
  }

  formatCurrency(value: any): string {
    if (value === null || value === undefined || value === '') return '—';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value));
  }

  toast(severity: string, detail: string) {
    this.messageService.add({ severity, summary: severity === 'error' ? 'Error' : 'Info', detail, life: 5000 });
  }
}
