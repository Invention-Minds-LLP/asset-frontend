import { Component, OnInit, inject, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { FloorPlanService } from '../../services/floor-plan/floor-plan';
import { environment } from '../../../environment/environment.prod';

/**
 * Status buckets shown on the map. Colour alone is never the signal — every
 * bucket also has its own marker shape and a legend entry, because the status
 * palette's red/green pair is indistinguishable under deuteranopia.
 */
type StatusKey = 'good' | 'store' | 'warning' | 'critical' | 'unknown';

const STATUS_BUCKET: Record<string, StatusKey> = {
  ACTIVE: 'good',
  IN_STORE: 'store',
  UNDER_OBSERVATION: 'warning',
  CONDEMNED: 'critical',
  DISPOSED: 'critical',
};

export const STATUS_LEGEND: { key: StatusKey; label: string; icon: string }[] = [
  { key: 'good', label: 'Active', icon: 'pi-circle-fill' },
  { key: 'store', label: 'In store', icon: 'pi-circle' },
  { key: 'warning', label: 'Under observation', icon: 'pi-exclamation-triangle' },
  { key: 'critical', label: 'Condemned / disposed', icon: 'pi-times' },
  { key: 'unknown', label: 'Other', icon: 'pi-minus' },
];

/** One rendered marker: a single pin, or several pins collapsed together. */
type Cluster = { planX: number; planY: number; items: any[] };

/** Sequential blue ramp (light → dark) for the asset-count heatmap. One hue, never a rainbow. */
const HEAT_RAMP = ['#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#256abf', '#184f95', '#0d366b'];

export const ZONE_KINDS = ['ROOM', 'CORRIDOR', 'WARD', 'OT', 'UTILITY', 'OUTDOOR'];

@Component({
  selector: 'app-floor-plan',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './floor-plan.html',
  styleUrls: ['./floor-plan.css'],
})
export class FloorPlanPage implements OnInit {
  private svc = inject(FloorPlanService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('canvas') canvasRef?: ElementRef<HTMLElement>;
  @ViewChild('stage') stageRef?: ElementRef<HTMLElement>;

  branches: { id: number; name: string }[] = [];
  plans: any[] = [];

  // filters / upload form
  filterBranchId: number | '' = '';

  // ── 2.5D stack view ──
  viewMode: 'grid' | 'stack' = 'grid';
  stackFloors: { plan: any; pins: any[] }[] = [];
  stackLoading = false;
  tilt = 58;
  yaw = -32;
  spread = 90;
  hoverFloorId: number | null = null;
  private yawDrag: { x: number; y: number; yaw: number; tilt: number } | null = null;

  uploadForm: { name: string; branchId: number | ''; block: string; floor: string; file: File | null } =
    { name: '', branchId: '', block: '', floor: '', file: null };
  uploading = false;
  showUpload = false;

  // viewer state
  selectedPlan: any = null;
  pins: any[] = [];
  pinnable: any[] = [];
  selectedAssetId: number | null = null;
  loadingPlan = false;
  saving = false;

  // ── view transform (B) ──
  zoom = 1;
  panX = 0;
  panY = 0;
  readonly MIN_ZOOM = 0.6;
  readonly MAX_ZOOM = 8;
  /** Labels stop being hover-only once you're zoomed in this far. */
  readonly LABEL_ZOOM = 2.2;

  private dragging = false;
  private dragged = false;
  private dragOrigin = { x: 0, y: 0, panX: 0, panY: 0 };

  // ── map filters (B2) ──
  search = '';
  filterCategory = '';
  filterStatus = '';
  colourMode: 'none' | 'status' = 'none';

  categories: string[] = [];
  statuses: string[] = [];
  clusters: Cluster[] = [];
  readonly legend = STATUS_LEGEND;

  // ── zones (C) ──
  zones: any[] = [];
  zoneTotals: any = null;
  showZones = true;
  heatmap = false;
  selectedZoneId: number | null = null;
  readonly zoneKinds = ZONE_KINDS;
  readonly heatRamp = HEAT_RAMP;

  /** Tracing a new outline: collected points in image-percent. */
  tracing = false;
  tracePoints: [number, number][] = [];
  traceForm: { name: string; roomNumber: string; department: string; kind: string } =
    { name: '', roomNumber: '', department: '', kind: 'ROOM' };
  savingZone = false;

  ngOnInit(): void {
    this.http.get<any[]>(`${environment.apiUrl}/branches`).subscribe({
      next: (r) => {
        this.branches = (r || []).map((b) => ({ id: b.id, name: b.name }));
        this.cdr.markForCheck();
      },
      error: () => {},
    });
    this.loadPlans();
  }

  loadPlans(): void {
    const f: any = {};
    if (this.filterBranchId !== '') f.branchId = Number(this.filterBranchId);
    this.svc.list(f).subscribe({
      next: (p) => {
        this.plans = p || [];
        this.cdr.markForCheck();
        if (this.viewMode === 'stack') this.loadStack();
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  2.5D — the floors of a branch stacked in perspective
  // ─────────────────────────────────────────────────────────────────────────

  setViewMode(mode: 'grid' | 'stack'): void {
    this.viewMode = mode;
    if (mode === 'stack') this.loadStack();
  }

  /** Bottom-to-top ordering from the floor label. Unknown labels sort last, alphabetically. */
  private floorRank(name: string): number {
    const s = String(name || '').trim().toUpperCase();
    const table: [RegExp, number][] = [
      [/^(SUB\s*BASEMENT|LOWER\s*BASEMENT)/, -20],
      [/BASEMENT|LOWER\s*GROUND/, -10],
      [/^GROUND|^GF\b/, 0],
      [/FIRST|^1(ST)?\b/, 1],
      [/SECOND|^2(ND)?\b/, 2],
      [/THIRD|^3(RD)?\b/, 3],
      [/FOURTH|^4(TH)?\b/, 4],
      [/FIFTH|^5(TH)?\b/, 5],
      [/TERRACE|ROOF/, 90],
    ];
    for (const [re, rank] of table) if (re.test(s)) return rank;
    return 50;
  }

  /** Fetch every plan's pins so each floor in the stack shows its own dots. */
  loadStack(): void {
    const ordered = [...this.plans].sort((a, b) => {
      const d = this.floorRank(a.floor) - this.floorRank(b.floor);
      return d !== 0 ? d : String(a.name).localeCompare(String(b.name));
    });
    if (!ordered.length) { this.stackFloors = []; return; }

    this.stackLoading = true;
    const acc: { plan: any; pins: any[] }[] = [];
    let pending = ordered.length;
    for (const plan of ordered) {
      this.svc.get(plan.id).subscribe({
        next: (res) => {
          acc.push({ plan: res.plan ?? plan, pins: res.pins || [] });
          if (--pending === 0) this.finishStack(acc, ordered);
        },
        error: () => {
          acc.push({ plan, pins: [] });
          if (--pending === 0) this.finishStack(acc, ordered);
        },
      });
    }
  }

  private finishStack(acc: { plan: any; pins: any[] }[], ordered: any[]): void {
    const order = new Map(ordered.map((p, i) => [p.id, i]));
    this.stackFloors = acc.sort((a, b) => (order.get(a.plan.id) ?? 0) - (order.get(b.plan.id) ?? 0));
    this.stackLoading = false;
    this.cdr.markForCheck();
  }

  /** Floors are laid out along Z; index 0 is the lowest floor. */
  floorTransform(i: number): string {
    const z = (i - (this.stackFloors.length - 1) / 2) * this.spread;
    return `translate(-50%, -50%) translateZ(${z}px)`;
  }

  /** Keep the floor label facing the viewer despite the scene rotation. */
  get labelTransform(): string {
    return `rotateZ(${-this.yaw}deg) rotateX(${-this.tilt}deg)`;
  }

  get sceneTransform(): string {
    return `rotateX(${this.tilt}deg) rotateZ(${this.yaw}deg)`;
  }

  onStackDragStart(ev: MouseEvent): void {
    ev.preventDefault();
    this.yawDrag = { x: ev.clientX, y: ev.clientY, yaw: this.yaw, tilt: this.tilt };
  }

  onStackDragMove(ev: MouseEvent): void {
    if (!this.yawDrag) return;
    this.yaw = this.yawDrag.yaw + (ev.clientX - this.yawDrag.x) * 0.4;
    this.tilt = Math.min(85, Math.max(0, this.yawDrag.tilt + (ev.clientY - this.yawDrag.y) * 0.25));
  }

  onStackDragEnd(): void { this.yawDrag = null; }

  resetStackView(): void { this.tilt = 58; this.yaw = -32; this.spread = 90; }

  get stackTotalPins(): number {
    return this.stackFloors.reduce((s, f) => s + f.pins.length, 0);
  }

  imageUrl(plan: any): string { return this.svc.imageUrl(plan); }

  // ── Upload ──
  onFileSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.uploadForm.file = input.files?.[0] || null;
  }

  upload(): void {
    if (!this.uploadForm.file) { alert('Choose an image file'); return; }
    if (this.uploadForm.branchId === '') { alert('Select a branch'); return; }
    const fd = new FormData();
    fd.append('file', this.uploadForm.file);
    fd.append('name', this.uploadForm.name || this.uploadForm.file.name);
    fd.append('branchId', String(this.uploadForm.branchId));
    if (this.uploadForm.block) fd.append('block', this.uploadForm.block);
    if (this.uploadForm.floor) fd.append('floor', this.uploadForm.floor);

    this.uploading = true;
    this.svc.upload(fd).subscribe({
      next: () => {
        this.uploading = false;
        this.showUpload = false;
        this.uploadForm = { name: '', branchId: '', block: '', floor: '', file: null };
        this.loadPlans();
        this.cdr.markForCheck();
      },
      error: (e) => {
        this.uploading = false;
        this.cdr.markForCheck();
        alert(e?.error?.message || 'Upload failed');
      },
    });
  }

  // ── View / pin ──
  openPlan(plan: any): void {
    this.loadingPlan = true;
    this.selectedAssetId = null;
    this.svc.get(plan.id).subscribe({
      next: (res) => {
        this.selectedPlan = res.plan;
        this.pins = res.pins || [];
        this.loadingPlan = false;
        this.resetView();
        this.rebuildFacets();
        this.loadPinnable(plan.id);
        this.loadZones();
        this.cdr.markForCheck();
      },
      error: () => { this.loadingPlan = false; this.cdr.markForCheck(); },
    });
  }

  closePlan(): void {
    this.selectedPlan = null;
    this.pins = [];
    this.pinnable = [];
    this.selectedAssetId = null;
    this.clusters = [];
    this.search = '';
    this.filterCategory = '';
    this.filterStatus = '';
    this.zones = [];
    this.zoneTotals = null;
    this.selectedZoneId = null;
    this.heatmap = false;
    this.cancelTrace();
    this.resetView();
  }

  loadPinnable(id: number): void {
    this.svc.pinnable(id).subscribe({
      next: (a) => { this.pinnable = a || []; this.cdr.markForCheck(); },
    });
  }

  selectAsset(assetId: number): void {
    this.selectedAssetId = this.selectedAssetId === assetId ? null : assetId;
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  A — markers, clustering, status encoding
  // ─────────────────────────────────────────────────────────────────────────

  /** Distinct categories / statuses present on this plan, for the filter row. */
  private rebuildFacets(): void {
    const cats = new Set<string>();
    const stats = new Set<string>();
    for (const p of this.pins) {
      const c = p.asset?.assetCategory?.name;
      if (c) cats.add(c);
      if (p.asset?.status) stats.add(p.asset.status);
    }
    this.categories = [...cats].sort();
    this.statuses = [...stats].sort();
    this.rebuildClusters();
  }

  get visiblePins(): any[] {
    const q = this.search.trim().toLowerCase();
    const zone = this.selectedZone;
    const inZone: Set<number> | null = zone ? new Set<number>(zone.assetIds || []) : null;
    return this.pins.filter((p) => {
      if (inZone && !inZone.has(p.asset?.id)) return false;
      if (this.filterCategory && p.asset?.assetCategory?.name !== this.filterCategory) return false;
      if (this.filterStatus && p.asset?.status !== this.filterStatus) return false;
      if (q) {
        const hay = `${p.asset?.assetName || ''} ${p.asset?.assetId || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  /**
   * Collapse pins that would overlap on screen into one marker. The radius is
   * in image-percent and shrinks as you zoom, so clusters break apart naturally
   * instead of needing a separate "expand" gesture.
   */
  rebuildClusters(): void {
    const RADIUS_AT_1X = 2.2; // % of image width
    const r = RADIUS_AT_1X / Math.max(this.zoom, 0.0001);
    const out: Cluster[] = [];
    for (const p of this.visiblePins) {
      const x = Number(p.planX), y = Number(p.planY);
      if (!isFinite(x) || !isFinite(y)) continue;
      const near = out.find((c) => Math.abs(c.planX - x) <= r && Math.abs(c.planY - y) <= r);
      if (near) {
        near.items.push(p);
        // keep the marker on the group's centre so it doesn't drift to the first pin
        near.planX = near.items.reduce((s, i) => s + Number(i.planX), 0) / near.items.length;
        near.planY = near.items.reduce((s, i) => s + Number(i.planY), 0) / near.items.length;
      } else {
        out.push({ planX: x, planY: y, items: [p] });
      }
    }
    this.clusters = out;
  }

  onFiltersChanged(): void { this.rebuildClusters(); }

  clearFilters(): void {
    this.search = '';
    this.filterCategory = '';
    this.filterStatus = '';
    this.rebuildClusters();
  }

  get hasFilters(): boolean {
    return !!(this.search.trim() || this.filterCategory || this.filterStatus || this.selectedZoneId);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  C — zones: outlines, filtering, heatmap, tracing
  // ─────────────────────────────────────────────────────────────────────────

  loadZones(): void {
    if (!this.selectedPlan) return;
    this.svc.zoneStats(this.selectedPlan.id).subscribe({
      next: (r) => {
        this.zones = r.zones || [];
        this.zoneTotals = r.totals || null;
        this.cdr.markForCheck();
      },
      error: () => {},
    });
  }

  get selectedZone(): any | null {
    return this.selectedZoneId ? this.zones.find((z) => z.id === this.selectedZoneId) || null : null;
  }

  /** Click a zone (on the map or in the list) to isolate it and zoom to it. */
  selectZone(zone: any): void {
    if (this.selectedZoneId === zone.id) { this.clearZone(); return; }
    this.selectedZoneId = zone.id;
    this.rebuildClusters();
    this.zoomToZone(zone);
  }

  clearZone(): void {
    this.selectedZoneId = null;
    this.rebuildClusters();
    this.resetView();
  }

  /** Fit the view to a zone's bounds, with a little breathing room. */
  zoomToZone(zone: any): void {
    const b = zone?.bounds;
    const canvas = this.canvasRef?.nativeElement;
    if (!b || !canvas || !b.width || !b.height) return;
    const pad = 1.25;
    const zx = 100 / (b.width * pad);
    const zy = 100 / (b.height * pad);
    this.zoomToPoint(b.minX + b.width / 2, b.minY + b.height / 2, Math.min(zx, zy));
  }

  /** SVG "points" attribute for a zone outline. */
  zonePoints(zone: any): string {
    return (zone?.polygon || []).map((p: number[]) => `${p[0]},${p[1]}`).join(' ');
  }

  /**
   * Outline thickness in px, divided by the zoom.
   * non-scaling-stroke only defeats the SVG viewBox scaling — the stage's CSS
   * transform still multiplies it — so without this a 3px stroke becomes a 12px
   * slab at 4x zoom.
   */
  zoneStroke(zone: any): string {
    const base = this.selectedZoneId === zone?.id ? 2.5 : 1.25;
    return `${base / this.zoom}px`;
  }

  get traceStroke(): string { return `${2 / this.zoom}px`; }

  /** Sequential fill for the heatmap — one hue, light→dark by asset count. */
  zoneFill(zone: any): string {
    if (!this.heatmap) return 'transparent';
    const max = Math.max(1, Number(this.zoneTotals?.maxAssetCount) || 1);
    const n = Number(zone?.assetCount) || 0;
    if (!n) return 'transparent';
    const idx = Math.min(HEAT_RAMP.length - 1, Math.max(0, Math.round((n / max) * (HEAT_RAMP.length - 1))));
    return HEAT_RAMP[idx];
  }

  zoneTitle(zone: any): string {
    const bits = [zone.name];
    if (zone.roomNumber) bits.push(`Room ${zone.roomNumber}`);
    if (zone.department) bits.push(zone.department);
    return `${bits.join(' · ')}\n${zone.assetCount} asset(s)\nClick to isolate this room`;
  }

  // ── tracing a new zone ──
  startTrace(): void {
    this.tracing = true;
    this.tracePoints = [];
    this.selectedAssetId = null;
    this.traceForm = { name: '', roomNumber: '', department: '', kind: 'ROOM' };
  }

  cancelTrace(): void {
    this.tracing = false;
    this.tracePoints = [];
    this.savingZone = false;
  }

  undoTracePoint(): void { this.tracePoints = this.tracePoints.slice(0, -1); }

  get tracePolyPoints(): string {
    return this.tracePoints.map((p) => `${p[0]},${p[1]}`).join(' ');
  }

  saveZone(): void {
    if (!this.selectedPlan) return;
    if (this.tracePoints.length < 3) { alert('Click at least 3 corners to outline the room.'); return; }
    if (!this.traceForm.name.trim()) { alert('Give the room a name.'); return; }
    this.savingZone = true;
    this.svc.createZone(this.selectedPlan.id, {
      ...this.traceForm,
      name: this.traceForm.name.trim(),
      polygon: this.tracePoints,
    }).subscribe({
      next: () => {
        this.cancelTrace();
        this.loadZones();
        this.cdr.markForCheck();
      },
      error: (e) => {
        this.savingZone = false;
        this.cdr.markForCheck();
        alert(e?.error?.message || 'Failed to save the room');
      },
    });
  }

  deleteZone(zone: any, ev: Event): void {
    ev.stopPropagation();
    if (!this.selectedPlan) return;
    if (!confirm(`Delete room "${zone.name}"? Assets stay pinned; only the outline goes.`)) return;
    this.svc.deleteZone(this.selectedPlan.id, zone.id).subscribe({
      next: () => {
        if (this.selectedZoneId === zone.id) this.selectedZoneId = null;
        this.loadZones();
        this.rebuildClusters();
        this.cdr.markForCheck();
      },
    });
  }

  statusKey(pin: any): StatusKey {
    return STATUS_BUCKET[String(pin?.asset?.status || '').toUpperCase()] || 'unknown';
  }

  statusIcon(pin: any): string {
    return STATUS_LEGEND.find((l) => l.key === this.statusKey(pin))?.icon || 'pi-minus';
  }

  /** Label for a marker: the asset name, or "N assets" for a cluster. */
  clusterLabel(c: Cluster): string {
    if (c.items.length === 1) {
      const a = c.items[0].asset;
      return `${a?.assetName || 'Asset'} · ${a?.assetId || ''}`;
    }
    return `${c.items.length} assets`;
  }

  clusterTitle(c: Cluster): string {
    if (c.items.length === 1) {
      const a = c.items[0].asset;
      return `${a?.assetName} (${a?.assetId})\nStatus: ${a?.status}\nClick to remove this pin`;
    }
    return c.items.map((i) => `• ${i.asset?.assetName} (${i.asset?.assetId})`).join('\n') +
      `\n\nClick to zoom in`;
  }

  onMarkerClick(c: Cluster, ev: MouseEvent): void {
    ev.stopPropagation();
    if (this.dragged) return;
    if (c.items.length > 1) { this.zoomToPoint(c.planX, c.planY, Math.min(this.zoom * 2, this.MAX_ZOOM)); return; }
    this.removePin(c.items[0]);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  B — zoom / pan
  // ─────────────────────────────────────────────────────────────────────────

  get stageTransform(): string {
    return `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
  }

  /** Markers live inside the scaled stage, so counter-scale them to keep a constant screen size. */
  get markerTransform(): string {
    return `translate(-50%, -50%) scale(${1 / this.zoom})`;
  }

  get zoomPct(): number { return Math.round(this.zoom * 100); }
  get labelsAlwaysOn(): boolean { return this.zoom >= this.LABEL_ZOOM; }

  resetView(): void {
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
    this.rebuildClusters();
  }

  zoomBy(factor: number): void {
    const el = this.canvasRef?.nativeElement;
    const cx = el ? el.clientWidth / 2 : 0;
    const cy = el ? el.clientHeight / 2 : 0;
    this.zoomAt(this.zoom * factor, cx, cy);
  }

  /** Zoom keeping the image point under (cx, cy) — canvas-relative px — fixed. */
  private zoomAt(next: number, cx: number, cy: number): void {
    const z2 = Math.min(this.MAX_ZOOM, Math.max(this.MIN_ZOOM, next));
    if (z2 === this.zoom) return;
    const ix = (cx - this.panX) / this.zoom;
    const iy = (cy - this.panY) / this.zoom;
    this.panX = cx - ix * z2;
    this.panY = cy - iy * z2;
    this.zoom = z2;
    this.clampPan();
    this.rebuildClusters();
  }

  /** Centre the view on an image point given in percent. */
  zoomToPoint(planX: number, planY: number, zoom = 3): void {
    const canvas = this.canvasRef?.nativeElement;
    const stage = this.stageRef?.nativeElement;
    if (!canvas || !stage) return;
    this.zoom = Math.min(this.MAX_ZOOM, Math.max(this.MIN_ZOOM, zoom));
    const px = (stage.offsetWidth * planX) / 100;
    const py = (stage.offsetHeight * planY) / 100;
    this.panX = canvas.clientWidth / 2 - px * this.zoom;
    this.panY = canvas.clientHeight / 2 - py * this.zoom;
    this.clampPan();
    this.rebuildClusters();
  }

  /** Jump to an asset's pin from the side list. */
  zoomToAsset(assetId: number): void {
    const pin = this.pins.find((p) => p.asset?.id === assetId);
    if (pin) this.zoomToPoint(Number(pin.planX), Number(pin.planY), Math.max(this.zoom, 3));
  }

  /** Keep at least a third of the image inside the viewport. */
  private clampPan(): void {
    const canvas = this.canvasRef?.nativeElement;
    const stage = this.stageRef?.nativeElement;
    if (!canvas || !stage) return;
    const w = stage.offsetWidth * this.zoom;
    const h = stage.offsetHeight * this.zoom;
    const keepX = canvas.clientWidth / 3;
    const keepY = canvas.clientHeight / 3;
    this.panX = Math.min(canvas.clientWidth - keepX, Math.max(keepX - w, this.panX));
    this.panY = Math.min(canvas.clientHeight - keepY, Math.max(keepY - h, this.panY));
  }

  onWheel(ev: WheelEvent): void {
    if (!this.selectedPlan) return;
    ev.preventDefault();
    const el = this.canvasRef?.nativeElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const factor = ev.deltaY < 0 ? 1.15 : 1 / 1.15;
    this.zoomAt(this.zoom * factor, ev.clientX - rect.left, ev.clientY - rect.top);
  }

  onPanStart(ev: MouseEvent): void {
    if (ev.button !== 0) return;
    this.dragging = true;
    this.dragged = false;
    this.dragOrigin = { x: ev.clientX, y: ev.clientY, panX: this.panX, panY: this.panY };
  }

  onPanMove(ev: MouseEvent): void {
    if (!this.dragging) return;
    const dx = ev.clientX - this.dragOrigin.x;
    const dy = ev.clientY - this.dragOrigin.y;
    if (!this.dragged && Math.abs(dx) + Math.abs(dy) > 4) this.dragged = true;
    if (!this.dragged) return;
    this.panX = this.dragOrigin.panX + dx;
    this.panY = this.dragOrigin.panY + dy;
    this.clampPan();
  }

  onPanEnd(): void { this.dragging = false; }

  // ── placing pins ──
  /** Canvas point → image percent. Uses the stage rect, which already includes zoom/pan. */
  private pointAt(ev: MouseEvent): { x: number; y: number } | null {
    const stage = this.stageRef?.nativeElement;
    if (!stage) return null;
    const rect = stage.getBoundingClientRect();
    const x = ((ev.clientX - rect.left) / rect.width) * 100;
    const y = ((ev.clientY - rect.top) / rect.height) * 100;
    if (x < 0 || x > 100 || y < 0 || y > 100) return null;
    return { x: +x.toFixed(2), y: +y.toFixed(2) };
  }

  onPlanClick(ev: MouseEvent): void {
    if (this.dragged) { this.dragged = false; return; }
    if (!this.selectedPlan) return;

    // Tracing mode: each click drops a corner of the outline.
    if (this.tracing) {
      const p = this.pointAt(ev);
      if (p) this.tracePoints = [...this.tracePoints, [p.x, p.y]];
      return;
    }

    if (!this.selectedAssetId) return;
    const p = this.pointAt(ev);
    if (!p) return;
    const x = p.x, y = p.y;
    this.saving = true;
    this.svc.savePin(this.selectedPlan.id, {
      assetId: this.selectedAssetId,
      planX: +x.toFixed(2),
      planY: +y.toFixed(2),
    }).subscribe({
      next: () => {
        this.saving = false;
        this.selectedAssetId = null;
        this.refreshPins();
      },
      error: (e) => {
        this.saving = false;
        this.cdr.markForCheck();
        alert(e?.error?.message || 'Failed to pin');
      },
    });
  }

  refreshPins(): void {
    if (!this.selectedPlan) return;
    this.svc.get(this.selectedPlan.id).subscribe({
      next: (res) => {
        this.pins = res.pins || [];
        this.rebuildFacets();
        this.loadPinnable(this.selectedPlan.id);
        this.loadZones(); // zone asset counts move when a pin does
        this.cdr.markForCheck();
      },
    });
  }

  removePin(pin: any): void {
    if (!this.selectedPlan) return;
    if (!confirm(`Remove pin for ${pin.asset?.assetName}?`)) return;
    this.svc.removePin(this.selectedPlan.id, pin.asset.id).subscribe({
      next: () => this.refreshPins(),
    });
  }

  deletePlan(plan: any, ev: Event): void {
    ev.stopPropagation();
    if (!confirm(`Delete floor plan "${plan.name}"? Pins on it will be cleared.`)) return;
    this.svc.remove(plan.id).subscribe({
      next: () => {
        if (this.selectedPlan?.id === plan.id) this.closePlan();
        this.loadPlans();
      },
    });
  }

  /** Aspect ratio for the canvas so image pixels and pin percentages line up. */
  get canvasAspect(): string {
    const w = Number(this.selectedPlan?.width);
    const h = Number(this.selectedPlan?.height);
    return w > 0 && h > 0 ? `${w} / ${h}` : '16 / 10';
  }

  trackById(_i: number, x: any) { return x.id; }
  trackByCluster(i: number, c: Cluster) { return `${c.planX},${c.planY},${c.items.length},${i}`; }
}
