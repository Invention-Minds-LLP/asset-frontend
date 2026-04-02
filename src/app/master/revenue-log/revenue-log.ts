import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

@Component({
  selector: 'app-revenue-log',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TableModule, TagModule,
    ToastModule, SelectModule, DialogModule, InputNumberModule, TooltipModule,
    InputTextModule, DatePickerModule, TextareaModule, ProgressBarModule,
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

  downtimeTypeOptions = [
    { label: 'Planned', value: 'PLANNED' },
    { label: 'Unplanned', value: 'UNPLANNED' },
    { label: 'Maintenance', value: 'MAINTENANCE' },
    { label: 'Calibration', value: 'CALIBRATION' },
    { label: 'No Demand', value: 'NO_DEMAND' },
    { label: 'Power Outage', value: 'POWER_OUTAGE' },
    { label: 'Staff Unavailable', value: 'STAFF_UNAVAILABLE' },
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
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadAssets();
    this.loadDashboard();
  }

  // ── Asset loading ──────────────────────────────────────────────────────────
  loadAssets() {
    this.assetsService.getAllAssets().subscribe({
      next: (data: any) => {
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        this.assetOptions = list.map((a: any) => ({
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
      downtimeHours: null as number | null,
      downtimeType: null as string | null,
      downtimeRemarks: '',
      conditionAfterUse: null as string | null,
      remarks: '',
    };
  }

  emptyRateCardForm() {
    return {
      revenuePerUnit: null as number | null,
      plannedHoursPerDay: null as number | null,
      targetOee: null as number | null,
      targetUtilization: null as number | null,
      costPerHour: null as number | null,
    };
  }

  openLogEntry() {
    this.logForm = this.emptyLogForm();
    this.showLogDialog = true;
  }

  saveLog() {
    if (!this.selectedAssetId || !this.logForm.hoursUsed) {
      this.messageService.add({ severity: 'warn', summary: 'Missing', detail: 'Asset and hours used are required' });
      return;
    }
    this.savingLog = true;
    const payload = {
      ...this.logForm,
      logDate: this.logForm.logDate instanceof Date
        ? this.logForm.logDate.toISOString().slice(0, 10)
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
      error: () => {
        setTimeout(() => {
          this.savingLog = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save daily log' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  openRateCard() {
    if (this.rateCard) {
      this.rateCardForm = {
        revenuePerUnit: this.rateCard.revenuePerUnit ?? null,
        plannedHoursPerDay: this.rateCard.plannedHoursPerDay ?? null,
        targetOee: this.rateCard.targetOee ?? null,
        targetUtilization: this.rateCard.targetUtilization ?? null,
        costPerHour: this.rateCard.costPerHour ?? null,
      };
    } else {
      this.rateCardForm = this.emptyRateCardForm();
    }
    this.showRateCardDialog = true;
  }

  saveRateCard() {
    if (!this.selectedAssetId) return;
    this.savingRateCard = true;
    this.rlService.upsertRateCard(this.selectedAssetId, this.rateCardForm).subscribe({
      next: () => {
        setTimeout(() => {
          this.showRateCardDialog = false;
          this.savingRateCard = false;
          this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Rate card updated' });
          if (this.selectedAssetId) this.selectAsset(this.selectedAssetId);
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.savingRateCard = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save rate card' });
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
          if (log) log.verified = true;
          this.messageService.add({ severity: 'success', summary: 'Verified', detail: 'Log entry verified' });
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to verify log' });
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
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete log' });
      }
    });
  }

  // ── Leaderboard ────────────────────────────────────────────────────────────
  loadLeaderboard(period: 7 | 15 | 30) {
    this.leaderboardPeriod = period;
    this.loadingLeaderboard = true;
    this.rlService.getLeaderboard({ days: period }).subscribe({
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

  get estimatedRevenue(): number | null {
    if (!this.rateCard?.revenuePerUnit || !this.logForm.procedureCount) return null;
    return this.rateCard.revenuePerUnit * this.logForm.procedureCount;
  }

  get calcAvailability(): number | null {
    if (!this.rateCard?.plannedHoursPerDay || !this.logForm.hoursUsed) return null;
    const downtime = this.logForm.downtimeHours ?? 0;
    const planned = this.rateCard.plannedHoursPerDay;
    if (planned <= 0) return null;
    return Math.min(100, ((planned - downtime) / planned) * 100);
  }

  get calcPerformance(): number | null {
    if (!this.rateCard?.plannedHoursPerDay || !this.logForm.hoursUsed) return null;
    const planned = this.rateCard.plannedHoursPerDay;
    if (planned <= 0) return null;
    return Math.min(100, (this.logForm.hoursUsed / planned) * 100);
  }

  get calcOee(): number | null {
    const a = this.calcAvailability;
    const p = this.calcPerformance;
    if (a == null || p == null) return null;
    return (a / 100) * (p / 100) * 100;
  }

  onTabChange(tab: 'dashboard' | 'asset-detail' | 'log-entry' | 'leaderboard') {
    this.activeTab = tab;
    if (tab === 'dashboard') this.loadDashboard();
    if (tab === 'leaderboard') this.loadLeaderboard(this.leaderboardPeriod);
  }
}
