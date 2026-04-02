import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { TabsModule } from 'primeng/tabs';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environment/environment.prod';
import { StoreService } from '../../services/store/store';
import { StoreStockService } from '../../services/store-stock/store-stock';
import { StoreTransferService } from '../../services/store-transfer/store-transfer';

@Component({
  selector: 'app-store-management',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TableModule, TagModule,
    ToastModule, SelectModule, DialogModule, InputNumberModule, TooltipModule,
    InputTextModule, TabsModule, TextareaModule,
  ],
  templateUrl: './store-management.html',
  styleUrl: './store-management.css',
  providers: [MessageService]
})
export class StoreManagement implements OnInit {
  userRole = localStorage.getItem('role') || '';

  isRole(...roles: string[]): boolean { return roles.includes(this.userRole); }

  activeTab: 'stores' | 'stock' | 'transfers' | 'alerts' = 'stores';

  // Stores
  stores: any[] = [];
  storeOptions: any[] = [];
  storeHierarchy: any = null;
  showCreateStoreDialog = false;
  storeForm: any = this.emptyStoreForm();
  savingStore = false;
  loadingStores = false;
  approvingTransfer = false;
  receivingTransfer = false;
  adjustingStock = false;
  addingLocation = false;

  storeTypeOptions = [
    { label: 'Main Store', value: 'MAIN_STORE' },
    { label: 'Sub Store', value: 'SUB_STORE' },
  ];

  // Stock
  selectedStoreId: number | null = null;
  stockPositions: any[] = [];
  loadingStock = false;
  showAdjustDialog = false;
  adjustForm = this.emptyAdjustForm();

  sparePartOptions: any[] = [];
  consumableOptions: any[] = [];
  itemTypeOptions = [
    { label: 'Spare Part', value: 'SPARE_PART' },
    { label: 'Consumable', value: 'CONSUMABLE' },
  ];

  // Transfers
  transfers: any[] = [];
  loadingTransfers = false;
  showCreateTransferDialog = false;
  transferForm: any = this.emptyTransferForm();
  savingTransfer = false;

  transferTypeOptions = [
    { label: 'Store to Store', value: 'STORE_TO_STORE' },
    { label: 'Store to Department', value: 'STORE_TO_DEPARTMENT' },
  ];

  // Alerts
  lowStockAlerts: any[] = [];
  loadingAlerts = false;

  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private storeService: StoreService,
    private stockService: StoreStockService,
    private transferService: StoreTransferService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadStores();
    this.loadTransfers();
    this.loadAlerts();
  }

  // ── Stores ──

  loadStores() {
    this.loadingStores = true;
    this.storeService.getAll().subscribe({
      next: (data: any) => {
        this.stores = Array.isArray(data) ? data : (data?.data ?? []);
        this.storeOptions = this.stores.map((s: any) => ({ label: `${s.code} — ${s.name}`, value: s.id }));
        this.loadingStores = false;
        setTimeout(() => this.cdr.detectChanges());
      },
      error: () => {
        this.loadingStores = false;
        setTimeout(() => this.cdr.detectChanges());
      }
    });
    this.storeService.getHierarchy().subscribe({
      next: (data: any) => {
        this.storeHierarchy = data;
        setTimeout(() => this.cdr.detectChanges());
      },
      error: () => {}
    });
  }

  // Detail
  selectedStore: any = null;
  showDetailDialog = false;
  storeLocations: any[] = [];
  showAddLocationDialog = false;
  locationForm = { rack: '', shelf: '', bin: '', label: '' };

  emptyStoreForm() {
    return { name: '', code: '', storeType: 'MAIN_STORE', parentStoreId: null, address: '' };
  }

  openCreateStore() {
    this.storeForm = this.emptyStoreForm();
    this.showCreateStoreDialog = true;
  }

  createStore() {
    this.savingStore = true;
    this.storeService.create(this.storeForm).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Store Created', detail: 'Store has been created successfully.' });
        this.showCreateStoreDialog = false;
        this.savingStore = false;
        this.loadStores();
      },
      error: (err: any) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to create store.' });
        this.savingStore = false;
        setTimeout(() => this.cdr.detectChanges());
      }
    });
  }

  getStoreTypeSeverity(type: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const map: any = { MAIN_STORE: 'success', SUB_STORE: 'info' };
    return map[type] || 'info';
  }

  getStoreTypeLabel(type: string): string {
    const map: any = { MAIN_STORE: 'Main Store', SUB_STORE: 'Sub Store' };
    return map[type] || type;
  }

  viewStoreDetail(store: any) {
    this.selectedStore = store;
    this.showDetailDialog = true;
    this.storeLocations = [];
    this.storeService.getLocations(store.id).subscribe({
      next: (data: any) => {
        setTimeout(() => {
          this.storeLocations = Array.isArray(data) ? data : (data?.data ?? []);
          this.cdr.detectChanges();
        });
      },
      error: () => {}
    });
  }

  openAddLocation() {
    this.locationForm = { rack: '', shelf: '', bin: '', label: '' };
    this.showAddLocationDialog = true;
  }

  addLocation() {
    if (!this.selectedStore) return;
    this.addingLocation = true;
    this.storeService.createLocation(this.selectedStore.id, this.locationForm).subscribe({
      next: () => {
        this.addingLocation = false;
        this.messageService.add({ severity: 'success', summary: 'Location Added', detail: 'Store location created.' });
        this.showAddLocationDialog = false;
        this.viewStoreDetail(this.selectedStore);
        this.loadStores();
      },
      error: (err: any) => {
        this.addingLocation = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to add location.' });
      }
    });
  }

  // ── Stock ──

  loadStock(storeId: number) {
    this.selectedStoreId = storeId;
    this.loadingStock = true;
    this.stockService.getByStore(storeId).subscribe({
      next: (data: any) => {
        this.stockPositions = Array.isArray(data) ? data : (data?.data ?? []);
        this.loadingStock = false;
        setTimeout(() => this.cdr.detectChanges());
      },
      error: () => {
        this.loadingStock = false;
        setTimeout(() => this.cdr.detectChanges());
      }
    });
  }

  onStoreSelect() {
    if (this.selectedStoreId) {
      this.loadStock(this.selectedStoreId);
    }
  }

  getStockStatus(item: any): string {
    if (item.currentQty <= 0) return 'Out of Stock';
    if (item.currentQty <= item.reorderLevel) return 'Low Stock';
    return 'In Stock';
  }

  getStockSeverity(item: any): 'success' | 'warn' | 'danger' {
    if (item.currentQty <= 0) return 'danger';
    if (item.currentQty <= item.reorderLevel) return 'warn';
    return 'success';
  }

  emptyAdjustForm() {
    return { itemType: 'SPARE_PART' as string, sparePartId: null as number | null, consumableId: null as number | null, adjustmentQty: 0, reason: '', reorderLevel: null as number | null };
  }

  openAdjustStock() {
    this.adjustForm = this.emptyAdjustForm();
    this.showAdjustDialog = true;
    this.loadItemDropdowns();
  }

  adjustStock() {
    if (!this.selectedStoreId) return;
    const payload: any = {
      itemType: this.adjustForm.itemType,
      adjustmentQty: this.adjustForm.adjustmentQty,
      reason: this.adjustForm.reason,
    };
    if (this.adjustForm.itemType === 'SPARE_PART') payload.sparePartId = this.adjustForm.sparePartId;
    if (this.adjustForm.itemType === 'CONSUMABLE') payload.consumableId = this.adjustForm.consumableId;

    this.adjustingStock = true;
    this.stockService.adjustStock(this.selectedStoreId, payload).subscribe({
      next: () => {
        this.adjustingStock = false;
        this.messageService.add({ severity: 'success', summary: 'Stock Adjusted', detail: 'Stock has been adjusted.' });
        this.showAdjustDialog = false;
        this.loadStock(this.selectedStoreId!);
      },
      error: (err: any) => {
        this.adjustingStock = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to adjust stock.' });
        setTimeout(() => this.cdr.detectChanges());
      }
    });
  }

  // ── Transfers ──

  loadTransfers() {
    this.loadingTransfers = true;
    this.transferService.getAll().subscribe({
      next: (data: any) => {
        this.transfers = Array.isArray(data) ? data : (data?.data ?? []);
        this.loadingTransfers = false;
        setTimeout(() => this.cdr.detectChanges());
      },
      error: () => {
        this.loadingTransfers = false;
        setTimeout(() => this.cdr.detectChanges());
      }
    });
  }

  emptyTransferForm() {
    return { fromStoreId: null, toStoreId: null, transferType: 'STORE_TO_STORE', remarks: '', items: [this.emptyTransferItem()] };
  }

  emptyTransferItem() {
    return { itemType: 'SPARE_PART' as string, sparePartId: null as number | null, consumableId: null as number | null, quantity: 1 };
  }

  openCreateTransfer() {
    this.transferForm = this.emptyTransferForm();
    this.showCreateTransferDialog = true;
    this.loadItemDropdowns();
  }

  private loadItemDropdowns() {
    if (this.sparePartOptions.length === 0) {
      this.http.get<any>(`${this.apiUrl}/inventory/spare-parts`).subscribe({
        next: (data: any) => {
          const list = Array.isArray(data) ? data : (data?.data ?? []);
          this.sparePartOptions = list.map((s: any) => ({ label: `${s.name}${s.partNumber ? ' (' + s.partNumber + ')' : ''}`, value: s.id }));
          setTimeout(() => this.cdr.detectChanges());
        },
        error: () => {}
      });
    }
    if (this.consumableOptions.length === 0) {
      this.http.get<any>(`${this.apiUrl}/inventory/consumables`).subscribe({
        next: (data: any) => {
          const list = Array.isArray(data) ? data : (data?.data ?? []);
          this.consumableOptions = list.map((c: any) => ({ label: c.name, value: c.id }));
          setTimeout(() => this.cdr.detectChanges());
        },
        error: () => {}
      });
    }
  }

  addTransferItem() {
    this.transferForm.items.push(this.emptyTransferItem());
  }

  removeTransferItem(index: number) {
    this.transferForm.items.splice(index, 1);
  }

  createTransfer() {
    this.savingTransfer = true;
    this.transferService.create(this.transferForm).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Transfer Created', detail: 'Transfer request has been created.' });
        this.showCreateTransferDialog = false;
        this.savingTransfer = false;
        this.loadTransfers();
      },
      error: (err: any) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to create transfer.' });
        this.savingTransfer = false;
        setTimeout(() => this.cdr.detectChanges());
      }
    });
  }

  approveTransfer(id: number) {
    this.approvingTransfer = true;
    this.transferService.approve(id, {}).subscribe({
      next: () => {
        this.approvingTransfer = false;
        this.messageService.add({ severity: 'success', summary: 'Approved', detail: 'Transfer has been approved.' });
        this.loadTransfers();
      },
      error: (err: any) => {
        this.approvingTransfer = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to approve transfer.' });
      }
    });
  }

  receiveTransfer(id: number) {
    this.receivingTransfer = true;
    this.transferService.receive(id, {}).subscribe({
      next: () => {
        this.receivingTransfer = false;
        this.messageService.add({ severity: 'success', summary: 'Received', detail: 'Transfer has been received.' });
        this.loadTransfers();
      },
      error: (err: any) => {
        this.receivingTransfer = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to receive transfer.' });
      }
    });
  }

  getTransferStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const map: any = { PENDING: 'warn', APPROVED: 'info', IN_TRANSIT: 'contrast', RECEIVED: 'success', CANCELLED: 'danger' };
    return map[status] || 'secondary';
  }

  // ── Alerts ──

  loadAlerts() {
    this.loadingAlerts = true;
    this.stockService.getLowStockAlerts().subscribe({
      next: (data: any) => {
        this.lowStockAlerts = Array.isArray(data) ? data : (data?.data ?? []);
        this.loadingAlerts = false;
        setTimeout(() => this.cdr.detectChanges());
      },
      error: () => {
        this.loadingAlerts = false;
        setTimeout(() => this.cdr.detectChanges());
      }
    });
  }
}
