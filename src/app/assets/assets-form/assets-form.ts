import { Component } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { CommonModule } from '@angular/common';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule, NgForm, NgModel } from '@angular/forms';
import { Assets } from '../../services/assets/assets';

@Component({
  selector: 'app-assets-form',
  imports: [InputTextModule, DropdownModule, ButtonModule, SelectModule, CommonModule, FloatLabelModule,DatePickerModule,FormsModule],
  templateUrl: './assets-form.html',
  styleUrl: './assets-form.css'
})
export class AssetsForm {
  asset = {
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
    status: 'active'
  };
  
  types = [
    { label: 'Fixed', value: 'fixed' },
    { label: 'Movable', value: 'movable' },
  ];

  categories:any[] = [];
  departments:any[]  = [];
  users:any[]  = [];
  vendors: any[] = [];
  vendorOptions: { label: string; value: number }[] = [];
  selectedVendor: any = null;
  editingVendor: any = {};

  constructor( private assetService: Assets) { }
  

  ngOnInit() {
    this.assetService.getCategories().subscribe((categories) => {
      this.categories = categories.map(c => ({ label: c.name, value: c.id }));
    });
  
    this.assetService.getDepartments().subscribe((depts) => {
      this.departments = depts.map(d => ({ label: d.name, value: d.id }));
    });
  
    this.assetService.getEmployees().subscribe((emps) => {
      this.users = emps.map(e => ({ label: e.name, value: e.id }));
    });
  
    this.assetService.getVendors().subscribe((vendors) => {
      this.vendors = vendors;
      this.vendorOptions = vendors.map(v => ({ label: v.name, value: v.id }));
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
  

  invalid(control: NgModel) {
    return control.invalid && (control.dirty || control.touched);
  }

  showError(control: NgModel) {
    return this.invalid(control);
  }

  onSubmit(form: NgForm) {
    if (form.valid) {
      console.log('Asset saved:', this.asset);
      this.assetService.createAsset(this.asset).subscribe({
        next: (response) => {
          console.log('Asset created successfully:', response);
        form.resetForm()
        },
        error: (error) => {
          console.error('Error creating asset:', error);
        }
      });
      alert('Asset saved successfully!');
    } else {
      console.error('Form invalid');
    }
  }

  onClear() {
    this.asset = {
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
      status: ''
    };
    
  }
  ngOnDestroy(){
    this.onClear()
  }
}
