import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { FloorPlanService } from '../../services/floor-plan/floor-plan';
import { environment } from '../../../environment/environment.prod';

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

  branches: { id: number; name: string }[] = [];
  plans: any[] = [];

  // filters / upload form
  filterBranchId: number | '' = '';

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

  ngOnInit(): void {
    this.http.get<any[]>(`${environment.apiUrl}/branches`).subscribe({
      next: (r) => (this.branches = (r || []).map((b) => ({ id: b.id, name: b.name }))),
      error: () => {},
    });
    this.loadPlans();
  }

  loadPlans(): void {
    const f: any = {};
    if (this.filterBranchId !== '') f.branchId = Number(this.filterBranchId);
    this.svc.list(f).subscribe({ next: (p) => (this.plans = p || []) });
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
      },
      error: (e) => { this.uploading = false; alert(e?.error?.message || 'Upload failed'); },
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
        this.loadPinnable(plan.id);
      },
      error: () => { this.loadingPlan = false; },
    });
  }

  closePlan(): void { this.selectedPlan = null; this.pins = []; this.pinnable = []; this.selectedAssetId = null; }

  loadPinnable(id: number): void {
    this.svc.pinnable(id).subscribe({ next: (a) => (this.pinnable = a || []) });
  }

  selectAsset(assetId: number): void {
    this.selectedAssetId = this.selectedAssetId === assetId ? null : assetId;
  }

  onPlanClick(ev: MouseEvent): void {
    if (!this.selectedAssetId || !this.selectedPlan) return;
    const el = ev.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const x = ((ev.clientX - rect.left) / rect.width) * 100;
    const y = ((ev.clientY - rect.top) / rect.height) * 100;
    this.saving = true;
    this.svc.savePin(this.selectedPlan.id, {
      assetId: this.selectedAssetId,
      planX: +x.toFixed(2),
      planY: +y.toFixed(2),
    }).subscribe({
      next: () => {
        this.saving = false;
        const placed = this.selectedAssetId;
        this.selectedAssetId = null;
        this.refreshPins(placed);
      },
      error: (e) => { this.saving = false; alert(e?.error?.message || 'Failed to pin'); },
    });
  }

  refreshPins(_placed?: number | null): void {
    if (!this.selectedPlan) return;
    this.svc.get(this.selectedPlan.id).subscribe({
      next: (res) => { this.pins = res.pins || []; this.loadPinnable(this.selectedPlan.id); },
    });
  }

  removePin(pin: any): void {
    if (!this.selectedPlan) return;
    if (!confirm(`Remove pin for ${pin.asset?.assetName}?`)) return;
    this.svc.removePin(this.selectedPlan.id, pin.asset.id).subscribe({ next: () => this.refreshPins() });
  }

  deletePlan(plan: any, ev: Event): void {
    ev.stopPropagation();
    if (!confirm(`Delete floor plan "${plan.name}"? Pins on it will be cleared.`)) return;
    this.svc.remove(plan.id).subscribe({
      next: () => { if (this.selectedPlan?.id === plan.id) this.closePlan(); this.loadPlans(); },
    });
  }

  trackById(_i: number, x: any) { return x.id; }
}
