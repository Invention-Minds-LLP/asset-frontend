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
import { LoginHistoryService } from '../../services/login-history/login-history';

@Component({
  selector: 'app-user-activity',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TableModule, TagModule, ToastModule, InputTextModule, SelectModule],
  templateUrl: './user-activity.html',
  styleUrl: './user-activity.css',
  providers: [MessageService]
})
export class UserActivity implements OnInit {
  records: any[] = [];
  loading = false;
  totalRecords = 0;
  stats: any = {};

  search = '';
  success = '';
  page = 1;

  successOptions = [
    { label: 'All', value: '' },
    { label: 'Success', value: 'true' },
    { label: 'Failed', value: 'false' }
  ];

  constructor(private loginService: LoginHistoryService, private messageService: MessageService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadStats();
    this.loadRecords();
  }

  loadStats() {
    this.loginService.getStats().subscribe({
      next: (res) => { setTimeout(() => { this.stats = res; this.cdr.detectChanges(); }); },
      error: () => {}
    });
  }

  loadRecords() {
    this.loading = true;
    const params: any = { page: this.page, limit: 15 };
    if (this.search) params.search = this.search;
    if (this.success) params.success = this.success;

    this.loginService.getAll(params).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.records = res.data || res;
          this.totalRecords = res.total || this.records.length;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load login history' }); this.cdr.detectChanges(); });
      }
    });
  }

  exportCsv() {
    this.loginService.exportCsv().subscribe({
      next: (blob) => { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'login-history.csv'; a.click(); URL.revokeObjectURL(url); },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Export failed' })
    });
  }
}
