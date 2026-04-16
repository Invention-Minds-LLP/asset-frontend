import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import { RouterLink } from '@angular/router';
import { AnalyticsService } from '../../services/analytics/analytics';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-coo-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink, ButtonModule, TableModule, TagModule,
    ToastModule, TooltipModule, SelectButtonModule, DatePickerModule,
  ],
  templateUrl: './coo-dashboard.html',
  styleUrl: './coo-dashboard.css',
  providers: [MessageService]
})
export class CooDashboard implements OnInit {
  data: any = null;
  loading = false;

  // Date range filter
  dateFrom: Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  dateTo: Date = new Date();

  // View toggle
  viewMode: 'operations' | 'financial' = 'operations';
  viewOptions = [
    { label: 'Operations', value: 'operations' },
    { label: 'Financial', value: 'financial' },
  ];

  // Health Alerts (Point 3)
  repeatTickets: any[] = [];
  slaBreachAlerts: any = null;

  constructor(
    private analytics: AnalyticsService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.loading = true;
    const filters: any = {};
    if (this.dateFrom) filters.dateFrom = this.dateFrom.toISOString();
    if (this.dateTo) filters.dateTo = this.dateTo.toISOString();

    forkJoin({
      dashboard: this.analytics.getCooDashboard(filters),
      repeatTickets: this.analytics.getRepeatTickets(),
      slaBreachAlerts: this.analytics.getSlaBreachAlerts(),
    }).subscribe({
      next: (res: any) => {
        this.data = res.dashboard;
        this.repeatTickets = res.repeatTickets ?? [];
        this.slaBreachAlerts = res.slaBreachAlerts ?? null;
        this.loading = false;
        setTimeout(() => this.cdr.detectChanges());
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load COO dashboard' });
        setTimeout(() => this.cdr.detectChanges());
      }
    });
  }

  applyDateFilter() {
    this.loadDashboard();
  }

  get fleet(): any { return this.data?.fleetHealth ?? {}; }
  get financial(): any { return this.data?.financialSummary ?? {}; }
  get tickets(): any { return this.data?.ticketOperations ?? {}; }
  get pm(): any { return this.data?.pmCompliance ?? {}; }
  get deptPerformance(): any[] { return this.data?.departmentPerformance ?? []; }
  get alerts(): any { return this.data?.criticalAlerts ?? {}; }

  get slaBreachRate(): number {
    const total = (this.tickets.resolvedTickets30d ?? 0) + (this.tickets.openTickets ?? 0);
    if (total === 0) return 0;
    return Math.round(((this.tickets.slaBreachedTickets ?? 0) / total) * 10000) / 100;
  }

  formatNum(value: number | null | undefined): string {
    if (value == null) return '0';
    return new Intl.NumberFormat('en-IN').format(value);
  }

  formatPct(value: number | null | undefined): string {
    if (value == null) return '0%';
    return value.toFixed(1) + '%';
  }

  formatHours(value: number | null | undefined): string {
    if (value == null || value === 0) return '0 hrs';
    if (value < 1) return (value * 60).toFixed(0) + ' min';
    return value.toFixed(1) + ' hrs';
  }

  formatDays(value: number | null | undefined): string {
    if (value == null || value === 0) return '0 days';
    return value.toFixed(1) + ' days';
  }

  getComplianceClass(): string {
    const pct = this.pm.pmCompliancePct ?? 100;
    if (pct >= 90) return 'good';
    if (pct >= 70) return 'warning';
    return 'critical';
  }

  getAlertClass(value: number): string {
    if (value === 0) return '';
    if (value >= 10) return 'alert-critical';
    return 'alert-warning';
  }

  formatCurrency(value: number | null | undefined): string {
    if (value == null || value === 0) return '\u20B90';
    return '\u20B9' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value);
  }
}
