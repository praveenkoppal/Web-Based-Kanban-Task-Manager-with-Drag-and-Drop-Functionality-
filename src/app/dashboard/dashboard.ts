import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthGuard } from '../services/auth.guard';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class Dashboard implements OnInit {
  stats: { [column: string]: number } = {};
  total = 0;

  private readonly BOARD_KEY = 'kanban.board';

  ngOnInit(): void {
    this.loadStats();

    // refresh stats when board data changes
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('tasks-updated', () => this.loadStats());
    }
  }

  private loadStats(): void {
    try {
      const raw = window.localStorage.getItem(this.BOARD_KEY) || '{}';
      const board = JSON.parse(raw) as { [key: string]: any[] };
      this.total = 0;
      this.stats = {};
      for (const col of Object.keys(board)) {
        const count = Array.isArray(board[col]) ? board[col].length : 0;
        this.stats[col] = count;
        this.total += count;
      }
    } catch {
      this.stats = {};
      this.total = 0;
    }
  }

  /**
   * Helper used by template to compute column percentage.
   */
  percent(count: number): number {
    if (!this.total) {
      return 0;
    }
    return Math.round((count / this.total) * 100);
  }
}
