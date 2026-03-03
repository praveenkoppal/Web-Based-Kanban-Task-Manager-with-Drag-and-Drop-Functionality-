import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { Board } from './board/board';
import { AuthGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'board', component: Board, canActivate: [AuthGuard] },
  // wildcard redirect back to login
  { path: '**', redirectTo: 'login' },
];
