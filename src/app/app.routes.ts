import { Routes } from '@angular/router';
import { Login } from './login/login';
import { AssetsTable } from './assets/assets-table/assets-table';
import { authGuard } from './auth.guard';
import { AssetsForm } from './assets/assets-form/assets-form';
import { WarrantyTable } from './assets/warranty-table/warranty-table/warranty-table';
import { WarrantyForm } from './assets/warranty-form/warranty-form';
import { DragAndDrop } from './assets/drag-and-drop/drag-and-drop';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'assets/view', component: AssetsTable },
  { path: 'assets/new', component: AssetsForm },
  { path: 'assets/edit/:id', component: AssetsForm, canActivate: [authGuard] }, 
  { path: 'warranty/view', component: WarrantyTable},
  { path: 'warranty/new', component: WarrantyForm },
  { path: 'warranty/edit/:id', component: WarrantyForm}, 
  { path: 'dashboard', component: DragAndDrop},
  { path: 'ticket', component: DragAndDrop}, // Assuming DragAndDrop is used for ticket management
  { path: '**', redirectTo: 'login', pathMatch: 'full' }
];
