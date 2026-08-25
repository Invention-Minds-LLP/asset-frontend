import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Assets } from '../../services/assets/assets';
import { environment } from '../../../environment/environment.prod';
import { HttpClient } from '@angular/common/http';
import { VizGauge } from '../../shared/viz/gauge';
import { VizDonut } from '../../shared/viz/donut';
import { VizBars } from '../../shared/viz/bars';
import { VizTrendLine } from '../../shared/viz/trend-line';
import { statusColor } from '../../shared/viz/viz-palette';

@Component({
  selector: 'app-hod-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule, TagModule, TooltipModule, DialogModule, ButtonModule, InputTextModule, VizGauge, VizDonut, VizBars, VizTrendLine],
  templateUrl: './hod-dashboard.html',
  styleUrl: './hod-dashboard.css',
})
export class HodDashboard implements OnInit {
  role = '';
  isAdmin = false;
  loading = false;
  departmentName = '';
  data: any = null;

  departments: any[] = [];
  selectedDeptId: number | null = null;

  // An HOD can answer for several departments, so the switcher is no longer
  // admin-only — it appears for anyone holding more than one.
  get showDeptSwitcher(): boolean { return this.isAdmin || this.departments.length > 1; }

  // KPI drill-down popup (server-paginated)
  showListDialog = false;
  listLoading = false;
  listTitle = '';
  listKey = '';
  listRows: any[] = [];
  listTotal = 0;
  listSearch = '';
  listPage = 1;
  listLimit = 20;
  private searchTimer: any;

  // Which KPIs support a drill-down list.
  private LIST_KEYS = new Set(['total', 'withSupervisor', 'withEndUser', 'fullyAssigned', 'withTarget', 'pending', 'noSupervisor', 'noEndUser', 'noTarget']);

  constructor(private assets: Assets, private http: HttpClient, private cdr: ChangeDetectorRef, private router: Router) {}

  ngOnInit(): void {
    this.role = ((typeof window !== 'undefined' && localStorage.getItem('role')) || '').toUpperCase();
    this.isAdmin = ['ADMIN', 'CEO_COO', 'OPERATIONS', 'FINANCE', 'CFO'].includes(this.role);
    const dept = typeof window !== 'undefined' ? localStorage.getItem('departmentId') : null;
    this.selectedDeptId = dept && dept !== 'null' ? Number(dept) : null;

    // Admins pick from every department; everyone else gets the ones they are
    // responsible for, which the dashboard response itself carries.
    if (this.isAdmin) {
      this.assets.getDepartments().subscribe({ next: (d: any) => setTimeout(() => { this.departments = d || []; this.cdr.markForCheck(); }) });
    }
    this.load();
  }

  load() {
    this.loading = true;
    const q = this.selectedDeptId ? `?departmentId=${this.selectedDeptId}` : '';
    this.http.get<any>(`${environment.apiUrl}/hod-dashboard${q}`).subscribe({
      next: (res) => setTimeout(() => {
        this.departmentName = res?.departmentName || '';
        this.data = res?.data || null;
        if (!this.isAdmin) this.departments = res?.departments || [];
        if (!this.selectedDeptId) this.selectedDeptId = res?.departmentId ?? null;
        this.loading = false;
        this.cdr.markForCheck();
      }),
      error: () => setTimeout(() => { this.loading = false; this.data = null; this.cdr.markForCheck(); }),
    });
  }

  onDeptChange() { this.load(); }
  go(route: string) { if (route) this.router.navigate([route]); }

  canDrill(k: any): boolean { return this.LIST_KEYS.has(k.key); }

  openKpi(k: any) {
    if (!this.canDrill(k)) return;
    this.listKey = k.key;
    this.listTitle = `${k.label} — ${this.departmentName}`;
    this.showListDialog = true;
    this.listSearch = '';
    this.listPage = 1;
    this.loadList();
  }

  private listParams(limit: number): string {
    const parts = [`key=${this.listKey}`, `page=${this.listPage}`, `limit=${limit}`];
    if (this.listSearch.trim()) parts.push(`search=${encodeURIComponent(this.listSearch.trim())}`);
    if (this.selectedDeptId) parts.push(`departmentId=${this.selectedDeptId}`);
    return parts.join('&');
  }

  loadList() {
    this.listLoading = true;
    this.listRows = [];
    this.http.get<any>(`${environment.apiUrl}/hod-dashboard/list?${this.listParams(this.listLimit)}`).subscribe({
      next: (res) => setTimeout(() => {
        this.listRows = res?.assets || [];
        this.listTotal = res?.total || 0;
        this.listLoading = false;
        this.cdr.markForCheck();
      }),
      error: () => setTimeout(() => { this.listLoading = false; this.cdr.markForCheck(); }),
    });
  }

  onListSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.listPage = 1; this.loadList(); }, 350);
  }

  get totalPages(): number { return Math.max(1, Math.ceil(this.listTotal / this.listLimit)); }
  get rangeStart(): number { return this.listTotal ? (this.listPage - 1) * this.listLimit + 1 : 0; }
  get rangeEnd(): number { return Math.min(this.listPage * this.listLimit, this.listTotal); }
  prevPage() { if (this.listPage > 1) { this.listPage--; this.loadList(); } }
  nextPage() { if (this.listPage < this.totalPages) { this.listPage++; this.loadList(); } }

  openAsset(assetId: string) { if (assetId) this.router.navigate(['/assets/edit', assetId]); }

  // Map an asset status to a status tone for the pill.
  statusTone(s: string): string {
    const v = (s || '').toUpperCase();
    if (v === 'ACTIVE') return 'good';
    if (v === 'IN_MAINTENANCE' || v === 'UNDER_OBSERVATION') return 'warning';
    if (['DISPOSED', 'SCRAPPED', 'CONDEMNED', 'RETIRED', 'REJECTED'].includes(v)) return 'critical';
    return 'info';
  }

  exportingCsv = false;
  exportListCsv() {
    // Pull all matching rows (up to 5000), not just the current page.
    this.exportingCsv = true;
    const savedPage = this.listPage; this.listPage = 1;
    const url = `${environment.apiUrl}/hod-dashboard/list?${this.listParams(5000)}`;
    this.listPage = savedPage;
    this.http.get<any>(url).subscribe({
      next: (res) => {
        const rows = res?.assets || [];
        const head = ['Asset ID', 'Name', 'Category', 'Status', 'Supervisor', 'End User', 'Target Dept'];
        const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const csv = [head.join(','), ...rows.map((r: any) => [r.assetId, r.assetName, r.category, r.status, r.supervisor, r.endUser, r.targetDept].map(esc).join(','))].join('\n');
        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        link.download = `${this.listTitle.replace(/[^a-z0-9]+/gi, '_')}.csv`; link.click();
        URL.revokeObjectURL(link.href);
        this.exportingCsv = false; this.cdr.markForCheck();
      },
      error: () => { this.exportingCsv = false; this.cdr.markForCheck(); },
    });
  }

  toneColor(t: string): string { return statusColor(t || 'info'); }
  urgencyColor(u: string): string { return statusColor(u === 'critical' ? 'critical' : u === 'warning' ? 'warning' : 'info'); }

  get kpis(): any[] { return this.data?.kpis || []; }
  get actions(): any[] { return (this.data?.actions || []).filter((a: any) => a.items?.length); }
}
