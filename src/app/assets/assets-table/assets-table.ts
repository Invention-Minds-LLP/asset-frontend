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
import { ChangeDetectorRef, OnInit } from '@angular/core';
import { AssetEditService } from '../../services/assets/assets-edit';
import { Router } from '@angular/router';
import { ModuleAccessService } from '../../services/module-access/module-access';
import { Skeleton } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';


type FilterField = 'assetName' | 'assetId' | 'assetType' | 'category' | 'allotted';

@Component({
  selector: 'app-assets-table',
  imports: [TableModule, ButtonModule, InputTextModule, DropdownModule,
     FormsModule, CommonModule, IconFieldModule, InputIconModule, Skeleton, TooltipModule],
  templateUrl: './assets-table.html',
  styleUrl: './assets-table.css'
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
  filteredActive:boolean = false;
  assets:any[] = [];
  assetsLoaded = false; 
  activeAssets: number = 0;
  isLoading: boolean = true; // Flag to track loading state

  constructor(
    private assetService: Assets,
    private cdr: ChangeDetectorRef,
    private assetEditService: AssetEditService,
    private router: Router,
    private moduleAccessService: ModuleAccessService
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
  get paginatedAssets() {
    const start = (this.currentPage - 1) * this.rowsPerPage;
    const end = start + this.rowsPerPage;
    return this.filteredAssets.slice(start, end);
  }

  get totalPages() {
    return Math.ceil(this.filteredAssets.length / this.rowsPerPage) || 1;
  }

  ngOnInit() {
    this.loadAccessPermissions();
    this.assetService.getAllAssets().subscribe((assets) => {
      setTimeout(() => {  // ✅ defer update after Angular’s first check
        this.assets = assets;
        this.isLoading = false; // 
        console.log(this.assets);
        const statusSummary = this.getAssetStatusSummary();
        this.activeAssets = statusSummary.active || 0;
        this.cdr.detectChanges();
        this.assetsLoaded = true;
      });
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
                this.canViewAsset   = items.has('view');
                this.canEditAsset   = items.has('edit');
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
        this.assets = this.assets.filter(a => a.assetId !== assetId);
        this.cdr.detectChanges();
      },
      error: () => alert('Failed to delete asset.')
    });
  }

  get filteredAssets() {
    if (!this.searchTerm) {
      return this.assets;
    }

    const term = this.searchTerm.toLowerCase();

    console.log(`Filtering assets by term: "${term}" on field: "${this.selectedFilter}"`);

    return this.assets.filter(asset => {
      const fieldValue = asset[this.selectedFilter]?.toString().toLowerCase() || '';
      return fieldValue.includes(term);
    });
  }
  refresh() {
    console.log("Refreshing data...");
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }
  filterOptions = [
    { label: 'Asset Name', value: 'assetName' },
    { label: 'Asset ID', value: 'assetId' },
    { label: 'Asset Type', value: 'assetType' }
  ];


  dropdownVisible = false;

  toggleFilterDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.dropdownVisible = !this.dropdownVisible;
  }

  applyFilter() {
    this.currentPage = 1;
  }

  selectFilter(value: any, event: MouseEvent) {
    event.stopPropagation();
    this.selectedFilter = value;
    this.dropdownVisible = false;
    this.filteredActive = true;
    console.log(this.dropdownVisible);
  }
  get isFilterActive(): boolean {
    return this.filteredActive;
  }
  clearFilter() {
    this.searchTerm = '';
    this.currentPage = 1;
    this.selectedFilter = 'assetName';
    this.filteredActive = false;
    console.log('Filter cleared.');
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
      const status = asset.status as keyof typeof summary;
      // summary[status]++;
      
      if (summary[status] !== undefined) {
        summary[status]++;
      }
    });
  
    return summary;
  }
  getStatusColor(status: string): string {
    const statusOfAsset = status.toLowerCase()
    switch (statusOfAsset) {
      case 'active': return 'green';
      case 'under repair': return 'orange';
      case 'warranty expiring Soon': return 'gold';
      case 'warranty expired': return 'red';
      case 'retired': return 'gray';
      case 'no Warranty': return 'lightgray';
      case 'pending_completion': return 'yellow';
      default: return 'transparent';
    }
  }
  getStatusLabel(status: string): string {
  if (!status) return 'Unknown';

  switch (status.toLowerCase()) {
    case 'active': return 'Active';
    case 'under repair': return 'Under Repair';
    case 'warranty expiring soon': return 'Warranty Expiring Soon';
    case 'warranty expired': return 'Warranty Expired';
    case 'retired': return 'Retired';
    case 'no warranty': return 'No Warranty';
    case 'pending_completion': return 'Pending Completion';
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
}
