import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-mentor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mentor-dashboard.component.html',
  styleUrls: ['./mentor-dashboard.component.css']
})
export class MentorDashboardComponent implements OnInit {
  menteeCount: number = 0;
  pendingRequests: number = 0;
  userName: string = 'Mentor';
  requests: any[] = [];
  mentees: any[] = [];
  maxStudents: number = 5; // Default from schema
  errorMessage: string = '';
  completedProjects: number = 0;

  constructor(
    private projectService: ProjectService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.authService.currentUser.subscribe(user => {
      if (user && user.role === 'mentor') {
        this.fetchDashboardData();
        this.getUserName();
        this.loadMentorConfig();
      } else if (user && user.role === 'student') {
        this.router.navigate(['/student/dashboard']);
      }
    });
  }

  loadMentorConfig() {
    this.authService.currentUser.subscribe(user => {
      if (user && user.role === 'mentor' && user.maxStudents) {
        this.maxStudents = user.maxStudents;
      }
    });
  }

  getUserName() {
    this.authService.currentUser.subscribe(user => {
      if (user && user.name) {
        this.userName = user.name.split(' ')[0];
      }
    });
  }

  fetchDashboardData() {
    this.projectService.getMentorMentees().subscribe({
      next: (mentees) => {
        this.mentees = mentees;
        this.menteeCount = mentees.length;
      }
    });

    this.projectService.getMentorRequests().subscribe({
      next: (requests) => {
        this.requests = requests;
        this.pendingRequests = requests.length;
      }
    });

    this.projectService.getMentorStats().subscribe({
      next: (stats) => {
        this.completedProjects = stats.completedProjects;
        // Optimization: We could also get menteeCount and pendingRequests from here
      },
      error: (err) => console.error('Error fetching dashboard stats:', err)
    });
  }

  respondToRequest(projectId: string, status: string) {
    this.errorMessage = '';
    this.projectService.respondToRequest(projectId, status).subscribe({
      next: () => {
        this.fetchDashboardData(); // Refresh data after responding
      },
      error: (err) => {
        console.error('Error responding to request:', err);
        this.errorMessage = err.error?.message || 'Failed to update request status.';
      }
    });
  }
}
