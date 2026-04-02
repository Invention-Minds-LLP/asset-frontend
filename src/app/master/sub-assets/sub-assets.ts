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
import { MessageService } from 'primeng/api';
import { Assets } from '../../services/assets/assets';

@Component({
  selector: 'app-sub-assets',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TableModule, TagModule,
    ToastModule, SelectModule, DialogModule, InputTextModule,
    InputNumberModule, TooltipModule, TextareaModule,
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

  // ─── Replace Sub-Asset dialog ─────────────────────────────────────────────
  showReplaceDialog = false;
  replaceTarget: any = null;
  replaceParentAssetId: string | null = null;
  replaceSaving = false;
  replaceForm: any = {};

  // ─── Dropdown options ─────────────────────────────────────────────────────
  sparePartOptions: { label: string; value: number }[] = [];
  spareSearchQuery = '';

  readonly sourceTypeOptions = [
    { label: 'New Component', value: 'NEW' },
    { label: 'From Inventory (Spare Part)', value: 'INVENTORY_SPARE' },
  ];

  readonly assetTypeOptions = [
    { label: 'Medical Equipment', value: 'MEDICAL_EQUIPMENT' },
    { label: 'IT Equipment', value: 'IT_EQUIPMENT' },
    { label: 'Furniture', value: 'FURNITURE' },
    { label: 'Vehicle', value: 'VEHICLE' },
    { label: 'Infrastructure', value: 'INFRASTRUCTURE' },
    { label: 'Other', value: 'OTHER' },
  ];

  readonly categoryOptions = [
    { label: 'Diagnostic', value: 'DIAGNOSTIC' },
    { label: 'Surgical', value: 'SURGICAL' },
    { label: 'Monitoring', value: 'MONITORING' },
    { label: 'Laboratory', value: 'LABORATORY' },
    { label: 'IT', value: 'IT' },
    { label: 'Office', value: 'OFFICE' },
    { label: 'Other', value: 'OTHER' },
  ];

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
  }

  // ─── Load ─────────────────────────────────────────────────────────────────

  loadAssets() {
    this.loading = true;
    this.assetsAPI.getAllAssets().subscribe({
      next: (data: any) => {
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        // Only parent assets (no parentAssetId) or assets that may have sub-assets
        this.allAssets = list;
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
    this.showAddDialog = true;
  }

  onAddSourceChange() {
    this.addForm.sparePartId = null;
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

    this.addSaving = true;
    const payload: any = {
      sourceType: this.addForm.sourceType,
      condition: this.addForm.condition || 'NEW',
      notes: this.addForm.notes || null,
    };

    if (this.addForm.sourceType === 'INVENTORY_SPARE') {
      payload.sparePartId = Number(this.addForm.sparePartId);
      payload.serialNumber = this.addForm.serialNumber || null;
    } else {
      payload.assetName = this.addForm.assetName.trim();
      payload.serialNumber = this.addForm.serialNumber || null;
      payload.assetType = this.addForm.assetType || null;
      payload.procurementType = this.addForm.procurementType || null;
      payload.cost = this.addForm.cost ? Number(this.addForm.cost) : null;
      payload.invoiceNumber = this.addForm.invoiceNumber || null;
      payload.purchaseDate = this.addForm.purchaseDate || null;
    }

    this.assetsAPI.createSubAsset(this.addParentAssetId, payload).subscribe({
      next: () => {
        setTimeout(() => {
          this.addSaving = false;
          this.showAddDialog = false;
          this.toast('success', 'Sub-asset added successfully');
          // Reload sub-assets if the parent is expanded
          const parent = this.allAssets.find(a => a.assetId === this.addParentAssetId);
          if (parent && this.expandedAssetId === parent.id) {
            this.subAssetsLoading = true;
            this.assetsAPI.getChildren(this.addParentAssetId!).subscribe({
              next: (res: any) => {
                const children = Array.isArray(res) ? res : (res?.children ?? res?.data ?? []);
                this.subAssets = children;
                this.subAssetsLoading = false;
                this.cdr.detectChanges();
              }
            });
          }
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.addSaving = false;
        this.toast('error', err?.error?.message || 'Failed to add sub-asset');
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
    this.sparePartOptions = [];
    this.showReplaceDialog = true;
  }

  onReplaceSourceChange() {
    this.replaceForm.sparePartId = null;
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
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.replaceSaving = false;
        this.toast('error', err?.error?.message || 'Failed to replace sub-asset');
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
