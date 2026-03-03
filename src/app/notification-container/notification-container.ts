import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../services/notification.service';

@Component({
  selector: 'app-notification-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-container.html',
  styleUrls: ['./notification-container.css'],
})
export class NotificationContainer implements OnInit {
  // we keep a local copy so we can play a slide-out animation before
  // actually removing items from the list
  notifications: (Notification & { closing?: boolean })[] = [];

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.notifications$.subscribe((notifs) => {
      const incomingIds = notifs.map(n => n.id);

      // mark items that have been removed by the service and start closing
      this.notifications.forEach(existing => {
        if (!incomingIds.includes(existing.id) && !existing.closing) {
          existing.closing = true;
          setTimeout(() => {
            this.notifications = this.notifications.filter(x => x.id !== existing.id);
          }, 300); // match animation duration in css
        }
      });

      // add new notifications that aren't already present or closing
      const existingIds = this.notifications.map(n => n.id);
      const toAdd = notifs.filter(n => !existingIds.includes(n.id));
      this.notifications = [...this.notifications.filter(n => !n.closing), ...toAdd];
    });
  }

  removeNotification(id: string): void {
    this.notificationService.remove(id);
  }
}
