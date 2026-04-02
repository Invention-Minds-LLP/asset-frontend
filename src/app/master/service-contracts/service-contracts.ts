import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { FloatLabelModule } from 'primeng/floatlabel';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { ServiceContract } from '../../services/service-contract/service-contract';
import { Assets } from '../../services/assets/assets';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-service-contracts',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TableModule, TagModule, ToastModule, InputTextModule, InputNumberModule, SelectModule, FloatLabelModule, CheckboxModule, DialogModule, TextareaModule, DatePickerModule, TooltipModule],
  templateUrl: './service-contracts.html',
  styleUrl: './service-contracts.css',
  providers: [MessageService]
})
export class ServiceContracts implements OnInit {
  userRole = localStorage.getItem('role') || '';

  isRole(...roles: string[]): boolean { return roles.includes(this.userRole); }

  contracts: any[] = [];
  loading = false;
  totalRecords = 0;
  stats: any = {};

  search = '';
  status = '';
  contractType = '';
  page = 1;
  savingContract = false;
  loggingVisit = false;
  approvingCharge = false;

  showForm = false;
  editingId: number | null = null;
  form = this.getEmptyForm();

  assetOptions: { label: string; value: string }[] = [];
  vendorOptions: { label: string; value: number }[] = [];

  statusOptions = [
    { label: 'All', value: '' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Expired', value: 'EXPIRED' },
    { label: 'Pending', value: 'PENDING' }
  ];

  typeOptions = [
    { label: 'All', value: '' },
    { label: 'AMC', value: 'AMC' },
    { label: 'CMC', value: 'CMC' },
  ];

  formTypeOptions = [
    { label: 'AMC (Annual Maintenance Contract)', value: 'AMC' },
    { label: 'CMC (Comprehensive Maintenance Contract)', value: 'CMC' },
  ];

  timeUnitOptions = [
    { label: 'Hours', value: 'HOURS' },
    { label: 'Days', value: 'DAYS' },
  ];

  getEmptyForm() {
    return {
      assetId: '',
      vendorId: null as number | null,
      contractType: 'AMC',
      contractNumber: '',
      startDate: '',
      endDate: '',
      cost: null as number | null,
      currency: 'INR',
      includesParts: false,
      includesLabor: false,
      visitsPerYear: null as number | null,
      regularVisitsPerYear: null as number | null,
      emergencyVisitsPerYear: null as number | null,
      terms: '',
      // Vendor SLA commitment fields
      vendorResponseValue: null as number | null,
      vendorResponseUnit: 'HOURS',
      vendorResolutionValue: null as number | null,
      vendorResolutionUnit: 'HOURS',
    };
  }

  constructor(
    private scService: ServiceContract,
    private assetsService: Assets,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadStats();
    this.loadContracts();
    this.loadAssets();
    this.loadVendors();
  }

  loadAssets() {
    this.assetsService.getAllAssets().subscribe({
      next: (res: any) => {
        const list = res.data || res || [];
        setTimeout(() => {
          this.assetOptions = list.map((a: any) => ({ label: `${a.assetId} — ${a.assetName}`, value: a.assetId }));
          this.cdr.detectChanges();
        });
      },
      error: () => {}
    });
  }

  loadVendors() {
    this.assetsService.getVendors().subscribe({
      next: (res: any[]) => {
        setTimeout(() => {
          this.vendorOptions = res.map(v => ({ label: v.name, value: v.id }));
          this.cdr.detectChanges();
        });
      },
      error: () => {}
    });
  }

  saveContract() {
    if (!this.form.assetId || !this.form.contractType || !this.form.startDate || !this.form.endDate) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Asset, type, start date and end date are required' });
      return;
    }

    const payload: any = { ...this.form };
    // Convert empty strings to null
    if (!payload.contractNumber) delete payload.contractNumber;
    if (!payload.terms) delete payload.terms;
    if (!payload.vendorId) payload.vendorId = null;

    this.savingContract = true;
    if (this.editingId) {
      this.scService.update(this.editingId, payload).subscribe({
        next: () => {
          setTimeout(() => {
            this.savingContract = false;
            this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Contract updated' });
            this.resetForm();
            this.loadContracts();
            this.loadStats();
            this.cdr.detectChanges();
          });
        },
        error: (err) => { this.savingContract = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to update' }); }
      });
    } else {
      this.scService.create(payload).subscribe({
        next: () => {
          setTimeout(() => {
            this.savingContract = false;
            this.messageService.add({ severity: 'success', summary: 'Created', detail: 'Contract created' });
            this.resetForm();
            this.loadContracts();
            this.loadStats();
            this.cdr.detectChanges();
          });
        },
        error: (err) => { this.savingContract = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to create' }); }
      });
    }
  }

  editContract(c: any) {
    this.editingId = c.id;
    this.showForm = true;
    this.form = {
      assetId: c.asset?.assetId || '',
      vendorId: c.vendorId ?? null,
      contractType: c.contractType,
      contractNumber: c.contractNumber || '',
      startDate: c.startDate ? c.startDate.substring(0, 10) : '',
      endDate: c.endDate ? c.endDate.substring(0, 10) : '',
      cost: c.cost ?? null,
      currency: c.currency || 'INR',
      includesParts: c.includesParts ?? false,
      includesLabor: c.includesLabor ?? false,
      visitsPerYear: c.visitsPerYear ?? null,
      regularVisitsPerYear: c.regularVisitsPerYear ?? null,
      emergencyVisitsPerYear: c.emergencyVisitsPerYear ?? null,
      terms: c.terms || '',
      vendorResponseValue: c.vendorResponseValue ?? null,
      vendorResponseUnit: c.vendorResponseUnit || 'HOURS',
      vendorResolutionValue: c.vendorResolutionValue ?? null,
      vendorResolutionUnit: c.vendorResolutionUnit || 'HOURS',
    };
  }

  resetForm() {
    this.editingId = null;
    this.showForm = false;
    this.form = this.getEmptyForm();
  }

  loadStats() {
    this.scService.getStats().subscribe({
      next: (res) => { setTimeout(() => { this.stats = res; this.cdr.detectChanges(); }); },
      error: () => {}
    });
  }

  loadContracts() {
    this.loading = true;
    const params: any = { page: this.page, limit: 15 };
    if (this.search) params.search = this.search;
    if (this.status) params.status = this.status;
    if (this.contractType) params.contractType = this.contractType;

    this.scService.getAllPaginated(params).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.contracts = res.data || res;
          this.totalRecords = res.total || this.contracts.length;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load contracts' }); this.cdr.detectChanges(); });
      }
    });
  }

  exportCsv() {
    this.scService.exportCsv().subscribe({
      next: (blob) => { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'service-contracts.csv'; a.click(); URL.revokeObjectURL(url); },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Export failed' })
    });
  }

  getStatusSeverity(status: string): "success" | "danger" | "warn" | "info" {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return 'success';
      case 'EXPIRED': return 'danger';
      case 'PENDING': return 'warn';
      default: return 'info';
    }
  }

  formatCurrency(val: number): string {
    if (val == null) return '₹0';
    return '₹' + Number(val).toLocaleString('en-IN');
  }

  // ── Service Visit Logging ──────────────────────────────────────────────────
  showVisitDialog = false;
  visitContractId: number | null = null;
  visits: any[] = [];
  visitForm: any = this.emptyVisitForm();

  visitTypeOptions = [
    { label: 'Preventive Maintenance', value: 'PREVENTIVE_MAINTENANCE' },
    { label: 'Repair', value: 'REPAIR' },
  ];

  emptyVisitForm() {
    return { visitType: 'PREVENTIVE_MAINTENANCE', visitDate: '', workDone: '', partsReplaced: '', outcome: '', chargeAmount: null as number | null };
  }

  openVisits(contract: any) {
    this.visitContractId = contract.id;
    this.visitForm = this.emptyVisitForm();
    this.visits = [];
    this.scService.getVisits(contract.id).subscribe({
      next: data => { this.visits = data; this.showVisitDialog = true; this.cdr.detectChanges(); },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load visits' })
    });
  }

  logVisit() {
    if (!this.visitContractId) return;
    if (!this.visitForm.visitDate) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Visit date required' });
      return;
    }
    this.loggingVisit = true;
    this.scService.logVisit(this.visitContractId, this.visitForm).subscribe({
      next: v => {
        this.loggingVisit = false;
        this.visits.unshift(v);
        this.visitForm = this.emptyVisitForm();
        this.messageService.add({ severity: 'success', summary: 'Success', detail: v.isChargeable ? `Visit logged — chargeable ₹${v.chargeAmount ?? 0}` : 'Visit logged' });
        this.cdr.detectChanges();
      },
      error: err => { this.loggingVisit = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to log visit' }); }
    });
  }

  approveCharge(visit: any, decision: string) {
    this.approvingCharge = true;
    this.scService.approveVisitCharge(visit.id, { decision }).subscribe({
      next: updated => {
        this.approvingCharge = false;
        visit.chargeApprovalStatus = updated.chargeApprovalStatus;
        this.cdr.detectChanges();
      },
      error: () => { this.approvingCharge = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update approval' }); }
    });
  }
}
