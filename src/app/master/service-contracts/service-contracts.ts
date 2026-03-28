import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { ServiceContract } from '../../services/service-contract/service-contract';

@Component({
  selector: 'app-service-contracts',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TableModule, TagModule, ToastModule, InputTextModule, SelectModule],
  templateUrl: './service-contracts.html',
  styleUrl: './service-contracts.css',
  providers: [MessageService]
})
export class ServiceContracts implements OnInit {
  contracts: any[] = [];
  loading = false;
  totalRecords = 0;
  stats: any = {};

  search = '';
  status = '';
  contractType = '';
  page = 1;

  statusOptions = [
    { label: 'All', value: '' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Expired', value: 'EXPIRED' },
    { label: 'Pending', value: 'PENDING' }
  ];

  typeOptions = [
    { label: 'All', value: '' },
    { label: 'AMC', value: 'AMC' },
    { label: 'CMC', value: 'CMC' },
    { label: 'Warranty', value: 'WARRANTY' }
  ];

  constructor(private scService: ServiceContract, private messageService: MessageService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadStats();
    this.loadContracts();
  }

  loadStats() {
    this.scService.getStats().subscribe({
      next: (res) => { setTimeout(() => { this.stats = res; this.cdr.detectChanges(); }); },
      error: () => {}
    });
  }

  loadContracts() {
    this.loading = true;
    const params: any = { page: this.page, limit: 15 };
    if (this.search) params.search = this.search;
    if (this.status) params.status = this.status;
    if (this.contractType) params.contractType = this.contractType;

    this.scService.getAllPaginated(params).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.contracts = res.data || res;
          this.totalRecords = res.total || this.contracts.length;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load contracts' }); this.cdr.detectChanges(); });
      }
    });
  }

  exportCsv() {
    this.scService.exportCsv().subscribe({
      next: (blob) => { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'service-contracts.csv'; a.click(); URL.revokeObjectURL(url); },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Export failed' })
    });
  }

  getStatusSeverity(status: string): "success" | "danger" | "warn" | "info" {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return 'success';
      case 'EXPIRED': return 'danger';
      case 'PENDING': return 'warn';
      default: return 'info';
    }
  }

  formatCurrency(val: number): string {
    if (val == null) return '₹0';
    return '₹' + Number(val).toLocaleString('en-IN');
  }
}
