import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register-student',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './register-student.component.html',
  styleUrl: './register-student.component.css'
})
export class RegisterStudentComponent {
  errorMessage: string = '';
  successMessage: string = '';
  degreeLevel: 'UG' | 'PG' = 'UG';
  availableYears: number[] = [1, 2, 3, 4];

  registerData = {
    name: '',
    email: '',
    password: '',
    usn: '',
    domain: '',
    specialization: 'UG',
    year: 1,
    role: 'student'
  };

  constructor(private authService: AuthService, private router: Router) { }

  onDegreeChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.degreeLevel = select.value as 'UG' | 'PG';

    if (this.degreeLevel === 'PG') {
      this.availableYears = [1, 2];
    } else {
      this.availableYears = [1, 2, 3, 4];
    }
  }

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

    this.authService.register(this.registerData).subscribe({
      next: (res) => {
        this.successMessage = 'Registration successful! Redirecting...';
        setTimeout(() => {
          this.router.navigate(['/student/dashboard']);
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

