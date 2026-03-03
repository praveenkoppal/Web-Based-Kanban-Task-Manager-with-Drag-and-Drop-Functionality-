import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task, TaskItem } from '../task/task';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { NotificationService } from '../services/notification.service';

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
  @Output() taskDeleted = new EventEmitter<number>();
  @Output() deleteColumn = new EventEmitter<string>();

  tasks: TaskItem[] = [];
  showAddButtonWhenEditing = false;
  showAddModal = false;
  newTaskTitle = '';
  newTaskDescription = '';
  newTaskPriority: 'High' | 'Medium' | 'Low' = 'High';
  private moveListener: any;
  private persistListener: any;
  private readonly STORAGE_KEY = 'kanban.board';

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    // Load board from shared storage if available, otherwise load samples
    const board = this.readBoardFromStorage();
    if (board && board[this.title] && board[this.title].length) {
      this.tasks = board[this.title];
    } else {
      this.loadSampleTasks();
      // ensure board has this column saved
      const b = this.readBoardFromStorage();
      b[this.title] = this.tasks;
      this.writeBoardToStorage(b);
    }
    this.moveListener = (ev: any) => {
      const d = ev.detail;
      if (d && d.from && this.title === d.from) {
        this.tasks = this.tasks.filter(t => t.id !== d.id);
        // persist change to shared board
        this.saveToStorage();
      }
    };
    this.persistListener = () => {
      this.saveToStorage();
    };
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('task-moved', this.moveListener as EventListener);
      window.addEventListener('persist-board', this.persistListener as EventListener);
    }
  }

  ngOnDestroy(): void {
    if (this.moveListener && typeof window !== 'undefined' && window.removeEventListener) {
      window.removeEventListener('task-moved', this.moveListener as EventListener);
    }
    if (this.persistListener && typeof window !== 'undefined' && window.removeEventListener) {
      window.removeEventListener('persist-board', this.persistListener as EventListener);
    }
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
      id: Math.max(...this.tasks.map(t => t.id), 0) + 1,
      title: this.newTaskTitle.trim(),
      description: this.newTaskDescription.trim() || 'No description',
      priority: this.newTaskPriority,
    };
    this.tasks.push(newTask);
    this.closeAddModal();
    this.saveToStorage();
    this.notificationService.success(`Task "${newTask.title}" added to "${this.title}" column`);
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
        const item: TaskItem = { id: payload.id, title: payload.title, description: payload.description, priority: payload.priority };
        this.tasks.push(item);
        // notify origin column to remove the item
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('task-moved', { detail: { id: payload.id, from: payload.from } }));
        }
        this.saveToStorage();
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
        }
        moveItemInArray(this.tasks, event.previousIndex, event.currentIndex);
      } else {
        transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
      }
      this.saveToStorage();
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('persist-board'));
      }
    } catch (err) {
      console.error('CDK drop error', err);
    }
  }

  onTaskDelete(taskId: number): void {
    const deletedTask = this.tasks.find(t => t.id === taskId);
    this.tasks = this.tasks.filter(t => t.id !== taskId);
    this.taskDeleted.emit(taskId);
    this.saveToStorage();
    if (deletedTask) {
      this.notificationService.success(`Task "${deletedTask.title}" deleted from "${this.title}" column`);
    }
  }

  onTaskUpdate(updated: TaskItem): void {
    const idx = this.tasks.findIndex(t => t.id === updated.id);
    if (idx > -1) {
      this.tasks[idx] = { ...this.tasks[idx], ...updated };
      this.saveToStorage();
    }
  }

  /**
   * tasks exposed to template after applying optional search filter
   */
  get filteredTasks(): TaskItem[] {
    const term = this.filter?.toLowerCase().trim();
    if (!term) return this.tasks;
    return this.tasks.filter(t =>
      t.title.toLowerCase().includes(term) ||
      t.description.toLowerCase().includes(term)
    );
  }

  onDeleteColumn(): void {
    this.deleteColumn.emit(this.title);
  }

  private readBoardFromStorage(): { [key: string]: TaskItem[] } {
    if (typeof window === 'undefined' || !window.localStorage) return {};
    try {
      const raw = window.localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.warn('Failed to read board from storage', e);
      return {};
    }
  }

  private writeBoardToStorage(board: { [key: string]: TaskItem[] }): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(board));
    } catch (e) {
      console.warn('Failed to write board to storage', e);
    }
  }

  private saveToStorage(): void {
    const board = this.readBoardFromStorage();
    board[this.title] = this.tasks;
    this.writeBoardToStorage(board);
  }
}
