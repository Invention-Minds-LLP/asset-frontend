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
import { Warranty } from '../../services/warranty/warranty';

@Component({
  selector: 'app-warranty-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TableModule, TagModule, ToastModule, InputTextModule, SelectModule],
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

  constructor(private warrantyService: Warranty, private messageService: MessageService, private cdr: ChangeDetectorRef) {}

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

  getStatusSeverity(w: any): "success" | "danger" | "warn" {
    if (!w.warrantyEndDate) return 'success';
    const daysLeft = Math.ceil((new Date(w.warrantyEndDate).getTime() - Date.now()) / 86400000);
    if (daysLeft < 0) return 'danger';
    if (daysLeft <= 30) return 'warn';
    return 'success';
  }

  getStatusLabel(w: any): string {
    if (!w.warrantyEndDate) return 'N/A';
    const daysLeft = Math.ceil((new Date(w.warrantyEndDate).getTime() - Date.now()) / 86400000);
    if (daysLeft < 0) return 'EXPIRED';
    if (daysLeft <= 30) return 'EXPIRING SOON';
    return 'ACTIVE';
  }
}
