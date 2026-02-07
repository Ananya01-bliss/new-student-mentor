import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { ProgressBarComponent } from '../progress-bar/progress-bar.component';

@Component({
    selector: 'app-all-projects',
    standalone: true,
    imports: [CommonModule, RouterLink, ProgressBarComponent],
    templateUrl: './all-projects.component.html',
    styleUrls: ['./all-projects.component.css']
})
export class AllProjectsComponent implements OnInit {
    projects: any[] = [];
    loading: boolean = true;
    error: string = '';

    constructor(private projectService: ProjectService, private router: Router) { }

    ngOnInit() {
        this.fetchProjects();
    }

    fetchProjects() {
        this.loading = true;
        this.projectService.getStudentProjects().subscribe({
            next: (projects) => {
                this.projects = projects;
                this.loading = false;
            },
            error: (err) => {
                this.error = 'Failed to load projects';
                this.loading = false;
                console.error(err);
            }
        });
    }

    onDelete(projectId: string, event: Event) {
        event.stopPropagation(); // Prevent card click
        if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            this.projectService.deleteProject(projectId).subscribe({
                next: () => {
                    this.projects = this.projects.filter(p => p._id !== projectId);
                },
                error: (err) => {
                    console.error('Delete error details:', err);
                    alert('Delete Failed. Status: ' + err.status + ' ' + err.statusText + '\nBody: ' + JSON.stringify(err.error));
                }
            });
        }
    }

    viewProject(projectId: string) {
        this.router.navigate(['/student/projects'], { queryParams: { id: projectId } });
    }

    createNew() {
        this.router.navigate(['/student/projects']);
    }
}
