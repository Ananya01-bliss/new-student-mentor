import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../services/project.service';
import { ProgressBarComponent } from '../progress-bar/progress-bar.component';

@Component({
    selector: 'app-mentor-mentees',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule, ProgressBarComponent],
    templateUrl: './mentor-mentees.component.html',
    styleUrl: './mentor-mentees.component.css'
})
export class MentorMenteesComponent implements OnInit {
    mentees: any[] = [];
    selectedProject: any = null;

    // Milestone modals
    showAddMilestoneModal: boolean = false;
    showEvaluateModal: boolean = false;

    newMilestone: any = {
        title: '',
        description: '',
        dueDate: ''
    };

    evaluation: any = {
        status: 'completed',
        feedback: ''
    };

    selectedMilestone: any = null;

    constructor(private projectService: ProjectService, private router: Router) { }

    ngOnInit() {
        this.fetchMentees();
    }

    fetchMentees() {
        this.projectService.getMentorMentees().subscribe({
            next: (data) => {
                this.mentees = data;
            },
            error: (err) => console.error('Error fetching mentees:', err)
        });
    }

    getInitials(name: string): string {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    openProjectDetails(project: any) {
        this.selectedProject = project;
    }

    closeProjectDetails() {
        this.selectedProject = null;
    }

    openAddMilestone() {
        this.showAddMilestoneModal = true;
    }

    closeAddMilestone() {
        this.showAddMilestoneModal = false;
        this.newMilestone = { title: '', description: '', dueDate: '' };
    }

    submitAddMilestone() {
        if (!this.selectedProject) return;

        const data = {
            projectId: this.selectedProject._id,
            ...this.newMilestone
        };

        this.projectService.addMilestone(data).subscribe({
            next: (updatedProject) => {
                this.selectedProject = updatedProject;
                // Update in list
                const idx = this.mentees.findIndex(m => m._id === updatedProject._id);
                if (idx !== -1) this.mentees[idx] = updatedProject;
                this.closeAddMilestone();
            },
            error: (err) => alert(err.error.message || 'Error adding milestone')
        });
    }

    openEvaluate(milestone: any) {
        this.selectedMilestone = milestone;
        this.showEvaluateModal = true;
    }

    closeEvaluate() {
        this.showEvaluateModal = false;
        this.selectedMilestone = null;
        this.evaluation = { status: 'completed', feedback: '' };
    }

    submitEvaluation() {
        if (!this.selectedProject || !this.selectedMilestone) return;

        const data = {
            projectId: this.selectedProject._id,
            milestoneId: this.selectedMilestone._id,
            ...this.evaluation
        };

        this.projectService.evaluateMilestone(data).subscribe({
            next: (updatedProject) => {
                this.selectedProject = updatedProject;
                // Update in list
                const idx = this.mentees.findIndex(m => m._id === updatedProject._id);
                if (idx !== -1) this.mentees[idx] = updatedProject;
                this.closeEvaluate();
            },
            error: (err) => alert(err.error.message || 'Error evaluating milestone')
        });
    }

    openChat(studentId: string) {
        this.router.navigate(['/chat'], { queryParams: { userId: studentId } });
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'completed': return 'status-completed';
            case 'submitted': return 'status-submitted';
            default: return 'status-pending';
        }
    }

    dropMentee(projectId: string) {
        if (confirm('Are you sure you want to drop this student? This will mark the mentorship as completed and free up your intake slot.')) {
            this.projectService.completeMentorship(projectId).subscribe({
                next: () => {
                    this.fetchMentees();
                    this.closeProjectDetails();
                },
                error: (err) => {
                    console.error('Error dropping mentee:', err);
                    alert(err.error?.message || 'Error dropping mentee. Please try again.');
                }
            });
        }
    }
}
