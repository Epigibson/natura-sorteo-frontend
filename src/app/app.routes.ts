import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'sorteos/nuevo',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/raffle-create/raffle-create.component').then(
        (m) => m.RaffleCreateComponent,
      ),
  },
  {
    path: 'participantes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/participants/participants.component').then(
        (m) => m.ParticipantsComponent,
      ),
  },
  {
    path: 'sorteos/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/raffle-detail/raffle-detail.component').then(
        (m) => m.RaffleDetailComponent,
      ),
  },
  {
    path: 'jugar/:slug',
    loadComponent: () =>
      import('./pages/play/play.component').then((m) => m.PlayComponent),
  },
  {
    path: 'sorteo/:slug',
    loadComponent: () =>
      import('./pages/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'sorteo/:slug/tablero',
    loadComponent: () =>
      import('./pages/board/board.component').then((m) => m.BoardComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
];
