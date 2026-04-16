import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ProgressBarModule } from 'primeng/progressbar';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { AssetAuditService } from '../../services/asset-audit/asset-audit';
import { DatePicker } from 'primeng/datepicker';

@Component({
  selector: 'app-asset-audit',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TableModule,
    TagModule, ToastModule, DialogModule, InputTextModule,
    TextareaModule, SelectModule, ProgressBarModule, CheckboxModule, DatePicker
  ],
  templateUrl: './asset-audit.html',
  styleUrl: './asset-audit.css',
  providers: [MessageService]
})
export class AssetAudit implements OnInit {
  userRole = localStorage.getItem('role') || '';

  isRole(...roles: string[]): boolean { return roles.includes(this.userRole); }

  // List view
  audits: any[] = [];
  loading = false;
  totalRecords = 0;

  // Detail view
  showDetail = false;
  selectedAudit: any = null;
  auditItems: any[] = [];
  summary: any = {};
  detailLoading = false;

  // Create dialog
  showCreateDialog = false;
  createForm: any = { auditName: '', auditDate: null, description: '', branchId: null, departmentId: null, floor: null, block: null, room: null };
  createLoading = false;

  // Location options
  locationFloors: string[] = [];
  locationBlocks: string[] = [];
  locationRooms: string[] = [];
  locationsLoading = false;

  startingAudit = false;
  completingAudit = false;

  // Verify dialog
  showVerifyDialog = false;
  selectedItemId: number | null = null;
  verifyForm: any = {
    status: 'VERIFIED',
    locationMatch: true,
    conditionMatch: true,
    actualLocation: '',
    actualCondition: '',
    remarks: ''
  };
  verifyLoading = false;

  verifyStatusOptions = [
    { label: 'Verified', value: 'VERIFIED' },
    { label: 'Missing', value: 'MISSING' },
    { label: 'Mismatch', value: 'MISMATCH' },
  ];

  constructor(
    private auditService: AssetAuditService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadAudits();
    this.loadLocationOptions();
  }

  loadLocationOptions() {
    this.locationsLoading = true;
    this.auditService.getLocationOptions().subscribe({
      next: (res: any) => {
        const d = res.data || res;
        this.locationFloors = d.floors || [];
        this.locationBlocks = d.blocks || [];
        this.locationRooms  = d.rooms  || [];
        this.locationsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.locationsLoading = false; }
    });
  }

  loadAudits() {
    this.loading = true;
    this.auditService.getAll({}).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.audits = res.data || res;
          this.totalRecords = res.pagination?.total || this.audits.length;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.loading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load audits' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  // Create
  openCreateDialog() {
    this.createForm = { auditName: '', auditDate: null, description: '', branchId: null, departmentId: null, floor: null, block: null, room: null };
    this.showCreateDialog = true;
  }

  submitCreate() {
    if (!this.createForm.auditName) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Audit name is required' });
      return;
    }
    if (!this.createForm.auditDate) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Audit date is required' });
      return;
    }
    this.createLoading = true;
    this.auditService.create(this.createForm).subscribe({
      next: () => {
        setTimeout(() => {
          this.createLoading = false;
          this.showCreateDialog = false;
          this.messageService.add({ severity: 'success', summary: 'Created', detail: 'Audit created successfully' });
          this.loadAudits();
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        setTimeout(() => {
          this.createLoading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to create audit' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  // View detail
  viewAudit(audit: any) {
    this.selectedAudit = audit;
    this.showDetail = true;
    this.loadAuditDetail(audit.id);
  }

  loadAuditDetail(id: number) {
    this.detailLoading = true;
    this.auditService.getSummary(id).subscribe({
      next: (res) => {
        setTimeout(() => {
          const data = res?.data ?? res;
          this.summary = {
            totalItems: data.totalAssets ?? 0,
            verifiedCount: data.verifiedCount ?? 0,
            missingCount: data.missingCount ?? 0,
            mismatchCount: data.mismatchCount ?? 0,
            pendingCount: data.pendingCount ?? 0,
          };
          this.selectedAudit = { ...this.selectedAudit, auditName: data.auditName, status: data.status };
          this.detailLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.detailLoading = false;
          this.cdr.detectChanges();
        });
      }
    });

    this.auditService.getById(id).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.auditItems = (res.data || res)?.items || [];
          this.cdr.detectChanges();
        });
      },
      error: () => {}
    });
  }

  backToList() {
    this.showDetail = false;
    this.selectedAudit = null;
    this.auditItems = [];
    this.summary = {};
    this.loadAudits();
  }

  // Start audit
  startAudit(audit: any) {
    this.startingAudit = true;
    this.auditService.start(audit.id).subscribe({
      next: () => {
        setTimeout(() => {
          this.startingAudit = false;
          this.messageService.add({ severity: 'success', summary: 'Started', detail: 'Audit is now in progress' });
          this.loadAudits();
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.startingAudit = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to start audit' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  // Complete audit
  completeAudit(audit: any) {
    this.completingAudit = true;
    this.auditService.complete(audit.id).subscribe({
      next: () => {
        setTimeout(() => {
          this.completingAudit = false;
          this.messageService.add({ severity: 'success', summary: 'Completed', detail: 'Audit completed' });
          if (this.showDetail) {
            this.loadAuditDetail(audit.id);
          }
          this.loadAudits();
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.completingAudit = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to complete audit' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  // Verify item
  openVerifyDialog(item: any) {
    this.selectedItemId = item.id;
    this.verifyForm = {
      status: 'VERIFIED',
      locationMatch: true,
      conditionMatch: true,
      actualLocation: '',
      actualCondition: '',
      remarks: ''
    };
    this.showVerifyDialog = true;
  }

  submitVerify() {
    if (!this.selectedItemId) return;
    this.verifyLoading = true;
    this.auditService.verifyItem(this.selectedItemId, this.verifyForm).subscribe({
      next: () => {
        setTimeout(() => {
          this.verifyLoading = false;
          this.showVerifyDialog = false;
          this.messageService.add({ severity: 'success', summary: 'Verified', detail: 'Item verified' });
          if (this.selectedAudit) {
            this.loadAuditDetail(this.selectedAudit.id);
          }
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.verifyLoading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to verify item' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  getAuditStatusSeverity(status: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    switch (status) {
      case 'PLANNED': return 'info';
      case 'IN_PROGRESS': return 'warn';
      case 'COMPLETED': return 'success';
      default: return 'secondary';
    }
  }

  getItemStatusSeverity(status: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    switch (status) {
      case 'VERIFIED': return 'success';
      case 'MISSING': return 'danger';
      case 'MISMATCH': return 'contrast';
      case 'PENDING': return 'warn';
      default: return 'secondary';
    }
  }

  getScopeLabel(): string {
    return [this.createForm.floor, this.createForm.block, this.createForm.room]
      .filter(v => v != null && v !== '')
      .join(' / ');
  }

  getProgressPercent(): number {
    if (!this.summary.totalItems) return 0;
    return Math.round(((this.summary.verifiedCount || 0) / this.summary.totalItems) * 100);
  }
}
