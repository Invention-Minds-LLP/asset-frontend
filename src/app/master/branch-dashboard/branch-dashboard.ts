import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { AnalyticsService } from '../../services/analytics/analytics';
import { Auth } from '../../services/auth/auth';

interface BranchStats {
  id: number | null;
  name: string;
  code: string | null;
  assetCount: number;
  activeAssets: number;
  statusMix: Record<string, number>;
  workingMix: Record<string, number>;
  grossValue: number;
  netBlock: number;
  openTickets: number;
  slaBreached: number;
  maintenanceSpend: number;
  uncovered: number;
  topCategories: { name: string; count: number }[];
  monthly: { ym: string; count: number; value: number }[];
  healthScore: number;
  grade: string;
}

interface AttentionItem {
  branch: string;
  severity: 'critical' | 'serious' | 'warning';
  icon: string;
  text: string;
}

// Validated categorical palette (dataviz reference, light mode) — fixed slot order.
const SERIES = ['#2a78d6', '#1baf7a', '#eda100', '#008300', '#4a3aa7', '#e34948', '#e87ba4', '#eb6834'];
const GRADE_COLOR: Record<string, string> = { A: '#008300', B: '#2a78d6', C: '#eda100', D: '#e34948' };
const STATUS_ORDER = ['ACTIVE', 'IN_STORE', 'IN_MAINTENANCE', 'RETIRED'];

const MANAGEMENT_ROLES = ['ADMIN', 'CEO_COO', 'CFO', 'FINANCE', 'OPERATIONS'];

@Component({
  selector: 'app-branch-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, TooltipModule],
  templateUrl: './branch-dashboard.html',
  styleUrls: ['./branch-dashboard.css'],
})
export class BranchDashboard implements OnInit, OnDestroy {
  authorized = true;
  loading = true;
  error = '';

  branches: BranchStats[] = [];
  totals: any = null;
  months: string[] = [];
  generatedAt: Date | null = null;

  selected: BranchStats | null = null;
  attention: AttentionItem[] = [];

  // Animated KPI values (count-up)
  kpi = { assets: 0, grossValue: 0, openTickets: 0, branches: 0 };

  private refreshTimer: any = null;
  private rafId: any = null;

  constructor(
    private analytics: AnalyticsService,
    private auth: Auth,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.authorized = MANAGEMENT_ROLES.includes(this.auth.getRole());
    if (!this.authorized) { this.loading = false; return; }
    this.load();
    this.refreshTimer = setInterval(() => this.load(true), 60_000);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  load(silent = false): void {
    if (!silent) this.loading = true;
    this.analytics.getBranchDashboard().subscribe({
      next: (data) => {
        this.branches = data.branches || [];
        this.totals = data.totals || {};
        this.months = data.months || [];
        this.generatedAt = data.generatedAt ? new Date(data.generatedAt) : new Date();
        this.buildAttention();
        if (this.selected) {
          this.selected = this.branches.find(b => b.id === this.selected!.id) ?? null;
        }
        this.loading = false;
        this.animateKpis();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        if (err?.status === 403) this.authorized = false;
        else this.error = err?.error?.message || 'Failed to load branch dashboard';
        this.cdr.detectChanges();
      },
    });
  }

  // ── Derived views ─────────────────────────────────────────────────────────

  /** Real branches only (Unassigned excluded) in a stable id order for colors. */
  get realBranches(): BranchStats[] {
    return this.branches.filter(b => b.id != null);
  }

  get unassigned(): BranchStats | null {
    return this.branches.find(b => b.id == null) ?? null;
  }

  get podium(): BranchStats[] {
    return [...this.realBranches].sort((a, b) => b.healthScore - a.healthScore).slice(0, 3);
  }

  branchColor(b: BranchStats): string {
    if (b.id == null) return '#9b9a95';
    const idx = this.realBranches
      .slice()
      .sort((a, z) => (a.id! - z.id!))
      .findIndex(x => x.id === b.id);
    return SERIES[idx % SERIES.length];
  }

  gradeColor(g: string): string { return GRADE_COLOR[g] || '#9b9a95'; }

  statusList(b: BranchStats): { status: string; count: number; color: string }[] {
    const known = STATUS_ORDER.filter(s => b.statusMix[s]).map((s, ) => s);
    const others = Object.keys(b.statusMix).filter(s => !STATUS_ORDER.includes(s));
    return [...known, ...others].map((s) => ({
      status: s,
      count: b.statusMix[s],
      color: SERIES[[...STATUS_ORDER, ...others].indexOf(s) % SERIES.length],
    }));
  }

  // ── SVG chart geometry ────────────────────────────────────────────────────

  /** Horizontal value bars: width % of the max branch gross value. */
  valueBarWidth(b: BranchStats): number {
    const max = Math.max(...this.realBranches.map(x => x.grossValue), 1);
    return Math.max(1.5, (b.grossValue / max) * 100);
  }

  /** Stacked status segments for a branch, as % widths with 2px gaps handled in CSS. */
  statusSegments(b: BranchStats): { status: string; pct: number; color: string; count: number }[] {
    const total = Math.max(b.assetCount, 1);
    return this.statusList(b).map(s => ({ ...s, pct: (s.count / total) * 100 }));
  }

  /** Multi-line chart: one polyline per branch over the last 12 months. */
  linePoints(b: BranchStats): string {
    const W = 640, H = 200, PAD = 8;
    const max = Math.max(1, ...this.realBranches.flatMap(x => x.monthly.map(m => m.count)));
    return b.monthly
      .map((m, i) => {
        const x = PAD + (i / Math.max(b.monthly.length - 1, 1)) * (W - PAD * 2);
        const y = H - PAD - (m.count / max) * (H - PAD * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  lineDots(b: BranchStats): { x: number; y: number; m: { ym: string; count: number } }[] {
    const W = 640, H = 200, PAD = 8;
    const max = Math.max(1, ...this.realBranches.flatMap(x => x.monthly.map(m => m.count)));
    return b.monthly.map((m, i) => ({
      x: PAD + (i / Math.max(b.monthly.length - 1, 1)) * (W - PAD * 2),
      y: H - PAD - (m.count / max) * (H - PAD * 2),
      m,
    }));
  }

  /** Card sparkline (120×36). */
  sparkPoints(b: BranchStats): string {
    const W = 120, H = 36, PAD = 3;
    const max = Math.max(1, ...b.monthly.map(m => m.count));
    return b.monthly
      .map((m, i) => {
        const x = PAD + (i / Math.max(b.monthly.length - 1, 1)) * (W - PAD * 2);
        const y = H - PAD - (m.count / max) * (H - PAD * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  /** Health ring stroke-dasharray (r = 26 → C ≈ 163.4). */
  ringDash(score: number): string {
    const C = 2 * Math.PI * 26;
    return `${((score / 100) * C).toFixed(1)} ${C.toFixed(1)}`;
  }

  categoryBarWidth(b: BranchStats, c: { count: number }): number {
    const max = Math.max(...b.topCategories.map(x => x.count), 1);
    return Math.max(2, (c.count / max) * 100);
  }

  monthLabel(ym: string): string {
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleString('en-IN', { month: 'short' });
  }

  // ── Attention engine ──────────────────────────────────────────────────────

  private buildAttention(): void {
    const items: AttentionItem[] = [];
    for (const b of this.branches) {
      const name = b.name;
      if (b.slaBreached > 0) {
        items.push({ branch: name, severity: 'critical', icon: 'pi-exclamation-triangle',
          text: `${b.slaBreached} open ticket${b.slaBreached > 1 ? 's' : ''} past SLA` });
      }
      const notWorking = b.workingMix?.['NOT_WORKING'] ?? 0;
      if (notWorking > 0) {
        items.push({ branch: name, severity: 'serious', icon: 'pi-power-off',
          text: `${notWorking} active asset${notWorking > 1 ? 's' : ''} not working` });
      }
      if (b.uncovered > 0) {
        items.push({ branch: name, severity: 'warning', icon: 'pi-shield',
          text: `${b.uncovered} asset${b.uncovered > 1 ? 's' : ''} without warranty or AMC` });
      }
      if (b.id == null && b.assetCount > 0) {
        items.push({ branch: 'Unassigned', severity: 'warning', icon: 'pi-map-marker',
          text: `${b.assetCount} asset${b.assetCount > 1 ? 's' : ''} not mapped to any branch` });
      }
    }
    const rank = { critical: 0, serious: 1, warning: 2 } as const;
    this.attention = items.sort((a, b) => rank[a.severity] - rank[b.severity]).slice(0, 6);
  }

  // ── Formatting & animation ────────────────────────────────────────────────

  formatMoney(v: number): string {
    if (v == null) return '₹0';
    if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
    if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`;
    return `₹${Math.round(v).toLocaleString('en-IN')}`;
  }

  private animateKpis(): void {
    const targets = {
      assets: this.totals?.assets ?? 0,
      grossValue: this.totals?.grossValue ?? 0,
      openTickets: this.totals?.openTickets ?? 0,
      branches: this.totals?.branches ?? 0,
    };
    const start = performance.now();
    const DURATION = 900;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      const k = ease(t);
      this.kpi = {
        assets: Math.round(targets.assets * k),
        grossValue: targets.grossValue * k,
        openTickets: Math.round(targets.openTickets * k),
        branches: targets.branches,
      };
      this.cdr.detectChanges();
      if (t < 1) this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  select(b: BranchStats): void {
    this.selected = this.selected?.id === b.id ? null : b;
  }

  trackBranch(_: number, b: BranchStats) { return b.id; }
}
