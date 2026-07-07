import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { Assets } from '../../services/assets/assets';
import { Branches } from '../../services/branches/branches';
import { BranchFeatures } from '../../services/branch-features/branch-features';
import { ChangeDetectorRef, OnInit } from '@angular/core';
import { AssetEditService } from '../../services/assets/assets-edit';
import { Router } from '@angular/router';
import { ModuleAccessService } from '../../services/module-access/module-access';
import { Skeleton } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { OverflowTooltipDirective } from '../../shared/directives/overflow-tooltip.directive';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';


type FilterField = string;

@Component({
  selector: 'app-assets-table',
  imports: [TableModule, ButtonModule, InputTextModule, DropdownModule,
    FormsModule, CommonModule, IconFieldModule, InputIconModule, Skeleton, TooltipModule,
    DialogModule, SelectModule, TextareaModule, TagModule, ToastModule, OverflowTooltipDirective],
  templateUrl: './assets-table.html',
  styleUrl: './assets-table.css',
  providers: [MessageService]
})

export class AssetsTable implements OnInit {
  darkMode = false;

  // Permission flags — driven by getMyAccess → assets module sub-items
  canViewAsset = true;    // default open; hidden if 'view' explicitly denied
  canEditAsset = false;
  canDeleteAsset = false;
  currentPage = 1;
  rowsPerPage = 10;
  selectedFilter: FilterField = 'assetName';
  searchTerm: string = '';
  filteredActive: boolean = false;
  assets: any[] = [];          // current page rows (server-paginated)
  assetsLoaded = false;
  activeAssets: number = 0;
  totalRecords = 0;            // total matching rows reported by the server
  isLoading: boolean = true; // Flag to track loading state
  refreshing = false;
  private searchInput$ = new Subject<string>();

  // Branch filter — scopes the table to assets currently located in a branch
  branchOptions: { id: number; name: string }[] = [];
  selectedBranchId: number | null = null;

  // HOD Approval
  showHodApprovalDialog = false;
  selectedHodAsset: any = null;
  hodDecision = 'APPROVED';
  hodRemarks = '';
  hodDecisionOptions = [
    { label: 'Approve', value: 'APPROVED' },
    { label: 'Reject', value: 'REJECTED' }
  ];

  branchFeatures = true; // tenant switch — hides branch filter/column when false

  constructor(
    private assetService: Assets,
    private branchService: Branches,
    private branchFeaturesSvc: BranchFeatures,
    private cdr: ChangeDetectorRef,
    private assetEditService: AssetEditService,
    private router: Router,
    private moduleAccessService: ModuleAccessService,
    private messageService: MessageService
  ) { }

  @ViewChild('filterContainer') filterContainerRef!: ElementRef;
  @ViewChild('dt') dt!: Table;
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const targetElement = event.target as HTMLElement;
    if (
      !targetElement.closest('.filter') ||
      !targetElement.closest('.filter-menu')
    ) {
      this.dropdownVisible = false;
      console.log("Clicked outside the filter dropdown, closing it.");
    }
  }
  // Server already returns just this page; no client-side slicing.
  get paginatedAssets() {
    return this.assets;
  }

  get totalPages() {
    return Math.ceil(this.totalRecords / this.rowsPerPage) || 1;
  }

  ngOnInit() {
    this.loadAccessPermissions();
    this.branchFeaturesSvc.isEnabled().then((v) => {
      this.branchFeatures = v;
      this.cdr.detectChanges();
      if (!v) return; // tenant switch off — no branch dropdown to populate
      this.branchService.getBranches().subscribe({
        next: (branches) => {
          setTimeout(() => {
            this.branchOptions = (branches || []).filter((b: any) => b.isActive !== false);
            this.cdr.detectChanges();
          });
        },
        error: () => { /* branch filter simply stays empty */ }
      });
    });
    // Debounced search → reset to page 1 and reload from server.
    this.searchInput$.pipe(debounceTime(350), distinctUntilChanged()).subscribe(() => {
      this.currentPage = 1;
      this.loadPage();
    });
    this.loadPage();
  }

  onBranchChange() {
    this.currentPage = 1;
    this.loadPage();
  }

  loadPage() {
    this.isLoading = true;
    this.assetService.getAssetsPaginated({
      page: this.currentPage,
      limit: this.rowsPerPage,
      search: this.searchTerm || '',
      filterField: this.selectedFilter,
      branchId: this.selectedBranchId,
    }).subscribe({
      next: (res) => {
        setTimeout(() => {  // ✅ defer update after Angular's change detection
          this.assets = res.data || [];
          this.totalRecords = res.total || 0;
          this.activeAssets = res.activeCount || 0;
          this.isLoading = false;
          this.assetsLoaded = true;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      },
    });
  }

  private loadAccessPermissions() {
    this.moduleAccessService.getMyAccess().subscribe({
      next: (result) => {
        setTimeout(() => {
          if (result.isAdmin) {
            this.canViewAsset = true;
            this.canEditAsset = true;
            this.canDeleteAsset = true;
          } else {
            const assetsMod = result.modules?.find((m: any) => m.name === 'assets');
            if (!assetsMod) {
              this.canEditAsset = false;
              this.canDeleteAsset = false;
            } else {
              const items = new Set((assetsMod.subItems || []).map((s: any) => s.name as string));
              if (items.size === 0) {
                this.canViewAsset = true;
                this.canEditAsset = true;
                this.canDeleteAsset = true;
              } else {
                this.canViewAsset = items.has('view');
                this.canEditAsset = items.has('edit');
                this.canDeleteAsset = items.has('delete');
              }
            }
          }
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.canViewAsset = true;
          this.canEditAsset = true;
          this.cdr.detectChanges();
        });
      }
    });
  }

  deleteAsset(assetId: string) {
    if (!confirm('Delete this asset? This action cannot be undone.')) return;
    this.assetService.deleteAsset(Number(assetId)).subscribe({
      next: () => {
        this.loadPage(); // refill the current page from the server
      },
      error: () => alert('Failed to delete asset.')
    });
  }

  // Search/pagination are now server-side; the current page IS the data set.
  get filteredAssets() {
    return this.assets;
  }
  refresh() {
    this.refreshing = true;
    this.loadPage();
    this.refreshing = false;
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadPage();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadPage();
    }
  }
  filterOptions = [
    { label: 'Asset Name', value: 'assetName' },
    { label: 'Asset ID', value: 'assetId' },
    { label: 'Asset Type', value: 'assetType' },
    { label: 'Asset Category', value: 'categoryName' },
    // Text fields
    { label: 'Serial Number', value: 'serialNumber' },
    { label: 'Reference Code', value: 'referenceCode' },
    { label: 'Stores Ref ID', value: 'storeAssetId' },
    { label: 'Manufacturer', value: 'manufacturer' },
    { label: 'Invoice Number', value: 'invoiceNumber' },
    { label: 'Purchase Order No', value: 'purchaseOrderNo' },
    { label: 'Current Location', value: 'currentLocation' },
    // Related entities
    { label: 'Department', value: 'department' },
    { label: 'Vendor', value: 'vendor' },
    { label: 'Allotted To', value: 'allottedTo' },
    { label: 'Supervisor', value: 'supervisor' },
    { label: 'Current Store', value: 'currentStore' },
    // Fixed-value fields (type the value, e.g. "ACTIVE", "PURCHASE", "TANGIBLE")
    { label: 'Status', value: 'status' },
    { label: 'Mode of Procurement', value: 'modeOfProcurement' },
    { label: 'Asset Nature', value: 'assetNature' },
    { label: 'Physical Condition', value: 'physicalCondition' },
    { label: 'Working Condition', value: 'workingCondition' },
    { label: 'Warranty Status', value: 'warrantyStatus' },
    { label: 'Disposal Method', value: 'disposalMethod' },
  ]


  dropdownVisible = false;

  toggleFilterDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.dropdownVisible = !this.dropdownVisible;
  }

  applyFilter() {
    // Debounced server fetch (handler resets to page 1).
    this.searchInput$.next(this.searchTerm);
  }

  selectFilter(value: any, event: MouseEvent) {
    event.stopPropagation();
    this.selectedFilter = value;
    this.dropdownVisible = false;
    this.filteredActive = true;
    // Re-query immediately if a search term is active for the new field.
    if (this.searchTerm) {
      this.currentPage = 1;
      this.loadPage();
    }
  }
  get isFilterActive(): boolean {
    return this.filteredActive;
  }
  clearFilter() {
    this.searchTerm = '';
    this.currentPage = 1;
    this.selectedFilter = 'assetName';
    this.filteredActive = false;
    this.loadPage();
  }

  viewAsset(asset: any) {
    console.log('Navigating to edit asset:', asset);
    this.router.navigate(['/assets/edit', asset]);
  }
  getAssetStatusSummary() {
    const summary = {
      'active': 0,
      'under Repair': 0,
      'warranty Expiring Soon': 0,
      'warranty Expired': 0,
      'retired': 0,
      'no Warranty': 0,
      'unknown': 0
    };

    this.assets.forEach(asset => {
      // Status values are stored uppercase (e.g. 'ACTIVE', 'UNDER_REPAIR'),
      // but the summary buckets are lowercase — normalise before matching.
      const raw = String(asset.status || '').toLowerCase().replace(/_/g, ' ');
      if (raw === 'active') summary.active++;
      else if (raw === 'under repair') summary['under Repair']++;
      else if (raw === 'retired' || raw === 'disposed') summary.retired++;
      else summary.unknown++;
    });

    return summary;
  }
  getStatusColor(status: string): string {
    const statusOfAsset = status.toLowerCase()
    switch (statusOfAsset) {
      case 'active': return 'green';
      // case 'under repair': return 'orange';
      case 'under_observation': return 'orange';
      case 'warranty expiring Soon': return 'gold';
      case 'warranty expired': return 'red';
      // case 'retired': return 'gray';
      case 'disposed': return 'gray';
      case 'no Warranty': return 'lightgray';
      case 'pending_completion': return 'yellow';
      case 'in_store' : return 'lightblue';
      case 'rejected': return 'lightpink';
      default: return 'transparent';
    }
  }
  getStatusLabel(status: string): string {
    if (!status) return 'Unknown';

    switch (status.toLowerCase()) {
      case 'active': return 'Active';
      // case 'under repair': return 'Under Repair';
      case 'under_observation': return 'UNDER_OBSERVATION';
      case 'warranty expiring soon': return 'Warranty Expiring Soon';
      case 'warranty expired': return 'Warranty Expired';
      // case 'retired': return 'Retired';
      case 'disposed': return 'Disposed';
      case 'no warranty': return 'No Warranty';
      case 'pending_completion': return 'Pending Completion';
      case 'in_store': return 'IN_STORE';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  }
  cols = [
    { field: 'assetId', header: 'Asset ID' },
    { field: 'referenceCode', header: 'Reference Code' },
    { field: 'assetName', header: 'Asset Name' },
    { field: 'assetType', header: 'Asset Type' },
    { field: 'departmentName', header: 'Department' },
    { field: 'assetCategoryName', header: 'Asset Category' },
    { field: 'allottedToName', header: 'Allotted To' }
  ];

  get exportAssets() {
    return this.filteredAssets.map(asset => ({
      assetId: asset.assetId,
      referenceCode: asset.referenceCode || '-',
      assetName: asset.assetName || '-',
      assetType: asset.assetType || '-',
      departmentName: asset.department?.name || '-',
      assetCategoryName: asset.assetCategory?.name || '-',
      allottedToName: asset.allottedTo?.name || 'Not Allotted'
    }));
  }

  openHodApproval(asset: any) {
    this.selectedHodAsset = asset;
    this.hodDecision = 'APPROVED';
    this.hodRemarks = '';
    this.showHodApprovalDialog = true;
  }

  submitHodApproval() {
    if (!this.selectedHodAsset) return;
    this.assetService.hodApproveAsset(this.selectedHodAsset.id, {
      decision: this.hodDecision,
      remarks: this.hodRemarks || undefined
    }).subscribe({
      next: () => {
        setTimeout(() => {
          this.messageService.add({ severity: 'success', summary: 'Done', detail: `Asset ${this.hodDecision.toLowerCase()} by HOD` });
          this.showHodApprovalDialog = false;
          this.selectedHodAsset = null;
          this.loadPage();
          this.cdr.detectChanges();
        });
      },
      error: (e: any) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: e?.error?.message || 'Failed' });
      }
    });
  }
  exportCSV() {
    console.log("clicked");
    this.assetService.exportCsv().subscribe({
      next: (blob) => { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'assets.csv'; a.click(); URL.revokeObjectURL(url); },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Export failed' })
    });
  }
}
