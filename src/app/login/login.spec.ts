import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { LoginComponent } from './login';
import { AuthService } from '../services/auth.service';


describe('LoginComponent', () => {
  let auth: AuthService;
  let router: Router;
  let fixture: any;
  let component: LoginComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent, FormsModule, RouterTestingModule],
      providers: [AuthService],
    }).compileComponents();

    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(LoginComponent as any);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('rejects empty credentials', () => {
    component.username = '';
    component.password = '';
    component.submit({ invalid: true, control: { markAllAsTouched: () => {} } } as any);
    expect(component.errorMessage).toContain('Please complete');
  });

  it('saves valid credentials and navigates', async () => {
    vi.spyOn(auth, 'login').mockReturnValue(of(true));
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.username = 'user';
    component.password = 'pw';
    component.submit({ invalid: false } as any);
    expect(auth.login).toHaveBeenCalledWith('user', 'pw');
    // allow async subscriber to run
    await Promise.resolve();
    expect(router.navigate).toHaveBeenCalledWith(['/board']);
  });

  it('shows error when login fails', async () => {
    vi.spyOn(auth, 'login').mockReturnValue(of(false));
    component.username = 'bad';
    component.password = 'creds';
    component.submit({ invalid: false } as any);
    await Promise.resolve();
    expect(component.errorMessage).toContain('Invalid');
  });
});
