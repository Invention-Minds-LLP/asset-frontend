import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { Assets } from '../../services/assets/assets';

@Component({
  selector: 'app-department-assets',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TableModule, TagModule,
    ToastModule, SelectModule, FloatLabelModule, TooltipModule],
  templateUrl: './department-assets.html',
  styleUrl: './department-assets.css',
  providers: [MessageService]
})
export class DepartmentAssets implements OnInit {
  loading = false;
  summary: any = {};
  assets: any[] = [];
  departmentName = '';

  statusFilter = '';
  statusOptions = [
    { label: 'All', value: '' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'In Store', value: 'IN_STORE' },
    { label: 'Under Maintenance', value: 'UNDER_MAINTENANCE' },
    { label: 'Disposed', value: 'DISPOSED' },
    { label: 'Pending HOD Approval', value: 'PENDING_HOD_APPROVAL' },
  ];

  private departmentId!: number;

  constructor(
    private assetService: Assets,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    this.departmentId = user?.departmentId;
    if (this.departmentId) {
      this.load();
    }
  }

  load() {
    this.loading = true;
    const params = this.statusFilter ? { status: this.statusFilter } : undefined;
    this.assetService.getDepartmentAssets(this.departmentId, params).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.summary = res.summary || {};
          this.assets = res.assets || [];
          this.departmentName = res.department?.name || '';
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: (e: any) => {
        setTimeout(() => {
          this.loading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: e?.error?.message || 'Failed to load' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<string, any> = {
      ACTIVE: 'success', IN_STORE: 'info', UNDER_MAINTENANCE: 'warn',
      DISPOSED: 'danger', PENDING_HOD_APPROVAL: 'warn', DEAD: 'secondary'
    };
    return map[status] ?? 'secondary';
  }
}
