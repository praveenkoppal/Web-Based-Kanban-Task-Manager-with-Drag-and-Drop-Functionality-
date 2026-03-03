import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  CanActivate,
  Router,
  UrlTree,
} from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  canActivate(): boolean | UrlTree {
    // allow server to render without redirecting; only guard in browser
    if (!isPlatformBrowser(this.platformId)) {
      return true;
    }

    if (this.auth.isLoggedIn()) {
      return true;
    }
    return this.router.createUrlTree(['/login']);
  }
}
