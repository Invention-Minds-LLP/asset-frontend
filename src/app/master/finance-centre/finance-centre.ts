import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TabViewModule } from 'primeng/tabview';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { FinanceService } from '../../services/finance/finance';

@Component({
  selector: 'app-finance-centre',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TableModule, TagModule,
    ToastModule, TabViewModule, InputTextModule, SelectModule, DialogModule,
    ProgressBarModule, CardModule, TooltipModule
  ],
  templateUrl: './finance-centre.html',
  styleUrl: './finance-centre.css',
  providers: [MessageService]
})
export class FinanceCentre implements OnInit {
  userRole = localStorage.getItem('role') || '';
  isFinance = this.userRole === 'FINANCE';
  isCeo = this.userRole === 'CEO_COO';
  canManage = this.isFinance || this.isCeo;

  // Mode helpers — read after config is loaded
  get isStandalone(): boolean { return this.config.accountingMode === 'STANDALONE' || !this.config.accountingMode; }
  get isExport(): boolean { return this.config.accountingMode === 'EXPORT'; }
  get isHybrid(): boolean { return this.config.accountingMode === 'HYBRID'; }

  // Tab visibility by mode
  get showTrialBalance(): boolean { return this.isStandalone || this.isHybrid; }
  get showDeptCost(): boolean { return this.isStandalone || this.isHybrid; }
  get showExportCentre(): boolean { return this.isExport || this.isHybrid; }
  // Voucher approve/reject: shown in all modes (EXPORT still needs draft vouchers for tracking before export)
  // Export target selector: only relevant in EXPORT or HYBRID
  get showExportTarget(): boolean { return this.isExport || this.isHybrid; }

  // Config
  config: any = {};
  configLoading = false;
  configSaving = false;
  accountingModeOptions = [
    { label: 'Standalone (internal ledger)', value: 'STANDALONE' },
    { label: 'Export Only (Tally/SAP/Zoho)', value: 'EXPORT' },
    { label: 'Hybrid (both)', value: 'HYBRID' }
  ];
  exportTargetOptions = [
    { label: 'Tally Prime XML', value: 'TALLY_PRIME_XML' },
    { label: 'Tally ERP9 CSV', value: 'TALLY_ERP9_CSV' },
    { label: 'SAP CSV', value: 'SAP_CSV' },
    { label: 'Zoho Books', value: 'ZOHO_BOOKS' },
    { label: 'QuickBooks', value: 'QUICKBOOKS' },
    { label: 'Excel Generic', value: 'EXCEL_GENERIC' },
  ];

  // Vouchers
  vouchers: any[] = [];
  vouchersTotal = 0;
  vouchersLoading = false;
  voucherFilter = { status: '', sourceType: '', from: '', to: '' };
  statusOptions = [
    { label: 'All', value: '' },
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
    { label: 'Posted', value: 'POSTED' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'Void', value: 'VOID' },
  ];
  sourceOptions = [
    { label: 'All', value: '' },
    { label: 'Asset Purchase', value: 'ASSET_PURCHASE' },
    { label: 'Asset Disposal', value: 'ASSET_DISPOSAL' },
    { label: 'Depreciation', value: 'DEPRECIATION_BATCH' },
    { label: 'Maintenance', value: 'MAINTENANCE' },
    { label: 'Insurance', value: 'INSURANCE' },
    { label: 'Manual', value: 'MANUAL' },
  ];

  // Voucher detail dialog
  selectedVoucher: any = null;
  voucherDetailVisible = false;

  // New voucher dialog
  newVoucherVisible = false;
  newVoucher = { voucherDate: '', narration: '', sourceType: 'MANUAL', lines: [] as any[] };
  accounts: any[] = [];
  departments: any[] = [];

  // Reject dialog
  rejectVoucherId = 0;
  rejectReason = '';
  rejectDialogVisible = false;

  // Trial Balance
  trialBalance: any = null;
  tbLoading = false;
  tbFrom = '';
  tbTo = '';

  // Department Cost Summary
  deptSummary: any[] = [];
  deptSummaryLoading = false;
  deptSummaryFY = new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1;

  // Capex Budgets
  capexBudgets: any[] = [];
  capexTotals = { budget: 0, actual: 0 };
  capexLoading = false;
  capexFY = new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1;
  newBudgetVisible = false;
  newBudget = { fiscalYear: this.capexFY, departmentId: null, categoryId: null, budgetAmount: 0, notes: '' };
  allDepts: any[] = [];
  allCategories: any[] = [];

  // Export Batches
  exportBatches: any[] = [];
  exportBatchesLoading = false;
  newBatchVisible = false;
  newBatch = { from: '', to: '', exportTarget: 'TALLY_PRIME_XML' };
  batchCreating = false;

  // GL Mappings
  glMappings: any[] = [];
  glMappingsLoading = false;
  glMapDialogVisible = false;
  selectedGLMap: any = {};
  selectedCategoryId = 0;

  // Manual Ledger
  manualEntries: any[] = [];
  manualLoading = false;
  newEntryVisible = false;
  newEntry = { entryDate: '', narration: '', amount: 0, entryType: 'NOTE', referenceNo: '' };
  entryTypeOptions = [
    { label: 'Note', value: 'NOTE' },
    { label: 'Adjustment', value: 'ADJUSTMENT' },
    { label: 'Memo', value: 'MEMO' },
  ];

  constructor(private financeService: FinanceService, private messageService: MessageService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadConfig();
    this.loadAccounts();
  }

  // ── Config ──────────────────────────────────────────────────────────────────
  loadConfig() {
    this.configLoading = true;
    this.financeService.getConfig().subscribe({
      next: (c) => { this.config = c; this.configLoading = false; this.cdr.detectChanges(); },
      error: () => { this.configLoading = false; }
    });
  }

  saveConfig() {
    if (!this.isFinance) return;
    this.configSaving = true;
    this.financeService.updateConfig(this.config).subscribe({
      next: (c) => {
        this.config = c;
        this.configSaving = false;
        this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Finance config updated' });
        this.cdr.detectChanges();
      },
      error: () => { this.configSaving = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save config' }); }
    });
  }

  // ── Accounts ────────────────────────────────────────────────────────────────
  loadAccounts() {
    this.financeService.getChartOfAccounts().subscribe({ next: (a) => { this.accounts = a; this.cdr.detectChanges(); } });
  }

  // ── Vouchers ────────────────────────────────────────────────────────────────
  loadVouchers() {
    this.vouchersLoading = true;
    this.financeService.getVouchers(this.voucherFilter).subscribe({
      next: (res) => {
        this.vouchers = res.data || res;
        this.vouchersTotal = res.total || this.vouchers.length;
        this.vouchersLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.vouchersLoading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load vouchers' }); }
    });
  }

  openVoucherDetail(v: any) {
    this.selectedVoucher = v;
    this.voucherDetailVisible = true;
  }

  approveVoucher(id: number) {
    this.financeService.approveVoucher(id).subscribe({
      next: () => { this.messageService.add({ severity: 'success', summary: 'Approved', detail: 'Voucher posted' }); this.loadVouchers(); },
      error: (e) => this.messageService.add({ severity: 'error', summary: 'Error', detail: e.error?.error || 'Failed' })
    });
  }

  openRejectVoucher(id: number) { this.rejectVoucherId = id; this.rejectReason = ''; this.rejectDialogVisible = true; }

  submitRejectVoucher() {
    this.financeService.rejectVoucher(this.rejectVoucherId, this.rejectReason).subscribe({
      next: () => {
        this.rejectDialogVisible = false;
        this.messageService.add({ severity: 'warn', summary: 'Rejected', detail: 'Voucher rejected' });
        this.loadVouchers();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to reject' })
    });
  }

  voidVoucher(id: number) {
    this.financeService.voidVoucher(id).subscribe({
      next: () => { this.messageService.add({ severity: 'info', summary: 'Voided', detail: 'Voucher voided' }); this.loadVouchers(); },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to void' })
    });
  }

  openNewVoucher() {
    this.newVoucher = { voucherDate: new Date().toISOString().split('T')[0], narration: '', sourceType: 'MANUAL', lines: [
      { accountId: null, debit: 0, credit: 0, narration: '' },
      { accountId: null, debit: 0, credit: 0, narration: '' }
    ]};
    this.newVoucherVisible = true;
  }

  addVoucherLine() { this.newVoucher.lines.push({ accountId: null, debit: 0, credit: 0, narration: '' }); }
  removeVoucherLine(i: number) { this.newVoucher.lines.splice(i, 1); }

  get voucherDebitTotal(): number { return this.newVoucher.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0); }
  get voucherCreditTotal(): number { return this.newVoucher.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0); }
  get voucherBalanced(): boolean { return Math.abs(this.voucherDebitTotal - this.voucherCreditTotal) < 0.01; }

  saveNewVoucher() {
    if (!this.voucherBalanced) { this.messageService.add({ severity: 'warn', summary: 'Not Balanced', detail: 'Debit must equal Credit' }); return; }
    this.financeService.createVoucher(this.newVoucher).subscribe({
      next: () => {
        this.newVoucherVisible = false;
        this.messageService.add({ severity: 'success', summary: 'Created', detail: 'Voucher created as Draft' });
        this.loadVouchers();
      },
      error: (e) => this.messageService.add({ severity: 'error', summary: 'Error', detail: e.error?.error || 'Failed to create voucher' })
    });
  }

  // ── Trial Balance ────────────────────────────────────────────────────────────
  loadTrialBalance() {
    this.tbLoading = true;
    this.financeService.getTrialBalance({ from: this.tbFrom || undefined, to: this.tbTo || undefined }).subscribe({
      next: (tb) => { this.trialBalance = tb; this.tbLoading = false; this.cdr.detectChanges(); },
      error: () => { this.tbLoading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load trial balance' }); }
    });
  }

  // ── Department Cost Summary ──────────────────────────────────────────────────
  loadDeptSummary() {
    this.deptSummaryLoading = true;
    this.financeService.getDepartmentCostSummary(this.deptSummaryFY).subscribe({
      next: (d) => { this.deptSummary = d; this.deptSummaryLoading = false; this.cdr.detectChanges(); },
      error: () => { this.deptSummaryLoading = false; }
    });
  }

  // ── Capex Budgets ────────────────────────────────────────────────────────────
  loadCapexBudgets() {
    this.capexLoading = true;
    this.financeService.getCapexBudgets(this.capexFY).subscribe({
      next: (res) => { this.capexBudgets = res.budgets || []; this.capexTotals = res.totals || { budget: 0, actual: 0 }; this.capexLoading = false; this.cdr.detectChanges(); },
      error: () => { this.capexLoading = false; }
    });
  }

  get capexVariance(): number { return this.capexTotals.budget - this.capexTotals.actual; }

  openNewBudget() {
    this.newBudget = { fiscalYear: this.capexFY, departmentId: null, categoryId: null, budgetAmount: 0, notes: '' };
    this.newBudgetVisible = true;
  }

  saveNewBudget() {
    this.financeService.createCapexBudget(this.newBudget).subscribe({
      next: () => { this.newBudgetVisible = false; this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Budget created' }); this.loadCapexBudgets(); },
      error: (e) => this.messageService.add({ severity: 'error', summary: 'Error', detail: e.error?.error || 'Failed' })
    });
  }

  refreshActuals() {
    this.financeService.refreshCapexActuals(this.capexFY).subscribe({
      next: () => { this.messageService.add({ severity: 'success', summary: 'Done', detail: 'Actuals refreshed from asset purchases' }); this.loadCapexBudgets(); },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to refresh actuals' })
    });
  }

  getCapexPct(b: any): number {
    const budget = +b.budgetAmount;
    if (!budget) return 0;
    return +((+b.actualAmount / budget) * 100).toFixed(1);
  }

  getCapexSeverity(b: any): 'success' | 'warn' | 'danger' {
    const pct = +b.actualAmount / +b.budgetAmount;
    if (pct >= 1) return 'danger';
    if (pct >= 0.8) return 'warn';
    return 'success';
  }

  // ── Export Centre ────────────────────────────────────────────────────────────
  loadExportBatches() {
    this.exportBatchesLoading = true;
    this.financeService.getExportBatches().subscribe({
      next: (b) => { this.exportBatches = b; this.exportBatchesLoading = false; this.cdr.detectChanges(); },
      error: () => { this.exportBatchesLoading = false; }
    });
  }

  openNewBatch() { this.newBatch = { from: '', to: '', exportTarget: 'TALLY_PRIME_XML' }; this.newBatchVisible = true; }

  createExportBatch() {
    this.batchCreating = true;
    this.financeService.createExportBatch(this.newBatch).subscribe({
      next: () => { this.newBatchVisible = false; this.batchCreating = false; this.messageService.add({ severity: 'success', summary: 'Batch Created', detail: 'Ready to download' }); this.loadExportBatches(); },
      error: (e) => { this.batchCreating = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: e.error?.error || 'Failed' }); }
    });
  }

  downloadBatch(batch: any) {
    this.financeService.downloadExportBatch(batch.id).subscribe({
      next: (blob) => {
        const ext = batch.exportTarget === 'TALLY_PRIME_XML' ? 'xml' : batch.exportTarget === 'EXCEL_GENERIC' ? 'xlsx' : 'csv';
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${batch.batchNo}.${ext}`; a.click();
        URL.revokeObjectURL(url);
        this.loadExportBatches();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Download failed' })
    });
  }

  getBatchSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' {
    return status === 'DONE' ? 'success' : status === 'FAILED' ? 'danger' : status === 'PROCESSING' ? 'warn' : 'info';
  }

  // ── GL Mappings ──────────────────────────────────────────────────────────────
  loadGLMappings() {
    this.glMappingsLoading = true;
    this.financeService.getGLMappings().subscribe({
      next: (m) => { this.glMappings = m; this.glMappingsLoading = false; this.cdr.detectChanges(); },
      error: () => { this.glMappingsLoading = false; }
    });
  }

  openGLMapDialog(mapping: any) {
    this.selectedCategoryId = mapping.assetCategoryId || mapping.id;
    this.selectedGLMap = { ...mapping };
    this.glMapDialogVisible = true;
  }

  saveGLMapping() {
    this.financeService.upsertGLMapping(this.selectedCategoryId, this.selectedGLMap).subscribe({
      next: () => { this.glMapDialogVisible = false; this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'GL Mapping updated' }); this.loadGLMappings(); },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save GL mapping' })
    });
  }

  // ── Manual Ledger ────────────────────────────────────────────────────────────
  loadManualLedger() {
    this.manualLoading = true;
    this.financeService.getManualLedger().subscribe({
      next: (e) => { this.manualEntries = e; this.manualLoading = false; this.cdr.detectChanges(); },
      error: () => { this.manualLoading = false; }
    });
  }

  openNewEntry() { this.newEntry = { entryDate: new Date().toISOString().split('T')[0], narration: '', amount: 0, entryType: 'NOTE', referenceNo: '' }; this.newEntryVisible = true; }

  saveEntry() {
    this.financeService.createManualLedger(this.newEntry).subscribe({
      next: () => { this.newEntryVisible = false; this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Entry recorded' }); this.loadManualLedger(); },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save entry' })
    });
  }

  deleteEntry(id: number) {
    this.financeService.deleteManualLedger(id).subscribe({
      next: () => { this.messageService.add({ severity: 'warn', summary: 'Deleted', detail: 'Entry removed' }); this.loadManualLedger(); },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete' })
    });
  }

  // ── Tab Change ───────────────────────────────────────────────────────────────
  onTabChange(event: any) {
    switch (event.index) {
      case 0: break; // config loaded on init
      case 1: if (!this.vouchers.length) this.loadVouchers(); break;
      case 2: if (!this.trialBalance) this.loadTrialBalance(); break;
      case 3: if (!this.deptSummary.length) this.loadDeptSummary(); break;
      case 4: if (!this.capexBudgets.length) this.loadCapexBudgets(); break;
      case 5: if (!this.exportBatches.length) this.loadExportBatches(); break;
      case 6: if (!this.glMappings.length) this.loadGLMappings(); break;
      case 7: if (!this.manualEntries.length) this.loadManualLedger(); break;
    }
  }

  // ── Utilities ────────────────────────────────────────────────────────────────
  formatCurrency(val: any): string {
    if (val == null) return '₹0';
    return '₹' + Number(val).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  getVoucherSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    const map: any = { POSTED: 'success', DRAFT: 'warn', PENDING_APPROVAL: 'info', REJECTED: 'danger', VOID: 'secondary' };
    return map[status] || 'secondary';
  }

  getAccountName(id: number): string {
    return this.accounts.find(a => a.id === id)?.name || `Account #${id}`;
  }
}
