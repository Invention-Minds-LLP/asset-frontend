import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TabViewModule } from 'primeng/tabview';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { ReportsService } from '../../services/reports/reports';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TableModule,
    TagModule, ToastModule, TabViewModule, InputTextModule, SelectModule
  ],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
  providers: [MessageService]
})
export class Reports implements OnInit {
  // Tab index
  activeTab = 0;

  // Asset Register
  assetRegisterData: any[] = [];
  assetRegisterLoading = false;
  assetRegisterTotal = 0;

  // Maintenance Cost
  maintenanceCostData: any[] = [];
  maintenanceCostLoading = false;

  // Ticket Analytics
  ticketAnalytics: any = {};
  ticketAnalyticsLoading = false;
  countByStatus: any[] = [];
  countByPriority: any[] = [];

  // Expiry
  expiryWarranties: any[] = [];
  expiryInsurance: any[] = [];
  expiryContracts: any[] = [];
  expiryLoading = false;

  // Depreciation
  depreciationData: any[] = [];
  depreciationLoading = false;

  // Inventory Stock
  inventoryData: any[] = [];
  inventoryLoading = false;

  // Filters
  filterCategory = '';
  filterDepartment = '';
  filterStatus = '';
  expiryDays = 90;

  constructor(
    private reportsService: ReportsService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadAssetRegister();
  }

  onTabChange(event: any) {
    this.activeTab = event.index;
    switch (event.index) {
      case 0: if (!this.assetRegisterData.length) this.loadAssetRegister(); break;
      case 1: if (!this.maintenanceCostData.length) this.loadMaintenanceCost(); break;
      case 2: if (!this.countByStatus.length) this.loadTicketAnalytics(); break;
      case 3: if (!this.expiryWarranties.length) this.loadExpiryReport(); break;
      case 4: if (!this.depreciationData.length) this.loadDepreciation(); break;
      case 5: if (!this.inventoryData.length) this.loadInventoryStock(); break;
    }
  }

  loadAssetRegister() {
    this.assetRegisterLoading = true;
    const filters: any = {};
    if (this.filterCategory) filters.categoryId = this.filterCategory;
    if (this.filterDepartment) filters.departmentId = this.filterDepartment;
    if (this.filterStatus) filters.status = this.filterStatus;

    this.reportsService.getAssetRegister(filters).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.assetRegisterData = res.data || res;
          this.assetRegisterTotal = res.pagination?.total || this.assetRegisterData.length;
          this.assetRegisterLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.assetRegisterLoading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load asset register' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  loadMaintenanceCost() {
    this.maintenanceCostLoading = true;
    this.reportsService.getMaintenanceCost({}).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.maintenanceCostData = res.data || res;
          this.maintenanceCostLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.maintenanceCostLoading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load maintenance costs' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  loadTicketAnalytics() {
    this.ticketAnalyticsLoading = true;
    this.reportsService.getTicketAnalytics({}).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.ticketAnalytics = res;
          this.countByStatus = res.countByStatus || [];
          this.countByPriority = res.countByPriority || [];
          this.ticketAnalyticsLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.ticketAnalyticsLoading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load ticket analytics' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  loadExpiryReport() {
    this.expiryLoading = true;
    this.reportsService.getExpiryReport({ days: this.expiryDays }).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.expiryWarranties = res.warranties || [];
          this.expiryInsurance = res.insurance || [];
          this.expiryContracts = res.contracts || [];
          this.expiryLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.expiryLoading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load expiry report' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  loadDepreciation() {
    this.depreciationLoading = true;
    this.reportsService.getDepreciationReport({}).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.depreciationData = res.data || res;
          this.depreciationLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.depreciationLoading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load depreciation data' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  loadInventoryStock() {
    this.inventoryLoading = true;
    this.reportsService.getInventoryStock({}).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.inventoryData = res.data || res;
          this.inventoryLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.inventoryLoading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load inventory stock' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  getStockSeverity(item: any): "success" | "danger" | "warn" {
    if (item.currentStock <= 0) return 'danger';
    if (item.reorderLevel && item.currentStock <= item.reorderLevel) return 'warn';
    return 'success';
  }

  getStockLabel(item: any): string {
    if (item.currentStock <= 0) return 'OUT OF STOCK';
    if (item.reorderLevel && item.currentStock <= item.reorderLevel) return 'LOW STOCK';
    return 'IN STOCK';
  }

  formatCurrency(val: number): string {
    if (val == null) return '₹0';
    return '₹' + Number(val).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  exportReport(reportType: string, format: 'csv' | 'excel') {
    this.reportsService.exportReport(reportType, format).subscribe({
      next: (blob) => {
        const ext = format === 'csv' ? 'csv' : 'xlsx';
        const mime = format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        const file = new Blob([blob], { type: mime });
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-report.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
        this.messageService.add({ severity: 'success', summary: 'Exported', detail: `${reportType} exported as ${format.toUpperCase()}` });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Export failed' });
      }
    });
  }
}
