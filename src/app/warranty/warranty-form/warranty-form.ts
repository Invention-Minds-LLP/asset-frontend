import { Component, Input } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule, NgForm, NgModel, Validators } from '@angular/forms';
import { FloatLabel } from 'primeng/floatlabel';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { CommonModule } from '@angular/common';
import { FormBuilder } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar'; // Changed from DatePicker to CalendarModule
import { SelectModule } from 'primeng/select';
import { DragAndDrop } from '../../drag-and-drop/drag-and-drop';
import { ActivatedRoute } from '@angular/router';
import { Warranty } from '../../services/warranty/warranty';
import { ChangeDetectorRef } from '@angular/core';
import { MessageService } from 'primeng/api'; // Import MessageService for notifications
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { ServiceContract } from '../../services/service-contract/service-contract';
import { MaintenanceHistory } from '../../services/maintenance-history/maintenance-history';
import { TabViewModule } from 'primeng/tabview';
import { MessageModule } from 'primeng/message';
import { TextareaModule } from 'primeng/textarea';
import { SimpleChanges } from '@angular/core';
import { Assets } from '../../services/assets/assets';


interface SelectOption {
   name: string;
   value: boolean;
}


@Component({
   selector: 'app-warranty-form',
   imports: [FormsModule, InputTextModule, FloatLabel, ReactiveFormsModule, ButtonModule, DatePicker, CommonModule,
      CalendarModule, SelectModule, ToastModule, DragAndDrop, DividerModule, TableModule, TabViewModule, MessageModule,
      TextareaModule,],
   templateUrl: './warranty-form.html',
   styleUrl: './warranty-form.css'
})
export class WarrantyForm {
   @Input() assetId!: string; // ✅ alphanumeric Asset.assetId from parent

   isLoading = false;

   yesNoOptions = [
      { label: 'Yes', value: true },
      { label: 'No', value: false },
   ];

   contractTypeOptions = [
      { label: 'AMC', value: 'AMC' },
      { label: 'CMC', value: 'CMC' },
   ];

   warranty: any = {
      id: null,
      isUnderWarranty: null,
      warrantyStart: null,
      warrantyEnd: null,
      warrantyType: null,
      warrantyProvider: '',
      vendorId: null,
      warrantyReference: '',
      coverageDetails: '',
      exclusions: '',
      supportContact: '',
      supportEmail: '',
      termsUrl: '',
      remarks: '',
   };

   warrantyStatus = '';

   contracts: any[] = [];
   warrantyHistory: any[] = [];
   contractForm: any = {
      id: null,
      contractType: null,
      startDate: null,
      endDate: null,
      vendorId: null,
      contractNumber: '',
      visitsPerYear: null,
      cost: null,
      currency: 'INR',
      terms: '',
      includesParts: false,
      includesLabor: true,
      document: null,
   };
   contractFile: File | null = null;

   vendors: any[] = [];
   vendorOptions: { label: string; value: number }[] = [];

   maintenanceHistory: any[] = [];
   serviceForm!: FormGroup;
   selectedFile: File | null = null;

   contractSelectOptions: { label: string; value: number }[] = [];
   performedByTypeOptions = [
      { label: 'Vendor', value: 'VENDOR' },
      { label: 'Internal Staff', value: 'INTERNAL' },
   ];
   yesNoTriOptions = [
      { label: 'Yes', value: true },
      { label: 'No', value: false },
   ];

   warrantyTypeOptions = [
      { label: 'REPLACEMENT', value: 'REPLACEMENT' },
      { label: 'SERVICE', value: 'SERVICE' },
   ];
   isRenewMode = false;

   constructor(
      private fb: FormBuilder,
      private msg: MessageService,
      private warrantyApi: Warranty,
      private contractApi: ServiceContract,
      private maintenanceApi: MaintenanceHistory,
      private assetApi: Assets,
      private cdr: ChangeDetectorRef
   ) { }

   ngOnChanges(changes: SimpleChanges): void {
      if (changes['assetId']?.currentValue) {
         this.loadAll();
      }
   }

   ngOnInit(): void {
      if (!this.assetId) return;

      this.serviceForm = this.fb.group({
         scheduledDue: [null],
         actualDoneAt: [null, Validators.required],
         performedByType: ['VENDOR', Validators.required],
         performedById: [null],
         performedByName: [''],
         notes: [''],
         serviceContractId: [null], // optional 
      });

      // this.loadAll();
   }

   loadVendors() {
      this.assetApi.getVendors().subscribe({
         next: (list) => {
            this.vendors = list || [];
            this.vendorOptions = this.vendors.map(v => ({
               label: v.name,
               value: v.id
            }));
         },
         error: () => {
            this.vendors = [];
            this.vendorOptions = [];
         }
      });
   }

   async loadAll() {
      this.loadWarranty();
      this.loadWarrantyHistory();
      this.loadContracts();
      this.loadMaintenance();
      this.loadVendors();


   }
   fmt(d: any) {
      return d ? new Date(d).toLocaleDateString() : '-';
   }

   loadWarranty() {
      this.warrantyApi.getWarrantyByAssetId(this.assetId).subscribe({
         next: (w) => {
            setTimeout(() => {
               this.warranty = {
                  id: w.id,
                  isUnderWarranty: w.isUnderWarranty === true || w.isUnderWarranty === 'true' || w.isUnderWarranty === 1,
                  warrantyStart: w.warrantyStart ? new Date(w.warrantyStart) : null,
                  warrantyEnd: w.warrantyEnd ? new Date(w.warrantyEnd) : null,
                  warrantyType: w.warrantyType || null,
                  warrantyProvider: w.warrantyProvider || '',
                  vendorId: w.vendorId ?? null,
                  warrantyReference: w.warrantyReference || '',
                  coverageDetails: w.coverageDetails || '',
                  exclusions: w.exclusions || '',
                  supportContact: w.supportContact || '',
                  supportEmail: w.supportEmail || '',
                  termsUrl: w.termsUrl || '',
                  remarks: w.remarks || '',
               };
               this.warrantyStatus = this.computeWarrantyStatus();
               this.cdr.detectChanges();
            });
         },
         error: () => {
            this.warrantyStatus = '';
         }
      });
   }

   computeWarrantyStatus(): string {
      if (!this.warranty.isUnderWarranty) return 'No Warranty';

      if (!this.warranty.warrantyEnd) return 'Unknown';

      const today = new Date();
      const end = new Date(this.warranty.warrantyEnd);
      const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 3600 * 24));

      if (diffDays < 0) return 'Expired';
      if (diffDays <= 15) return 'Expiring Soon';
      return 'Active';
   }
   saveWarranty(form: any) {
      if (!form.valid) return;

      const payload = {
         assetId: this.assetId,
         isUnderWarranty: this.warranty.isUnderWarranty,
         warrantyStart: this.warranty.isUnderWarranty ? this.warranty.warrantyStart : null,
         warrantyEnd: this.warranty.isUnderWarranty ? this.warranty.warrantyEnd : null,

         warrantyType: this.warranty.warrantyType || null,
         warrantyProvider: this.warranty.warrantyProvider || null,
         vendorId: this.warranty.vendorId ? Number(this.warranty.vendorId) : null,
         warrantyReference: this.warranty.warrantyReference || null,
         coverageDetails: this.warranty.coverageDetails || null,
         exclusions: this.warranty.exclusions || null,
         supportContact: this.warranty.supportContact || null,
         supportEmail: this.warranty.supportEmail || null,
         termsUrl: this.warranty.termsUrl || null,
         remarks: this.warranty.remarks || null,
      };

      this.isLoading = true;

      const obs = this.warranty.id
         ? this.warrantyApi.updateWarranty(this.warranty.id, payload)
         : this.warrantyApi.createWarranty(payload);

      obs.subscribe({
         next: () => {
            this.msg.add({ severity: 'success', summary: 'Saved', detail: 'Warranty saved' });
            this.loadWarranty();
            this.isLoading = false;
         },
         error: (err) => {
            this.msg.add({ severity: 'error', summary: 'Failed', detail: err?.error?.message || 'Warranty save failed' });
            this.isLoading = false;
         },
         complete: () => (this.isLoading = false),
      });
   }

   loadContracts() {
      this.contractApi.getByAssetId(this.assetId).subscribe({
         next: (list) => {
            this.contracts = list || [];
            this.contractSelectOptions = this.contracts.map(c => ({
               label: `${c.contractType} (${new Date(c.startDate).toLocaleDateString()} - ${new Date(c.endDate).toLocaleDateString()})`,
               value: c.id
            }));
         },
         error: () => (this.contracts = []),
      });
   }

   // createContract(form: any) {
   //    if (!form.valid) return;

   //    const payload = {
   //       assetId: this.assetId,
   //       contractType: this.contractForm.contractType,
   //       startDate: this.contractForm.startDate,
   //       endDate: this.contractForm.endDate,
   //       vendorId: this.contractForm.vendorId ? Number(this.contractForm.vendorId) : null,
   //       contractNumber: this.contractForm.contractNumber || null,
   //       visitsPerYear: this.contractForm.visitsPerYear ? Number(this.contractForm.visitsPerYear) : null,
   //       cost: this.contractForm.cost ? Number(this.contractForm.cost) : null,
   //       currency: this.contractForm.currency || null,
   //       terms: this.contractForm.terms || null,
   //       includesParts: this.contractForm.includesParts ?? null,
   //       includesLabor: this.contractForm.includesLabor ?? null,
   //    };

   //    this.isLoading = true;
   //    this.contractApi.create(payload).subscribe({
   //       next: () => {
   //          this.msg.add({ severity: 'success', summary: 'Created', detail: 'Contract created' });
   //          if (this.contractFile) {
   //             this.contractApi.uploadDocument(this.assetId, this.contractFile).subscribe({
   //                next: (r) => {
   //                   this.msg.add({ severity: 'success', summary: 'Uploaded', detail: 'Uploaded successfully' });
   //                   this.isLoading = false;
   //                },
   //                error: (err) => {
   //                   this.isLoading = false;
   //                   this.msg.add({ severity: 'error', summary: 'Upload failed', detail: err?.error?.error || 'Contract doc upload failed' });
   //                }
   //             });
   //          }
   //          form.resetForm();
   //          this.contractForm.currency = 'INR';
   //          this.loadContracts();
   //       },
   //       error: (err) => {
   //          this.msg.add({ severity: 'error', summary: 'Failed', detail: err?.error?.message || 'Contract create failed' });
   //          this.isLoading = false;
   //       },
   //       complete: () => (this.isLoading = false),
   //    });
   // }
   saveContract(form: any) {
      if (!form.valid) return;

      const payload = {
         assetId: this.assetId,
         contractType: this.contractForm.contractType,
         startDate: this.contractForm.startDate,
         endDate: this.contractForm.endDate,
         vendorId: this.contractForm.vendorId ? Number(this.contractForm.vendorId) : null,
         contractNumber: this.contractForm.contractNumber || null,
         visitsPerYear: this.contractForm.visitsPerYear ? Number(this.contractForm.visitsPerYear) : null,
         cost: this.contractForm.cost ? Number(this.contractForm.cost) : null,
         currency: this.contractForm.currency || null,
         terms: this.contractForm.terms || null,
         includesParts: this.contractForm.includesParts ?? null,
         includesLabor: this.contractForm.includesLabor ?? null,
         status: this.contractForm.status || null,
         reason: this.contractForm.reason || null,
         createdBy: this.contractForm.createdBy || null,
      };

      this.isLoading = true;

      const request$ = this.contractForm.id
         ? this.contractApi.update(this.contractForm.id, payload)
         : this.contractApi.create(payload);

      request$.subscribe({
         next: (savedContract: any) => {
            const contractId = this.contractForm.id || savedContract?.id;

            if (this.contractFile && contractId) {
               this.contractApi.uploadDocument(contractId, this.contractFile).subscribe({
                  next: () => {
                     this.msg.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: this.contractForm.id ? 'Contract updated' : 'Contract created'
                     });
                     this.loadContracts();
                     this.resetContractForm(form);
                     this.isLoading = false;
                  },
                  error: (err) => {
                     this.msg.add({
                        severity: 'error',
                        summary: 'Upload failed',
                        detail: err?.error?.message || 'Document upload failed'
                     });
                     this.isLoading = false;
                  }
               });
            } else {
               this.msg.add({
                  severity: 'success',
                  summary: 'Success',
                  detail: this.contractForm.id ? 'Contract updated' : 'Contract created'
               });
               this.loadContracts();
               this.resetContractForm(form);
               this.isLoading = false;
            }
         },
         error: (err) => {
            this.msg.add({
               severity: 'error',
               summary: 'Failed',
               detail: err?.error?.message || 'Contract save failed'
            });
            this.isLoading = false;
         }
      });
   }

   resetContractForm(form?: any) {
      if (form) {
         form.resetForm();
      }

      this.contractForm = {
         id: null,
         contractType: null,
         startDate: null,
         endDate: null,
         vendorId: null,
         contractNumber: '',
         visitsPerYear: null,
         cost: null,
         currency: 'INR',
         terms: '',
         includesParts: false,
         includesLabor: true,
         document: null,
         status: 'ACTIVE',
         reason: '',
         createdBy: '',
      };

      this.contractFile = null;
   }

   loadMaintenance() {
      this.maintenanceApi.getByAssetId(this.assetId).subscribe({
         next: (h) => (this.maintenanceHistory = h || []),
         error: () => (this.maintenanceHistory = []),
      });
   }

   onFileChange(event: any) {
      const file = event.target?.files?.[0];
      this.selectedFile = file || null;
   }

   uploadServiceReport() {
      if (this.serviceForm.invalid) return;

      const v = this.serviceForm.value;

      let performedBy = '';
      if (v.performedByType === 'VENDOR') {
         const vendor = this.vendors.find(x => x.id === v.performedById);
         performedBy = vendor?.name || '';
      } else {
         performedBy = (v.performedByName || '').trim();
      }

      if (!performedBy) {
         this.msg.add({ severity: 'warn', summary: 'Required', detail: 'Performed By is required' });
         return;
      }

      const formData = new FormData();
      formData.append('assetId', this.assetId); // ✅ string assetId
      formData.append('scheduledDue', v.scheduledDue ? new Date(v.scheduledDue).toISOString() : new Date().toISOString());
      formData.append('actualDoneAt', new Date(v.actualDoneAt).toISOString());
      formData.append('performedBy', performedBy);
      formData.append('notes', v.notes || '');
      formData.append('wasLate', 'false'); // backend can compute too if you want

      if (v.serviceContractId) {
         formData.append('serviceContractId', String(v.serviceContractId)); // ✅ if backend accepts it
      }

      if (this.selectedFile) {
         formData.append('file', this.selectedFile);
      }

      this.isLoading = true;
      this.maintenanceApi.uploadReport(formData).subscribe({
         next: () => {
            this.msg.add({ severity: 'success', summary: 'Uploaded', detail: 'Service report saved' });
            this.serviceForm.reset();
            this.selectedFile = null;
            this.loadMaintenance();
            this.isLoading = false;
         },
         error: (err) => {
            this.msg.add({ severity: 'error', summary: 'Failed', detail: err?.error?.error || 'Upload failed' });
            this.isLoading = false;
         },
         complete: () => (this.isLoading = false),
      });
   }
   onContractFileChange(event: any) {
      const file = event.target?.files?.[0];
      this.contractFile = file || null;
   }
   editContract(c: any) {
      this.contractForm = {
         id: c.id,
         contractType: c.contractType || null,
         startDate: c.startDate ? new Date(c.startDate) : null,
         endDate: c.endDate ? new Date(c.endDate) : null,
         vendorId: c.vendorId ?? null,
         contractNumber: c.contractNumber || '',
         visitsPerYear: c.visitsPerYear ?? null,
         cost: c.cost ?? null,
         currency: c.currency || 'INR',
         terms: c.terms || '',
         includesParts: c.includesParts ?? false,
         includesLabor: c.includesLabor ?? true,
         document: c.document || null,
         status: c.status || 'ACTIVE',
         reason: c.reason || '',
         createdBy: c.createdBy || '',
      };

      this.contractFile = null;
   }
   renewWarranty(form: any) {
      if (!form.valid) return;

      const payload = {
         isUnderWarranty: this.warranty.isUnderWarranty,
         warrantyStart: this.warranty.isUnderWarranty ? this.warranty.warrantyStart : null,
         warrantyEnd: this.warranty.isUnderWarranty ? this.warranty.warrantyEnd : null,
         warrantyType: this.warranty.warrantyType || null,
         warrantyProvider: this.warranty.warrantyProvider || null,
         vendorId: this.warranty.vendorId ? Number(this.warranty.vendorId) : null,
         warrantyReference: this.warranty.warrantyReference || null,
         coverageDetails: this.warranty.coverageDetails || null,
         exclusions: this.warranty.exclusions || null,
         supportContact: this.warranty.supportContact || null,
         supportEmail: this.warranty.supportEmail || null,
         termsUrl: this.warranty.termsUrl || null,
         remarks: this.warranty.remarks || null,
      };

      this.isLoading = true;

      this.warrantyApi.renewWarranty(this.assetId, payload).subscribe({
         next: () => {
            this.msg.add({
               severity: 'success',
               summary: 'Renewed',
               detail: 'Warranty renewed successfully'
            });
            this.isRenewMode = false;
            this.loadWarranty();
            this.loadWarrantyHistory();
            this.isLoading = false;
         },
         error: (err) => {
            this.msg.add({
               severity: 'error',
               summary: 'Failed',
               detail: err?.error?.message || 'Warranty renewal failed'
            });
            this.isLoading = false;
         }
      });
   }
   loadWarrantyHistory() {
      this.warrantyApi.getWarrantyHistoryByAssetId(this.assetId).subscribe({
         next: (rows) => {
            this.warrantyHistory = rows || [];
         },
         error: () => {
            this.warrantyHistory = [];
         }
      });
   }
   startRenewal() {
      this.isRenewMode = true;

      this.warranty = {
         ...this.warranty,
         id: this.warranty.id, // keep old active warranty id reference in UI if needed
         isUnderWarranty: true,
         warrantyStart: null,
         warrantyEnd: null,
         warrantyType: null,
         warrantyProvider: '',
         vendorId: null,
         warrantyReference: '',
         coverageDetails: '',
         exclusions: '',
         supportContact: '',
         supportEmail: '',
         termsUrl: '',
         remarks: '',
      };

      this.warrantyStatus = '';
   }
   cancelRenewal() {
      this.isRenewMode = false;
      this.loadWarranty();
   }
}