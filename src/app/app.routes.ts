import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'signup',
    loadComponent: () => import('./auth/signup/signup.component').then(m => m.SignupComponent)
  },
  {
    path: 'logout',
    loadComponent: () => import('./auth/logout/logout.component').then(m => m.LogoutComponent),
    canActivate: [authGuard]
  },
  {
    path: 'kanban',
    // ✅ FIXED: Removed .component since file is named kanban-board.ts
    loadComponent: () => import('./components/kanban-board/kanban-board').then(m => m.KanbanBoardComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];