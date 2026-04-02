import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { Assets } from '../../services/assets/assets';

@Component({
  selector: 'app-my-assets',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TableModule, TagModule, ToastModule, TooltipModule],
  templateUrl: './my-assets.html',
  styleUrl: './my-assets.css',
  providers: [MessageService]
})
export class MyAssets implements OnInit {
  loading = false;
  assets: any[] = [];
  employeeName = '';
  employeeID = '';

  private employeeDbId!: number;

  constructor(
    private assetService: Assets,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    this.employeeDbId = user?.employeeDbId;
    this.employeeID = user?.employeeID || '';
    this.employeeName = user?.name || '';
    if (this.employeeDbId) {
      this.load();
    }
  }

  load() {
    this.loading = true;
    this.assetService.getEmployeeAssets(this.employeeDbId).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.assets = res.assets || [];
          this.employeeName = res.employee?.name || this.employeeName;
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
      DISPOSED: 'danger', PENDING_HOD_APPROVAL: 'warn'
    };
    return map[status] ?? 'secondary';
  }
}
