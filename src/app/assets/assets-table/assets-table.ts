import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

type FilterField = 'name' | 'id' | 'type' | 'category' | 'allotted';

@Component({
  selector: 'app-assets-table',
  imports: [TableModule, ButtonModule, InputTextModule, DropdownModule, FormsModule, CommonModule, IconFieldModule, InputIconModule],
  templateUrl: './assets-table.html',
  styleUrl: './assets-table.css'
})

export class AssetsTable {
  darkMode = false;
  currentPage = 1;
  rowsPerPage = 10;
  selectedFilter: FilterField = 'name';
  searchTerm: string = '';
  filteredActive:boolean = false;

  constructor(private elementRef: ElementRef) { }
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

  assets = [
    {
      no: '01', id: 'IM0012', name: 'Sony 550 Camera', type: 'Movable', category: 'Electronic',
      allotted: 'IM007 - Nithish M.K', photo: 'camera.png', status: 'green'
    },
    {
      no: '01', id: 'IM0012', name: 'Sony 550 Camera', type: 'Fixed', category: 'Electronic',
      allotted: 'IM007 - Nithish M.K', photo: 'camera.png', status: 'green'
    }, {
      no: '01', id: 'IM0012', name: 'Sony 550 Camera', type: 'Movable', category: 'Electronic',
      allotted: 'IM007 - Nithish M.K', photo: 'camera.png', status: 'green'
    },
    {
      no: '01', id: 'IM0012', name: 'Sony 550 Camera', type: 'Movable', category: 'Electronic',
      allotted: 'IM007 - Nithish M.K', photo: 'camera.png', status: 'green'
    },
    {
      no: '01', id: 'IM0012', name: 'Panasonic 550', type: 'Fixed', category: 'Electronic',
      allotted: 'IM007 - Nithish M.K', photo: 'camera.png', status: 'green'
    },
    {
      no: '01', id: 'IM0012', name: 'Sony 550 Camera', type: 'Movable', category: 'Electronic',
      allotted: 'IM007 - Nithish M.K', photo: 'camera.png', status: 'green'
    },
    {
      no: '01', id: 'IM0012', name: 'Sony 550 Camera', type: 'Movable', category: 'Electronic',
      allotted: 'IM007 - Nithish M.K', photo: 'camera.png', status: 'green'
    },
    {
      no: '01', id: 'IM0012', name: 'Sony 550 Camera', type: 'Movable', category: 'Electronic',
      allotted: 'IM007 - Nithish M.K', photo: 'camera.png', status: 'green'
    },
    {
      no: '01', id: 'IM0012', name: 'Sony 550 Camera', type: 'Movable', category: 'Electronic',
      allotted: 'IM007 - Nithish M.K', photo: 'camera.png', status: 'green'
    },
    {
      no: '01', id: 'IM0012', name: 'Sony 550 Camera', type: 'Movable', category: 'Electronic',
      allotted: 'IM007 - Nithish M.K', photo: 'camera.png', status: 'green'
    },
    {
      no: '01', id: 'IM0012', name: 'Sony 550 Camera', type: 'Movable', category: 'Electronic',
      allotted: 'IM007 - Nithish M.K', photo: 'camera.png', status: 'green'
    },
    {
      no: '01', id: 'IM0012', name: 'Sony 550 Camera', type: 'Movable', category: 'Electronic',
      allotted: 'IM007 - Nithish M.K', photo: 'camera.png', status: 'green'
    },
    {
      no: '01', id: 'IM0012', name: 'Sony 550 Camera', type: 'Movable', category: 'Electronic',
      allotted: 'IM007 - Nithish M.K', photo: 'camera.png', status: 'green'
    },
    {
      no: '01', id: 'IM0012', name: 'Sony 550 Camera', type: 'Movable', category: 'Electronic',
      allotted: 'IM007 - Nithish M.K', photo: 'camera.png', status: 'green'
    },
    // ... more data
  ];

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
    { label: 'Asset Name', value: 'name' },
    { label: 'Asset ID', value: 'id' },
    { label: 'Asset Type', value: 'type' }
  ];


  dropdownVisible = false;

  toggleFilterDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.dropdownVisible = !this.dropdownVisible;
  }

  get filteredAssets() {
    if (!this.searchTerm) {
      return this.assets;
    }

    const term = this.searchTerm.toLowerCase();

    return this.assets.filter(asset => {
      const fieldValue = asset[this.selectedFilter]?.toString().toLowerCase() || '';
      return fieldValue.includes(term);
    });
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
    this.selectedFilter = 'name';
    this.filteredActive = false;
    console.log('Filter cleared.');
  }
    
}
