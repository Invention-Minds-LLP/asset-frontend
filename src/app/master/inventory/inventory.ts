import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ButtonModule } from 'primeng/button';
import { TabViewModule } from 'primeng/tabview';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';

import { Assets } from '../../services/assets/assets';
import { StoreService } from '../../services/store/store';
import { OverflowTooltipDirective } from '../../shared/directives/overflow-tooltip.directive';

@Component({
  selector: 'app-inventory',
    imports: [
    CommonModule,
    FormsModule,
    TableModule,
    SelectModule,
    InputTextModule,
    FloatLabelModule,
    ButtonModule,
    TabViewModule,
    ToastModule,
    DialogModule,
    TooltipModule,
    TagModule,
    OverflowTooltipDirective
  ],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css',
    providers: [MessageService]
})
export class Inventory {
vendorOptions: { label: string; value: number }[] = [];

  spareRows: any[] = [];
  consumableRows: any[] = [];

  spareEditingId: number | null = null;
  consumableEditingId: number | null = null;

  spareForm = this.getEmptySpareForm();
  consumableForm = this.getEmptyConsumableForm();

  // Low-stock filter toggles + search
  showLowSpareOnly = false;
  showLowConsumableOnly = false;
  spareSearch = '';
  consumableSearch = '';

  // ── Dialog state ──
  showHistoryDialog = false;
  historyTitle = '';
  historyRows: any[] = [];
  historyLoading = false;

  showAdjustDialog = false;
  adjustKind: 'spare' | 'consumable' = 'spare';
  adjustItem: any = null;
  adjustMode: 'set' | 'receive' | 'issue' = 'set';
  adjustModeOptions = [
    { label: 'Set exact count (correction)', value: 'set' },
    { label: 'Add / receive stock', value: 'receive' },
    { label: 'Issue to a store', value: 'issue' },
  ];
  adjustQty: number | null = null;
  adjustReason = '';
  adjustStoreId: number | null = null;
  adjustSaving = false;

  showStoresDialog = false;
  storesTitle = '';
  storeRows: any[] = [];
  storesLoading = false;

  showBatchDialog = false;
  batchConsumable: any = null;
  batchRows: any[] = [];
  batchLoading = false;
  batchForm = { batchNumber: '', expiryDate: '', quantity: null as number | null };
  batchSaving = false;

  storeOptions: { label: string; value: number }[] = [];

  constructor(
    private inventoryAPI: Assets,
    private storeService: StoreService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadVendors();
    this.loadStores();
    this.loadSpareParts();
    this.loadConsumables();
  }

  loadStores() {
    this.storeService.getAll().subscribe({
      next: (res: any[]) => setTimeout(() => {
        this.storeOptions = (res || []).map(s => ({ label: s.name, value: s.id }));
        this.cdr.detectChanges();
      }),
      error: () => {}
    });
  }

  getEmptySpareForm() {
    return {
      name: '',
      partNumber: '',
      model: '',
      category: '',
      vendorId: null,
      stockQuantity: 0,
      reorderLevel: 0,
      cost: null
    };
  }

  getEmptyConsumableForm() {
    return {
      name: '',
      unit: '',
      stockQuantity: 0,
      reorderLevel: 0,
      cost: null as number | null
    };
  }

  loadVendors() {
    this.inventoryAPI.getVendors().subscribe({
      next: (res: any[]) => {
        setTimeout(() => {
          this.vendorOptions = (res || []).map(v => ({ label: v.name, value: v.id }));
          this.cdr.detectChanges();
        });
      },
      error: () => this.toast('error', 'Failed to load vendors')
    });
  }

  loadSpareParts() {
    this.inventoryAPI.getAllSpareParts().subscribe({
      next: (res: any[]) => {
        setTimeout(() => { this.spareRows = res || []; this.cdr.detectChanges(); });
      },
      error: () => this.toast('error', 'Failed to load spare parts')
    });
  }

  loadConsumables() {
    this.inventoryAPI.getAllConsumables().subscribe({
      next: (res: any[]) => {
        setTimeout(() => { this.consumableRows = res || []; this.cdr.detectChanges(); });
      },
      error: () => this.toast('error', 'Failed to load consumables')
    });
  }

  saveSparePart() {
    const payload = {
      name: this.spareForm.name?.trim(),
      partNumber: this.spareForm.partNumber?.trim() || null,
      model: this.spareForm.model?.trim() || null,
      category: this.spareForm.category?.trim() || null,
      vendorId: this.spareForm.vendorId ? Number(this.spareForm.vendorId) : null,
      stockQuantity: Number(this.spareForm.stockQuantity || 0),
      reorderLevel: this.spareForm.reorderLevel !== null && this.spareForm.reorderLevel !== undefined
        ? Number(this.spareForm.reorderLevel)
        : 0,
      cost: this.spareForm.cost !== null && this.spareForm.cost !== undefined && this.spareForm.cost !== ''
        ? Number(this.spareForm.cost)
        : null
    };

    if (!payload.name) {
      this.toast('warn', 'Spare part name is required');
      return;
    }

    if (payload.stockQuantity < 0) {
      this.toast('warn', 'Stock quantity cannot be negative');
      return;
    }

    if (this.spareEditingId) {
      this.inventoryAPI.updateSparePart(this.spareEditingId, payload).subscribe({
        next: () => { setTimeout(() => { this.toast('success', 'Spare part updated'); this.resetSpareForm(); this.loadSpareParts(); this.cdr.detectChanges(); }); },
        error: (err) => this.toast('error', err?.error?.message || 'Failed to update spare part')
      });
      return;
    }

    this.inventoryAPI.createSparePart(payload).subscribe({
      next: () => { setTimeout(() => { this.toast('success', 'Spare part created'); this.resetSpareForm(); this.loadSpareParts(); this.cdr.detectChanges(); }); },
      error: (err) => this.toast('error', err?.error?.message || 'Failed to create spare part')
    });
  }

  editSparePart(row: any) {
    this.spareEditingId = row.id;
    this.spareForm = {
      name: row.name || '',
      partNumber: row.partNumber || '',
      model: row.model || '',
      category: row.category || '',
      vendorId: row.vendorId ?? null,
      stockQuantity: row.stockQuantity ?? 0,
      reorderLevel: row.reorderLevel ?? 0,
      cost: row.cost ?? null
    };
  }

  deleteSparePart(row: any) {
    if (!confirm(`Delete spare part "${row.name}"?`)) return;

    this.inventoryAPI.deleteSparePart(row.id).subscribe({
      next: () => { setTimeout(() => { this.toast('success', 'Spare part deleted'); this.loadSpareParts(); this.cdr.detectChanges(); }); },
      error: (err) => this.toast('error', err?.error?.message || 'Failed to delete spare part')
    });
  }

  resetSpareForm() {
    this.spareEditingId = null;
    this.spareForm = this.getEmptySpareForm();
  }

  saveConsumable() {
    const payload = {
      name: this.consumableForm.name?.trim(),
      unit: this.consumableForm.unit?.trim() || null,
      stockQuantity: Number(this.consumableForm.stockQuantity || 0),
      reorderLevel: this.consumableForm.reorderLevel !== null && this.consumableForm.reorderLevel !== undefined
        ? Number(this.consumableForm.reorderLevel)
        : 0,
      cost: this.consumableForm.cost !== null && this.consumableForm.cost !== undefined && (this.consumableForm.cost as any) !== ''
        ? Number(this.consumableForm.cost)
        : null
    };

    if (!payload.name) {
      this.toast('warn', 'Consumable name is required');
      return;
    }

    if (payload.stockQuantity < 0) {
      this.toast('warn', 'Stock quantity cannot be negative');
      return;
    }

    if (this.consumableEditingId) {
      this.inventoryAPI.updateConsumable(this.consumableEditingId, payload).subscribe({
        next: () => { setTimeout(() => { this.toast('success', 'Consumable updated'); this.resetConsumableForm(); this.loadConsumables(); this.cdr.detectChanges(); }); },
        error: (err) => this.toast('error', err?.error?.message || 'Failed to update consumable')
      });
      return;
    }

    this.inventoryAPI.createConsumable(payload).subscribe({
      next: () => { setTimeout(() => { this.toast('success', 'Consumable created'); this.resetConsumableForm(); this.loadConsumables(); this.cdr.detectChanges(); }); },
      error: (err) => this.toast('error', err?.error?.message || 'Failed to create consumable')
    });
  }

  editConsumable(row: any) {
    this.consumableEditingId = row.id;
    this.consumableForm = {
      name: row.name || '',
      unit: row.unit || '',
      stockQuantity: row.stockQuantity ?? 0,
      reorderLevel: row.reorderLevel ?? 0,
      cost: row.cost ?? null
    };
  }

  deleteConsumable(row: any) {
    if (!confirm(`Delete consumable "${row.name}"?`)) return;

    this.inventoryAPI.deleteConsumable(row.id).subscribe({
      next: () => { setTimeout(() => { this.toast('success', 'Consumable deleted'); this.loadConsumables(); this.cdr.detectChanges(); }); },
      error: (err) => this.toast('error', err?.error?.message || 'Failed to delete consumable')
    });
  }

  resetConsumableForm() {
    this.consumableEditingId = null;
    this.consumableForm = this.getEmptyConsumableForm();
  }

  // ── Low-stock helpers ──
  isLowStock(row: any): boolean {
    if (row?.reorderLevel == null || row?.reorderLevel === '') return false;
    return Number(row.stockQuantity) <= Number(row.reorderLevel);
  }

  get filteredSpareRows() {
    const q = this.spareSearch.toLowerCase().trim();
    return this.spareRows.filter(r =>
      (!this.showLowSpareOnly || this.isLowStock(r)) &&
      (!q ||
        (r.name || '').toLowerCase().includes(q) ||
        (r.partNumber || '').toLowerCase().includes(q) ||
        (r.category || '').toLowerCase().includes(q) ||
        (r.vendor?.name || '').toLowerCase().includes(q))
    );
  }
  get filteredConsumableRows() {
    const q = this.consumableSearch.toLowerCase().trim();
    return this.consumableRows.filter(r =>
      (!this.showLowConsumableOnly || this.isLowStock(r)) &&
      (!q || (r.name || '').toLowerCase().includes(q) || (r.unit || '').toLowerCase().includes(q))
    );
  }
  get lowSpareCount() { return this.spareRows.filter(r => this.isLowStock(r)).length; }
  get lowConsumableCount() { return this.consumableRows.filter(r => this.isLowStock(r)).length; }

  // ── Valuation (qty × cost) ──
  get spareValuation() {
    return this.spareRows.reduce((s, r) => s + (Number(r.stockQuantity) || 0) * (Number(r.cost) || 0), 0);
  }
  get consumableValuation() {
    return this.consumableRows.reduce((s, r) => s + (Number(r.stockQuantity) || 0) * (Number(r.cost) || 0), 0);
  }

  // ── Stock-movement history ──
  openSpareHistory(row: any) {
    this.historyTitle = `Stock History — ${row.name}`;
    this.showHistoryDialog = true;
    this.historyLoading = true;
    this.historyRows = [];
    this.inventoryAPI.getSparePartTransactions(row.id).subscribe({
      next: (res) => setTimeout(() => { this.historyRows = res || []; this.historyLoading = false; this.cdr.detectChanges(); }),
      error: () => { this.historyLoading = false; this.toast('error', 'Failed to load history'); }
    });
  }
  openConsumableHistory(row: any) {
    this.historyTitle = `Stock History — ${row.name}`;
    this.showHistoryDialog = true;
    this.historyLoading = true;
    this.historyRows = [];
    this.inventoryAPI.getConsumableTransactions(row.id).subscribe({
      next: (res) => setTimeout(() => { this.historyRows = res || []; this.historyLoading = false; this.cdr.detectChanges(); }),
      error: () => { this.historyLoading = false; this.toast('error', 'Failed to load history'); }
    });
  }

  // ── Manual stock adjustment ──
  openAdjust(kind: 'spare' | 'consumable', row: any) {
    this.adjustKind = kind;
    this.adjustItem = row;
    this.adjustMode = 'set';
    this.adjustQty = Number(row.stockQuantity) || 0;
    this.adjustReason = '';
    this.adjustStoreId = null;
    this.showAdjustDialog = true;
  }
  onAdjustModeChange() {
    // "Set" edits the total (prefill current); receive/issue enter an amount to move.
    this.adjustQty = this.adjustMode === 'set' ? (Number(this.adjustItem?.stockQuantity) || 0) : null;
  }
  get adjustQtyLabel() {
    return this.adjustMode === 'set' ? 'New total quantity' : this.adjustMode === 'receive' ? 'Quantity to add' : 'Quantity to issue';
  }
  saveAdjust() {
    if (this.adjustQty == null || Number(this.adjustQty) < 0) { this.toast('warn', 'Enter a valid quantity (>= 0)'); return; }
    if (this.adjustMode === 'issue' && !this.adjustStoreId) { this.toast('warn', 'Select a store to issue to'); return; }
    const payload: any = { mode: this.adjustMode, quantity: Number(this.adjustQty), reason: this.adjustReason?.trim() || undefined };
    if (this.adjustStoreId) payload.storeId = this.adjustStoreId;
    this.adjustSaving = true;
    const obs = this.adjustKind === 'spare'
      ? this.inventoryAPI.adjustSparePartStock(this.adjustItem.id, payload)
      : this.inventoryAPI.adjustConsumableStock(this.adjustItem.id, payload);
    obs.subscribe({
      next: () => setTimeout(() => {
        this.adjustSaving = false;
        this.showAdjustDialog = false;
        this.toast('success', 'Stock adjusted');
        this.adjustKind === 'spare' ? this.loadSpareParts() : this.loadConsumables();
        this.cdr.detectChanges();
      }),
      error: (err) => { this.adjustSaving = false; this.toast('error', err?.error?.message || 'Adjustment failed'); }
    });
  }

  // ── Per-store breakdown ──
  openSpareStores(row: any) {
    this.storesTitle = `Store Breakdown — ${row.name}`;
    this.showStoresDialog = true;
    this.storesLoading = true;
    this.storeRows = [];
    this.inventoryAPI.getSparePartStores(row.id).subscribe({
      next: (res) => setTimeout(() => { this.storeRows = res || []; this.storesLoading = false; this.cdr.detectChanges(); }),
      error: () => { this.storesLoading = false; this.toast('error', 'Failed to load store stock'); }
    });
  }
  openConsumableStores(row: any) {
    this.storesTitle = `Store Breakdown — ${row.name}`;
    this.showStoresDialog = true;
    this.storesLoading = true;
    this.storeRows = [];
    this.inventoryAPI.getConsumableStores(row.id).subscribe({
      next: (res) => setTimeout(() => { this.storeRows = res || []; this.storesLoading = false; this.cdr.detectChanges(); }),
      error: () => { this.storesLoading = false; this.toast('error', 'Failed to load store stock'); }
    });
  }

  // ── Consumable batches / expiry ──
  openBatches(row: any) {
    this.batchConsumable = row;
    this.batchForm = { batchNumber: '', expiryDate: '', quantity: null };
    this.showBatchDialog = true;
    this.loadBatches();
  }
  loadBatches() {
    if (!this.batchConsumable) return;
    this.batchLoading = true;
    this.inventoryAPI.getConsumableBatches(this.batchConsumable.id).subscribe({
      next: (res) => setTimeout(() => { this.batchRows = res || []; this.batchLoading = false; this.cdr.detectChanges(); }),
      error: () => { this.batchLoading = false; this.toast('error', 'Failed to load batches'); }
    });
  }
  addBatch() {
    if (!this.batchForm.quantity || Number(this.batchForm.quantity) <= 0) { this.toast('warn', 'Enter a positive batch quantity'); return; }
    const payload = {
      batchNumber: this.batchForm.batchNumber?.trim() || undefined,
      expiryDate: this.batchForm.expiryDate || undefined,
      quantity: Number(this.batchForm.quantity)
    };
    this.batchSaving = true;
    this.inventoryAPI.addConsumableBatch(this.batchConsumable.id, payload).subscribe({
      next: () => setTimeout(() => {
        this.batchSaving = false;
        this.toast('success', 'Batch added');
        this.batchForm = { batchNumber: '', expiryDate: '', quantity: null };
        this.loadBatches();
        this.loadConsumables();
        this.cdr.detectChanges();
      }),
      error: (err) => { this.batchSaving = false; this.toast('error', err?.error?.message || 'Failed to add batch'); }
    });
  }
  isExpired(d: any): boolean { return d ? new Date(d) < new Date() : false; }
  isExpiringSoon(d: any): boolean {
    if (!d) return false;
    const days = (new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 30;
  }

  // ── Reorder ──
  reorderSpare(row: any) {
    this.inventoryAPI.requestSparePartReorder(row.id, {}).subscribe({
      next: () => this.toast('success', `Reorder requested for ${row.name}`),
      error: (err) => this.toast('error', err?.error?.message || 'Reorder failed')
    });
  }
  reorderConsumable(row: any) {
    this.inventoryAPI.requestConsumableReorder(row.id, {}).subscribe({
      next: () => this.toast('success', `Reorder requested for ${row.name}`),
      error: (err) => this.toast('error', err?.error?.message || 'Reorder failed')
    });
  }

  toast(severity: 'success' | 'error' | 'warn', detail: string) {
    this.messageService.add({
      severity,
      summary: severity.toUpperCase(),
      detail
    });
  }
}
