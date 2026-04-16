import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { MessageService } from 'primeng/api';
import { QuickActionsService } from '../../services/quick-actions/quick-actions';
import { Assets } from '../../services/assets/assets';

@Component({
  selector: 'app-quick-actions',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, TableModule,
    TagModule, ToastModule, CheckboxModule, SelectModule, MultiSelectModule],
  templateUrl: './quick-actions.html',
  styleUrl: './quick-actions.css',
  providers: [MessageService]
})
export class QuickActionsPage implements OnInit {
  // ── Shared asset list ────────────────────────────────────────────────────
  assetOptions: { label: string; value: number }[] = [];
  assetsLoading = false;

  // ── Duplicate Asset ──────────────────────────────────────────────────────
  dupSourceAssetId: number | null = null;
  dupNewAssetId = '';
  dupNewSerial = '';
  dupLoading = false;

  // ── Bulk Status Update ───────────────────────────────────────────────────
  bulkAssets: any[] = [];
  bulkAssetsLoading = false;
  bulkSelectedIds: number[] = [];
  bulkStatus = '';
  bulkStatusLoading = false;

  statusOptions = [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Under Maintenance', value: 'UNDER_MAINTENANCE' },
    { label: 'Disposed', value: 'DISPOSED' },
    { label: 'Retired', value: 'RETIRED' },
    { label: 'Lost', value: 'LOST' },
  ];

  // ── QR Bulk Print ────────────────────────────────────────────────────────
  qrSelectedIds: number[] = [];
  qrData: any[] = [];
  qrLoading = false;

  constructor(
    private quickActionsService: QuickActionsService,
    private assetsService: Assets,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() { this.loadAllAssets(); }

  loadAllAssets() {
    this.assetsLoading = true;
    this.assetsService.getAllAssets().subscribe({
      next: (res: any) => {
        const list: any[] = res.data || res || [];
        this.assetOptions = list.map((a: any) => ({
          label: `${a.assetId} — ${a.assetName}`,
          value: a.id
        }));
        this.assetsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.assetsLoading = false; }
    });
  }

  // ── Duplicate ────────────────────────────────────────────────────────────
  duplicateAsset() {
    if (!this.dupSourceAssetId || !this.dupNewAssetId || !this.dupNewSerial) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'All three fields are required' });
      return;
    }
    this.dupLoading = true;
    this.quickActionsService.duplicateAsset(this.dupSourceAssetId, {
      assetId: this.dupNewAssetId, serialNumber: this.dupNewSerial
    }).subscribe({
      next: (_res: any) => {
        this.dupLoading = false;
        this.messageService.add({ severity: 'success', summary: 'Duplicated', detail: `Asset cloned as ${this.dupNewAssetId}` });
        this.dupSourceAssetId = null; this.dupNewAssetId = ''; this.dupNewSerial = '';
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.dupLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Duplication failed' });
        this.cdr.detectChanges();
      }
    });
  }

  // ── Bulk Status ──────────────────────────────────────────────────────────
  loadBulkAssets() {
    this.bulkAssetsLoading = true;
    this.assetsService.getAllAssets().subscribe({
      next: (res: any) => {
        this.bulkAssets = res.data || res || [];
        this.bulkAssetsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.bulkAssetsLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleBulkSelect(id: number) {
    const idx = this.bulkSelectedIds.indexOf(id);
    if (idx === -1) this.bulkSelectedIds.push(id);
    else this.bulkSelectedIds.splice(idx, 1);
  }

  isBulkSelected(id: number): boolean { return this.bulkSelectedIds.includes(id); }

  applyBulkStatus() {
    if (!this.bulkSelectedIds.length || !this.bulkStatus) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Select assets and a status' });
      return;
    }
    this.bulkStatusLoading = true;
    this.quickActionsService.bulkUpdateStatus({ assetIds: this.bulkSelectedIds, status: this.bulkStatus }).subscribe({
      next: (_res: any) => {
        this.bulkStatusLoading = false;
        this.messageService.add({ severity: 'success', summary: 'Updated', detail: `${this.bulkSelectedIds.length} asset(s) updated to ${this.bulkStatus}` });
        this.bulkSelectedIds = [];
        this.loadBulkAssets();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.bulkStatusLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Bulk update failed' });
        this.cdr.detectChanges();
      }
    });
  }

  // ── QR Bulk Print ────────────────────────────────────────────────────────
  loadQRData() {
    if (!this.qrSelectedIds.length) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Select at least one asset' });
      return;
    }
    const ids = this.qrSelectedIds;
    this.qrLoading = true;
    this.quickActionsService.getQRBulkPrintData(ids).subscribe({
      next: (res: any[]) => {
        this.qrData = res;
        this.qrLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.qrLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  printQR() { window.print(); }
}
