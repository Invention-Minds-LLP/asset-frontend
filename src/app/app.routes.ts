import { Routes } from '@angular/router';
import { Login } from './login/login';
import { AssetsTable } from './assets/assets-table/assets-table';
import { authGuard } from './auth.guard';
import { procurementGuard } from './procurement.guard';
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
// import { DepartmentDashboard } from './master/department-dashboard/department-dashboard';
import { HodDashboard } from './master/hod-dashboard/hod-dashboard';
import { GatePass } from './master/gate-pass/gate-pass';
import { GatePassSecurity } from './master/gate-pass-security/gate-pass-security';
import { Notifications } from './master/notifications/notifications';
import { Calibration } from './master/calibration/calibration';
import { SupportMatrix } from './master/support-matrix/support-matrix';
import { Escalation } from './master/escalation/escalation';
import { Acknowledgement } from './master/acknowledgement/acknowledgement';
import { MasterSettings } from './master/master-settings/master-settings';
import { SubtypeSupport } from './master/subtype-support/subtype-support';
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
import { DepreciationAudit } from './master/depreciation-audit/depreciation-audit';
import { UserActivity } from './master/user-activity/user-activity';
import { PreventiveMaintenance } from './master/preventive-maintenance/preventive-maintenance';
import { VendorPerformance } from './master/vendor-performance/vendor-performance';
import { KnowledgeBase } from './master/knowledge-base/knowledge-base';
import { TicketTat } from './master/ticket-tat/ticket-tat';
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
// import { ProcurementTat } from './master/procurement-tat/procurement-tat';
import { WorkOrders } from './master/work-orders/work-orders';
import { StoreManagement } from './master/store-management/store-management';
import { CfoDashboard } from './master/cfo-dashboard/cfo-dashboard';
import { CooDashboard } from './master/coo-dashboard/coo-dashboard';
import { BranchDashboard } from './master/branch-dashboard/branch-dashboard';
import { HeadOfficeDashboard } from './master/head-office-dashboard/head-office-dashboard';
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
import { DataExport } from './master/data-export/data-export';
import { FloorPlanPage } from './master/floor-plan/floor-plan';
import { ExternalAuditor } from './master/external-auditor/external-auditor';
import { LocationApprovals } from './master/location-approvals/location-approvals';
import { TrialAdmin } from './master/trial-admin/trial-admin';
import { TrialBlocked } from './shared/trial-blocked/trial-blocked';
import { AuditorLogin } from './auditor/auditor-login/auditor-login';
import { AuditorAudits } from './auditor/auditor-audits/auditor-audits';
import { AuditorAuditDetail } from './auditor/auditor-audit-detail/auditor-audit-detail';
import { externalAuditGuard } from './external-audit.guard';
// ── Admin / Security registers ──────────────────────────────────────────────
import { VehicleRegister } from './master/vehicle-register/vehicle-register';
import { RentalAssetRegister } from './master/rental-asset-register/rental-asset-register';
import { KeyRegister } from './master/key-register/key-register';
import { IdCardRegister } from './master/id-card-register/id-card-register';
import { GensetLog } from './master/genset-log/genset-log';
import { ElectricityLog } from './master/electricity-log/electricity-log';
import { MaterialInwardRegister } from './master/material-inward-register/material-inward-register';

export const routes: Routes = [
  { path: 'login', component: Login },
  // ── External auditor portal (email-OTP login, scoped to assigned audits) ──
  { path: 'auditor/login', component: AuditorLogin },
  { path: 'auditor/audits', component: AuditorAudits, canActivate: [externalAuditGuard] },
  { path: 'auditor/audits/:id', component: AuditorAuditDetail, canActivate: [externalAuditGuard] },
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
  // { path: 'department-dashboard', component: DepartmentDashboard, canActivate: [authGuard] },
  { path: 'hod-dashboard', component: HodDashboard, canActivate: [authGuard] },
  { path: 'gate-pass', component: GatePass, canActivate: [authGuard] },
  { path: 'gate-pass/security', component: GatePassSecurity, canActivate: [authGuard] },
  { path: 'notifications', component: Notifications, canActivate: [authGuard] },
  { path: 'calibration', component: Calibration, canActivate: [authGuard] },
  { path: 'support-matrix', component: SupportMatrix, canActivate: [authGuard] },
  { path: 'escalation', component: Escalation, canActivate: [authGuard] },
  { path: 'acknowledgement', component: Acknowledgement, canActivate: [authGuard] },
  { path: 'master-settings', component: MasterSettings, canActivate: [authGuard] },
  { path: 'subtype-support', component: SubtypeSupport, canActivate: [authGuard] },
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
  { path: 'depreciation-audit', component: DepreciationAudit, canActivate: [authGuard] },
  { path: 'user-activity', component: UserActivity, canActivate: [authGuard] },
  { path: 'preventive-maintenance', component: PreventiveMaintenance, canActivate: [authGuard] },
  { path: 'vendor-performance', component: VendorPerformance, canActivate: [authGuard] },
  { path: 'knowledge-base', component: KnowledgeBase, canActivate: [authGuard] },
  { path: 'ticket-tat', component: TicketTat, canActivate: [authGuard] },
  { path: 'notification-preferences', component: NotificationPreferences, canActivate: [authGuard] },
  { path: 'asset-indent', component: AssetIndent, canActivate: [authGuard] },
  { path: 'employee-exit', component: EmployeeExit, canActivate: [authGuard] },
  { path: 'department-assets', component: DepartmentAssets, canActivate: [authGuard] },
  { path: 'my-assets', component: MyAssets, canActivate: [authGuard] },
  { path: 'cost-analysis', component: CostAnalysis, canActivate: [authGuard] },
  { path: 'sub-assets', component: SubAssets, canActivate: [authGuard] },
  { path: 'decision-engine', component: DecisionEngine, canActivate: [authGuard] },
  { path: 'purchase-orders', component: PurchaseOrders, canActivate: [authGuard, procurementGuard] },
  { path: 'goods-receipts', component: GoodsReceipts, canActivate: [authGuard, procurementGuard] },
  // { path: 'procurement-tat', component: ProcurementTat, canActivate: [authGuard] },
  { path: 'work-orders', component: WorkOrders, canActivate: [authGuard] },
  { path: 'store-management', component: StoreManagement, canActivate: [authGuard] },
  { path: 'cfo-dashboard', component: CfoDashboard, canActivate: [authGuard] },
  { path: 'branch-dashboard', component: BranchDashboard, canActivate: [authGuard] },
  { path: 'head-office', component: HeadOfficeDashboard, canActivate: [authGuard] },
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
  { path: 'data-export', component: DataExport, canActivate: [authGuard] },
  { path: 'floor-plan', component: FloorPlanPage, canActivate: [authGuard] },
  { path: 'external-auditors', component: ExternalAuditor, canActivate: [authGuard] },
  { path: 'location-approvals', component: LocationApprovals, canActivate: [authGuard] },
  // ── Admin / Security registers ────────────────────────────────────────────
  { path: 'vehicle-register', component: VehicleRegister, canActivate: [authGuard] },
  { path: 'rental-asset-register', component: RentalAssetRegister, canActivate: [authGuard] },
  { path: 'key-register', component: KeyRegister, canActivate: [authGuard] },
  { path: 'id-card-register', component: IdCardRegister, canActivate: [authGuard] },
  { path: 'genset-log', component: GensetLog, canActivate: [authGuard] },
  { path: 'electricity-log', component: ElectricityLog, canActivate: [authGuard] },
  { path: 'material-inward-register', component: MaterialInwardRegister, canActivate: [authGuard] },
  {
    path: 'assets/scan/:assetId',
    component: AssetScan
  },
  // Demo trial screens. Neither sits behind authGuard: the console authenticates
  // with its own admin key, and the blocked screen has to render precisely when
  // the session has just been torn down.
  { path: 'trial-admin', component: TrialAdmin },
  { path: 'trial-blocked', component: TrialBlocked },
  { path: '**', redirectTo: 'login', pathMatch: 'full' }
];
