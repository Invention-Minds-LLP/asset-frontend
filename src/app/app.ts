import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InputSwitchModule } from 'primeng/inputswitch';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Sidebar } from "./sidebar/sidebar";
import { AssetsTable } from "./assets/assets-table/assets-table";
import { AssetsForm } from "./assets/assets-form/assets-form";
import { WarrantyTable } from "./assets/warranty-table/warranty-table/warranty-table";
import { WarrantyForm } from './assets/warranty-form/warranty-form';
import { DragAndDrop } from "./assets/drag-and-drop/drag-and-drop";
import { Login } from "./login/login";
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule, InputSwitchModule, Sidebar, AssetsTable, AssetsForm, WarrantyTable, WarrantyForm, DragAndDrop, Login, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  constructor(private router: Router) {}
  dark = false;

  toggleTheme() {
    document.documentElement.classList.toggle('app-dark', this.dark);
  }
  isLoginRoute(): boolean {
    return this.router.url === '/login'; // Adjust this if your login route is different
  }
}
