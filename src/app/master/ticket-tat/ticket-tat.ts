import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Ticketing } from '../../services/tickerting/ticketing';
import { Assets } from '../../services/assets/assets';
import { DurationPipe } from '../../pipes/duration.pipe';

@Component({
  selector: 'app-ticket-tat',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TableModule, TagModule,
    SelectModule, DatePickerModule, ToastModule, DurationPipe],
  templateUrl: './ticket-tat.html',
  styleUrl: './ticket-tat.css',
  providers: [MessageService]
})
export class TicketTat implements OnInit {
  loading = false;
  data: any = null;

  from: Date;
  to: Date = new Date();
  departmentId: number | null = null;
  departments: any[] = [];

  userRole = '';
  get isManagement() {
    return ['ADMIN', 'CEO_COO', 'FINANCE', 'CFO', 'OPERATIONS'].includes(this.userRole);
  }

  constructor(
    private ticketService: Ticketing,
    private assetService: Assets,
    private msg: MessageService,
    private cdr: ChangeDetectorRef
  ) {
    // Default window: the last 30 days of raised tickets.
    this.from = new Date(Date.now() - 30 * 86_400_000);
  }

  ngOnInit() {
    if (typeof window !== 'undefined' && localStorage) {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      this.userRole = (user?.role || '').toUpperCase();
    }
    if (this.isManagement) this.loadDepartments();
    this.load();
  }

  loadDepartments() {
    this.assetService.getDepartments().subscribe({
      next: (res: any[]) => {
        this.departments = [{ name: 'All Departments', id: null }, ...(res || [])];
        this.cdr.markForCheck();
      },
      error: () => { /* filter is optional — a failure here shouldn't block the page */ }
    });
  }

  load() {
    this.loading = true;
    this.ticketService.getTatAnalytics({
      from: this.from?.toISOString(),
      to: this.to?.toISOString(),
      departmentId: this.departmentId ?? undefined,
    }).subscribe({
      next: (res) => {
        this.data = res;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (e) => {
        this.loading = false;
        this.msg.add({ severity: 'error', summary: 'Error', detail: e?.error?.message || 'Failed to load analytics' });
        this.cdr.markForCheck();
      }
    });
  }

  // Width of the inline bar, relative to the slowest status in the set.
  barWidth(ms: number): string {
    const max = Math.max(...(this.data?.perStatus || []).map((s: any) => s.avgMs), 1);
    return `${Math.max(2, Math.round((ms / max) * 100))}%`;
  }

  statusLabel(status: string): string {
    if (!status) return 'Unknown';
    return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }

  // Anything sitting in one status beyond a day is worth a second look.
  stuckSeverity(ms: number): 'danger' | 'warn' | 'info' {
    const days = ms / 86_400_000;
    if (days >= 3) return 'danger';
    if (days >= 1) return 'warn';
    return 'info';
  }

  breachRate(): number {
    const s = this.data?.summary;
    if (!s?.tickets) return 0;
    return Math.round((s.breached / s.tickets) * 100);
  }
}
