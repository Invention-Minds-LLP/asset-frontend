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
import { COLUMN_CATALOG, CATALOG_BY_KEY, MANDATORY_KEYS, readPath, resolveColumns, ColumnDef } from './asset-columns.catalog';


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

  // ── Department-configurable columns ────────────────────────────────────────
  displayColumns: ColumnDef[] = [];        // resolved columns rendered in the table
  private role = (typeof window !== 'undefined' && localStorage.getItem('role') || '').toUpperCase();
  private myDeptId = (typeof window !== 'undefined' && Number(localStorage.getItem('departmentId'))) || null;
  get canConfigureColumns(): boolean {
    return this.role === 'HOD' || ['ADMIN', 'CEO_COO', 'OPERATIONS', 'FINANCE', 'CFO'].includes(this.role);
  }
  get isColAdmin(): boolean { return this.role !== 'HOD' && this.canConfigureColumns; }

  // Column-picker dialog state
  showColumnDialog = false;
  savingColumns = false;
  colConfigDeptId: number | null = null;   // admin picks a department
  departments: any[] = [];
  pickSelected: ColumnDef[] = [];

  // Cell value for a non-photo column (handles nested paths, dates, currency).
  getCell(asset: any, col: ColumnDef): string {
    const v = readPath(asset, col.path);
    if (v === null || v === undefined || v === '') return col.fallback ?? '';
    if (col.type === 'date') { const d = new Date(v); return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString(); }
    if (col.type === 'currency') { const n = Number(v); return isNaN(n) ? String(v) : n.toLocaleString(); }
    return String(v);
  }

  private readonly DEFAULT_KEYS = [
    'assetId', 'storeAssetId', 'referenceCode', 'assetName', 'assetType',
    'departmentName', 'assetCategoryName', 'allottedToName', 'assetPhoto',
  ];

  // Load the effective columns for the current user's department.
  loadColumns() {
    this.assetService.getMyColumns().subscribe({
      next: (res) => {
        setTimeout(() => {
          this.displayColumns = resolveColumns(res?.columns || this.DEFAULT_KEYS, this.branchFeatures);
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.displayColumns = resolveColumns(this.DEFAULT_KEYS, this.branchFeatures);
          this.cdr.detectChanges();
        });
      },
    });
  }

  // All catalog columns offered in the picker (branch column hidden when off).
  private availableCatalog(): ColumnDef[] {
    return COLUMN_CATALOG.filter((c) => !c.branchGated || this.branchFeatures);
  }

  openColumnConfig() {
    const deptId = this.isColAdmin ? (this.colConfigDeptId || this.myDeptId) : this.myDeptId;
    this.colConfigDeptId = deptId;
    if (this.isColAdmin && !this.departments.length) {
      this.assetService.getDepartments().subscribe({
        next: (d: any) => { setTimeout(() => { this.departments = d || []; this.cdr.detectChanges(); }); },
      });
    }
    this.loadPickerForDept(deptId);
    this.showColumnDialog = true;
  }

  onColConfigDeptChange() { this.loadPickerForDept(this.colConfigDeptId); }

  private loadPickerForDept(deptId: number | null) {
    if (!deptId) { this.pickSelected = []; this.cdr.detectChanges(); return; }
    this.assetService.getDeptColumns(deptId).subscribe({
      next: (res) => {
        setTimeout(() => {
          const keys: string[] = res?.columns || this.DEFAULT_KEYS;
          this.pickSelected = keys.map((k) => CATALOG_BY_KEY[k]).filter(Boolean);
          this.cdr.detectChanges();
        });
      },
    });
  }

  isMandatory(col: ColumnDef): boolean { return MANDATORY_KEYS.includes(col.key); }

  // All columns from the catalog appear in the "Add column" dropdown (already-
  // selected ones are marked; picking one that's already added is a no-op).
  get addableColumns(): { key: string; label: string; disabled: boolean }[] {
    const chosen = new Set(this.pickSelected.map((c) => c.key));
    return this.availableCatalog().map((c) => ({
      key: c.key,
      label: chosen.has(c.key) ? `${c.label} (added)` : c.label,
      disabled: chosen.has(c.key),
    }));
  }

  addColumn(key: string) {
    const col = CATALOG_BY_KEY[key];
    if (col && !this.pickSelected.some((c) => c.key === key)) this.pickSelected = [...this.pickSelected, col];
  }
  removeColumn(i: number) {
    if (this.isMandatory(this.pickSelected[i])) return; // can't remove mandatory
    this.pickSelected = this.pickSelected.filter((_, idx) => idx !== i);
  }
  moveColumn(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= this.pickSelected.length) return;
    const arr = [...this.pickSelected];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    this.pickSelected = arr;
  }

  saveColumns() {
    const deptId = this.colConfigDeptId;
    if (!deptId) { this.messageService.add({ severity: 'warn', summary: 'Select department', detail: 'Choose a department first' }); return; }
    const keys = this.pickSelected.map((c) => c.key);
    this.savingColumns = true;
    this.assetService.setDeptColumns(deptId, keys).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.savingColumns = false;
          this.showColumnDialog = false;
          this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Columns updated' });
          // Editing our own department → apply to the live table immediately.
          if (Number(deptId) === Number(this.myDeptId)) {
            this.displayColumns = resolveColumns(res?.columns || keys, this.branchFeatures);
          }
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        setTimeout(() => { this.savingColumns = false; this.cdr.detectChanges(); });
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to save columns' });
      },
    });
  }

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
    }
    // Close an open column-header filter popup when clicking elsewhere
    // (the popup and funnel icon stop propagation, so their clicks don't reach here).
    if (!targetElement.closest('.col-filter-pop') && !targetElement.closest('.th-filter-icon')) {
      this.openFilterKey = null;
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
      this.loadColumns(); // depends on branchFeatures for the branch-gated column
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
      filters: this.columnFilters,
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
    { label: 'Model', value: 'modelNumber' },
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

  // ── Per-column header filters (funnel icons, like the PM/Calibration tables) ──
  // Server-side: each entry is { backendFilterField → text }, AND-combined and sent
  // to /assets/paginated as `filters`. Only columns with a ColumnDef.filterField
  // show a funnel.
  columnFilters: Record<string, string> = {};
  openFilterKey: string | null = null;   // which column's filter popup is open
  columnFilterDraft = '';                // text being typed in the open popup

  toggleColumnFilter(field: string, ev: Event) {
    ev.stopPropagation();
    if (this.openFilterKey === field) { this.openFilterKey = null; return; }
    this.openFilterKey = field;
    this.columnFilterDraft = this.columnFilters[field] || '';
  }

  applyColumnFilter(field: string) {
    const v = (this.columnFilterDraft || '').trim();
    if (v) this.columnFilters[field] = v; else delete this.columnFilters[field];
    this.openFilterKey = null;
    this.currentPage = 1;
    this.loadPage();
  }

  clearColumnFilter(field: string) {
    delete this.columnFilters[field];
    this.columnFilterDraft = '';
    this.openFilterKey = null;
    this.currentPage = 1;
    this.loadPage();
  }

  get hasColumnFilters(): boolean { return Object.keys(this.columnFilters).length > 0; }


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
    this.columnFilters = {};
    this.openFilterKey = null;
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
  // Export matches the on-screen (department-configured) columns.
  get exportAssets() {
    return this.filteredAssets.map((asset) => {
      const row: any = {};
      for (const col of this.displayColumns) {
        row[col.label] = col.type === 'photo'
          ? (readPath(asset, col.path) ? 'Yes' : '-')
          : this.getCell(asset, col);
      }
      return row;
    });
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
