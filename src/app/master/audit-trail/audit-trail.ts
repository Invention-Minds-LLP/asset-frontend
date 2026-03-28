import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import { AuditTrailService } from '../../services/audit-trail/audit-trail';

@Component({
  selector: 'app-audit-trail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TableModule,
    TagModule, ToastModule, InputTextModule, SelectModule, DatePickerModule
  ],
  templateUrl: './audit-trail.html',
  styleUrl: './audit-trail.css',
  providers: [MessageService]
})
export class AuditTrail implements OnInit {
  logs: any[] = [];
  loading = false;
  totalRecords = 0;
  rows = 20;
  page = 1;

  // Filters
  entityType = '';
  action = '';
  dateFrom: Date | null = null;
  dateTo: Date | null = null;

  entityTypeOptions = [
    { label: 'All', value: '' },
    { label: 'Asset', value: 'Asset' },
    { label: 'Ticket', value: 'Ticket' },
    { label: 'Employee', value: 'Employee' },
    { label: 'Vendor', value: 'Vendor' },
    { label: 'Department', value: 'Department' },
    { label: 'Branch', value: 'Branch' },
    { label: 'Warranty', value: 'Warranty' },
    { label: 'Insurance', value: 'Insurance' },
    { label: 'Transfer', value: 'Transfer' },
    { label: 'Disposal', value: 'AssetDisposal' },
  ];

  actionOptions = [
    { label: 'All', value: '' },
    { label: 'Create', value: 'CREATE' },
    { label: 'Update', value: 'UPDATE' },
    { label: 'Delete', value: 'DELETE' },
  ];

  expandedRows: { [key: string]: boolean } = {};

  constructor(
    private auditService: AuditTrailService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadLogs();
  }

  loadLogs() {
    this.loading = true;
    const filters: any = {
      page: this.page,
      limit: this.rows,
    };
    if (this.entityType) filters.entityType = this.entityType;
    if (this.action) filters.action = this.action;
    if (this.dateFrom) filters.dateFrom = this.dateFrom.toISOString();
    if (this.dateTo) filters.dateTo = this.dateTo.toISOString();

    this.auditService.getAuditLogs(filters).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.logs = res.data || res;
          this.totalRecords = res.pagination?.total || this.logs.length;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.loading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load audit logs' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  onPageChange(event: any) {
    this.page = Math.floor(event.first / event.rows) + 1;
    this.rows = event.rows;
    this.loadLogs();
  }

  applyFilters() {
    this.page = 1;
    this.loadLogs();
  }

  clearFilters() {
    this.entityType = '';
    this.action = '';
    this.dateFrom = null;
    this.dateTo = null;
    this.page = 1;
    this.loadLogs();
  }

  getActionSeverity(action: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    switch (action) {
      case 'CREATE': return 'success';
      case 'UPDATE': return 'info';
      case 'DELETE': return 'danger';
      default: return 'secondary';
    }
  }

  parseChanges(changes: string | object): any {
    if (!changes) return null;
    try {
      return typeof changes === 'string' ? JSON.parse(changes) : changes;
    } catch {
      return null;
    }
  }

  getChangeKeys(changes: any): string[] {
    const parsed = this.parseChanges(changes);
    return parsed ? Object.keys(parsed) : [];
  }
}
