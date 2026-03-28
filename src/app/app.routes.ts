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
import { AssetAudit } from './master/asset-audit/asset-audit';

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
  { path: 'asset-audit', component: AssetAudit, canActivate: [authGuard] },
  { path: 'audit-trail', component: AuditTrail, canActivate: [authGuard] },
  {
    path: 'assets/scan/:assetId',
    component: AssetScan
  },
  { path: '**', redirectTo: 'login', pathMatch: 'full' }
];
