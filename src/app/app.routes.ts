import { Routes } from '@angular/router';
import { Login } from './login/login';
import { AssetsTable } from './assets/assets-table/assets-table';
import { authGuard } from './auth.guard';
import { AssetsForm } from './assets/assets-form/assets-form';
import { WarrantyTable } from './warranty/warranty-table/warranty-table/warranty-table';
import { WarrantyForm } from './warranty/warranty-form/warranty-form';
import { DragAndDrop } from './drag-and-drop/drag-and-drop';
import { TicketingTable } from './tickerting/ticketing-table/ticketing-table';
import { TicketingForm } from './tickerting/ticketing-form/ticketing-form';
import { AssetAssignment } from './assets/asset-assignment/asset-assignment';
import { Settings } from './settings/settings/settings';
import { AssetImports } from './asset-imports/asset-imports/asset-imports';
import { AssetScan } from './assets/asset-scan/asset-scan';
import { SlaMatrix } from './master/sla-matrix/sla-matrix';
import { Inventory } from './master/inventory/inventory';
import { AssetTransfer } from './asset-transfer/asset-transfer';
import { Dashboard } from './master/dashboard/dashboard';
import { GatePass } from './master/gate-pass/gate-pass';
import { Notifications } from './master/notifications/notifications';
import { Calibration } from './master/calibration/calibration';
import { SupportMatrix } from './master/support-matrix/support-matrix';
import { Escalation } from './master/escalation/escalation';
import { Acknowledgement } from './master/acknowledgement/acknowledgement';
import { MasterSettings } from './master/master-settings/master-settings';
import { ModuleAccess } from './master/module-access/module-access';
import { FinancialDashboard } from './master/financial-dashboard/financial-dashboard';
import { AuditTrail } from './master/audit-trail/audit-trail';
import { Reports } from './master/reports/reports';
import { Disposal } from './master/disposal/disposal';
import { EWaste } from './master/e-waste/e-waste';
import { AssetAudit } from './master/asset-audit/asset-audit';
import { InsuranceManagement } from './master/insurance-management/insurance-management';
import { WarrantyManagement } from './master/warranty-management/warranty-management';
import { ServiceContracts } from './master/service-contracts/service-contracts';
import { DocumentVault } from './master/document-vault/document-vault';
import { BatchDepreciation } from './master/batch-depreciation/batch-depreciation';
import { UserActivity } from './master/user-activity/user-activity';
import { PreventiveMaintenance } from './master/preventive-maintenance/preventive-maintenance';
import { VendorPerformance } from './master/vendor-performance/vendor-performance';
import { KnowledgeBase } from './master/knowledge-base/knowledge-base';
import { NotificationPreferences } from './master/notification-preferences/notification-preferences';
import { AssetIndent } from './master/asset-indent/asset-indent';
import { EmployeeExit } from './master/employee-exit/employee-exit';
import { DepartmentAssets } from './master/department-assets/department-assets';
import { MyAssets } from './master/my-assets/my-assets';
import { CostAnalysis } from './master/cost-analysis/cost-analysis';
import { SubAssets } from './master/sub-assets/sub-assets';
import { DecisionEngine } from './master/decision-engine/decision-engine';
import { PurchaseOrders } from './master/purchase-orders/purchase-orders';
import { GoodsReceipts } from './master/goods-receipts/goods-receipts';
import { WorkOrders } from './master/work-orders/work-orders';
import { StoreManagement } from './master/store-management/store-management';
import { CfoDashboard } from './master/cfo-dashboard/cfo-dashboard';
import { CooDashboard } from './master/coo-dashboard/coo-dashboard';
import { TenantConfig } from './master/tenant-config/tenant-config';
import { RevenueLog } from './master/revenue-log/revenue-log';
import { EmailTemplates } from './master/email-templates/email-templates';
import { PmChecklist } from './master/pm-checklist/pm-checklist';
import { AccountsDashboard } from './accounts/accounts-dashboard/accounts-dashboard';
import { ChartOfAccounts } from './accounts/chart-of-accounts/chart-of-accounts';
import { PurchaseVouchers } from './accounts/purchase-vouchers/purchase-vouchers';
import { PaymentVouchers } from './accounts/payment-vouchers/payment-vouchers';
import { JournalEntries } from './accounts/journal-entries/journal-entries';
import { AccountLedger } from './accounts/account-ledger/account-ledger';
import { ServiceInvoices } from './accounts/service-invoices/service-invoices';
import { LegacyMigration } from './master/legacy-migration/legacy-migration';
import { Reconciliation } from './master/reconciliation/reconciliation';
import { FixedAssetsSchedule } from './master/fixed-assets-schedule/fixed-assets-schedule';
import { FinanceCentre } from './master/finance-centre/finance-centre';
import { RcaPage } from './master/rca/rca';
import { QuickActionsPage } from './master/quick-actions/quick-actions';
import { HierarchyConfig } from './master/hierarchy-config/hierarchy-config';
import { ApprovalConfigComponent } from './master/approval-config/approval-config';
import { AssetPoolPage } from './master/asset-pool/asset-pool';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'assets/view', component: AssetsTable, canActivate: [authGuard] },
  { path: 'assets/new', component: AssetsForm, canActivate: [authGuard] },
  { path: 'assets/assignments', component: AssetAssignment, canActivate: [authGuard] },
  { path: 'assets/edit/:id', component: AssetsForm, canActivate: [authGuard] },
  { path: 'warranty/view', component: WarrantyTable, canActivate: [authGuard] },
  { path: 'warranty/new', component: WarrantyForm, canActivate: [authGuard] },
  { path: 'warranty/edit/:id', component: WarrantyForm, canActivate: [authGuard] },
  { path: 'dashboard', component: DragAndDrop, canActivate: [authGuard] },
  { path: 'ticket/view', component: TicketingTable, canActivate: [authGuard] },
  { path: 'ticket/new', component: TicketingForm, canActivate: [authGuard] },
  { path: 'ticket/edit/:id', component: TicketingForm, canActivate: [authGuard] },
  { path: 'settings', component: Settings, canActivate: [authGuard] },
  { path: 'import', component: AssetImports, canActivate: [authGuard] },
  { path: 'sla', component: SlaMatrix, canActivate: [authGuard] },
  { path: 'master', component: Inventory, canActivate: [authGuard] },
  { path: 'transfer', component: AssetTransfer, canActivate: [authGuard] },
  // ── New master module routes ────────────────────────────────────────────────
  { path: 'master-dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'gate-pass', component: GatePass, canActivate: [authGuard] },
  { path: 'notifications', component: Notifications, canActivate: [authGuard] },
  { path: 'calibration', component: Calibration, canActivate: [authGuard] },
  { path: 'support-matrix', component: SupportMatrix, canActivate: [authGuard] },
  { path: 'escalation', component: Escalation, canActivate: [authGuard] },
  { path: 'acknowledgement', component: Acknowledgement, canActivate: [authGuard] },
  { path: 'master-settings', component: MasterSettings, canActivate: [authGuard] },
  { path: 'module-access', component: ModuleAccess, canActivate: [authGuard] },
  { path: 'financial-dashboard', component: FinancialDashboard, canActivate: [authGuard] },
  { path: 'reports', component: Reports, canActivate: [authGuard] },
  { path: 'disposal', component: Disposal, canActivate: [authGuard] },
  { path: 'e-waste', component: EWaste, canActivate: [authGuard] },
  { path: 'asset-audit', component: AssetAudit, canActivate: [authGuard] },
  { path: 'audit-trail', component: AuditTrail, canActivate: [authGuard] },
  // ── New feature routes ──────────────────────────────────────────────────────
  { path: 'insurance-management', component: InsuranceManagement, canActivate: [authGuard] },
  { path: 'warranty-management', component: WarrantyManagement, canActivate: [authGuard] },
  { path: 'service-contracts', component: ServiceContracts, canActivate: [authGuard] },
  { path: 'document-vault', component: DocumentVault, canActivate: [authGuard] },
  { path: 'batch-depreciation', component: BatchDepreciation, canActivate: [authGuard] },
  { path: 'user-activity', component: UserActivity, canActivate: [authGuard] },
  { path: 'preventive-maintenance', component: PreventiveMaintenance, canActivate: [authGuard] },
  { path: 'vendor-performance', component: VendorPerformance, canActivate: [authGuard] },
  { path: 'knowledge-base', component: KnowledgeBase, canActivate: [authGuard] },
  { path: 'notification-preferences', component: NotificationPreferences, canActivate: [authGuard] },
  { path: 'asset-indent', component: AssetIndent, canActivate: [authGuard] },
  { path: 'employee-exit', component: EmployeeExit, canActivate: [authGuard] },
  { path: 'department-assets', component: DepartmentAssets, canActivate: [authGuard] },
  { path: 'my-assets', component: MyAssets, canActivate: [authGuard] },
  { path: 'cost-analysis', component: CostAnalysis, canActivate: [authGuard] },
  { path: 'sub-assets', component: SubAssets, canActivate: [authGuard] },
  { path: 'decision-engine', component: DecisionEngine, canActivate: [authGuard] },
  { path: 'purchase-orders', component: PurchaseOrders, canActivate: [authGuard] },
  { path: 'goods-receipts', component: GoodsReceipts, canActivate: [authGuard] },
  { path: 'work-orders', component: WorkOrders, canActivate: [authGuard] },
  { path: 'store-management', component: StoreManagement, canActivate: [authGuard] },
  { path: 'cfo-dashboard', component: CfoDashboard, canActivate: [authGuard] },
  { path: 'coo-dashboard', component: CooDashboard, canActivate: [authGuard] },
  { path: 'tenant-config', component: TenantConfig, canActivate: [authGuard] },
  { path: 'revenue-log', component: RevenueLog, canActivate: [authGuard] },
  { path: 'email-templates', component: EmailTemplates, canActivate: [authGuard] },
  { path: 'pm-checklist', component: PmChecklist, canActivate: [authGuard] },
  // ── Accounts Module ─────────────────────────────────────────────────────────
  { path: 'accounts/dashboard', component: AccountsDashboard, canActivate: [authGuard] },
  { path: 'accounts/chart-of-accounts', component: ChartOfAccounts, canActivate: [authGuard] },
  { path: 'accounts/purchase-vouchers', component: PurchaseVouchers, canActivate: [authGuard] },
  { path: 'accounts/payment-vouchers', component: PaymentVouchers, canActivate: [authGuard] },
  { path: 'accounts/journal-entries', component: JournalEntries, canActivate: [authGuard] },
  { path: 'accounts/ledger', component: AccountLedger, canActivate: [authGuard] },
  { path: 'accounts/service-invoices', component: ServiceInvoices, canActivate: [authGuard] },
  { path: 'legacy-migration', component: LegacyMigration, canActivate: [authGuard] },
  { path: 'reconciliation',   component: Reconciliation, canActivate: [authGuard] },
  { path: 'fixed-assets-schedule', component: FixedAssetsSchedule, canActivate: [authGuard] },
  { path: 'finance-centre', component: FinanceCentre, canActivate: [authGuard] },
  { path: 'rca', component: RcaPage, canActivate: [authGuard] },
  { path: 'quick-actions', component: QuickActionsPage, canActivate: [authGuard] },
  { path: 'hierarchy-config', component: HierarchyConfig, canActivate: [authGuard] },
  { path: 'approval-config', component: ApprovalConfigComponent, canActivate: [authGuard] },
  { path: 'asset-pool', component: AssetPoolPage, canActivate: [authGuard] },
  {
    path: 'assets/scan/:assetId',
    component: AssetScan
  },
  { path: '**', redirectTo: 'login', pathMatch: 'full' }
];
