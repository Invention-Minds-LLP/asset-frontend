import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ServiceInvoicesService } from '../../services/service-invoices/service-invoices';
import { Assets } from '../../services/assets/assets';
import { environment } from '../../../environment/environment.prod';

@Component({
  selector: 'app-service-invoices',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, DialogModule,
    InputTextModule, SelectModule, FloatLabelModule, DatePickerModule,
    TagModule, ToastModule, TextareaModule, TooltipModule
  ],
  providers: [MessageService],
  templateUrl: './service-invoices.html',
  styleUrl: './service-invoices.css'
})
export class ServiceInvoices implements OnInit {
  invoices: any[] = [];
  total = 0;
  loading = false;
  page = 1;

  stats: any = { pending: 0, approved: 0, paid: 0, rejected: 0, totalPayable: 0 };

  // dialogs
  showCreateDialog = false;
  showDetailDialog = false;
  showRejectDialog = false;
  showPayDialog = false;
  selectedInvoice: any = null;

  filters: any = { status: '', vendorId: '' };

  form: any = {
    invoiceNo: '', invoiceDate: null, dueDate: null,
    vendorId: null, assetId: null, ticketId: null,
    invoiceAmount: null, gstPct: 18, tdsAmount: 0,
    serviceDescription: '', remarks: ''
  };

  rejectRemarks = '';
  paymentMode = '';
  paymentRef = '';

  vendors: any[] = [];
  assets: any[] = [];

  statusOptions = [
    { label: 'All', value: '' },
    { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Paid', value: 'PAID' },
    { label: 'Rejected', value: 'REJECTED' },
  ];

  paymentModeOptions = [
    { label: 'NEFT', value: 'NEFT' },
    { label: 'RTGS', value: 'RTGS' },
    { label: 'Cheque', value: 'CHEQUE' },
    { label: 'IMPS', value: 'IMPS' },
    { label: 'UPI', value: 'UPI' },
    { label: 'Cash', value: 'CASH' },
  ];

  constructor(
    private svc: ServiceInvoicesService,
    private assetSvc: Assets,
    private msg: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.load();
    this.loadStats();
    this.assetSvc.getVendors().subscribe({ next: d => this.vendors = d });
    this.assetSvc.getAllAssetsForDropdown().subscribe({ next: d => this.assets = d });
  }

  load() {
    this.loading = true;
    const f: any = { page: this.page, limit: 20 };
    if (this.filters.status) f.status = this.filters.status;
    if (this.filters.vendorId) f.vendorId = this.filters.vendorId;
    this.svc.getAll(f).subscribe({
      next: d => { this.invoices = d.data; this.total = d.pagination.total; this.loading = false; },
      error: () => this.loading = false
    });
  }

  loadStats() {
    this.svc.getStats().subscribe({ next: d => this.stats = d });
  }

  openNew() {
    this.form = {
      invoiceNo: '', invoiceDate: new Date(), dueDate: null,
      vendorId: null, assetId: null, ticketId: null,
      invoiceAmount: null, gstPct: 18, tdsAmount: 0,
      serviceDescription: '', remarks: ''
    };
    this.showCreateDialog = true;
  }

  viewDetail(row: any) {
    this.svc.getById(row.id).subscribe({ next: d => { this.selectedInvoice = d; this.showDetailDialog = true; } });
  }

  get calcGstAmt(): number {
    const amt = Number(this.form.invoiceAmount || 0);
    const gst = Number(this.form.gstPct || 0);
    return Math.round(amt * gst / 100 * 100) / 100;
  }

  get calcNetAmt(): number {
    return Math.round((Number(this.form.invoiceAmount || 0) + this.calcGstAmt) * 100) / 100;
  }

  get calcPayable(): number {
    return Math.round((this.calcNetAmt - Number(this.form.tdsAmount || 0)) * 100) / 100;
  }

  save() {
    if (!this.form.invoiceNo || !this.form.invoiceDate || !this.form.invoiceAmount) {
      this.msg.add({ severity: 'warn', summary: 'Required', detail: 'Invoice No, Date and Amount are required' });
      return;
    }
    this.svc.create(this.form).subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Created', detail: 'Service invoice created' });
        this.showCreateDialog = false;
        this.load(); this.loadStats();
      },
      error: (e) => this.msg.add({ severity: 'error', summary: 'Error', detail: e?.error?.message || 'Failed' })
    });
  }

  approveInvoice(row: any) {
    this.svc.approve(row.id).subscribe({
      next: () => { this.msg.add({ severity: 'success', summary: 'Approved' }); this.load(); this.loadStats(); },
      error: (e) => this.msg.add({ severity: 'error', summary: 'Error', detail: e?.error?.message || 'Failed' })
    });
  }

  openRejectDialog(row: any) {
    this.selectedInvoice = row;
    this.rejectRemarks = '';
    this.showRejectDialog = true;
  }

  confirmReject() {
    this.svc.reject(this.selectedInvoice.id, this.rejectRemarks).subscribe({
      next: () => {
        this.msg.add({ severity: 'info', summary: 'Rejected' });
        this.showRejectDialog = false;
        this.load(); this.loadStats();
      },
      error: (e) => this.msg.add({ severity: 'error', summary: 'Error', detail: e?.error?.message || 'Failed' })
    });
  }

  openPayDialog(row: any) {
    this.selectedInvoice = row;
    this.paymentMode = '';
    this.paymentRef = '';
    this.showPayDialog = true;
  }

  confirmPay() {
    this.svc.markPaid(this.selectedInvoice.id, this.paymentMode, this.paymentRef).subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Marked as Paid' });
        this.showPayDialog = false;
        this.load(); this.loadStats();
      },
      error: (e) => this.msg.add({ severity: 'error', summary: 'Error', detail: e?.error?.message || 'Failed' })
    });
  }

  onFileChange(event: Event, id: number) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.svc.uploadDoc(id, input.files[0]).subscribe({
      next: () => { this.msg.add({ severity: 'success', summary: 'Document uploaded' }); this.viewDetail({ id }); },
      error: (e) => this.msg.add({ severity: 'error', summary: 'Upload failed', detail: e?.error?.message || 'Failed' })
    });
  }

  getFileUrl(url: string | null): string | null {
    if (!url) return null;
    return `${environment.apiUrl.replace(/\/api$/, '')}${url}`;
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: any = { PAID: 'success', APPROVED: 'info', PENDING_APPROVAL: 'warn', REJECTED: 'danger' };
    return map[status] ?? 'secondary';
  }

  getStatusLabel(status: string): string {
    const map: any = { PAID: 'Paid', APPROVED: 'Approved', PENDING_APPROVAL: 'Pending Approval', REJECTED: 'Rejected' };
    return map[status] ?? status;
  }
}
