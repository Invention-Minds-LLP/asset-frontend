import { Component} from '@angular/core';
import { InputIcon } from 'primeng/inputicon';
import { IconField } from 'primeng/iconfield';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

type FilterField = 'id' | 'name' | 'wsd' | 'wed' | 'amcstart' | 'amcend';

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
  selectedFilter: FilterField = "name";
  filterActive: boolean = false;



  warranty = [
    {
      no:"01", id:"IM00012", name:"Sony 550 Camera", wsd:"12/06/2025", wed:"10/06/2028", amcstart:"12/06/2025", amcend:"10/06/2028", 
      status:"green" 
    },
    {
      no:"02", id:"IM02003", name:"I Phone 13 Pro", wsd:"12/06/2025", wed:"10/06/2028", amcstart:"12/06/2025", amcend:"10/06/2028", 
      status:"red" 
    },
    {
      no:"03", id:"IM02330", name:"Rolling Chair", wsd:"12/06/2025", wed:"10/06/2028", amcstart:"12/06/2025", amcend:"10/06/2028", 
      status:"green" 
    },
    {
      no:"04", id:"IM02243", name:"Sony 550 Camera", wsd:"12/06/2025", wed:"10/06/2028", amcstart:"12/06/2025", amcend:"10/06/2028", 
      status:"orange" 
    },
    {
      no:"05", id:"IM00012", name:"Dell 5500 Laptop", wsd:"12/06/2025", wed:"10/06/2028", amcstart:"12/06/2025", amcend:"10/06/2028", 
      status:"red" 
    },
    {
      no:"06", id:"IM02330", name:"Dell 5500 Laptop", wsd:"12/06/2025", wed:"10/06/2028", amcstart:"12/06/2025", amcend:"10/06/2028", 
      status:"yellow" 
    },
    {
      no:"07", id:"IM02243", name:"Sony 550 Camera", wsd:"12/06/2025", wed:"10/06/2028", amcstart:"12/06/2025", amcend:"10/06/2028", 
      status:"green" 
    },
    {
      no:"08", id:"IM00012", name:"Dell 5500 Laptop", wsd:"12/06/2025", wed:"10/06/2028", amcstart:"12/06/2025", amcend:"10/06/2028", 
      status:"green" 
    },
    {
      no:"09", id:"IM02330", name:"Sony 550 Camera", wsd:"12/06/2025", wed:"10/06/2028", amcstart:"12/06/2025", amcend:"10/06/2028", 
      status:"green" 
    },
    {
      no:"10", id:"IM02243", name:"Rolling Chair", wsd:"12/06/2025", wed:"10/06/2028", amcstart:"12/06/2025", amcend:"10/06/2028", 
      status:"red" 
    },
    {
      no:"11", id:"IM02330", name:"Sony 550 Camera", wsd:"12/06/2025", wed:"10/06/2028", amcstart:"12/06/2025", amcend:"10/06/2028", 
      status:"orange" 
    },
    {
      no:"12", id:"IM00012", name:"I Phone 13 Pro", wsd:"12/06/2025", wed:"10/06/2028", amcstart:"12/06/2025", amcend:"10/06/2028", 
      status:"green" 
    },
    {
      no:"13", id:"IM02243", name:"Dell 5500 Laptop", wsd:"12/06/2025", wed:"10/06/2028", amcstart:"12/06/2025", amcend:"10/06/2028", 
      status:"green" 
    },
  ]

  refresh() {
    console.log("Refreshing data...");
  }

  filterOption = [
    { label:"Asset ID", value :"id"},
    { label:"Asset Name", value :"name"}
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
  if (!this.searchTerm) {
    return this.warranty; 
  }

  const term = this.searchTerm.toLowerCase();

  return this.warranty.filter(item => {
    const value = item[this.selectedFilter]?.toString().toLowerCase() || '';
    return value.includes(term);
  });
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
    this.selectedFilter = 'name';
    this.filterActive = false;
    console.log('Filter cleared.');
  }
}
