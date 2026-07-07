import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { AnalyticsService } from '../../services/analytics/analytics';
import { Auth } from '../../services/auth/auth';

interface ExpiryItem {
  type: string;
  assetDbId: number;
  assetId: string | null;
  assetName: string;
  branchId: number | null;
  branchName: string;
  dueDate: string;
  reference: string | null;
}

const MANAGEMENT_ROLES = ['ADMIN', 'CEO_COO', 'CFO', 'FINANCE', 'OPERATIONS'];
const SERIES = ['#2a78d6', '#1baf7a', '#eda100', '#008300', '#4a3aa7', '#e34948', '#e87ba4', '#eb6834'];
const GRADE_COLOR: Record<string, string> = { A: '#008300', B: '#2a78d6', C: '#eda100', D: '#e34948' };

const EXPIRY_TYPES: { key: string; label: string; icon: string }[] = [
  { key: 'WARRANTY',    label: 'Warranty',        icon: 'pi-verified' },
  { key: 'AMC_CMC',     label: 'AMC / CMC',       icon: 'pi-file-edit' },
  { key: 'INSURANCE',   label: 'Insurance',       icon: 'pi-shield' },
  { key: 'CALIBRATION', label: 'Calibration due', icon: 'pi-sliders-h' },
  { key: 'PM_DUE',      label: 'PM due',          icon: 'pi-calendar' },
  { key: 'LEASE_END',   label: 'Lease ending',    icon: 'pi-file' },
  { key: 'RENTAL_END',  label: 'Rental ending',   icon: 'pi-clock' },
];

const BUCKETS: { key: string; label: string }[] = [
  { key: 'overdue', label: 'Overdue' },
  { key: 'd30', label: '≤ 30 days' },
  { key: 'd60', label: '31–60 days' },
  { key: 'd90', label: '61–90 days' },
];

@Component({
  selector: 'app-head-office-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, DialogModule, TableModule, TagModule, TooltipModule],
  templateUrl: './head-office-dashboard.html',
  styleUrls: ['./head-office-dashboard.css'],
})
export class HeadOfficeDashboard implements OnInit, OnDestroy {
  authorized = true;
  loading = true;
  error = '';

  health: any = null;           // { branches, totals, months }
  items: ExpiryItem[] = [];     // full expiry list
  generatedAt: Date | null = null;

  expiryTypes = EXPIRY_TYPES;
  buckets = BUCKETS;

  // Radar scoping: null = all branches
  radarBranchId: number | null | 'unassigned' = null;

  // Cell drill-down dialog
  showCellDialog = false;
  cellTitle = '';
  cellItems: ExpiryItem[] = [];

  attention: { branch: string; severity: string; icon: string; text: string }[] = [];

  private refreshTimer: any = null;

  constructor(
    private analytics: AnalyticsService,
    private auth: Auth,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.authorized = MANAGEMENT_ROLES.includes(this.auth.getRole());
    if (!this.authorized) { this.loading = false; return; }
    this.load();
    this.refreshTimer = setInterval(() => this.load(true), 120_000);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  load(silent = false): void {
    if (!silent) this.loading = true;
    this.analytics.getHeadOffice().subscribe({
      next: (data) => {
        this.health = data.health || null;
        this.items = data.expiry?.items || [];
        this.generatedAt = data.generatedAt ? new Date(data.generatedAt) : new Date();
        this.buildAttention();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        if (err?.status === 403) this.authorized = false;
        else this.error = err?.error?.message || 'Failed to load head office dashboard';
        this.cdr.detectChanges();
      },
    });
  }

  // ── Branch helpers ────────────────────────────────────────────────────────

  get branches(): any[] { return (this.health?.branches || []).filter((b: any) => b.id != null); }
  get unassignedBranch(): any { return (this.health?.branches || []).find((b: any) => b.id == null) ?? null; }
  get totals(): any { return this.health?.totals || {}; }

  branchColor(b: any): string {
    const sorted = [...this.branches].sort((a, z) => a.id - z.id);
    return SERIES[sorted.findIndex(x => x.id === b.id) % SERIES.length];
  }
  gradeColor(g: string): string { return GRADE_COLOR[g] || '#9b9a95'; }

  ringDash(score: number): string {
    const C = 2 * Math.PI * 26;
    return `${((score / 100) * C).toFixed(1)} ${C.toFixed(1)}`;
  }

  down(b: any): number { return b?.workingMix?.['NOT_WORKING'] ?? 0; }

  // ── Expiry radar ──────────────────────────────────────────────────────────

  daysUntil(d: string): number {
    return Math.ceil((new Date(d).getTime() - Date.now()) / 86400_000);
  }

  private bucketOf(item: ExpiryItem): string {
    const days = this.daysUntil(item.dueDate);
    if (days < 0) return 'overdue';
    if (days <= 30) return 'd30';
    if (days <= 60) return 'd60';
    return 'd90';
  }

  private radarItems(): ExpiryItem[] {
    if (this.radarBranchId === null) return this.items;
    if (this.radarBranchId === 'unassigned') return this.items.filter(i => i.branchId == null);
    return this.items.filter(i => i.branchId === this.radarBranchId);
  }

  cellCount(type: string, bucket: string): number {
    return this.radarItems().filter(i => i.type === type && this.bucketOf(i) === bucket).length;
  }

  typeTotal(type: string): number {
    return this.radarItems().filter(i => i.type === type).length;
  }

  bucketTotal(bucket: string): number {
    return this.radarItems().filter(i => this.bucketOf(i) === bucket).length;
  }

  get overdueTotal(): number { return this.items.filter(i => this.bucketOf(i) === 'overdue').length; }
  get next30Total(): number { return this.items.filter(i => this.bucketOf(i) === 'd30').length; }

  openCell(type: { key: string; label: string }, bucket: { key: string; label: string }): void {
    const list = this.radarItems()
      .filter(i => i.type === type.key && this.bucketOf(i) === bucket.key)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    if (!list.length) return;
    this.cellItems = list;
    this.cellTitle = `${type.label} — ${bucket.label}`;
    this.showCellDialog = true;
  }

  setRadarBranch(id: number | null | 'unassigned'): void {
    this.radarBranchId = this.radarBranchId === id ? null : id;
  }

  typeLabel(key: string): string {
    return EXPIRY_TYPES.find(t => t.key === key)?.label ?? key;
  }

  // ── Attention feed ────────────────────────────────────────────────────────

  private buildAttention(): void {
    const out: any[] = [];
    for (const b of this.health?.branches || []) {
      if (b.slaBreached > 0) out.push({ branch: b.name, severity: 'critical', icon: 'pi-exclamation-triangle', text: `${b.slaBreached} open ticket${b.slaBreached > 1 ? 's' : ''} past SLA` });
      const down = this.down(b);
      if (down > 0) out.push({ branch: b.name, severity: 'critical', icon: 'pi-power-off', text: `${down} asset${down > 1 ? 's' : ''} not working` });
    }
    // Overdue expiries per branch
    const overdueByBranch = new Map<string, number>();
    for (const i of this.items) {
      if (this.bucketOf(i) !== 'overdue') continue;
      overdueByBranch.set(i.branchName, (overdueByBranch.get(i.branchName) ?? 0) + 1);
    }
    for (const [branch, n] of overdueByBranch) {
      out.push({ branch, severity: 'serious', icon: 'pi-calendar-times', text: `${n} coverage/schedule item${n > 1 ? 's' : ''} already lapsed` });
    }
    for (const b of this.health?.branches || []) {
      if (b.uncovered > 0) out.push({ branch: b.name, severity: 'warning', icon: 'pi-shield', text: `${b.uncovered} asset${b.uncovered > 1 ? 's' : ''} without warranty/AMC` });
    }
    const rank: any = { critical: 0, serious: 1, warning: 2 };
    this.attention = out.sort((a, b) => rank[a.severity] - rank[b.severity]).slice(0, 8);
  }

  // ── Formatting ────────────────────────────────────────────────────────────

  money(v: number): string {
    if (v == null) return '₹0';
    if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
    if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`;
    return `₹${Math.round(v).toLocaleString('en-IN')}`;
  }

  dueSeverity(d: string): 'danger' | 'warn' | 'secondary' {
    const days = this.daysUntil(d);
    if (days < 0) return 'danger';
    if (days <= 30) return 'warn';
    return 'secondary';
  }

  trackBranch(_: number, b: any) { return b.id; }
}
