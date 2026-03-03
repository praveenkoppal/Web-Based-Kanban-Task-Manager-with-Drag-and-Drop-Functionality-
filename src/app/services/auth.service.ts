import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface UserCredentials {
  username: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly STORAGE_KEY = 'kanban.user';

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  login(username: string, password: string): boolean {
    if (!username || !password) {
      return false;
    }
    if (!this.isBrowser || !window.localStorage) {
      return false;
    }

    const creds: UserCredentials = { username, password };
    try {
      window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(creds));
      return true;
    } catch {
      return false;
    }
  }

  logout(): void {
    if (!this.isBrowser || !window.localStorage) {
      return;
    }
    window.localStorage.removeItem(this.STORAGE_KEY);
  }

  isLoggedIn(): boolean {
    if (!this.isBrowser || !window.localStorage) {
      return false;
    }
    return !!window.localStorage.getItem(this.STORAGE_KEY);
  }

  getUser(): UserCredentials | null {
    if (!this.isBrowser || !window.localStorage) {
      return null;
    }
    const raw = window.localStorage.getItem(this.STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}
