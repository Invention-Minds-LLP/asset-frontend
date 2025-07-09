import { Component, OnDestroy } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { CommonModule } from '@angular/common';
import { CarouselModule } from 'primeng/carousel';
import { Auth } from '../services/auth/auth';
import { FormsModule, NgForm, NgModel } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [InputTextModule, PasswordModule, ButtonModule, CheckboxModule, CommonModule, CarouselModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login  {

  constructor(private authService: Auth, private router : Router) { 
    // Initialize any required services or state
    
  }

  ngOnInit():void{

   if (typeof window !== 'undefined' && localStorage) {
    const token = localStorage.getItem('authToken');
    if (token) {
      console.log('User already logged in');
      this.router.navigate(['/assets/view']);
    }
  }
  }
  images = [
    '/system.svg',
    '/photo-camera.svg',
    '/cctv.svg'
  ];

  passwordFieldType = 'password';
  currentYear = new Date().getFullYear();
  employeeId: string = '';
  password: string = '';


  togglePassword(): void {
    this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
  }
  onSubmit(): void {
    if (!this.employeeId || !this.password) {
      alert('Please enter Employee ID and Password');
      return;
    }
  
    this.authService.login(this.employeeId, this.password).subscribe({
      next: (response) => {
        console.log('Login success:', response);
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        this.employeeId = '';
        this.password = '';
        this.router.navigate(['/assets/view']);
        alert('Login successful!');
      },
      error: (error) => {
        console.error('Login failed:', error);
        alert(error.error?.message || 'Login failed');
      },
    });
  }
  
}
