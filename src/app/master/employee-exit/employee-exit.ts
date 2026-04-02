import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { EmployeeExitService } from '../../services/employee-exit/employee-exit.service';

@Component({
  selector: 'app-employee-exit',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TableModule,
    TagModule, ToastModule, DialogModule, InputTextModule,
    SelectModule, FloatLabelModule, DatePickerModule, TooltipModule
  ],
  templateUrl: './employee-exit.html',
  styleUrl: './employee-exit.css',
  providers: [MessageService]
})
export class EmployeeExit implements OnInit {
  exits: any[] = [];
  loading = false;
  statusFilter = '';

  statusOptions = [
    { label: 'All', value: '' },
    { label: 'Initiated', value: 'INITIATED' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Completed', value: 'COMPLETED' },
  ];

  exitTypeOptions = [
    { label: 'Resignation', value: 'RESIGNATION' },
    { label: 'Retirement', value: 'RETIREMENT' },
    { label: 'Transfer Out', value: 'TRANSFER_OUT' },
    { label: 'Termination', value: 'TERMINATION' },
  ];

  // Initiate dialog
  showInitiateDialog = false;
  initiateForm: any = { employeeId: null, exitType: '', exitDate: null };

  // Detail / handover dialog
  showDetailDialog = false;
  selectedExit: any = null;

  // Return asset dialog
  showReturnDialog = false;
  returnTarget: any = null;
  returnForm: any = { conditionOnReturn: '', handoverToId: null };

  constructor(
    private service: EmployeeExitService,
    private msg: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    const filters: any = {};
    if (this.statusFilter) filters.status = this.statusFilter;
    this.service.getAll(filters).subscribe({
      next: data => { this.exits = data; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.toast('error', 'Failed to load exit records'); }
    });
  }

  openInitiate() {
    this.initiateForm = { employeeId: null, exitType: '', exitDate: null };
    this.showInitiateDialog = true;
  }

  initiate() {
    if (!this.initiateForm.employeeId) return this.toast('error', 'Employee ID required');
    if (!this.initiateForm.exitType) return this.toast('error', 'Exit type required');
    if (!this.initiateForm.exitDate) return this.toast('error', 'Exit date required');
    this.service.initiate(this.initiateForm).subscribe({
      next: () => { this.showInitiateDialog = false; this.toast('success', 'Exit initiated'); this.load(); },
      error: err => this.toast('error', err?.error?.message || 'Failed to initiate')
    });
  }

  viewDetail(exit: any) {
    this.service.getById(exit.id).subscribe({
      next: data => { this.selectedExit = data; this.showDetailDialog = true; this.cdr.detectChanges(); },
      error: () => this.toast('error', 'Failed to load exit details')
    });
  }

  openReturn(exitItem: any) {
    this.returnTarget = exitItem;
    this.returnForm = { conditionOnReturn: '', handoverToId: null };
    this.showReturnDialog = true;
  }

  submitReturn() {
    if (!this.selectedExit) return;
    this.service.returnAsset(this.selectedExit.id, {
      exitAssetId: this.returnTarget.id,
      ...this.returnForm
    }).subscribe({
      next: updated => {
        this.selectedExit.assetsReturned = updated.assetsReturned;
        this.selectedExit.assetsPending = updated.assetsPending;
        this.selectedExit.status = updated.status;
        const item = this.selectedExit.handoverItems.find((i: any) => i.id === this.returnTarget.id);
        if (item) item.status = 'RETURNED';
        this.showReturnDialog = false;
        this.toast('success', 'Asset marked returned');
        this.load();
        this.cdr.detectChanges();
      },
      error: err => this.toast('error', err?.error?.message || 'Failed to mark returned')
    });
  }

  complete(exit: any) {
    if (!confirm(`Complete exit ${exit.exitNumber}? Pending assets will remain unresolved.`)) return;
    this.service.complete(exit.id).subscribe({
      next: () => { this.toast('success', 'Exit completed'); this.load(); },
      error: err => this.toast('error', err?.error?.message || 'Failed to complete')
    });
  }

  statusSeverity(status: string): string {
    const map: Record<string, string> = {
      INITIATED: 'info', IN_PROGRESS: 'warning', COMPLETED: 'success'
    };
    return map[status] ?? 'secondary';
  }

  itemStatusSeverity(status: string): string {
    return status === 'RETURNED' ? 'success' : 'warn';
  }

  private toast(severity: string, detail: string) {
    this.msg.add({ severity, summary: severity === 'error' ? 'Error' : 'Success', detail, life: 3500 });
    this.cdr.detectChanges();
  }
}
