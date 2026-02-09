import { Component } from '@angular/core';
import { Board } from './board/board';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Board],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
}
