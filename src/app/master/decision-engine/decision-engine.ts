import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageService } from 'primeng/api';
import { DecisionEngineService } from '../../services/decision-engine/decision-engine';
import { Assets } from '../../services/assets/assets';

@Component({
  selector: 'app-decision-engine',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TableModule, TagModule,
    ToastModule, SelectModule, DialogModule, TooltipModule, ProgressBarModule,
  ],
  templateUrl: './decision-engine.html',
  styleUrl: './decision-engine.css',
  providers: [MessageService]
})
export class DecisionEngine implements OnInit {
  // Dashboard
  summary: any = null;
  topCritical: any[] = [];
  byCategory: any[] = [];
  byCriticality: any[] = [];
  expandedCriticality: string | null = null;
  loadingSummary = false;

  // Bulk evaluation
  allResults: any[] = [];
  filteredTotal = 0;
  loadingAll = false;
  page = 1;
  limit = 15;

  // Filters
  filters = {
    decision: '' as string,
    categoryId: null as number | null,
    departmentId: null as number | null,
    criticalityLevel: '' as string,
  };

  categoryOptions: any[] = [];
  departmentOptions: any[] = [];
  decisionOptions = [
    { label: 'All Decisions', value: '' },
    { label: 'Continue Maintenance', value: 'CONTINUE_MAINTENANCE' },
    { label: 'Monitor', value: 'MONITOR' },
    { label: 'Review for Replacement', value: 'REVIEW_FOR_REPLACEMENT' },
    { label: 'Replace Immediately', value: 'REPLACE_IMMEDIATELY' },
  ];
  criticalityOptions = [
    { label: 'All', value: '' },
    { label: 'Low', value: 'LOW' },
    { label: 'Medium', value: 'MEDIUM' },
    { label: 'High', value: 'HIGH' },
    { label: 'Life Support', value: 'LIFE_SUPPORT' },
  ];

  // Single asset detail dialog
  showDetailDialog = false;
  detailResult: any = null;
  detailHistory: any[] = [];
  loadingDetail = false;
  showCalcBreakdown = true; // expanded by default so new users see it immediately

  // View
  activeView: 'dashboard' | 'evaluate' = 'dashboard';

  constructor(
    private deService: DecisionEngineService,
    private assetsService: Assets,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadSummary();
    this.loadFilterOptions();
  }

  loadFilterOptions() {
    this.assetsService.getAllAssets().subscribe({
      next: (data: any) => {
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        // Extract unique categories and departments
        const catMap = new Map<number, string>();
        const deptMap = new Map<number, string>();
        for (const a of list) {
          if (a.assetCategoryId && a.categoryName) catMap.set(a.assetCategoryId, a.categoryName);
          if (a.departmentId && a.departmentName) deptMap.set(a.departmentId, a.departmentName);
        }
        this.categoryOptions = [{ label: 'All Categories', value: null }, ...Array.from(catMap.entries()).map(([id, name]) => ({ label: name, value: id }))];
        this.departmentOptions = [{ label: 'All Departments', value: null }, ...Array.from(deptMap.entries()).map(([id, name]) => ({ label: name, value: id }))];
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  loadSummary() {
    this.loadingSummary = true;
    this.deService.getDashboardSummary().subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.summary = res.summary;
          this.topCritical = res.topCritical ?? [];
          this.byCategory = res.byCategory ?? [];
          this.byCriticality = res.byCriticality ?? [];
          this.loadingSummary = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.loadingSummary = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load dashboard summary' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  loadAllResults() {
    this.loadingAll = true;
    const params: any = {
      page: this.page,
      limit: this.limit,
    };
    if (this.filters.decision) params.decision = this.filters.decision;
    if (this.filters.categoryId) params.categoryId = this.filters.categoryId;
    if (this.filters.departmentId) params.departmentId = this.filters.departmentId;
    if (this.filters.criticalityLevel) params.criticalityLevel = this.filters.criticalityLevel;

    this.deService.evaluateAll(params).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.allResults = res.data ?? [];
          this.filteredTotal = res.total ?? 0;
          if (res.summary && !this.summary) this.summary = res.summary;
          this.loadingAll = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.loadingAll = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to evaluate assets' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  onFilterChange() {
    this.page = 1;
    this.loadAllResults();
  }

  onPageChange(event: any) {
    this.page = Math.floor(event.first / event.rows) + 1;
    this.limit = event.rows;
    this.loadAllResults();
  }

  switchToEvaluate() {
    this.activeView = 'evaluate';
    if (this.allResults.length === 0) {
      this.loadAllResults();
    }
  }

  openDetail(assetDbId: number) {
    this.showDetailDialog = true;
    this.detailResult = null;
    this.detailHistory = [];
    this.loadingDetail = true;

    this.deService.evaluateSingle(assetDbId).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.detailResult = res;
          this.loadingDetail = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.loadingDetail = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to evaluate asset' });
          this.cdr.detectChanges();
        });
      }
    });

    this.deService.getHistory(assetDbId).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.detailHistory = res.data ?? [];
          this.cdr.detectChanges();
        });
      },
      error: () => {}
    });
  }

  // ── Utilities ──────────────────────────────────────────────────────────────

  getDecisionSeverity(decision: any): 'success' | 'info' | 'warn' | 'danger' {
    switch (decision) {
      case 'CONTINUE_MAINTENANCE': return 'success';
      case 'MONITOR': return 'info';
      case 'REVIEW_FOR_REPLACEMENT': return 'warn';
      case 'REPLACE_IMMEDIATELY': return 'danger';
      default: return 'info';
    }
  }

  getBannerClass(decision: string): string {
    return 'banner-' + decision.toLowerCase().split('_').join('-');
  }

  getDecisionLabel(decision: string): string {
    switch (decision) {
      case 'CONTINUE_MAINTENANCE': return 'Continue Maintenance';
      case 'MONITOR': return 'Monitor';
      case 'REVIEW_FOR_REPLACEMENT': return 'Review for Replacement';
      case 'REPLACE_IMMEDIATELY': return 'Replace Immediately';
      default: return decision;
    }
  }

  getScoreClass(score: number): string {
    if (score >= 76) return 'score-critical';
    if (score >= 56) return 'score-warning';
    if (score >= 36) return 'score-monitor';
    return 'score-healthy';
  }

  getScoreColor(score: number): string {
    if (score >= 76) return '#dc2626';
    if (score >= 56) return '#d97706';
    if (score >= 36) return '#2563eb';
    return '#16a34a';
  }

  getSignalBarColor(score: number): string {
    if (score >= 70) return '#dc2626';
    if (score >= 40) return '#d97706';
    return '#16a34a';
  }

  fc(val: number | null | undefined): string {
    if (val == null) return '—';
    return '\u20B9' + Number(val).toLocaleString('en-IN');
  }

  getSummaryPct(key: string): number {
    if (!this.summary || this.summary.total === 0) return 0;
    return Math.round(((this.summary[key] ?? 0) / this.summary.total) * 100);
  }

  // ── Criticality helpers ───────────────────────────────────────────────────

  toggleCriticality(level: string) {
    this.expandedCriticality = this.expandedCriticality === level ? null : level;
    this.cdr.detectChanges();
  }

  getCriticalityColor(level: string): string {
    switch (level) {
      case 'LIFE_SUPPORT': return '#dc2626';
      case 'HIGH': return '#ea580c';
      case 'MEDIUM': return '#d97706';
      case 'LOW': return '#16a34a';
      default: return '#94a3b8';
    }
  }

  getCriticalityLabel(level: string): string {
    switch (level) {
      case 'LIFE_SUPPORT': return 'Life Support';
      case 'HIGH': return 'High';
      case 'MEDIUM': return 'Medium';
      case 'LOW': return 'Low';
      case 'UNSET': return 'Not Set';
      default: return level;
    }
  }

  getCriticalityIcon(level: string): string {
    switch (level) {
      case 'LIFE_SUPPORT': return 'pi pi-heart';
      case 'HIGH': return 'pi pi-exclamation-triangle';
      case 'MEDIUM': return 'pi pi-info-circle';
      case 'LOW': return 'pi pi-check';
      default: return 'pi pi-question-circle';
    }
  }

  // ── Tooltip helpers (show formula + real values + result) ─────────────────

  compositeScoreTooltip(): string {
    const c = this.detailResult?.calc?.compositeScore;
    if (!c) return '';
    const i = c.inputs;
    return `Formula: ${c.formula}\n\n` +
      `Maintenance Ratio: ${i.maintenanceRatio.score} × ${i.maintenanceRatio.weight} = ${i.maintenanceRatio.product}\n` +
      `Age Factor: ${i.ageFactor.score} × ${i.ageFactor.weight} = ${i.ageFactor.product}\n` +
      `Breakdown Freq: ${i.breakdownFreq.score} × ${i.breakdownFreq.weight} = ${i.breakdownFreq.product}\n` +
      `Downtime Impact: ${i.downtimeImpact.score} × ${i.downtimeImpact.weight} = ${i.downtimeImpact.product}\n` +
      `Cost Trend: ${i.costTrend.score} × ${i.costTrend.weight} = ${i.costTrend.product}\n\n` +
      `Weighted Sum: ${c.weightedSum}\n` +
      `Total Weight: ${c.totalWeight}\n` +
      `Result: ${c.weightedSum} \u00F7 ${c.totalWeight} = ${c.result}`;
  }

  maintenanceRatioTooltip(): string {
    const c = this.detailResult?.calc?.maintenanceRatio;
    if (!c) return '';
    return `Formula: ${c.formula}\n\n` +
      `Maintenance History Cost: ${this.fc(c.maintenanceHistoryCost)}\n` +
      `Ticket Repair Cost: ${this.fc(c.ticketCost)}\n` +
      `Spare Parts Cost: ${this.fc(c.spareCost)}\n` +
      `Total Maintenance: ${this.fc(c.totalMaintenanceCost)}\n\n` +
      `Current Book Value: ${this.fc(c.bookValue)}\n` +
      `Ratio: ${this.fc(c.totalMaintenanceCost)} \u00F7 ${this.fc(c.bookValue)} = ${c.ratio}\n` +
      `Ceiling: ${c.ceiling}\n` +
      `Raw Score: (${c.ratio} \u00F7 ${c.ceiling}) \u00D7 100 = ${c.rawScore}\n` +
      `Final Score (clamped): ${c.result}`;
  }

  ageFactorTooltip(): string {
    const c = this.detailResult?.calc?.ageFactor;
    if (!c) return '';
    const d = c.purchaseDate ? new Date(c.purchaseDate).toLocaleDateString('en-IN') : '\u2014';
    return `Formula: ${c.formula}\n\n` +
      `Purchase/Install Date: ${d}\n` +
      `Asset Age: ${c.ageYears} years\n` +
      `Expected Life: ${c.expectedLifeYears} years\n` +
      `Life Used: ${c.ageYears} \u00F7 ${c.expectedLifeYears} = ${c.lifeUsedRatio} (${c.lifeUsedPct}%)\n\n` +
      `Final Score: ${c.result}`;
  }

  breakdownFreqTooltip(): string {
    const c = this.detailResult?.calc?.breakdownFreq;
    if (!c) return '';
    return `Formula: ${c.formula}\n\n` +
      `Breakdowns (last 12 months): ${c.breakdownCount12m}\n` +
      `High Threshold (100 score): ${c.highThreshold} breakdowns/year\n` +
      `Raw Score: (${c.breakdownCount12m} \u00F7 ${c.highThreshold}) \u00D7 100 = ${c.rawScore}\n` +
      `Final Score (clamped): ${c.result}`;
  }

  downtimeImpactTooltip(): string {
    const c = this.detailResult?.calc?.downtimeImpact;
    if (!c) return '';
    return `Formula: ${c.formula}\n\n` +
      `Downtime Hours (last 12 months): ${c.downtimeHours12m} hrs\n` +
      `From ${c.downtimeTicketCount} ticket(s) with downtime recorded\n` +
      `High Threshold (100 score): ${c.highThreshold} hrs/year\n` +
      `Raw Score: (${c.downtimeHours12m} \u00F7 ${c.highThreshold}) \u00D7 100 = ${c.rawScore}\n` +
      `Final Score (clamped): ${c.result}`;
  }

  costTrendTooltip(): string {
    const c = this.detailResult?.calc?.costTrend;
    if (!c) return '';
    const trend = c.trendPct != null ? c.trendPct + '%' : 'N/A (no prior year data)';
    return `Formula: ${c.formula}\n\n` +
      `Recent 12 months cost: ${this.fc(c.recentCost)}\n` +
      `Prior 12 months cost: ${this.fc(c.priorCost)}\n` +
      `Trend: ${trend}\n` +
      `High Threshold (100 score): ${c.highThreshold}% YoY increase\n` +
      `Final Score: ${c.result}`;
  }

  replacementTooltip(): string {
    const c = this.detailResult?.calc?.replacementEstimate;
    if (!c) return '';
    return `Formula: ${c.formula}\n\n` +
      `Original Cost: ${this.fc(c.originalCost)}\n` +
      `Inflation Rate: ${c.inflationRate}% per year (medical equipment index)\n` +
      `Age (rounded): ${c.ageRounded} year(s)\n` +
      `Result: ${this.fc(c.originalCost)} \u00D7 (1.10)^${c.ageRounded} = ${this.fc(c.result)}`;
  }

  decisionTooltip(): string {
    const c = this.detailResult?.calc?.decision;
    if (!c) return '';
    const t = c.thresholds;
    return `Formula: ${c.formula}\n\n` +
      `Thresholds:\n` +
      `  Continue Maintenance: score ${t.continueMaintenance}\n` +
      `  Monitor: score ${t.monitor}\n` +
      `  Review for Replacement: score ${t.reviewForReplacement}\n` +
      `  Replace Immediately: score ${t.replaceImmediately}\n\n` +
      `This asset scored ${c.compositeScore} \u2192 ${c.result}`;
  }

  bookValueTooltip(): string {
    const d = this.detailResult;
    if (!d) return '';
    return `Formula: Original Cost \u2212 Accumulated Depreciation\n\n` +
      `Original Cost: ${this.fc(d.asset.originalCost)}\n` +
      `Current Book Value: ${this.fc(d.asset.currentBookValue)}\n` +
      `Depreciated: ${this.fc(d.asset.originalCost - d.asset.currentBookValue)}`;
  }

  ageDataTooltip(): string {
    const c = this.detailResult?.calc?.ageFactor;
    if (!c) return '';
    const d = c.purchaseDate ? new Date(c.purchaseDate).toLocaleDateString('en-IN') : '\u2014';
    return `From: ${d}\nAge: ${c.ageYears} yrs\nExpected Life: ${c.expectedLifeYears} yrs\nRemaining: ${this.detailResult.asset.remainingLifeYears} yrs`;
  }

  maintenanceCostTooltip(): string {
    const c = this.detailResult?.calc?.maintenanceRatio;
    if (!c) return '';
    return `Maintenance History: ${this.fc(c.maintenanceHistoryCost)}\nTicket Repairs: ${this.fc(c.ticketCost)}\nSpare Parts: ${this.fc(c.spareCost)}\nTotal: ${this.fc(c.totalMaintenanceCost)}`;
  }

  // ── Dashboard KPI tooltips ────────────────────────────────────────────────

  kpiTotalTooltip(): string {
    if (!this.summary) return '';
    return `Total active assets evaluated by the decision engine\n(excludes DISPOSED and SCRAPPED assets)`;
  }

  kpiContinueTooltip(): string {
    if (!this.summary) return '';
    return `Score 0\u201335: Asset is healthy\nMaintenance cost is reasonable relative to value\n\n${this.summary.continueMaintenance} of ${this.summary.total} assets (${this.getSummaryPct('continueMaintenance')}%)`;
  }

  kpiMonitorTooltip(): string {
    if (!this.summary) return '';
    return `Score 36\u201355: Watch these assets closely\nEarly signs of rising costs or aging\n\n${this.summary.monitor} of ${this.summary.total} assets (${this.getSummaryPct('monitor')}%)`;
  }

  kpiReviewTooltip(): string {
    if (!this.summary) return '';
    return `Score 56\u201375: Start planning CapEx\nMultiple signals suggest replacement is more economical\n\n${this.summary.reviewForReplacement} of ${this.summary.total} assets (${this.getSummaryPct('reviewForReplacement')}%)`;
  }

  kpiReplaceTooltip(): string {
    if (!this.summary) return '';
    return `Score 76\u2013100: Cost of keeping > cost of replacing\nImmediate action recommended\n\n${this.summary.replaceImmediately} of ${this.summary.total} assets (${this.getSummaryPct('replaceImmediately')}%)`;
  }

  avgScoreTooltip(): string {
    if (!this.summary) return '';
    return `Formula: Sum of all composite scores \u00F7 Number of assets\n\nAverage: ${this.summary.avgCompositeScore} / 100\n\nLower is healthier:\n  0\u201335 = Healthy fleet\n  36\u201355 = Needs attention\n  56+ = Significant CapEx risk`;
  }

  totalMaintCostTooltip(): string {
    if (!this.summary) return '';
    return `Sum of all maintenance costs across ${this.summary.total} assets\n(Maintenance history + Ticket repairs + Spare parts)`;
  }

  totalBookValueTooltip(): string {
    if (!this.summary) return '';
    return `Sum of current book values across ${this.summary.total} assets\n(Original cost \u2212 Accumulated depreciation for each asset)`;
  }
}
