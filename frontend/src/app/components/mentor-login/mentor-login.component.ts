import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-mentor-login',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    templateUrl: './mentor-login.component.html',
    styleUrls: ['./mentor-login.component.css']
})
export class MentorLoginComponent {
    loginData = {
        email: '',
        password: '',
        role: 'mentor'
    };
    errorMessage: string = '';

    constructor(private authService: AuthService, private router: Router) { }

    onLogin(event: Event) {
        event.preventDefault();
        this.errorMessage = '';

        this.authService.login(this.loginData).subscribe({
            next: (res) => {
                this.router.navigate(['/mentor/dashboard']);
            },
            error: (err) => {
                this.errorMessage = err.error.message || 'Login failed';
            }
        });
    }
}
