import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputSwitchModule } from 'primeng/inputswitch';
import { PanelMenuModule } from 'primeng/panelmenu';
import { FormsModule } from '@angular/forms';
import { SelectButtonModule } from 'primeng/selectbutton';
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
    { icon: 'pi pi-th-large', label: 'Dashboard',
       path: '/dashboard', route:'/dashboard', hasDropdown: false 
      },
    {
      icon: 'pi pi-database', label: 'Assets Master',
      path: '/assets',
      hasDropdown: true,
      dropdownItems: [
        { label: 'View', route: '/assets/view' },
        { label: 'New', route: '/assets/new' },
      ]
    },
    { icon: 'pi pi-envelope', label: 'Warranty & AMC',
      hasDropdown: true,
      path: '/warranty',
      dropdownItems: [
        { label: 'View', route: '/warranty/view' },
        // { label: 'New', route: '/warranty/new' },
      ] },
    { icon: 'pi pi-wrench', label: 'Ticket for Repair', path:'/ticket', hasDropdown: true,
      dropdownItems: [
        { label: 'View', route: '/ticket/view' },
        { label: 'New', route: '/ticket/new' },
      ] 
     },
  ];
  activeItem = this.menuItems[0];

  constructor(private router: Router) {
    this.router.events.subscribe(() => {
      const currentRoute = this.router.url;
  
      // First, try to match top-level routes
      let found = this.menuItems.find(item => item.route && currentRoute.includes(item.route));
  
      if (!found) {
        // Try to match nested dropdown routes
        for (const item of this.menuItems) {
          if (item.dropdownItems) {
            const subFound = item.dropdownItems.find(sub => currentRoute.includes(sub.route));
            if (subFound) {
              found = item;
              break;
            }
          }
        }
      }
  
      this.activeMenu = found ? found.label : '';
    });
  }
  isActiveRoute(route: string): boolean {
    return this.router.url.includes(route);
  }

  isActiveMainRoute(route: string): boolean {
    return this.router.url.startsWith(route);
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

  onMenuClick(item: any) {
    if (item.hasDropdown) {
      this.activeMenu = this.activeMenu === item.label ? '' : item.label;
    } else {
      this.activeMenu = item.label;
      this.navigate(item);
    }
  }
  

  toggleDropdown(item: any, event: MouseEvent) {
    event.stopPropagation(); // prevent button click from firing as well
    if (this.activeMenu === item.label) {
      this.activeMenu = ''; // close it if it's already open
    } else {
      this.activeMenu = item.label; // open it otherwise
    }
  }
  

}
