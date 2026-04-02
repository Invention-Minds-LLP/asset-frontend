import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { AnalyticsService } from '../../services/analytics/analytics';

@Component({
  selector: 'app-cfo-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TableModule, TagModule,
    ToastModule, SelectModule, TooltipModule,
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

  loadingDashboard = false;
  loadingTCO = false;
  loadingTurnover = false;
  loadingIdle = false;
  loadingAging = false;

  departmentId: number | null = null;

  constructor(
    private analytics: AnalyticsService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadDashboard();
    this.loadTCO();
    this.loadTurnover();
    this.loadIdleCapital();
    this.loadInStoreAging();
  }

  loadDashboard() {
    this.loadingDashboard = true;
    const filters: any = {};
    if (this.departmentId) filters.departmentId = this.departmentId;
    this.analytics.getCfoDashboard(filters).subscribe({
      next: (data: any) => {
        this.dashboard = data;
        this.loadingDashboard = false;
        setTimeout(() => this.cdr.detectChanges());
      },
      error: () => {
        this.loadingDashboard = false;
        setTimeout(() => this.cdr.detectChanges());
      }
    });
  }

  loadTCO() {
    this.loadingTCO = true;
    this.analytics.getTCO({ level: 'category' }).subscribe({
      next: (data: any) => {
        this.tcoData = Array.isArray(data) ? data : (data?.data ?? []);
        this.loadingTCO = false;
        setTimeout(() => this.cdr.detectChanges());
      },
      error: () => {
        this.loadingTCO = false;
        setTimeout(() => this.cdr.detectChanges());
      }
    });
  }

  loadTurnover() {
    this.loadingTurnover = true;
    this.analytics.getAssetTurnover().subscribe({
      next: (data: any) => {
        this.turnoverData = data;
        this.loadingTurnover = false;
        setTimeout(() => this.cdr.detectChanges());
      },
      error: () => {
        this.loadingTurnover = false;
        setTimeout(() => this.cdr.detectChanges());
      }
    });
  }

  loadIdleCapital() {
    this.loadingIdle = true;
    this.analytics.getIdleCapital().subscribe({
      next: (data: any) => {
        this.idleAssets = Array.isArray(data) ? data : (data?.data ?? []);
        this.loadingIdle = false;
        setTimeout(() => this.cdr.detectChanges());
      },
      error: () => {
        this.loadingIdle = false;
        setTimeout(() => this.cdr.detectChanges());
      }
    });
  }

  loadInStoreAging() {
    this.loadingAging = true;
    this.analytics.getInStoreAging().subscribe({
      next: (data: any) => {
        this.inStoreAging = Array.isArray(data) ? data : (data?.data ?? []);
        this.loadingAging = false;
        setTimeout(() => this.cdr.detectChanges());
      },
      error: () => {
        this.loadingAging = false;
        setTimeout(() => this.cdr.detectChanges());
      }
    });
  }

  get monthlySpend(): any[] {
    return this.dashboard?.monthlySpend ?? [];
  }

  get maxMonthlyTotal(): number {
    const totals = this.monthlySpend.map((m: any) => (m.capex ?? 0) + (m.opex ?? 0));
    return Math.max(...totals, 1);
  }

  get topPerformers(): any[] {
    return this.turnoverData?.top ?? [];
  }

  get bottomPerformers(): any[] {
    return this.turnoverData?.bottom ?? [];
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
