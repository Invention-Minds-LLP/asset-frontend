import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TagModule } from 'primeng/tag';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ExternalAuditService,
  VerifyItemPayload,
} from '../../services/external-audit/external-audit';
import { ExternalAuthService } from '../../services/external-auth/external-auth';

type Tab = 'checklist' | 'items' | 'map';

interface VerifyForm {
  status: 'VERIFIED' | 'MISSING' | 'MISMATCH';
  locationMatch: boolean;
  conditionMatch: boolean;
  actualLocation: string;
  actualCondition: string;
  remarks: string;
}

@Component({
  selector: 'app-auditor-audit-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, TagModule],
  templateUrl: './auditor-audit-detail.html',
  styleUrl: './auditor-audit-detail.css',
})
export class AuditorAuditDetail implements OnInit {
  auditId!: number;
  audit: any = null;
  items: any[] = [];

  loading = true;
  error = '';
  tab: Tab = 'checklist';
  busy = false; // start/complete in flight
  toast = '';

  // ── Checklist: grouped by floor / department / flat, filterable by audit
  // status, asset lifecycle status and QR sticker state. Same server-side
  // builder as the staff screens, scoped to this auditor's audits.
  clGroupBy = 'FLOOR';
  clAssetStatus = '';
  clItemStatus = '';
  clSticker = '';
  clSearch = '';
  clGroups: any[] = [];
  clFacets: any = { assetStatus: [], itemStatus: [], sticker: [] };
  clTotals: any = null;
  clLoading = false;
  clOpen = new Set<string>();
  completion: any = null;

  readonly groupModes = [
    { value: 'FLOOR', label: 'Floor', icon: 'pi pi-building' },
    { value: 'DEPARTMENT', label: 'Department', icon: 'pi pi-sitemap' },
    { value: 'ASSET', label: 'Asset', icon: 'pi pi-box' },
  ];

  // Floor map state
  map: any = null;
  mapLoading = false;
  mapError = '';
  mapLoaded = false;
  // Suggested walk order + "next" highlight (parity with the staff audit map).
  nextItem: any = null;
  walkRoute: any[] = [];
  lastVerifiedItemId: number | null = null;

  // Verify form state
  editingItem: any = null;
  saving = false;
  form: VerifyForm = this.emptyForm();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auditService: ExternalAuditService,
    private auth: ExternalAuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.auditId = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(this.auditId) || this.auditId <= 0) {
      this.router.navigate(['/auditor/audits']);
      return;
    }
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.auditService.getAudit(this.auditId).subscribe({
      next: (res) => {
        this.audit = res?.data || null;
        this.items = this.audit?.items || [];
        this.loading = false;
        if (!this.audit) this.error = 'Audit not found.';
        this.cdr.markForCheck();
        if (this.audit) { this.loadChecklist(); this.loadCompletionCheck(); }
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.status === 404 ? 'Audit not found.' : 'Could not load this audit.';
        this.cdr.markForCheck();
      },
    });
  }

  back(): void {
    this.router.navigate(['/auditor/audits']);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/auditor/login'], { replaceUrl: true });
  }

  setTab(tab: Tab): void {
    this.tab = tab;
    if (tab === 'map' && !this.mapLoaded && !this.mapLoading) {
      this.loadMap();
    }
    if (tab === 'checklist' && !this.clGroups.length && !this.clLoading) {
      this.loadChecklist();
    }
  }

  // ── Lifecycle actions ──
  startAudit(): void {
    this.busy = true;
    this.auditService.startAudit(this.auditId).subscribe({
      next: (res) => {
        this.busy = false;
        this.audit = { ...this.audit, ...res.data };
        this.flash('Audit started.');
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.busy = false;
        this.flash(err?.error?.message || 'Could not start audit.');
        this.cdr.markForCheck();
      },
    });
  }

  completeAudit(): void {
    if (this.pendingCount() > 0) {
      const ok = confirm(
        `${this.pendingCount()} item(s) are still pending. Complete the audit anyway?`
      );
      if (!ok) return;
    }
    this.busy = true;
    this.auditService.completeAudit(this.auditId).subscribe({
      next: (res) => {
        this.busy = false;
        this.audit = { ...this.audit, ...res.data };
        this.flash('Audit completed.');
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.busy = false;
        this.flash(err?.error?.message || 'Could not complete audit.');
        this.cdr.markForCheck();
      },
    });
  }

  // ── Verify ──
  canVerify(): boolean {
    return (this.audit?.status || '').toUpperCase() === 'IN_PROGRESS';
  }

  /**
   * Checklist rows come from the shared builder and key the item as `itemId`,
   * while the items tab uses `id`. Normalise so one verify dialog serves both.
   */
  openVerifyRow(row: any): void {
    this.openVerify({ ...row, id: row.itemId, status: row.itemStatus });
  }

  openVerify(item: any): void {
    this.editingItem = item;
    this.form = {
      status: item.status && item.status !== 'PENDING' ? item.status : 'VERIFIED',
      locationMatch: item.locationMatch ?? true,
      conditionMatch: item.conditionMatch ?? true,
      actualLocation: item.actualLocation || '',
      actualCondition: item.actualCondition || '',
      remarks: item.remarks || '',
    };
  }

  closeVerify(): void {
    this.editingItem = null;
    this.form = this.emptyForm();
  }

  submitVerify(): void {
    if (!this.editingItem) return;
    const payload: VerifyItemPayload = {
      status: this.form.status,
      locationMatch: this.form.locationMatch,
      conditionMatch: this.form.conditionMatch,
      actualLocation: this.form.actualLocation.trim() || null,
      actualCondition: this.form.actualCondition.trim() || null,
      remarks: this.form.remarks.trim() || null,
    };
    this.saving = true;
    this.auditService.verifyItem(this.editingItem.id, payload).subscribe({
      next: (res) => {
        this.saving = false;
        // Patch the row in place so the list reflects the new status.
        const idx = this.items.findIndex((i) => i.id === this.editingItem.id);
        if (idx > -1) this.items[idx] = { ...this.items[idx], ...res.data };
        // Anchor the next-asset suggestion to the pin just inspected.
        this.lastVerifiedItemId = this.editingItem.id;
        this.mapLoaded = false; // map pin colours are now stale
        this.closeVerify();
        this.flash('Item updated.');
        this.cdr.markForCheck();
        // If the map is open, refresh it (and the route) right away.
        if (this.tab === 'map') this.loadMap();
        // Checklist counts and the completion guard both move on every verify.
        if (this.tab === 'checklist') this.loadChecklist();
        this.loadCompletionCheck();
      },
      error: (err) => {
        this.saving = false;
        this.flash(err?.error?.message || 'Could not update item.');
        this.cdr.markForCheck();
      },
    });
  }

  // ── Floor map ──
  loadMap(): void {
    this.mapLoading = true;
    this.mapError = '';
    this.auditService.getFloorMap(this.auditId).subscribe({
      next: (res) => {
        this.map = res?.data || null;
        this.mapLoading = false;
        this.mapLoaded = true;
        this.cdr.markForCheck();
        if (this.map?.plan) this.loadNextItem();
      },
      error: () => {
        this.mapLoading = false;
        this.mapError = 'Could not load the floor map.';
        this.cdr.markForCheck();
      },
    });
  }

  // Suggested next pin + the ordered walk route, anchored to the last pin verified.
  loadNextItem(): void {
    this.auditService.getNextItem(this.auditId, this.lastVerifiedItemId).subscribe({
      next: (res) => {
        const d = res?.data ?? {};
        this.nextItem = d.next || null;
        this.walkRoute = d.route || [];
        this.cdr.markForCheck();
      },
      error: () => {},
    });
  }

  imageUrl(): string {
    return this.auditService.imageUrl(this.map?.plan);
  }

  // 1-based position of a pin in the suggested walk order (0 = not routed).
  routeIndex(itemId: number): number {
    const i = this.walkRoute.findIndex((r) => r.itemId === itemId);
    return i < 0 ? 0 : i + 1;
  }

  isNext(itemId: number): boolean {
    return this.nextItem?.itemId === itemId;
  }

  // The last-verified pin, used to draw the route line to "next".
  get currentPin(): any | null {
    if (this.lastVerifiedItemId == null) return null;
    return (this.map?.placed || []).find((p: any) => p.itemId === this.lastVerifiedItemId) || null;
  }

  // Open the verify modal straight from a map pin (only while IN_PROGRESS).
  verifyFromPin(pin: any): void {
    if (!this.canVerify()) return;
    const item = this.items.find((i) => i.id === pin.itemId);
    if (item) this.openVerify(item);
  }

  // ── Helpers ──
  itemCode(item: any): string {
    return item?.asset?.assetId || item?.assetCode || '—';
  }

  itemName(item: any): string {
    return item?.asset?.assetName || item?.assetName || 'Asset';
  }

  pendingCount(): number {
    return this.items.filter((i) => (i.status || 'PENDING') === 'PENDING').length;
  }

  statusClass(status: string): string {
    return 'st-' + (status || 'pending').toLowerCase();
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      PLANNED: 'Planned',
      IN_PROGRESS: 'In progress',
      COMPLETED: 'Completed',
      PENDING: 'Pending',
      VERIFIED: 'Verified',
      MISSING: 'Missing',
      MISMATCH: 'Mismatch',
    };
    return map[(status || '').toUpperCase()] || status || '—';
  }

  // ── Checklist ──
  loadChecklist(): void {
    this.clLoading = true;
    this.auditService.getChecklist(this.auditId, {
      groupBy: this.clGroupBy,
      assetStatus: this.clAssetStatus,
      itemStatus: this.clItemStatus,
      sticker: this.clSticker,
      q: this.clSearch,
    }).subscribe({
      next: (res) => {
        const d: any = res?.data ?? res;
        this.clGroupBy = d.groupBy || this.clGroupBy;
        this.clGroups = d.groups || [];
        this.clFacets = d.facets || { assetStatus: [], itemStatus: [], sticker: [] };
        this.clTotals = d.totals || null;
        if (!this.clOpen.size) {
          const first = this.clGroups.find((g) => !g.complete) ?? this.clGroups[0];
          if (first) this.clOpen.add(first.key);
        }
        this.clLoading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.clLoading = false; this.cdr.markForCheck(); },
    });
  }

  loadCompletionCheck(): void {
    this.auditService.getCompletionCheck(this.auditId).subscribe({
      next: (res) => { this.completion = res?.data ?? res; this.cdr.markForCheck(); },
      error: () => {},
    });
  }

  setGroupBy(mode: string): void { this.clGroupBy = mode; this.clOpen.clear(); this.loadChecklist(); }

  toggleFilter(kind: 'assetStatus' | 'itemStatus' | 'sticker', value: string): void {
    if (kind === 'assetStatus') this.clAssetStatus = this.clAssetStatus === value ? '' : value;
    if (kind === 'itemStatus') this.clItemStatus = this.clItemStatus === value ? '' : value;
    if (kind === 'sticker') this.clSticker = this.clSticker === value ? '' : value;
    this.loadChecklist();
  }

  clearChecklistFilters(): void {
    this.clAssetStatus = ''; this.clItemStatus = ''; this.clSticker = ''; this.clSearch = '';
    this.loadChecklist();
  }

  get hasChecklistFilters(): boolean {
    return !!(this.clAssetStatus || this.clItemStatus || this.clSticker || this.clSearch.trim());
  }

  toggleChecklistGroup(g: any): void {
    if (this.clOpen.has(g.key)) this.clOpen.delete(g.key); else this.clOpen.add(g.key);
  }
  isChecklistGroupOpen(g: any): boolean { return this.clOpen.has(g.key); }

  /** Same tag severities as the staff checklist, so both read identically. */
  itemSeverity(status: string): string {
    switch (status) {
      case 'VERIFIED': return 'success';
      case 'MISSING': return 'danger';
      case 'MISMATCH': return 'warn';
      default: return 'secondary';
    }
  }

  stickerSeverity(r: any): string {
    const s = this.stickerLabel(r);
    if (s === 'PRESENT') return 'success';
    if (s === 'MISSING') return 'danger';
    if (s === 'DAMAGED') return 'warn';
    return 'secondary';
  }

  /** What the audit observed beats what the asset record claims. */
  stickerLabel(r: any): string {
    return r?.stickerStatus || (r?.qrStickered ? 'PRESENT' : 'NOT CHECKED');
  }

  get canCompleteAudit(): boolean { return !!this.completion?.canComplete; }
  get completionBlockers(): number { return Number(this.completion?.blockingCount ?? 0); }

  /** Explains why Complete is unavailable, before it is pressed. */
  get completionReason(): string {
    if (this.canCompleteAudit) return 'All active assets are accounted for.';
    if (!this.completionBlockers) return '';
    const ex = (this.completion?.examples || []).slice(0, 3)
      .map((e: any) => e.assetName || e.assetCode).filter(Boolean).join(', ');
    return `${this.completionBlockers} active asset(s) still unchecked${ex ? ` — e.g. ${ex}` : ''}.`;
  }

  private emptyForm(): VerifyForm {
    return {
      status: 'VERIFIED',
      locationMatch: true,
      conditionMatch: true,
      actualLocation: '',
      actualCondition: '',
      remarks: '',
    };
  }

  private flash(msg: string): void {
    this.toast = msg;
    setTimeout(() => {
      this.toast = '';
      this.cdr.markForCheck();
    }, 2600);
  }
}
