import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TabViewModule } from 'primeng/tabview';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { InsuranceService } from '../../services/insurance/insurance';

@Component({
  selector: 'app-insurance-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TableModule, TagModule, ToastModule, TabViewModule, InputTextModule, SelectModule],
  templateUrl: './insurance-management.html',
  styleUrl: './insurance-management.css',
  providers: [MessageService]
})
export class InsuranceManagement implements OnInit {
  activeTab = 0;

  // Stats
  stats: any = {};

  // Policies
  policies: any[] = [];
  policiesLoading = false;
  policiesTotalRecords = 0;
  policySearch = '';
  policyStatus = '';
  policyPage = 1;

  // Claims
  claims: any[] = [];
  claimsLoading = false;
  claimsTotalRecords = 0;
  claimSearch = '';
  claimStatus = '';
  claimPage = 1;

  statusOptions = [
    { label: 'All', value: '' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Expired', value: 'EXPIRED' },
    { label: 'Cancelled', value: 'CANCELLED' }
  ];

  claimStatusOptions = [
    { label: 'All', value: '' },
    { label: 'Filed', value: 'FILED' },
    { label: 'Under Review', value: 'UNDER_REVIEW' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'Settled', value: 'SETTLED' }
  ];

  constructor(
    private insuranceService: InsuranceService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadStats();
    this.loadPolicies();
  }

  onTabChange(event: any) {
    this.activeTab = event.index;
    if (event.index === 1 && !this.claims.length) this.loadClaims();
  }

  loadStats() {
    this.insuranceService.getStats().subscribe({
      next: (res) => { setTimeout(() => { this.stats = res; this.cdr.detectChanges(); }); },
      error: () => {}
    });
  }

  loadPolicies() {
    this.policiesLoading = true;
    const params: any = { page: this.policyPage, limit: 15 };
    if (this.policySearch) params.search = this.policySearch;
    if (this.policyStatus) params.status = this.policyStatus;

    this.insuranceService.getAllPolicies(params).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.policies = res.data || res;
          this.policiesTotalRecords = res.total || this.policies.length;
          this.policiesLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.policiesLoading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load policies' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  loadClaims() {
    this.claimsLoading = true;
    const params: any = { page: this.claimPage, limit: 15 };
    if (this.claimSearch) params.search = this.claimSearch;
    if (this.claimStatus) params.status = this.claimStatus;

    this.insuranceService.getAllClaims(params).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.claims = res.data || res;
          this.claimsTotalRecords = res.total || this.claims.length;
          this.claimsLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.claimsLoading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load claims' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  exportPoliciesCsv() {
    this.insuranceService.exportPoliciesCsv().subscribe({
      next: (blob) => this.downloadBlob(blob, 'insurance-policies.csv'),
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Export failed' })
    });
  }

  exportClaimsCsv() {
    this.insuranceService.exportClaimsCsv().subscribe({
      next: (blob) => this.downloadBlob(blob, 'insurance-claims.csv'),
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Export failed' })
    });
  }

  private downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  getStatusSeverity(status: string): "success" | "danger" | "warn" | "info" | "secondary" {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return 'success';
      case 'EXPIRED': return 'danger';
      case 'APPROVED': case 'SETTLED': return 'success';
      case 'REJECTED': return 'danger';
      case 'FILED': case 'UNDER_REVIEW': return 'warn';
      default: return 'info';
    }
  }

  formatCurrency(val: number): string {
    if (val == null) return '₹0';
    return '₹' + Number(val).toLocaleString('en-IN');
  }
}
