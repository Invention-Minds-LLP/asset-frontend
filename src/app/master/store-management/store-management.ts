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
  // Store-keepers are identified by their department name (contains "STORE"),
  // not a role — same convention the backend uses.
  isStoreDept = ((): boolean => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return String(u?.departmentName || '').toUpperCase().includes('STORE');
    } catch { return false; }
  })();

  isRole(...roles: string[]): boolean { return roles.includes(this.userRole); }

  // Store setup (create store / add location) — admins + store-dept keepers.
  get canManageStores(): boolean { return this.isRole('ADMIN') || this.isStoreDept; }
  // Stock adjust + raising transfers — admins, store keepers, and department HODs.
  get canAdjustStock(): boolean { return this.isRole('ADMIN', 'HOD') || this.isStoreDept; }

  private leadership = ['ADMIN', 'CEO_COO', 'OPERATIONS'];
  private storeDeptOf(storeId: number | null | undefined): number | null {
    if (storeId == null) return null;
    const s = this.allStoresRaw.find((x: any) => x.id === storeId);
    return s ? (s.departmentId ?? null) : null;
  }

  // Approve shows only to the SOURCE store's custodian (HOD), on a REQUESTED row.
  canApproveRow(row: any): boolean {
    if (row?.status !== 'REQUESTED') return false;
    if (this.leadership.includes(this.userRole)) return true;
    if (this.userRole !== 'HOD') return false;
    const srcDept = this.storeDeptOf(row.fromStoreId);
    if (srcDept != null) return srcDept === this.myDeptId;
    return this.isStoreDept; // main store source → store-dept HOD
  }

  // Receive shows only to the DESTINATION's custodian (HOD/Supervisor), on an APPROVED/IN_TRANSIT row.
  canReceiveRow(row: any): boolean {
    if (row?.status !== 'APPROVED' && row?.status !== 'IN_TRANSIT') return false;
    if (this.leadership.includes(this.userRole)) return true;
    const deptCustodian = this.userRole === 'HOD' || this.userRole === 'SUPERVISOR';
    if (row.transferType === 'STORE_TO_DEPARTMENT') {
      return deptCustodian && row.toDepartmentId === this.myDeptId;
    }
    const destDept = this.storeDeptOf(row.toStoreId);
    if (destDept != null) return deptCustodian && destDept === this.myDeptId;
    return this.isStoreDept; // main store destination → store-dept
  }

  activeTab: 'stores' | 'stock' | 'transfers' | 'alerts' = 'stores';

  // Stores
  stores: any[] = [];
  storeOptions: any[] = [];
  allStoreOptions: any[] = [];
  allStoresRaw: any[] = [];
  myDeptId: number | null = Number(localStorage.getItem('departmentId')) || null;

  // From-store list — computed on the backend (role/department aware): store-dept
  // gets main + unassigned + own stores; a HOD gets only their own dept stores.
  fromStoreOptions: any[] = [];
  storeHierarchy: any = null;
  showCreateStoreDialog = false;
  storeForm: any = this.emptyStoreForm();
  savingStore = false;
  loadingStores = false;
  approvingTransfer = false;
  receivingTransfer = false;
  receivingId: number | null = null;
  approvingId: number | null = null;

  // Transfer detail dialog
  showTransferDetail = false;
  transferDetail: any = null;
  transferDetailLoading = false;

  // Cancel
  cancellingId: number | null = null;

  // Receive dialog (enter received quantities)
  showReceiveDialog = false;
  receiveTransferId: number | null = null;
  receiveTransferNo = '';
  receiveItems: any[] = [];
  receiveLoading = false;
  receiveSaving = false;
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
  stockAssets: any[] = [];
  loadingStockAssets = false;
  showAdjustDialog = false;
  adjustForm = this.emptyAdjustForm();

  sparePartOptions: any[] = [];
  consumableOptions: any[] = [];
  itemTypeOptions = [
    { label: 'Spare Part', value: 'SPARE_PART' },
    { label: 'Consumable', value: 'CONSUMABLE' },
  ];
  // Transfers can also move assets (parked IN_STORE items), not just stock
  transferItemTypeOptions = [
    { label: 'Spare Part', value: 'SPARE_PART' },
    { label: 'Consumable', value: 'CONSUMABLE' },
    { label: 'Asset', value: 'ASSET' },
  ];
  assetOptions: any[] = [];

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
    this.loadDepartments();
  }

  departments: any[] = [];

  loadDepartments() {
    this.http.get<any>(`${this.apiUrl}/departments`).subscribe({
      next: (data: any) => {
        this.departments = Array.isArray(data) ? data : (data?.data ?? []);
        setTimeout(() => this.cdr.detectChanges());
      },
      error: () => {}
    });
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
    // All stores (unscoped) for the transfer dropdowns, so you can send to any store.
    this.storeService.getOptions().subscribe({
      next: (data: any[]) => {
        this.allStoresRaw = data || [];
        this.allStoreOptions = this.allStoresRaw.map((s: any) => ({ label: `${s.code} — ${s.name}`, value: s.id }));
        setTimeout(() => this.cdr.detectChanges());
      },
      error: () => {}
    });
    // Backend-computed source stores for the transfer From dropdown.
    this.storeService.getTransferSources().subscribe({
      next: (data: any[]) => {
        this.fromStoreOptions = (data || []).map((s: any) => ({ label: `${s.code} — ${s.name}`, value: s.id }));
        setTimeout(() => this.cdr.detectChanges());
      },
      error: () => {}
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
  parkedAssets: any[] = [];
  loadingParkedAssets = false;
  showAddLocationDialog = false;
  locationForm = { rack: '', shelf: '', bin: '', label: '' };

  emptyStoreForm() {
    return { name: '', code: '', storeType: 'MAIN_STORE', parentStoreId: null, departmentId: null, address: '' };
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

    // Parked assets — IN_STORE assets physically held in this store
    this.parkedAssets = [];
    this.loadingParkedAssets = true;
    this.http.get<any>(`${this.apiUrl}/assets`, { params: { currentStoreId: String(store.id), status: 'IN_STORE' } }).subscribe({
      next: (data: any) => {
        this.parkedAssets = Array.isArray(data) ? data : (data?.data ?? []);
        this.loadingParkedAssets = false;
        setTimeout(() => this.cdr.detectChanges());
      },
      error: () => {
        this.loadingParkedAssets = false;
        setTimeout(() => this.cdr.detectChanges());
      }
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

    // Parked assets (IN_STORE) physically held in this store
    this.loadingStockAssets = true;
    this.stockAssets = [];
    this.http.get<any>(`${this.apiUrl}/assets`, { params: { currentStoreId: String(storeId), status: 'IN_STORE' } }).subscribe({
      next: (data: any) => {
        this.stockAssets = Array.isArray(data) ? data : (data?.data ?? []);
        this.loadingStockAssets = false;
        setTimeout(() => this.cdr.detectChanges());
      },
      error: () => {
        this.loadingStockAssets = false;
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
    this.loadMasterItemDropdowns();
  }

  // Full master list of spares/consumables — used by the per-store Adjust dialog,
  // where you can add any catalogue item into a store.
  private loadMasterItemDropdowns() {
    this.http.get<any>(`${this.apiUrl}/inventory/spare-parts`).subscribe({
      next: (data: any) => {
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        this.sparePartOptions = list.map((s: any) => ({ label: `${s.name}${s.partNumber ? ' (' + s.partNumber + ')' : ''}`, value: s.id }));
        setTimeout(() => this.cdr.detectChanges());
      },
      error: () => {}
    });
    this.http.get<any>(`${this.apiUrl}/inventory/consumables`).subscribe({
      next: (data: any) => {
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        this.consumableOptions = list.map((c: any) => ({ label: c.name, value: c.id }));
        setTimeout(() => this.cdr.detectChanges());
      },
      error: () => {}
    });
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
    return { fromStoreId: null, toStoreId: null, toDepartmentId: null, transferType: 'STORE_TO_STORE', remarks: '', items: [this.emptyTransferItem()] };
  }

  onTransferTypeChange() {
    // Destination depends on the type — clear the other one when switching
    this.transferForm.toStoreId = null;
    this.transferForm.toDepartmentId = null;
  }

  emptyTransferItem() {
    return { itemType: 'SPARE_PART' as string, sparePartId: null as number | null, consumableId: null as number | null, assetId: null as number | null, quantity: 1 };
  }

  onTransferItemTypeChange(item: any) {
    item.sparePartId = null;
    item.consumableId = null;
    item.assetId = null;
    if (item.itemType === 'ASSET') item.quantity = 1;
  }

  onTransferFromStoreChange() {
    // Source changed → clear options and any picked items (they may not exist in the new store).
    this.assetOptions = [];
    this.sparePartOptions = [];
    this.consumableOptions = [];
    this.transferForm.items.forEach((it: any) => { it.sparePartId = null; it.consumableId = null; it.assetId = null; });

    const fromId = this.transferForm.fromStoreId;
    if (!fromId) return;

    // Assets currently parked (IN_STORE) in the source store are transfer-eligible
    this.http.get<any>(`${this.apiUrl}/assets`, { params: { currentStoreId: String(fromId), status: 'IN_STORE' } }).subscribe({
      next: (data: any) => {
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        this.assetOptions = list.map((a: any) => {
          const makeModel = [a.manufacturer, a.modelNumber].filter(Boolean).join(' ');
          return { label: `${a.assetName} (${a.assetId})${makeModel ? ` · ${makeModel}` : ''}`, value: a.id };
        });
        setTimeout(() => this.cdr.detectChanges());
      },
      error: () => {}
    });

    // Only spares/consumables actually stocked (available) in the source store.
    this.http.get<any>(`${this.apiUrl}/store-stock/${fromId}`).subscribe({
      next: (data: any) => {
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        this.sparePartOptions = list
          .filter((s: any) => s.itemType === 'SPARE_PART' && s.sparePartId && Number(s.availableQty) > 0)
          .map((s: any) => ({ label: `${s.itemName} — ${s.availableQty} avail`, value: s.sparePartId }));
        this.consumableOptions = list
          .filter((s: any) => s.itemType === 'CONSUMABLE' && s.consumableId && Number(s.availableQty) > 0)
          .map((s: any) => ({ label: `${s.itemName} — ${s.availableQty} avail`, value: s.consumableId }));
        setTimeout(() => this.cdr.detectChanges());
      },
      error: () => {}
    });
  }

  openCreateTransfer() {
    this.transferForm = this.emptyTransferForm();
    this.showCreateTransferDialog = true;
    // Item options are loaded from the source store's stock once "From Store" is picked.
    this.sparePartOptions = [];
    this.consumableOptions = [];
    this.assetOptions = [];
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
    this.approvingId = id;
    this.transferService.approve(id, {}).subscribe({
      next: () => {
        this.approvingId = null;
        this.messageService.add({ severity: 'success', summary: 'Approved', detail: 'Transfer has been approved.' });
        this.loadTransfers();
      },
      error: (err: any) => {
        this.approvingId = null;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to approve transfer.' });
      }
    });
  }

  openTransferDetail(row: any) {
    this.showTransferDetail = true;
    this.transferDetail = null;
    this.transferDetailLoading = true;
    this.transferService.getById(row.id).subscribe({
      next: (data: any) => setTimeout(() => { this.transferDetail = data; this.transferDetailLoading = false; this.cdr.detectChanges(); }),
      error: () => setTimeout(() => { this.transferDetailLoading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load transfer details' }); this.cdr.detectChanges(); })
    });
  }

  // Open the receive dialog — load the transfer's items so the receiver can
  // confirm/adjust the quantity actually received per line.
  openReceiveDialog(row: any) {
    this.showReceiveDialog = true;
    this.receiveTransferId = row.id;
    this.receiveTransferNo = row.transferNumber || row.id;
    this.receiveItems = [];
    this.receiveLoading = true;
    this.transferService.getById(row.id).subscribe({
      next: (data: any) => setTimeout(() => {
        this.receiveItems = (data?.items || []).map((it: any) => ({
          itemId: it.id,
          itemName: it.itemName || '—',
          itemType: it.itemType,
          sent: Number(it.quantity),
          receivedQty: Number(it.quantity), // default: received in full
        }));
        this.receiveLoading = false;
        this.cdr.detectChanges();
      }),
      error: () => setTimeout(() => { this.receiveLoading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load items' }); this.cdr.detectChanges(); })
    });
  }

  submitReceive() {
    if (!this.receiveTransferId) return;
    for (const it of this.receiveItems) {
      const rq = Number(it.receivedQty);
      if (isNaN(rq) || rq < 0 || rq > it.sent) {
        this.messageService.add({ severity: 'warn', summary: 'Check quantities', detail: `"${it.itemName}" received must be between 0 and ${it.sent}.` });
        return;
      }
    }
    const payload = { receivedItems: this.receiveItems.map((it: any) => ({ itemId: it.itemId, receivedQty: Number(it.receivedQty) })) };
    this.receiveSaving = true;
    this.receivingId = this.receiveTransferId;
    this.transferService.receive(this.receiveTransferId, payload).subscribe({
      next: () => {
        this.receiveSaving = false;
        this.receivingId = null;
        this.showReceiveDialog = false;
        this.messageService.add({ severity: 'success', summary: 'Received', detail: 'Transfer received.' });
        this.loadTransfers();
      },
      error: (err: any) => {
        this.receiveSaving = false;
        this.receivingId = null;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to receive transfer.' });
      }
    });
  }

  cancelTransferRow(row: any) {
    if (!confirm(`Cancel transfer ${row.transferNumber || row.id}? The reserved stock will be released.`)) return;
    this.cancellingId = row.id;
    this.transferService.cancel(row.id).subscribe({
      next: () => {
        this.cancellingId = null;
        this.messageService.add({ severity: 'success', summary: 'Cancelled', detail: 'Transfer cancelled.' });
        this.loadTransfers();
      },
      error: (err: any) => {
        this.cancellingId = null;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to cancel transfer.' });
      }
    });
  }

  getTransferStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const map: any = { REQUESTED: 'warn', APPROVED: 'info', IN_TRANSIT: 'contrast', RECEIVED: 'success', CANCELLED: 'danger' };
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
