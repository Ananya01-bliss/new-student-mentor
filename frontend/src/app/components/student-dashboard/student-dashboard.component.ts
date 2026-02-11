import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { AuthService } from '../../services/auth.service';
import { ProgressBarComponent } from '../progress-bar/progress-bar.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ProgressBarComponent],
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.css']
})
export class StudentDashboardComponent implements OnInit, OnDestroy {
  project: any = null;
  projects: any[] = [];
  completedMilestones: number = 0;
  totalMilestones: number = 0;
  userName: string = 'Student';
  suggestedMentors: any[] = [];
  private userSubscription: Subscription | null = null;

  constructor(
    private projectService: ProjectService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    // Subscribe to user changes to detect login/logout transitions
    this.userSubscription = this.authService.currentUser.subscribe(user => {
      if (user && user.role === 'student') {
        this.fetchDashboardData();
        this.getUserName();
      } else if (user && user.role === 'mentor') {
        // Redirection safety check
        this.router.navigate(['/mentor/dashboard']);
      }
    });
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  getUserName() {
    this.authService.currentUser.subscribe(user => {
      if (user && user.name) {
        this.userName = user.name.split(' ')[0];
      }
    });
  }

  fetchDashboardData() {
    this.projectService.getStudentProjects().subscribe({
      next: (projects) => {
        if (projects && projects.length > 0) {
          this.projects = projects;
          this.project = projects.find((p: any) => p.mentor) || projects[0];
          this.totalMilestones = this.project.milestones?.length || 0;
          this.completedMilestones = this.project.milestones?.filter((m: any) => m.status === 'completed').length || 0;

          if (this.project._id) {
            this.fetchSuggestions(this.project._id);
          }
        }
      },
      error: (err) => console.error('Error fetching projects:', err)
    });
  }

  fetchSuggestions(projectId: string) {
    this.projectService.getSuggestedMentors(projectId).subscribe({
      next: (mentors) => this.suggestedMentors = mentors,
      error: (err) => console.error('Error fetching dashboard suggestions:', err)
    });
  }
}
