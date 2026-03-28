import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InputSwitchModule } from 'primeng/inputswitch';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Sidebar } from "./sidebar/sidebar";
import { Login } from "./login/login";
import { Router } from '@angular/router';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule, InputSwitchModule, Sidebar, RouterOutlet, ToastModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
  standalone: true
})
export class App {

  constructor(private router: Router) {}
  dark = false;
  isSidebarCollapsed = false;

  toggleTheme() {
    document.documentElement.classList.toggle('app-dark', this.dark);
  }
  isLoginRoute(): boolean {
    return this.router.url === '/login'; 
  }

  isNoLayoutRoute(): boolean {
    const url = this.router.url;
    return url === '/login' || url.startsWith('/assets/scan/');
  }

}
