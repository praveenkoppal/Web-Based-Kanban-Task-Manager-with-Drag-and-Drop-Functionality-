import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task } from '../task/task';
import { TaskItem } from '../models';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { NotificationService } from '../services/notification.service';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-column',
  standalone: true,
  imports: [CommonModule, FormsModule, Task, DragDropModule],
  templateUrl: './column.html',
  styleUrls: ['./column.css'],
})
export class Column implements OnInit, OnDestroy {
  @Input() title!: string;
  @Input() status!: string;
  @Input() connectedTo: string[] = [];
  // optional search filter passed from board
  @Input() filter = '';
  // optional priority filter ('', 'High', 'Medium', 'Low')
  @Input() priorityFilter: '' | 'High' | 'Medium' | 'Low' = '';
  /** total number of tasks in all columns (provided by parent) */
  @Input() totalTasks = 0;
  @Output() taskDeleted = new EventEmitter<number>();
  @Output() deleteColumn = new EventEmitter<string>();

  tasks: TaskItem[] = [];
  showAddButtonWhenEditing = false;
  showAddModal = false;
  newTaskTitle = '';
  newTaskDescription = '';
  newTaskPriority: 'High' | 'Medium' | 'Low' = 'High';
  private moveListener: any;
  loadingTasks = false;

  constructor(
    private notificationService: NotificationService,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    // fetch tasks for this column from storage
    this.loadingTasks = true;
    this.api.getTasks(this.title).subscribe(tasks => {
      this.tasks = tasks;
      this.loadingTasks = false;
    }, err => {
      console.error('unable to load tasks', err);
      this.loadingTasks = false;
      // fall back to samples so user doesn't see empty column
      this.loadSampleTasks();
    });

    // listen for moves from other columns so we can remove the item locally
    this.moveListener = (ev: any) => {
      const d = ev.detail;
      if (d && d.from && this.title === d.from) {
        this.tasks = this.tasks.filter(t => t.id !== d.id);
      }
    };
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('task-moved', this.moveListener as EventListener);
    }
  }

  ngOnDestroy(): void {
    if (this.moveListener && typeof window !== 'undefined' && window.removeEventListener) {
      window.removeEventListener('task-moved', this.moveListener as EventListener);
    }
  }

  loadSampleTasks(): void {
    const sampleTasks: { [key: string]: TaskItem[] } = {
      'To Do': [
        { id: 1, title: 'Design UI mockups', description: 'Create mockups for the dashboard', priority: 'Medium', column: 'To Do' },
        { id: 2, title: 'Setup database', description: 'Configure PostgreSQL database', priority: 'Low', column: 'To Do' },
      ],
      'In Progress': [
        { id: 3, title: 'Implement authentication', description: 'Add login and signup features', priority: 'High', column: 'In Progress' },
        { id: 4, title: 'Build API endpoints', description: 'Create REST API endpoints', priority: 'High', column: 'In Progress' },
      ],
      'Done': [
        { id: 5, title: 'Project setup', description: 'Initialize Angular project', priority: 'Low', column: 'Done' },
        { id: 6, title: 'Git repository', description: 'Setup GitHub repository', priority: 'Low', column: 'Done' },
      ],
    };

    this.tasks = sampleTasks[this.title] || [];
  }

  addTask(): void {
    this.showAddModal = true;
    this.newTaskTitle = '';
    this.newTaskDescription = '';
    this.newTaskPriority = 'Medium';
    this.onEditing(true);
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.onEditing(false);
  }

  saveNewTask(): void {
    if (!this.newTaskTitle.trim()) {
      this.notificationService.warning('Please enter a task title');
      return;
    }
    const newTask: TaskItem = {
      title: this.newTaskTitle.trim(),
      description: this.newTaskDescription.trim() || 'No description',
      priority: this.newTaskPriority,
      column: this.title,
    };

    this.api.addTask(newTask).subscribe(created => {
      this.tasks.push(created);
      this.closeAddModal();
      this.notificationService.success(
        `Task "${created.title}" added to "${this.title}" column`
      );
      window.dispatchEvent(new CustomEvent('tasks-updated'));
    }, err => {
      console.error('failed to add task', err);
      this.notificationService.error('Unable to add task');
    });
  }

  onEditing(active: boolean): void {
    this.showAddButtonWhenEditing = !!active;
    if (typeof document !== 'undefined' && document.body) {
      if (active) {
        document.body.classList.add('editing-active');
      } else {
        document.body.classList.remove('editing-active');
      }
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    try {
      const data = event.dataTransfer?.getData('text/plain');
      if (!data) return;
      const payload = JSON.parse(data);
      // don't handle drops into the same column
      if (payload.from === this.title) return;
      // Only add if not already present
      if (!this.tasks.find(t => t.id === payload.id)) {
        const updated: TaskItem = {
          id: payload.id,
          title: payload.title,
          description: payload.description,
          priority: payload.priority,
          column: this.title,
        };
        this.api.updateTask(updated).subscribe(u => {
          this.tasks.push(u);
          // notify origin column to remove the item
          if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('task-moved', { detail: { id: u.id, from: payload.from } }));
            window.dispatchEvent(new CustomEvent('tasks-updated'));
          }
        });
      }
    } catch (err) {
      console.error('Drop parse error', err);
    }
  }

  onCdkDrop(event: CdkDragDrop<TaskItem[]>): void {
    try {
      if (event.previousContainer === event.container) {
        // Reordering within same column - determine direction to set priority
        const movedItem = this.tasks[event.previousIndex];
        if (movedItem) {
          if (event.previousIndex > event.currentIndex) {
            // moved up -> higher priority
            movedItem.priority = 'High';
          } else if (event.previousIndex < event.currentIndex) {
            // moved down -> lower priority
            movedItem.priority = 'Low';
          }
          // persist the updated priority
          this.api.updateTask(movedItem).subscribe();
        }
        moveItemInArray(this.tasks, event.previousIndex, event.currentIndex);
      } else {
        transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
        // the moved item now lives at currentIndex in tasks array
        const moved = this.tasks[event.currentIndex];
        if (moved) {
          moved.column = this.title;
          this.api.updateTask(moved).subscribe();
        }
      }
      window.dispatchEvent(new CustomEvent('tasks-updated'));
    } catch (err) {
      console.error('CDK drop error', err);
    }
  }

  onTaskDelete(taskId: number): void {
    const deletedTask = this.tasks.find(t => t.id === taskId);
    this.api.deleteTask(taskId).subscribe(() => {
      this.tasks = this.tasks.filter(t => t.id !== taskId);
      this.taskDeleted.emit(taskId);
      if (deletedTask) {
        this.notificationService.success(
          `Task "${deletedTask.title}" deleted from "${this.title}" column`
        );
      }
      window.dispatchEvent(new CustomEvent('tasks-updated'));
    });
  }

  onTaskUpdate(updated: TaskItem): void {
    this.api.updateTask(updated).subscribe(u => {
      const idx = this.tasks.findIndex(t => t.id === u.id);
      if (idx > -1) {
        this.tasks[idx] = u;
      }
      window.dispatchEvent(new CustomEvent('tasks-updated'));
    });
  }

  /**
   * tasks exposed to template after applying optional search filter
   */
  get filteredTasks(): TaskItem[] {
    let tasks = this.tasks;
    const term = this.filter?.toLowerCase().trim();
    if (term) {
      tasks = tasks.filter(t =>
        t.title.toLowerCase().includes(term) ||
        t.description.toLowerCase().includes(term)
      );
    }
    if (this.priorityFilter) {
      tasks = tasks.filter(t => t.priority === this.priorityFilter);
    }
    return tasks;
  }

  /** total number of tasks in this column (unfiltered) */
  get totalCount(): number {
    return this.tasks.length;
  }

  /**
   * percentage equal to the number of tasks in the column.
   * capped at 100 so the bar never exceeds its container.
   * filters do *not* affect this value per new requirements.
   */
  get progressPercentage(): number {
    if (this.totalTasks <= 0) {
      return 0;
    }
    const perc = (this.tasks.length / this.totalTasks) * 100;
    return Math.min(Math.round(perc), 100);
  }

  onDeleteColumn(): void {
    this.deleteColumn.emit(this.title);
  }

  // storage helpers removed – data is now persisted through the API
}
