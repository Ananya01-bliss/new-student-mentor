import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Important for ngClass and titlecase pipe
import { Router, RouterLink } from '@angular/router';
import { ThemeSwitcherComponent } from '../theme-switcher/theme-switcher.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, ThemeSwitcherComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  role: 'student' | 'mentor' = 'student';
  errorMessage: string = '';
  successMessage: string = '';

  constructor(private router: Router) { }

  setRole(role: 'student' | 'mentor') {
    this.role = role;
    this.errorMessage = '';
    this.successMessage = '';
  }

  onLogin(event: Event) {
    event.preventDefault();
    this.errorMessage = '';
    this.successMessage = '';

    const form = event.target as HTMLFormElement;
    const email = (form.querySelector('#email') as HTMLInputElement).value;
    const password = (form.querySelector('#password') as HTMLInputElement).value;

    if (!email || !password) {
      this.errorMessage = 'Please fill in all fields.';
      return;
    }

    if (!email.includes('@')) {
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }

    // Simulate API delay
    this.successMessage = 'Login successful! Redirecting...';
    setTimeout(() => {
      // Navigate to respective dashboard
      if (this.role === 'student') {
        this.router.navigate(['/student/dashboard']);
      } else {
        this.router.navigate(['/mentor/dashboard']);
      }
    }, 1000); // 1-second delay for user to see the message
  }
}
