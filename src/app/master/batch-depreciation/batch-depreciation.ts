import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TabViewModule } from 'primeng/tabview';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { DropdownModule } from 'primeng/dropdown';
import { SelectModule } from 'primeng/select';
import { DepreciationService } from '../../services/depreciation/depreciation';
import { Assets } from '../../services/assets/assets';

@Component({
  selector: 'app-batch-depreciation',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TableModule, TagModule,
    ToastModule, TabViewModule, ConfirmDialogModule, InputTextModule, TooltipModule, DropdownModule, SelectModule],
  templateUrl: './batch-depreciation.html',
  styleUrl: './batch-depreciation.css',
  providers: [MessageService, ConfirmationService]
})
export class BatchDepreciation implements OnInit {
  activeTab = 0;
  userRole = localStorage.getItem('role') || '';
  isFinance = this.userRole === 'FINANCE';

  // ── Batch Preview & Run ──────────────────────────────────────────────────────
  previewData: any[] = [];
  previewLoading = false;
  previewSummary: any = {};
  runningBatch = false;

  // Dropdown options
  departments: { label: string; value: number }[] = [];
  categories:  { label: string; value: number }[] = [];

  // Batch-level filters
  batchFilterDept: number | null = null;
  batchFilterCat:  number | null = null;

  // ── Batch Runs ───────────────────────────────────────────────────────────────
  batchRuns: any[] = [];
  batchRunsLoading = false;

  // Reject dialog
  showRejectDialog = false;
  rejectRunId: number | null = null;
  rejectReason = '';

  // ── Per-Asset Run ────────────────────────────────────────────────────────────
  depreciableAssets: any[] = [];
  depreciableLoading = false;
  assetFilterDept: number | null = null;
  assetFilterCat:  number | null = null;
  assetFilterSearch = '';

  // Asset run confirm dialog
  assetRunTarget: any = null;
  showAssetRunDialog = false;
  assetRunForce = false;
  assetRunning = false;

  // ── Round-off Impact Analysis ─────────────────────────────────────────────
  impactData: any = null;
  impactLoading = false;

  // ── WDV Schedule ─────────────────────────────────────────────────────────────
  scheduleAssets: { label: string; value: number }[] = [];
  scheduleSelectedAssetId: number | null = null;
  scheduleData: any = null;
  scheduleLoading = false;

  // ── All Records & Logs ───────────────────────────────────────────────────────
  logs: any[] = [];
  logsLoading = false;
  depreciations: any[] = [];
  depreciationsLoading = false;

  constructor(
    private depService: DepreciationService,
    private assetsService: Assets,
    private messageService: MessageService,
    private confirmService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadDropdowns();
    if (this.isFinance) this.loadPreview();
    this.loadBatchRuns();
  }

  loadDropdowns() {
    this.assetsService.getDepartments().subscribe({
      next: (data: any[]) => {
        this.departments = [{ label: 'All Departments', value: null as any }, ...data.map(d => ({ label: d.name, value: d.id }))];
      }
    });
    this.assetsService.getCategories().subscribe({
      next: (data: any[]) => {
        this.categories = [{ label: 'All Categories', value: null as any }, ...data.map(c => ({ label: c.name, value: c.id }))];
      }
    });
  }

  onTabChange(event: any) {
    this.activeTab = event.index;
    if (event.index === 0 && this.isFinance && !this.previewData.length) this.loadPreview();
    if (event.index === 1 && !this.batchRuns.length) this.loadBatchRuns();
    if (event.index === 2 && !this.depreciableAssets.length) this.loadDepreciableAssets();
    if (event.index === 3 && !this.depreciations.length) this.loadAll();
    if (event.index === 4 && !this.logs.length) this.loadLogs();
    if (event.index === 5 && !this.impactData) this.loadImpact();
    if (event.index === 6 && !this.scheduleAssets.length) this.loadScheduleAssets();
  }

  // ── Batch Preview ────────────────────────────────────────────────────────────
  loadPreview() {
    this.previewLoading = true;
    const filters: any = {};
    if (this.batchFilterDept != null) filters.departmentId = this.batchFilterDept;
    if (this.batchFilterCat  != null) filters.categoryId   = this.batchFilterCat;
    this.depService.batchPreview(filters).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.previewData = res.preview || [];
          this.previewSummary = { totalDepreciation: res.totalDepreciation, count: this.previewData.length };
          this.previewLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err: any) => {
        setTimeout(() => {
          this.previewLoading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to load preview' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  confirmRunBatch() {
    const scope = this.batchFilterDept != null || this.batchFilterCat != null
      ? ' (filtered scope)'
      : ' for all eligible assets';
    this.confirmService.confirm({
      message: `Create a DRAFT batch run${scope} for ${this.previewData.length} assets? FINANCE must approve before values are committed.`,
      header: 'Create Batch Depreciation Draft',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Create Draft',
      rejectLabel: 'Cancel',
      accept: () => this.runBatch()
    });
  }

  runBatch() {
    this.runningBatch = true;
    const filters: any = {};
    if (this.batchFilterDept != null) filters.departmentId = this.batchFilterDept;
    if (this.batchFilterCat  != null) filters.categoryId   = this.batchFilterCat;
    this.depService.runBatch(filters).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.runningBatch = false;
          this.messageService.add({ severity: 'info', summary: 'Draft Created', detail: `${res.message} — ${res.runNumber}` });
          this.loadBatchRuns();
          this.loadPreview();
          this.cdr.detectChanges();
        });
      },
      error: (err: any) => {
        setTimeout(() => {
          this.runningBatch = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Batch run failed' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  // ── Batch Runs ───────────────────────────────────────────────────────────────
  loadBatchRuns() {
    this.batchRunsLoading = true;
    this.depService.getBatchRuns().subscribe({
      next: (res: any) => {
        setTimeout(() => { this.batchRuns = res.data || []; this.batchRunsLoading = false; this.cdr.detectChanges(); });
      },
      error: () => { setTimeout(() => { this.batchRunsLoading = false; this.cdr.detectChanges(); }); }
    });
  }

  confirmApprove(run: any) {
    this.confirmService.confirm({
      message: `Approve run ${run.runNumber}? This will commit depreciation for ${run.totalAssets} asset(s).`,
      header: 'Approve Batch Run',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Approve',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-success',
      accept: () => this.approveBatchRun(run.id)
    });
  }

  approveBatchRun(runId: number) {
    this.depService.approveBatchRun(runId).subscribe({
      next: (res: any) => {
        this.messageService.add({ severity: 'success', summary: 'Approved', detail: res.message });
        this.loadBatchRuns();
        this.loadPreview();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Approval failed' });
      }
    });
  }

  openRejectDialog(runId: number) { this.rejectRunId = runId; this.rejectReason = ''; this.showRejectDialog = true; }

  submitReject() {
    if (!this.rejectRunId) return;
    this.depService.rejectBatchRun(this.rejectRunId, this.rejectReason).subscribe({
      next: (res: any) => {
        this.showRejectDialog = false;
        this.messageService.add({ severity: 'warn', summary: 'Rejected', detail: res.message });
        this.loadBatchRuns();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Rejection failed' });
      }
    });
  }

  // ── Per-Asset Run ────────────────────────────────────────────────────────────
  loadDepreciableAssets() {
    this.depreciableLoading = true;
    const filters: any = {};
    if (this.assetFilterDept != null) filters.departmentId = this.assetFilterDept;
    if (this.assetFilterCat  != null) filters.categoryId   = this.assetFilterCat;
    if (this.assetFilterSearch) filters.search       = this.assetFilterSearch;
    this.depService.getDepreciableAssets(filters).subscribe({
      next: (res: any) => {
        setTimeout(() => { this.depreciableAssets = res.data || []; this.depreciableLoading = false; this.cdr.detectChanges(); });
      },
      error: () => { setTimeout(() => { this.depreciableLoading = false; this.cdr.detectChanges(); }); }
    });
  }

  openAssetRunDialog(asset: any) {
    this.assetRunTarget = asset;
    this.assetRunForce = false;
    this.showAssetRunDialog = true;
  }

  confirmAssetRun() {
    if (!this.assetRunTarget) return;
    this.assetRunning = true;
    this.depService.runAssetDepreciation(this.assetRunTarget.assetDbId, this.assetRunForce).subscribe({
      next: (res: any) => {
        this.assetRunning = false;
        this.showAssetRunDialog = false;
        if (res.eligible === false) {
          this.messageService.add({ severity: 'warn', summary: 'Not Eligible', detail: res.message });
        } else {
          this.messageService.add({ severity: 'info', summary: 'Draft Created', detail: `${res.runNumber} — ₹${Number(res.depreciationAmount).toLocaleString('en-IN')}${res.overridden ? ' (Override)' : ''}` });
          this.loadBatchRuns();
          this.loadDepreciableAssets();
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.assetRunning = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Run failed' });
        this.cdr.detectChanges();
      }
    });
  }

  getDueSeverity(asset: any): 'success' | 'warn' | 'danger' | 'secondary' {
    if (asset.isDue) return 'danger';
    if (asset.daysUntilDue <= 30) return 'warn';
    return 'secondary';
  }

  getDueLabel(asset: any): string {
    if (asset.isDue) return 'DUE NOW';
    if (asset.daysUntilDue === 1) return 'Due in 1 day';
    return `Due in ${asset.daysUntilDue}d`;
  }

  // ── All Records & Logs ───────────────────────────────────────────────────────
  loadAll() {
    this.depreciationsLoading = true;
    this.depService.getAll({ page: 1, limit: 100 }).subscribe({
      next: (res: any) => {
        setTimeout(() => { this.depreciations = res.data || res; this.depreciationsLoading = false; this.cdr.detectChanges(); });
      },
      error: () => { setTimeout(() => { this.depreciationsLoading = false; this.cdr.detectChanges(); }); }
    });
  }

  loadLogs() {
    this.logsLoading = true;
    this.depService.getLogs({ page: 1, limit: 100 }).subscribe({
      next: (res: any) => {
        setTimeout(() => { this.logs = res.data || res; this.logsLoading = false; this.cdr.detectChanges(); });
      },
      error: () => { setTimeout(() => { this.logsLoading = false; this.cdr.detectChanges(); }); }
    });
  }

  // ── Round-off Impact ─────────────────────────────────────────────────────────
  loadImpact() {
    this.impactLoading = true;
    this.depService.getRoundOffImpact().subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.impactData = res;
          this.impactLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err: any) => {
        setTimeout(() => {
          this.impactLoading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to load impact analysis' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  getDeltaSeverity(delta: number): 'danger' | 'success' | 'secondary' {
    if (delta > 0.005) return 'danger';   // rounds up — adds to total
    if (delta < -0.005) return 'success'; // rounds down — reduces total
    return 'secondary';                   // negligible
  }

  getRiskSeverity(risk: string): 'success' | 'warn' | 'danger' {
    if (risk === 'LOW')    return 'success';
    if (risk === 'MEDIUM') return 'warn';
    return 'danger';
  }

  formatDelta(delta: number): string {
    const sign = delta > 0 ? '+' : '';
    return `${sign}₹${Math.abs(delta).toFixed(4)}`;
  }

  // ── WDV Schedule ─────────────────────────────────────────────────────────────
  loadScheduleAssets() {
    this.assetsService.getAllAssetsForDropdown().subscribe({
      next: (data: any[]) => {
        this.scheduleAssets = data.map(a => ({ label: `${a.assetId} — ${a.assetName}`, value: a.id }));
        this.cdr.detectChanges();
      }
    });
  }

  loadSchedule() {
    if (!this.scheduleSelectedAssetId) return;
    this.scheduleLoading = true;
    this.scheduleData = null;
    this.depService.getSchedule(this.scheduleSelectedAssetId).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.scheduleData = res;
          this.scheduleLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err: any) => {
        setTimeout(() => {
          this.scheduleLoading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to load schedule' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  getRowClass(row: any): string {
    if (row.isCompleted) return 'row-completed';
    if (row.isCurrent)   return 'row-current';
    return 'row-future';
  }

  // ── Utilities ────────────────────────────────────────────────────────────────
  getStatusSeverity(status: string): 'warn' | 'success' | 'danger' | 'secondary' {
    if (status === 'APPROVED') return 'success';
    if (status === 'REJECTED') return 'danger';
    if (status === 'DRAFT')    return 'warn';
    return 'secondary';
  }

  formatCurrency(val: any): string {
    if (val == null) return '₹0';
    return '₹' + Number(val).toLocaleString('en-IN');
  }

  formatDate(d: any): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
