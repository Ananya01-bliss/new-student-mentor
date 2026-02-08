import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-student-login',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    templateUrl: './student-login.component.html',
    styleUrls: ['./student-login.component.css']
})
export class StudentLoginComponent {
    loginData = {
        email: '',
        password: '',
    };
    errorMessage: string = '';

    constructor(private authService: AuthService, private router: Router) { }

    onLogin(event: Event) {
        event.preventDefault();
        this.errorMessage = '';

        this.authService.login(this.loginData).subscribe({
            next: (res) => {
                console.log('LOGIN RESPONSE:', res);
                this.router.navigate(['/student/dashboard']);
            },
            error: (err) => {
                this.errorMessage = err.error.message || 'Login failed';
            }
        });
    }
}
