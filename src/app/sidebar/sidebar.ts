import { Component, ChangeDetectorRef, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputSwitchModule } from 'primeng/inputswitch';
import { PanelMenuModule } from 'primeng/panelmenu';
import { FormsModule } from '@angular/forms';
import { SelectButtonModule } from 'primeng/selectbutton';
import { Router, RouterLink } from '@angular/router';
import { ModuleAccessService } from '../services/module-access/module-access';
import { TableModule } from "primeng/table";

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, ButtonModule, InputSwitchModule, PanelMenuModule, FormsModule, SelectButtonModule, RouterLink, TableModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar implements OnInit {
  @Output() collapsedChange = new EventEmitter<boolean>();

  isCollapsed = false;
  darkMode = false;
  activeMenu = 'Assets Master';

  // Full hardcoded list — used as base and for admin / fallback
  private readonly allMenuItems = [

    {
      icon: 'pi pi-chart-bar', label: 'Dashboard',
      path: '/master-dashboard', route: '/master-dashboard', hasDropdown: false
    },
    {
      icon: 'pi pi-database', label: 'Assets Master',
      path: '/assets',
      hasDropdown: true,
      dropdownItems: [
        { label: 'View', route: '/assets/view', icon: 'pi pi-eye' },
        { label: 'New', route: '/assets/new', icon: 'pi pi-plus' },
        { label: 'Assignments', route: '/assets/assignments', icon: 'pi pi-user' },
        { label: 'Transfer', route: '/transfer', icon: 'pi pi-arrows-h' },
        { label: 'Import', route: '/import', icon: 'pi pi-upload' },
      ]
    },
    {
      icon: 'pi pi-wrench', label: 'Ticket for Repair', path: '/ticket', hasDropdown: true,
      dropdownItems: [
        { label: 'View', route: '/ticket/view', icon: 'pi pi-eye' },
        { label: 'New', route: '/ticket/new', icon: 'pi pi-plus' },
      ]
    },
    {
      icon: 'pi pi-cog', label: 'Operations', path: '/operations', hasDropdown: true,
      dropdownItems: [
        { label: 'Calibration', route: '/calibration', icon: 'pi pi-sliders-h' },
        { label: 'Gate Pass', route: '/gate-pass', icon: 'pi pi-id-card' },
        { label: 'Acknowledgement', route: '/acknowledgement', icon: 'pi pi-check-square' },
      ]
    },
    {
      icon: 'pi pi-shield', label: 'Configuration', path: '/config', hasDropdown: true,
      dropdownItems: [
        { label: 'SLA Matrix', route: '/sla', icon: 'pi pi-clock' },
        { label: 'Escalation Matrix', route: '/escalation', icon: 'pi pi-sort-alt' },
        { label: 'Support Matrix', route: '/support-matrix', icon: 'pi pi-users' },
        { label: 'Inventory', route: '/master', icon: 'pi pi-box' },
      ]
    },
    {
      icon: 'pi pi-bell', label: 'Notifications',
      path: '/notifications', route: '/notifications', hasDropdown: false
    },
    {
      icon: 'pi pi-cog', label: 'Master Settings',
      path: '/master-settings', route: '/master-settings', hasDropdown: false
    },
    {
      icon: 'pi pi-lock', label: 'Module Access',
      path: '/module-access', route: '/module-access', hasDropdown: false
    },
    {
      icon: 'pi pi-indian-rupee', label: 'Financial Dashboard',
      path: '/financial-dashboard', route: '/financial-dashboard', hasDropdown: false
    },
    {
      icon: 'pi pi-file', label: 'Reports',
      path: '/reports', route: '/reports', hasDropdown: false
    },
    {
      icon: 'pi pi-trash', label: 'Asset Disposal',
      path: '/disposal', route: '/disposal', hasDropdown: false
    },
    {
      icon: 'pi pi-clipboard', label: 'Physical Audit',
      path: '/asset-audit', route: '/asset-audit', hasDropdown: false
    },
    {
      icon: 'pi pi-history', label: 'Audit Trail',
      path: '/audit-trail', route: '/audit-trail', hasDropdown: false
    },
  ];

  // Displayed list — starts as full list, filtered after getMyAccess resolves
  menuItems: any[] = [...this.allMenuItems];
  activeItem = this.menuItems[0];
  name: string = localStorage.getItem('name') || ''

  constructor(private router: Router, private moduleAccessService: ModuleAccessService, private cdr: ChangeDetectorRef) {
    this.router.events.subscribe(() => {
      const currentRoute = this.router.url;

      // First, try to match top-level routes
      let found = this.menuItems.find(item => item.route && currentRoute.includes(item.route));

      if (!found) {
        // Try to match nested dropdown routes
        for (const item of this.menuItems) {
          if (item.dropdownItems) {
            const subFound = item.dropdownItems.find((sub:any) => currentRoute.includes(sub.route));
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
  ngOnInit() {
    this.moduleAccessService.getMyAccess().subscribe({
      next: (result) => {
        let filtered: any[];

        if (result.isAdmin) {
          filtered = [...this.allMenuItems];
        } else {
          const allowedModulePaths = new Set<string>(
            result.modules.map((m: any) => m.path).filter(Boolean)
          );
          const allowedItemPaths = new Set<string>(
            result.modules.flatMap((m: any) => (m.subItems || []).map((s: any) => s.path)).filter(Boolean)
          );

          filtered = this.allMenuItems
            .map(item => {
              if (!item.hasDropdown) {
                return allowedModulePaths.has(item.route || item.path) ? item : null;
              } else {
                const visibleSubs = (item.dropdownItems || []).filter((sub: any) =>
                  allowedModulePaths.has(sub.route) || allowedItemPaths.has(sub.route)
                );
                return visibleSubs.length > 0 ? { ...item, dropdownItems: visibleSubs } : null;
              }
            })
            .filter((item): item is any => item !== null);
        }

        // Defer to next tick to avoid NG0100 (ExpressionChangedAfterItHasBeenCheckedError)
        setTimeout(() => {
          this.menuItems = filtered;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        // API failed — fail open (show all)
      }
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

    if (this.isCollapsed) {
      this.activeMenu = '';
    }
    this.collapsedChange.emit(this.isCollapsed);
    console.log('Sidebar collapsed:', this.isCollapsed);

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

  settings(){
    this.router.navigate(['/settings'])
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
