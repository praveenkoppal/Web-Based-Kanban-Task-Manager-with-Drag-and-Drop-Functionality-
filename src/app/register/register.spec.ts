import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { RegisterComponent } from './register';
import { AuthService } from '../services/auth.service';


describe('RegisterComponent', () => {
  let auth: AuthService;
  let router: Router;
  let fixture: any;
  let component: RegisterComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent, FormsModule, RouterTestingModule],
      providers: [AuthService],
    }).compileComponents();

    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(RegisterComponent as any);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('rejects empty credentials', () => {
    component.username = '';
    component.password = '';
    component.confirm = '';
    component.submit({ invalid: true, control: { markAllAsTouched: () => {} } } as any);
    expect(component.errorMessage).toContain('Please complete');
  });

  it('rejects mismatched passwords', () => {
    component.username = 'user';
    component.password = 'pw';
    component.confirm = 'pw2';
    component.submit({ invalid: false } as any);
    expect(component.errorMessage).toContain('match');
  });

  it('rejects weak passwords', () => {
    component.username = 'user';
    component.password = 'abc';
    component.confirm = 'abc';
    component.submit({ invalid: false } as any);
    expect(component.errorMessage).toContain('four numbers');
  });

  it('registers and navigates', () => {
    vi.spyOn(auth, 'register').mockReturnValue(of(true));
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.username = 'newuser';
    component.password = 'a1234';
    component.confirm = 'a1234';
    component.submit({ invalid: false } as any);
    expect(auth.register).toHaveBeenCalledWith('newuser', 'a1234');
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('shows error when registration fails', () => {
    vi.spyOn(auth, 'register').mockReturnValue(of(false));
    component.username = 'exists';
    component.password = 'a1234';
    component.confirm = 'a1234';
    component.submit({ invalid: false } as any);
    expect(component.errorMessage).toContain('Unable to create account');
  });
});
