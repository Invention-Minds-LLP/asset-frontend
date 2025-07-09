import { Component } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule, NgForm, NgModel } from '@angular/forms';
import { FloatLabel } from 'primeng/floatlabel';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { CommonModule } from '@angular/common';
import { FormBuilder } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar'; // Changed from DatePicker to CalendarModule
import { SelectModule } from 'primeng/select';
import { DragAndDrop } from "../drag-and-drop/drag-and-drop"; // Changed from Select to SelectModule
import { ActivatedRoute } from '@angular/router';
import { Warranty } from '../../services/warranty/warranty';
import { ChangeDetectorRef } from '@angular/core';
import { MessageService } from 'primeng/api'; // Import MessageService for notifications
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';


interface SelectOption {
   name: string;
   value: boolean;
}


@Component({
   selector: 'app-warranty-form',
   imports: [FormsModule, InputTextModule, FloatLabel, ReactiveFormsModule, ButtonModule, DatePicker, CommonModule,
      CalendarModule, SelectModule, ToastModule, DragAndDrop, DividerModule, TableModule],
   templateUrl: './warranty-form.html',
   styleUrl: './warranty-form.css'
})
export class WarrantyForm {
   form: FormGroup;
   warranty = {
      id: null as number | null, // Ensure id is a string or null
      isUnderWarranty: null as boolean | null,
      amcActive: null as boolean | null,
      warrantyStart: null as Date | null,
      warrantyEnd: null as Date | null,
      amcVendor: '',
      amcStart: null as Date | null,
      amcEnd: null as Date | null,
      amcVisitsDue: null as number | null,
      lastServiceDate: null as Date | null,
      nextVisitDue: null as Date | null,
      assetId: '' as string | null
   };
   isEditMode: boolean = false;
   selectedIsUnderWarranty: SelectOption | null = null;
   selectedAmcActive: SelectOption | null = null;
   assetDetails: any = null;
   isLoading = false;
   oldData: any = null;
   maintenanceHistoryList: any[] = [];
   warrantyStatus: string = '';
   warrantyStatusClass: string = '';



   isunderwarranty: SelectOption[] = [
      { name: 'Yes', value: true },
      { name: 'No', value: false }
   ];

   amcactive: SelectOption[] = [
      { name: 'Active', value: true },
      { name: 'Inactive', value: false }
   ];


   constructor(private route: ActivatedRoute, private warrantyService: Warranty, private cdr: ChangeDetectorRef, private messageService: MessageService, private fb: FormBuilder) {
      this.form = this.fb.group({
         serviceDate: [null],
         performedBy: [''],
         remarks: [''],
         reportFile: [null]
      });
   }

   ngOnInit() {
      const assetIdParam = this.route.snapshot.queryParamMap.get('assetId');
      this.warranty.assetId = assetIdParam;
      console.log('Warranty form opened for asset ID:', this.warranty.assetId);

      const assetId = this.route.snapshot.paramMap.get('id');
      console.log('Asset ID from route:', assetId);
      if (assetId) {
         console.log('Edit mode detected for asset:', assetId);
         this.loadAsset(assetId);
         this.warrantyService.getMaintenanceHistory(assetId).subscribe(data => {
            this.maintenanceHistoryList = data;
            console.log('Maintenance history loaded:', this.maintenanceHistoryList);
         });
         this.isEditMode = true;
      } else {
         console.log('New asset mode');
      }



   }
   loadAsset(assetId: string) {
      this.warrantyService.getWarrantyByAssetId(assetId).subscribe({
         next: (data) => {
            console.log('Loaded asset data:', data);
            this.warranty = { ...data, assetId: assetId };
            this.oldData = data
            this.selectedIsUnderWarranty = this.isunderwarranty.find(opt => opt.value === this.warranty.isUnderWarranty) || null;
            this.selectedAmcActive = this.amcactive.find(opt => opt.value === this.warranty.amcActive) || null;
            this.warranty.amcVendor = this.warranty.amcVendor || '';
            this.warranty.amcStart = this.warranty.amcStart ? new Date(this.warranty.amcStart) : new Date();
            this.warranty.amcEnd = this.warranty.amcEnd ? new Date(this.warranty.amcEnd) : new Date();
            this.warranty.amcVisitsDue = this.warranty.amcVisitsDue ?? null;
            this.warranty.lastServiceDate = this.warranty.lastServiceDate ? new Date(this.warranty.lastServiceDate) : new Date();
            this.warranty.nextVisitDue = this.warranty.nextVisitDue ? new Date(this.warranty.nextVisitDue) : new Date();
            this.warranty.warrantyStart = this.warranty.warrantyStart ? new Date(this.warranty.warrantyStart) : new Date();
            this.warranty.warrantyEnd = this.warranty.warrantyEnd ? new Date(this.warranty.warrantyEnd) : new Date();
            this.assetDetails = data.asset || null;
            this.warrantyStatus = this.getWarrantyStatus();
            this.warrantyStatusClass = this.getWarrantyStatusClass();
            console.log('Asset details loaded:', this.assetDetails);
            // console.log('Warranty data after loading:', this.warranty, this.selectedAmcActive, this.selectedIsUnderWarranty);
            this.cdr.detectChanges();

         },
         error: (err) => console.error('Failed to load asset:', err),
      });
   }

   getWarrantyStatus(): string {
      const { isUnderWarranty, warrantyEnd } = this.warranty;
    
      if (!isUnderWarranty) {
        return 'No Warranty';
      }
    
      if (!warrantyEnd) {
        return 'Unknown';
      }
    
      const today = new Date();
      const endDate = new Date(warrantyEnd);
      const diffInTime = endDate.getTime() - today.getTime();
      const diffInDays = Math.ceil(diffInTime / (1000 * 3600 * 24));
    
      if (diffInDays < 0) {
        return 'Expired';
      } else if (diffInDays <= 15) {
        return 'Expiring Soon';
      } else {
        return 'Active';
      }
    }

    getWarrantyStatusClass(): string {
      const status = this.getWarrantyStatus(); // From previous response
    
      switch (status) {
        case 'Active':
          return 'border-active';
        case 'Expiring Soon':
          return 'border-expiring';
        case 'Expired':
          return 'border-expired';
        default:
          return 'border-none';
      }
    }
    

   onSubmit(form: NgForm) {
      if (form.valid) {
         this.isLoading = true; // Set loading state to true
         const maintenanceData = this.form.value;
         const isMaintenanceFilled =
            maintenanceData.serviceDate ||
            maintenanceData.performedBy?.trim() ||
            maintenanceData.remarks?.trim() ||
            maintenanceData.reportFile;

         const saveMaintenance = () => {
            if (isMaintenanceFilled) {
               maintenanceData.assetId = this.warranty.assetId;
               this.saveMaintenanceHistory();
            }
         };
         if (this.isEditMode) {
            const { id, ...warrantyData } = this.warranty; // Destructure to get id and rest of the data
            if (id !== null && id !== undefined) {
               this.warrantyService.updateWarranty(id, warrantyData).subscribe({
                  next: (response) => {
                     saveMaintenance()
                     console.log('Warranty updated:', response);
                     alert('Warranty updated successfully!');
                  },
                  error: (error) => {
                     console.error('Failed to update warranty:', error);
                     alert('Failed to update warranty.');
                  },

                  complete: () => {
                     this.isLoading = false;
                     this.cdr.detectChanges();
                  }
               });
            } else {
               this.isLoading = false; // Reset loading state
               console.error('Cannot update: Warranty ID is null or undefined.');
               alert('Invalid warranty ID. Cannot update.');
            }
         }
         else {
            console.log('Form submitted:', this.warranty);
            this.warranty.isUnderWarranty = this.selectedIsUnderWarranty?.value ?? null;
            this.warranty.amcActive = this.selectedAmcActive?.value ?? null;

            console.log('Form payload to send:', this.warranty);
            this.warrantyService.createWarranty(this.warranty).subscribe({
               next: (response) => {
                  console.log('Warranty saved:', response);
                  saveMaintenance();
                  alert('Warranty & AMC saved successfully!');
                  form.resetForm();
               },
               error: (error) => {
                  console.error('Failed to save warranty:', error);
                  alert('Failed to save warranty.');
               },

               complete: () => {
                  this.isLoading = false;
                  this.cdr.detectChanges();
               }
            });
         }
      }
   }


   invaild(control: NgModel) {
      return control.invalid && (control.dirty || control.touched);
   }

   showError(control: NgModel) {
      return this.invaild(control);
   }

   onClear() {
      this.warranty = {
         id: null,
         isUnderWarranty: null,
         amcActive: null,
         warrantyStart: null,
         warrantyEnd: null,
         amcVendor: '',
         amcStart: null,
         amcEnd: null,
         amcVisitsDue: null,
         lastServiceDate: null,
         nextVisitDue: null,
         assetId: null
      }
   }

   calculateNextVisitDue(): void {
      console.log('Calculating next visit due date...', this.warranty.lastServiceDate, this.warranty.amcVisitsDue);
      if (this.form.value.serviceDate && this.warranty.amcVisitsDue) {
         const last = new Date(this.form.value.serviceDate);
         const next = new Date(last.setMonth(last.getMonth() + this.warranty.amcVisitsDue));
         console.log('Calculated next visit due date:', next);
         this.warranty.nextVisitDue = next;
         // Check if next visit exceeds AMC End
         if (this.warranty.amcEnd && new Date(this.warranty.amcEnd) < next) {
            this.messageService.add({
               severity: 'warn',
               summary: 'Warning',
               detail: 'Next visit due exceeds AMC End Date!',
               life: 4000
            });
         }
      } else {
         this.warranty.nextVisitDue = null;
      }
   }
   saveMaintenanceHistory() {
      const scheduledDue = this.oldData.nextVisitDue;
      const actualDoneAt = this.form.value.serviceDate;

      // ✅ Determine if it's late
      const wasLate = actualDoneAt && scheduledDue && new Date(actualDoneAt) > new Date(scheduledDue);

      const formData = new FormData();
      formData.append('assetId', this.assetDetails.id ?? '');
      formData.append('scheduledDue', new Date(scheduledDue ?? new Date()).toISOString());
      formData.append('actualDoneAt', new Date(actualDoneAt).toISOString());
      formData.append('wasLate', wasLate.toString());
      formData.append('performedBy', this.form.value.performedBy);
      formData.append('notes', this.form.value.remarks || '');

      if (this.selectedReportFiles && this.selectedReportFiles.length > 0) {
         formData.append('file', this.selectedReportFiles[0]);
      }

      this.isLoading = true;

      this.warrantyService.saveMaintenanceHistoryWithFile(formData).subscribe({
         next: () => {
            this.messageService.add({
               severity: 'success',
               summary: 'Success',
               detail: 'Maintenance history saved'
            });
            this.form.reset();
            this.selectedReportFiles = [];
         },
         error: (err) => {
            console.error('Error saving maintenance:', err);
            this.messageService.add({
               severity: 'error',
               summary: 'Failed',
               detail: 'Could not save maintenance record'
            });
         },
         complete: () => {
            this.isLoading = false;
            this.cdr.detectChanges();
         }
      });
   }

   selectedReportFiles: File[] = [];

   onFilesSelected(files: File[]) {
      this.selectedReportFiles = files;
      console.log('Selected files:', files);
      this.form.patchValue({ reportFile: files[0] }); // If you want to bind the first file
   }

}
