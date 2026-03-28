import { Component, ViewChild, HostListener, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { InputIcon } from 'primeng/inputicon';
import { IconField } from 'primeng/iconfield';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Ticketing } from '../../services/tickerting/ticketing';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TabViewModule } from 'primeng/tabview';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { Assets } from '../../services/assets/assets';
import { PendingTransfers } from "../pending-transfers/pending-transfers";
import { DurationPipe } from '../../pipes/duration.pipe';

type FilterField = 'id' | 'name' | 'ticketid' | 'raisedby' | 'department' | 'priority';

@Component({
  selector: 'app-ticketing-table',
  imports: [InputIcon, IconField, InputTextModule, FormsModule, ToastModule,
    TableModule, CommonModule, ButtonModule, FormsModule, TabViewModule, DialogModule,
    SelectModule, TextareaModule, ReactiveFormsModule, DurationPipe],
  templateUrl: './ticketing-table.html',
  styleUrl: './ticketing-table.css',
  providers: [MessageService]
})
export class TicketingTable {

  currentPage = 1;
  rowsPerPage = 10;
  searchTerm: string = '';
  filterActive: boolean = false;
  tickets: any[] = [];
  assignedTickets: any[] = [];
  raisedTickets: any[] = [];
  // activeTabIndex = 0; // 0=All, 1=Assigned, 2=Raised
  activeTab: 'ALL' | 'ASSIGNED' | 'RAISED' | 'PENDING' = 'ASSIGNED';

  filterOption = [
    { label: "Ticket ID", value: "ticketId" },
    { label: "Asset ID", value: "assetId" },
    { label: "Asset Name", value: "assetName" },
    { label: "Department", value: "department" },
    { label: "Raised By", value: "raisedBy" },
    { label: "Priority", value: "priority" },
    { label: "Status", value: "status" },
    // Pending Transfers
    { label: "Transfer ID", value: "transferId" },
    { label: "From Department", value: "fromDept" },
    { label: "To Department", value: "toDept" },
    { label: "Requested By", value: "requestedBy" },
    { label: "Transfer Comment", value: "transferComment" },
  ];
  selectedFilter:
    | "ticketId" | "assetId" | "assetName" | "department" | "raisedBy" | "priority" | "status"
    | "transferId" | "fromDept" | "toDept" | "requestedBy" | "transferComment"
    = "ticketId";

  userRole = '';
  myEmployeeDbId: number | null = null;

  // dialogs reuse (same dialogs you already made in TicketingForm)
  showReassignDialog = false;
  showCloseDialog = false;
  selectedTicket: any = null;

  showAssignDialog = false;
  showTerminateDialog = false;

  assignForm!: FormGroup;
  reassignForm!: FormGroup;
  terminateForm!: FormGroup;
  closeForm!: FormGroup;
  showTransferDialog = false;
  transferForm!: FormGroup;

  // you will need departments + vendors arrays
  departments: any[] = [];
  vendors: any[] = []; // if you implement vendor transfers
  employees: any[] = [];
  pendingTransfers: any[] = [];

  pendingPage = 1;
  pendingRowsPerPage = 10;
  pendingSearchTerm = '';

  showRejectTransferDialog = false;
  selectedTransfer: any = null;
  rejectReason = '';
  showMetricsDialog = false;
  metricsLoading = false;
  metricsData: any = null;
  metricsError = '';
  showResolveDialog = false;
  resolveForm!: FormGroup;


  constructor(private ticketService: Ticketing, private router: Router, private assetService: Assets,
    private cdr: ChangeDetectorRef, private toastService: MessageService, private fb: FormBuilder) { }

  @ViewChild('filterContainer') filterContainerRef!: ElementRef;
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const targetElement = event.target as HTMLElement;
    if (!targetElement.closest('.filter') && !targetElement.closest('.filter-menu')) {
      this.dropdownVisible = false;
    }
  }
  //search 
  // get FilteredWarranty() {
  //   if (!this.searchTerm) {
  //     console.log('tickets', this.tickets)
  //     return this.tickets;
  //   }

  //   const term = this.searchTerm.toLowerCase();

  //   return this.tickets.filter(item => {
  //     const value = item[this.selectedFilter]?.toString().toLowerCase() || '';
  //     return value.includes(term);
  //   });
  // }

  initForms() {
    this.assignForm = this.fb.group({
      toEmployeeId: ['', Validators.required],
      comment: ['', Validators.required],
    });

    this.reassignForm = this.fb.group({
      toEmployeeId: ['', Validators.required],
      comment: ['', Validators.required],
    });

    this.terminateForm = this.fb.group({
      note: ['', Validators.required],
    });

    this.closeForm = this.fb.group({
      remarks: ['', Validators.required],
    });
    this.transferForm = this.fb.group({
      transferType: ['INTERNAL_DEPARTMENT', Validators.required],
      toDepartmentId: [''],
      vendorId: [''],
      comment: ['', Validators.required],
    });
    this.completeForm = this.fb.group({
      note: ['', Validators.required],
    });
    this.resolveForm = this.fb.group({
      remarks: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.ticketService.getAllTickets().subscribe({
      next: (response) => {
        setTimeout(() => {
          this.tickets = response;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Error creating asset:', error);
      }
    });
    this.loadMyTickets();
    this.initForms();
    this.loadEmployees();
    this.assetService.getVendors().subscribe({
      next: (response) => {
        setTimeout(() => {
          this.vendors = response;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Error getting vendors:', error);
      }
    });
    this.assetService.getDepartments().subscribe({
      next: (response) => {
        setTimeout(() => {
          this.departments = response;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Error getting departments:', error);
      }
    });


    const user = JSON.parse(localStorage.getItem('user') || 'null');
    this.userRole = user?.role || '';
    this.myEmployeeDbId = user?.employeeDbId ?? null;

    this.activeTab = (this.userRole === 'ADMIN' || this.userRole === 'HOD') ? 'ALL' : 'ASSIGNED';

    // if (this.userRole === 'ADMIN' || this.userRole === 'HOD') {
    //   this.loadPendingTransfers();
    // }
  }
  get filterOptionForTab() {
    if (this.activeTab === 'PENDING') {
      return [
        { label: "Transfer ID", value: "transferId" },
        { label: "Ticket ID", value: "ticketId" },
        { label: "Asset ID", value: "assetId" },
        { label: "Asset Name", value: "assetName" },
        { label: "From Department", value: "fromDept" },
        { label: "To Department", value: "toDept" },
        { label: "Requested By", value: "requestedBy" },
        { label: "Transfer Comment", value: "transferComment" },
      ];
    }

    return [
      { label: "Ticket ID", value: "ticketId" },
      { label: "Asset ID", value: "assetId" },
      { label: "Asset Name", value: "assetName" },
      { label: "Department", value: "department" },
      { label: "Raised By", value: "raisedBy" },
      { label: "Priority", value: "priority" },
      { label: "Status", value: "status" },
    ];
  }

  loadMyTickets() {
    this.ticketService.getMyAssignedTickets().subscribe({
      next: (res) => {
        setTimeout(() => {
          this.assignedTickets = res;
          this.cdr.detectChanges();
        });
      },
      error: () => this.toast('error', 'Failed to load assigned tickets'),
    });

    this.ticketService.getMyRaisedTickets().subscribe({
      next: (res) => {
        setTimeout(() => {
          this.raisedTickets = res;
          this.cdr.detectChanges();
        });
      },
      error: () => this.toast('error', 'Failed to load raised tickets'),
    });
  }

  refresh() {
    console.log("Refreshing data...");
  }


  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++
    }
  }

  // get ticketingAssets() {
  //   const start = (this.currentPage - 1) * this.rowsPerPage;
  //   const end = start + this.rowsPerPage;
  //   return this.FilteredWarranty.slice(start, end)
  // }

  get totalPages(): number {
    return Math.ceil(this.filteredActiveList.length / this.rowsPerPage) || 1;
  }
  applyFilter() {
    this.currentPage = 1;
  }


  dropdownVisible = false;

  showCompleteDialog = false;
  completeForm!: FormGroup;

  toggleFilterDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.dropdownVisible = !this.dropdownVisible;
  }

  selectFilter(value: any, event: MouseEvent) {
    event.stopPropagation();
    this.selectedFilter = value;
    this.filterActive = true;
    this.dropdownVisible = false;
    console.log(this.dropdownVisible)
  }
  get isFilterActive(): boolean {
    return this.filterActive;
  }
  clearFilter() {
    this.searchTerm = '';
    this.currentPage = 1;
    this.selectedFilter = 'assetName';
    this.filterActive = false;
    console.log('Filter cleared.');
  }
  viewWarranty(asset: any) {
    console.log('Navigating to edit asset:', asset);
    this.router.navigate(['/ticket/edit', asset]);
  }
  toast(severity: string, detail: string) {
    this.toastService.add({
      severity,
      summary: "Info",
      detail
    });
  }
  objectKeys = (o: any) => Object.keys(o || {});

  // ✅ pick dataset based on active tab
  get activeList(): any[] {
    if (this.activeTab === 'ASSIGNED') return this.assignedTickets;
    if (this.activeTab === 'RAISED') return this.raisedTickets;
    if (this.activeTab === 'PENDING') return this.pendingTransfers;
    return this.tickets; // ALL
  }
  // ✅ map nested values for search
  private getFieldValue(t: any, field: string): string {
    if (this.activeTab === 'PENDING') {
      switch (field) {
        case "transferId": return String(t?.id ?? "");
        case "ticketId": return String(t?.ticket?.ticketId ?? "");
        case "assetId": return String(t?.ticket?.asset?.assetId ?? "");
        case "assetName": return String(t?.ticket?.asset?.assetName ?? "");
        case "fromDept": return String(t?.fromDepartment?.name ?? "");
        case "toDept": return String(t?.toDepartment?.name ?? "");
        case "requestedBy": return String(t?.requestedBy?.name ?? "");
        case "transferComment": return String(t?.comment ?? "");
        default: return "";
      }
    }
    switch (field) {
      case "ticketId": return String(t?.ticketId ?? "");
      case "assetId": return String(t?.asset?.assetId ?? "");
      case "assetName": return String(t?.asset?.assetName ?? "");
      case "department": return String(t?.department?.name ?? "");
      case "raisedBy": return String(t?.raisedBy?.name ?? "");
      case "priority": return String(t?.priority ?? "");
      case "status": return String(t?.status ?? "");
      default: return "";
    }
  }

  get filteredActiveList(): any[] {
    const list = this.activeList ?? [];
    console.log(this.activeList)
    const term = (this.searchTerm || "").trim().toLowerCase();
    if (!term) return list;

    return list.filter(t => this.getFieldValue(t, this.selectedFilter).toLowerCase().includes(term));
  }

  // ✅ table rows for current page
  get pagedActiveList(): any[] {
    const start = (this.currentPage - 1) * this.rowsPerPage;
    return this.filteredActiveList.slice(start, start + this.rowsPerPage);
  }

  // ✅ when switching tabs, reset paging (optional)
  // onTabChange(e: any) {
  //   this.activeTabIndex = e.index;
  //   this.currentPage = 1;
  //   this.searchTerm = '';
  //   this.filterActive = false;

  //   // when user opens Pending Transfers tab (index 3)
  //   if (this.activeTabIndex === 3) {
  //     this.selectedFilter = 'transferId'
  //     this.loadPendingTransfers();
  //   }
  //   else {
  //     this.selectedFilter = 'ticketId'
  //   }
  // }
  setTab(tab: 'ALL' | 'ASSIGNED' | 'RAISED' | 'PENDING') {
    this.activeTab = tab;
    this.currentPage = 1;
    this.searchTerm = '';
    this.filterActive = false;
    this.dropdownVisible = false;

    this.selectedFilter = (tab === 'PENDING') ? 'transferId' : 'ticketId';

    if (tab === 'PENDING') this.loadPendingTransfers();
  }
  get visibleTabs(): ('ALL' | 'ASSIGNED' | 'RAISED' | 'PENDING')[] {
    const tabs: any[] = [];
    if (this.userRole === 'ADMIN' || this.userRole === 'HOD') tabs.push('ALL');
    tabs.push('ASSIGNED');
    tabs.push('RAISED');
    if (this.userRole === 'HOD') tabs.push('PENDING');
    return tabs;
  }
  get activeIndex(): number {
    return Math.max(0, this.visibleTabs.indexOf(this.activeTab));
  }

  set activeIndex(i: number) {
    const tab = this.visibleTabs[i] || 'ASSIGNED';
    this.setTab(tab);
  }

  onTabChange(e: any) {
    const tab = this.visibleTabs[e.index] || 'ASSIGNED';
    this.setTab(tab);
  }
  getStatusColor(status: string): string {
    switch (status) {
      case 'OPEN':
        return '#3498db';
      case 'ASSIGNED':
        return '#9b59b6';
      case 'IN_PROGRESS':
        return '#f39c12';
      case 'ON_HOLD':
        return '#f1c40f';
      case 'WORK_COMPLETED':
        return '#16a085';
      case 'RESOLVED':
        return '#00A23D';
      case 'CLOSED':
        return '#95a5a6';
      case 'REJECTED':
        return '#e74c3c';
      case 'TERMINATED':
        return '#7f8c8d';
      default:
        return '#bdc3c7';
    }
  }




  changeStatus(ticket: any, status: string) {
    this.ticketService.updateStatus(ticket.id, status).subscribe({
      next: () => {
        this.toast('success', `Updated to ${status}`);
        this.refreshAllLists();
      },
      error: () => this.toast('error', 'Failed to update status')
    });
  }

  refreshAllLists() {
    // simplest refresh
    this.ticketService.getAllTickets().subscribe(res => this.tickets = res);
    this.loadMyTickets();
  }

  // -------- permission helpers (Assigned tab) ----------
  canStartWork(t: any) {
    return this.userRole === 'SUPERVISOR'
      && (t.status === 'ASSIGNED' || t.status === 'ON_HOLD');
  }

  canHold(t: any) {
    return this.userRole === 'SUPERVISOR'
      && t.status === 'IN_PROGRESS';
  }

  canHodResolve(t: any) {
    return this.userRole === 'HOD' && t.status === 'WORK_COMPLETED';
  }
  canMarkCompleted(t: any) {
    return this.userRole === 'SUPERVISOR'
      && (t.status === 'IN_PROGRESS' || t.status === 'ON_HOLD');
  }

  // HOD can reassign while ticket is not closed/terminated
  canAssignFromTable(t: any) {
    return this.userRole === 'HOD'
      && t.status === 'OPEN';
  }

  canReassignFromTable(t: any) {
    return this.userRole === 'HOD'
      && !['CLOSED', 'TERMINATED'].includes(t.status);
  }

  canTerminateFromTable(t: any) {
    return this.userRole === 'HOD'
      && !['CLOSED', 'TERMINATED', 'RESOLVED'].includes(t.status);
  }

  // -------- Raised tab ----------
  canCloseFromTable(t: any) {
    const iRaised = !!this.myEmployeeDbId && t.raisedById === this.myEmployeeDbId;
    console.log(iRaised, 'isRaised', this.myEmployeeDbId, 'dbId', t.raisedById, 'raisedBy')
    const allowedStatus = (t.status === 'RESOLVED' || t.status === 'TERMINATED');
    console.log(allowedStatus)
    return iRaised && allowedStatus;
  }

  // ---------- Dialog openers ----------
  openReassignDialogForTicket(t: any) {
    this.selectedTicket = t;
    this.showReassignDialog = true;
  }

  openCloseDialogForTicket(t: any) {
    this.selectedTicket = t;
    this.showCloseDialog = true;

    // ✅ fetch metrics whenever close dialog opens
    this.metricsLoading = true;
    this.metricsError = '';
    this.metricsData = null;

    this.ticketService.getTicketMetrics(t.id).subscribe({
      next: (data) => {
        this.metricsData = data;
        this.metricsLoading = false;
      },
      error: (e) => {
        this.metricsError = e?.error?.message || 'Failed to load metrics';
        this.metricsLoading = false;
      }
    });
  }

  openAssignDialogFromTable(t: any) {
    this.selectedTicket = t;
    this.assignForm.reset();
    this.showAssignDialog = true;
  }

  openReassignDialogFromTable(t: any) {
    this.selectedTicket = t;
    this.reassignForm.reset();
    this.showReassignDialog = true;
  }

  openTerminateDialogFromTable(t: any) {
    this.selectedTicket = t;
    this.terminateForm.reset();
    this.showTerminateDialog = true;
  }

  openCloseDialogFromTable(t: any) {
    this.selectedTicket = t;
    this.closeForm.reset();
    this.showCloseDialog = true;
  }
  submitAssignFromTable() {
    if (!this.selectedTicket?.id || this.assignForm.invalid) return;

    const toEmployeeId = Number(this.assignForm.value.toEmployeeId);
    const comment = String(this.assignForm.value.comment).trim();

    this.ticketService.assignTicket(this.selectedTicket.id, toEmployeeId, comment).subscribe({
      next: () => {
        this.toast('success', 'Ticket assigned');
        this.showAssignDialog = false;
        this.refreshAfterAction();
      },
      error: (e) => this.toast('error', e?.error?.message || 'Failed to assign')
    });
  }

  submitReassignFromTable() {
    if (!this.selectedTicket?.id || this.reassignForm.invalid) return;

    const toEmployeeId = Number(this.reassignForm.value.toEmployeeId);
    const comment = String(this.reassignForm.value.comment).trim();

    this.ticketService.reassignTicket(this.selectedTicket.id, toEmployeeId, comment).subscribe({
      next: () => {
        this.toast('success', 'Ticket reassigned');
        this.showReassignDialog = false;
        this.refreshAfterAction();
      },
      error: (e) => this.toast('error', e?.error?.message || 'Failed to reassign')
    });
  }

  submitTerminateFromTable() {
    if (!this.selectedTicket?.id || this.terminateForm.invalid) return;

    const note = String(this.terminateForm.value.note).trim();

    this.ticketService.terminateTicket(this.selectedTicket.id, note).subscribe({
      next: () => {
        this.toast('warn', 'Ticket terminated');
        this.showTerminateDialog = false;
        this.refreshAfterAction();
      },
      error: (e) => this.toast('error', e?.error?.message || 'Failed to terminate')
    });
  }

  submitCloseFromTable() {
    if (!this.selectedTicket?.id || this.closeForm.invalid) return;

    const remarks = String(this.closeForm.value.remarks).trim();

    this.ticketService.closeTicket(this.selectedTicket.id, remarks).subscribe({
      next: () => {
        this.toast('success', 'Ticket closed');
        this.showCloseDialog = false;
        this.refreshAfterAction();
      },
      error: (e) => this.toast('error', e?.error?.message || 'Failed to close')
    });
  }

  updateStatusFromTable(t: any, status: string) {
    if (!t?.id) return;

    this.ticketService.updateStatus(t.id, status).subscribe({
      next: () => {
        this.toast('success', `Status updated to ${status}`);
        this.refreshAfterAction();
      },
      error: (e) => this.toast('error', e?.error?.message || 'Failed to update status')
    });
  }

  refreshAfterAction() {
    this.ticketService.getAllTickets().subscribe({
      next: (res) => {
        setTimeout(() => {
          this.tickets = res;
          this.cdr.detectChanges();
        });
      }
    });
    this.loadMyTickets();
  }
  loadEmployees() {
    this.assetService.getEmployees().subscribe({
      next: (res: any[]) => {
        this.employees = res.map(e => ({
          ...e,
          label: `${e.employeeID} - ${e.name}`,
          value: e.id, // ✅ important: DB id
        }));
      },
      error: () => this.toast('error', 'Failed to load employees')
    });
  }
  canTransferFromTable(t: any) {
    return this.userRole === 'HOD' && !['CLOSED'].includes(t.status);
  }

  openTransferDialogFromTable(t: any) {
    this.selectedTicket = t;
    this.transferForm.reset({
      transferType: 'INTERNAL_DEPARTMENT',
      toDepartmentId: '',
      vendorId: '',
      comment: '',
    });
    this.showTransferDialog = true;
  }

  submitTransferFromTable() {
    if (!this.selectedTicket?.id || this.transferForm.invalid) return;

    const v = this.transferForm.value;
    const payload: any = {
      transferType: v.transferType,
      comment: String(v.comment || '').trim(),
    };

    if (v.transferType === 'INTERNAL_DEPARTMENT') {
      payload.toDepartmentId = Number(v.toDepartmentId);
      if (!payload.toDepartmentId) {
        this.toast('error', 'Select department');
        return;
      }
    } else {
      payload.vendorId = Number(v.vendorId);
      if (!payload.vendorId) {
        this.toast('error', 'Select vendor');
        return;
      }
    }

    this.ticketService.requestTransfer(this.selectedTicket.id, payload).subscribe({
      next: () => {
        this.toast('success', 'Transfer requested');
        this.showTransferDialog = false;
        this.refreshAfterAction();
      },
      error: (e: any) => this.toast('error', e?.error?.message || 'Failed to request transfer'),
    });
  }
  loadPendingTransfers() {
    this.ticketService.getPendingTransfers().subscribe({
      next: (res) => {
        setTimeout(() => {
          this.pendingTransfers = res || [];
          this.cdr.detectChanges();
        });
      },
      error: (e) => this.toast('error', e?.error?.message || 'Failed to load pending transfers')
    });
  }

  // call this when needed
  refreshPendingTransfers() {
    this.loadPendingTransfers();
  }

  // pagination + filter
  get filteredPendingTransfers(): any[] {
    const list = this.pendingTransfers ?? [];
    const term = (this.pendingSearchTerm || '').trim().toLowerCase();
    if (!term) return list;

    return list.filter(r => {
      const ticketId = String(r?.ticket?.ticketId ?? '').toLowerCase();
      const assetId = String(r?.ticket?.asset?.assetId ?? '').toLowerCase();
      const assetName = String(r?.ticket?.asset?.assetName ?? '').toLowerCase();
      const fromDept = String(r?.fromDepartment?.name ?? '').toLowerCase();
      const toDept = String(r?.toDepartment?.name ?? '').toLowerCase();
      const comment = String(r?.comment ?? '').toLowerCase();
      const requestedBy = String(r?.requestedBy?.name ?? '').toLowerCase();

      return (
        ticketId.includes(term) ||
        assetId.includes(term) ||
        assetName.includes(term) ||
        fromDept.includes(term) ||
        toDept.includes(term) ||
        comment.includes(term) ||
        requestedBy.includes(term)
      );
    });
  }

  get pagedPendingTransfers(): any[] {
    const start = (this.pendingPage - 1) * this.pendingRowsPerPage;
    return this.filteredPendingTransfers.slice(start, start + this.pendingRowsPerPage);
  }

  get pendingTotalPages(): number {
    return Math.ceil(this.filteredPendingTransfers.length / this.pendingRowsPerPage) || 1;
  }

  pendingPrevPage() {
    if (this.pendingPage > 1) this.pendingPage--;
  }
  pendingNextPage() {
    if (this.pendingPage < this.pendingTotalPages) this.pendingPage++;
  }

  // approve / reject
  approveTransferRow(row: any) {
    if (!row?.id) return;
    const ticketId = row?.ticketId ?? row?.ticket?.id;

    this.ticketService.approveTransfer(ticketId, Number(row.id)).subscribe({
      next: () => {
        this.toast('success', 'Transfer approved');
        // remove row from UI
        this.pendingTransfers = this.pendingTransfers.filter(r => r.id !== row.id);
        // refresh ticket tables too because department may change
        this.refreshAllLists();
      },
      error: (e) => this.toast('error', e?.error?.message || 'Failed to approve'),
    });
  }

  openRejectTransferDialog(row: any) {
    this.selectedTransfer = row;
    this.rejectReason = '';
    this.showRejectTransferDialog = true;
  }

  confirmRejectTransfer() {
    if (!this.selectedTransfer?.id) return;
    const ticketId = this.selectedTransfer?.ticketId ?? this.selectedTransfer?.ticket?.id;

    const reason = (this.rejectReason || '').trim();

    this.ticketService.rejectTransfer(ticketId, Number(this.selectedTransfer.id), reason).subscribe({
      next: () => {
        this.toast('warn', 'Transfer rejected');
        this.pendingTransfers = this.pendingTransfers.filter(r => r.id !== this.selectedTransfer.id);
        this.showRejectTransferDialog = false;
        this.selectedTransfer = null;
      },
      error: (e) => this.toast('error', e?.error?.message || 'Failed to reject'),
    });
  }
  openCompleteDialog(t: any) {
    this.selectedTicket = t;
    this.completeForm.reset();
    this.showCompleteDialog = true;
  }

  submitCompleteWork() {
    if (!this.selectedTicket?.id || this.completeForm.invalid) return;

    const note = String(this.completeForm.value.note).trim();

    this.ticketService.completeWork(this.selectedTicket.id, note).subscribe({
      next: () => {
        this.toast('success', 'Work marked as completed');
        this.showCompleteDialog = false;
        this.refreshAfterAction();
      },
      error: (e) => this.toast('error', e?.error?.message || 'Failed to mark completed')
    });
  }
  openResolveDialog(t: any) {
    this.selectedTicket = t;
    this.resolveForm.reset();
    this.showResolveDialog = true;

    this.metricsLoading = true;
    this.metricsError = '';
    this.metricsData = null;

    this.ticketService.getTicketMetrics(t.id).subscribe({
      next: (data) => {
        this.metricsData = data;
        this.metricsLoading = false;
      },
      error: (e) => {
        this.metricsError = e?.error?.message || 'Failed to load metrics';
        this.metricsLoading = false;
      }
    });
  }
  submitResolveTicket() {
    if (!this.selectedTicket?.id || this.resolveForm.invalid) return;

    const remarks = String(this.resolveForm.value.remarks).trim();

    this.ticketService.resolveTicketByHod(this.selectedTicket.id, remarks).subscribe({
      next: () => {
        this.toast('success', 'Ticket resolved by HOD');
        this.showResolveDialog = false;
        this.refreshAfterAction();
      },
      error: (e) => this.toast('error', e?.error?.message || 'Failed to resolve ticket')
    });
  }
}
