import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Column } from '../column/column';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../services/api.service';
import { ColumnItem, TaskItem } from '../models';
import { forkJoin } from 'rxjs';

// ColumnItem now includes an optional id field; tasks are managed by ApiService.

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, FormsModule, Column, DragDropModule, RouterModule],
  templateUrl: './board.html',
  styleUrls: ['./board.css'],
})
export class Board implements OnInit {
  columns: ColumnItem[] = [];
  allTasks: TaskItem[] = [];
  loading = false;

  searchTerm = '';                        // new filter text
  priorityFilter: '' | 'High' | 'Medium' | 'Low' = '';

  showAddColumnModal = false;
  newColumnTitle = '';
  userName: string | null = null;

  pendingDeleteColumn: ColumnItem | null = null;
  showDeleteConfirmModal = false;
  // default to material design person icon (32x32) encoded as data URI
  profileUrl = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="32" viewBox="0 0 24 24" width="32"><path fill="%23ffffff" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';

  // editing name modal state
  showEditNameModal = false;
  editedName = '';

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.loadColumns();
    this.loadAllTasks();

    const user = this.authService.getUser();
    this.userName = user ? user.username : 'Guest';

    // refresh counts when tasks change and persist board state for dashboard
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('tasks-updated', () => {
        this.loadAllTasks();
        this.saveBoard();
      });
    }
  }

  private loadColumns(): void {
    this.loading = true;
    this.api.getColumns().subscribe(cols => {
      if (!cols || cols.length === 0) {
      // ensure TypeScript knows cols is ColumnItem[]
      cols = cols as ColumnItem[];
        // initialize defaults on first run
        const defaultColumns: ColumnItem[] = [
          { title: 'To Do', status: 'todo' },
          { title: 'In Progress', status: 'in-progress' },
          { title: 'Done', status: 'done' },
        ];
        // persist defaults via API (forkJoin returns typed array)
        forkJoin(defaultColumns.map(c => this.api.addColumn(c))).subscribe(
          (results: ColumnItem[]) => {
            this.columns = results;
            this.loading = false;
          },
          err => {
            console.error('unable to save default columns', err);
            this.loading = false;
          }
        );
      } else {
        this.columns = cols;
        this.loading = false;
      }
    }, err => { 
      console.error('failed to load columns', err);
      this.loading = false;
    });
  }

  get connectedIds(): string[] {
    return this.columns.map(c => c.title);
  }

  /**
   * loads all tasks into memory so that totalTasks can be computed quickly
   */
  private loadAllTasks(): void {
    this.api.getTasks().subscribe((tasks: TaskItem[]) => {
      this.allTasks = tasks;
    }, (err: any) => {
      console.error('failed to load tasks', err);
      this.allTasks = [];
    });
  }


  /**
   * Write a simplified board structure to localStorage so the dashboard can
   * compute statistics without needing to query the API.
   */
  private saveBoard(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const board: { [col: string]: TaskItem[] } = {};
      for (const col of this.columns) {
        board[col.title] = this.allTasks.filter(t => t.column === col.title);
      }
      window.localStorage.setItem('kanban.board', JSON.stringify(board));
    } catch {
      // ignore storage errors
    }
  }

  /**
   * total number of tasks across every column. Used by Column components for
   * computing progress percentages.  Automatically refreshed when the underlying
   * task list changes (see ngOnInit listener).
   */
  get totalTasks(): number {
    return this.allTasks.length;
  }

  addColumnOpen(): void {
    this.showAddColumnModal = true;
    this.newColumnTitle = '';
  }

  closeAddColumnModal(): void {
    this.showAddColumnModal = false;
    this.newColumnTitle = '';
  }

  saveNewColumn(): void {
    if (!this.newColumnTitle.trim()) {
      this.notificationService.warning('Please enter a column title');
      return;
    }

    // Check if column already exists
    if (this.columns.some(c => c.title === this.newColumnTitle.trim())) {
      this.notificationService.error('Column with this title already exists');
      return;
    }

    const newColumn: ColumnItem = {
      title: this.newColumnTitle.trim(),
      status: this.newColumnTitle.toLowerCase().replace(/\s+/g, '-'),
    };

    this.api.addColumn(newColumn).subscribe(
      (created: ColumnItem) => {
        this.columns.push(created);
        this.closeAddColumnModal();
        this.notificationService.success(
          `Column "${created.title}" created successfully`
        );
        this.saveBoard();
      },
      (err: any) => {
        console.error('failed to create column', err);
        this.notificationService.error('Unable to create column');
      }
    );
  }

  requestDeleteColumn(columnTitle: string): void {
    this.pendingDeleteColumn = this.columns.find(c => c.title === columnTitle) || null;
    if (this.pendingDeleteColumn) {
      this.showDeleteConfirmModal = true;
    }
  }

  cancelDeleteColumn(): void {
    this.pendingDeleteColumn = null;
    this.showDeleteConfirmModal = false;
  }

  confirmDeleteColumn(): void {
    if (!this.pendingDeleteColumn) {
      this.cancelDeleteColumn();
      return;
    }

    const columnTitle = this.pendingDeleteColumn.title;
    const column = this.pendingDeleteColumn;
    const id = column.id;

    this.api.deleteColumn(id || columnTitle).subscribe(() => {
      // also purge any tasks that belonged to that column
      this.api.getTasks().subscribe((tasks: TaskItem[]) => {
        tasks
          .filter(t => t.column === columnTitle)
          .forEach(t => this.api.deleteTask(t.id!).subscribe());
        window.dispatchEvent(new CustomEvent('tasks-updated'));
        this.saveBoard();
      });

      this.columns = this.columns.filter(c => c !== column);
      this.notificationService.success(`Column "${columnTitle}" deleted successfully`);
      this.saveBoard();
      this.cancelDeleteColumn();
    }, err => {
      console.error('failed to delete column', err);
      this.notificationService.error('Unable to delete column');
      this.cancelDeleteColumn();
    });
  }

  onTaskDeleted(taskId: number): void {
    console.log(`Task ${taskId} deleted`);
  }

  onColumnDrop(event: CdkDragDrop<ColumnItem[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    const sourceColumn = this.columns[event.previousIndex];
    const targetColumn = this.columns[event.currentIndex];
    if (!sourceColumn || !targetColumn) {
      return;
    }

    // swap column item positions in the board
    this.columns[event.previousIndex] = targetColumn;
    this.columns[event.currentIndex] = sourceColumn;

    // swap tasks between the two column titles
    const sourceTitle = sourceColumn.title;
    const targetTitle = targetColumn.title;

    const tasksFromSource = this.allTasks.filter(t => t.column === sourceTitle);
    const tasksFromTarget = this.allTasks.filter(t => t.column === targetTitle);

    const taskUpdates = [];

    for (const task of tasksFromSource) {
      task.column = targetTitle;
      taskUpdates.push(this.api.updateTask(task));
    }
    for (const task of tasksFromTarget) {
      task.column = sourceTitle;
      taskUpdates.push(this.api.updateTask(task));
    }

    const saveOps = [this.api.updateColumns(this.columns), ...taskUpdates];

    forkJoin(saveOps).subscribe(
      () => {
        // update local cache for board persistence
        for (const task of tasksFromSource) {
          const idx = this.allTasks.findIndex(t => t.id === task.id);
          if (idx >= 0) { this.allTasks[idx] = task; }
        }
        for (const task of tasksFromTarget) {
          const idx = this.allTasks.findIndex(t => t.id === task.id);
          if (idx >= 0) { this.allTasks[idx] = task; }
        }

        this.saveBoard();
        window.dispatchEvent(new CustomEvent('tasks-updated'));
        this.notificationService.success('Columns and tasks swapped successfully');
      },
      err => {
        console.error('failed to persist column/task swap', err);
        this.notificationService.error('Unable to swap columns');
      }
    );
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  openEditName(): void {
    this.showEditNameModal = true;
    this.editedName = this.userName || '';
  }

  closeEditName(): void {
    this.showEditNameModal = false;
    this.editedName = '';
  }

  saveEditedName(): void {
    if (!this.editedName.trim()) {
      this.notificationService.warning('Name cannot be empty');
      return;
    }
    const ok = this.authService.changeUsername(this.editedName);
    if (ok) {
      this.userName = this.editedName.trim();
      this.notificationService.success('Name updated');
      this.closeEditName();
    } else {
      this.notificationService.error(
        'Unable to change name (it may already be taken)'
      );
    }
  }

}
