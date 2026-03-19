import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: any;

  beforeEach(async () => {
    window.localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [Dashboard, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard as any);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads statistics from storage', () => {
    const board = {
      'To Do': [{ id:1 }, { id:2 }],
      'In Progress': [{id:3}],
      Done: []
    };
    window.localStorage.setItem('kanban.board', JSON.stringify(board));

    fixture.detectChanges(); // ngOnInit runs
    expect(component.total).toBe(3);
    expect(component.stats['To Do']).toBe(2);
    expect(component.stats['In Progress']).toBe(1);
    expect(component.stats['Done']).toBe(0);
    // run a second detection to update bindings after stats change
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h3')?.textContent).toContain('Total Tasks');
    const allRows = compiled.querySelectorAll('table.stats-table tr');
    expect(allRows.length).toBe(4); // header + 3 columns
    // verify percent values rendered correctly
    const dataRows = compiled.querySelectorAll('table.stats-table tbody tr');
    expect(dataRows.length).toBe(3);
    const percents: { [name:string]: string } = {};
    dataRows.forEach(r => {
      const name = (r.querySelector('td')?.textContent || '').trim();
      const pct = (r.querySelector('td.percent')?.textContent || '').trim();
      percents[name] = pct;
    });
    expect(percents['To Do']).toBe('67%');
    expect(percents['In Progress']).toBe('33%');
    expect(percents['Done']).toBe('0%');
  });

  it('refreshed when tasks-updated event is fired', () => {
    // start with empty board
    fixture.detectChanges();
    expect(component.total).toBe(0);

    // simulate external update to storage
    const board = { 'Foo': [{}, {}] };
    window.localStorage.setItem('kanban.board', JSON.stringify(board));
    window.dispatchEvent(new CustomEvent('tasks-updated'));

    // stats should refresh automatically
    expect(component.total).toBe(2);
    expect(component.stats['Foo']).toBe(2);
  });
});
