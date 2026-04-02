import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';
import { Warranty } from '../../services/warranty/warranty';
import { ServiceContract } from '../../services/service-contract/service-contract';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environment/environment.prod';

@Component({
  selector: 'app-warranty-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TableModule, TagModule, ToastModule, InputTextModule, SelectModule, DialogModule, TooltipModule, DatePickerModule, InputNumberModule, TextareaModule],
  templateUrl: './warranty-management.html',
  styleUrl: './warranty-management.css',
  providers: [MessageService]
})
export class WarrantyManagement implements OnInit {
  warranties: any[] = [];
  loading = false;
  totalRecords = 0;
  stats: any = {};

  search = '';
  status = '';
  page = 1;

  statusOptions = [
    { label: 'All', value: '' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Expired', value: 'EXPIRED' },
    { label: 'Expiring Soon', value: 'EXPIRING_SOON' }
  ];

  // Detail dialog
  showDetailDialog = false;
  selectedWarranty: any = null;
  detailTab: 'info' | 'contracts' | 'visits' | 'history' | 'renew' = 'info';

  // Linked data
  linkedContracts: any[] = [];
  linkedVisits: any[] = [];
  maintenanceHistory: any[] = [];
  loadingDetail = false;

  // Renew
  renewForm = { warrantyEnd: null as Date | null, warrantyProvider: '', coverageDetails: '', notes: '' };
  renewingWarranty = false;

  userRole = localStorage.getItem('role') || '';
  isRole(...roles: string[]): boolean { return roles.includes(this.userRole); }

  constructor(
    private warrantyService: Warranty,
    private contractService: ServiceContract,
    private http: HttpClient,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loadStats();
    this.loadWarranties();
  }

  loadStats() {
    this.warrantyService.getWarrantyStats().subscribe({
      next: (res) => { setTimeout(() => { this.stats = res; this.cdr.detectChanges(); }); },
      error: () => {}
    });
  }

  loadWarranties() {
    this.loading = true;
    const params: any = { page: this.page, limit: 15 };
    if (this.search) params.search = this.search;
    if (this.status) params.status = this.status;

    this.warrantyService.getAllWarrantiesPaginated(params).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.warranties = res.data || res;
          this.totalRecords = res.total || this.warranties.length;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load warranties' }); this.cdr.detectChanges(); });
      }
    });
  }

  exportCsv() {
    this.warrantyService.exportWarrantiesCsv().subscribe({
      next: (blob) => { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'warranties.csv'; a.click(); URL.revokeObjectURL(url); },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Export failed' })
    });
  }

  // ── Detail Dialog ──

  viewWarranty(w: any) {
    this.selectedWarranty = w;
    this.detailTab = 'info';
    this.linkedContracts = [];
    this.linkedVisits = [];
    this.maintenanceHistory = [];
    this.showDetailDialog = true;
    this.loadDetailData(w);
  }

  loadDetailData(w: any) {
    this.loadingDetail = true;
    const assetId = w.asset?.id || w.assetId;
    if (!assetId) { this.loadingDetail = false; return; }

    // Load linked service contracts for this asset
    this.contractService.getAllPaginated({ assetId }).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.linkedContracts = Array.isArray(res) ? res : (res?.data ?? []);
          this.cdr.detectChanges();
        });
      },
      error: () => {}
    });

    // Load maintenance history for this asset
    const assetStringId = w.asset?.assetId || String(assetId);
    this.warrantyService.getMaintenanceHistory(assetStringId).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.maintenanceHistory = Array.isArray(res) ? res : (res?.data ?? []);
          this.loadingDetail = false;
          this.cdr.detectChanges();
        });
      },
      error: () => { this.loadingDetail = false; setTimeout(() => this.cdr.detectChanges()); }
    });
  }

  openContractVisits(contract: any) {
    this.contractService.getVisits(contract.id).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.linkedVisits = Array.isArray(res) ? res : (res?.data ?? []);
          this.detailTab = 'visits';
          this.cdr.detectChanges();
        });
      },
      error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load visits' }); }
    });
  }

  // ── Renew Warranty ──

  openRenew() {
    this.renewForm = { warrantyEnd: null, warrantyProvider: this.selectedWarranty?.warrantyProvider || '', coverageDetails: '', notes: '' };
    this.detailTab = 'renew';
  }

  submitRenew() {
    if (!this.renewForm.warrantyEnd) {
      this.messageService.add({ severity: 'warn', summary: 'Missing', detail: 'New warranty end date is required' });
      return;
    }
    this.renewingWarranty = true;
    const assetStringId = this.selectedWarranty?.asset?.assetId || String(this.selectedWarranty?.assetId);
    this.warrantyService.renewWarranty(assetStringId, {
      warrantyEnd: new Date(this.renewForm.warrantyEnd).toISOString(),
      warrantyProvider: this.renewForm.warrantyProvider,
      coverageDetails: this.renewForm.coverageDetails,
      notes: this.renewForm.notes,
    }).subscribe({
      next: () => {
        setTimeout(() => {
          this.renewingWarranty = false;
          this.messageService.add({ severity: 'success', summary: 'Renewed', detail: 'Warranty renewed successfully' });
          this.showDetailDialog = false;
          this.loadWarranties();
          this.loadStats();
          this.cdr.detectChanges();
        });
      },
      error: (err: any) => {
        this.renewingWarranty = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to renew warranty' });
        setTimeout(() => this.cdr.detectChanges());
      }
    });
  }

  // ── Helpers ──

  getStatusSeverity(w: any): "success" | "danger" | "warn" {
    if (!w.warrantyEnd) return 'success';
    const daysLeft = Math.ceil((new Date(w.warrantyEnd).getTime() - Date.now()) / 86400000);
    if (daysLeft < 0) return 'danger';
    if (daysLeft <= 30) return 'warn';
    return 'success';
  }

  getStatusLabel(w: any): string {
    if (!w.warrantyEnd) return 'N/A';
    const daysLeft = Math.ceil((new Date(w.warrantyEnd).getTime() - Date.now()) / 86400000);
    if (daysLeft < 0) return 'EXPIRED';
    if (daysLeft <= 30) return 'EXPIRING SOON';
    return 'ACTIVE';
  }

  getDaysLeft(w: any): number {
    if (!w.warrantyEnd) return 0;
    return Math.ceil((new Date(w.warrantyEnd).getTime() - Date.now()) / 86400000);
  }

  getContractStatusSeverity(status: string): 'success' | 'danger' | 'warn' | 'secondary' {
    if (status === 'ACTIVE') return 'success';
    if (status === 'EXPIRED') return 'danger';
    if (status === 'EXPIRING_SOON') return 'warn';
    return 'secondary';
  }

  formatCurrency(val: number | null): string {
    if (val == null) return '--';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  }
}
