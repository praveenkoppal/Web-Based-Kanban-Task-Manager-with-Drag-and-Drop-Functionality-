import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TaskItem {
  id: number;
  title: string;
  description: string;
}

@Component({
  selector: 'app-task',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task.html',
  styleUrls: ['./task.css'],
})
export class Task {
  @Input() task!: TaskItem;
  @Output() deleteTask = new EventEmitter<number>();
  @Output() updateTask = new EventEmitter<TaskItem>();

  // Inline edit state
  isEditing = false;
  editTitle = '';
  editDescription = '';

  onDelete(): void {
    this.deleteTask.emit(this.task.id);
  }

  startEdit(): void {
    this.isEditing = true;
    this.editTitle = this.task.title;
    this.editDescription = this.task.description;
  }

  cancelEdit(): void {
    this.isEditing = false;
  }

  saveEdit(): void {
    const updated: TaskItem = {
      id: this.task.id,
      title: this.editTitle.trim() || this.task.title,
      description: this.editDescription.trim() || this.task.description,
    };
    this.updateTask.emit(updated);
    this.task = updated;
    this.isEditing = false;
  }
}
