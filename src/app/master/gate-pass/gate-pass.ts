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
import { MessageService } from 'primeng/api';
import { GatePassService } from '../../services/gate-pass/gate-pass';
import { Assets } from '../../services/assets/assets';

@Component({
  selector: 'app-gate-pass',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    TagModule,
    ToastModule,
    TabViewModule,
    InputTextModule,
    FloatLabelModule,
    SelectModule,
    TextareaModule,
    TooltipModule
  ],
  templateUrl: './gate-pass.html',
  styleUrl: './gate-pass.css',
  providers: [MessageService]
})
export class GatePass implements OnInit {
  rows: any[] = [];
  overdueRows: any[] = [];
  loading = false;
  editingId: number | null = null;
  showForm = false;

  form = this.getEmptyForm();

  typeOptions = [
    { label: 'Returnable', value: 'RETURNABLE' },
    { label: 'Non-Returnable', value: 'NON_RETURNABLE' }
  ];

  vehicleTypeOptions = [
    { label: 'Hospital Vehicle', value: 'HOSPITAL_VEHICLE' },
    { label: 'Outside Vehicle', value: 'OUTSIDE_VEHICLE' }
  ];

  statusOptions = [
    { label: 'Issued', value: 'ISSUED' },
    { label: 'Returned', value: 'RETURNED' },
    { label: 'Closed', value: 'CLOSED' },
    { label: 'Cancelled', value: 'CANCELLED' }
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
    this.loadAssets();
  }

  getEmptyForm() {
    return {
      type: 'RETURNABLE',
      assetId: null as number | null,
      description: '',
      quantity: null as number | null,
      issuedTo: '',
      purpose: '',
      expectedReturnDate: '',
      courierDetails: '',
      vehicleNo: '',
      vehicleType: null as string | null,
      approvedBy: '',
      issuedBy: '',
      reason: ''
    };
  }

  loadAll() {
    this.loading = true;
    this.gatePassService.getAll().subscribe({
      next: (res) => { setTimeout(() => { this.rows = res || []; this.loading = false; this.cdr.detectChanges(); }); },
      error: () => { setTimeout(() => { this.loading = false; this.cdr.detectChanges(); }); this.toast('error', 'Failed to load gate passes'); }
    });
  }

  loadOverdue() {
    this.gatePassService.getOverdue().subscribe({
      next: (res) => { setTimeout(() => { this.overdueRows = res || []; this.cdr.detectChanges(); }); },
      error: () => {}
    });
  }

  loadAssets() {
    this.assetsService.getAllAssets().subscribe({
      next: (res: any[]) => { setTimeout(() => { this.assetOptions = res.map(a => ({ label: `${a.assetId} - ${a.assetName}`, value: a.id })); this.cdr.detectChanges(); }); },
      error: () => {}
    });
  }

  save() {
    if (!this.form.issuedTo || !this.form.purpose || !this.form.type) {
      this.toast('warn', 'Type, Issued To and Purpose are required');
      return;
    }

    const payload = {
      ...this.form,
      assetId: this.form.assetId ? Number(this.form.assetId) : undefined,
      quantity: this.form.quantity ? Number(this.form.quantity) : undefined,
      expectedReturnDate: this.form.expectedReturnDate || undefined
    };

    if (this.editingId) {
      this.gatePassService.update(this.editingId, payload).subscribe({
        next: () => { setTimeout(() => { this.toast('success', 'Gate pass updated'); this.reset(); this.loadAll(); this.cdr.detectChanges(); }); },
        error: (err) => this.toast('error', err?.error?.message || 'Failed to update')
      });
    } else {
      this.gatePassService.create(payload).subscribe({
        next: () => { setTimeout(() => { this.toast('success', 'Gate pass created'); this.reset(); this.loadAll(); this.cdr.detectChanges(); }); },
        error: (err) => this.toast('error', err?.error?.message || 'Failed to create')
      });
    }
  }

  edit(row: any) {
    this.editingId = row.id;
    this.showForm = true;
    this.form = {
      type: row.type || 'RETURNABLE',
      assetId: row.assetId ?? null,
      description: row.description || '',
      quantity: row.quantity ?? null,
      issuedTo: row.issuedTo || '',
      purpose: row.purpose || '',
      expectedReturnDate: row.expectedReturnDate ? row.expectedReturnDate.slice(0, 10) : '',
      courierDetails: row.courierDetails || '',
      vehicleNo: row.vehicleNo || '',
      vehicleType: row.vehicleType || null,
      approvedBy: row.approvedBy || '',
      issuedBy: row.issuedBy || '',
      reason: row.reason || ''
    };
  }

  updateStatus(row: any, status: string) {
    this.gatePassService.updateStatus(row.id, status).subscribe({
      next: () => { setTimeout(() => { this.toast('success', `Marked as ${status}`); this.loadAll(); this.loadOverdue(); this.cdr.detectChanges(); }); },
      error: (err) => this.toast('error', err?.error?.message || 'Failed to update status')
    });
  }

  delete(row: any) {
    if (!confirm(`Delete gate pass ${row.gatePassNo}?`)) return;
    this.gatePassService.delete(row.id).subscribe({
      next: () => { setTimeout(() => { this.toast('success', 'Deleted'); this.loadAll(); this.cdr.detectChanges(); }); },
      error: (err) => this.toast('error', err?.error?.message || 'Failed to delete')
    });
  }

  reset() {
    this.editingId = null;
    this.showForm = false;
    this.form = this.getEmptyForm();
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const map: Record<string, any> = {
      ISSUED: 'info',
      RETURNED: 'success',
      CLOSED: 'secondary',
      CANCELLED: 'danger'
    };
    return map[status] ?? 'secondary';
  }

  toast(severity: 'success' | 'error' | 'warn', detail: string) {
    this.messageService.add({ severity, summary: severity.toUpperCase(), detail });
  }
}
