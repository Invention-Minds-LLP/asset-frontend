import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TabViewModule } from 'primeng/tabview';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DepreciationService } from '../../services/depreciation/depreciation';

@Component({
  selector: 'app-batch-depreciation',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TableModule, TagModule, ToastModule, TabViewModule, ConfirmDialogModule],
  templateUrl: './batch-depreciation.html',
  styleUrl: './batch-depreciation.css',
  providers: [MessageService, ConfirmationService]
})
export class BatchDepreciation implements OnInit {
  activeTab = 0;

  // Preview
  previewData: any[] = [];
  previewLoading = false;
  previewSummary: any = {};

  // Logs
  logs: any[] = [];
  logsLoading = false;
  logsTotalRecords = 0;

  // All depreciations
  depreciations: any[] = [];
  depreciationsLoading = false;
  depreciationsTotalRecords = 0;

  runningBatch = false;

  constructor(
    private depService: DepreciationService,
    private messageService: MessageService,
    private confirmService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadPreview();
  }

  onTabChange(event: any) {
    this.activeTab = event.index;
    if (event.index === 1 && !this.depreciations.length) this.loadAll();
    if (event.index === 2 && !this.logs.length) this.loadLogs();
  }

  loadPreview() {
    this.previewLoading = true;
    this.depService.batchPreview().subscribe({
      next: (res) => {
        setTimeout(() => {
          this.previewData = res.preview || res.assets || [];
          this.previewSummary = { totalDepreciation: res.totalDepreciation, count: res.preview?.length ?? 0 };
          this.previewLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => { this.previewLoading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load preview' }); this.cdr.detectChanges(); });
      }
    });
  }

  confirmRunBatch() {
    this.confirmService.confirm({
      message: `This will apply depreciation to ${this.previewData.length} assets. Continue?`,
      header: 'Run Batch Depreciation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.runBatch()
    });
  }

  runBatch() {
    this.runningBatch = true;
    this.depService.runBatch().subscribe({
      next: (res) => {
        setTimeout(() => {
          this.runningBatch = false;
          this.messageService.add({ severity: 'success', summary: 'Success', detail: `Depreciation applied to ${res.processed || 0} assets` });
          this.loadPreview();
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => { this.runningBatch = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Batch run failed' }); this.cdr.detectChanges(); });
      }
    });
  }

  loadAll() {
    this.depreciationsLoading = true;
    this.depService.getAll({ page: 1, limit: 50 }).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.depreciations = res.data || res;
          this.depreciationsTotalRecords = res.total || this.depreciations.length;
          this.depreciationsLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => { setTimeout(() => { this.depreciationsLoading = false; this.cdr.detectChanges(); }); }
    });
  }

  loadLogs() {
    this.logsLoading = true;
    this.depService.getLogs({ page: 1, limit: 50 }).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.logs = res.data || res;
          this.logsTotalRecords = res.total || this.logs.length;
          this.logsLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => { setTimeout(() => { this.logsLoading = false; this.cdr.detectChanges(); }); }
    });
  }

  formatCurrency(val: number): string {
    if (val == null) return '₹0';
    return '₹' + Number(val).toLocaleString('en-IN');
  }
}
