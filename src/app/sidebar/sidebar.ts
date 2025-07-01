import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputSwitchModule } from 'primeng/inputswitch';
import { PanelMenuModule } from 'primeng/panelmenu';
import { FormsModule } from '@angular/forms';
import {SelectButtonModule} from 'primeng/selectbutton';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, ButtonModule, InputSwitchModule, PanelMenuModule, FormsModule, SelectButtonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {

  isCollapsed = false;
  darkMode = false;
  activeMenu = 'Assets Master';
  menuItems = [
    { icon: 'pi pi-th-large', label: 'Dashboard', route: '/dashboard', hasDropdown: false },
    { icon: 'pi pi-database', label: 'Assets Master', route: '/assets', hasDropdown: true },
    { icon: 'pi pi-envelope', label: 'Warranty & AMC', route: '/warranty', hasDropdown: true },
    { icon: 'pi pi-wrench', label: 'Tracking for Repair', route: '/repair', hasDropdown: true },
  ];
  activeItem = this.menuItems[0];

  constructor(private router: Router) {
    this.router.events.subscribe(() => {
      const currentRoute = this.router.url;
      const found = this.menuItems.find(item => currentRoute.includes(item.route));
      this.activeMenu = found ? found.label : '';
      
    });
  }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
  }
  themeOptions = [
    { label: 'Light', value: 'light', icon: 'pi pi-sun' },
    { label: 'Dark', value: 'dark', icon: 'pi pi-moon' }
  ];
  isDarkMode = false;

  toggleDarkMode() {
    document.documentElement.classList.toggle('app-dark', this.isDarkMode);
  }
  
  
  // toggleDarkMode() {
  //   document.documentElement.classList.toggle('app-dark', this.darkMode);
  // }

  navigate(item: any) {
    this.activeMenu = item.label;
    this.router.navigate([item.route]);
  }
  
}
