import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { Board } from './board';
import { Column } from '../column/column';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

class FakeRouter {
  navigate = vi.fn();
}

describe('Board', () => {
  let component: Board;
  let fixture: ComponentFixture<Board>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Board],
      providers: [AuthService, { provide: Router, useClass: FakeRouter }]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Board);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('passes searchTerm down to child columns', () => {
    // create fake columns list for iteration
    component.columns = [
      { title: 'A', status: 'a' },
      { title: 'B', status: 'b' }
    ];
    component.searchTerm = 'foo';
    fixture.detectChanges();

    const colDEs = fixture.debugElement.queryAll(By.directive(Column));
    expect(colDEs.length).toBe(2);
    colDEs.forEach(de => {
      const colInstance = de.componentInstance as Column;
      expect(colInstance.filter).toBe('foo');
    });
  });

  it('clear button empties searchTerm and updates children', () => {
    component.columns = [{ title: 'A', status: 'a' }];
    component.searchTerm = 'bar';
    fixture.detectChanges();

    const clearBtn = fixture.nativeElement.querySelector('.search-clear');
    expect(clearBtn).toBeTruthy();
    clearBtn.click();
    fixture.detectChanges();

    expect(component.searchTerm).toBe('');
    const colDEs = fixture.debugElement.queryAll(By.directive(Column));
    expect(colDEs[0].componentInstance.filter).toBe('');
  });

  it('logout clears credentials and navigates back', () => {
    const auth = TestBed.inject(AuthService);
    const router = TestBed.inject(Router) as any as FakeRouter;
    vi.spyOn(auth, 'logout').mockImplementation(() => {});

    component.logout();
    expect(auth.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
