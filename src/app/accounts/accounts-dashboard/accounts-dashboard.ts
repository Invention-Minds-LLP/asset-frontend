import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { AccountsService } from '../../services/accounts/accounts';

@Component({
  selector: 'app-accounts-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CardModule, TableModule, TagModule, ButtonModule],
  templateUrl: './accounts-dashboard.html',
  styleUrl: './accounts-dashboard.css'
})
export class AccountsDashboard implements OnInit {
  summary: any = null;
  loading = true;

  constructor(private accountsSvc: AccountsService) {}

  ngOnInit(): void {
    this.accountsSvc.getAccountsSummary().subscribe({
      next: (data) => { this.summary = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: any = { POSTED: 'success', APPROVED: 'info', PENDING_APPROVAL: 'warn', DRAFT: 'secondary', CANCELLED: 'danger', REJECTED: 'danger' };
    return map[status] ?? 'secondary';
  }
}
