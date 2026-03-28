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
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-login',
  imports: [InputTextModule, PasswordModule, ButtonModule, CheckboxModule, CommonModule, CarouselModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  constructor(private authService: Auth, private router: Router, private messageService: MessageService) {
    // Initialize any required services or state

  }

  ngOnInit(): void {

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
  loading: boolean = false;


  togglePassword(): void {
    this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
  }
  onSubmit(): void {
    if (!this.employeeId || !this.password) {
      alert('Please enter Employee ID and Password');
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please enter Employee ID and Password' });
      return;
    }

    this.loading = true;

    this.authService.login(this.employeeId, this.password).subscribe({
      next: (response) => {
        console.log('Login success:', response);
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('role', response.user.role);
        localStorage.setItem('name', response.user.name);
        localStorage.setItem("employeeDbId", response.user.employeeDbId);
        localStorage.setItem("departmentId", response.user.departmentId);
        console.log(localStorage.getItem('user'))
        this.employeeId = '';
        this.password = '';
        this.loading = false;
        this.router.navigate(['/assets/view']);
        this.messageService.add({ severity: 'success', summary: 'Login Successful', detail: 'Welcome back!' });
      },
      error: (error) => {
        console.error('Login failed:', error);
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Login Failed', detail: 'Invalid Employee ID or Password' });
      },
    });
  }

  isLoginFormValid(): boolean {
    return !!this.employeeId.trim() && !!this.password.trim();
  }

}
