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
  { path: 'assets/view', component: AssetsTable,canActivate: [authGuard] },
  { path: 'assets/new', component: AssetsForm , canActivate: [authGuard]},
  { path: 'assets/edit/:id', component: AssetsForm, canActivate: [authGuard] }, 
  { path: 'warranty/view', component: WarrantyTable, canActivate: [authGuard] },
  { path: 'warranty/new', component: WarrantyForm, canActivate: [authGuard] },
  { path: 'warranty/edit/:id', component: WarrantyForm, canActivate: [authGuard] }, 
  { path: 'dashboard', component: DragAndDrop, canActivate: [authGuard] },
  { path: 'ticket/view', component: TicketingTable, canActivate: [authGuard] },
  { path: 'ticket/new', component: TicketingForm, canActivate: [authGuard] },
  { path: 'ticket/edit/:id', component: TicketingForm, canActivate: [authGuard] }, 
  { path: '**', redirectTo: 'login', pathMatch: 'full' }
];
