import { Component } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { CommonModule } from '@angular/common';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule, NgForm, NgModel } from '@angular/forms';

@Component({
  selector: 'app-assets-form',
  imports: [InputTextModule, DropdownModule, ButtonModule, SelectModule, CommonModule, FloatLabelModule,DatePickerModule,FormsModule],
  templateUrl: './assets-form.html',
  styleUrl: './assets-form.css'
})
export class AssetsForm {
  asset = {
    name: '',
    type: '',
    category: '',
    serialNumber: '',
    purchaseDate: null,
    vendorName: '',
    vendorPhnNumber: '',
    vendorEmail: '',
    department: '',
    allotedTo: '',
    rfid: '',
    location: '',
    status: ''
  };

  types = [
    { label: 'Laptop', value: 'laptop' },
    { label: 'Monitor', value: 'monitor' },
    { label: 'Keyboard', value: 'keyboard' },
  ];

  categories = [
    { label: 'Hardware', value: 'hardware' },
    { label: 'Software', value: 'software' },
  ];

  departments = [
    { label: 'IT', value: 'it' },
    { label: 'HR', value: 'hr' },
    { label: 'Finance', value: 'finance' },
  ];

  users = [
    { label: 'Alice', value: 'alice' },
    { label: 'Bob', value: 'bob' },
    { label: 'Carol', value: 'carol' },
  ];

  invalid(control: NgModel) {
    return control.invalid && (control.dirty || control.touched);
  }

  showError(control: NgModel) {
    return this.invalid(control);
  }

  onSubmit(form: NgForm) {
    if (form.valid) {
      console.log('Asset saved:', this.asset);
      // TODO: Call API to persist asset
      alert('Asset saved successfully!');
      form.resetForm();
    } else {
      console.error('Form invalid');
    }
  }

  onClear() {
    this.asset = {
      name: '',
      type: '',
      category: '',
      serialNumber: '',
      purchaseDate: null,
      vendorName: '',
      vendorPhnNumber: '',
      vendorEmail: '',
      department: '',
      allotedTo: '',
      rfid: '',
      location: '',
      status: ''
    };
  }
  ngOnDestroy(){
    this.onClear()
  }
}
