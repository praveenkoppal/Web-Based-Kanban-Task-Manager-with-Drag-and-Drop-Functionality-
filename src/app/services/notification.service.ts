import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  // always shown for two seconds; we keep the field in case UI needs it
  duration?: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  private nextId = 0;
  // track timeouts so we can clear them if notifications are removed early
  private timers: Record<string, any> = {};

  constructor() {}

  // the service now enforces a fixed two‑second display time. callers no
  // longer supply a duration value.
  show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info'): void {
    // ignore empty or whitespace-only messages
    if (!message || !message.toString().trim()) return;

    const id = `notif-${++this.nextId}`;
    const effectiveDuration = 2000; // always two seconds
    console.log("praveen");
    const notification: Notification = { id, message, type, duration: effectiveDuration };

    const current = this.notificationsSubject.value;
    this.notificationsSubject.next([...current, notification]);

    if (effectiveDuration && effectiveDuration > 0) {
      this.timers[id] = setTimeout(() => {
        this.remove(id);
        delete this.timers[id];
      }, effectiveDuration);
    }
  }

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error');
  }

  info(message: string): void {
    this.show(message, 'info');
  }

  warning(message: string): void {
    this.show(message, 'warning');
  }

  remove(id: string): void {
    const current = this.notificationsSubject.value;
    this.notificationsSubject.next(current.filter(n => n.id !== id));
    // clear any pending timeout
    if (this.timers[id]) {
      clearTimeout(this.timers[id]);
      delete this.timers[id];
    }
  }

  clear(): void {
    // clear pending timers
    Object.keys(this.timers).forEach(id => {
      clearTimeout(this.timers[id]);
      delete this.timers[id];
    });
    this.notificationsSubject.next([]);
  }
}
