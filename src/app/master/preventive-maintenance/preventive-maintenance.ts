import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TabViewModule } from 'primeng/tabview';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { PreventiveMaintenanceService } from '../../services/preventive-maintenance/preventive-maintenance';

@Component({
  selector: 'app-preventive-maintenance',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TableModule, TagModule, ToastModule, TabViewModule, SelectModule],
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

  // History
  history: any[] = [];
  historyLoading = false;
  historyTotal = 0;

  constructor(
    private pmService: PreventiveMaintenanceService,
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

  ngOnInit() {
    this.loadCalendar();
  }

  onTabChange(event: any) {
    this.activeTab = event.index;
    if (event.index === 1 && !this.history.length) this.loadHistory();
  }

  loadCalendar() {
    this.calendarLoading = true;
    this.pmService.getCalendar(this.currentMonth, this.currentYear).subscribe({
      next: (events) => {
        setTimeout(() => {
          this.calendarEvents = events || [];
          this.buildCalendarGrid();
          this.calendarLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => { this.calendarLoading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load calendar' }); this.cdr.detectChanges(); });
      }
    });
  }

  buildCalendarGrid() {
    const daysCount = new Date(this.currentYear, this.currentMonth, 0).getDate();
    const firstDay = new Date(this.currentYear, this.currentMonth - 1, 1).getDay();
    this.daysInMonth = [];

    // Empty cells for alignment
    for (let i = 0; i < firstDay; i++) this.daysInMonth.push({ day: null, events: [] });

    for (let d = 1; d <= daysCount; d++) {
      const dateStr = `${this.currentYear}-${String(this.currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayEvents = this.calendarEvents.filter(e => e.scheduledDate?.startsWith(dateStr));
      this.daysInMonth.push({ day: d, events: dayEvents });
    }
  }

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

  prevMonth() {
    if (this.currentMonth === 1) { this.currentMonth = 12; this.currentYear--; }
    else this.currentMonth--;
    this.loadCalendar();
  }

  nextMonth() {
    if (this.currentMonth === 12) { this.currentMonth = 1; this.currentYear++; }
    else this.currentMonth++;
    this.loadCalendar();
  }
}
