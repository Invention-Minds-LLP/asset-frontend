import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import { AssetIndentService } from '../../services/asset-indent/asset-indent.service';
import { Tooltip, TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-asset-indent',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TableModule,
    TagModule, ToastModule, DialogModule, InputTextModule,
    TextareaModule, SelectModule, InputNumberModule, FloatLabelModule, DatePickerModule, TooltipModule
  ],
  templateUrl: './asset-indent.html',
  styleUrl: './asset-indent.css',
  providers: [MessageService]
})
export class AssetIndent implements OnInit {
  userRole = localStorage.getItem('role') || '';

  isRole(...roles: string[]): boolean { return roles.includes(this.userRole); }

  indents: any[] = [];
  loading = false;

  statusFilter = '';
  statusOptions = [
    { label: 'All', value: '' },
    { label: 'Submitted', value: 'SUBMITTED' },
    { label: 'HOD Approved', value: 'HOD_APPROVED' },
    { label: 'Management Approved', value: 'MANAGEMENT_APPROVED' },
    { label: 'Fulfilled', value: 'FULFILLED' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];

  urgencyOptions = [
    { label: 'Normal', value: 'NORMAL' },
    { label: 'Urgent', value: 'URGENT' },
    { label: 'Critical', value: 'CRITICAL' },
  ];

  // Create dialog
  showCreateDialog = false;
  form: any = this.emptyForm();

  // Approval dialog
  showApprovalDialog = false;
  approvalTarget: any = null;
  approvalType = ''; // 'hod' | 'management'
  approvalDecision = 'APPROVED';
  approvalRemarks = '';
  approvalDecisionOptions = [
    { label: 'Approve', value: 'APPROVED' },
    { label: 'Reject', value: 'REJECTED' },
  ];

  submittingApproval = false;
  cancellingIndent = false;
  creatingIndent = false;

  // Detail dialog
  showDetailDialog = false;
  selectedIndent: any = null;

  constructor(
    private service: AssetIndentService,
    private msg: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    const filters: any = {};
    if (this.statusFilter) filters.status = this.statusFilter;
    this.service.getAll(filters).subscribe({
      next: data => { this.indents = data; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.toast('error', 'Failed to load indents'); }
    });
  }

  emptyForm() {
    return { assetName: '', justification: '', quantity: 1, urgency: 'NORMAL', estimatedBudget: null, requiredByDate: null, specifications: '' };
  }

  openCreate() { this.form = this.emptyForm(); this.showCreateDialog = true; }

  create() {
    if (!this.form.assetName?.trim()) return this.toast('error', 'Asset Name is required');
    if (!this.form.justification?.trim()) return this.toast('error', 'Justification is required');
    this.creatingIndent = true;
    this.service.create(this.form).subscribe({
      next: () => { this.creatingIndent = false; this.showCreateDialog = false; this.toast('success', 'Indent submitted'); this.load(); },
      error: err => { this.creatingIndent = false; this.toast('error', err?.error?.message || 'Failed to create indent'); }
    });
  }

  openApproval(indent: any, type: string) {
    this.approvalTarget = indent;
    this.approvalType = type;
    this.approvalDecision = 'APPROVED';
    this.approvalRemarks = '';
    this.showApprovalDialog = true;
  }

  submitApproval() {
    const payload = { decision: this.approvalDecision, remarks: this.approvalRemarks };
    const obs = this.approvalType === 'hod'
      ? this.service.hodApprove(this.approvalTarget.id, payload)
      : this.service.managementApprove(this.approvalTarget.id, payload);

    this.submittingApproval = true;
    obs.subscribe({
      next: () => { this.submittingApproval = false; this.showApprovalDialog = false; this.toast('success', 'Decision saved'); this.load(); },
      error: err => { this.submittingApproval = false; this.toast('error', err?.error?.message || 'Failed to save decision'); }
    });
  }

  cancel(indent: any) {
    if (!confirm(`Cancel indent ${indent.indentNumber}?`)) return;
    this.cancellingIndent = true;
    this.service.cancel(indent.id).subscribe({
      next: () => { this.cancellingIndent = false; this.toast('success', 'Indent cancelled'); this.load(); },
      error: err => { this.cancellingIndent = false; this.toast('error', err?.error?.message || 'Failed to cancel'); }
    });
  }

  viewDetail(indent: any) {
    this.selectedIndent = indent;
    this.showDetailDialog = true;
  }

  statusSeverity(status: string): string {
    const map: Record<string, string> = {
      SUBMITTED: 'info', HOD_APPROVED: 'warning', MANAGEMENT_APPROVED: 'success',
      FULFILLED: 'success', REJECTED: 'danger', CANCELLED: 'secondary', DRAFT: 'secondary'
    };
    return map[status] ?? 'info';
  }

  private toast(severity: string, detail: string) {
    this.msg.add({ severity, summary: severity === 'error' ? 'Error' : 'Success', detail, life: 3500 });
    this.cdr.detectChanges();
  }
}
