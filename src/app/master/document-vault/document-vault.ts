import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { DocumentsService } from '../../services/documents/documents';

@Component({
  selector: 'app-document-vault',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TableModule, TagModule, ToastModule, InputTextModule, SelectModule, TooltipModule],
  templateUrl: './document-vault.html',
  styleUrl: './document-vault.css',
  providers: [MessageService]
})
export class DocumentVault implements OnInit {
  documents: any[] = [];
  loading = false;
  totalRecords = 0;
  stats: any = {};

  search = '';
  entityType = '';
  documentType = '';
  page = 1;

  entityTypeOptions = [
    { label: 'All', value: '' },
    { label: 'Asset', value: 'ASSET' },
    { label: 'Warranty', value: 'WARRANTY' },
    { label: 'Insurance', value: 'INSURANCE' },
    { label: 'Contract', value: 'CONTRACT' },
    { label: 'Ticket', value: 'TICKET' }
  ];

  docTypeOptions = [
    { label: 'All', value: '' },
    { label: 'Invoice', value: 'INVOICE' },
    { label: 'Certificate', value: 'CERTIFICATE' },
    { label: 'Report', value: 'REPORT' },
    { label: 'Manual', value: 'MANUAL' },
    { label: 'Other', value: 'OTHER' }
  ];

  constructor(private docsService: DocumentsService, private messageService: MessageService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadStats();
    this.loadDocuments();
  }

  loadStats() {
    this.docsService.getStats().subscribe({
      next: (res) => { setTimeout(() => { this.stats = res; this.cdr.detectChanges(); }); },
      error: () => {}
    });
  }

  loadDocuments() {
    this.loading = true;
    const params: any = { page: this.page, limit: 15 };
    if (this.search) params.search = this.search;
    if (this.entityType) params.entityType = this.entityType;
    if (this.documentType) params.documentType = this.documentType;

    this.docsService.getAllPaginated(params).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.documents = res.data || res;
          this.totalRecords = res.total || this.documents.length;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load documents' }); this.cdr.detectChanges(); });
      }
    });
  }

  exportCsv() {
    this.docsService.exportCsv().subscribe({
      next: (blob) => { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'documents.csv'; a.click(); URL.revokeObjectURL(url); },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Export failed' })
    });
  }

  getTypeSeverity(type: string): "success" | "info" | "warn" | "secondary" {
    switch (type?.toUpperCase()) {
      case 'INVOICE': return 'info';
      case 'CERTIFICATE': return 'success';
      case 'REPORT': return 'warn';
      default: return 'secondary';
    }
  }

}
