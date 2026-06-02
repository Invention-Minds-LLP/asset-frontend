import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { ExportService, ExportParams } from '../../services/export/export.service';
import { environment } from '../../../environment/environment.prod';

interface ExportItem {
  label:           string;
  report:          string;   // matches backend `:report` param
  filename:        string;
  needsDate?:      boolean;
  needsYear?:      boolean;
  needsMonth?:     boolean;
  needsFY?:        boolean;
  needsCategory?:  boolean;
  needsDepartment?: boolean;
  needsVendor?:    boolean;
  multiSheet?:     boolean;
}

interface ExportGroup {
  title: string;
  icon:  string;
  items: ExportItem[];
}

@Component({
  selector: 'app-data-export',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './data-export.html',
  styleUrls: ['./data-export.css'],
})
export class DataExport implements OnInit {
  // ── Shared filters ────────────────────────────────────────────────────────
  startDate = '';
  endDate   = '';
  year      = new Date().getFullYear();
  // month=0 means "All months" — buildParams skips sending it so reports treat
  // the FY (or date range) as the only period selector. Picking a real month
  // (1-12) narrows the FA register to that single month within the chosen FY.
  month     = 0;
  financialYear   = '';
  assetCategoryId: number | '' = '';
  departmentId:    number | '' = '';
  vendorId:        number | '' = '';
  assetType = '';

  loading: Record<string, boolean> = {};
  errorMsg: Record<string, string> = {};

  // Reference lists for dropdowns
  categories: { id: number; name: string }[] = [];
  departments: { id: number; name: string }[] = [];

  months = [
    { value: 0,  label: 'All months' },
    { value: 1,  label: 'January' },  { value: 2,  label: 'February' },
    { value: 3,  label: 'March' },    { value: 4,  label: 'April' },
    { value: 5,  label: 'May' },      { value: 6,  label: 'June' },
    { value: 7,  label: 'July' },     { value: 8,  label: 'August' },
    { value: 9,  label: 'September' },{ value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' },
  ];
  years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

  // Indian financial years: derive last 6 (current FY = Apr–Mar based on current month)
  financialYears = (() => {
    const now = new Date();
    const baseYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    return Array.from({ length: 6 }, (_, i) => {
      const y = baseYear - i;
      return `${y}-${String((y + 1) % 100).padStart(2, '0')}`;
    });
  })();

  assetTypes = ['TANGIBLE', 'INTANGIBLE'];

  // ── Export groups (12 groups, 58 reports) ────────────────────────────────
  groups: ExportGroup[] = [
    {
      title: 'A. Statutory & Audit Pack',
      icon:  'gavel',
      items: [
        { label: 'Schedule II FA Register (Companies Act)', report: 'schedule-ii-fa-register',    filename: 'Schedule_II_FA_Register',    needsFY: true, needsCategory: true, needsDepartment: true },
        { label: 'IT Act FA Register',                       report: 'it-act-fa-register',         filename: 'IT_Act_FA_Register',         needsCategory: true, needsDepartment: true },
        { label: 'CFO FA Register — Full (Year-End / Schedule II)',  report: 'cfo-fixed-asset-register',          filename: 'CFO_Fixed_Asset_Register_Full',     needsFY: true, needsDate: true, needsMonth: true, needsCategory: true },
        { label: 'CFO FA Register — Activity Only (movements)',      report: 'cfo-fixed-asset-register-activity', filename: 'CFO_Fixed_Asset_Register_Activity', needsFY: true, needsDate: true, needsMonth: true, needsCategory: true },
        { label: 'Block of Assets Schedule',                 report: 'block-of-assets-schedule',   filename: 'Block_of_Assets_Schedule' },
        { label: 'Year-End FA Snapshot',                     report: 'year-end-fa-snapshot',       filename: 'Year_End_FA_Snapshot' },
        { label: 'Pre-Audit Reconciliation',                 report: 'pre-audit-reconciliation',   filename: 'Pre_Audit_Reconciliation' },
        { label: "Auditor's Working Paper Pack",             report: 'auditor-working-paper-pack', filename: 'Auditor_Working_Paper_Pack', needsFY: true, multiSheet: true },
      ],
    },
    {
      title: 'B. Depreciation & FA Movement',
      icon:  'trending_down',
      items: [
        { label: 'Depreciation Log',                report: 'depreciation-log',           filename: 'Depreciation_Log',           needsDate: true, needsFY: true },
        { label: 'Asset Additions Register',        report: 'asset-additions',            filename: 'Asset_Additions',            needsDate: true, needsFY: true, needsCategory: true, needsDepartment: true, needsVendor: true },
        { label: 'Asset Retirements & Disposals',   report: 'asset-retirements',          filename: 'Asset_Retirements',          needsDate: true, needsFY: true },
        { label: 'Net Block Movement by Category',  report: 'net-block-movement',         filename: 'Net_Block_Movement' },
        { label: 'Fully Depreciated, Still-In-Use', report: 'fully-depreciated-in-use',   filename: 'Fully_Depreciated_In_Use' },
        { label: 'FA Schedule (Asset Pool)',        report: 'fa-schedule-pool',           filename: 'FA_Schedule_Pool',           needsFY: true, needsCategory: true },
        { label: 'Useful Life Remaining',           report: 'useful-life-remaining',      filename: 'Useful_Life_Remaining' },
        { label: 'Half-Year Convention Applied',    report: 'half-year-applied',          filename: 'Half_Year_Applied',          needsDate: true, needsFY: true },
        { label: 'Depreciation Method Summary',     report: 'depreciation-method-summary',filename: 'Depreciation_Method_Summary' },
      ],
    },
    {
      title: 'C. Tax & GST',
      icon:  'receipt_long',
      items: [
        { label: 'GST on Asset Purchases',         report: 'gst-on-asset-purchases',    filename: 'GST_on_Asset_Purchases',   needsDate: true, needsFY: true, needsVendor: true },
        { label: 'Capital Goods ITC Register',     report: 'capital-goods-itc-register',filename: 'Capital_Goods_ITC',        needsDate: true, needsFY: true },
        { label: 'TDS on Capital Purchases',       report: 'tds-on-capital-purchases',  filename: 'TDS_on_Capital_Purchases', needsDate: true, needsFY: true, needsVendor: true },
        { label: 'Vendor TDS Deductions Summary',  report: 'vendor-tds-deductions',     filename: 'Vendor_TDS_Deductions',    needsDate: true, needsFY: true },
      ],
    },
    // ── D. Vouchers & Ledger — DISABLED for this client (vouchers module not in use)
    // Re-enable by uncommenting when the client provisions the Accounts module.
    // {
    //   title: 'D. Vouchers & Ledger',
    //   icon:  'book',
    //   items: [
    //     { label: 'Journal Entries (multi-sheet)', report: 'journal-entries',  filename: 'Journal_Entries',  needsDate: true, needsFY: true, multiSheet: true },
    //     { label: 'Payment Vouchers',              report: 'payment-vouchers', filename: 'Payment_Vouchers', needsDate: true, needsFY: true, needsVendor: true },
    //     { label: 'Purchase Vouchers',             report: 'purchase-vouchers',filename: 'Purchase_Vouchers',needsDate: true, needsFY: true, needsVendor: true },
    //     { label: 'Chart of Accounts',             report: 'chart-of-accounts',filename: 'Chart_of_Accounts' },
    //     { label: 'Trial Balance (FA accounts)',   report: 'trial-balance-fa', filename: 'Trial_Balance_FA' },
    //     { label: 'Asset GL Mapping',              report: 'gl-mapping',       filename: 'GL_Mapping' },
    //     { label: 'Manual Ledger Entries',         report: 'manual-ledger',    filename: 'Manual_Ledger',    needsDate: true, needsFY: true },
    //     { label: 'Sub-Ledger by Asset',           report: 'sub-ledger-by-asset', filename: 'Sub_Ledger_by_Asset', needsCategory: true },
    //   ],
    // },
    {
      title: 'E. Capex & Cost',
      icon:  'attach_money',
      items: [
        { label: 'Capex Budget vs Actual', report: 'capex-budget-vs-actual', filename: 'Capex_Budget_vs_Actual', needsYear: true, needsDepartment: true },
        { label: 'Cost per Asset (TCO)',   report: 'cost-per-asset-tco',     filename: 'Cost_per_Asset_TCO' },
        { label: 'Maintenance Spend',      report: 'maintenance-spend',      filename: 'Maintenance_Spend',      needsDate: true, needsFY: true },
        { label: 'Capex vs Opex Split',    report: 'capex-vs-opex',          filename: 'Capex_vs_Opex',          needsYear: true, needsFY: true },
        { label: 'Top Vendors by Spend',   report: 'top-vendors-by-spend',   filename: 'Top_Vendors_by_Spend',   needsDate: true, needsFY: true },
      ],
    },
    {
      title: 'F. Procurement & Store',
      icon:  'inventory',
      items: [
        // ── PO / GRN disabled for this client (Procurement module not in use) ──
        // { label: 'Purchase Orders (multi-sheet)', report: 'purchase-orders',       filename: 'Purchase_Orders',       needsDate: true, needsFY: true, needsVendor: true, needsDepartment: true, multiSheet: true },
        // { label: 'Goods Receipt Notes',           report: 'goods-receipts',        filename: 'Goods_Receipts',        needsDate: true, needsFY: true, needsVendor: true },
        { label: 'Material Requests',             report: 'material-requests',     filename: 'Material_Requests',     needsDate: true, needsFY: true },
        { label: 'Asset Indents',                 report: 'asset-indents',         filename: 'Asset_Indents',         needsDate: true, needsFY: true, needsCategory: true, needsDepartment: true },
        { label: 'Store Stock Position',          report: 'store-stock-position',  filename: 'Store_Stock_Position' },
        { label: 'Inventory Ageing',              report: 'inventory-ageing',      filename: 'Inventory_Ageing' },
        { label: 'Slow / Non-Moving Spares',      report: 'slow-moving-spares',    filename: 'Slow_Moving_Spares' },
        { label: 'Reorder List',                  report: 'reorder-list',          filename: 'Reorder_List' },
      ],
    },
    {
      title: 'G. Vendor Analytics',
      icon:  'store',
      items: [
        { label: 'Vendor Master',       report: 'vendor-master',       filename: 'Vendor_Master' },
        { label: 'Vendor Performance',  report: 'vendor-performance',  filename: 'Vendor_Performance' },
        { label: 'Vendor Outstanding',  report: 'vendor-outstanding',  filename: 'Vendor_Outstanding' },
        { label: 'Price Variance',      report: 'price-variance',      filename: 'Price_Variance',     needsDate: true, needsFY: true },
      ],
    },
    {
      title: 'H. Insurance & Claims',
      icon:  'security',
      items: [
        { label: 'Insurance Policies (multi-sheet)', report: 'insurance-policies',       filename: 'Insurance_Policies', multiSheet: true },
        { label: 'Premium Paid by FY',               report: 'premium-paid-by-fy',       filename: 'Premium_Paid_by_FY' },
        { label: 'Claims Raised vs Settled',         report: 'claims-raised-vs-settled', filename: 'Claims_Raised_vs_Settled', needsDate: true, needsFY: true },
        { label: 'Pending Claims',                   report: 'pending-claims',           filename: 'Pending_Claims' },
        { label: 'Insurance Coverage Gaps',          report: 'insurance-coverage-gaps',  filename: 'Insurance_Coverage_Gaps' },
      ],
    },
    {
      title: 'I. Warranty & Service Contracts',
      icon:  'verified',
      items: [
        { label: 'Warranties',               report: 'warranties',              filename: 'Warranties' },
        { label: 'Service Contracts (AMC/CMC)', report: 'service-contracts',    filename: 'Service_Contracts' },
        { label: 'Warranty Utilisation',     report: 'warranty-utilisation',    filename: 'Warranty_Utilisation' },
        { label: 'AMC Coverage Gaps',        report: 'amc-coverage-gaps',       filename: 'AMC_Coverage_Gaps' },
        { label: 'AMC Renewal Projection',   report: 'amc-renewal-projection',  filename: 'AMC_Renewal_Projection' },
      ],
    },
    {
      title: 'J. Asset Master & Lifecycle',
      icon:  'category',
      items: [
        { label: 'Asset Master (multi-sheet)', report: 'asset-master',         filename: 'Asset_Master',        needsCategory: true, needsDepartment: true, multiSheet: true },
        { label: 'Asset Movement Log',         report: 'asset-movement-log',   filename: 'Asset_Movement_Log',  multiSheet: true },
        { label: 'Physical Audit Records',     report: 'physical-audit',       filename: 'Physical_Audit' },
        { label: 'Asset Utilisation',          report: 'asset-utilisation',    filename: 'Asset_Utilisation' },
        { label: 'Disposal & E-Waste',         report: 'disposal-ewaste',      filename: 'Disposal_EWaste',     multiSheet: true },
      ],
    },
    {
      title: 'K. Maintenance, Calibration & SLA',
      icon:  'build',
      items: [
        { label: 'Repair Tickets',           report: 'tickets',             filename: 'Repair_Tickets',    needsDate: true, needsFY: true, needsDepartment: true },
        { label: 'Work Orders (multi-sheet)',report: 'work-orders',         filename: 'Work_Orders',       needsDate: true, needsFY: true, multiSheet: true },
        { label: 'PM Schedules',             report: 'pm-schedules',        filename: 'PM_Schedules' },
        { label: 'PM Checklist Runs',        report: 'pm-runs',             filename: 'PM_Runs',           needsDate: true, needsFY: true },
        { label: 'Calibration Schedules',    report: 'calibration-schedules',filename: 'Calibration_Schedules' },
        { label: 'Calibration History',      report: 'calibration-history', filename: 'Calibration_History' },
        { label: 'Out-of-Calibration List',  report: 'out-of-calibration',  filename: 'Out_of_Calibration' },
        { label: 'SLA Breach Trend',         report: 'sla-breach-trend',    filename: 'SLA_Breach_Trend',  needsDate: true, needsFY: true },
        { label: 'Escalation Log',           report: 'escalation-log',      filename: 'Escalation_Log' },
        { label: 'RCA Log',                  report: 'rca-log',             filename: 'RCA_Log' },
        { label: 'Decision Engine Log',      report: 'decision-engine',     filename: 'Decision_Engine_Log' },
      ],
    },
    {
      title: 'L. HR & Admin Audit',
      icon:  'admin_panel_settings',
      items: [
        { label: 'Employees with Assigned Assets', report: 'employees-with-assets',  filename: 'Employees_with_Assets' },
        { label: 'Employee Exit Clearance',        report: 'employee-exits',         filename: 'Employee_Exits' },
        { label: 'Login History',                  report: 'login-history',          filename: 'Login_History',      needsDate: true, needsFY: true },
        { label: 'Activity Audit Trail',           report: 'audit-trail',            filename: 'Audit_Trail',         needsDate: true, needsFY: true },
        { label: 'User Access Matrix',             report: 'user-access-matrix',     filename: 'User_Access_Matrix' },
        { label: 'Module Access by Role',          report: 'module-access-by-role',  filename: 'Module_Access_by_Role' },
        { label: 'Approval Config Snapshot',       report: 'approval-config',        filename: 'Approval_Config' },
      ],
    },
  ];

  constructor(
    private exportService: ExportService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Load reference lists for the Category / Department dropdowns
    this.http.get<any[]>(`${environment.apiUrl}/categories`).subscribe({
      next: (rows) => { this.categories = (rows || []).map(r => ({ id: r.id, name: r.name })); },
      error: () => {},
    });
    this.http.get<any[]>(`${environment.apiUrl}/departments`).subscribe({
      next: (rows) => { this.departments = (rows || []).map(r => ({ id: r.id, name: r.name })); },
      error: () => {},
    });
  }

  // Warn if a date range exceeds 12 months — exports get heavy beyond that
  get dateRangeWarning(): boolean {
    if (!this.startDate || !this.endDate) return false;
    const start = new Date(this.startDate).getTime();
    const end   = new Date(this.endDate).getTime();
    if (end < start) return false;
    return (end - start) / (1000 * 60 * 60 * 24) > 366;
  }

  /** Build the filter payload an item asks for. */
  private buildParams(item: ExportItem): ExportParams {
    const p: ExportParams = {};
    if (item.needsDate) {
      if (this.startDate) p.startDate = this.startDate;
      if (this.endDate)   p.endDate   = this.endDate;
    }
    if (item.needsYear)        p.year          = this.year;
    // month=0 is the "All months" sentinel — don't send it so the backend
    // falls through to FY-only or date-range behaviour.
    if (item.needsMonth && this.month >= 1 && this.month <= 12) p.month = this.month;
    if (item.needsFY  && this.financialYear)      p.financialYear   = this.financialYear;
    if (item.needsCategory   && this.assetCategoryId !== '') p.assetCategoryId = Number(this.assetCategoryId);
    if (item.needsDepartment && this.departmentId    !== '') p.departmentId    = Number(this.departmentId);
    if (item.needsVendor     && this.vendorId        !== '') p.vendorId        = Number(this.vendorId);
    if (this.assetType) p.assetType = this.assetType;
    return p;
  }

  export(item: ExportItem): void {
    if (this.loading[item.report]) return;
    this.loading[item.report] = true;
    delete this.errorMsg[item.report];

    // finalize() guarantees the loading flag is cleared regardless of
    // success / error / cancellation. detectChanges() forces the UI to
    // update even when the response completes outside Angular's zone.
    this.exportService.getBlob(item.report, this.buildParams(item))
      .pipe(finalize(() => {
        this.loading[item.report] = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (blob) => {
          this.exportService.triggerDownload(blob, item.filename);
        },
        error: (err) => {
          console.error(`Export failed [${item.report}]:`, err);
          this.errorMsg[item.report] = err?.error?.error || err?.message || 'Export failed';
        },
      });
  }

  resetFilters(): void {
    this.startDate = '';
    this.endDate   = '';
    this.year      = new Date().getFullYear();
    this.month     = 0;                              // "All months"
    this.financialYear   = '';
    this.assetCategoryId = '';
    this.departmentId    = '';
    this.vendorId        = '';
    this.assetType       = '';
  }
}
