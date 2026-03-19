import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../services/notification.service';
import { TaskItem } from '../models';

// Note: TaskItem now includes a `column` property in the shared model, but
// components that only operate on a single column can ignore it.

@Component({
  selector: 'app-task',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task.html',
  styleUrls: ['./task.css'],
})
export class Task {
  @Input() task: TaskItem = { id: 0, title: '', description: '', priority: 'Medium', column: '' };
  @Input() columnTitle = '';
  @Output() deleteTask = new EventEmitter<number>();
  @Output() updateTask = new EventEmitter<TaskItem>();
  @Output() editingStarted = new EventEmitter<boolean>();

  // Inline edit state
  isEditing = false;
  editTitle = '';
  editDescription = '';
  editPriority: 'High' | 'Medium' | 'Low' = 'High';

  constructor(private notificationService: NotificationService) {}

  onDelete(): void {
    // No native browser confirm. Emit directly and rely on custom UI snackbar/modal if desired.
    // This keeps behavior consistent with the custom column confirm flow.
    this.deleteTask.emit(this.task.id);
  }

  startEdit(): void {
    this.isEditing = true;
    this.editTitle = this.task.title;
    this.editDescription = this.task.description;
    this.editPriority = (this.task.priority as any) || 'Medium';
    this.editingStarted.emit(true);
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editingStarted.emit(false);
  }

  saveEdit(): void {
    const updated: TaskItem = {
      id: this.task.id,
      title: this.editTitle.trim() || this.task.title,
      description: this.editDescription.trim() || this.task.description,
      priority: this.editPriority || 'Medium',
      column: this.task.column || this.columnTitle || '',
    };
    this.updateTask.emit(updated);
    this.task = updated;
    this.isEditing = false;
    this.editingStarted.emit(false);
    this.notificationService.success(`Task "${updated.title}" updated successfully`);
  }

  onDragStart(e: DragEvent): void {
    try {
      const payload = { id: this.task.id, title: this.task.title, description: this.task.description, from: this.columnTitle };
      e.dataTransfer?.setData('text/plain', JSON.stringify(payload));
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
      }
    } catch (err) {
      console.error('dragstart', err);
    }
  }

}
