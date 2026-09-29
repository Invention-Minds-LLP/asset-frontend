import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';
import { Assets } from '../../services/assets/assets';
import { RevenueLogService } from '../../services/revenue-log/revenue-log';
import { OverflowTooltipDirective } from '../../shared/directives/overflow-tooltip.directive';
import { DowntimeEntries, DowntimeEntry, splitDowntime, calibrationPrefillEntries } from '../../shared/downtime-entries/downtime-entries';

/** YYYY-MM-DD of a local date (toISOString would shift picked dates to the previous day east of UTC). */
const localDateStr = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

@Component({
  selector: 'app-my-assets',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TableModule, TagModule,
    ToastModule, TooltipModule, DialogModule, InputNumberModule,
    DatePickerModule, SelectModule, TextareaModule,
    OverflowTooltipDirective, DowntimeEntries,
  ],
  templateUrl: './my-assets.html',
  styleUrl: './my-assets.css',
  providers: [MessageService]
})
export class MyAssets implements OnInit {
  loading = false;
  assets: any[] = [];
  employeeName = '';
  employeeID = '';
  refreshing = false;

  private employeeDbId!: number;

  // ── Revenue Log dialog state ─────────────────────────────────────────────────
  showLogDialog = false;
  savingLog = false;
  selectedAsset: any = null;
  logForm = this.emptyLogForm();

  // Shift labels with timing — easier for floor staff to recognise.
  // Hours are capped at the shift duration (8h) on the input itself.
  shiftLabel1 = 'Morning Shift (6 AM – 2 PM)';
  shiftLabel2 = 'Afternoon Shift (2 PM – 10 PM)';
  shiftLabel3 = 'Night Shift (10 PM – 6 AM)';

  // Selected asset's rate card — drives max hours/day and the standard warm-up allowance.
  rateCard: any = null;

  conditionOptions = [
    { label: 'Good',            value: 'GOOD' },
    { label: 'Needs Attention', value: 'NEEDS_ATTENTION' },
    { label: 'Degraded',        value: 'DEGRADED' },
    { label: 'Critical',        value: 'CRITICAL' },
  ];

  constructor(
    private assetService: Assets,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    private rlService: RevenueLogService,
  ) {}

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    this.employeeDbId = user?.employeeDbId;
    this.employeeID = user?.employeeID || '';
    this.employeeName = user?.name || '';
    if (this.employeeDbId) {
      this.load();
    }
  }

  load() {
    this.refreshing=true;
    this.loading = true;
    this.assetService.getEmployeeAssets(this.employeeDbId).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.assets = res.assets || [];
          this.employeeName = res.employee?.name || this.employeeName;
          this.loading = false;
          this.refreshing=false;
          this.cdr.detectChanges();
        });
      },
      error: (e: any) => {
        setTimeout(() => {
          this.loading = false; this.refreshing=false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: e?.error?.message || 'Failed to load' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  // ── Revenue Log dialog ───────────────────────────────────────────────────────
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

  openRevenueLog(asset: any) {
    this.selectedAsset = asset;
    this.logForm = this.emptyLogForm();
    this.rateCard = null;
    this.showLogDialog = true;
    this.rlService.getRateCard(asset.id).subscribe({
      next: (res: any) => { setTimeout(() => { this.rateCard = res; this.cdr.detectChanges(); this.loadCalibrationPrefill(); }); },
      error: () => { this.loadCalibrationPrefill(); } // no rate card yet — defaults apply
    });
  }

  get standardStartupMinutes(): number {
    return Number(this.rateCard?.standardStartupMinutes ?? 0);
  }

  get maxHoursPerDay(): number {
    return Number(this.rateCard?.maxHoursPerDay ?? 24);
  }

  get capacityExceeded(): boolean {
    const s = splitDowntime(this.logForm.downtimeEntries, this.standardStartupMinutes);
    return Number(this.logForm.hoursUsed ?? 0) + s.plannedHours + s.unplannedHours > this.maxHoursPerDay + 0.001;
  }

  /** Pre-fill calibration + warm-up downtime when a calibration was recorded on the log date. */
  loadCalibrationPrefill() {
    if (!this.selectedAsset?.id) return;
    if (this.logForm.downtimeEntries.some(e => e.type === 'CALIBRATION')) return;
    const day = this.logForm.logDate instanceof Date ? this.logForm.logDate : new Date(this.logForm.logDate);
    this.rlService.getCalibrationInfo(this.selectedAsset.id, day).subscribe({
      next: (info: any) => {
        setTimeout(() => {
          if (this.logForm.downtimeEntries.some(e => e.type === 'CALIBRATION')) return;
          const rows = calibrationPrefillEntries(info, this.standardStartupMinutes);
          if (rows.length) {
            this.logForm.downtimeEntries.push(...rows);
            this.messageService.add({ severity: 'info', summary: 'Calibration found', detail: 'Calibration downtime pre-filled — adjust if needed' });
          }
          this.cdr.detectChanges();
        });
      },
      error: () => {}
    });
  }

  // Auto-sum shift hours into Hours Used so the user only enters per-shift split.
  recomputeHoursUsedFromShifts() {
    const s1 = Number(this.logForm.shift1Hours ?? 0);
    const s2 = Number(this.logForm.shift2Hours ?? 0);
    const s3 = Number(this.logForm.shift3Hours ?? 0);
    const total = s1 + s2 + s3;
    if (total > 0) this.logForm.hoursUsed = Number(total.toFixed(1));
  }

  saveLog() {
    if (!this.selectedAsset?.id || !this.logForm.hoursUsed) {
      this.messageService.add({ severity: 'warn', summary: 'Missing', detail: 'Hours used is required' });
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
        : this.logForm.logDate,
    };
    this.rlService.upsertDailyLog(this.selectedAsset.id, payload).subscribe({
      next: () => {
        setTimeout(() => {
          this.showLogDialog = false;
          this.savingLog = false;
          this.messageService.add({
            severity: 'success', summary: 'Saved',
            detail: `Daily log saved for ${this.selectedAsset?.assetName ?? 'asset'}`,
          });
          this.selectedAsset = null;
          this.cdr.detectChanges();
        });
      },
      error: (e: any) => {
        setTimeout(() => {
          this.savingLog = false;
          this.messageService.add({
            severity: 'error', summary: 'Error',
            detail: e?.error?.message || 'Failed to save daily log',
          });
          this.cdr.detectChanges();
        });
      },
    });
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<string, any> = {
      ACTIVE: 'success', IN_STORE: 'info', UNDER_MAINTENANCE: 'warn',
      DISPOSED: 'danger', PENDING_HOD_APPROVAL: 'warn'
    };
    return map[status] ?? 'secondary';
  }

  /** Returns CSS modifier class for the status pill — e.g. ACTIVE → 'active'. */
  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'active',
      IN_STORE: 'instore',
      IN_MAINTENANCE: 'maint',
      UNDER_MAINTENANCE: 'maint',
      PENDING_HOD_APPROVAL: 'pending',
      DISPOSED: 'disposed',
      RETIRED: 'disposed',
      SCRAPPED: 'disposed',
      CONDEMNED: 'disposed',
    };
    return map[status] ?? 'default';
  }
}
