import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { MaterialInwardRegisterService } from '../../services/material-inward-register/material-inward-register';
import { PurchaseOrderService } from '../../services/purchase-order/purchase-order';
import { WorkOrderService } from '../../services/work-order/work-order';
import { Assets } from '../../services/assets/assets';
import { Employees } from '../../services/employees/employees';
import { OverflowTooltipDirective } from '../../shared/directives/overflow-tooltip.directive';

@Component({
  selector: 'app-material-inward-register',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, TableModule, TagModule, ToastModule, InputTextModule, FloatLabelModule,
    SelectModule, TextareaModule, DatePickerModule, TooltipModule, OverflowTooltipDirective,
  ],
  templateUrl: './material-inward-register.html',
  styleUrl: './material-inward-register.css',
  providers: [MessageService],
})
export class MaterialInwardRegister implements OnInit {
  rows: any[] = [];
  loading = false;
  showForm = false;
  editingId: number | null = null;
  form = this.getEmptyForm();

  // Reference source lists (loaded from the real PO / WO modules)
  pos: any[] = [];
  wos: any[] = [];
  poOptions: { label: string; value: number }[] = [];
  woOptions: { label: string; value: number }[] = [];
  departmentOptions: { label: string; value: string }[] = [];
  employeeOptions: { label: string; value: string }[] = [];

  referenceTypeOptions = [
    { label: 'Purchase Order', value: 'PURCHASE_ORDER' },
    { label: 'Work Order', value: 'WORK_ORDER' },
    { label: 'Returnable Inward', value: 'RETURNABLE_INWARD' },
    { label: 'Service Return', value: 'SERVICE_RETURN' },
    { label: 'Sample / Demo', value: 'SAMPLE_DEMO' },
    { label: 'Other', value: 'OTHER' },
  ];
  govtIdTypeOptions = [
    { label: 'Aadhaar', value: 'AADHAAR' },
    { label: 'PAN', value: 'PAN' },
    { label: 'Driving Licence', value: 'DL' },
    { label: 'Voter ID', value: 'VOTER_ID' },
    { label: 'Other', value: 'OTHER' },
  ];
  conditionOptions = [
    { label: 'Sealed', value: 'SEALED' },
    { label: 'Open', value: 'OPEN' },
    { label: 'Damaged', value: 'DAMAGED' },
  ];
  returnableOptions = [
    { label: 'Returnable', value: 'RETURNABLE' },
    { label: 'Non-Returnable', value: 'NON_RETURNABLE' },
  ];
  vehicleTypeOptions = [
    { label: 'Two Wheeler', value: 'TWO_WHEELER' },
    { label: 'Four Wheeler', value: 'FOUR_WHEELER' },
    { label: 'Tempo / Van', value: 'TEMPO_VAN' },
    { label: 'Truck', value: 'TRUCK' },
    { label: 'Courier', value: 'COURIER' },
  ];

  constructor(
    private svc: MaterialInwardRegisterService,
    private poSvc: PurchaseOrderService,
    private woSvc: WorkOrderService,
    private assetsSvc: Assets,
    private employeesSvc: Employees,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();
    this.loadReferences();
    this.loadDepartmentsAndEmployees();
  }

  getEmptyForm() {
    return {
      entryDate: new Date() as Date | null,
      timeIn: null as Date | null,
      referenceType: 'PURCHASE_ORDER' as string | null,
      referenceNo: '',
      purchaseOrderId: null as number | null,
      workOrderId: null as number | null,
      vendorName: '',
      deliveryPersonName: '',
      deliveryPersonContact: '',
      govtIdType: null as string | null,
      govtIdNumber: '',
      vehicleNo: '',
      vehicleType: null as string | null,
      dcOrInvoiceNo: '',
      ewayBillNo: '',
      returnableType: 'NON_RETURNABLE' as string | null,
      description: '',
      brand: '',
      serialOrTagNo: '',
      quantity: 1,
      packageCount: null as number | null,
      conditionOnArrival: 'SEALED' as string | null,
      whomToMeet: '',
      department: '',
      receivedBy: '',
      gatePassNo: '',
      returnDate: null as Date | null,
      securityGuardName: '',
      senderAddress: '',
      timeOut: null as Date | null,
      remarks: '',
    };
  }

  // Time fields are stored as display strings ("09:30 AM") but edited with a
  // clock picker, so convert both ways.
  private formatTime(d: Date | null): string | null {
    if (!d) return null;
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  }
  private parseTime(s: string | null): Date | null {
    if (!s) return null;
    const m = s.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!m) return null;
    let h = +m[1];
    const min = +m[2];
    const ap = m[3]?.toUpperCase();
    if (ap === 'PM' && h < 12) h += 12;
    if (ap === 'AM' && h === 12) h = 0;
    const d = new Date();
    d.setHours(h, min, 0, 0);
    return d;
  }

  // ── Loaders ────────────────────────────────────────────────────────────────
  load() {
    this.loading = true;
    this.svc.getAll().subscribe({
      next: r => { setTimeout(() => { this.rows = r || []; this.loading = false; this.cdr.detectChanges(); }); },
      error: () => { setTimeout(() => { this.loading = false; this.cdr.detectChanges(); }); this.toast('error', 'Failed to load material inward register'); },
    });
  }

  loadReferences() {
    // Only need enough to pick from; grab a generous page.
    this.poSvc.getAll({ limit: 500 }).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.pos = res?.data || res || [];
          this.poOptions = this.pos.map((p: any) => ({
            label: `${p.poNumber}${p.vendor?.name ? ' — ' + p.vendor.name : ''}`, value: p.id,
          }));
          this.cdr.detectChanges();
        });
      },
      error: () => {},
    });
    this.woSvc.getAll({ limit: 500 }).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.wos = res?.data || res || [];
          this.woOptions = this.wos.map((w: any) => ({ label: w.woNumber, value: w.id }));
          this.cdr.detectChanges();
        });
      },
      error: () => {},
    });
  }

  loadDepartmentsAndEmployees() {
    this.assetsSvc.getDepartments().subscribe({
      next: (res: any[]) => {
        setTimeout(() => {
          this.departmentOptions = (res || []).map((d: any) => ({ label: d.name, value: d.name }));
          this.cdr.detectChanges();
        });
      },
      error: () => {},
    });
    this.employeesSvc.getEmployees().subscribe({
      next: (res: any[]) => {
        setTimeout(() => {
          this.employeeOptions = (res || []).map((e: any) => ({
            label: e.employeeID ? `${e.name} (${e.employeeID})` : e.name, value: e.name,
          }));
          this.cdr.detectChanges();
        });
      },
      error: () => {},
    });
  }

  // ── Reference linkage ────────────────────────────────────────────────────────
  onReferenceTypeChange() {
    // Clear the opposite link so we never carry a stale PO id onto a WO entry.
    this.form.purchaseOrderId = null;
    this.form.workOrderId = null;
  }

  onSelectPo() {
    const po = this.pos.find(p => p.id === this.form.purchaseOrderId);
    if (po) {
      this.form.referenceNo = po.poNumber || this.form.referenceNo;
      if (po.vendor?.name) this.form.vendorName = po.vendor.name;
    }
  }

  onSelectWo() {
    const wo = this.wos.find(w => w.id === this.form.workOrderId);
    if (wo) {
      this.form.referenceNo = wo.woNumber || this.form.referenceNo;
    }
  }

  // ── Save ─────────────────────────────────────────────────────────────────────
  save() {
    if (!this.form.entryDate || !this.form.description?.trim()) {
      this.toast('warn', 'Date and Material Description are required');
      return;
    }
    const payload = {
      ...this.form,
      description: this.form.description.trim(),
      timeIn: this.formatTime(this.form.timeIn),
      timeOut: this.formatTime(this.form.timeOut),
    };
    const obs = this.editingId ? this.svc.update(this.editingId, payload) : this.svc.create(payload);
    obs.subscribe({
      next: () => { setTimeout(() => { this.toast('success', this.editingId ? 'Updated' : 'Logged at gate'); this.reset(); this.load(); this.cdr.detectChanges(); }); },
      error: (err) => this.toast('error', err?.error?.message || 'Failed to save'),
    });
  }

  edit(row: any) {
    this.editingId = row.id;
    this.showForm = true;
    this.form = {
      entryDate: row.entryDate ? new Date(row.entryDate) : null,
      timeIn: this.parseTime(row.timeIn),
      referenceType: row.referenceType || 'PURCHASE_ORDER',
      referenceNo: row.referenceNo || '',
      purchaseOrderId: row.purchaseOrderId ?? null,
      workOrderId: row.workOrderId ?? null,
      vendorName: row.vendorName || '',
      deliveryPersonName: row.deliveryPersonName || '',
      deliveryPersonContact: row.deliveryPersonContact || '',
      govtIdType: row.govtIdType || null,
      govtIdNumber: row.govtIdNumber || '',
      vehicleNo: row.vehicleNo || '',
      vehicleType: row.vehicleType || null,
      dcOrInvoiceNo: row.dcOrInvoiceNo || '',
      ewayBillNo: row.ewayBillNo || '',
      returnableType: row.returnableType || 'NON_RETURNABLE',
      description: row.description || '',
      brand: row.brand || '',
      serialOrTagNo: row.serialOrTagNo || '',
      quantity: row.quantity ?? 1,
      packageCount: row.packageCount ?? null,
      conditionOnArrival: row.conditionOnArrival || 'SEALED',
      whomToMeet: row.whomToMeet || '',
      department: row.department || '',
      receivedBy: row.receivedBy || '',
      gatePassNo: row.gatePassNo || '',
      returnDate: row.returnDate ? new Date(row.returnDate) : null,
      securityGuardName: row.securityGuardName || '',
      senderAddress: row.senderAddress || '',
      timeOut: this.parseTime(row.timeOut),
      remarks: row.remarks || '',
    };
  }

  setStatus(row: any, status: string) {
    this.svc.updateStatus(row.id, status).subscribe({
      next: () => { this.toast('success', `Marked ${status.replace('_', ' ').toLowerCase()}`); this.load(); },
      error: (err) => this.toast('error', err?.error?.message || 'Failed to update status'),
    });
  }

  delete(row: any) {
    if (!confirm(`Delete inward entry ${row.inwardNo || ''}?`)) return;
    this.svc.delete(row.id).subscribe({
      next: () => { this.toast('success', 'Deleted'); this.load(); },
      error: (err) => this.toast('error', err?.error?.message || 'Failed to delete'),
    });
  }

  reset() { this.editingId = null; this.showForm = false; this.form = this.getEmptyForm(); }

  statusSeverity(s: string): 'success' | 'info' | 'warn' | 'secondary' {
    const m: Record<string, any> = { AT_GATE: 'warn', RECEIVED: 'info', HANDED_OVER: 'success' };
    return m[s] ?? 'secondary';
  }

  toast(severity: 'success' | 'error' | 'warn', detail: string) {
    this.messageService.add({ severity, summary: severity.toUpperCase(), detail });
  }
}
