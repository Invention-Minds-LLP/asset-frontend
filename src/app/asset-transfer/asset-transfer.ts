import { ChangeDetectorRef, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Transferr } from '../services/transfer/transferr';

type FilterField = 'assetName' | 'assetId' | 'requestedBy' | 'transferType' | 'status';

@Component({
  selector: 'app-asset-transfer',
  imports: [
    TableModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    CommonModule,
    IconFieldModule,
    InputIconModule,
    SkeletonModule,
    DialogModule,
    TextareaModule,
    SelectModule,
    TagModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './asset-transfer.html',
  styleUrl: './asset-transfer.css'
})
export class AssetTransfer {
  transfers: any[] = [];
  isLoading = true;

  currentPage = 1;
  rowsPerPage = 10;

  searchTerm = '';
  selectedFilter: FilterField = 'assetName';
  filteredActive = false;
  dropdownVisible = false;

  showApproveDialog = false;
  showRejectDialog = false;

  selectedTransfer: any = null;
  selectedTransferId!: number;

  approvalReason = '';
  rejectReason = '';

  // Management approval
  mgmtTransfers: any[] = [];
  mgmtLoading = false;
  showMgmtDialog = false;
  selectedMgmtTransfer: any = null;
  mgmtDecision = 'APPROVED';
  mgmtRemarks = '';
  mgmtDecisionOptions = [
    { label: 'Approve', value: 'APPROVED' },
    { label: 'Reject', value: 'REJECTED' }
  ];

  filterOptions: { label: string; value: FilterField }[] = [
    { label: 'Asset Name', value: 'assetName' },
    { label: 'Asset ID', value: 'assetId' },
    { label: 'Requested By', value: 'requestedBy' },
    { label: 'Transfer Type', value: 'transferType' },
    { label: 'Status', value: 'status' }
  ];

  constructor(
    private transferService: Transferr,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService
  ) {}

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const targetElement = event.target as HTMLElement;
    if (!targetElement.closest('.filter') && !targetElement.closest('.filter-menu')) {
      this.dropdownVisible = false;
    }
  }

  ngOnInit() {
    this.refreshList();
    this.loadMgmtPending();
  }

  refreshList() {
    this.isLoading = true;
    this.transferService.getMyPendingApprovals().subscribe({
      next: (res) => {
        setTimeout(() => {
        this.transfers = res || [];
        this.isLoading = false;
        this.cdr.detectChanges();
        })
      },
      error: () => {
         setTimeout(() => {
        this.transfers = [];
        this.isLoading = false;
        this.cdr.detectChanges();
         });
      }
    });
  }

  get filteredTransfers() {
    if (!this.searchTerm) return this.transfers;

    const term = this.searchTerm.toLowerCase();

    return this.transfers.filter(item => {
      switch (this.selectedFilter) {
        case 'assetName':
          return item.asset?.assetName?.toLowerCase().includes(term);

        case 'assetId':
          return item.asset?.assetId?.toLowerCase().includes(term);

        case 'requestedBy':
          return item.requestedBy?.name?.toLowerCase().includes(term);

        case 'transferType':
          return item.transferType?.toLowerCase().includes(term);

        case 'status':
          return item.status?.toLowerCase().includes(term);

        default:
          return false;
      }
    });
  }

  get paginatedTransfers() {
    const start = (this.currentPage - 1) * this.rowsPerPage;
    return this.filteredTransfers.slice(start, start + this.rowsPerPage);
  }

  get totalPages() {
    return Math.ceil(this.filteredTransfers.length / this.rowsPerPage) || 1;
  }

  get isFilterActive(): boolean {
    return this.filteredActive;
  }

  previousPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  applyFilter() {
    this.currentPage = 1;
  }

  toggleFilterDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.dropdownVisible = !this.dropdownVisible;
  }

  selectFilter(value: FilterField, event: MouseEvent) {
    event.stopPropagation();
    this.selectedFilter = value;
    this.dropdownVisible = false;
    this.filteredActive = true;
  }

  clearFilter() {
    this.searchTerm = '';
    this.currentPage = 1;
    this.selectedFilter = 'assetName';
    this.filteredActive = false;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'REQUESTED': return 'orange';
      case 'APPROVED': return 'green';
      case 'REJECTED': return 'red';
      case 'RETURNED': return 'blue';
      default: return 'gray';
    }
  }

  getRequestTypeLabel(item: any): string {
    if (item?.transferType === 'RETURN') return 'Return Request';
    return item?.transferType || '-';
  }

  getDestination(item: any): string {
    if (!item) return '-';

    if (item.transferType === 'RETURN') {
      return item?.toBranch?.name
        || item?.parentTransfer?.fromBranch?.name
        || '-';
    }

    return item?.toBranch?.name
      || item?.destinationName
      || item?.externalType
      || '-';
  }

  openApprove(item: any) {
    this.selectedTransfer = item;
    this.selectedTransferId = item.id;
    this.approvalReason = '';
    this.showApproveDialog = true;
  }

  openReject(item: any) {
    this.selectedTransfer = item;
    this.selectedTransferId = item.id;
    this.rejectReason = '';
    this.showRejectDialog = true;
  }

  confirmApprove() {
    if (!this.selectedTransferId) return;

    const request$ = this.selectedTransfer?.transferType === 'RETURN'
      ? this.transferService.approveReturnTransfer(this.selectedTransferId, {
          approvalReason: this.approvalReason
        })
      : this.transferService.approveTransfer(this.selectedTransferId, {
          approvalReason: this.approvalReason
        });

    request$.subscribe({
      next: () => {
        setTimeout(() => {
          this.showApproveDialog = false;
          this.selectedTransfer = null;
          this.refreshList();
          this.cdr.detectChanges();
        });
      }
    });
  }

  confirmReject() {
    if (!this.selectedTransferId) return;

    const request$ = this.selectedTransfer?.transferType === 'RETURN'
      ? this.transferService.rejectReturnTransfer(this.selectedTransferId, {
          rejectionReason: this.rejectReason
        })
      : this.transferService.rejectTransfer(this.selectedTransferId, {
          rejectionReason: this.rejectReason
        });

    request$.subscribe({
      next: () => {
        setTimeout(() => {
          this.showRejectDialog = false;
          this.selectedTransfer = null;
          this.refreshList();
          this.cdr.detectChanges();
        });
      }
    });
  }

  loadMgmtPending() {
    this.mgmtLoading = true;
    this.transferService.getPendingMgmtApprovals().subscribe({
      next: (res) => {
        setTimeout(() => {
          this.mgmtTransfers = res || [];
          this.mgmtLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => { this.mgmtLoading = false; this.cdr.detectChanges(); });
      }
    });
  }

  openMgmtApprove(item: any) {
    this.selectedMgmtTransfer = item;
    this.mgmtDecision = 'APPROVED';
    this.mgmtRemarks = '';
    this.showMgmtDialog = true;
  }

  confirmMgmtApprove() {
    if (!this.selectedMgmtTransfer) return;
    this.transferService.managementApproveTransfer(this.selectedMgmtTransfer.id, {
      decision: this.mgmtDecision,
      remarks: this.mgmtRemarks
    }).subscribe({
      next: () => {
        setTimeout(() => {
          this.showMgmtDialog = false;
          this.selectedMgmtTransfer = null;
          this.messageService.add({ severity: 'success', summary: 'Done', detail: `Transfer ${this.mgmtDecision.toLowerCase()}` });
          this.loadMgmtPending();
          this.cdr.detectChanges();
        });
      },
      error: (e: any) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: e?.error?.message || 'Failed' });
      }
    });
  }
}