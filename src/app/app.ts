import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InputSwitchModule } from 'primeng/inputswitch';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Sidebar } from "./sidebar/sidebar";
import { AssetsTable } from "./assets/assets-table/assets-table";
import { AssetsForm } from "./assets/assets-form/assets-form";

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule, InputSwitchModule, Sidebar, AssetsTable, AssetsForm],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  dark = false;

  toggleTheme() {
    document.documentElement.classList.toggle('app-dark', this.dark);
  }
}
