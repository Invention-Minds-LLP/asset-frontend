import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { AssetPoolService } from '../../services/asset-pool/asset-pool';

@Component({
  selector: 'app-asset-pool',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, TableModule, ToastModule, DialogModule,
    SelectModule, TagModule, ProgressBarModule, CardModule, TooltipModule,
    InputTextModule, TextareaModule, CheckboxModule
  ],
  templateUrl: './asset-pool.html',
  styleUrl: './asset-pool.css',
  providers: [MessageService]
})
export class AssetPoolPage implements OnInit {
  // ── List view
  pools: any[] = [];
  summary: any = null;
  loading = false;

  // ── Create pool dialog (includes inline FA schedule)
  showCreateDialog = false;
  createForm: any = {
    financialYear: '',
    categoryName: '',
    departmentName: '',
    originalQuantity: null,
    notes: '',
    // FA schedule inline
    includeFaSchedule: true,
    financialYearEnd: '',
    openingGrossBlock: null,
    additions: 0,
    deletions: 0,
    closingGrossBlock: null,
    openingAccumulatedDep: null,
    depreciationRate: null,
    depreciationForPeriod: null,
    closingAccumulatedDep: null,
    openingNetBlock: null,
    closingNetBlock: null,
  };
  creating = false;

  // ── Excel import (FA register → pools)
  showImportDialog = false;
  importFile: File | null = null;
  importing = false;
  importResult: any = null;

  // ── Excel import (individual assets → linked to pools)
  showIndividualImportDialog = false;
  individualImportFile: File | null = null;
  individualImporting = false;
  individualImportResult: any = null;

  // ── Detail / selected pool
  selectedPool: any = null;
  detailLoading = false;
  showDetailDialog = false;

  // ── Depreciation schedule dialog
  showScheduleDialog = false;
  scheduleForm: any = {
    financialYear: '',
    financialYearEnd: '',
    openingGrossBlock: null,
    additions: 0,
    deletions: 0,
    closingGrossBlock: null,
    openingAccumulatedDep: null,
    depreciationRate: null,
    depreciationForPeriod: null,
    closingAccumulatedDep: null,
    openingNetBlock: null,
    closingNetBlock: null
  };
  addingSchedule = false;
  depSchedules: any[] = [];

  // ── Activity log
  activityLog: any[] = [];
  activityLoading = false;
  showActivityDialog = false;

  // ── Proportional dep calculator
  showPropCalcDialog = false;
  propAssetCost: number | null = null;
  propResult: any = null;
  propLoading = false;

  // ── Adjustment dialog
  showAdjustmentDialog = false;
  adjustmentForm: any = {
    adjustmentType: 'CORRECTION',
    amount: null,
    financialYear: '',
    reason: ''
  };
  addingAdjustment = false;

  adjustmentTypeOptions = [
    { label: 'Correction', value: 'CORRECTION' },
    { label: 'Distribute to Assets', value: 'DISTRIBUTE' },
    { label: 'Write-off', value: 'WRITE_OFF' }
  ];

  fyOptions: { label: string; value: string }[] = [];

  constructor(
    private poolService: AssetPoolService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.buildFyOptions();
    this.loadSummary();
    this.loadPools();
  }

  buildFyOptions() {
    const curYear = new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1;
    for (let y = curYear; y >= curYear - 10; y--) {
      const label = `FY ${y}-${String(y + 1).slice(2)}`;
      const value = `FY${y}-${String(y + 1).slice(2)}`;
      this.fyOptions.push({ label, value });
    }
  }

  loadSummary() {
    this.poolService.getSummary().subscribe({
      next: (res: any) => {
        this.summary = res;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  loadPools() {
    this.loading = true;
    this.poolService.listPools().subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.pools = res || [];
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.loading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load asset pools' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  openCreateDialog() {
    this.createForm = {
      financialYear: '',
      categoryName: '',
      departmentName: '',
      originalQuantity: null,
      notes: '',
      includeFaSchedule: true,
      financialYearEnd: '',
      openingGrossBlock: null,
      additions: 0,
      deletions: 0,
      closingGrossBlock: null,
      openingAccumulatedDep: null,
      depreciationRate: null,
      depreciationForPeriod: null,
      closingAccumulatedDep: null,
      openingNetBlock: null,
      closingNetBlock: null,
    };
    this.showCreateDialog = true;
  }

  autoCalcCreate() {
    const f = this.createForm;
    if (f.openingGrossBlock != null && f.additions != null && f.deletions != null) {
      f.closingGrossBlock = Number(f.openingGrossBlock) + Number(f.additions || 0) - Number(f.deletions || 0);
    }
    if (f.openingAccumulatedDep != null && f.depreciationForPeriod != null) {
      f.closingAccumulatedDep = Number(f.openingAccumulatedDep) + Number(f.depreciationForPeriod);
    }
    if (f.openingGrossBlock != null && f.openingAccumulatedDep != null) {
      f.openingNetBlock = Number(f.openingGrossBlock) - Number(f.openingAccumulatedDep);
    }
    if (f.closingGrossBlock != null && f.closingAccumulatedDep != null) {
      f.closingNetBlock = Number(f.closingGrossBlock) - Number(f.closingAccumulatedDep);
    }
    // Set totalPoolCost from closingGrossBlock if not set
    if (f.closingGrossBlock && !f.totalPoolCost) {
      f.totalPoolCost = f.closingGrossBlock;
    }
  }

  submitCreatePool() {
    if (!this.createForm.financialYear || !this.createForm.categoryName) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Financial Year and Category are required' });
      return;
    }
    this.creating = true;

    // Build payload — always include categoryName so backend can resolve it
    const payload: any = {
      financialYear: this.createForm.financialYear,
      categoryName: this.createForm.categoryName,
      departmentName: this.createForm.departmentName || null,
      originalQuantity: this.createForm.originalQuantity || 0,
      totalPoolCost: this.createForm.closingGrossBlock || this.createForm.totalPoolCost || null,
      notes: this.createForm.notes || null,
    };

    this.poolService.createPool(payload).subscribe({
      next: (pool: any) => {
        // If FA schedule was filled in, post it immediately
        if (this.createForm.includeFaSchedule && this.createForm.closingGrossBlock && this.createForm.financialYearEnd) {
          const sched = {
            financialYear: this.createForm.financialYear,
            financialYearEnd: this.createForm.financialYearEnd,
            openingGrossBlock: this.createForm.openingGrossBlock || 0,
            additions: this.createForm.additions || 0,
            deletions: this.createForm.deletions || 0,
            closingGrossBlock: this.createForm.closingGrossBlock,
            openingAccumulatedDep: this.createForm.openingAccumulatedDep || 0,
            depreciationRate: this.createForm.depreciationRate || 0,
            depreciationForPeriod: this.createForm.depreciationForPeriod || 0,
            closingAccumulatedDep: this.createForm.closingAccumulatedDep || 0,
            openingNetBlock: this.createForm.openingNetBlock || 0,
            closingNetBlock: this.createForm.closingNetBlock || 0,
          };
          this.poolService.addDepreciationSchedule(pool.id, sched).subscribe({
            next: () => {
              this.finishCreate();
            },
            error: () => {
              // Pool created but schedule failed — still show success
              this.messageService.add({ severity: 'warn', summary: 'Partial', detail: 'Pool created but FA schedule could not be saved. Add it manually.' });
              this.finishCreate();
            }
          });
        } else {
          this.finishCreate();
        }
      },
      error: (err: any) => {
        this.creating = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to create pool' });
        this.cdr.detectChanges();
      }
    });
  }

  private finishCreate() {
    this.creating = false;
    this.showCreateDialog = false;
    this.messageService.add({ severity: 'success', summary: 'Created', detail: 'Asset pool created successfully' });
    this.loadPools();
    this.loadSummary();
    this.cdr.detectChanges();
  }

  // ── Import FA Register Excel
  openImportDialog() {
    this.importFile = null;
    this.importResult = null;
    this.showImportDialog = true;
  }

  onImportFileSelect(event: any) {
    const files = event?.target?.files || event?.files;
    if (files && files.length > 0) this.importFile = files[0];
  }

  downloadTemplate() {
    this.poolService.downloadFaRegisterTemplate().subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'FA_Register_Pool_Template.xlsx';
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to download template' })
    });
  }

  submitImport() {
    if (!this.importFile) {
      this.messageService.add({ severity: 'warn', summary: 'No file', detail: 'Please select an Excel file first' });
      return;
    }
    this.importing = true;
    this.poolService.importFaRegister(this.importFile).subscribe({
      next: (res: any) => {
        this.importResult = res;
        this.importing = false;
        if (res.imported > 0) {
          this.messageService.add({ severity: 'success', summary: 'Imported', detail: `${res.imported} pool(s) created/updated` });
          this.loadPools();
          this.loadSummary();
        }
        if (res.errorCount > 0) {
          this.messageService.add({ severity: 'warn', summary: 'Partial', detail: `${res.errorCount} row(s) had errors` });
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.importing = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Import failed' });
        this.cdr.detectChanges();
      }
    });
  }

  openDetail(pool: any) {
    this.selectedPool = null;
    this.depSchedules = [];
    this.activityLog = [];
    this.showDetailDialog = true;
    this.detailLoading = true;

    this.poolService.getPool(pool.id).subscribe({
      next: (res: any) => {
        this.selectedPool = res;
        this.detailLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.detailLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load pool details' });
        this.cdr.detectChanges();
      }
    });

    this.poolService.listDepreciationSchedules(pool.id).subscribe({
      next: (res: any) => {
        this.depSchedules = res || [];
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  openScheduleDialog() {
    this.scheduleForm = {
      financialYear: '',
      financialYearEnd: '',
      openingGrossBlock: null,
      additions: 0,
      deletions: 0,
      closingGrossBlock: null,
      openingAccumulatedDep: null,
      depreciationRate: null,
      depreciationForPeriod: null,
      closingAccumulatedDep: null,
      openingNetBlock: null,
      closingNetBlock: null
    };
    this.showScheduleDialog = true;
  }

  autoCalcSchedule() {
    const s = this.scheduleForm;
    if (s.openingGrossBlock != null && s.additions != null && s.deletions != null) {
      s.closingGrossBlock = (Number(s.openingGrossBlock) + Number(s.additions || 0) - Number(s.deletions || 0));
    }
    if (s.openingAccumulatedDep != null && s.depreciationForPeriod != null) {
      s.closingAccumulatedDep = Number(s.openingAccumulatedDep) + Number(s.depreciationForPeriod);
    }
    if (s.openingGrossBlock != null && s.openingAccumulatedDep != null) {
      s.openingNetBlock = Number(s.openingGrossBlock) - Number(s.openingAccumulatedDep);
    }
    if (s.closingGrossBlock != null && s.closingAccumulatedDep != null) {
      s.closingNetBlock = Number(s.closingGrossBlock) - Number(s.closingAccumulatedDep);
    }
  }

  submitSchedule() {
    if (!this.selectedPool || !this.scheduleForm.financialYear) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Financial Year is required' });
      return;
    }
    this.addingSchedule = true;
    this.poolService.addDepreciationSchedule(this.selectedPool.id, this.scheduleForm).subscribe({
      next: () => {
        this.addingSchedule = false;
        this.showScheduleDialog = false;
        this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'FA Schedule saved successfully' });
        this.poolService.listDepreciationSchedules(this.selectedPool.id).subscribe({
          next: (res: any) => { this.depSchedules = res || []; this.cdr.detectChanges(); },
          error: () => {}
        });
        this.poolService.getPool(this.selectedPool.id).subscribe({
          next: (res: any) => { this.selectedPool = res; this.cdr.detectChanges(); },
          error: () => {}
        });
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.addingSchedule = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to save schedule' });
        this.cdr.detectChanges();
      }
    });
  }

  openActivityLog(pool: any) {
    this.activityLog = [];
    this.activityLoading = true;
    this.showActivityDialog = true;
    this.poolService.getPoolActivity(pool.id).subscribe({
      next: (res: any) => {
        this.activityLog = res || [];
        this.activityLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.activityLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load activity log' });
        this.cdr.detectChanges();
      }
    });
  }

  openPropCalc() {
    this.propAssetCost = null;
    this.propResult = null;
    this.showPropCalcDialog = true;
  }

  calcProportional() {
    if (!this.selectedPool || !this.propAssetCost) return;
    this.propLoading = true;
    this.poolService.getProportionalDep(this.selectedPool.id, this.propAssetCost).subscribe({
      next: (res: any) => {
        this.propResult = res;
        this.propLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.propLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Calculation failed' });
        this.cdr.detectChanges();
      }
    });
  }

  openAdjustmentDialog() {
    this.adjustmentForm = {
      adjustmentType: 'CORRECTION',
      amount: null,
      financialYear: '',
      reason: ''
    };
    this.showAdjustmentDialog = true;
  }

  submitAdjustment() {
    if (!this.selectedPool || !this.adjustmentForm.amount) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Amount is required' });
      return;
    }
    this.addingAdjustment = true;
    this.poolService.addAdjustment(this.selectedPool.id, this.adjustmentForm).subscribe({
      next: () => {
        this.addingAdjustment = false;
        this.showAdjustmentDialog = false;
        this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Adjustment recorded' });
        this.poolService.getPool(this.selectedPool.id).subscribe({
          next: (res: any) => { this.selectedPool = res; this.cdr.detectChanges(); },
          error: () => {}
        });
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.addingAdjustment = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to save adjustment' });
        this.cdr.detectChanges();
      }
    });
  }

  // ── Reset all pools
  showResetConfirm = false;
  resetting = false;

  confirmReset() { this.showResetConfirm = true; }

  executeReset() {
    this.resetting = true;
    this.poolService.resetAllPools().subscribe({
      next: (res: any) => {
        this.resetting = false;
        this.showResetConfirm = false;
        this.messageService.add({
          severity: 'success', summary: 'Reset Complete',
          detail: `Deleted ${res.deletedPools} pool(s) and ${res.deletedSchedules} schedule(s). ${res.unlinkedAssets} asset(s) unlinked.`
        });
        this.pools = [];
        this.summary = null;
        this.loadPools();
        this.loadSummary();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.resetting = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Reset failed' });
        this.cdr.detectChanges();
      }
    });
  }

  // ── Individual asset import
  openIndividualImportDialog() {
    this.individualImportFile = null;
    this.individualImportResult = null;
    this.showIndividualImportDialog = true;
  }

  onIndividualFileSelect(event: any) {
    const files = event?.target?.files || event?.files;
    if (files && files.length > 0) this.individualImportFile = files[0];
  }

  downloadIndividualTemplate() {
    this.poolService.downloadIndividualAssetsTemplate().subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Individual_Assets_Import_Template.xlsx';
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to download template' })
    });
  }

  submitIndividualImport() {
    if (!this.individualImportFile) {
      this.messageService.add({ severity: 'warn', summary: 'No file', detail: 'Please select an Excel file first' });
      return;
    }
    this.individualImporting = true;
    this.poolService.importIndividualAssets(this.individualImportFile).subscribe({
      next: (res: any) => {
        this.individualImportResult = res;
        this.individualImporting = false;
        if (res.imported > 0) {
          this.messageService.add({ severity: 'success', summary: 'Imported', detail: `${res.imported} asset(s) created and linked to pools` });
          this.loadPools();
          this.loadSummary();
        }
        if (res.errorCount > 0) {
          this.messageService.add({ severity: 'warn', summary: 'Partial', detail: `${res.errorCount} row(s) had errors` });
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.individualImporting = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Import failed' });
        this.cdr.detectChanges();
      }
    });
  }

  getStatusSeverity(status: string): 'success' | 'warn' | 'info' | 'danger' | 'secondary' | 'contrast' | undefined {
    if (status === 'COMPLETE') return 'success';
    if (status === 'PARTIAL') return 'warn';
    return 'info';
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'POOL_CREATED': return 'pi pi-plus-circle';
      case 'SCHEDULE_UPLOADED': return 'pi pi-file-import';
      case 'ASSET_INDIVIDUALIZED': return 'pi pi-check-circle';
      case 'ADJUSTMENT': return 'pi pi-pencil';
      default: return 'pi pi-info-circle';
    }
  }

  fmt(v: any): string {
    if (v == null) return '—';
    return Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }

  fmtPct(v: any): string {
    if (v == null) return '—';
    return Number(v).toFixed(1) + '%';
  }
}
