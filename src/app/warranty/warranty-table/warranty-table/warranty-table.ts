import { Component} from '@angular/core';
import { InputIcon } from 'primeng/inputicon';
import { IconField } from 'primeng/iconfield';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Warranty } from '../../../services/warranty/warranty';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
type FilterField = 'assetId' | 'assetName' | 'wsd' | 'wed' | 'amcstart' | 'amcend';

@Component({
  selector: 'app-warranty-table',
  imports: [InputIcon, IconField, InputTextModule, FormsModule,TableModule, CommonModule,ButtonModule,FormsModule],
  templateUrl: './warranty-table.html',
  styleUrl: './warranty-table.css'
})
export class WarrantyTable {
  currentPage = 1;
  rowsPerPage = 10;
  searchTerm: string = '';
  selectedFilter: FilterField = "assetName";
  filterActive: boolean = false;
  warranty: any[] = [];
  warrantyStatus: string = '';
  activeWarranties: number = 0;

  constructor( private warrantyService: Warranty, private router: Router, private cdr: ChangeDetectorRef) { 
  }


  ngOnInit() {
    this.warrantyService.getAllWarranties().subscribe({
      next: (response) => {
        this.warranty = response;
        const statusSummary = this.getWarrantyStatusSummary();
        this.activeWarranties = statusSummary.active;
        this.cdr.detectChanges(); // Ensure the view is updated after data load
        console.log('Warranties loaded:', this.warranty);
      },
      error: (error) => {
        console.error('Error loading warranties:', error);
      }
    });

  }

  refresh() {
    console.log("Refreshing data...");
  }

  filterOption = [
    { label:"Asset ID", value :"assetId"},
    { label:"Asset Name", value :"assetName"}
  ]

  prevPage(){
    if(this.currentPage > 1){
      this.currentPage--
    }
  }

  nextPage(){
    if(this.currentPage < this.totalPages){
      this.currentPage++
    }
  }

  get warrantyAssets(){
    const start = (this.currentPage - 1) * this.rowsPerPage;
    const end = start + this.rowsPerPage;
    return this.FilteredWarranty.slice(start, end)
  }

  get totalPages(){
    return Math.ceil(this.FilteredWarranty.length / this.rowsPerPage) || 1;
  }

  //search 
  get FilteredWarranty() {
    const term = this.searchTerm?.toLowerCase() || '';
  
    return this.warranty
      .filter(item => {
        if (!term) return true;
  
        let value = '';
  
        // Handle known filters manually
        switch (this.selectedFilter) {
          case 'assetId':
            value = item.asset?.assetId?.toLowerCase() || '';
            break;
          case 'assetName':
            value = item.asset?.assetName?.toLowerCase() || '';
            break;
          default:
            value = '';
        }
  
        return value.includes(term);
      });
  }
  
 getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

applyFilter(){
  this.currentPage = 1;
}


  dropdownVisible = false;

  toggleFilterDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.dropdownVisible = !this.dropdownVisible;
  }

  selectFilter(value : any , event: MouseEvent){
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
    this.router.navigate(['/warranty/edit', asset]);
  }
  getWarrantyStatus(warranty: any): string {
    if (!warranty.isUnderWarranty || !warranty.warrantyEnd) return 'gray';
  
    const end = new Date(warranty.warrantyEnd);
    const today = new Date();
    const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
    if (diffDays < 0) return 'red';              // Expired
    if (diffDays <= 15) return 'orange';         // Expiring Soon
    return 'green';                              // Active
  }
  getWarrantyStatusSummary() {
    const summary = {
      active: 0,
      expiringSoon: 0,
      expired: 0,
      noWarranty: 0,
      unknown: 0
    };
  
    this.warranty.forEach(w => {
      const color = this.getWarrantyStatus(w);
  
      switch (color) {
        case 'green':
          summary.active++;
          break;
        case 'orange':
          summary.expiringSoon++;
          break;
        case 'red':
          summary.expired++;
          break;
        case 'gray':
          summary.noWarranty++;
          break;
        default:
          summary.unknown++;
          break;
      }
    });
  
    return summary;
  }
  


}
