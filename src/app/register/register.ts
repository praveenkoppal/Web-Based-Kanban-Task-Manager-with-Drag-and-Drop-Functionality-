import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class RegisterComponent {
  username = '';
  password = '';
  confirm = '';
  errorMessage = '';

  constructor(private auth: AuthService, private router: Router) {}

  submit(form: any): void {
    this.errorMessage = '';
    if (form.invalid) {
      form.control.markAllAsTouched();
      this.errorMessage = 'Please complete the form';
      return;
    }

    if (this.password !== this.confirm) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    // require at least one letter and four digits
    const complexity = /^(?=.*[A-Za-z])(?=(.*\d){4,}).+$/;
    if (!complexity.test(this.password)) {
      this.errorMessage = 'Password must contain at least one letter and four numbers';
      return;
    }

    this.auth.register(this.username.trim(), this.password).subscribe(ok => {
      if (ok) {
        // after registering send user to login page
        this.router.navigate(['/login']);
      } else {
        this.errorMessage = 'Unable to create account (username may already exist)';
      }
    });
  }
}
