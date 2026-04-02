import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';
import { AuthPageComponent } from './pages/auth-page.component';
import { DashboardPageComponent } from './pages/dashboard-page.component';
import { HistoryPageComponent } from './pages/history-page.component';

export const routes: Routes = [
  {
    path: '',
    component: AuthPageComponent,
    title: 'Quantity Measurement App',
    canActivate: [guestGuard]
  },
  {
    path: 'dashboard',
    component: DashboardPageComponent,
    title: 'Dashboard - Quantity Measurement',
    canActivate: [authGuard]
  },
  {
    path: 'history',
    component: HistoryPageComponent,
    title: 'Measurement History - Quantity Measurement',
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '' }
];
