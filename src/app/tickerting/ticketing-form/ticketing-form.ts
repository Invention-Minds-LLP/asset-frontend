import { Component } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule, NgModel, NgForm, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
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
import { MessageService } from 'primeng/api';
import { ToastModule } from "primeng/toast";
import { DialogModule } from 'primeng/dialog';





interface SelectOption {
  name: string;
  value: string;
}



@Component({
  selector: 'app-tickerting-form',
  imports: [FormsModule, InputTextModule, FloatLabel, Select, TextareaModule,
    ButtonModule, CommonModule, DragAndDrop, ToastModule, ReactiveFormsModule, DialogModule],
  templateUrl: './ticketing-form.html',
  styleUrl: './ticketing-form.css',
  providers: [MessageService]
})
export class TicketingForm {

  ticket: any = {
    ticketId: '',
    raisedBy: '',
    department: '',
    assetId: '',
    issueType: null as SelectOption | null,
    priority: null as SelectOption | null,
    detailedDesc: '',
    location: '',
    status: 'OPEN',
    departmentId: null as number | null,
    id: null as number | null,
    asset: null as any[] | null,
    photoOfIssue: '',
    updatedBy: null as string | null,
  }

  employee: any = '';
  department: any[] = [];
  assets: any[] = [];
  departmentName: string = '';
  isEditMode: boolean = false;
  ticketImage: any;
  oldTicket: any = null;

  userRole: string = '';

  issueType: SelectOption[] = [
    { name: 'Hardware', value: 'hardware' },
    { name: 'Software', value: 'software' },
  ]



  priority: SelectOption[] = [
    { name: 'Low', value: 'low' },
    { name: 'Medium', value: 'medium' },
    { name: 'High', value: 'high' }
  ]

  status = [
    { name: 'Open', value: 'OPEN' },
    { name: 'Assigned', value: 'ASSIGNED' },
    { name: 'In Progress', value: 'IN_PROGRESS' },
    { name: 'On Hold', value: 'ON_HOLD' },
    { name: 'Resolved', value: 'RESOLVED' },
    { name: 'Terminated', value: 'TERMINATED' },
    { name: 'Closed', value: 'CLOSED' },
    { name: 'Rejected', value: 'REJECTED' },
  ];

  statusOrder: string[] = [
    'OPEN',
    'ASSIGNED',
    'IN_PROGRESS',
    'ON_HOLD',
    'RESOLVED',
    'TERMINATED',
    'CLOSED',
    'REJECTED'
  ];

  showAssignDialog = false;
  showReassignDialog = false;
  showTerminateDialog = false;
  showCloseDialog = false;

  // ✅ Reactive forms (declare as class properties)
  assignForm!: FormGroup;
  reassignForm!: FormGroup;
  terminateForm!: FormGroup;
  closeForm!: FormGroup;
  employees: any[] = [];



  constructor(private ticketService: Ticketing, private assetService: Assets, private route: ActivatedRoute,
    private cdr: ChangeDetectorRef, private toastService: MessageService, private fb: FormBuilder) { }

  ngOnInit() {
    // reactive forms
    this.assignForm = this.fb.group({
      toEmployeeId: ['', Validators.required],
      comment: ['', Validators.required]
    });

    this.reassignForm = this.fb.group({
      toEmployeeId: ['', Validators.required],
      comment: ['', Validators.required]
    });

    this.terminateForm = this.fb.group({
      note: ['', Validators.required]
    });

    this.closeForm = this.fb.group({
      remarks: ['', Validators.required] // you can make it optional by removing required
    });
    const ticketId = this.route.snapshot.paramMap.get('id');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    this.userRole = user?.role || '';
    if (ticketId) {
      this.ticketService.getTicketById(ticketId).subscribe({
        next: (data) => {
          setTimeout(() => {
            this.ticket = { ...data };
            this.oldTicket = { ...data };
            this.ticket.assetId = data.asset.id;
            this.assets = [
              {
                ...data.asset,
                label: `${data.asset.assetId} - ${data.asset.assetName}`,
              }
            ];
            this.ticket.issueType = data.issueType;
            this.ticket.priority = data.priority;
            this.ticket.department = data.department.name;
            this.ticket.departmentId = data.department.id;
            this.ticket.raisedBy = `${data.raisedBy.name} ${data.raisedBy.employeeID}`;
            this.ticket.location = data.location;
            this.ticket.photoOfIssue = data.photoOfIssue || '';
            this.cdr.detectChanges();
          });
        },
        error: (err) => {
          console.error('Failed to fetch ticket data', err);
        }
      });
      console.log('Edit mode detected for asset:', ticketId);
      this.isEditMode = true;
    } else {
      console.log('New ticket mode');
      if (typeof window !== 'undefined' && localStorage) {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        console.log(user);
        this.employee = `${user.employeeID} - ${user.name}`
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

    this.loadEmployees();

  }



  loadEmployees() {
    this.assetService.getEmployees().subscribe({
      next: (res: any[]) => {
        this.employees = res.map(e => ({
          ...e,
          label: `${e.employeeID} - ${e.name}`,
          value: e.id, // ✅ important: DB id
        }));
      },
      error: () => this.toast('error', 'Failed to load employees')
    });
  }
  issueChange() {

    const selectedAsset = this.assets.find(asset => asset.id === this.ticket.assetId);
    console.log(selectedAsset)
    if (selectedAsset) {
      this.ticket.location = selectedAsset.currentLocation;
    } else {
      this.ticket.location = '';
    }

    console.log(this.ticket)
  }

  locationChange(event: string) {
    console.log(this.ticket.location)
  }




  onSubmit(form: NgForm) {
    if (form.valid) {
      console.log(this.ticket)
      if (this.isEditMode) {
        if (typeof window !== 'undefined' && localStorage) {
          const user = JSON.parse(localStorage.getItem('user') || 'null');
          console.log(user);
          this.ticket.updatedBy = `${user.employeeID} - ${user.username}`;
        }
        if (this.ticket.id) {
          const { id, department, asset, departmentId, assetId, ...rest } = this.ticket;
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
      else {
        const { id, asset, department, ...payload } = this.ticket
        this.ticketService.createTicket(payload).subscribe({
          next: (response: any) => {
            console.log('Ticket submitted:', response);
            alert('TicketDetails saved successfully');
            if (this.ticketImage) {
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
            }
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

  invaild(control: NgModel) {
    return control.invalid && (control.dirty || control.touched);
  }

  showError(control: NgModel) {
    return this.invaild(control);
  }

  onClear() {
    this.ticket = {
      ticketId: '',
      raisedBy: '',
      department: '',
      assetId: '',
      issueType: null,
      priority: null,
      detailedDesc: '',
      location: '',
      status: 'new',
      departmentId: null,
      id: null,
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
  canEditBasic() {
    return this.userRole === 'EXECUTIVE';
  }

  canAssign() {
    return this.userRole === 'HOD';
  }

  canReassign() {
    return this.userRole === 'HOD';
  }

  canTerminate() {
    return this.userRole === 'HOD';
  }

  canWorkOnTicket() {
    return this.userRole === 'SUPERVISOR' || this.userRole === 'EXECUTIVE';
  }

  canCloseTicket() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const myEmployeeDbId = user?.employeeDbId;

    const iRaised = !!myEmployeeDbId && this.ticket?.raisedById === myEmployeeDbId;
    const allowedStatus = this.ticket?.status === 'RESOLVED' || this.ticket?.status === 'TERMINATED';

    return iRaised && allowedStatus;
  }
  assignTicket() {
    const toEmployeeId = prompt("Enter Employee ID");
    const comment = prompt("Enter comment");

    if (!toEmployeeId || !comment) return;

    this.ticketService.assignTicket(this.ticket.id, +toEmployeeId, comment)
      .subscribe(() => this.toast('success', 'Assigned successfully'));
  }

  reassignTicket() {
    const toEmployeeId = prompt("Enter Employee ID");
    const comment = prompt("Enter comment");

    if (!toEmployeeId || !comment) return;

    this.ticketService.reassignTicket(this.ticket.id, +toEmployeeId, comment)
      .subscribe(() => this.toast('success', 'Reassigned successfully'));
  }

  terminateTicket() {
    const note = prompt("Enter reason");
    if (!note) return;

    this.ticketService.terminateTicket(this.ticket.id, note)
      .subscribe(() => this.toast('warn', 'Ticket Terminated'));
  }

  closeTicket() {
    const remarks = prompt("Enter remarks");

    if (!remarks) return; // ✅ prevents null & empty

    this.ticketService.closeTicket(this.ticket.id, remarks)
      .subscribe(() => this.toast('success', 'Ticket Closed'));
  }

  updateStatus(status: string) {
    this.ticketService.updateStatus(this.ticket.id, status).subscribe({
      next: () => {
        this.toast('success', `Status updated to ${status}`);
        this.reloadTicket();
      },
      error: () => this.toast('error', 'Failed to update status')
    });
  }
  toast(severity: string, detail: string) {
    this.toastService.add({
      severity,
      summary: "Info",
      detail
    });
  }
  openAssignDialog() {
    this.assignForm.reset();
    this.showAssignDialog = true;
  }

  openReassignDialog() {
    this.reassignForm.reset();
    this.showReassignDialog = true;
  }

  openTerminateDialog() {
    this.terminateForm.reset();
    this.showTerminateDialog = true;
  }

  openCloseDialog() {
    this.closeForm.reset();
    this.showCloseDialog = true;
  }
  submitAssign() {
    if (!this.ticket?.id || this.assignForm.invalid) return;

    const toEmployeeId = Number(this.assignForm.value.toEmployeeId);
    const comment = String(this.assignForm.value.comment).trim();

    this.ticketService.assignTicket(this.ticket.id, toEmployeeId, comment).subscribe({
      next: () => {
        this.toast('success', 'Ticket assigned successfully');
        this.showAssignDialog = false;
        this.reloadTicket(); // optional refresh
      },
      error: () => this.toast('error', 'Failed to assign ticket')
    });
  }

  submitReassign() {
    if (!this.ticket?.id || this.reassignForm.invalid) return;

    const toEmployeeId = Number(this.reassignForm.value.toEmployeeId);
    const comment = String(this.reassignForm.value.comment).trim();

    this.ticketService.reassignTicket(this.ticket.id, toEmployeeId, comment).subscribe({
      next: () => {
        this.toast('success', 'Ticket reassigned successfully');
        this.showReassignDialog = false;
        this.reloadTicket();
      },
      error: () => this.toast('error', 'Failed to reassign ticket')
    });
  }

  submitTerminate() {
    if (!this.ticket?.id || this.terminateForm.invalid) return;

    const note = String(this.terminateForm.value.note).trim();

    this.ticketService.terminateTicket(this.ticket.id, note).subscribe({
      next: () => {
        this.toast('warn', 'Ticket terminated');
        this.showTerminateDialog = false;
        this.reloadTicket();
      },
      error: () => this.toast('error', 'Failed to terminate ticket')
    });
  }

  submitClose() {
    if (!this.ticket?.id || this.closeForm.invalid) return;

    const remarks = String(this.closeForm.value.remarks).trim();

    this.ticketService.closeTicket(this.ticket.id, remarks).subscribe({
      next: () => {
        this.toast('success', 'Ticket closed successfully');
        this.showCloseDialog = false;
        this.reloadTicket();
      },
      error: () => this.toast('error', 'Failed to close ticket')
    });
  }
  reloadTicket() {
    const ticketId = this.route.snapshot.paramMap.get('id');
    if (!ticketId) return;

    this.ticketService.getTicketById(ticketId).subscribe({
      next: (data) => {
        setTimeout(() => {
          this.ticket = { ...data };
          this.oldTicket = { ...data };
          this.cdr.detectChanges();
        });
      }
    });
  }
}
