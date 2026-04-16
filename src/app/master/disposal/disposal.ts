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
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService } from 'primeng/api';
import { DisposalService } from '../../services/disposal/disposal';
import { Assets } from '../../services/assets/assets';

@Component({
  selector: 'app-disposal',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TableModule,
    TagModule, ToastModule, DialogModule, InputTextModule,
    TextareaModule, SelectModule, InputNumberModule
  ],
  templateUrl: './disposal.html',
  styleUrl: './disposal.css',
  providers: [MessageService]
})
export class Disposal implements OnInit {
  userRole = localStorage.getItem('role') || '';

  isRole(...roles: string[]): boolean { return roles.includes(this.userRole); }

  disposals: any[] = [];
  loading = false;
  totalRecords = 0;
  page = 1;
  rows = 15;

  // Status filter
  statusFilter = '';
  statusOptions = [
    { label: 'All', value: '' },
    { label: 'Requested', value: 'REQUESTED' },
    { label: 'Committee Review', value: 'COMMITTEE_REVIEW' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'Completed', value: 'COMPLETED' },
  ];

  // Assets for dropdown
  assetOptions: { label: string; value: number }[] = [];

  // Request dialog
  showRequestDialog = false;
  requestForm: any = { assetId: null, disposalType: '', reason: '', estimatedScrapValue: null };
  requestLoading = false;
  disposalTypeOptions = [
    { label: 'Condemn', value: 'CONDEMN' },
    { label: 'Auction', value: 'AUCTION' },
    { label: 'Scrap', value: 'SCRAP' },
    { label: 'Donate', value: 'DONATE' },
    { label: 'Return to Vendor', value: 'RETURN_TO_VENDOR' },
  ];

  // Review dialog
  showReviewDialog = false;
  reviewForm: any = { committeeMembers: '', committeeRemarks: '' };
  reviewLoading = false;
  selectedDisposalId: number | null = null;

  approvingDisposal = false;
  rejectingDisposal = false;

  // Sub-asset resolution dialog
  showSubAssetDialog = false;
  pendingApprovalDisposal: any = null;
  subAssetsForResolution: any[] = [];   // sub-assets that need a decision
  resolutionOptions = [
    { label: 'Condemn (mark as condemned)', value: 'CONDEMN' },
    { label: 'Move to Store', value: 'MOVE_TO_STORE' },
    { label: 'Re-link to another asset', value: 'RELINK' },
  ];
  relinkAssetOptions: { label: string; value: number }[] = [];

  // Complete dialog
  showCompleteDialog = false;
  completeForm: any = { actualSaleValue: null, buyerName: '', buyerContact: '', disposalCertificate: '' };
  completeLoading = false;

  constructor(
    private disposalService: DisposalService,
    private assetService: Assets,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadDisposals();
    this.loadAssets();
    this.assetService.getAllAssetsForDropdown().subscribe({
      next: (list: any[]) => {
        this.relinkAssetOptions = list.map(a => ({ label: `${a.assetId} — ${a.assetName}`, value: a.id }));
      }
    });
  }

  loadDisposals() {
    this.loading = true;
    const filters: any = { page: this.page, limit: this.rows };
    if (this.statusFilter) filters.status = this.statusFilter;

    this.disposalService.getAll(filters).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.disposals = res.data || res;
          this.totalRecords = res.pagination?.total || this.disposals.length;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.loading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load disposals' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  loadAssets() {
    this.assetService.getAllAssets().subscribe({
      next: (assets: any[]) => {
        setTimeout(() => {
          this.assetOptions = assets.map((a: any) => ({ label: `${a.assetId} - ${a.assetName}`, value: a.id }));
          this.cdr.detectChanges();
        });
      },
      error: () => {}
    });
  }

  onStatusFilter() {
    this.page = 1;
    this.loadDisposals();
  }

  onPageChange(event: any) {
    this.page = Math.floor(event.first / event.rows) + 1;
    this.rows = event.rows;
    this.loadDisposals();
  }

  // Request dialog
  openRequestDialog() {
    this.requestForm = { assetId: null, disposalType: '', reason: '', estimatedScrapValue: null };
    this.showRequestDialog = true;
  }

  submitRequest() {
    if (!this.requestForm.assetId || !this.requestForm.disposalType || !this.requestForm.reason) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Please fill all required fields' });
      return;
    }
    this.requestLoading = true;
    this.disposalService.request(this.requestForm).subscribe({
      next: () => {
        setTimeout(() => {
          this.requestLoading = false;
          this.showRequestDialog = false;
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Disposal request submitted' });
          this.loadDisposals();
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.requestLoading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to submit request' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  // Review (send to committee)
  openReviewDialog(disposal: any) {
    this.selectedDisposalId = disposal.id;
    this.reviewForm = { committeeMembers: '', committeeRemarks: '' };
    this.showReviewDialog = true;
  }

  submitReview() {
    if (!this.selectedDisposalId) return;
    this.reviewLoading = true;
    this.disposalService.review(this.selectedDisposalId, this.reviewForm).subscribe({
      next: () => {
        setTimeout(() => {
          this.reviewLoading = false;
          this.showReviewDialog = false;
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Sent to committee review' });
          this.loadDisposals();
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.reviewLoading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to submit review' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  // Approve — first check for sub-assets
  approveDisposal(disposal: any) {
    this.disposalService.getSubAssets(disposal.id).subscribe({
      next: (res: any) => {
        if (res.count > 0) {
          this.pendingApprovalDisposal = disposal;
          this.subAssetsForResolution = res.subAssets.map((s: any) => ({
            ...s, resolution: 'CONDEMN', newParentAssetId: null
          }));
          this.showSubAssetDialog = true;
        } else {
          this._doApprove(disposal.id, []);
        }
      },
      error: () => this._doApprove(disposal.id, [])
    });
  }

  confirmApproveWithResolutions() {
    if (!this.pendingApprovalDisposal) return;
    const resolutions = this.subAssetsForResolution.map(s => ({
      subAssetId: s.id,
      action: s.resolution,
      newParentAssetId: s.resolution === 'RELINK' ? s.newParentAssetId : undefined,
    }));
    this.showSubAssetDialog = false;
    this._doApprove(this.pendingApprovalDisposal.id, resolutions);
  }

  private _doApprove(disposalId: number, subAssetResolutions: any[]) {
    this.approvingDisposal = true;
    this.disposalService.approve(disposalId, { subAssetResolutions }).subscribe({
      next: () => {
        setTimeout(() => {
          this.approvingDisposal = false;
          this.messageService.add({ severity: 'success', summary: 'Approved', detail: 'Disposal approved' });
          this.loadDisposals();
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.approvingDisposal = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to approve' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  // Reject
  rejectDisposal(disposal: any) {
    this.rejectingDisposal = true;
    this.disposalService.reject(disposal.id, { committeeRemarks: 'Rejected' }).subscribe({
      next: () => {
        setTimeout(() => {
          this.rejectingDisposal = false;
          this.messageService.add({ severity: 'warn', summary: 'Rejected', detail: 'Disposal rejected' });
          this.loadDisposals();
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.rejectingDisposal = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to reject' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  // Complete dialog
  openCompleteDialog(disposal: any) {
    this.selectedDisposalId = disposal.id;
    this.completeForm = { actualSaleValue: null, buyerName: '', buyerContact: '', disposalCertificate: '' };
    this.showCompleteDialog = true;
  }

  submitComplete() {
    if (!this.selectedDisposalId) return;
    this.completeLoading = true;
    this.disposalService.complete(this.selectedDisposalId, this.completeForm).subscribe({
      next: () => {
        setTimeout(() => {
          this.completeLoading = false;
          this.showCompleteDialog = false;
          this.messageService.add({ severity: 'success', summary: 'Completed', detail: 'Disposal completed' });
          this.loadDisposals();
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.completeLoading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to complete disposal' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  getStatusSeverity(status: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    switch (status) {
      case 'REQUESTED': return 'warn';
      case 'COMMITTEE_REVIEW': return 'info';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'danger';
      case 'COMPLETED': return 'secondary';
      default: return 'secondary';
    }
  }

  formatCurrency(val: number): string {
    if (val == null) return '—';
    return '₹' + Number(val).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
}
