import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AccountsService } from '../../services/accounts/accounts';

@Component({
  selector: 'app-account-ledger',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule,
    SelectModule, FloatLabelModule, DatePickerModule, TagModule, ToastModule],
  providers: [MessageService],
  templateUrl: './account-ledger.html',
  styleUrl: './account-ledger.css'
})
export class AccountLedger implements OnInit {
  accounts: any[] = [];
  selectedAccountId: number | null = null;
  fromDate: Date | null = null;
  toDate: Date | null = null;
  ledgerData: any = null;
  loading = false;

  constructor(private svc: AccountsService, private msg: MessageService) {}

  ngOnInit() {
    this.svc.getAccountsDropdown().subscribe({ next: d => this.accounts = d });
  }

  search() {
    if (!this.selectedAccountId) { this.msg.add({ severity: 'warn', summary: 'Select an account first' }); return; }
    this.loading = true;
    const from = this.fromDate ? this.fromDate.toISOString().split('T')[0] : undefined;
    const to = this.toDate ? this.toDate.toISOString().split('T')[0] : undefined;
    this.svc.getAccountLedger(this.selectedAccountId, from, to).subscribe({
      next: d => { this.ledgerData = d; this.loading = false; },
      error: (e) => { this.msg.add({ severity: 'error', detail: e?.error?.message }); this.loading = false; }
    });
  }

  get allLines(): any[] {
    if (!this.ledgerData) return [];
    const debits = (this.ledgerData.debitLines || []).map((l: any) => ({ ...l, side: 'DR' }));
    const credits = (this.ledgerData.creditLines || []).map((l: any) => ({ ...l, side: 'CR' }));
    return [...debits, ...credits].sort((a, b) =>
      new Date(a.journalEntry.entryDate).getTime() - new Date(b.journalEntry.entryDate).getTime()
    );
  }
}
