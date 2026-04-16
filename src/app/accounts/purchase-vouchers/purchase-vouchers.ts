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
  selector: 'app-purchase-vouchers',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, DialogModule,
    InputTextModule, SelectModule, FloatLabelModule, DatePickerModule,
    TagModule, ToastModule, TextareaModule],
  providers: [MessageService],
  templateUrl: './purchase-vouchers.html',
  styleUrl: './purchase-vouchers.css'
})
export class PurchaseVouchers implements OnInit {
  vouchers: any[] = [];
  total = 0;
  loading = false;
  showDialog = false;
  showDetail = false;
  selectedVoucher: any = null;
  isEdit = false;
  page = 1;

  filters: any = { status: '', vendorId: '' };
  form: any = { voucherDate: null, amount: null, narration: '', assetId: null, vendorId: null, invoiceNo: '', invoiceDate: null, invoiceAmount: null };

  statusOptions = [
    { label: 'All', value: '' },
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Posted', value: 'POSTED' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];

  vendors: any[] = [];
  assets: any[] = [];

  constructor(private svc: AccountsService, private assetSvc: Assets, private msg: MessageService) {}

  ngOnInit() {
    this.load();
    this.assetSvc.getVendors().subscribe({ next: d => this.vendors = d });
    this.assetSvc.getAllAssetsForDropdown().subscribe({ next: d => this.assets = d });
  }

  load() {
    this.loading = true;
    const f: any = { page: this.page, limit: 20 };
    if (this.filters.status) f.status = this.filters.status;
    if (this.filters.vendorId) f.vendorId = this.filters.vendorId;
    this.svc.getPurchaseVouchers(f).subscribe({
      next: d => { this.vouchers = d.data; this.total = d.total; this.loading = false; },
      error: () => this.loading = false
    });
  }

  openNew() {
    this.form = { voucherDate: new Date(), amount: null, narration: '', assetId: null, vendorId: null, invoiceNo: '', invoiceDate: null, invoiceAmount: null };
    this.isEdit = false; this.showDialog = true;
  }

  openEdit(row: any) {
    this.form = {
      ...row,
      voucherDate: row.voucherDate ? new Date(row.voucherDate) : null,
      invoiceDate: row.invoiceDate ? new Date(row.invoiceDate) : null,
    };
    this.isEdit = true; this.showDialog = true;
  }

  viewDetail(row: any) {
    this.svc.getPurchaseVoucherById(row.id).subscribe({ next: d => { this.selectedVoucher = d; this.showDetail = true; } });
  }

  save() {
    const payload = { ...this.form };
    const action = this.isEdit
      ? this.svc.updatePurchaseVoucher(this.form.id, payload)
      : this.svc.createPurchaseVoucher(payload);
    action.subscribe({
      next: () => { this.msg.add({ severity: 'success', summary: 'Saved' }); this.showDialog = false; this.load(); },
      error: (e) => this.msg.add({ severity: 'error', summary: 'Error', detail: e?.error?.message || 'Failed' })
    });
  }

  approve(row: any) {
    this.svc.approvePurchaseVoucher(row.id).subscribe({
      next: () => { this.msg.add({ severity: 'success', summary: 'Approved' }); this.load(); },
      error: (e) => this.msg.add({ severity: 'error', summary: 'Error', detail: e?.error?.message || 'Failed' })
    });
  }

  post(row: any) {
    this.svc.postPurchaseVoucher(row.id).subscribe({
      next: () => { this.msg.add({ severity: 'success', summary: 'Posted to Ledger' }); this.load(); },
      error: (e) => this.msg.add({ severity: 'error', summary: 'Error', detail: e?.error?.message || 'Failed' })
    });
  }

  cancel(row: any) {
    this.svc.cancelPurchaseVoucher(row.id).subscribe({
      next: () => { this.msg.add({ severity: 'info', summary: 'Cancelled' }); this.load(); },
      error: (e) => this.msg.add({ severity: 'error', summary: 'Error', detail: e?.error?.message || 'Failed' })
    });
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: any = { POSTED: 'success', APPROVED: 'info', PENDING_APPROVAL: 'warn', DRAFT: 'secondary', CANCELLED: 'danger', REJECTED: 'danger' };
    return map[status] ?? 'secondary';
  }
}
