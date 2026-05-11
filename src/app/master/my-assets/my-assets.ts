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

@Component({
  selector: 'app-my-assets',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TableModule, TagModule,
    ToastModule, TooltipModule, DialogModule, InputNumberModule,
    DatePickerModule, SelectModule, TextareaModule,
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

  downtimeTypeOptions = [
    { label: 'Planned',           value: 'PLANNED' },
    { label: 'Unplanned',         value: 'UNPLANNED' },
    { label: 'Maintenance',       value: 'MAINTENANCE' },
    { label: 'Calibration',       value: 'CALIBRATION' },
    { label: 'No Demand',         value: 'NO_DEMAND' },
    { label: 'Power Outage',      value: 'POWER_OUTAGE' },
    { label: 'Staff Unavailable', value: 'STAFF_UNAVAILABLE' },
  ];

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
    this.loading = true;
    this.assetService.getEmployeeAssets(this.employeeDbId).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.assets = res.assets || [];
          this.employeeName = res.employee?.name || this.employeeName;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: (e: any) => {
        setTimeout(() => {
          this.loading = false;
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
      downtimeHours: null as number | null,
      downtimeType: null as string | null,
      downtimeRemarks: '',
      conditionAfterUse: null as string | null,
      remarks: '',
    };
  }

  openRevenueLog(asset: any) {
    this.selectedAsset = asset;
    this.logForm = this.emptyLogForm();
    this.showLogDialog = true;
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
    this.savingLog = true;
    const payload = {
      ...this.logForm,
      logDate: this.logForm.logDate instanceof Date
        ? this.logForm.logDate.toISOString().slice(0, 10)
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
