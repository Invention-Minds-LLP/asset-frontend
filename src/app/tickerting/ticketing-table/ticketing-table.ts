import { Component } from '@angular/core';
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

type FilterField = 'id' | 'name' | 'ticketid' | 'raisedby' | 'department' | 'priority';

@Component({
  selector: 'app-ticketing-table',
  imports: [InputIcon,IconField,InputTextModule,FormsModule,TableModule, CommonModule,ButtonModule,FormsModule],
  templateUrl: './ticketing-table.html',
  styleUrl: './ticketing-table.css'
})
export class TicketingTable {

  currentPage = 1;
  rowsPerPage = 10;
  searchTerm: string = '';
  selectedFilter: FilterField = "id";
  filterActive: boolean = false;
  tickets:any[]=[]

  constructor(private ticketService : Ticketing, private router: Router, private cdr: ChangeDetectorRef) {}
    //search 
  get FilteredWarranty() {
  if (!this.searchTerm) {
    console.log('tickets', this.tickets)
    return this.tickets; 
  }

  const term = this.searchTerm.toLowerCase();

  return this.tickets.filter(item => {
    const value = item[this.selectedFilter]?.toString().toLowerCase() || '';
    return value.includes(term);
  });
}

ngOnInit(){
        this.ticketService.getAllTickets().subscribe({
        next: (response) => {
          this.tickets = response
          console.log('Ticket called successfully:', response);
        },
        error: (error) => {
          console.error('Error creating asset:', error);
        },
        complete: () => {
          console.log('Ticket fetching completed');
          this.cdr.detectChanges(); 
        }
      });
  
}

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

  get ticketingAssets(){
    const start = (this.currentPage - 1) * this.rowsPerPage;
    const end = start + this.rowsPerPage;
    return this.FilteredWarranty.slice(start, end)
  }

  get totalPages(){
    return Math.ceil(this.FilteredWarranty.length / this.rowsPerPage) || 1;
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
  viewWarranty(asset: any) {
    console.log('Navigating to edit asset:', asset);
    this.router.navigate(['/ticket/edit', asset]);
  }
}
