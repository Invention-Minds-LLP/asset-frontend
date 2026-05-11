import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TabViewModule } from 'primeng/tabview';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { GatePassService } from '../../services/gate-pass/gate-pass';
import { Assets } from '../../services/assets/assets';
import { environment } from '../../../environment/environment.prod';

interface ItemRow {
  assetId: number | null;
  quantity: number;
  remarks: string;
}

@Component({
  selector: 'app-gate-pass',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, TableModule, TagModule, ToastModule, TabViewModule,
    InputTextModule, FloatLabelModule, SelectModule, TextareaModule, TooltipModule, DialogModule,
  ],
  templateUrl: './gate-pass.html',
  styleUrl: './gate-pass.css',
  providers: [MessageService]
})
export class GatePass implements OnInit {
  rows: any[] = [];
  overdueRows: any[] = [];
  pendingApprovalRows: any[] = [];
  loading = false;
  editingId: number | null = null;
  showForm = false;

  form = this.getEmptyForm();

  // Approve / Reject dialogs
  approveDialog = { open: false, row: null as any, remarks: '' };
  rejectDialog  = { open: false, row: null as any, reason: '' };

  typeOptions = [
    { label: 'Returnable', value: 'RETURNABLE' },
    { label: 'Non-Returnable', value: 'NON_RETURNABLE' }
  ];
  vehicleTypeOptions = [
    { label: 'Hospital Vehicle', value: 'HOSPITAL_VEHICLE' },
    { label: 'Outside Vehicle', value: 'OUTSIDE_VEHICLE' }
  ];
  assetOptions: { label: string; value: number }[] = [];

  constructor(
    private gatePassService: GatePassService,
    private assetsService: Assets,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAll();
    this.loadOverdue();
    this.loadPendingApproval();
    this.loadAssets();
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  getEmptyForm() {
    return {
      type: 'RETURNABLE',
      issuedTo: '',
      purpose: '',
      expectedReturnDate: '',
      courierDetails: '',
      vehicleNo: '',
      vehicleType: null as string | null,
      reason: '',
      ticketId: null as number | null,
      items: [{ assetId: null, quantity: 1, remarks: '' } as ItemRow],
    };
  }

  addItem() { this.form.items.push({ assetId: null, quantity: 1, remarks: '' }); }
  removeItem(i: number) {
    if (this.form.items.length === 1) { this.toast('warn', 'At least one item is required'); return; }
    this.form.items.splice(i, 1);
  }

  // ── Loaders ────────────────────────────────────────────────────────────────
  loadAll() {
    this.loading = true;
    this.gatePassService.getAll().subscribe({
      next: r => { setTimeout(() => { this.rows = r || []; this.loading = false; this.cdr.detectChanges(); }); },
      error: () => { setTimeout(() => { this.loading = false; this.cdr.detectChanges(); }); this.toast('error', 'Failed to load gate passes'); }
    });
  }
  loadOverdue() {
    this.gatePassService.getOverdue().subscribe({
      next: r => { setTimeout(() => { this.overdueRows = r || []; this.cdr.detectChanges(); }); },
      error: () => {}
    });
  }
  loadPendingApproval() {
    this.gatePassService.getPendingApproval().subscribe({
      next: r => { setTimeout(() => { this.pendingApprovalRows = r || []; this.cdr.detectChanges(); }); },
      error: () => {}
    });
  }
  loadAssets() {
    this.assetsService.getAllAssets().subscribe({
      next: (res: any[]) => { setTimeout(() => { this.assetOptions = res.map(a => ({ label: `${a.assetId} - ${a.assetName}`, value: a.id })); this.cdr.detectChanges(); }); },
      error: () => {}
    });
  }

  // ── Save (always lands as DRAFT) ───────────────────────────────────────────
  save() {
    const cleanItems = (this.form.items || []).filter(i => i.assetId);
    if (!this.form.issuedTo || !this.form.purpose || !this.form.type) {
      this.toast('warn', 'Type, Issued To and Purpose are required'); return;
    }
    if (cleanItems.length === 0) {
      this.toast('warn', 'Add at least one asset item'); return;
    }

    const payload: any = {
      type: this.form.type,
      issuedTo: this.form.issuedTo,
      purpose: this.form.purpose,
      expectedReturnDate: this.form.expectedReturnDate || undefined,
      courierDetails: this.form.courierDetails,
      vehicleNo: this.form.vehicleNo,
      vehicleType: this.form.vehicleType,
      reason: this.form.reason,
      ticketId: this.form.ticketId,
      items: cleanItems.map(i => ({ assetId: Number(i.assetId), quantity: Number(i.quantity || 1), remarks: i.remarks })),
    };

    const obs = this.editingId
      ? this.gatePassService.update(this.editingId, payload)
      : this.gatePassService.create(payload);

    obs.subscribe({
      next: () => { setTimeout(() => { this.toast('success', this.editingId ? 'Saved (DRAFT)' : 'Created (DRAFT) — submit when ready'); this.reset(); this.refreshAll(); this.cdr.detectChanges(); }); },
      error: (err) => this.toast('error', err?.error?.message || 'Failed to save')
    });
  }

  edit(row: any) {
    if (row.status !== 'DRAFT') { this.toast('warn', `Only DRAFT passes can be edited (this is ${row.status})`); return; }
    this.editingId = row.id;
    this.showForm = true;
    this.form = {
      type: row.type || 'RETURNABLE',
      issuedTo: row.issuedTo || '',
      purpose: row.purpose || '',
      expectedReturnDate: row.expectedReturnDate ? row.expectedReturnDate.slice(0, 10) : '',
      courierDetails: row.courierDetails || '',
      vehicleNo: row.vehicleNo || '',
      vehicleType: row.vehicleType || null,
      reason: row.reason || '',
      ticketId: row.ticketId ?? null,
      items: (row.items || []).length
        ? row.items.map((it: any) => ({ assetId: it.assetId, quantity: it.quantity || 1, remarks: it.remarks || '' }))
        : [{ assetId: null, quantity: 1, remarks: '' }],
    };
  }

  // ── Lifecycle actions ──────────────────────────────────────────────────────
  submit(row: any) {
    this.gatePassService.submit(row.id).subscribe({
      next: () => { this.toast('success', 'Submitted for HOD approval'); this.refreshAll(); },
      error: (err) => this.toast('error', err?.error?.message || 'Failed to submit')
    });
  }

  openApprove(row: any) { this.approveDialog = { open: true, row, remarks: '' }; }
  openReject(row: any)  { this.rejectDialog  = { open: true, row, reason: '' }; }

  confirmApprove() {
    const { row, remarks } = this.approveDialog;
    if (!row) return;
    this.gatePassService.approve(row.id, remarks).subscribe({
      next: () => { this.toast('success', 'Gate pass approved'); this.approveDialog.open = false; this.refreshAll(); },
      error: (err) => this.toast('error', err?.error?.message || 'Failed to approve')
    });
  }
  confirmReject() {
    const { row, reason } = this.rejectDialog;
    if (!row) return;
    if (!reason.trim()) { this.toast('warn', 'Rejection reason is required'); return; }
    this.gatePassService.reject(row.id, reason.trim()).subscribe({
      next: () => { this.toast('success', 'Gate pass rejected'); this.rejectDialog.open = false; this.refreshAll(); },
      error: (err) => this.toast('error', err?.error?.message || 'Failed to reject')
    });
  }

  cancel(row: any) {
    if (!confirm(`Cancel gate pass ${row.gatePassNo}?`)) return;
    this.gatePassService.updateStatus(row.id, 'CANCELLED').subscribe({
      next: () => { this.toast('success', 'Cancelled'); this.refreshAll(); },
      error: (err) => this.toast('error', err?.error?.message || 'Failed to cancel')
    });
  }

  close(row: any) {
    this.gatePassService.updateStatus(row.id, 'CLOSED').subscribe({
      next: () => { this.toast('success', 'Closed'); this.refreshAll(); },
      error: (err) => this.toast('error', err?.error?.message || 'Failed to close')
    });
  }

  delete(row: any) {
    if (row.status !== 'DRAFT') { this.toast('warn', 'Only DRAFT passes can be deleted'); return; }
    if (!confirm(`Delete gate pass ${row.gatePassNo}?`)) return;
    this.gatePassService.delete(row.id).subscribe({
      next: () => { this.toast('success', 'Deleted'); this.refreshAll(); },
      error: (err) => this.toast('error', err?.error?.message || 'Failed to delete')
    });
  }

  downloadPdf(row: any) {
    this.gatePassService.downloadPdf(row.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = `${row.gatePassNo}.pdf`;
        link.click(); URL.revokeObjectURL(url);
      },
      error: () => this.toast('error', 'Failed to download PDF')
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  refreshAll() { this.loadAll(); this.loadOverdue(); this.loadPendingApproval(); }
  reset() { this.editingId = null; this.showForm = false; this.form = this.getEmptyForm(); }

  getStatusSeverity(s: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const m: Record<string, any> = {
      DRAFT: 'secondary', PENDING_APPROVAL: 'warn',
      APPROVED: 'info', REJECTED: 'danger',
      ISSUED: 'info', RETURNED: 'success', CLOSED: 'secondary', CANCELLED: 'danger'
    };
    return m[s] ?? 'secondary';
  }

  toast(severity: 'success' | 'error' | 'warn', detail: string) {
    this.messageService.add({ severity, summary: severity.toUpperCase(), detail });
  }
}
