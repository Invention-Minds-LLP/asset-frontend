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

import { Assets } from '../../services/assets/assets';

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
    ToastModule
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

  constructor(
    private inventoryAPI: Assets,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadVendors();
    this.loadSpareParts();
    this.loadConsumables();
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
      reorderLevel: 0
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
        : 0
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
      reorderLevel: row.reorderLevel ?? 0
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

  toast(severity: 'success' | 'error' | 'warn', detail: string) {
    this.messageService.add({
      severity,
      summary: severity.toUpperCase(),
      detail
    });
  }
}
