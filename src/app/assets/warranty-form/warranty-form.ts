import { Component } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule, NgForm, NgModel } from '@angular/forms';
import { FloatLabel } from 'primeng/floatlabel';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { CommonModule } from '@angular/common';
// import { DragAndDrop } from "../drag-and-drop/drag-and-drop";
import { CalendarModule } from 'primeng/calendar'; // Changed from DatePicker to CalendarModule
import { SelectModule } from 'primeng/select';
import { DragAndDrop } from "../drag-and-drop/drag-and-drop"; // Changed from Select to SelectModule



// Define a type for your select options to ensure type safety
interface SelectOption {
    name: string;
    value: boolean;
}


@Component({
  selector: 'app-warranty-form',
  imports: [FormsModule, InputTextModule, FloatLabel, ReactiveFormsModule, ButtonModule, DatePicker, CommonModule,
    CalendarModule, SelectModule, DragAndDrop],
  templateUrl: './warranty-form.html',
  styleUrl: './warranty-form.css'
})
export class WarrantyForm {

    warrantyStartDate: Date | null = null;
    warrantyEndDate: Date | null = null;
    VendorName: string = '';
    amcStartDate: Date | null = null;
    amcEndDate: Date | null = null;
    amcVisitsDue: Date | null = null; // Assuming this is also a date for "visits due"
    lastServiceDate: Date | null = null;
    nextVisitsDue: Date | null = null;

    warranty = {
       isunderwarranty: null as SelectOption | null, // Explicitly type as SelectOption or null
        amcactive: null as SelectOption | null,
        warrantystartdate:'',
        warrantyenddate:'',
        vendername:'',
        amcstartdate:'',
        amcenddate:'',
        amcvisitedue:'',
        lastservicedate:'',
        nextvisitedue:''
    }



 isunderwarranty: SelectOption[] = [   
    { name: 'Yes', value: true },
    { name: 'No', value: false }
 ];

 amcactive: SelectOption[] = [
    { name: 'Active', value: true },
    { name: 'Inactive', value: false }
 ];

 onSubmit(form: NgForm){
    if(form.valid){
        console.log('details submited', this.warranty)
        alert('details saved successfully')
        form.resetForm();
    }else{
        console.error('form invaild') 
     
    }
 }

 invaild(control:NgModel){
    return control.invalid && (control.dirty || control.touched);
 }

 showError(control: NgModel){
    return this.invaild(control);
 }

 onClear(){
    this.warranty = {
        isunderwarranty :null,
        amcactive:null,
        warrantystartdate:'',
        warrantyenddate:'',
        vendername:'',
        amcstartdate:'',
        amcenddate:'',
        amcvisitedue:'',
        lastservicedate:'',
        nextvisitedue:''
    }
 }
  
}
