import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { AnalyticsService } from '../../services/analytics/analytics';
import { Assets } from '../../services/assets/assets';

@Component({
  selector: 'app-cfo-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TableModule, TagModule,
    ToastModule, SelectModule, TooltipModule, DialogModule, ProgressBarModule,
  ],
  templateUrl: './cfo-dashboard.html',
  styleUrl: './cfo-dashboard.css',
  providers: [MessageService]
})
export class CfoDashboard implements OnInit {
  dashboard: any = null;
  tcoData: any[] = [];
  turnoverData: any = null;
  idleAssets: any[] = [];
  inStoreAging: any[] = [];
  uncoveredAssets: any[] = [];
  uncoveredTotal = 0;
  uncoveredValue = 0;

  // ── Maintenance by Category ──────────────────────────────────
  maintenanceByCategory: any[] = [];
  loadingMaintenance = false;
  expandedMaintCategoryId: number | null = null;

  // ── Asset Value Buckets ───────────────────────────────────────
  valueBuckets: any[] = [];
  valueBucketsTotal = 0;
  loadingBuckets = false;
  selectedBucket: any = null;
  showBucketDialog = false;

  loadingDashboard = false;
  loadingTCO = false;
  loadingTurnover = false;
  loadingIdle = false;
  loadingAging = false;
  loadingUncovered = false;

  departmentId: number | null = null;

  // TCO drill-down: category → asset list
  expandedCategoryId: number | null = null;
  categoryAssets: any[] = [];
  loadingCategoryAssets = false;

  // TCO drill-down: asset → full cost breakdown dialog
  showTcoDialog = false;
  tcoDetail: any = null;
  loadingTcoDetail = false;

  constructor(
    private analytics: AnalyticsService,
    private assetsService: Assets,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  navigateTo(path: string) { this.router.navigate([path]); }

  ngOnInit() {
    this.loadDashboard();
    this.loadTCO();
    this.loadTurnover();
    this.loadIdleCapital();
    this.loadInStoreAging();
    this.loadUncoveredAssets();
    this.loadMaintenanceByCategory();
    this.loadValueBuckets();
  }

  loadDashboard() {
    this.loadingDashboard = true;
    const filters: any = {};
    if (this.departmentId) filters.departmentId = this.departmentId;
    this.analytics.getCfoDashboard(filters).subscribe({
      next: (data: any) => {
        this.dashboard = data;
        this.loadingDashboard = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingDashboard = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadTCO() {
    this.loadingTCO = true;
    this.analytics.getTCO({ level: 'category' }).subscribe({
      next: (data: any) => {
        this.tcoData = Array.isArray(data) ? data : (data?.data ?? []);
        this.loadingTCO = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingTCO = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadTurnover() {
    this.loadingTurnover = true;
    this.analytics.getAssetTurnover().subscribe({
      next: (data: any) => {
        this.turnoverData = data;
        this.loadingTurnover = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingTurnover = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadIdleCapital() {
    this.loadingIdle = true;
    this.analytics.getIdleCapital().subscribe({
      next: (data: any) => {
        this.idleAssets = data?.idleAssets ?? [];
        this.loadingIdle = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingIdle = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadInStoreAging() {
    this.loadingAging = true;
    this.analytics.getInStoreAging().subscribe({
      next: (data: any) => {
        this.inStoreAging = Array.isArray(data) ? data : (data?.data ?? []);
        this.loadingAging = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingAging = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadUncoveredAssets() {
    this.loadingUncovered = true;
    this.analytics.getUncoveredAssets().subscribe({
      next: (data: any) => {
        this.uncoveredAssets = data?.uncoveredAssets ?? [];
        this.uncoveredTotal = data?.total ?? 0;
        this.uncoveredValue = data?.totalValue ?? 0;
        this.loadingUncovered = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingUncovered = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadValueBuckets() {
    this.loadingBuckets = true;
    this.analytics.getAssetValueBuckets().subscribe({
      next: (data: any) => {
        this.valueBuckets = data?.buckets ?? [];
        this.valueBucketsTotal = data?.totalAssets ?? 0;
        this.loadingBuckets = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loadingBuckets = false; this.cdr.detectChanges(); }
    });
  }

  openBucketDrilldown(bucket: any) {
    this.selectedBucket = bucket;
    this.showBucketDialog = true;
    this.cdr.detectChanges();
  }

  loadMaintenanceByCategory() {
    this.loadingMaintenance = true;
    this.analytics.getMaintenanceByCategory().subscribe({
      next: (data: any) => {
        this.maintenanceByCategory = Array.isArray(data) ? data : [];
        this.loadingMaintenance = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingMaintenance = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleMaintCategory(catId: number) {
    this.expandedMaintCategoryId = this.expandedMaintCategoryId === catId ? null : catId;
    this.cdr.detectChanges();
  }

  getMaxMaintCost(): number {
    return Math.max(...this.maintenanceByCategory.map((c: any) => c.totalMaintenanceCost ?? 0), 1);
  }

  // ── TCO Category Drill-down ──────────────────────────────────

  toggleCategoryDrilldown(row: any) {
    const categoryId = row.groupId;
    if (this.expandedCategoryId === categoryId) {
      this.expandedCategoryId = null;
      this.categoryAssets = [];
      this.cdr.detectChanges();
      return;
    }
    this.expandedCategoryId = categoryId;
    this.categoryAssets = [];
    this.loadingCategoryAssets = true;
    this.cdr.detectChanges();
    this.assetsService.getAllAssets().subscribe({
      next: (data: any) => {
        const list: any[] = Array.isArray(data) ? data : (data?.data ?? []);
        // Use == (loose) to handle string/number mismatch from API
        this.categoryAssets = list.filter((a: any) => a.assetCategoryId == categoryId);
        this.loadingCategoryAssets = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingCategoryAssets = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Per-asset TCO detail dialog ───────────────────────────────

  openAssetTCO(assetDbId: number) {
    this.showTcoDialog = true;
    this.tcoDetail = null;
    this.loadingTcoDetail = true;
    this.cdr.detectChanges();
    this.analytics.getTCO({ assetId: assetDbId }).subscribe({
      next: (data: any) => {
        this.tcoDetail = data;
        this.loadingTcoDetail = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingTcoDetail = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Returns cost rows in descending order, excluding zero values
  get tcoBreakdownRows(): { label: string; value: number; pct: number; color: string }[] {
    if (!this.tcoDetail) return [];
    const total = this.tcoDetail.totalTCO || 1;
    const items = [
      { label: 'Purchase / Capital Cost', value: this.tcoDetail.capitalCost ?? 0,      color: '#6366f1' },
      { label: 'Repair (Tickets)',         value: this.tcoDetail.repairCost ?? 0,       color: '#dc2626' },
      { label: 'Planned Maintenance (PM)', value: this.tcoDetail.pmCost ?? 0,           color: '#f59e0b' },
      { label: 'Spare Parts',             value: this.tcoDetail.sparePartCost ?? 0,    color: '#0ea5e9' },
      { label: 'Labor / Staff Time',      value: this.tcoDetail.laborCost ?? 0,        color: '#8b5cf6' },
      { label: 'Consumables / Materials', value: this.tcoDetail.consumableCost ?? 0,   color: '#10b981' },
      { label: 'Utility / Power',         value: this.tcoDetail.utilityCost ?? 0,      color: '#f97316' },
      { label: 'Space / Facility',        value: this.tcoDetail.spaceCost ?? 0,        color: '#64748b' },
      { label: 'Outsourced Services',     value: this.tcoDetail.outsourcedCost ?? 0,   color: '#ec4899' },
      { label: 'Other Allocations',       value: this.tcoDetail.otherCost ?? 0,        color: '#94a3b8' },
    ];
    return items
      .filter(i => i.value > 0)
      .map(i => ({ ...i, pct: Math.round((i.value / total) * 1000) / 10 }))
      .sort((a, b) => b.value - a.value);
  }

  // ── Helpers ─────────────────────────────────────────────────

  get monthlyTrend(): any[] {
    return this.dashboard?.monthlyTrend ?? [];
  }

  get maxMonthlyTotal(): number {
    const totals = this.monthlyTrend.map((m: any) => (m.capital ?? 0) + (m.maintenance ?? 0));
    return Math.max(...totals, 1);
  }

  get topPerformers(): any[] {
    return this.turnoverData?.topPerformers ?? this.turnoverData?.top ?? [];
  }

  get bottomPerformers(): any[] {
    return this.turnoverData?.bottomPerformers ?? this.turnoverData?.bottom ?? [];
  }

  getMaxTCO(): number {
    const vals = this.tcoData.map((t: any) => t.totalTCO ?? 0);
    return Math.max(...vals, 1);
  }

  formatCurrency(value: number | null | undefined): string {
    if (value == null) return '—';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  }

  formatPct(value: number | null | undefined): string {
    if (value == null) return '—';
    return value.toFixed(1) + '%';
  }

  getAgingSeverity(days: number): string {
    if (days > 180) return 'critical';
    if (days > 90) return 'warning';
    return '';
  }
}
