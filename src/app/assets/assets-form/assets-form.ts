import { Component } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { CommonModule } from '@angular/common';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule, NgForm, NgModel } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Assets } from '../../services/assets/assets';
import { AssetEditService } from '../../services/assets/assets-edit';
import { ActivatedRoute } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Skeleton } from 'primeng/skeleton';

@Component({
  selector: 'app-assets-form',
  imports: [InputTextModule, DropdownModule, ButtonModule, SelectModule, CommonModule, FloatLabelModule, DatePickerModule, FormsModule, Skeleton],
  templateUrl: './assets-form.html',
  styleUrl: './assets-form.css'
})
export class AssetsForm {
  asset = {
    id: null as number | null,
    assetId: null,
    assetName: '',
    assetType: '',
    assetCategoryId: null,
    serialNumber: '',
    purchaseDate: null as Date | null,
    vendorId: null,
    departmentId: null,
    allottedToId: null,
    rfidCode: '',
    currentLocation: '',
    status: 'active',
    assetPhoto: ''
  };

  types = [
    { label: 'Fixed', value: 'fixed' },
    { label: 'Movable', value: 'movable' },
  ];

  categories: any[] = [];
  departments: any[] = [];
  users: any[] = [];
  vendors: any[] = [];
  vendorOptions: { label: string; value: number }[] = [];
  selectedVendor: any = null;
  editingVendor: any = {};
  originalCategories: { label: string, value: any }[] = [];
  filteredCategories: { label: string, value: any }[] = [];
  lastFilterValue: string = '';
  originalDepartments: { label: string, value: any }[] = [];
  filteredDepartments: { label: string, value: any }[] = [];
  lastDepartmentFilterValue: string = '';
  allEmployees: { label: string; value: any; departmentId: number; }[] = [];
  lastVendorFilterValue: string = '';
  isEditMode: boolean = false;
  pendingAssetImageFile: File | null = null;
  imagePreviewUrl: string | null = null;
  isLoading: boolean = true; 
  formSkeletonRows = Array(6);










  constructor(private assetService: Assets, private messageService: MessageService, private assetEditService: AssetEditService, private route: ActivatedRoute, private cdr: ChangeDetectorRef, private router: Router) { }


  ngOnInit() {

    this.assetService.getCategories().subscribe((categories) => {
      this.categories = categories.map(c => ({ label: c.name, value: c.id }));
      this.originalCategories = [...this.categories];
      this.filteredCategories = [...this.originalCategories];
    });

    this.assetService.getDepartments().subscribe((depts) => {
      this.departments = depts.map(d => ({ label: d.name, value: d.id }));
      this.originalDepartments = [...this.departments];
      this.filteredDepartments = [...this.originalDepartments];
    });

    this.assetService.getEmployees().subscribe((emps) => {
      this.allEmployees = emps.map(e => ({ label: e.name, value: e.id, departmentId: e.departmentId }));
    });

    this.assetService.getVendors().subscribe((vendors) => {
      this.vendors = vendors;
      this.vendorOptions = vendors.map(v => ({ label: v.name, value: v.id }));
    });

    const assetId = this.route.snapshot.paramMap.get('id');
    console.log('Asset ID from route:', assetId);
    if (assetId) {
      console.log('Edit mode detected for asset:', assetId);
      this.loadAsset(assetId);
      this.isEditMode = true;
    } else {
      console.log('New asset mode');
    }
  }

  loadAsset(assetId: string) {
    this.assetService.getAssetByAssetId(assetId).subscribe({
      next: (data) => {
        console.log('Loaded asset data:', data);
        this.asset = { ...data };  // autofill form
        this.isLoading = false;
        console.log('Asset loaded:', this.asset);
        this.editingVendor = this.vendors.find((v: any) => v.id === this.asset.vendorId) || null;
        if (this.asset.purchaseDate) {
          this.asset.purchaseDate = new Date(this.asset.purchaseDate);
        }
        this.users = this.allEmployees.filter(emp => emp.departmentId === this.asset.departmentId);
        console.log(this.editingVendor)
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load asset:', err),
    });
  }
  onVendorChange() {
    this.selectedVendor = this.vendors.find(v => v.id === this.asset.vendorId) || null;
    if (this.selectedVendor) {
      this.editingVendor = { ...this.selectedVendor };
    } else {
      this.editingVendor = {};
    }
  }
  onVendorFilter(event: any) {
    this.lastVendorFilterValue = event.filter;
  }
  onVendorSelect(selectedValue: any) {
    if (selectedValue === '__create__') {
      this.editingVendor = { name: this.lastVendorFilterValue, contact: '', email: '' };
      this.asset.vendorId = null;
      return;
    }

    const vendor = this.vendors.find(v => v.id === selectedValue);
    if (vendor) {
      this.selectedVendor = vendor;
      this.editingVendor = { ...vendor };
    } else {
      this.editingVendor = {};
    }
  }
  createNewVendor(newVendorName: string) {
    if (!newVendorName || newVendorName.trim() === '') {
      console.error('Cannot create vendor with empty name');
      return;
    }
    // Create vendor with just the name first
    const vendorData = { name: newVendorName, contact: '', email: '' };

    this.assetService.createVendor(vendorData).subscribe({
      next: (newVendor) => {
        console.log('New vendor created:', newVendor);

        // Add to dropdown
        const newOption = { label: newVendor.name, value: newVendor.id };
        this.vendorOptions.push(newOption);

        // Select new vendor
        this.asset.vendorId = newVendor.id;

        // Keep editingVendor for updating details later
        this.editingVendor = { ...newVendor };
      },
      error: (error) => {
        console.error('Error creating vendor:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Vendor Creation Failed',
          detail: `Failed to create vendor`
        });
      }
    });
  }


  invalid(control: NgModel) {
    return control.invalid && (control.dirty || control.touched);
  }

  showError(control: NgModel) {
    return this.invalid(control);
  }

  onSubmit(form: NgForm) {
    if (form.valid) {
      if (this.editingVendor?.id) {
        this.assetService.updateVendor(this.editingVendor.id, this.editingVendor).subscribe({
          next: (updatedVendor) => {
            this.saveAsset(form);
          },
          error: (error) => {
            console.error('Error updating vendor:', error);
          }
        });
      } else {
        this.saveAsset(form);
      }
      return;
    }
  }

  saveAsset(form: NgForm) {

    if (this.isEditMode && this.asset.id !== null) {  // ✅ update existing asset
      const { id, ...payload } = this.asset;
      this.assetService.updateAsset(this.asset.id, payload).subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Asset Updated',
            detail: `Asset '${this.asset.assetName}' updated successfully`
          });
          form.resetForm();
          if (this.pendingAssetImageFile && this.asset.assetId !== null) {
            this.assetService.uploadAssetImage(this.pendingAssetImageFile, this.asset.assetId).subscribe({
              next: (imageUrl) => {
                console.log('Asset image uploaded, URL:', imageUrl);
                this.asset.assetPhoto = imageUrl;
                this.pendingAssetImageFile = null; 
                this.messageService.add({
                  severity: 'success',
                  summary: 'Image Uploaded',
                  detail: `Image for asset '${this.asset.assetName}' uploaded successfully`
                });
              },
              error: (error) => {
                console.error('Asset image upload failed:', error);
                this.messageService.add({
                  severity: 'error',
                  summary: 'Image Upload Failed',
                  detail: `Failed to upload image for asset '${this.asset.assetName}'`
                });
              }
            });
          }
        },
        error: (error) => {
          console.error('Error updating asset:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Update Failed',
            detail: `Failed to update asset '${this.asset.assetName}'`
          });
        }
      });
    } else {  // ✅ create new asset
      const { id, ...payload } = this.asset;
      this.assetService.createAsset(payload).subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Asset Created',
            detail: `Asset '${this.asset.assetName}' created successfully`
          });
          form.resetForm();
          if (this.pendingAssetImageFile) {
            this.assetService.uploadAssetImage(this.pendingAssetImageFile, response.assetId).subscribe({
              next: (imageUrl) => {
                console.log('Asset image uploaded, URL:', imageUrl);
                this.asset.assetPhoto = imageUrl;
                this.pendingAssetImageFile = null; 
                this.messageService.add({
                  severity: 'success',
                  summary: 'Image Uploaded',
                  detail: `Image for asset '${this.asset.assetName}' uploaded successfully`
                });
                const hasWarranty = confirm('Does this product have warranty or AMC?');
                if (hasWarranty) {
                  console.log(response.assetId, 'Asset ID for warranty:', response.assetId);
                  this.router.navigate(['/warranty/new'], { queryParams: { assetId: response.assetId } });
                }
              },
              error: (error) => {
                console.error('Asset image upload failed:', error);
                this.messageService.add({
                  severity: 'error',
                  summary: 'Image Upload Failed',
                  detail: `Failed to upload image for asset '${this.asset.assetName}'`
                });
              }
            });
          }
        },
        error: (error) => {
          console.error('Error creating asset:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Creation Failed',
            detail: `Failed to create asset '${this.asset.assetName}'`
          });
        }
      });
    }
  }

  onClear() {
    this.asset = {
      id: null,
      assetId: null,
      assetName: '',
      assetType: '',
      assetCategoryId: null,
      serialNumber: '',
      purchaseDate: null,
      vendorId: null,
      departmentId: null,
      allottedToId: null,
      rfidCode: '',
      currentLocation: '',
      status: '',
      assetPhoto: ''
    };

  }
  ngOnDestroy() {
    this.onClear()
  }

  onFilter(event: any) {
    console.log('Filter event:', event.filter);
    const inputValue = event.filter.toLowerCase();
    this.lastFilterValue = event.filter;  // ✅ stores user’s search term

    const matching = this.originalCategories.filter(c => c.label.toLowerCase().includes(inputValue));

    if (matching.length === 0 && inputValue.trim() !== '') {
      this.filteredCategories = [
        ...matching,
        { label: `Create "${event.filter}"`, value: '__create__' }
      ];
    } else {
      this.filteredCategories = matching;
    }
  }
  onDepartmentFilter(event: any) {
    const inputValue = event.filter.toLowerCase();
    this.lastDepartmentFilterValue = event.filter;  // ✅ store what the user typed

    const matching = this.originalDepartments.filter(d => d.label.toLowerCase().includes(inputValue));

    if (matching.length === 0 && inputValue.trim() !== '') {
      this.filteredDepartments = [
        ...matching,
        { label: `Create "${event.filter}"`, value: '__create__' }
      ];
    } else {
      this.filteredDepartments = matching;
    }
  }

  onDepartmentSelect(selectedValue: any) {
    if (selectedValue === '__create__') {
      this.createNewDepartment(this.lastDepartmentFilterValue);
      return;
    }
    if (!selectedValue) {
      this.users = [];
      return;
    }

    // ✅ Filter employees based on selected department ID:
    this.users = this.allEmployees.filter(emp => emp.departmentId === selectedValue);

    console.log(`Filtered employees for department ${selectedValue}:`, this.users);
  }

  createNewDepartment(newDepartmentName: string) {
    if (!newDepartmentName || newDepartmentName.trim() === '') {
      console.error('Cannot create department with empty name');
      return;
    }
    console.log('Creating new department:', newDepartmentName);
    this.assetService.createDepartment({ name: newDepartmentName }).subscribe({
      next: (newDepartment) => {
        const newOption = { label: newDepartment.name, value: newDepartment.id };
        this.originalDepartments.push(newOption);
        this.filteredDepartments = [...this.originalDepartments];
        this.asset.departmentId = newDepartment.id;  // select new department
        console.log('New department created:', newDepartment);
      },
      error: (error) => {
        console.error('Failed to create department', error);
      }
    });
  }




  onCategorySelect(selectedValue: any) {
    if (selectedValue === '__create__') {
      this.createNewCategory(this.lastFilterValue);
    }
  }



  createNewCategory(newCategoryName: string) {
    if (!newCategoryName || newCategoryName.trim() === '') {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Category name cannot be empty' });
      return;
    }

    this.assetService.createCategory({ name: newCategoryName }).subscribe({
      next: (newCategory) => {
        const newOption = { label: newCategory.name, value: newCategory.id };
        this.originalCategories.push(newOption);
        this.filteredCategories = [...this.originalCategories];
        this.asset.assetCategoryId = newCategory.id;
        this.messageService.add({ severity: 'success', summary: 'Category Created', detail: `Created '${newCategory.name}'` });
      },
      error: (error) => {
        console.error('Failed to create category', error);
        const errorMessage = error?.error?.message || 'Unknown error occurred.';
        this.messageService.add({ severity: 'error', summary: 'Creation Failed', detail: errorMessage });
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.pendingAssetImageFile = file;
      this.imagePreviewUrl = URL.createObjectURL(file);
      this.asset.assetPhoto = file.name;
      console.log('Uploading asset image:', file);
    }
  }



}
