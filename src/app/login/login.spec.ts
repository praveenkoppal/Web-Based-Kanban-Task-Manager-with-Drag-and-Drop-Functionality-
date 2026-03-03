import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LoginComponent } from './login';
import { AuthService } from '../services/auth.service';

class FakeRouter {
  navigate = vi.fn();
  createUrlTree() {
    return '/login';
  }
}

describe('LoginComponent', () => {
  let auth: AuthService;
  let router: Router;
  let fixture: any;
  let component: LoginComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent, FormsModule],
      providers: [AuthService, { provide: Router, useClass: FakeRouter }],
    }).compileComponents();

    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(LoginComponent as any);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('rejects empty credentials', () => {
    component.username = '';
    component.password = '';
    component.submit();
    expect(component.errorMessage).toContain('required');
  });

  it('saves valid credentials and navigates', () => {
    vi.spyOn(auth, 'login').mockReturnValue(true);
    component.username = 'user';
    component.password = 'pw';
    component.submit();
    expect(auth.login).toHaveBeenCalledWith('user', 'pw');
    expect(router.navigate).toHaveBeenCalledWith(['/board']);
  });
});
