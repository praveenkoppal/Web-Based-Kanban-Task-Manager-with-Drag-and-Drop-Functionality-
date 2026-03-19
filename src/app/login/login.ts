import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent {
  username = '';
  password = '';
  errorMessage = '';

  constructor(private auth: AuthService, private router: Router) {}

  submit(form: any): void {
    this.errorMessage = '';
    if (form.invalid) {
      // mark all controls touched to show messages
      form.control.markAllAsTouched();
      this.errorMessage = 'Please complete the form';
      return;
    }

    this.auth.login(this.username.trim(), this.password).subscribe(ok => {
      if (ok) {
        this.router.navigate(['/board']);
      } else {
        this.errorMessage = 'Invalid username or password';
      }
    });
  }
}
