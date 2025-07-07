import { Routes } from '@angular/router';
import { Login } from './login/login';
import { AssetsTable } from './assets/assets-table/assets-table';
import { authGuard } from './auth.guard';
import { AssetsForm } from './assets/assets-form/assets-form';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'assets', component: AssetsTable},
  { path: '**', redirectTo: 'login', pathMatch: 'full' }
];
