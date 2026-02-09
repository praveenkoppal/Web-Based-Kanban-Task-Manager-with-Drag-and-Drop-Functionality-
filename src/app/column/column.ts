import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task, TaskItem } from '../task/task';

@Component({
  selector: 'app-column',
  standalone: true,
  imports: [CommonModule, Task],
  templateUrl: './column.html',
  styleUrls: ['./column.css'],
})
export class Column implements OnInit {
  @Input() title!: string;
  @Input() status!: string;
  @Output() taskDeleted = new EventEmitter<number>();

  tasks: TaskItem[] = [];

  ngOnInit(): void {
    this.loadSampleTasks();
  }

  loadSampleTasks(): void {
    const sampleTasks: { [key: string]: TaskItem[] } = {
      'To Do': [
        { id: 1, title: 'Design UI mockups', description: 'Create mockups for the dashboard' },
        { id: 2, title: 'Setup database', description: 'Configure PostgreSQL database' },
      ],
      'In Progress': [
        { id: 3, title: 'Implement authentication', description: 'Add login and signup features' },
        { id: 4, title: 'Build API endpoints', description: 'Create REST API endpoints' },
      ],
      'Done': [
        { id: 5, title: 'Project setup', description: 'Initialize Angular project' },
        { id: 6, title: 'Git repository', description: 'Setup GitHub repository' },
      ],
    };

    this.tasks = sampleTasks[this.title] || [];
  }

  addTask(): void {
    const newTask: TaskItem = {
      id: Math.max(...this.tasks.map(t => t.id), 0) + 1,
      title: 'New Task',
      description: 'Click to edit',
    };
    this.tasks.push(newTask);
  }

  onTaskDelete(taskId: number): void {
    this.tasks = this.tasks.filter(t => t.id !== taskId);
    this.taskDeleted.emit(taskId);
  }

  onTaskUpdate(updated: TaskItem): void {
    const idx = this.tasks.findIndex(t => t.id === updated.id);
    if (idx > -1) {
      this.tasks[idx] = { ...this.tasks[idx], ...updated };
    }
  }
}
