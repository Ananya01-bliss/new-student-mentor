import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register-mentor',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './register-mentor.component.html',
  styleUrl: './register-mentor.component.css'
})
export class RegisterMentorComponent {
  errorMessage: string = '';
  successMessage: string = '';

  registerData = {
    name: '',
    email: '',
    password: '',
    rePassword: '',
    maxStudents: null,
    expertise: '',
    shortDescription: '',
    role: 'mentor'
  };

  get wordCount(): number {
    return this.registerData.shortDescription ? this.registerData.shortDescription.trim().split(/\s+/).length : 0;
  }

  constructor(private authService: AuthService, private router: Router) { }

  onRegister(event: Event) {
    event.preventDefault();
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.isValidEmail(this.registerData.email)) {
      this.errorMessage = 'Please enter a valid email address (e.g., gmail.com, rocketmail.com).';
      return;
    }

    if (this.registerData.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long.';
      return;
    }

    if (this.wordCount > 200) {
      this.errorMessage = 'Short description cannot exceed 200 words.';
      return;
    }

    if (this.registerData.password !== this.registerData.rePassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    const payload = {
      ...this.registerData,
      expertise: this.registerData.expertise.split(',').map(s => s.trim()).filter(s => s !== '')
    };

    this.authService.register(payload).subscribe({
      next: (res) => {
        this.successMessage = 'Mentor Registration successful! Redirecting...';
        setTimeout(() => {
          this.router.navigate(['/mentor/dashboard']);
        }, 1000);
      },
      error: (err) => {
        this.errorMessage = err.error.message || 'Registration failed';
      }
    });
  }

  allowedDomains: string[] = [
    'gmail.com',
    'yahoo.com',
    'yahoo.co.in',
    'rocketmail.com',
    'outlook.com',
    'hotmail.com',
    'icloud.com'
  ];
  isValidEmail(email: string): boolean {
    // basic email format check
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(email)) {
      return false;
    }

    const domain = email.split('@')[1]?.toLowerCase();
    return this.allowedDomains.includes(domain);
  }


}
