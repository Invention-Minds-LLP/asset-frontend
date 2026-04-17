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
import { TabViewModule } from 'primeng/tabview';
import { MessageService } from 'primeng/api';
import { LegacyMigrationService } from '../../services/legacy-migration/legacy-migration';
import { Assets } from '../../services/assets/assets';

@Component({
  selector: 'app-legacy-migration',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, DialogModule,
    InputTextModule, SelectModule, FloatLabelModule, DatePickerModule,
    TagModule, ToastModule, TextareaModule, TooltipModule, TabViewModule,
  ],
  providers: [MessageService],
  templateUrl: './legacy-migration.html',
  styleUrl: './legacy-migration.css',
})
export class LegacyMigration implements OnInit {
  // List view
  migratedAssets: any[] = [];
  loading = false;
  filters: any = { mode: '', fromDate: null, toDate: null };

  // Dropdowns
  assetOptions: { label: string; value: number; raw: any }[] = [];
  categoryOptions: { label: string; value: number }[] = [];

  modeOptions = [
    { label: 'All Modes', value: '' },
    { label: 'Granular (asset-level)', value: 'GRANULAR' },
    { label: 'Proportional (pro-rate from totals)', value: 'PROPORTIONAL' },
    { label: 'Carry as New (no history)', value: 'CARRY_AS_NEW' },
  ];

  // Dialog: single migration
  showSingleDialog = false;
  singleForm: any = this._emptySingle();

  // Dialog: proportional migration
  showProportionalDialog = false;
  propForm: any = this._emptyProp();

  saving = false;

  constructor(
    private svc: LegacyMigrationService,
    private assetsApi: Assets,
    private msg: MessageService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.load();
    this.assetsApi.getAllAssetsForDropdown().subscribe({
      next: (list: any[]) => {
        this.assetOptions = list.map(a => ({
          label: `${a.assetId} — ${a.assetName}`, value: a.id, raw: a,
        }));
      },
    });
    this.assetsApi.getCategories().subscribe({
      next: (list: any[]) => {
        this.categoryOptions = list.map(c => ({ label: c.name, value: c.id }));
      },
    });
  }

  load() {
    this.loading = true;
    this.svc.list(this.filters).subscribe({
      next: (res: any) => {
        this.migratedAssets = res.data || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });
  }

  // ── Single migration ─────────────────────────────────────────────────────
  openSingle() {
    this.singleForm = this._emptySingle();
    this.singleForm.migrationDate = new Date();
    this.showSingleDialog = true;
  }

  onAssetSelect(assetId: number) {
    const opt = this.assetOptions.find(o => o.value === assetId);
    if (opt) {
      this.singleForm.originalCost = opt.raw.purchaseCost ?? null;
      this.singleForm.originalPurchaseDate = opt.raw.purchaseDate ? new Date(opt.raw.purchaseDate) : null;
    }
  }

  get computedOpeningWdv(): number {
    const cost = Number(this.singleForm.originalCost ?? 0);
    const dep = Number(this.singleForm.accDepAtMigration ?? 0);
    return Math.max(0, cost - dep);
  }

  get singleVariance(): number | null {
    if (this.singleForm.auditedBookValueAtMigration == null || this.singleForm.auditedBookValueAtMigration === '') return null;
    return this.computedOpeningWdv - Number(this.singleForm.auditedBookValueAtMigration);
  }

  saveSingle() {
    if (!this.singleForm.assetId || !this.singleForm.migrationMode || !this.singleForm.migrationDate) {
      this.msg.add({ severity: 'warn', summary: 'Missing', detail: 'assetId, mode, migrationDate required' });
      return;
    }
    if (this.singleForm.migrationMode === 'GRANULAR' &&
        (this.singleForm.originalCost == null || this.singleForm.accDepAtMigration == null)) {
      this.msg.add({ severity: 'warn', summary: 'Missing', detail: 'Granular mode needs originalCost and accDepAtMigration' });
      return;
    }
    this.saving = true;
    this.svc.migrateSingle({
      ...this.singleForm,
      openingWdvAtMigration: this.computedOpeningWdv,
    }).subscribe({
      next: () => {
        this.saving = false;
        this.showSingleDialog = false;
        this.msg.add({ severity: 'success', summary: 'Migrated', detail: 'Asset migrated' });
        this.load();
      },
      error: (e) => {
        this.saving = false;
        this.msg.add({ severity: 'error', summary: 'Failed', detail: e?.error?.message || 'Migration failed' });
      },
    });
  }

  // ── Proportional migration ────────────────────────────────────────────────
  openProportional() {
    this.propForm = this._emptyProp();
    this.propForm.migrationDate = new Date();
    this.showProportionalDialog = true;
  }

  saveProportional() {
    if (!this.propForm.categoryId || !this.propForm.migrationDate ||
        this.propForm.totalGross == null || this.propForm.totalAccDep == null) {
      this.msg.add({ severity: 'warn', summary: 'Missing', detail: 'category, date, totalGross, totalAccDep required' });
      return;
    }
    this.saving = true;
    this.svc.migrateProportional(this.propForm).subscribe({
      next: (res: any) => {
        this.saving = false;
        this.showProportionalDialog = false;
        this.msg.add({ severity: 'success', summary: 'Pro-rated', detail: `${res.results?.length || 0} assets migrated` });
        this.load();
      },
      error: (e) => {
        this.saving = false;
        this.msg.add({ severity: 'error', summary: 'Failed', detail: e?.error?.message || 'Migration failed' });
      },
    });
  }

  // ── Revert migration ──────────────────────────────────────────────────────
  revert(row: any) {
    if (!confirm(`Revert legacy migration for ${row.assetId}? This will clear all migration values.`)) return;
    this.svc.revert(row.id).subscribe({
      next: () => {
        this.msg.add({ severity: 'info', summary: 'Reverted' });
        this.load();
      },
      error: (e) => this.msg.add({ severity: 'error', summary: 'Failed', detail: e?.error?.message }),
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  modeSeverity(mode: string): 'success' | 'info' | 'warn' | 'secondary' {
    return mode === 'GRANULAR' ? 'success'
         : mode === 'PROPORTIONAL' ? 'info'
         : mode === 'CARRY_AS_NEW' ? 'warn'
         : 'secondary';
  }

  fmt(v: any): string {
    if (v == null) return '—';
    return Number(v).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  private _emptySingle(): any {
    return {
      assetId: null,
      migrationMode: 'GRANULAR',
      migrationDate: null,
      originalPurchaseDate: null,
      originalCost: null,
      accDepAtMigration: null,
      auditedBookValueAtMigration: null,
      auditReferenceId: '',
      migrationNotes: '',
    };
  }

  private _emptyProp(): any {
    return {
      categoryId: null,
      poolId: null,
      migrationDate: null,
      totalGross: null,
      totalAccDep: null,
      auditReferenceId: '',
    };
  }
}
