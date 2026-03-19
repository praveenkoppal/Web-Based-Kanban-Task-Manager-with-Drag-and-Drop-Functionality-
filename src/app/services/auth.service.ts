import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of } from 'rxjs';

export interface UserCredentials {
  username: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly STORAGE_KEY = 'kanban.user';
  private readonly USERS_KEY = 'kanban.users'; // legacy localstorage key

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /**
   * Attempt to register a new account.  Returns false if the username already exists
   * or if storage isn't available.
   */
  register(username: string, password: string): Observable<boolean> {
    if (!username || !password || !this.isBrowser) {
      return of(false);
    }
    const users = this.getAllUsers();
    if (users.some(u => u.username === username)) {
      return of(false);
    }
    users.push({ username, password });
    try {
      window.localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
      return of(true);
    } catch {
      return of(false);
    }
  }

  private getAllUsers(): UserCredentials[] {
    if (!this.isBrowser || !window.localStorage) {
      return [];
    }
    try {
      const raw = window.localStorage.getItem(this.USERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Attempt to log in using stored credentials.  Stores session in localStorage
   * on success.
   */
  login(username: string, password: string): Observable<boolean> {
    if (!username || !password || !this.isBrowser) {
      return of(false);
    }
    const users = this.getAllUsers();
    const found = users.find(u => u.username === username && u.password === password);
    if (found && window.localStorage) {
      try {
        window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(found));
        return of(true);
      } catch {
        return of(false);
      }
    }
    return of(false);
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

  /**
   * Update the currently logged-in user's credentials. The caller must supply
   * the existing password for verification. Either the username or password
   * (or both) may be changed. Returns false if verification fails, the new
   * username is already taken by another account, or storage operations fail.
   */
  updateUser(
    currentPassword: string,
    newUsername: string,
    newPassword?: string
  ): boolean {
    if (!this.isBrowser || !window.localStorage) {
      return false;
    }

    const user = this.getUser();
    if (!user) {
      return false; // not logged in
    }

    // verify current password matches stored value
    if (user.password !== currentPassword) {
      return false;
    }

    const users = this.getAllUsers();
    const index = users.findIndex(
      u => u.username === user.username && u.password === user.password
    );
    if (index === -1) {
      return false; // inconsistent state
    }

    // if username is changing, ensure no duplicate exists
    const trimmed = newUsername.trim();
    if (!trimmed) {
      return false;
    }
    if (trimmed !== user.username) {
      if (users.some(u => u.username === trimmed)) {
        return false; // username already taken
      }
    }

    // perform updates
    users[index].username = trimmed;
    if (newPassword !== undefined && newPassword !== null && newPassword !== '') {
      users[index].password = newPassword;
    }

    try {
      window.localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
      // update active session to reflect new values
      window.localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(users[index])
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Change only the username of the currently logged-in user. Does not
   * require the password to be re-entered, but enforces uniqueness and non‑empty
   * value.
   */
  changeUsername(newUsername: string): boolean {
    if (!this.isBrowser || !window.localStorage) {
      return false;
    }
    const user = this.getUser();
    if (!user) {
      return false;
    }
    const trimmed = newUsername.trim();
    if (!trimmed) {
      return false;
    }

    const users = this.getAllUsers();
    if (users.some(u => u.username === trimmed && u !== user)) {
      return false; // another account already has that name
    }

    // update stored list and session
    const index = users.findIndex(
      u => u.username === user.username && u.password === user.password
    );
    if (index === -1) {
      return false;
    }
    users[index].username = trimmed;
    try {
      window.localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
      window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users[index]));
      return true;
    } catch {
      return false;
    }
  }
}
