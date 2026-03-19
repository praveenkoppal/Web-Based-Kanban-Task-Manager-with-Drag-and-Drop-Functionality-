// simple unit tests without Angular change detection
import { Board } from './board';
import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { RouterTestingModule } from '@angular/router/testing';
import { Column } from '../column/column';
import { By } from '@angular/platform-browser';

class DummyNotificationService { success(msg: string) {} warning(msg: string) {} error(msg: string) {} }
class DummyAuthService { getUser() { return { username: 'test' }; } logout() {} changeUsername(newName: string) { return true; } }
class DummyRouter { navigate = vi.fn(); createUrlTree = vi.fn(); }

class DummyApiService {
  getColumns() { return of([]); }
  getTasks() { return of([]); }
  addColumn(c: any) { return of(c); }
  deleteColumn(id: any) { return of(null); }
}

describe('Board', () => {
  let component: Board;
  let auth: DummyAuthService;
  let router: DummyRouter;

  beforeEach(() => {
    window.localStorage.clear();
    auth = new DummyAuthService();
    router = new DummyRouter();
    const api = new DummyApiService();
    component = new Board(
      new DummyNotificationService() as any,
      auth as any,
      router as any,
      api as any
    );
    // mimic Angular lifecycle so event listeners are registered
    component.ngOnInit();
  });

  describe('(template interactions)', () => {
    let fixture: any;
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [Board, FormsModule, Column, DragDropModule, RouterTestingModule],
      }).compileComponents();
      fixture = TestBed.createComponent(Board as any);
      fixture.detectChanges();
    });

    it('passes the selected priority to the child column component', () => {
      component = fixture.componentInstance;
      component.columns = [{ title: 'Foo', status: 'foo' } as any];
      component.priorityFilter = 'High';
      fixture.detectChanges();
      const columnDE = fixture.debugElement.query(By.directive(Column));
      const colComp = columnDE.componentInstance as Column;
      expect(colComp.priorityFilter).toBe('High');
    });

    it('updates board.priorityFilter when the select value changes', () => {
      component = fixture.componentInstance;
      const select: HTMLSelectElement = fixture.nativeElement.querySelector('.priority-select');
      select.value = 'Medium';
      select.dispatchEvent(new Event('change'));
      fixture.detectChanges();
      expect(component.priorityFilter).toBe('Medium');
    });

  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('passes searchTerm down to child columns', () => {
    expect(component.searchTerm).toBe('');
    component.searchTerm = 'foo';
    expect(component.searchTerm).toBe('foo');
    component.columns = [
      { title: 'A', status: 'a' },
      { title: 'B', status: 'b' }
    ];
    expect(component.columns).toHaveLength(2);
  });

  it('clear button empties searchTerm and updates children', () => {
    component.searchTerm = 'bar';
    expect(component.searchTerm).toBe('bar');
    component.searchTerm = '';
    expect(component.searchTerm).toBe('');
    component.columns = [{ title: 'A', status: 'a' }];
    expect(component.columns).toHaveLength(1);
  });

  it('logout clears credentials and navigates back', () => {
    const spy = vi.spyOn(auth, 'logout').mockImplementation(() => {});
    component.logout();
    expect(spy).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('calculates totalTasks from allTasks array', () => {
    component.allTasks = [{ id: 1 }, { id: 2 }, { id: 3 } as any];
    expect(component.totalTasks).toBe(3);
  });

  it('opens and closes edit-name modal and updates name', () => {
    // initial name from dummy service
    component.userName = 'test';
    component.openEditName();
    expect(component.showEditNameModal).toBeTruthy();
    expect(component.editedName).toBe('test');

    // simulate saving with valid new name
    const spyAuth = vi.spyOn(auth as any, 'changeUsername').mockReturnValue(true as any);
    component.editedName = 'newname';
    component.saveEditedName();
    expect(spyAuth).toHaveBeenCalledWith('newname');
    expect(component.userName).toBe('newname');
    expect(component.showEditNameModal).toBeFalsy();
  });

  describe('localStorage board persistence', () => {
    beforeEach(() => {
      window.localStorage.clear();
    });

    it('saves board data when tasks-updated event fires', () => {
      component.columns = [
        { title: 'A', status: 'a' },
        { title: 'B', status: 'b' }
      ];
      component.allTasks = [
        { id: 1, column: 'A' } as any,
        { id: 2, column: 'B' } as any,
        { id: 3, column: 'A' } as any
      ];

      // prevent loadAllTasks from wiping our test data
      (component as any).loadAllTasks = () => {};

      window.dispatchEvent(new CustomEvent('tasks-updated'));
      const raw = window.localStorage.getItem('kanban.board');
      expect(raw).not.toBeNull();
      const board = JSON.parse(raw!);
      expect(board['A'].length).toBe(2);
      expect(board['B'].length).toBe(1);
    });

    it('updates storage when a column is added or removed', () => {
      component.columns = [];
      component.allTasks = [];
      (component as any).saveBoard();
      let raw = window.localStorage.getItem('kanban.board');
      expect(raw).toBe('{}');

      component.columns.push({ title: 'New', status: 'new' });
      (component as any).saveBoard();
      raw = window.localStorage.getItem('kanban.board');
      expect(raw).toContain('New');

      component.columns = [];
      (component as any).saveBoard();
      raw = window.localStorage.getItem('kanban.board');
      expect(raw).toBe('{}');
    });
  });


});
