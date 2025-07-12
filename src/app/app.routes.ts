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

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'assets/view', component: AssetsTable },
  { path: 'assets/new', component: AssetsForm },
  { path: 'assets/edit/:id', component: AssetsForm, canActivate: [authGuard] }, 
  { path: 'warranty/view', component: WarrantyTable},
  { path: 'warranty/new', component: WarrantyForm },
  { path: 'warranty/edit/:id', component: WarrantyForm}, 
  { path: 'dashboard', component: DragAndDrop},
  { path: 'ticket/view', component: TicketingTable},
  { path: 'ticket/new', component: TicketingForm},
  { path: 'ticket/edit/:id', component: TicketingForm}, 
  { path: '**', redirectTo: 'login', pathMatch: 'full' }
];
