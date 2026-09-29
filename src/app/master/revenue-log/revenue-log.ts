import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageService } from 'primeng/api';
import { RevenueLogService } from '../../services/revenue-log/revenue-log';
import { Assets } from '../../services/assets/assets';
import { DowntimeEntries, DowntimeEntry, splitDowntime, calibrationPrefillEntries } from '../../shared/downtime-entries/downtime-entries';

/** YYYY-MM-DD of a local date (toISOString would shift picked dates to the previous day east of UTC). */
const localDateStr = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

@Component({
  selector: 'app-revenue-log',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TableModule, TagModule,
    ToastModule, SelectModule, DialogModule, InputNumberModule, TooltipModule,
    InputTextModule, DatePickerModule, TextareaModule, ProgressBarModule, DowntimeEntries,
  ],
  templateUrl: './revenue-log.html',
  styleUrl: './revenue-log.css',
  providers: [MessageService]
})
export class RevenueLog implements OnInit {
  // ── Tab state ──────────────────────────────────────────────────────────────
  activeTab: 'dashboard' | 'asset-detail' | 'log-entry' | 'leaderboard' = 'dashboard';

  // ── Asset options ──────────────────────────────────────────────────────────
  assetOptions: any[] = [];
  selectedAssetId: number | null = null;

  // ── Dashboard ──────────────────────────────────────────────────────────────
  dashboardData: any = null;
  missingLogs: any[] = [];
  loadingDashboard = false;

  // ── Asset Detail ───────────────────────────────────────────────────────────
  rateCard: any = null;
  utilization: any = null;
  oeeData: any = null;
  revenueSummary: any = null;
  dailyLogs: any[] = [];
  downtimeData: any = null;
  shiftData: any = null;
  loadingDetail = false;

  // ── Log Entry ──────────────────────────────────────────────────────────────
  showLogDialog = false;
  savingLog = false;
  logForm = this.emptyLogForm();

  showRateCardDialog = false;
  savingRateCard = false;
  rateCardForm = this.emptyRateCardForm();

  calibrationInfo: any = null;

  // Mirrors REVENUE_UNITS in revenue-log.controller.ts; `per` is the short suffix for display.
  revenueUnitOptions = [
    { label: 'Per Hour', value: 'PER_HOUR', per: 'hour', hint: 'Hours Used × rate' },
    { label: 'Per Use', value: 'PER_USE', per: 'use', hint: 'Procedure Count × rate' },
    { label: 'Per Procedure', value: 'PER_PROCEDURE', per: 'procedure', hint: 'Procedure Count × rate' },
    { label: 'Per Test', value: 'PER_TEST', per: 'test', hint: 'Procedure Count × rate' },
    { label: 'Per Day', value: 'PER_DAY', per: 'day', hint: 'rate once for each day the asset is used' },
  ];

  unitOption(unit: string | null | undefined) {
    return this.revenueUnitOptions.find(o => o.value === unit) ?? null;
  }

  maxHoursOptions = [
    { label: '8 hrs', value: 8 },
    { label: '12 hrs', value: 12 },
    { label: '16 hrs', value: 16 },
    { label: '24 hrs', value: 24 },
  ];

  conditionOptions = [
    { label: 'Good', value: 'GOOD' },
    { label: 'Needs Attention', value: 'NEEDS_ATTENTION' },
    { label: 'Degraded', value: 'DEGRADED' },
    { label: 'Critical', value: 'CRITICAL' },
  ];

  // ── Leaderboard ────────────────────────────────────────────────────────────
  leaderboardData: any[] = [];
  leaderboardPeriod: 7 | 15 | 30 = 30;
  loadingLeaderboard = false;

  constructor(
    private rlService: RevenueLogService,
    private assetsService: Assets,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.loadAssets();
    this.loadDashboard();

    // Pre-select asset and jump to detail tab if navigated with ?assetId=<n>
    const qpAssetId = Number(this.route.snapshot.queryParamMap.get('assetId'));
    if (qpAssetId) {
      this.selectedAssetId = qpAssetId;
      this.activeTab = 'asset-detail';
    }
  }

  // ── Asset loading ──────────────────────────────────────────────────────────
  // Only show assets where Revenue Log is applicable — drives dropdown content.
  loadAssets() {
    this.assetsService.getAllAssets().subscribe({
      next: (data: any) => {
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        this.assetOptions = list
          .filter((a: any) => a?.isRevenueLogApplicable === true)
          .map((a: any) => ({
            label: `${a.assetId} — ${a.assetName}`,
            value: a.id
          }));
        setTimeout(() => { this.cdr.detectChanges(); });
      },
      error: () => {}
    });
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  loadDashboard() {
    this.loadingDashboard = true;
    this.rlService.getDashboard().subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.dashboardData = res.data ?? res;
          this.loadingDashboard = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => { this.loadingDashboard = false; this.cdr.detectChanges(); });
      }
    });
    this.loadMissingLogs();
  }

  loadMissingLogs() {
    this.rlService.getMissingLogs(3).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.missingLogs = res.data ?? res ?? [];
          this.cdr.detectChanges();
        });
      },
      error: () => {}
    });
  }

  // ── Asset Detail ───────────────────────────────────────────────────────────
  selectAsset(assetId: number) {
    if (!assetId) return;
    this.selectedAssetId = assetId;
    this.loadingDetail = true;
    this.rateCard = null;
    this.calibrationInfo = null;
    this.utilization = null;
    this.oeeData = null;
    this.revenueSummary = null;
    this.dailyLogs = [];
    this.downtimeData = null;
    this.shiftData = null;

    let completed = 0;
    const total = 7;
    const checkDone = () => { completed++; if (completed >= total) { setTimeout(() => { this.loadingDetail = false; this.cdr.detectChanges(); }); } };

    this.rlService.getRateCard(assetId).subscribe({
      next: (res: any) => { setTimeout(() => { this.rateCard = res.data ?? res; this.cdr.detectChanges(); }); checkDone(); },
      error: () => { checkDone(); }
    });
    this.rlService.getUtilization(assetId).subscribe({
      next: (res: any) => { setTimeout(() => { this.utilization = res.data ?? res; this.cdr.detectChanges(); }); checkDone(); },
      error: () => { checkDone(); }
    });
    this.rlService.getOee(assetId).subscribe({
      next: (res: any) => { setTimeout(() => { this.oeeData = res.data ?? res; this.cdr.detectChanges(); }); checkDone(); },
      error: () => { checkDone(); }
    });
    this.rlService.getRevenueSummary(assetId).subscribe({
      next: (res: any) => { setTimeout(() => { this.revenueSummary = res.data ?? res; this.cdr.detectChanges(); }); checkDone(); },
      error: () => { checkDone(); }
    });
    this.rlService.getDailyLogs(assetId).subscribe({
      next: (res: any) => { setTimeout(() => { this.dailyLogs = res.data ?? res ?? []; this.cdr.detectChanges(); }); checkDone(); },
      error: () => { checkDone(); }
    });
    this.rlService.getDowntimeAnalysis(assetId).subscribe({
      next: (res: any) => { setTimeout(() => { this.downtimeData = res.data ?? res; this.cdr.detectChanges(); }); checkDone(); },
      error: () => { checkDone(); }
    });
    this.rlService.getShiftAnalysis(assetId).subscribe({
      next: (res: any) => { setTimeout(() => { this.shiftData = res.data ?? res; this.cdr.detectChanges(); }); checkDone(); },
      error: () => { checkDone(); }
    });
    this.loadCalibrationInfo();
  }

  /** Typical calibration time for the asset, and pre-fill of that day's calibration downtime. */
  loadCalibrationInfo() {
    if (!this.selectedAssetId) return;
    const day = this.logForm.logDate instanceof Date ? this.logForm.logDate : new Date(this.logForm.logDate);
    this.rlService.getCalibrationInfo(this.selectedAssetId, day).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.calibrationInfo = res;
          this.prefillCalibrationDowntime(res);
          this.cdr.detectChanges();
        });
      },
      error: () => {}
    });
  }

  private prefillCalibrationDowntime(info: any) {
    if (this.logForm.downtimeEntries.some(e => e.type === 'CALIBRATION')) return; // user already entered it
    const rows = calibrationPrefillEntries(info, this.standardStartupMinutes);
    if (rows.length) {
      this.logForm.downtimeEntries.push(...rows);
      this.messageService.add({ severity: 'info', summary: 'Calibration found', detail: 'Calibration downtime pre-filled from the calibration record — adjust if needed' });
    }
  }

  onLogDateChange() {
    this.loadCalibrationInfo();
  }

  // ── Log Entry ──────────────────────────────────────────────────────────────
  emptyLogForm() {
    return {
      logDate: new Date(),
      hoursUsed: null as number | null,
      procedureCount: null as number | null,
      patientsServed: null as number | null,
      shift1Hours: null as number | null,
      shift2Hours: null as number | null,
      shift3Hours: null as number | null,
      revenueGenerated: null as number | null,
      downtimeEntries: [] as DowntimeEntry[],
      conditionAfterUse: null as string | null,
      remarks: '',
    };
  }

  emptyRateCardForm() {
    return {
      revenuePerUnit: null as number | null,
      revenueUnit: 'PER_USE' as string, // backend default
      maxHoursPerDay: 24 as number | null,
      shiftsPerDay: 1 as number | null,
      shiftDurationHours: 8 as number | null,
      standardStartupMinutes: 0 as number | null,
      targetOeeScore: null as number | null,
      targetUtilizationPct: null as number | null,
    };
  }

  /** Planned hours = shifts × shift length, capped at max hours per day (same rule as the backend). */
  get derivedPlannedHours(): number | null {
    const f = this.rateCardForm;
    if (!f.shiftsPerDay || !f.shiftDurationHours) return null;
    return Math.min(f.shiftsPerDay * f.shiftDurationHours, f.maxHoursPerDay ?? 24);
  }

  get standardStartupMinutes(): number {
    return Number(this.rateCard?.standardStartupMinutes ?? 0);
  }

  get maxHoursPerDay(): number {
    return Number(this.rateCard?.maxHoursPerDay ?? 24);
  }

  get downtimeSplit() {
    return splitDowntime(this.logForm.downtimeEntries, this.standardStartupMinutes);
  }

  /** Hours used + downtime can't exceed the asset's max hours per day. */
  get capacityExceeded(): boolean {
    const s = this.downtimeSplit;
    return Number(this.logForm.hoursUsed ?? 0) + s.plannedHours + s.unplannedHours > this.maxHoursPerDay + 0.001;
  }

  openLogEntry() {
    this.logForm = this.emptyLogForm();
    this.showLogDialog = true;
    this.loadCalibrationInfo();
  }

  saveLog() {
    if (!this.selectedAssetId || !this.logForm.hoursUsed) {
      this.messageService.add({ severity: 'warn', summary: 'Missing', detail: 'Asset and hours used are required' });
      return;
    }
    if (this.capacityExceeded) {
      this.messageService.add({ severity: 'warn', summary: 'Too many hours', detail: `Hours used + downtime exceeds this asset's ${this.maxHoursPerDay} hours/day` });
      return;
    }
    if (this.logForm.downtimeEntries.some(e => (e.type && !e.minutes) || (!e.type && e.minutes))) {
      this.messageService.add({ severity: 'warn', summary: 'Incomplete downtime', detail: 'Each downtime row needs a reason and minutes' });
      return;
    }
    this.savingLog = true;
    const payload = {
      ...this.logForm,
      downtimeEntries: this.logForm.downtimeEntries.filter(e => e.type && e.minutes),
      logDate: this.logForm.logDate instanceof Date
        ? localDateStr(this.logForm.logDate)
        : this.logForm.logDate
    };
    this.rlService.upsertDailyLog(this.selectedAssetId, payload).subscribe({
      next: () => {
        setTimeout(() => {
          this.showLogDialog = false;
          this.savingLog = false;
          this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Daily usage log saved' });
          if (this.activeTab === 'asset-detail' && this.selectedAssetId) this.selectAsset(this.selectedAssetId);
          this.cdr.detectChanges();
        });
      },
      error: (e: any) => {
        setTimeout(() => {
          this.savingLog = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: e?.error?.message || 'Failed to save daily log' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  openRateCard() {
    if (this.rateCard) {
      // Decimal columns arrive as strings — coerce for p-inputnumber.
      const n = (v: any) => (v == null ? null : Number(v));
      this.rateCardForm = {
        revenuePerUnit: n(this.rateCard.avgRevenuePerUnit),
        revenueUnit: this.rateCard.revenueUnit || 'PER_USE',
        maxHoursPerDay: n(this.rateCard.maxHoursPerDay),
        shiftsPerDay: n(this.rateCard.shiftsPerDay),
        shiftDurationHours: n(this.rateCard.shiftDurationHours),
        standardStartupMinutes: n(this.rateCard.standardStartupMinutes),
        targetOeeScore: n(this.rateCard.targetOeeScore),
        targetUtilizationPct: n(this.rateCard.targetUtilizationPct),
      };
    } else {
      this.rateCardForm = this.emptyRateCardForm();
    }
    this.showRateCardDialog = true;
  }

  saveRateCard() {
    if (!this.selectedAssetId) return;
    this.savingRateCard = true;
    const f = this.rateCardForm;
    if (f.shiftsPerDay && f.shiftDurationHours && f.shiftsPerDay * f.shiftDurationHours > (f.maxHoursPerDay ?? 24)) {
      this.messageService.add({ severity: 'warn', summary: 'Check shifts', detail: `Shifts × duration exceeds max hours; planned hours will be capped at ${f.maxHoursPerDay}` });
    }
    this.rlService.upsertRateCard(this.selectedAssetId, { ...f, plannedHoursPerDay: this.derivedPlannedHours ?? undefined }).subscribe({
      next: () => {
        setTimeout(() => {
          this.showRateCardDialog = false;
          this.savingRateCard = false;
          this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Rate card updated' });
          if (this.selectedAssetId) this.selectAsset(this.selectedAssetId);
          this.cdr.detectChanges();
        });
      },
      error: (e: any) => {
        setTimeout(() => {
          this.savingRateCard = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: e?.error?.message || 'Failed to save rate card' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  verifyLog(logId: number) {
    this.rlService.verifyDailyLog(logId).subscribe({
      next: () => {
        setTimeout(() => {
          const log = this.dailyLogs.find(l => l.id === logId);
          if (log) log.status = 'VERIFIED';
          this.dailyLogs = [...this.dailyLogs];
          this.messageService.add({ severity: 'success', summary: 'Verified', detail: 'Log entry verified' });
          this.cdr.detectChanges();
        });
      },
      error: (e: any) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: e?.error?.message || 'Failed to verify log' });
        this.cdr.markForCheck();
      }
    });
  }

  deleteLog(logId: number) {
    this.rlService.deleteDailyLog(logId).subscribe({
      next: () => {
        setTimeout(() => {
          this.dailyLogs = this.dailyLogs.filter(l => l.id !== logId);
          this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Log entry removed' });
          this.cdr.detectChanges();
        });
      },
      error: (e: any) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: e?.error?.message || 'Failed to delete log' });
        this.cdr.markForCheck();
      }
    });
  }

  // ── Leaderboard ────────────────────────────────────────────────────────────
  loadLeaderboard(period: 7 | 15 | 30) {
    this.leaderboardPeriod = period;
    this.loadingLeaderboard = true;
    this.rlService.getLeaderboard({ period }).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.leaderboardData = res.data ?? res ?? [];
          this.loadingLeaderboard = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => { this.loadingLeaderboard = false; this.cdr.detectChanges(); });
      }
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  formatCurrency(val: number | null | undefined): string {
    if (val == null) return '--';
    return '\u20B9' + Number(val).toLocaleString('en-IN');
  }

  formatPct(val: number | null | undefined): string {
    if (val == null) return '--';
    return Number(val).toFixed(1) + '%';
  }

  getOeeClass(oee: number | null | undefined): string {
    if (oee == null) return '';
    if (oee >= 85) return 'score-world-class';
    if (oee >= 70) return 'score-good';
    if (oee >= 50) return 'score-average';
    return 'score-poor';
  }

  getOeeLabel(oee: number | null | undefined): string {
    if (oee == null) return 'N/A';
    if (oee >= 85) return 'World Class';
    if (oee >= 70) return 'Good';
    if (oee >= 50) return 'Average';
    return 'Poor';
  }

  getOeeSeverity(oee: number | null | undefined): 'success' | 'info' | 'warn' | 'danger' {
    if (oee == null) return 'info';
    if (oee >= 85) return 'success';
    if (oee >= 70) return 'info';
    if (oee >= 50) return 'warn';
    return 'danger';
  }

  getUtilizationClass(pct: number | null | undefined): string {
    if (pct == null) return '';
    if (pct >= 80) return 'score-world-class';
    if (pct >= 60) return 'score-good';
    if (pct >= 40) return 'score-average';
    return 'score-poor';
  }

  getConditionSeverity(condition: string | null): 'success' | 'info' | 'warn' | 'danger' {
    if (!condition) return 'info';
    if (condition === 'GOOD') return 'success';
    if (condition === 'NEEDS_ATTENTION') return 'warn';
    if (condition === 'DEGRADED') return 'warn';
    return 'danger';
  }

  // Preview getters mirror upsertDailyLog in revenue-log.controller.ts.
  get estimatedRevenue(): number | null {
    const rate = Number(this.rateCard?.avgRevenuePerUnit ?? 0);
    if (!rate) return null;
    const unit = this.rateCard.revenueUnit;
    if (unit === 'PER_HOUR') {
      return this.logForm.hoursUsed ? this.logForm.hoursUsed * rate : null;
    }
    if (unit === 'PER_DAY') {
      return this.logForm.hoursUsed ? rate : null; // day rate charged once for any day used
    }
    if (unit === 'PER_USE' || unit === 'PER_PROCEDURE' || unit === 'PER_TEST') {
      return this.logForm.procedureCount != null ? this.logForm.procedureCount * rate : null;
    }
    return null;
  }

  private get plannedHours(): number | null {
    const planned = Number(this.rateCard?.plannedHoursPerDay ?? 0);
    return planned > 0 ? planned : null;
  }

  // Planned downtime shrinks planned production time; only unplanned downtime hurts availability.
  private get productionHours(): { production: number; available: number } | null {
    const planned = this.plannedHours;
    if (planned == null || !this.logForm.hoursUsed) return null;
    const s = this.downtimeSplit;
    const production = Math.max(planned - s.plannedHours, 0);
    if (production <= 0) return null; // whole day was planned downtime → no OEE
    return { production, available: Math.max(production - s.unplannedHours, 0) };
  }

  get calcAvailability(): number | null {
    const p = this.productionHours;
    if (!p) return null;
    return Math.min(100, (p.available / p.production) * 100);
  }

  get calcPerformance(): number | null {
    const p = this.productionHours;
    if (!p) return null;
    if (p.available <= 0) return 0;
    return Math.min(100, (this.logForm.hoursUsed! / p.available) * 100);
  }

  get calcOee(): number | null {
    const a = this.calcAvailability;
    const p = this.calcPerformance;
    if (a == null || p == null) return null;
    const q = Number(this.rateCard?.qualityPassRatePct ?? 98);
    return (a * p * q) / 10000;
  }

  onTabChange(tab: 'dashboard' | 'asset-detail' | 'log-entry' | 'leaderboard') {
    this.activeTab = tab;
    if (tab === 'dashboard') this.loadDashboard();
    if (tab === 'leaderboard') this.loadLeaderboard(this.leaderboardPeriod);
  }
}
