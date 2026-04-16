import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AccountsService } from '../../services/accounts/accounts';

@Component({
  selector: 'app-chart-of-accounts',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, DialogModule,
    InputTextModule, SelectModule, FloatLabelModule, TagModule, ToastModule],
  providers: [MessageService],
  templateUrl: './chart-of-accounts.html',
  styleUrl: './chart-of-accounts.css'
})
export class ChartOfAccounts implements OnInit {
  accounts: any[] = [];
  loading = false;
  showDialog = false;
  isEdit = false;

  form: any = { code: '', name: '', type: 'ASSET', subType: '', description: '', parentId: null, isActive: true };

  accountTypes = [
    { label: 'Asset', value: 'ASSET' },
    { label: 'Liability', value: 'LIABILITY' },
    { label: 'Equity', value: 'EQUITY' },
    { label: 'Revenue', value: 'REVENUE' },
    { label: 'Expense', value: 'EXPENSE' }
  ];

  constructor(private svc: AccountsService, private msg: MessageService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.svc.getAllAccounts().subscribe({ next: d => { this.accounts = d; this.loading = false; }, error: () => this.loading = false });
  }

  openNew() {
    this.form = { code: '', name: '', type: 'ASSET', subType: '', description: '', parentId: null, isActive: true };
    this.isEdit = false; this.showDialog = true;
  }

  openEdit(row: any) {
    this.form = { ...row, parentId: row.parentId ?? null };
    this.isEdit = true; this.showDialog = true;
  }

  save() {
    const action = this.isEdit
      ? this.svc.updateAccount(this.form.id, this.form)
      : this.svc.createAccount(this.form);
    action.subscribe({
      next: () => { this.msg.add({ severity: 'success', summary: 'Saved', detail: 'Account saved' }); this.showDialog = false; this.load(); },
      error: (e) => this.msg.add({ severity: 'error', summary: 'Error', detail: e?.error?.message || 'Failed' })
    });
  }

  deactivate(row: any) {
    this.svc.deleteAccount(row.id).subscribe({ next: () => { this.msg.add({ severity: 'info', summary: 'Deactivated' }); this.load(); } });
  }

  getTypeSeverity(type: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: any = { ASSET: 'info', LIABILITY: 'warn', EQUITY: 'secondary', REVENUE: 'success', EXPENSE: 'danger' };
    return map[type] ?? 'secondary';
  }
}
