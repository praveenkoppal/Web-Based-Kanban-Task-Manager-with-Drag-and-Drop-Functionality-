import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Column } from './column';

describe('Column', () => {
  let component: Column;
  let fixture: ComponentFixture<Column>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Column]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Column);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('filters tasks based on the input filter', () => {
    component.tasks = [
      { id: 1, title: 'Buy milk', description: 'Get dairy' },
      { id: 2, title: 'Clean house', description: 'Vacuum' },
    ];
    component.filter = 'milk';
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('app-task');
    expect(items.length).toBe(1);

    // clearing the filter shows all
    component.filter = '';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('app-task').length).toBe(2);
  });
});
