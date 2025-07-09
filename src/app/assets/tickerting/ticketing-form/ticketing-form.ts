import { Component } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule, NgModel, NgForm } from '@angular/forms';
import { FloatLabel } from 'primeng/floatlabel';
import { Select } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { DragAndDrop } from "../../drag-and-drop/drag-and-drop";
import { CommonModule } from '@angular/common';
import { Ticketing } from '../../../services/tickerting/ticketing';
import { Assets } from '../../../services/assets/assets';
// import { DragAndDrop } from '../../drag-and-drop/drag-and-drop';
import { response } from 'express';
import { error } from 'console';
import { strict } from 'assert';





interface SelectOption {
    name: string;
    value: string;
}



@Component({
  selector: 'app-tickerting-form',
  imports: [FormsModule, InputTextModule, FloatLabel, Select, TextareaModule, ButtonModule,CommonModule],
  templateUrl: './ticketing-form.html',
  styleUrl: './ticketing-form.css'
})
export class TicketingForm {

  ticket = {
    ticketId:'',
    raisedBy:'',
    department:'',
    assetId:'',
    issueType:null as SelectOption | null,
    priority: null as SelectOption | null,
    detailedDesc:'',
    location:'',
    status : 'new',
    departmentId: null as number | null
  }

  employee:any ='';
  department: any[] = [];
  assets: any[] = [];
  departmentName: string = ''

  issueType: SelectOption[] = [
    {name:'Hardware', value:'hardware'},
    {name:'Software', value:'software'},
  ]



  priority: SelectOption[] = [
    {name:'Low', value:'low'},
    {name:'Medium', value:'medium'},
    {name:'High', value:'high'}
  ]

  constructor (private ticketservice : Ticketing, private assetService: Assets){}

 ngOnInit() {

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  console.log(user);
  this.employee = `${user.employeeID} - ${user.username}`
  console.log(this.employee)
  this.ticket.raisedBy = this.employee

  this.assetService.getAllAssets().subscribe(data => {
    this.assets = data.map(asset => ({
      ...asset,
      label: `${asset.assetId} - ${asset.assetName}`
    }));
    console.log(this.assets)
  });
  this.assetService.getDepartmentNameByEmployeeID(user.employeeID).subscribe({
      next: (data) => {
        this.departmentName = data.departmentName.name;
        this.ticket.department = this.departmentName
        this.ticket.departmentId = data.departmentName.id;
        console.log(this.departmentName)
      },
      error: (err) => {
        console.error('Failed to fetch department name', err);
        this.departmentName = 'Not found';
      },
    });
}


issueChange(){

  const selectedAsset = this.assets.find(asset => asset.id === this.ticket.assetId);
  console.log(selectedAsset)
  if (selectedAsset) {
    this.ticket.location = selectedAsset.currentLocation;
  } else {
    this.ticket.location = '';
  }

  console.log(this.ticket)
}

locationChange(event : string){
  console.log(this.ticket.location)
}



  
 onSubmit(form: NgForm) {
  if (form.valid) {
    console.log(this.ticket)
    const { department, ...payload} = this.ticket
    this.ticketservice.createTicket(payload).subscribe({
      next: (response: any) => {
        console.log('Ticket submitted:', response);
        alert('TicketDetails saved successfully');
        form.resetForm();
      },
      error: (err: any) => {
        console.error('Error submitting ticket:', err);
        alert('Something went wrong while saving the ticket');
      }
    });
  } else {
    console.error('Form is invalid');
  }
}

 invaild(control:NgModel){
    return control.invalid && (control.dirty || control.touched);
 }

 showError(control: NgModel){
    return this.invaild(control);
 }

 onClear(){
  this.ticket ={
    ticketId:'',
    raisedBy:'',
    department:'',
    assetId:'',
    issueType:null,
    priority: null,
    detailedDesc:'',
    location:'',
    status:'new',
    departmentId:null
  }
 }
   selectedReportFiles: File[] = [];

   onFilesSelected(files: File[]) {
      this.selectedReportFiles = files;
      console.log('Selected files:', files);
      // this.form.patchValue({ reportFile: files[0] }); // If you want to bind the first file
   }
}
