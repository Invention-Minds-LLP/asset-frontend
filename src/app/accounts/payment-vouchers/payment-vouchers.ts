import { Component, OnInit } from '@angular/core';
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
import { MessageService } from 'primeng/api';
import { AccountsService } from '../../services/accounts/accounts';
import { Assets } from '../../services/assets/assets';

@Component({
  selector: 'app-payment-vouchers',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, DialogModule,
    InputTextModule, SelectModule, FloatLabelModule, DatePickerModule,
    TagModule, ToastModule, TextareaModule],
  providers: [MessageService],
  templateUrl: './payment-vouchers.html',
  styleUrl: './payment-vouchers.css'
})
export class PaymentVouchers implements OnInit {
  vouchers: any[] = [];
  total = 0;
  loading = false;
  showDialog = false;
  showDetail = false;
  selectedVoucher: any = null;
  isEdit = false;
  page = 1;

  filters: any = { status: '', vendorId: '' };
  form: any = { voucherDate: null, amount: null, paymentMode: 'BANK_TRANSFER', bankReference: '', bankName: '', narration: '', purchaseVoucherId: null, vendorId: null };

  statusOptions = [
    { label: 'All', value: '' },
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Posted', value: 'POSTED' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];

  paymentModes = [
    { label: 'Bank Transfer', value: 'BANK_TRANSFER' },
    { label: 'NEFT', value: 'NEFT' },
    { label: 'RTGS', value: 'RTGS' },
    { label: 'IMPS', value: 'IMPS' },
    { label: 'UPI', value: 'UPI' },
    { label: 'Cheque', value: 'CHEQUE' },
    { label: 'Cash', value: 'CASH' },
    { label: 'Demand Draft', value: 'DD' },
  ];

  vendors: any[] = [];
  purchaseVouchers: any[] = [];

  constructor(private svc: AccountsService, private assetSvc: Assets, private msg: MessageService) {}

  ngOnInit() {
    this.load();
    this.assetSvc.getVendors().subscribe({ next: d => this.vendors = d });
    this.svc.getPurchaseVouchers({ status: 'APPROVED', limit: 100 }).subscribe({ next: d => this.purchaseVouchers = d.data });
  }

  load() {
    this.loading = true;
    const f: any = { page: this.page, limit: 20 };
    if (this.filters.status) f.status = this.filters.status;
    if (this.filters.vendorId) f.vendorId = this.filters.vendorId;
    this.svc.getPaymentVouchers(f).subscribe({
      next: d => { this.vouchers = d.data; this.total = d.total; this.loading = false; },
      error: () => this.loading = false
    });
  }

  openNew() {
    this.form = { voucherDate: new Date(), amount: null, paymentMode: 'BANK_TRANSFER', bankReference: '', bankName: '', narration: '', purchaseVoucherId: null, vendorId: null };
    this.isEdit = false; this.showDialog = true;
  }

  openEdit(row: any) {
    this.form = { ...row, voucherDate: row.voucherDate ? new Date(row.voucherDate) : null };
    this.isEdit = true; this.showDialog = true;
  }

  viewDetail(row: any) {
    this.svc.getPaymentVoucherById(row.id).subscribe({ next: d => { this.selectedVoucher = d; this.showDetail = true; } });
  }

  save() {
    const action = this.isEdit
      ? this.svc.updatePaymentVoucher(this.form.id, this.form)
      : this.svc.createPaymentVoucher(this.form);
    action.subscribe({
      next: () => { this.msg.add({ severity: 'success', summary: 'Saved' }); this.showDialog = false; this.load(); },
      error: (e) => this.msg.add({ severity: 'error', summary: 'Error', detail: e?.error?.message || 'Failed' })
    });
  }

  approve(row: any) {
    this.svc.approvePaymentVoucher(row.id).subscribe({ next: () => { this.msg.add({ severity: 'success', summary: 'Approved' }); this.load(); }, error: (e) => this.msg.add({ severity: 'error', detail: e?.error?.message }) });
  }

  post(row: any) {
    this.svc.postPaymentVoucher(row.id).subscribe({ next: () => { this.msg.add({ severity: 'success', summary: 'Posted' }); this.load(); }, error: (e) => this.msg.add({ severity: 'error', detail: e?.error?.message }) });
  }

  cancel(row: any) {
    this.svc.cancelPaymentVoucher(row.id).subscribe({ next: () => { this.msg.add({ severity: 'info', summary: 'Cancelled' }); this.load(); }, error: (e) => this.msg.add({ severity: 'error', detail: e?.error?.message }) });
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: any = { POSTED: 'success', APPROVED: 'info', PENDING_APPROVAL: 'warn', DRAFT: 'secondary', CANCELLED: 'danger' };
    return map[status] ?? 'secondary';
  }
}
