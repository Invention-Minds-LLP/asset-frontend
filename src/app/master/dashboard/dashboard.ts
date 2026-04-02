import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TabViewModule } from 'primeng/tabview';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { MasterService } from '../../services/master/master';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule, ButtonModule, TagModule,
    TableModule, ToastModule, TabViewModule, DialogModule, SelectModule,
    TooltipModule, InputTextModule,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  providers: [MessageService]
})
export class Dashboard implements OnInit {
  loading = false;
  stats: any = {};
  ticketStatusBreakdown: any[] = [];
  assetsByCategory: any[] = [];
  recentTickets: any[] = [];
  recentAssets: any[] = [];
  expiryAlerts: any = {};
  expiryDays = 30;

  // Configurable recent limit
  recentLimit = 5;
  recentLimitOptions = [
    { label: '5 items', value: 5 },
    { label: '10 items', value: 10 },
    { label: '15 items', value: 15 },
    { label: '25 items', value: 25 },
  ];

  // Tile drill-down dialog
  showDrillDialog = false;
  drillTitle = '';
  drillData: any[] = [];
  drillColumns: { field: string; header: string }[] = [];
  drillLoading = false;

  constructor(
    private masterService: MasterService,
    private messageService: MessageService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
    this.loadExpiryAlerts();
  }

  loadDashboard() {
    this.loading = true;
    this.masterService.getDashboardStats(this.recentLimit).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.stats = res.summary || {};
          this.ticketStatusBreakdown = res.ticketStatusBreakdown || [];
          this.assetsByCategory = res.assetsByCategory || [];
          this.recentTickets = res.recentTickets || [];
          this.recentAssets = res.recentAssets || [];
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => { this.loading = false; this.cdr.detectChanges(); });
        this.toast('error', 'Failed to load dashboard');
      }
    });
  }

  onRecentLimitChange() {
    this.loadDashboard();
  }

  loadExpiryAlerts() {
    this.masterService.getExpiryAlerts(this.expiryDays).subscribe({
      next: (res) => {
        setTimeout(() => { this.expiryAlerts = res; this.cdr.detectChanges(); });
      },
      error: () => this.toast('error', 'Failed to load expiry alerts')
    });
  }

  // ── Tile Click → Drill-down ──

  onTileClick(type: string) {
    this.drillLoading = true;
    this.showDrillDialog = true;
    this.drillData = [];

    switch (type) {
      case 'totalAssets':
        this.drillTitle = 'All Assets';
        this.drillColumns = [
          { field: 'assetId', header: 'Asset ID' },
          { field: 'assetName', header: 'Name' },
          { field: 'status', header: 'Status' },
          { field: 'department', header: 'Department' },
          { field: 'category', header: 'Category' },
        ];
        this.drillData = this.recentAssets.map(a => ({
          assetId: a.assetId, assetName: a.assetName, status: a.status,
          department: a.department?.name || '—', category: a.assetCategory?.name || '—',
        }));
        this.drillLoading = false;
        break;

      case 'openTickets':
      case 'inProgress':
      case 'slaBreached':
        this.drillTitle = type === 'openTickets' ? 'Open Tickets' : type === 'inProgress' ? 'In Progress Tickets' : 'SLA Breached Tickets';
        this.drillColumns = [
          { field: 'ticketId', header: 'Ticket ID' },
          { field: 'asset', header: 'Asset' },
          { field: 'priority', header: 'Priority' },
          { field: 'status', header: 'Status' },
          { field: 'department', header: 'Department' },
          { field: 'createdAt', header: 'Created' },
        ];
        this.drillData = this.recentTickets
          .filter(t => {
            if (type === 'openTickets') return t.status === 'OPEN';
            if (type === 'inProgress') return t.status === 'IN_PROGRESS';
            if (type === 'slaBreached') return t.slaBreached;
            return true;
          })
          .map(t => ({
            ticketId: t.ticketId, asset: t.asset?.assetName || '—',
            priority: t.priority, status: t.status,
            department: t.department?.name || '—',
            createdAt: new Date(t.createdAt).toLocaleDateString('en-IN'),
          }));
        this.drillLoading = false;
        break;

      case 'assetsByCategory':
        this.drillTitle = 'Assets by Category';
        this.drillColumns = [
          { field: 'category', header: 'Category' },
          { field: 'count', header: 'Count' },
        ];
        this.drillData = [...this.assetsByCategory];
        this.drillLoading = false;
        break;

      case 'ticketBreakdown':
        this.drillTitle = 'Ticket Status Breakdown';
        this.drillColumns = [
          { field: 'status', header: 'Status' },
          { field: 'count', header: 'Count' },
        ];
        this.drillData = [...this.ticketStatusBreakdown];
        this.drillLoading = false;
        break;

      default:
        this.drillTitle = type;
        this.drillLoading = false;
        break;
    }
    this.cdr.detectChanges();
  }

  // ── CSV Export ──

  exportTableToCsv(data: any[], columns: { field: string; header: string }[], filename: string) {
    if (!data.length) {
      this.toast('warn', 'No data to export');
      return;
    }
    const headers = columns.map(c => c.header).join(',');
    const rows = data.map(row => columns.map(c => {
      const val = row[c.field] ?? '';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',')).join('\n');
    const csv = headers + '\n' + rows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.toast('success', `Exported ${data.length} rows`);
  }

  exportRecentTickets() {
    this.exportTableToCsv(
      this.recentTickets.map(t => ({
        ticketId: t.ticketId, asset: t.asset?.assetName, department: t.department?.name,
        priority: t.priority, status: t.status, created: new Date(t.createdAt).toLocaleDateString('en-IN'),
      })),
      [
        { field: 'ticketId', header: 'Ticket ID' }, { field: 'asset', header: 'Asset' },
        { field: 'department', header: 'Department' }, { field: 'priority', header: 'Priority' },
        { field: 'status', header: 'Status' }, { field: 'created', header: 'Created' },
      ],
      'recent_tickets'
    );
  }

  exportRecentAssets() {
    this.exportTableToCsv(
      this.recentAssets.map(a => ({
        assetId: a.assetId, name: a.assetName, category: a.assetCategory?.name,
        department: a.department?.name, status: a.status, created: new Date(a.createdAt).toLocaleDateString('en-IN'),
      })),
      [
        { field: 'assetId', header: 'Asset ID' }, { field: 'name', header: 'Name' },
        { field: 'category', header: 'Category' }, { field: 'department', header: 'Department' },
        { field: 'status', header: 'Status' }, { field: 'created', header: 'Created' },
      ],
      'recent_assets'
    );
  }

  exportDrillData() {
    this.exportTableToCsv(this.drillData, this.drillColumns, this.drillTitle.replace(/\s+/g, '_').toLowerCase());
  }

  exportExpiryAlerts() {
    const allAlerts: any[] = [];
    (this.expiryAlerts.expiringWarranties || []).forEach((w: any) => allAlerts.push({ type: 'Warranty', asset: w.asset?.assetName, date: w.warrantyEnd, provider: w.warrantyProvider || '—' }));
    (this.expiryAlerts.expiringInsurance || []).forEach((i: any) => allAlerts.push({ type: 'Insurance', asset: i.asset?.assetName, date: i.endDate, provider: i.provider || '—' }));
    (this.expiryAlerts.dueCalibrations || []).forEach((c: any) => allAlerts.push({ type: 'Calibration', asset: c.asset?.assetName, date: c.nextDueAt, provider: c.vendor?.name || '—' }));
    this.exportTableToCsv(allAlerts,
      [{ field: 'type', header: 'Type' }, { field: 'asset', header: 'Asset' }, { field: 'date', header: 'Expiry/Due Date' }, { field: 'provider', header: 'Provider' }],
      'expiry_alerts'
    );
  }

  // ── Helpers ──

  getSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const map: Record<string, any> = {
      OPEN: 'info', ASSIGNED: 'info', IN_PROGRESS: 'warn', WORK_COMPLETED: 'success',
      RESOLVED: 'success', CLOSED: 'secondary', TERMINATED: 'danger', ON_HOLD: 'warn', REJECTED: 'danger',
    };
    return map[status] ?? 'secondary';
  }

  toast(severity: 'success' | 'error' | 'warn', detail: string) {
    this.messageService.add({ severity, summary: severity.toUpperCase(), detail });
  }

  navigate(path: string) {
    this.router.navigate([path]);
  }
}
