import { Component } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule, NgModel, NgForm } from '@angular/forms';
import { FloatLabel } from 'primeng/floatlabel';
import { Select } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { DragAndDrop } from "../../drag-and-drop/drag-and-drop";
import { CommonModule } from '@angular/common';
import { Ticketing } from '../../services/tickerting/ticketing';
import { Assets } from '../../services/assets/assets';
import { ActivatedRoute } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';





interface SelectOption {
    name: string;
    value: string;
}



@Component({
  selector: 'app-tickerting-form',
  imports: [FormsModule, InputTextModule, FloatLabel, Select, TextareaModule, ButtonModule,CommonModule, DragAndDrop],
  templateUrl: './ticketing-form.html',
  styleUrl: './ticketing-form.css'
})
export class TicketingForm {

  ticket: any = {
    ticketId:'',
    raisedBy:'',
    department:'',
    assetId:'',
    issueType:null as SelectOption | null,
    priority: null as SelectOption | null,
    detailedDesc:'',
    location:'',
    status : 'new',
    departmentId: null as number | null,
    id: null as number | null ,
    asset:null as any[] | null,
    photoOfIssue: '',
    updatedBy: null as string | null,
  }

  employee:any ='';
  department: any[] = [];
  assets: any[] = [];
  departmentName: string = '';
  isEditMode: boolean = false;
  ticketImage: any;
  oldTicket:any = null;

  issueType: SelectOption[] = [
    {name:'Hardware', value:'hardware'},
    {name:'Software', value:'software'},
  ]



  priority: SelectOption[] = [
    {name:'Low', value:'low'},
    {name:'Medium', value:'medium'},
    {name:'High', value:'high'}
  ]

  status: { name: string; value: string }[] = [
    { name: 'Open', value: 'open' },
    { name: 'Acknowledged', value: 'acknowledged' },
    { name: 'Assigned', value: 'assigned' },
    { name: 'Under Repair', value: 'under_repair' },
    { name: 'Resolved', value: 'resolved' },
    { name: 'Closed', value: 'closed' },
  ];

  statusOrder: string[] = [
    'open',
    'acknowledged',
    'assigned',
    'under_repair',
    'resolved',
    'closed'
  ];
  
  

  constructor (private ticketService : Ticketing, private assetService: Assets, private route: ActivatedRoute, private cdr: ChangeDetectorRef){}

 ngOnInit() {
  const ticketId = this.route.snapshot.paramMap.get('id');
  if (ticketId) {
    this.ticketService.getTicketById(ticketId).subscribe({
      next: (data) => {
        this.ticket = { ...data };
        this.oldTicket = { ...data }; 
        this.ticket.assetId = data.asset.id; 
        this.assets = [
          {
            ...data.asset,
            label: `${data.asset.assetId} - ${data.asset.assetName}`,
          }
        ];
        this.ticket.issueType = data.issueType
        this.ticket.priority = data.priority
        this.ticket.department = data.department.name;
        this.ticket.departmentId = data.department.id;
        this.ticket.raisedBy = `${data.raisedBy}`;
        this.ticket.location = data.location;
        this.ticket.photoOfIssue = data.photoOfIssue || ''; // Handle optional image field
        console.log('Ticket fetched successfully:', this.ticket);
        console.log('Ticket data:', this.ticket);
      },
      error: (err) => {
        console.error('Failed to fetch ticket data', err);
      },
      complete: () => {
        this.cdr.detectChanges();
        console.log('Ticket fetching completed successfully');
      }

    });
     console.log('Edit mode detected for asset:', ticketId);
     this.isEditMode = true;
  } else {
     console.log('New ticket mode');
     if (typeof window !== 'undefined' && localStorage) {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      console.log(user);
      this.employee = `${user.employeeID} - ${user.username}`
      console.log(this.employee)
      this.ticket.raisedBy = this.employee
 
      this.assetService.getDepartmentNameByEmployeeID(user.employeeID).subscribe({
       next: (data) => {
         this.departmentName = data.departmentName.name;
         this.ticket.department = this.departmentName
         this.ticket.departmentId = data.departmentName.id;
         console.log(this.ticket.department)
       },
       error: (err) => {
         console.error('Failed to fetch department name', err);
         this.departmentName = 'Not found';
       },
     });
    
      this.assetService.getAllAssets().subscribe(data => {
        this.assets = data.map(asset => ({
          ...asset,
          label: `${asset.assetId} - ${asset.assetName}`
        }));
        console.log(this.assets)
      });
     }
  }

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
    if(this.isEditMode){
      if (typeof window !== 'undefined' && localStorage) {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        console.log(user);
        this.ticket.updatedBy = `${user.employeeID} - ${user.username}`;
      }
      if(this.ticket.id){
        const { id, department,asset,departmentId,assetId, ...rest } = this.ticket;
        this.ticketService.updateTicket(id, rest).subscribe({
          next: (response: any) => {
            console.log('Ticket updated:', response);
            alert('TicketDetails updated successfully');
            form.resetForm();
          },
          error: (err: any) => {
            console.error('Error updating ticket:', err);
            alert('Something went wrong while updating the ticket');
          }
        });
      }
    }
    else{
      const { id,asset,department, ...payload} = this.ticket
      this.ticketService.createTicket(payload).subscribe({
        next: (response: any) => {
          console.log('Ticket submitted:', response);
          alert('TicketDetails saved successfully');
          this.ticketService.uploadAssetImage(this.ticketImage, response.ticketId).subscribe({
            next: (imageResponse: any) => {
              console.log('Image uploaded successfully:', imageResponse);
              this.selectedReportFiles = [];
            },
            error: (imageError: any) => {
              console.error('Error uploading image:', imageError);
              alert('Something went wrong while uploading the ticket image');
            }
          });
          form.resetForm();
        },
        error: (err: any) => {
          console.error('Error submitting ticket:', err);
          alert('Something went wrong while saving the ticket');
        }
      });
    }
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
    departmentId:null,
    id:null,
    photoOfIssue: ''
  }
 }
   selectedReportFiles: File[] = [];

   onFilesSelected(files: File[]) {
      this.selectedReportFiles = files;
      console.log('Selected files:', files);
      this.ticketImage = files[0]
   }
  getFilteredStatusOptions() {
    const currentIndex = this.statusOrder.indexOf(this.oldTicket?.status ?? '');
    return this.status.map(s => ({
      ...s,
      disabled: this.statusOrder.indexOf(s.value) < currentIndex
    }));
  }
  
  
}
