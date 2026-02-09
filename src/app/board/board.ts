import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Column } from '../column/column';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, Column],
  templateUrl: './board.html',
  styleUrls: ['./board.css'],
})
export class Board {
  columns = [
    { title: 'To Do', status: 'todo' },
    { title: 'In Progress', status: 'in-progress' },
    { title: 'Done', status: 'done' },
  ];

  onTaskDeleted(taskId: number): void {
    console.log(`Task ${taskId} deleted`);
  }
}
