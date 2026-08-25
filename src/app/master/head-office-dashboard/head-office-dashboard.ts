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
  assetValue?: number;
}

const MANAGEMENT_ROLES = ['ADMIN', 'CEO_COO', 'CFO', 'FINANCE', 'OPERATIONS'];
const SERIES = ['#2a78d6', '#1baf7a', '#eda100', '#008300', '#4a3aa7', '#e34948', '#e87ba4', '#eb6834'];
const GRADE_COLOR: Record<string, string> = { A: '#008300', B: '#2a78d6', C: '#eda100', D: '#e34948' };

const EXPIRY_TYPES: { key: string; label: string; icon: string; route: string }[] = [
  { key: 'WARRANTY',    label: 'Warranty',        icon: 'pi-verified',  route: '/warranty-management' },
  { key: 'AMC_CMC',     label: 'AMC / CMC',       icon: 'pi-file-edit', route: '/service-contracts' },
  { key: 'INSURANCE',   label: 'Insurance',       icon: 'pi-shield',    route: '/insurance-management' },
  { key: 'CALIBRATION', label: 'Calibration due', icon: 'pi-sliders-h', route: '/calibration' },
  { key: 'PM_DUE',      label: 'PM due',          icon: 'pi-calendar',  route: '/preventive-maintenance' },
  { key: 'LEASE_END',   label: 'Lease ending',    icon: 'pi-file',      route: '/assets/view' },
  { key: 'RENTAL_END',  label: 'Rental ending',   icon: 'pi-clock',     route: '/assets/view' },
];

// Coverage types whose lapse puts asset value at risk (vs. schedule types)
const COVERAGE_TYPES = ['WARRANTY', 'AMC_CMC', 'INSURANCE'];

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
  activity: any[] = [];         // cross-branch activity feed
  moneyList: any[] = [];        // replace-vs-repair candidates
  leakage: any = null;          // { warrantyLeak, idleCapital, repeatOffenders }
  criticalDown: any[] = [];     // critical equipment currently down
  capexForecast: any = null;    // next-FY per-branch forecast
  idleUnassigned: any = null;   // IN_STORE, no department, >100 days
  posLast30: any = null;        // purchase orders raised in last 30 days
  newAdditions30: any = null;   // assets + inventory added in last 30 days
  unprotectedCritical: any = null; // critical assets with no cover at all
  slaBreach: any = null;        // { total, l3, items }
  approval35: any = null;       // maintenance ≥35% — needs mgmt approval
  lifetime50: any = null;       // age ≥50% of expected life
  vendorAccountability: any[] = []; // repair cost/volume per vendor
  fyPurchases: any = null;      // assets bought + inventory added this FY
  eolNextFy: any = null;        // assets reaching end-of-life during next FY
  briefing: { severity: string; icon: string; text: string }[] = [];
  briefingCopied = false;
  showLeakDialog = false;       // warranty-leak drill-down
  generatedAt: Date | null = null;

  // KPI tile / card drill-down dialog
  showTileDialog = false;
  tileKind = '';
  tileTitle = '';

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
        this.activity = data.activity || [];
        this.moneyList = data.moneyList || [];
        this.leakage = data.leakage || null;
        this.criticalDown = data.criticalDown || [];
        this.capexForecast = data.capexForecast || null;
        this.idleUnassigned = data.idleUnassigned || { count: 0, value: 0, items: [] };
        this.posLast30 = data.posLast30 || { count: 0, value: 0, items: [] };
        this.newAdditions30 = data.newAdditions30 || { assetCount: 0, assetValue: 0, inventoryCount: 0, items: [] };
        this.unprotectedCritical = data.unprotectedCritical || { count: 0, items: [] };
        this.slaBreach = data.slaBreach || { total: 0, l3: 0, items: [] };
        this.approval35 = data.approval35 || { count: 0, items: [] };
        this.lifetime50 = data.lifetime50 || { count: 0, items: [] };
        this.vendorAccountability = data.vendorAccountability || [];
        this.fyPurchases = data.fyPurchases || { fyLabel: '', assetCount: 0, assetValue: 0, inventoryCount: 0, items: [] };
        this.eolNextFy = data.eolNextFy || { fyLabel: '', count: 0, value: 0, items: [] };
        this.generatedAt = data.generatedAt ? new Date(data.generatedAt) : new Date();
        this.buildAttention();
        this.buildBriefing();
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

  /** ₹ of asset value whose COVERAGE (warranty/AMC/insurance) is lapsed or lapsing ≤30d.
   *  De-duplicated per asset so one asset with 3 lapsing covers counts once. */
  get valueAtRisk(): number {
    const seen = new Set<number>();
    let sum = 0;
    for (const i of this.items) {
      if (!COVERAGE_TYPES.includes(i.type)) continue;
      const b = this.bucketOf(i);
      if (b !== 'overdue' && b !== 'd30') continue;
      if (seen.has(i.assetDbId)) continue;
      seen.add(i.assetDbId);
      sum += Number(i.assetValue ?? 0);
    }
    return sum;
  }

  /** ₹ value behind a radar cell (sum of underlying assets' purchase cost). */
  cellValue(type: string, bucket: string): number {
    return this.radarItems()
      .filter(i => i.type === type && this.bucketOf(i) === bucket)
      .reduce((s, i) => s + Number(i.assetValue ?? 0), 0);
  }

  /** Per-branch overdue schedule counts for the health cards. */
  branchOverdue(b: any, types: string[]): number {
    return this.items.filter(i =>
      i.branchId === b.id && types.includes(i.type) && this.bucketOf(i) === 'overdue').length;
  }

  typeRoute(key: string): string {
    return EXPIRY_TYPES.find(t => t.key === key)?.route ?? '/assets/view';
  }

  // ── 12-month additions trend (multi-line, one per branch) ─────────────────

  linePoints(b: any): string {
    const W = 640, H = 180, PAD = 8;
    const max = Math.max(1, ...this.branches.flatMap((x: any) => (x.monthly || []).map((m: any) => m.count)));
    const monthly = b.monthly || [];
    return monthly
      .map((m: any, i: number) => {
        const x = PAD + (i / Math.max(monthly.length - 1, 1)) * (W - PAD * 2);
        const y = H - PAD - (m.count / max) * (H - PAD * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  lineDots(b: any): { x: number; y: number; m: any }[] {
    const W = 640, H = 180, PAD = 8;
    const max = Math.max(1, ...this.branches.flatMap((x: any) => (x.monthly || []).map((m: any) => m.count)));
    const monthly = b.monthly || [];
    return monthly.map((m: any, i: number) => ({
      x: PAD + (i / Math.max(monthly.length - 1, 1)) * (W - PAD * 2),
      y: H - PAD - (m.count / max) * (H - PAD * 2),
      m,
    }));
  }

  monthLabel(ym: string): string {
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleString('en-IN', { month: 'short' });
  }

  // ── Activity feed helpers ─────────────────────────────────────────────────

  activityIcon(kind: string): string {
    switch (kind) {
      case 'ASSET_ADDED': return 'pi-plus-circle';
      case 'TRANSFER': return 'pi-arrows-h';
      case 'TICKET': return 'pi-wrench';
      case 'DISPOSAL': return 'pi-trash';
      default: return 'pi-circle';
    }
  }

  relTime(at: string): string {
    const mins = Math.round((Date.now() - new Date(at).getTime()) / 60000);
    if (mins < 60) return `${Math.max(mins, 1)}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.round(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  }

  /** Download the (branch-scoped) expiry list as CSV. */
  exportExpiryCsv(): void {
    const rows = this.radarItems().map(i => ({
      Type: this.typeLabel(i.type),
      AssetID: i.assetId ?? '',
      AssetName: i.assetName,
      Branch: i.branchName,
      DueDate: new Date(i.dueDate).toISOString().split('T')[0],
      Days: this.daysUntil(i.dueDate),
      AssetValue: i.assetValue ?? 0,
      Reference: i.reference ?? '',
    }));
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const esc = (v: any) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => esc((r as any)[h])).join(','))].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'expiry-radar.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

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

  // ── Portfolio charts (SVG donut + bars, all client-side) ─────────────────

  /** Donut segments: gross value share per branch — top 5 branches + "Others"
   *  so the chart stays readable with any number of branches. r=54 → C≈339.29 */
  get valueDonut(): { color: string; dash: string; offset: number; name: string; pct: number; value: number }[] {
    const C = 2 * Math.PI * 54;
    const total = Math.max(this.branches.reduce((s: number, b: any) => s + (b.grossValue || 0), 0), 1);

    const sorted = [...this.branches].sort((a: any, z: any) => (z.grossValue || 0) - (a.grossValue || 0));
    const top = sorted.slice(0, 5).map((b: any) => ({
      name: b.name, value: b.grossValue || 0, color: this.branchColor(b),
    }));
    const restValue = sorted.slice(5).reduce((s: number, b: any) => s + (b.grossValue || 0), 0);
    if (restValue > 0) top.push({ name: `Others (${sorted.length - 5})`, value: restValue, color: '#9b9a95' });

    let acc = 0;
    return top.map((e) => {
      const frac = e.value / total;
      const seg = {
        color: e.color,
        dash: `${(frac * C).toFixed(2)} ${C.toFixed(2)}`,
        offset: -acc * C,
        name: e.name,
        pct: Math.round(frac * 100),
        value: e.value,
      };
      acc += frac;
      return seg;
    });
  }

  // ── KPI tile popups ───────────────────────────────────────────────────────

  private static readonly TILE_META: Record<string, { title: string; view: string | null }> = {
    branches:    { title: 'Branches', view: '/financial-dashboard' },
    assets:      { title: 'Assets by branch', view: '/assets/view' },
    value:       { title: 'Gross value by branch', view: '/financial-dashboard' },
    idle:        { title: 'Idle in store > 100 days (no department)', view: '/assets/view' },
    expiring:    { title: 'Expiring within 30 days (incl. already lapsed)', view: '/warranty-management' },
    risk:        { title: 'Assets losing coverage ≤ 30 days', view: '/warranty-management' },
    pos:         { title: 'Purchase orders — last 30 days', view: '/purchase-orders' },
    additions:   { title: 'New additions — last 30 days', view: '/assets/view' },
    fybuy:       { title: 'Assets bought this financial year', view: '/assets/view' },
    eolnext:     { title: 'Reaching end-of-life next financial year', view: '/assets/view' },
    repeat:      { title: 'Repeat issues (same problem 3+ times in 90 days)', view: '/ticket/view' },
    unprotected: { title: 'Critical assets with NO protection', view: '/assets/view' },
    sla:         { title: 'SLA-breached open tickets', view: '/ticket/view' },
  };

  openTile(kind: string): void {
    this.tileKind = kind;
    this.tileTitle = HeadOfficeDashboard.TILE_META[kind]?.title ?? '';
    this.showTileDialog = true;
  }

  get tileViewRoute(): string | null {
    return HeadOfficeDashboard.TILE_META[this.tileKind]?.view ?? null;
  }

  /** Items lapsing/lapsed within 30 days — coverage AND schedules. */
  get expiring30Items(): ExpiryItem[] {
    return this.items
      .filter(i => ['overdue', 'd30'].includes(this.bucketOf(i)))
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }

  /** Coverage items (warranty/AMC/insurance) lapsed or lapsing ≤30d — the value-at-risk list. */
  get riskItems(): ExpiryItem[] {
    return this.expiring30Items.filter(i => COVERAGE_TYPES.includes(i.type));
  }

  /** Org-wide top categories (top 6 + Other), aggregated from per-branch lists. */
  get categoryBars(): { name: string; count: number; pct: number }[] {
    const agg = new Map<string, number>();
    for (const b of this.branches) {
      for (const c of b.topCategories || []) {
        agg.set(c.name, (agg.get(c.name) ?? 0) + c.count);
      }
    }
    const sorted = [...agg.entries()].map(([name, count]) => ({ name, count }))
      .sort((a, z) => z.count - a.count);
    const top = sorted.filter(c => c.name !== 'Other').slice(0, 6);
    const other = sorted.filter(c => c.name === 'Other').reduce((s, c) => s + c.count, 0)
      + sorted.filter(c => c.name !== 'Other').slice(6).reduce((s, c) => s + c.count, 0);
    if (other > 0) top.push({ name: 'Other', count: other });
    const max = Math.max(...top.map(c => c.count), 1);
    return top.map(c => ({ ...c, pct: Math.max((c.count / max) * 100, 2) }));
  }

  /** Org-wide status mix bars. */
  get statusBars(): { status: string; count: number; pct: number; color: string }[] {
    const SERIES_LOCAL = ['#2a78d6', '#1baf7a', '#eda100', '#008300', '#4a3aa7', '#e34948'];
    const ORDER = ['ACTIVE', 'IN_STORE', 'IN_MAINTENANCE', 'RETIRED'];
    const agg = new Map<string, number>();
    for (const b of this.health?.branches || []) {
      for (const [s, n] of Object.entries(b.statusMix || {})) {
        agg.set(s, (agg.get(s) ?? 0) + Number(n));
      }
    }
    const keys = [...ORDER.filter(s => agg.has(s)), ...[...agg.keys()].filter(s => !ORDER.includes(s))];
    const max = Math.max(...keys.map(k => agg.get(k) ?? 0), 1);
    return keys.map((s, i) => ({
      status: s,
      count: agg.get(s) ?? 0,
      pct: Math.max(((agg.get(s) ?? 0) / max) * 100, 2),
      color: SERIES_LOCAL[i % SERIES_LOCAL.length],
    }));
  }

  // ── Executive briefing — deterministic, rule-generated narrative ──────────

  private buildBriefing(): void {
    const out: { severity: string; icon: string; text: string }[] = [];
    const branches = this.branches;

    // 1. Critical equipment down — always leads if present
    if (this.criticalDown.length) {
      const life = this.criticalDown.filter(c => c.criticality === 'LIFE_SUPPORT').length;
      out.push({
        severity: 'critical', icon: 'pi-power-off',
        text: `${this.criticalDown.length} critical asset${this.criticalDown.length > 1 ? 's are' : ' is'} down right now` +
              (life ? ` — ${life} of them life-support class` : '') +
              ` (${[...new Set(this.criticalDown.map(c => c.branchName))].join(', ')}). Immediate attention needed.`,
      });
    }

    // 2. SLA breaches — with L3/critical-priority emphasis
    if (this.slaBreach?.total > 0) {
      const l3 = this.slaBreach.l3;
      out.push({
        severity: 'critical', icon: 'pi-exclamation-triangle',
        text: `${this.slaBreach.total} open ticket${this.slaBreach.total > 1 ? 's have' : ' has'} breached SLA` +
              (l3 > 0 ? ` — ${l3} of them L3/critical priority.` : '.'),
      });
    }

    // 2b. Critical assets with no protection at all
    if (this.unprotectedCritical?.count > 0) {
      out.push({
        severity: 'critical', icon: 'pi-shield',
        text: `${this.unprotectedCritical.count} critical asset${this.unprotectedCritical.count > 1 ? 's have' : ' has'} NO warranty, no AMC/CMC and no internal-service arrangement — completely unprotected.`,
      });
    }

    // 3. Coverage value at risk
    if (this.valueAtRisk > 0) {
      out.push({
        severity: 'serious', icon: 'pi-shield',
        text: `${this.money(this.valueAtRisk)} of equipment loses warranty/AMC/insurance cover within 30 days — renew before it lapses.`,
      });
    }

    // 4. Replace-vs-repair burn
    if (this.moneyList.length) {
      const top3Burn = this.moneyList.slice(0, 3).reduce((s, m) => s + (m.annualBurn || 0), 0);
      out.push({
        severity: 'serious', icon: 'pi-sync',
        text: `${this.moneyList.length} asset${this.moneyList.length > 1 ? 's have' : ' has'} lifetime maintenance ≥ 50% of purchase cost — replacing the top ${Math.min(3, this.moneyList.length)} avoids ≈ ${this.money(top3Burn)}/yr in upkeep.`,
      });
    }

    // 5. Management approval threshold (35% maintenance-to-cost)
    if (this.approval35?.count > 0) {
      out.push({
        severity: 'serious', icon: 'pi-verified',
        text: `${this.approval35.count} asset${this.approval35.count > 1 ? 's have' : ' has'} crossed 35% maintenance-to-cost — per policy, further services on them need management approval (management is notified daily).`,
      });
    }

    // 5b. Lifetime crossing 50%
    if (this.lifetime50?.count > 0) {
      out.push({
        severity: 'warning', icon: 'pi-hourglass',
        text: `${this.lifetime50.count} asset${this.lifetime50.count > 1 ? 's have' : ' has'} used more than half of expected useful life — start replacement planning.`,
      });
    }

    // 6. Idle capital (in-store, unassigned, >100 days)
    if (this.idleUnassigned?.value > 0) {
      out.push({
        severity: 'warning', icon: 'pi-box',
        text: `${this.money(this.idleUnassigned.value)} (${this.idleUnassigned.count} asset${this.idleUnassigned.count > 1 ? 's' : ''}) has been in store for over 100 days without a department — deploy or redistribute.`,
      });
    }

    // 7. Repeat same-issue offenders
    if (this.leakage?.repeatOffenders?.length) {
      const worst = this.leakage.repeatOffenders[0];
      out.push({
        severity: 'warning', icon: 'pi-replay',
        text: `${this.leakage.repeatOffenders.length} asset${this.leakage.repeatOffenders.length > 1 ? 's' : ''} had the SAME issue 3+ times in 90 days — worst: ${worst.assetId} ("${worst.issueType}" ×${worst.tickets}, ${this.money(worst.spend)}). Consider condemnation review.`,
      });
    }

    // 8. This month's additions (from the 12-month series)
    const thisMonth = branches
      .map(b => ({ b, m: (b.monthly || [])[Math.max((b.monthly || []).length - 1, 0)] }))
      .filter(x => x.m && x.m.count > 0);
    if (thisMonth.length) {
      const totalCount = thisMonth.reduce((s, x) => s + x.m.count, 0);
      const totalVal = thisMonth.reduce((s, x) => s + (x.m.value || 0), 0);
      const top = [...thisMonth].sort((a, z) => (z.m.value || 0) - (a.m.value || 0))[0];
      out.push({
        severity: 'info', icon: 'pi-plus-circle',
        text: `This month ${totalCount} asset${totalCount > 1 ? 's were' : ' was'} added worth ${this.money(totalVal)} — most in ${top.b.name}.`,
      });
    }

    // 9. Capex heads-up
    if (this.capexForecast?.branches?.length) {
      const total = this.capexForecast.branches.reduce((s: number, b: any) => s + b.total, 0);
      if (total > 0) {
        out.push({
          severity: 'info', icon: 'pi-wallet',
          text: `Early ${this.capexForecast.fyLabel} capex signal: ≈ ${this.money(total)} of assets reach end-of-life or lease/rental end by then.`,
        });
      }
    }

    // 10. Health standing
    if (branches.length > 1) {
      const best = [...branches].sort((a, z) => z.healthScore - a.healthScore)[0];
      const worst = [...branches].sort((a, z) => a.healthScore - z.healthScore)[0];
      out.push({
        severity: 'info', icon: 'pi-heart',
        text: `Branch health: ${best.name} leads (grade ${best.grade}, ${best.healthScore}/100); ${worst.name} needs attention (grade ${worst.grade}, ${worst.healthScore}/100).`,
      });
    }

    if (!out.length) {
      out.push({ severity: 'info', icon: 'pi-check-circle', text: 'All clear — no critical equipment down, no SLA breaches, no cover lapsing and no cost leakage detected.' });
    }
    this.briefing = out;
  }

  copyBriefing(): void {
    const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const text = [`Asset Management Briefing — ${date}`, '', ...this.briefing.map(b => `• ${b.text}`)].join('\n');
    navigator.clipboard?.writeText(text).then(() => {
      this.briefingCopied = true;
      setTimeout(() => { this.briefingCopied = false; this.cdr.detectChanges(); }, 2000);
      this.cdr.detectChanges();
    });
  }

  hoursDown(since: string | null): string {
    if (!since) return '—';
    const hrs = Math.round((Date.now() - new Date(since).getTime()) / 3600_000);
    if (hrs < 24) return `${Math.max(hrs, 1)}h`;
    return `${Math.round(hrs / 24)}d`;
  }

  get capexTotal(): number {
    return (this.capexForecast?.branches ?? []).reduce((s: number, b: any) => s + b.total, 0);
  }

  /** Total estimated revenue lost across currently-down critical assets. */
  get criticalLossTotal(): number {
    return this.criticalDown.reduce((s, c) => s + (c.estLoss || 0), 0);
  }

  vendorBarW(v: any): number {
    const max = Math.max(...this.vendorAccountability.map(x => x.repairCost || 0), 1);
    return Math.max(((v.repairCost || 0) / max) * 100, 2);
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
