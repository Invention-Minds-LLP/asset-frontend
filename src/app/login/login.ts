import { ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { CommonModule } from '@angular/common';
import { CarouselModule } from 'primeng/carousel';
import { Auth } from '../services/auth/auth';
import { FormsModule, NgForm, NgModel } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-login',
  imports: [InputTextModule, PasswordModule, ButtonModule, CheckboxModule, CommonModule, CarouselModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  constructor(private authService: Auth, private router: Router, private route: ActivatedRoute, private messageService: MessageService, private cdr: ChangeDetectorRef) {
    // Initialize any required services or state

  }

  // Where to land after login — honours ?returnUrl (e.g. set by a QR scan that
  // needs login to show full details), falling back to the assets list.
  private get returnUrl(): string {
    return this.route.snapshot.queryParamMap.get('returnUrl') || '/assets/view';
  }

  ngOnInit(): void {

    // If a silent refresh (APP_INITIALIZER) already restored a session, skip login.
    if (this.authService.isLoggedIn()) {
      this.router.navigateByUrl(this.returnUrl);
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
        // Access token → memory (Auth service); refresh token is in an httpOnly
        // cookie the server just set. Only non-secret display data is persisted.
        this.authService.setSession(response.token, response.user);
        this.employeeId = '';
        this.password = '';
        this.loading = false;
        this.router.navigateByUrl(this.returnUrl);
        this.messageService.add({ severity: 'success', summary: 'Login Successful', detail: 'Welcome back!' });
      },
      error: (error) => {
        console.error('Login failed:', error);
        this.loading = false;
        // Surface the server's reason (e.g. "Your account is inactive") instead
        // of always blaming the credentials.
        const detail = error?.error?.message || 'Invalid Employee ID or Password';
        this.messageService.add({ severity: 'error', summary: 'Login Failed', detail });
        // Zoneless app: without this the button stays stuck on "Authenticating…"
        // because nothing schedules a re-render after loading flips back.
        this.cdr.markForCheck();
      },
    });
  }

  isLoginFormValid(): boolean {
    return !!this.employeeId.trim() && !!this.password.trim();
  }

}
