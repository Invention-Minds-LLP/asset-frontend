import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { TextareaModule } from 'primeng/textarea';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageService } from 'primeng/api';
import { Assets } from '../../services/assets/assets';
import { OverflowTooltipDirective } from '../../shared/directives/overflow-tooltip.directive';

@Component({
  selector: 'app-sub-assets',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TableModule, TagModule,
    ToastModule, SelectModule, DialogModule, InputTextModule,
    InputNumberModule, TooltipModule, TextareaModule,
    OverflowTooltipDirective, IconFieldModule, InputIconModule,
  ],
  templateUrl: './sub-assets.html',
  styleUrl: './sub-assets.css',
  providers: [MessageService]
})
export class SubAssets implements OnInit {

  // ─── Asset list ───────────────────────────────────────────────────────────
  allAssets: any[] = [];
  filteredAssets: any[] = [];
  searchQuery = '';
  loading = false;

  // ─── Expanded sub-assets ──────────────────────────────────────────────────
  expandedAssetId: number | null = null;
  subAssets: any[] = [];
  subAssetsLoading = false;

  // ─── Replacement history ──────────────────────────────────────────────────
  showHistoryDialog = false;
  historyParentId: string | null = null;
  historyParentName = '';
  historyRecords: any[] = [];
  historyLoading = false;

  // ─── Add Sub-Asset dialog ─────────────────────────────────────────────────
  showAddDialog = false;
  addParentAssetId: string | null = null;
  addParentName = '';
  addSaving = false;
  addForm: any = {};

  // ─── 40% threshold warning dialog ────────────────────────────────────────
  showThresholdDialog = false;
  thresholdInfo: any = null;   // { message, parentValue, subAssetValue, percentage }

  // ─── Replace Sub-Asset dialog ─────────────────────────────────────────────
  showReplaceDialog = false;
  replaceTarget: any = null;
  replaceParentAssetId: string | null = null;
  replaceSaving = false;
  replaceForm: any = {};

  // ─── Dropdown options ─────────────────────────────────────────────────────
  sparePartOptions: any[] = [];
  consumableOptions: any[] = [];
  spareSearchQuery = '';

  // Auto-fill cost from the selected inventory item (unit cost).
  onAddInventorySelect() {
    const opts = this.addForm.sourceType === 'INVENTORY_CONSUMABLE' ? this.consumableOptions : this.sparePartOptions;
    const id = this.addForm.sourceType === 'INVENTORY_CONSUMABLE' ? this.addForm.consumableId : this.addForm.sparePartId;
    const opt = opts.find((o: any) => o.value === id);
    this.addForm.cost = opt?.cost ?? null;
  }
  onReplaceInventorySelect() {
    const opts = this.replaceForm.sourceType === 'INVENTORY_CONSUMABLE' ? this.consumableOptions : this.sparePartOptions;
    const id = this.replaceForm.sourceType === 'INVENTORY_CONSUMABLE' ? this.replaceForm.consumableId : this.replaceForm.sparePartId;
    const opt = opts.find((o: any) => o.value === id);
    this.replaceForm.cost = opt?.cost ?? null;
  }

  readonly sourceTypeOptions = [
    { label: 'New Component', value: 'NEW' },
    { label: 'From Inventory (Spare Part)', value: 'INVENTORY_SPARE' },
    { label: 'From Inventory (Consumable)', value: 'INVENTORY_CONSUMABLE' },
  ];

  // Load spares + consumables stocked in the parent's department store.
  loadDeptInventory(parentAssetId: string) {
    this.sparePartOptions = [];
    this.consumableOptions = [];
    this.assetsAPI.getSubAssetInventory(parentAssetId).subscribe({
      next: (res) => setTimeout(() => {
        this.sparePartOptions = res?.spares || [];
        this.consumableOptions = res?.consumables || [];
        this.cdr.detectChanges();
      }),
      error: () => {}
    });
  }

  // Asset Type = how the asset is classified physically (matches the main form).
  readonly assetTypeOptions = [
    { label: 'Fixed', value: 'FIXED' },
    { label: 'Movable', value: 'MOVABLE' },
  ];

  // Real asset categories (id + name), loaded from the API.
  categories: { id: number; name: string }[] = [];

  readonly procurementOptions = [
    { label: 'Purchase', value: 'PURCHASE' },
    { label: 'Donation', value: 'DONATION' },
    { label: 'Lease', value: 'LEASE' },
    { label: 'Rental', value: 'RENTAL' },
  ];

  readonly conditionOptions = [
    { label: 'New', value: 'NEW' },
    { label: 'Good', value: 'GOOD' },
    { label: 'Fair', value: 'FAIR' },
    { label: 'Poor', value: 'POOR' },
  ];

  constructor(
    private assetsAPI: Assets,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadAssets();
    this.assetsAPI.getCategories().subscribe({
      next: (rows: any) => { this.categories = (rows || []).map((c: any) => ({ id: c.id, name: c.name })); },
      error: () => {},
    });
  }

  // ─── Load ─────────────────────────────────────────────────────────────────

  loadAssets() {
    this.loading = true;
    this.assetsAPI.getAllAssets().subscribe({
      next: (data: any) => {
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        // Only parent assets (no parentAssetId) or assets that may have sub-assets
        this.allAssets = list;
        console.log('Loaded assets:', this.allAssets);
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.toast('error', 'Failed to load assets');
      }
    });
  }

  applyFilter() {
    const q = this.searchQuery.toLowerCase().trim();
    this.filteredAssets = q
      ? this.allAssets.filter(a =>
          a.assetName?.toLowerCase().includes(q) ||
          a.assetId?.toLowerCase().includes(q) ||
          a.category?.name?.toLowerCase().includes(q)
        )
      : [...this.allAssets];
  }

  onSearch() {
    this.applyFilter();
  }

  // ─── Expand asset to view sub-assets ─────────────────────────────────────

  toggleExpand(asset: any) {
    if (this.expandedAssetId === asset.id) {
      this.expandedAssetId = null;
      this.subAssets = [];
      return;
    }
    this.expandedAssetId = asset.id;
    this.subAssets = [];
    this.subAssetsLoading = true;

    this.assetsAPI.getChildren(asset.assetId).subscribe({
      next: (res: any) => {
        const children = Array.isArray(res) ? res : (res?.children ?? res?.data ?? []);
        setTimeout(() => {
          this.subAssets = children;
          this.subAssetsLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.subAssetsLoading = false;
        this.toast('error', 'Failed to load sub-assets');
      }
    });
  }

  // ─── Replacement history ──────────────────────────────────────────────────

  openHistory(asset: any) {
    this.historyParentId = asset.assetId;
    this.historyParentName = `${asset.assetId} — ${asset.assetName}`;
    this.historyRecords = [];
    this.historyLoading = true;
    this.showHistoryDialog = true;

    this.assetsAPI.getReplacementHistory(asset.assetId).subscribe({
      next: (res: any[]) => {
        setTimeout(() => {
          this.historyRecords = res || [];
          this.historyLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.historyLoading = false;
        this.toast('error', 'Failed to load replacement history');
      }
    });
  }

  // ─── Add Sub-Asset ────────────────────────────────────────────────────────

  openAddDialog(asset: any) {
    this.addParentAssetId = asset.assetId;
    this.addParentName = `${asset.assetId} — ${asset.assetName}`;
    this.addForm = {
      sourceType: 'NEW',
      sparePartId: null,
      consumableId: null,
      assetName: '',
      serialNumber: '',
      assetType: null,
      categoryId: null,
      procurementType: null,
      cost: null,
      invoiceNumber: '',
      purchaseDate: '',
      condition: 'NEW',
      notes: ''
    };
    this.loadDeptInventory(asset.assetId);
    this.showAddDialog = true;
  }

  onAddSourceChange() {
    this.addForm.sparePartId = null;
    this.addForm.consumableId = null;
    this.addForm.assetName = '';
    this.addForm.serialNumber = '';
  }

  searchSpareParts(query: string) {
    if (!query || query.length < 2) return;
    this.assetsAPI.searchSpareParts(query).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.sparePartOptions = res || [];
          this.cdr.detectChanges();
        });
      }
    });
  }

  submitAdd() {
    if (!this.addParentAssetId) return;

    if (this.addForm.sourceType === 'NEW' && !this.addForm.assetName?.trim()) {
      this.toast('warn', 'Component name is required');
      return;
    }
    if (this.addForm.sourceType === 'INVENTORY_SPARE' && !this.addForm.sparePartId) {
      this.toast('warn', 'Please select a spare part');
      return;
    }
    if (this.addForm.sourceType === 'INVENTORY_CONSUMABLE' && !this.addForm.consumableId) {
      this.toast('warn', 'Please select a consumable');
      return;
    }

    this.addSaving = true;
    // Field names must match the backend contract. Category & status are
    // inherited from the parent server-side, so they're not sent here.
    const payload: any = {
      sourceType: this.addForm.sourceType,
      assetCondition: this.addForm.condition || 'NEW',
      remarks: this.addForm.notes || null,
    };

    if (this.addForm.sourceType === 'INVENTORY_SPARE') {
      payload.sparePartId = Number(this.addForm.sparePartId);
      payload.serialNumber = this.addForm.serialNumber || null;
      payload.purchaseCost = this.addForm.cost != null && this.addForm.cost !== '' ? Number(this.addForm.cost) : null;
    } else if (this.addForm.sourceType === 'INVENTORY_CONSUMABLE') {
      payload.consumableId = Number(this.addForm.consumableId);
      payload.serialNumber = this.addForm.serialNumber || null;
      payload.purchaseCost = this.addForm.cost != null && this.addForm.cost !== '' ? Number(this.addForm.cost) : null;
    } else {
      payload.assetName = this.addForm.assetName.trim();
      payload.serialNumber = this.addForm.serialNumber || null;
      payload.assetType = this.addForm.assetType || null;
      // Real category id; if left blank the backend inherits the parent's category.
      if (this.addForm.categoryId) payload.assetCategoryId = Number(this.addForm.categoryId);
      payload.modeOfProcurement = this.addForm.procurementType || null;
      payload.purchaseCost = this.addForm.cost ? Number(this.addForm.cost) : null;
      payload.invoiceNumber = this.addForm.invoiceNumber || null;
      payload.purchaseDate = this.addForm.purchaseDate || null;
    }

    this.assetsAPI.createSubAsset(this.addParentAssetId, payload).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.addSaving = false;
          this.showAddDialog = false;
          const msg = res?.createdAsStandalone
            ? 'Asset created as a standalone Functional Asset'
            : 'Sub-asset added successfully';
          this.toast('success', msg);
          const parent = this.allAssets.find(a => a.assetId === this.addParentAssetId);
          if (parent && this.expandedAssetId === parent.id) {
            this.subAssetsLoading = true;
            this.assetsAPI.getChildren(this.addParentAssetId!).subscribe({
              next: (r: any) => {
                const children = Array.isArray(r) ? r : (r?.children ?? r?.data ?? []);
                this.subAssets = children;
                this.subAssetsLoading = false;
                this.cdr.detectChanges();
              }
            });
          }
          this.loadAssets();
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.addSaving = false;
        const body = err?.error;
        if (err?.status === 422 && body?.thresholdWarning) {
          this.thresholdInfo = body;
          this.showThresholdDialog = true;
        } else {
          this.toast('error', body?.message || 'Failed to add sub-asset');
        }
      }
    });
  }

  // ─── Replace Sub-Asset ────────────────────────────────────────────────────

  openReplaceDialog(sub: any, parentAssetId: string) {
    this.replaceTarget = sub;
    this.replaceParentAssetId = parentAssetId;
    this.replaceForm = {
      sourceType: 'NEW',
      sparePartId: null,
      consumableId: null,
      spareSerial: '',
      assetName: '',
      serialNumber: '',
      assetType: null,
      categoryId: null,
      procurementType: null,
      cost: null,
      invoiceNumber: '',
      purchaseDate: '',
      replacementCost: null,
      conditionAtReplacement: 'FAIR',
      reason: '',
    };
    this.loadDeptInventory(parentAssetId);
    this.showReplaceDialog = true;
  }

  onReplaceSourceChange() {
    this.replaceForm.sparePartId = null;
    this.replaceForm.consumableId = null;
    this.replaceForm.spareSerial = '';
    this.replaceForm.assetName = '';
    this.replaceForm.serialNumber = '';
  }

  submitReplace() {
    if (!this.replaceParentAssetId || !this.replaceTarget) return;

    if (this.replaceForm.sourceType === 'NEW' && !this.replaceForm.assetName?.trim()) {
      this.toast('warn', 'New component name is required');
      return;
    }
    if (this.replaceForm.sourceType === 'INVENTORY_SPARE' && !this.replaceForm.sparePartId) {
      this.toast('warn', 'Please select a spare part');
      return;
    }
    if (this.replaceForm.sourceType === 'INVENTORY_CONSUMABLE' && !this.replaceForm.consumableId) {
      this.toast('warn', 'Please select a consumable');
      return;
    }

    this.replaceSaving = true;
    const payload: any = {
      sourceType: this.replaceForm.sourceType,
      replacementCost: this.replaceForm.replacementCost ? Number(this.replaceForm.replacementCost) : null,
      conditionAtReplacement: this.replaceForm.conditionAtReplacement || null,
      reason: this.replaceForm.reason || null,
    };

    if (this.replaceForm.sourceType === 'INVENTORY_SPARE') {
      payload.sparePartId = Number(this.replaceForm.sparePartId);
      payload.serialNumber = this.replaceForm.spareSerial || null;
      payload.cost = this.replaceForm.cost != null && this.replaceForm.cost !== '' ? Number(this.replaceForm.cost) : null;
    } else if (this.replaceForm.sourceType === 'INVENTORY_CONSUMABLE') {
      payload.consumableId = Number(this.replaceForm.consumableId);
      payload.serialNumber = this.replaceForm.spareSerial || null;
      payload.cost = this.replaceForm.cost != null && this.replaceForm.cost !== '' ? Number(this.replaceForm.cost) : null;
    } else {
      payload.assetName = this.replaceForm.assetName.trim();
      payload.serialNumber = this.replaceForm.serialNumber || null;
      payload.assetType = this.replaceForm.assetType || null;
      payload.procurementType = this.replaceForm.procurementType || null;
      payload.cost = this.replaceForm.cost ? Number(this.replaceForm.cost) : null;
      payload.invoiceNumber = this.replaceForm.invoiceNumber || null;
      payload.purchaseDate = this.replaceForm.purchaseDate || null;
    }

    this.assetsAPI.replaceSubAsset(this.replaceParentAssetId, this.replaceTarget.assetId, payload).subscribe({
      next: () => {
        setTimeout(() => {
          this.replaceSaving = false;
          this.showReplaceDialog = false;
          this.toast('success', 'Sub-asset replaced successfully');
          // Reload sub-assets
          this.assetsAPI.getChildren(this.replaceParentAssetId!).subscribe({
            next: (res: any) => {
              const children = Array.isArray(res) ? res : (res?.children ?? res?.data ?? []);
              this.subAssets = children;
              this.cdr.detectChanges();
            }
          });
          this.loadAssets();
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.replaceSaving = false;
        this.toast('error', err?.error?.message || 'Failed to replace sub-asset');
      }
    });
  }

  // ─── Threshold dialog actions ─────────────────────────────────────────────

  proceedAsSubAsset() {
    this.showThresholdDialog = false;
    if (!this.addParentAssetId) return;
    const payload = this._buildAddPayload();
    payload.forceCreate = true;
    this._submitAddPayload(payload);
  }

  proceedAsStandalone() {
    this.showThresholdDialog = false;
    if (!this.addParentAssetId) return;
    const payload = this._buildAddPayload();
    payload.createAsStandalone = true;
    this._submitAddPayload(payload);
  }

  private _buildAddPayload(): any {
    const payload: any = {
      sourceType: this.addForm.sourceType,
      condition: this.addForm.condition || 'NEW',
      notes: this.addForm.notes || null,
    };
    if (this.addForm.sourceType === 'INVENTORY_SPARE') {
      payload.sparePartId = Number(this.addForm.sparePartId);
      payload.serialNumber = this.addForm.serialNumber || null;
    } else {
      payload.assetName = this.addForm.assetName?.trim();
      payload.serialNumber = this.addForm.serialNumber || null;
      payload.assetType = this.addForm.assetType || null;
      payload.procurementType = this.addForm.procurementType || null;
      payload.cost = this.addForm.cost ? Number(this.addForm.cost) : null;
      payload.purchaseCost = this.addForm.cost ? Number(this.addForm.cost) : null;
      payload.invoiceNumber = this.addForm.invoiceNumber || null;
      payload.purchaseDate = this.addForm.purchaseDate || null;
    }
    return payload;
  }

  private _submitAddPayload(payload: any) {
    this.addSaving = true;
    this.assetsAPI.createSubAsset(this.addParentAssetId!, payload).subscribe({
      next: (res: any) => {
        this.addSaving = false;
        this.showAddDialog = false;
        const msg = res?.createdAsStandalone
          ? 'Asset created as a standalone Functional Asset'
          : 'Sub-asset added successfully';
        this.toast('success', msg);
        if (this.expandedAssetId) {
          this.subAssetsLoading = true;
          this.assetsAPI.getChildren(this.addParentAssetId!).subscribe({
            next: (r: any) => {
              this.subAssets = Array.isArray(r) ? r : (r?.children ?? r?.data ?? []);
              this.subAssetsLoading = false;
              this.cdr.detectChanges();
            }
          });
        }
        this.loadAssets();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.addSaving = false;
        this.toast('error', err?.error?.message || 'Failed');
      }
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  getStatusSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    const map: Record<string, any> = {
      ACTIVE: 'success',
      IN_STORE: 'info',
      UNDER_MAINTENANCE: 'warn',
      CONDEMNED: 'danger',
      DISPOSED: 'secondary',
    };
    return map[status] ?? 'secondary';
  }

  toast(severity: 'success' | 'error' | 'warn', detail: string) {
    this.messageService.add({ severity, summary: severity.toUpperCase(), detail });
  }
}
