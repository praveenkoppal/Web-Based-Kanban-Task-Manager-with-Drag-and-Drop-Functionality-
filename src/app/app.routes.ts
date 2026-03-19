import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { RegisterComponent } from './register/register';
import { Board } from './board/board';
import { Dashboard } from './dashboard/dashboard';
import { AuthGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: Dashboard, canActivate: [AuthGuard] },
  { path: 'board', component: Board, canActivate: [AuthGuard] },
  // wildcard redirect back to login
  { path: '**', redirectTo: 'login' },
];
