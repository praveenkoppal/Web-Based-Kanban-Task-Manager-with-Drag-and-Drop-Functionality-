export interface ColumnItem {
  id?: number;
  title: string;
  status: string;
}

export interface TaskItem {
  id?: number;
  title: string;
  description: string;
  priority?: 'High' | 'Medium' | 'Low';
  // tracks which column the task belongs to
  column: string;
}
