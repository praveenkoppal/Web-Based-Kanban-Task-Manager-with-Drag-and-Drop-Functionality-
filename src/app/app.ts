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
}
