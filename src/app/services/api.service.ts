import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ColumnItem, TaskItem } from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = '/api';

  constructor(private http: HttpClient) {}

  // helper local fallback storage so UI works even if SW / API isn't up yet
  private readonly COLS_KEY = 'kanban.columns';
  private readonly TASKS_KEY = 'kanban.tasks';

  private fromLocal<T>(key: string): T[] {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T[]) : [];
    } catch {
      return [];
    }
  }

  private toLocal<T>(key: string, value: T[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }

  getColumns(): Observable<ColumnItem[]> {
    return this.http.get<ColumnItem[]>(`${this.baseUrl}/columns`).pipe(
      catchError(() => of(this.fromLocal<ColumnItem>(this.COLS_KEY)))
    );
  }

  addColumn(col: ColumnItem): Observable<ColumnItem> {
    return this.http.post<ColumnItem>(`${this.baseUrl}/columns`, col).pipe(
      catchError(() => {
        const cols = this.fromLocal<ColumnItem>(this.COLS_KEY);
        const id = (cols.length ? Math.max(...cols.map(c => c.id || 0)) : 0) + 1;
        const created = { ...col, id };
        cols.push(created);
        this.toLocal(this.COLS_KEY, cols);
        return of(created);
      })
    );
  }

  deleteColumn(id: number | string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/columns/${id}`).pipe(
      catchError(() => {
        let cols = this.fromLocal<ColumnItem>(this.COLS_KEY);
        cols = cols.filter(c => c.id !== id);
        this.toLocal(this.COLS_KEY, cols);
        const col = cols.find(c => c.id === id);
        if (col) {
          let tasks = this.fromLocal<TaskItem>(this.TASKS_KEY);
          tasks = tasks.filter(t => t.column !== col.title);
          this.toLocal(this.TASKS_KEY, tasks);
        }
        return of(null);
      })
    );
  }

  updateColumns(columns: ColumnItem[]): Observable<ColumnItem[]> {
    return this.http.put<ColumnItem[]>(`${this.baseUrl}/columns`, columns).pipe(
      catchError(() => {
        this.toLocal(this.COLS_KEY, columns);
        return of(columns);
      })
    );
  }

  // tasks
  getTasks(column?: string): Observable<TaskItem[]> {
    let params = new HttpParams();
    if (column) {
      params = params.set('column', column);
    }
    return this.http.get<TaskItem[]>(`${this.baseUrl}/tasks`, { params }).pipe(
      catchError(() => {
        const tasks = this.fromLocal<TaskItem>(this.TASKS_KEY);
        return of(column ? tasks.filter(t => t.column === column) : tasks);
      })
    );
  }

  addTask(task: TaskItem): Observable<TaskItem> {
    return this.http.post<TaskItem>(`${this.baseUrl}/tasks`, task).pipe(
      catchError(() => {
        const tasks = this.fromLocal<TaskItem>(this.TASKS_KEY);
        const id = (tasks.length ? Math.max(...tasks.map(t => t.id || 0)) : 0) + 1;
        const created = { ...task, id };
        tasks.push(created);
        this.toLocal(this.TASKS_KEY, tasks);
        return of(created);
      })
    );
  }

  updateTask(task: TaskItem): Observable<TaskItem> {
    return this.http.put<TaskItem>(`${this.baseUrl}/tasks/${task.id}`, task).pipe(
      catchError(() => {
        const tasks = this.fromLocal<TaskItem>(this.TASKS_KEY);
        const idx = tasks.findIndex(t => t.id === task.id);
        if (idx !== -1) {
          tasks[idx] = { ...task };
          this.toLocal(this.TASKS_KEY, tasks);
        }
        return of(task);
      })
    );
  }

  deleteTask(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/tasks/${id}`).pipe(
      catchError(() => {
        let tasks = this.fromLocal<TaskItem>(this.TASKS_KEY);
        tasks = tasks.filter(t => t.id !== id);
        this.toLocal(this.TASKS_KEY, tasks);
        return of(null);
      })
    );
  }

  /** convenience helper to remove all tasks in a column */
  deleteTasksByColumn(column: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/tasks?column=${encodeURIComponent(column)}`).pipe(
      catchError(() => {
        let tasks = this.fromLocal<TaskItem>(this.TASKS_KEY);
        tasks = tasks.filter(t => t.column !== column);
        this.toLocal(this.TASKS_KEY, tasks);
        return of(null);
      })
    );
  }
}
