import { Component } from '@angular/core';
import { NotificationContainer } from './notification-container/notification-container';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NotificationContainer, RouterModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  constructor() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/mock-api-worker.js')
        .then((reg) => {
          console.log('Mock API service worker registered:', reg);
        })
        .catch((error) => {
          console.error('Service worker registration failed:', error);
        });
    }
  }
}
