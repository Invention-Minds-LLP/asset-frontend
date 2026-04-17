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
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, ButtonModule, InputSwitchModule, PanelMenuModule, FormsModule, SelectButtonModule, RouterLink, TableModule, ConfirmDialogModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  providers: [ConfirmationService]
})
export class Sidebar implements OnInit {
  @Output() collapsedChange = new EventEmitter<boolean>();

  isCollapsed = false;
  darkMode = false;
  activeMenu = 'Assets Master';

  // Full hardcoded list — used as base and for admin / fallback
  private readonly allMenuItems = [

    // ── Overview ──────────────────────────────────────────
    {
      icon: 'pi pi-chart-bar', label: 'Dashboard',
      path: '/master-dashboard', route: '/master-dashboard', hasDropdown: false
    },
    {
      icon: 'pi pi-id-card', label: 'My Assets',
      path: '/my-assets', route: '/my-assets', hasDropdown: false
    },

    // ── Asset Management ──────────────────────────────────
    {
      icon: 'pi pi-database', label: 'Asset Master',
      path: '/assets', hasDropdown: true,
      dropdownItems: [
        { label: 'View Assets', route: '/assets/view', icon: 'pi pi-eye' },
        { label: 'New Asset', route: '/assets/new', icon: 'pi pi-plus' },
        { label: 'Assignments', route: '/assets/assignments', icon: 'pi pi-user' },
        { label: 'Transfer', route: '/transfer', icon: 'pi pi-arrows-h' },
        { label: 'Import', route: '/import', icon: 'pi pi-upload' },
        { label: 'Sub-Assets', route: '/sub-assets', icon: 'pi pi-sitemap' },
        { label: 'Department Assets', route: '/department-assets', icon: 'pi pi-building' },
        { label: 'Revenue Log', route: '/revenue-log', icon: 'pi pi-chart-line' },
        { label: 'Asset Disposal', route: '/disposal', icon: 'pi pi-trash' },
        { label: 'E-Waste Management', route: '/e-waste', icon: 'pi pi-recycle' },
      ]
    },
    {
      icon: 'pi pi-list-check', label: 'Asset Indent',
      path: '/asset-indent', route: '/asset-indent', hasDropdown: false
    },

    // ── Procurement ───────────────────────────────────────
    // {
    //   icon: 'pi pi-shopping-cart', label: 'Procurement',
    //   path: '/procurement', hasDropdown: true,
    //   dropdownItems: [
    //     { label: 'Purchase Orders', route: '/purchase-orders', icon: 'pi pi-file-edit' },
    //     { label: 'Goods Receipt (GRA)', route: '/goods-receipts', icon: 'pi pi-inbox' },
    //   ]
    // },

    // ── Store & Inventory ─────────────────────────────────
    {
      icon: 'pi pi-warehouse', label: 'Store & Inventory',
      path: '/store-management', route: '/store-management', hasDropdown: false
    },

    // ── Maintenance & Service ─────────────────────────────
    {
      icon: 'pi pi-wrench', label: 'Maintenance',
      path: '/maintenance', hasDropdown: true,
      dropdownItems: [
        { label: 'Repair Tickets', route: '/ticket/view', icon: 'pi pi-wrench' },
        { label: 'New Ticket', route: '/ticket/new', icon: 'pi pi-plus' },
        { label: 'Work Orders', route: '/work-orders', icon: 'pi pi-briefcase' },
        { label: 'Preventive Maintenance', route: '/preventive-maintenance', icon: 'pi pi-calendar' },
        { label: 'Calibration', route: '/calibration', icon: 'pi pi-sliders-h' },
        { label: 'PM Checklists', route: '/pm-checklist', icon: 'pi pi-list-check' },
      ]
    },

    // ── Contracts & Coverage ──────────────────────────────
    {
      icon: 'pi pi-verified', label: 'Contracts & Coverage',
      path: '/contracts', hasDropdown: true,
      dropdownItems: [
        { label: 'Warranty', route: '/warranty-management', icon: 'pi pi-verified' },
        { label: 'Insurance', route: '/insurance-management', icon: 'pi pi-shield' },
        { label: 'Service Contracts', route: '/service-contracts', icon: 'pi pi-file-edit' },
        { label: 'Vendor Performance', route: '/vendor-performance', icon: 'pi pi-star' },
      ]
    },

    // ── Finance & Analytics ───────────────────────────────
    {
      icon: 'pi pi-indian-rupee', label: 'Finance & Analytics',
      path: '/finance', hasDropdown: true,
      dropdownItems: [
        { label: 'Financial Dashboard', route: '/financial-dashboard', icon: 'pi pi-indian-rupee' },
        { label: 'CFO Dashboard', route: '/cfo-dashboard', icon: 'pi pi-chart-pie' },
        { label: 'COO Dashboard', route: '/coo-dashboard', icon: 'pi pi-gauge' },
        { label: 'Cost Analysis', route: '/cost-analysis', icon: 'pi pi-chart-bar' },
        { label: 'Decision Engine', route: '/decision-engine', icon: 'pi pi-microchip' },
        { label: 'Batch Depreciation', route: '/batch-depreciation', icon: 'pi pi-chart-line' },
        { label: 'Fixed Assets Schedule', route: '/fixed-assets-schedule', icon: 'pi pi-table' },
        { label: 'Finance Centre', route: '/finance-centre', icon: 'pi pi-building-columns' },
        { label: 'Legacy Migration', route: '/legacy-migration', icon: 'pi pi-history' },
        { label: 'Reconciliation', route: '/reconciliation', icon: 'pi pi-equals' },
        { label: 'Asset Pools', route: '/asset-pool', icon: 'pi pi-layer-group' },
        { label: 'Reports', route: '/reports', icon: 'pi pi-file' },
      ]
    },

    // ── Accounts ──────────────────────────────────────────
    // {
    //   icon: 'pi pi-calculator', label: 'Accounts',
    //   path: '/accounts', hasDropdown: true,
    //   dropdownItems: [
    //     { label: 'Accounts Dashboard', route: '/accounts/dashboard', icon: 'pi pi-chart-bar' },
    //     { label: 'Chart of Accounts', route: '/accounts/chart-of-accounts', icon: 'pi pi-list' },
    //     { label: 'Purchase Vouchers', route: '/accounts/purchase-vouchers', icon: 'pi pi-file-edit' },
    //     { label: 'Payment Vouchers', route: '/accounts/payment-vouchers', icon: 'pi pi-credit-card' },
    //     { label: 'Journal Entries', route: '/accounts/journal-entries', icon: 'pi pi-book' },
    //     { label: 'Account Ledger', route: '/accounts/ledger', icon: 'pi pi-chart-line' },
    //     { label: 'Service Invoices', route: '/accounts/service-invoices', icon: 'pi pi-file-check' },
    //   ]
    // },

    // ── Operations ────────────────────────────────────────
    {
      icon: 'pi pi-cog', label: 'Operations',
      path: '/operations', hasDropdown: true,
      dropdownItems: [
        { label: 'Gate Pass', route: '/gate-pass', icon: 'pi pi-id-card' },
        { label: 'Acknowledgement', route: '/acknowledgement', icon: 'pi pi-check-square' },
        { label: 'Physical Audit', route: '/asset-audit', icon: 'pi pi-clipboard' },
        { label: 'Employee Exit', route: '/employee-exit', icon: 'pi pi-sign-out' },
        { label: 'Document Vault', route: '/document-vault', icon: 'pi pi-folder-open' },
        { label: 'Knowledge Base', route: '/knowledge-base', icon: 'pi pi-book' },
        { label: 'Root Cause Analysis', route: '/rca', icon: 'pi pi-search-minus' },
        { label: 'Bulk Operations', route: '/quick-actions', icon: 'pi pi-bolt' },
      ]
    },

    // ── Administration ────────────────────────────────────
    {
      icon: 'pi pi-shield', label: 'Administration',
      path: '/admin', hasDropdown: true,
      dropdownItems: [
        { label: 'SLA Matrix', route: '/sla', icon: 'pi pi-clock' },
        { label: 'Escalation Matrix', route: '/escalation', icon: 'pi pi-sort-alt' },
        { label: 'Support Matrix', route: '/support-matrix', icon: 'pi pi-users' },
        { label: 'Hierarchy Dashboard', route: '/hierarchy-config', icon: 'pi pi-sitemap' },
        { label: 'Master Settings', route: '/master-settings', icon: 'pi pi-cog' },
        { label: 'Approval Config', route: '/approval-config', icon: 'pi pi-check-circle' },
        { label: 'Module Access', route: '/module-access', icon: 'pi pi-lock' },
        { label: 'System Config', route: '/tenant-config', icon: 'pi pi-sliders-v' },
        { label: 'User Activity', route: '/user-activity', icon: 'pi pi-users' },
        { label: 'Audit Trail', route: '/audit-trail', icon: 'pi pi-history' },
        { label: 'Notifications', route: '/notifications', icon: 'pi pi-bell' },
        { label: 'Notification Preferences', route: '/notification-preferences', icon: 'pi pi-sliders-h' },
        { label: 'Email Templates', route: '/email-templates', icon: 'pi pi-envelope' },
        { label: 'Inventory Master', route: '/master', icon: 'pi pi-box' },
      ]
    },
  ];

  // Displayed list — starts as full list, filtered after getMyAccess resolves
  menuItems: any[] = [...this.allMenuItems];
  activeItem = this.menuItems[0];
  name: string = localStorage.getItem('name') || ''

  constructor(private router: Router, private moduleAccessService: ModuleAccessService, private cdr: ChangeDetectorRef, private confirmationService: ConfirmationService) {
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

  logout() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to logout?',
      header: 'Confirm Logout',
      icon: 'pi pi-sign-out',
      acceptLabel: 'Logout',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        localStorage.clear();
        this.router.navigate(['/login']);
      }
    });
  }
}
