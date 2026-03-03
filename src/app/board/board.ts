import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Column } from '../column/column';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

interface ColumnItem {
  title: string;
  status: string;
}

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, FormsModule, Column, DragDropModule],
  templateUrl: './board.html',
  styleUrls: ['./board.css'],
})
export class Board implements OnInit {
  columns: ColumnItem[] = [];
  searchTerm = '';                        // new filter text
  showAddColumnModal = false;
  newColumnTitle = '';
  newColumnStatus = '';
  userName: string | null = null;
  // default to material design person icon (32x32) encoded as data URI
  profileUrl = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="32" viewBox="0 0 24 24" width="32"><path fill="%23ffffff" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';

  private readonly COLUMNS_STORAGE_KEY = 'kanban.columns';
  private readonly BOARD_STORAGE_KEY = 'kanban.board';

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadColumns();
    const user = this.authService.getUser();
    this.userName = user ? user.username : 'Guest';
  }

  private loadColumns(): void {
    const defaultColumns: ColumnItem[] = [
      { title: 'To Do', status: 'todo' },
      { title: 'In Progress', status: 'in-progress' },
      { title: 'Done', status: 'done' },
    ];

    const savedColumns = this.readColumnsFromStorage();
    if (savedColumns && savedColumns.length > 0) {
      // Ensure all default columns are present
      const columnTitles = savedColumns.map(c => c.title);
      for (const defaultCol of defaultColumns) {
        if (!columnTitles.includes(defaultCol.title)) {
          savedColumns.push(defaultCol);
        }
      }
      this.columns = savedColumns;
    } else {
      this.columns = defaultColumns;
    }
    this.saveColumnsToStorage();
  }

  get connectedIds(): string[] {
    return this.columns.map(c => c.title);
  }

  addColumnOpen(): void {
    this.showAddColumnModal = true;
    this.newColumnTitle = '';
    this.newColumnStatus = '';
  }

  closeAddColumnModal(): void {
    this.showAddColumnModal = false;
    this.newColumnTitle = '';
    this.newColumnStatus = '';
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
      status: this.newColumnStatus.trim() || this.newColumnTitle.toLowerCase().replace(/\s+/g, '-'),
    };
    this.columns.push(newColumn);
    this.saveColumnsToStorage();
    this.closeAddColumnModal();
    this.notificationService.success(`Column "${newColumn.title}" created successfully`);
  }

  deleteColumn(columnTitle: string): void {
    if (confirm(`Are you sure you want to delete the "${columnTitle}" column?`)) {
      // Delete column data from board storage
      this.deleteColumnFromStorage(columnTitle);
      // Remove column from list
      this.columns = this.columns.filter(c => c.title !== columnTitle);
      this.saveColumnsToStorage();
      this.notificationService.success(`Column "${columnTitle}" deleted successfully`);
    }
  }

  onTaskDeleted(taskId: number): void {
    console.log(`Task ${taskId} deleted`);
  }

  private readColumnsFromStorage(): ColumnItem[] {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    try {
      const raw = window.localStorage.getItem(this.COLUMNS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('Failed to read columns from storage', e);
      return [];
    }
  }

  private saveColumnsToStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem(this.COLUMNS_STORAGE_KEY, JSON.stringify(this.columns));
    } catch (e) {
      console.warn('Failed to save columns to storage', e);
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private deleteColumnFromStorage(columnTitle: string): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const board = JSON.parse(window.localStorage.getItem(this.BOARD_STORAGE_KEY) || '{}');
      delete board[columnTitle];
      window.localStorage.setItem(this.BOARD_STORAGE_KEY, JSON.stringify(board));
    } catch (e) {
      console.warn('Failed to delete column from storage', e);
    }
  }
}
