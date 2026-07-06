import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService } from '../../services/analytics/analytics';

/**
 * Branch tiles strip — shared across dashboards.
 * Shows one mini-scorecard per branch (from /analytics/branch-dashboard) and
 * acts as a one-click branch filter: clicking a tile emits its branch id,
 * clicking again (or "All Branches") emits null.
 *
 * The endpoint is management-only; on 403 the strip hides itself so the
 * host dashboard renders unchanged for non-management users.
 */
@Component({
  selector: 'app-branch-tiles',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './branch-tiles.html',
  styleUrls: ['./branch-tiles.css'],
})
export class BranchTiles implements OnInit {
  @Input() selectedBranchId: number | null = null;
  @Output() branchChange = new EventEmitter<number | null>();

  visible = false;
  branches: any[] = [];
  totals: any = null;

  private static readonly SERIES = ['#2a78d6', '#1baf7a', '#eda100', '#008300', '#4a3aa7', '#e34948', '#e87ba4', '#eb6834'];
  private static readonly GRADE: Record<string, string> = { A: '#008300', B: '#2a78d6', C: '#eda100', D: '#e34948' };

  constructor(private analytics: AnalyticsService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.analytics.getBranchDashboard().subscribe({
      next: (data) => {
        this.branches = (data.branches || []).filter((b: any) => b.id != null);
        this.totals = data.totals || null;
        this.visible = this.branches.length > 0;
        this.cdr.detectChanges();
      },
      error: () => { this.visible = false; }, // 403 for non-management → stay hidden
    });
  }

  select(id: number | null): void {
    const next = this.selectedBranchId === id ? null : id;
    this.selectedBranchId = next;
    this.branchChange.emit(next);
  }

  color(b: any): string {
    const sorted = [...this.branches].sort((a, z) => a.id - z.id);
    return BranchTiles.SERIES[sorted.findIndex(x => x.id === b.id) % BranchTiles.SERIES.length];
  }

  gradeColor(g: string): string { return BranchTiles.GRADE[g] || '#9b9a95'; }

  money(v: number): string {
    if (v == null) return '₹0';
    if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(1)} Cr`;
    if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(1)} L`;
    return `₹${Math.round(v).toLocaleString('en-IN')}`;
  }
}
