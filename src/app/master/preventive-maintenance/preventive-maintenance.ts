import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TabViewModule } from 'primeng/tabview';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { PreventiveMaintenanceService } from '../../services/preventive-maintenance/preventive-maintenance';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { Assets } from '../../services/assets/assets';

@Component({
  selector: 'app-preventive-maintenance',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TableModule, TagModule, ToastModule, TabViewModule, SelectModule, TooltipModule, DialogModule, InputNumberModule, InputTextModule, TextareaModule, DatePickerModule],
  templateUrl: './preventive-maintenance.html',
  styleUrl: './preventive-maintenance.css',
  providers: [MessageService]
})
export class PreventiveMaintenance implements OnInit {
  activeTab = 0;

  // Calendar
  calendarEvents: any[] = [];
  calendarLoading = false;
  currentMonth: number;
  currentYear: number;
  daysInMonth: any[] = [];

  monthOptions = [
    { label: 'January', value: 1 }, { label: 'February', value: 2 }, { label: 'March', value: 3 },
    { label: 'April', value: 4 }, { label: 'May', value: 5 }, { label: 'June', value: 6 },
    { label: 'July', value: 7 }, { label: 'August', value: 8 }, { label: 'September', value: 9 },
    { label: 'October', value: 10 }, { label: 'November', value: 11 }, { label: 'December', value: 12 }
  ];

  yearOptions: any[] = [];

  // Side panel
  selectedDay: number | null = null;
  selectedDayEvents: any[] = [];

  // Schedules
  schedules: any[] = [];
  schedulesLoading = false;
  showCreateScheduleDialog = false;
  savingSchedule = false;
  scheduleForm = this.emptyScheduleForm();
  assetOptions: { label: string; value: number }[] = [];

  frequencyUnitOptions = [
    { label: 'Days', value: 'DAYS' },
    { label: 'Months', value: 'MONTHS' },
    { label: 'Years', value: 'YEARS' },
  ];

  // History
  history: any[] = [];
  historyLoading = false;
  historyTotal = 0;

  constructor(
    private pmService: PreventiveMaintenanceService,
    private assetsService: Assets,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {
    const now = new Date();
    this.currentMonth = now.getMonth() + 1;
    this.currentYear = now.getFullYear();
    for (let y = this.currentYear - 2; y <= this.currentYear + 2; y++) {
      this.yearOptions.push({ label: String(y), value: y });
    }
  }

  emptyScheduleForm() {
    return {
      assetId: null as number | null,
      frequencyValue: 30,
      frequencyUnit: 'DAYS' as string,
      startDate: null as Date | null,
      reminderDays: 7,
      reason: '',
      description: '',
    };
  }

  ngOnInit() {
    this.loadCalendar();
    this.loadAssetOptions();
  }

  loadAssetOptions() {
    this.assetsService.getAllAssets().subscribe({
      next: (data: any) => {
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        this.assetOptions = list.map((a: any) => ({
          label: `${a.assetId} — ${a.assetName}`,
          value: a.id,
        }));
        setTimeout(() => this.cdr.detectChanges());
      },
      error: () => {}
    });
  }

  onTabChange(event: any) {
    this.activeTab = event.index;
    if (event.index === 1 && !this.schedules.length) this.loadSchedules();
    if (event.index === 2 && !this.history.length) this.loadHistory();
  }

  // loadCalendar() {
  //   this.calendarLoading = true;
  //   this.pmService.getCalendar(this.currentMonth, this.currentYear).subscribe({
  //     next: (events) => {
  //       setTimeout(() => {
  //         this.calendarEvents = events || [];
  //         this.buildCalendarGrid();
  //         this.calendarLoading = false;
  //         this.cdr.detectChanges();
  //       });
  //     },
  //     error: () => {
  //       setTimeout(() => { this.calendarLoading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load calendar' }); this.cdr.detectChanges(); });
  //     }
  //   });
  // }
  loadCalendar() {
  this.calendarLoading = true;
  this.pmService.getCalendar(this.currentMonth, this.currentYear).subscribe({
    next: (res: any) => {
      setTimeout(() => {
        const events = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res?.events)
              ? res.events
              : [];

        this.calendarEvents = events;
        this.buildCalendarGrid();
        this.calendarLoading = false;
        this.cdr.detectChanges();
      });
    },
    error: () => {
      setTimeout(() => {
        this.calendarEvents = [];
        this.daysInMonth = [];
        this.calendarLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load calendar'
        });
        this.cdr.detectChanges();
      });
    }
  });
}

  // buildCalendarGrid() {
  //   const daysCount = new Date(this.currentYear, this.currentMonth, 0).getDate();
  //   const firstDay = new Date(this.currentYear, this.currentMonth - 1, 1).getDay();
  //   this.daysInMonth = [];

  //   // Empty cells for alignment
  //   for (let i = 0; i < firstDay; i++) this.daysInMonth.push({ day: null, events: [] });

  //   for (let d = 1; d <= daysCount; d++) {
  //     const dateStr = `${this.currentYear}-${String(this.currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  //     const dayEvents = this.calendarEvents.filter(e => e.scheduledDate?.startsWith(dateStr));
  //     this.daysInMonth.push({ day: d, events: dayEvents });
  //   }
  // }
  buildCalendarGrid() {
  const daysCount = new Date(this.currentYear, this.currentMonth, 0).getDate();
  const firstDay = new Date(this.currentYear, this.currentMonth - 1, 1).getDay();
  this.daysInMonth = [];

  const events = Array.isArray(this.calendarEvents) ? this.calendarEvents : [];

  for (let i = 0; i < firstDay; i++) {
    this.daysInMonth.push({ day: null, events: [] });
  }

  for (let d = 1; d <= daysCount; d++) {
    const dateStr = `${this.currentYear}-${String(this.currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayEvents = events.filter((e: any) => {
      // Backend returns "dueDate" — match against it
      const due = e?.dueDate || e?.scheduledDate || '';
      return due.toString().startsWith(dateStr);
    });
    this.daysInMonth.push({ day: d, events: dayEvents });
  }
}

  // ── Schedules ──

  loadSchedules() {
    this.schedulesLoading = true;
    this.pmService.getAllSchedules().subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.schedules = Array.isArray(res) ? res : (res?.data ?? []);
          this.schedulesLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => { this.schedulesLoading = false; this.cdr.detectChanges(); });
      }
    });
  }

  openCreateSchedule() {
    this.scheduleForm = this.emptyScheduleForm();
    this.showCreateScheduleDialog = true;
  }

  submitCreateSchedule() {
    if (!this.scheduleForm.assetId || !this.scheduleForm.frequencyValue || !this.scheduleForm.frequencyUnit) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Asset, frequency value and unit are required' });
      return;
    }
    this.savingSchedule = true;
    const payload = {
      ...this.scheduleForm,
      startDate: this.scheduleForm.startDate ? new Date(this.scheduleForm.startDate).toISOString() : null,
    };
    this.pmService.createSchedule(payload).subscribe({
      next: () => {
        setTimeout(() => {
          this.savingSchedule = false;
          this.showCreateScheduleDialog = false;
          this.messageService.add({ severity: 'success', summary: 'Created', detail: 'PM schedule created successfully' });
          this.loadSchedules();
          this.loadCalendar();
          this.cdr.detectChanges();
        });
      },
      error: (err: any) => {
        setTimeout(() => {
          this.savingSchedule = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to create schedule' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  getScheduleStatus(s: any): string {
    if (!s.isActive) return 'INACTIVE';
    const due = new Date(s.nextDueAt);
    const now = new Date();
    if (due < now) return 'OVERDUE';
    const daysUntil = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= (s.reminderDays || 7) ? 'UPCOMING' : 'ACTIVE';
  }

  getScheduleStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'UPCOMING': return 'warn';
      case 'OVERDUE': return 'danger';
      case 'INACTIVE': return 'secondary';
      default: return 'info';
    }
  }

  // ── History ──

  loadHistory() {
    this.historyLoading = true;
    this.pmService.getAllHistory({ page: 1, limit: 25 }).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.history = res.data || res;
          this.historyTotal = res.total || this.history.length;
          this.historyLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => { setTimeout(() => { this.historyLoading = false; this.cdr.detectChanges(); }); }
    });
  }

  getEventSeverity(status: string): "success" | "danger" | "warn" | "info" {
    switch (status?.toUpperCase()) {
      case 'COMPLETED': return 'success';
      case 'OVERDUE': return 'danger';
      case 'UPCOMING': return 'warn';
      default: return 'info';
    }
  }

  selectDay(cell: any) {
    if (!cell.day) return;
    if (this.selectedDay === cell.day) {
      this.selectedDay = null;
      this.selectedDayEvents = [];
    } else {
      this.selectedDay = cell.day;
      this.selectedDayEvents = cell.events || [];
    }
  }

  prevMonth() {
    if (this.currentMonth === 1) { this.currentMonth = 12; this.currentYear--; }
    else this.currentMonth--;
    this.selectedDay = null; this.selectedDayEvents = [];
    this.loadCalendar();
  }

  nextMonth() {
    if (this.currentMonth === 12) { this.currentMonth = 1; this.currentYear++; }
    else this.currentMonth++;
    this.selectedDay = null; this.selectedDayEvents = [];
    this.loadCalendar();
  }
}
