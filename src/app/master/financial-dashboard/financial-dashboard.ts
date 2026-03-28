import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TreeTableModule } from 'primeng/treetable';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { PanelModule } from 'primeng/panel';
import { TabViewModule } from 'primeng/tabview';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService, TreeNode } from 'primeng/api';
import { FinancialDashboardService } from '../../services/financial-dashboard/financial-dashboard';

@Component({
  selector: 'app-financial-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    ButtonModule, CardModule, DropdownModule, SelectButtonModule,
    TableModule, TreeTableModule, TagModule, ToastModule,
    PanelModule, TabViewModule, TooltipModule, ProgressSpinnerModule,
  ],
  templateUrl: './financial-dashboard.html',
  styleUrl: './financial-dashboard.css',
  providers: [MessageService],
})
export class FinancialDashboard implements OnInit {
  // ── Filter Options ───────────────────────────────────────────────────────
  departments: any[] = [];
  categories: any[] = [];
  branches: any[] = [];
  vendors: any[] = [];
  financialYears: any[] = [];
  procurementModes: any[] = [];
  assetStatuses: any[] = [];

  // ── Filter State ─────────────────────────────────────────────────────────
  filters: any = {
    departmentId: null,
    categoryId: null,
    branchId: null,
    vendorId: null,
    status: null,
    modeOfProcurement: null,
    fyStart: null,
    fyEnd: null,
  };

  // ── View Options ─────────────────────────────────────────────────────────
  viewOptions = [
    { label: 'Purchase Cost', value: 'purchase' },
    { label: 'Maintenance Cost', value: 'maintenance' },
    { label: 'Insurance Premiums', value: 'insurance' },
    { label: 'AMC/CMC Cost', value: 'amc_cmc' },
    { label: 'Depreciation', value: 'depreciation' },
    { label: 'Total Cost', value: 'total_cost' },
  ];
  selectedView = 'purchase';

  // ── Data ─────────────────────────────────────────────────────────────────
  summary: any = {};
  fyTreeData: TreeNode[] = [];
  loading = false;
  filtersLoading = true;
  treeLoading = false;

  // Asset detail when month is expanded
  expandedMonthAssets: Map<string, any[]> = new Map();
  expandedMonthPagination: Map<string, any> = new Map();
  expandedMonthLoading: Set<string> = new Set();

  // Role context
  userRole = '';
  userDepartmentId: number | null = null;

  constructor(
    private financialService: FinancialDashboardService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadUserContext();
    this.loadFilterOptions();
  }

  private loadUserContext() {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.userRole = payload.role || '';
        this.userDepartmentId = payload.departmentId || null;

        // Lock department for HOD
        if (this.userRole === 'HOD' && this.userDepartmentId) {
          this.filters.departmentId = this.userDepartmentId;
        }
      }
    } catch {}
  }

  loadFilterOptions() {
    this.filtersLoading = true;
    this.financialService.getFilterOptions().subscribe({
      next: (res) => {
        setTimeout(() => {
          this.departments = res.departments.map((d: any) => ({ label: d.name, value: d.id }));
          this.categories = res.categories.map((c: any) => ({ label: c.name, value: c.id }));
          this.branches = res.branches.map((b: any) => ({ label: b.name, value: b.id }));
          this.vendors = res.vendors.map((v: any) => ({ label: v.name, value: v.id }));
          this.financialYears = res.financialYears || [];
          this.procurementModes = res.procurementModes || [];
          this.assetStatuses = res.assetStatuses || [];
          this.filtersLoading = false;
          this.cdr.detectChanges();

          // Auto-load data
          this.applyFilters();
        });
      },
      error: () => {
        this.filtersLoading = false;
        this.toast('error', 'Failed to load filter options');
      },
    });
  }

  applyFilters() {
    this.loading = true;
    this.treeLoading = true;
    this.expandedMonthAssets.clear();
    this.expandedMonthPagination.clear();

    const params = { ...this.filters, view: this.selectedView };

    // Parallel load summary + FY tree
    this.financialService.getFinancialSummary(this.filters).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.summary = res;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => { this.loading = false; this.cdr.detectChanges(); });
        this.toast('error', 'Failed to load summary');
      },
    });

    this.financialService.getFYBreakdown(params).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.fyTreeData = this.transformToTreeNodes(res.financialYears || []);
          this.treeLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => { this.treeLoading = false; this.cdr.detectChanges(); });
        this.toast('error', 'Failed to load FY breakdown');
      },
    });
  }

  onViewChange() {
    this.applyFilters();
  }

  resetFilters() {
    this.filters = {
      departmentId: this.userRole === 'HOD' ? this.userDepartmentId : null,
      categoryId: null,
      branchId: null,
      vendorId: null,
      status: null,
      modeOfProcurement: null,
      fyStart: null,
      fyEnd: null,
    };
    this.applyFilters();
  }

  // ── Tree Node Transform ──────────────────────────────────────────────────

  private transformToTreeNodes(financialYears: any[]): TreeNode[] {
    return financialYears.map((fy) => ({
      data: {
        label: `FY ${fy.fy}`,
        total: fy.total,
        assetCount: fy.assetCount,
        level: 'fy',
        fyStartYear: fy.fyStartYear,
      },
      children: fy.quarters.map((q: any) => ({
        data: {
          label: `${q.quarter} (${q.label})`,
          total: q.total,
          assetCount: q.assetCount,
          level: 'quarter',
        },
        children: q.months.map((m: any) => ({
          data: {
            label: m.label,
            total: m.total,
            assetCount: m.assetCount,
            level: 'month',
            month: m.month,
            year: m.year,
          },
          children: [], // lazy loaded
          leaf: false,
        })),
      })),
    }));
  }

  onNodeExpand(event: any) {
    const node = event.node;
    if (node.data.level === 'month' && node.data.assetCount > 0) {
      const key = `${node.data.year}-${node.data.month}`;
      if (this.expandedMonthAssets.has(key)) {
        // Already loaded
        node.children = this.buildAssetChildNodes(this.expandedMonthAssets.get(key)!);
        return;
      }
      this.loadMonthlyAssets(node, key, 1);
    }
  }

  loadMonthlyAssets(node: TreeNode, key: string, page: number) {
    this.expandedMonthLoading.add(key);
    this.financialService.getMonthlyAssets({
      ...this.filters,
      year: node.data.year,
      month: node.data.month,
      page,
      limit: 25,
    }).subscribe({
      next: (res) => {
        setTimeout(() => {
          const assets = res.assets || [];
          this.expandedMonthAssets.set(key, assets);
          this.expandedMonthPagination.set(key, res.pagination);
          node.children = this.buildAssetChildNodes(assets);
          if (res.pagination.total > 25) {
            // Add a "load more" pseudo node
            node.children.push({
              data: {
                label: `Showing ${assets.length} of ${res.pagination.total} — Click to load more`,
                level: 'load_more',
                nodeRef: node,
                key,
                nextPage: page + 1,
                total: 0,
                assetCount: 0,
              },
              leaf: true,
            });
          }
          this.expandedMonthLoading.delete(key);
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.expandedMonthLoading.delete(key);
        this.toast('error', 'Failed to load assets for this month');
      },
    });
  }

  private buildAssetChildNodes(assets: any[]): TreeNode[] {
    return assets.map((a) => ({
      data: {
        label: `${a.assetId} - ${a.assetName}`,
        total: a.purchaseCost,
        assetCount: null,
        level: 'asset',
        asset: a,
      },
      leaf: true,
    }));
  }

  onLoadMore(rowData: any) {
    if (rowData.level === 'load_more') {
      this.loadMonthlyAssets(rowData.nodeRef, rowData.key, rowData.nextPage);
    }
  }

  isMonthLoading(node: any): boolean {
    if (node.data?.level === 'month') {
      return this.expandedMonthLoading.has(`${node.data.year}-${node.data.month}`);
    }
    return false;
  }

  // ── Chart Data ───────────────────────────────────────────────────────────

  get categoryChartLabels(): string[] {
    return (this.summary.costByCategory || []).map((c: any) => c.category);
  }

  get categoryChartValues(): number[] {
    return (this.summary.costByCategory || []).map((c: any) => c.total);
  }

  get departmentChartLabels(): string[] {
    return (this.summary.costByDepartment || []).map((d: any) => d.department);
  }

  get departmentChartValues(): number[] {
    return (this.summary.costByDepartment || []).map((d: any) => d.total);
  }

  get procurementChartLabels(): string[] {
    return (this.summary.costByProcurement || []).map((p: any) => p.mode);
  }

  get procurementChartValues(): number[] {
    return (this.summary.costByProcurement || []).map((p: any) => p.total);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  formatCurrency(value: number): string {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  }

  formatNumber(value: number): string {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('en-IN').format(value);
  }

  getRowClass(node: any): string {
    switch (node.data?.level) {
      case 'fy': return 'row-fy';
      case 'quarter': return 'row-quarter';
      case 'month': return 'row-month';
      case 'asset': return 'row-asset';
      case 'load_more': return 'row-load-more';
      default: return '';
    }
  }

  getProcurementSeverity(mode: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
    const map: Record<string, any> = {
      PURCHASE: 'info',
      DONATION: 'success',
      LEASE: 'warn',
      RENTAL: 'danger',
    };
    return map[mode] || 'secondary';
  }

  getMonthLabel(key: string): string {
    const [yr, mo] = key.split('-').map(Number);
    const months = ['', 'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[mo]} ${yr}`;
  }

  toast(severity: string, detail: string) {
    this.messageService.add({ severity, summary: severity === 'error' ? 'Error' : 'Info', detail, life: 3000 });
  }
}
