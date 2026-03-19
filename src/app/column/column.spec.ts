// simplified tests without Angular fixtures
import { Column } from './column';
import { of } from 'rxjs';

class DummyNotificationService {
  success(msg: string) {}
  warning(msg: string) {}
  error(msg: string) {}
}
class DummyApiService {
  getTasks(column?: string) {
    return of([]);
  }
  addTask(t: any) {
    return of({ ...t, id: 1 });
  }
  updateTask(t: any) {
    return of(t);
  }
  deleteTask(id: any) {
    return of(null);
  }
}

describe('Column', () => {
  let component: Column;

  beforeEach(() => {
    window.localStorage.clear();
    component = new Column(
      new DummyNotificationService() as any,
      new DummyApiService() as any
    );
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('filters tasks based on the input filter', () => {
    // Test filtering logic directly
    component.tasks = [
      { id: 1, title: 'Buy milk', description: 'Get dairy', column: 'foo', priority: 'High' } as any,
      { id: 2, title: 'Clean house', description: 'Vacuum', column: 'foo', priority: 'Low' } as any,
    ];
    component.filter = 'milk';
    
    // Check filtered results
    expect(component.filteredTasks.length).toBe(1);
    expect(component.filteredTasks[0].id).toBe(1);
    expect(component.filteredTasks[0].title).toContain('milk');

    // clearing the filter shows all items
    component.filter = '';
    expect(component.filteredTasks.length).toBe(2);
  });

  it('filters tasks by priority when priorityFilter is set', () => {
    component.tasks = [
      { id: 1, title: 'A', description: '', column: 'foo', priority: 'High' } as any,
      { id: 2, title: 'B', description: '', column: 'foo', priority: 'Low' } as any,
      { id: 3, title: 'C', description: '', column: 'foo', priority: 'High' } as any,
    ];
    component.priorityFilter = 'High';
    expect(component.filteredTasks.length).toBe(2);
    expect(component.filteredTasks.every(t => t.priority === 'High')).toBeTruthy();

    // ensure progressPercentage is unchanged by priority filter
    component.totalTasks = 10;
    expect(component.progressPercentage).toBe(30);
  });

  it('computes progressPercentage relative to totalTasks input', () => {
    component.tasks = [
      { id: 1, title: 'A', description: '', column: 'foo' },
      { id: 2, title: 'B', description: '', column: 'foo' },
      { id: 3, title: 'C', description: '', column: 'foo' }
    ];

    component.totalTasks = 10;
    expect(component.progressPercentage).toBe(30);

    component.filter = 'b';
    expect(component.progressPercentage).toBe(30); // filter doesn't matter

    component.totalTasks = 0;
    expect(component.progressPercentage).toBe(0);

    // cap at 100% even if column has more tasks than totalTasks
    component.tasks = Array.from({ length: 150 }, (_, i) => ({ id: i, title: String(i), description: '', column: 'foo' }));
    component.totalTasks = 100;
    expect(component.progressPercentage).toBe(100);
  });
});
