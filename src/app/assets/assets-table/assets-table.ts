import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { Assets } from '../../services/assets/assets';
import { ChangeDetectorRef } from '@angular/core';
import { AssetEditService } from '../../services/assets/assets-edit';
import { Router } from '@angular/router';
import { Skeleton } from 'primeng/skeleton';


type FilterField = 'assetName' | 'assetId' | 'assetType' | 'category' | 'allotted';

@Component({
  selector: 'app-assets-table',
  imports: [TableModule, ButtonModule, InputTextModule, DropdownModule, FormsModule, CommonModule, IconFieldModule, InputIconModule, Skeleton],
  templateUrl: './assets-table.html',
  styleUrl: './assets-table.css'
})

export class AssetsTable {
  darkMode = false;
  currentPage = 1;
  rowsPerPage = 10;
  selectedFilter: FilterField = 'assetName';
  searchTerm: string = '';
  filteredActive:boolean = false;
  assets:any[] = [];
  assetsLoaded = false; 
  activeAssets: number = 0;
  isLoading: boolean = true; // Flag to track loading state

  constructor(private assetService: Assets, private cdr: ChangeDetectorRef, private assetEditService: AssetEditService, private router: Router) { }

  @ViewChild('filterContainer') filterContainerRef!: ElementRef;
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
    switch (status) {
      case 'active': return 'green';
      case 'under Repair': return 'orange';
      case 'warranty Expiring Soon': return 'gold';
      case 'warranty Expired': return 'red';
      case 'retired': return 'gray';
      case 'no Warranty': return 'lightgray';
      case 'PENDING_COMPLETION': return 'yellow';
      default: return 'transparent';
    }
  }
  
}
