import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../services/project.service';
import { NotificationsService } from '../../services/notifications.service';
import { ProgressBarComponent } from '../progress-bar/progress-bar.component';

@Component({
    selector: 'app-student-projects',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule, ProgressBarComponent],
    templateUrl: './student-projects.component.html',
    styleUrls: ['./student-projects.component.css']
})
export class StudentProjectsComponent implements OnInit {
    projectTitle: string = '';
    aboutProject: string = '';
    guidanceNeeded: string = '';
    projectId: string | null = null;
    successMessage: string = '';
    errorMessage: string = '';
    projectKeywords: string = '';
    suggestedMentors: any[] = [];
    status: string = '';
    mentorName: string = '';
    progress: number = 0;
    milestones: any[] = [];

    // Milestone submission
    showSubmitModal: boolean = false;
    selectedMilestone: any = null;
    submissionText: string = '';
    submissionType: 'text' | 'file' = 'text';
    selectedFile: File | null = null;
    submitting: boolean = false;

    // Request Mentorship Modal
    showRequestModal: boolean = false;
    selectedMentor: any = null;
    requestData = {
        title: '',
        idea: '',
        guidanceNeeded: ''
    };
    isSending: boolean = false;

    constructor(private router: Router, private projectService: ProjectService, private route: ActivatedRoute, private notificationsService: NotificationsService) { }

    ngOnInit() {
        this.fetchProject();
    }

    fetchProject() {
        this.route.queryParams.subscribe(params => {
            const targetId = params['id'];

            // Clear alerts on every navigation
            this.errorMessage = '';
            this.successMessage = '';

            if (!targetId) {
                // New Project Mode
                this.projectId = null;
                this.status = 'draft';
                this.projectTitle = '';
                this.aboutProject = '';
                this.guidanceNeeded = '';
                this.projectKeywords = '';
                this.milestones = [];
                this.progress = 0;
                this.suggestedMentors = [];
                return;
            }

            // Fetch projects
            this.projectService.getStudentProjects().subscribe({
                next: (projects) => {
                    const project = projects.find((p: any) => p._id === targetId);
                    if (project) {
                        this.projectTitle = project.title;
                        this.aboutProject = project.idea;
                        this.guidanceNeeded = project.guidanceNeeded || '';
                        this.projectId = project._id;
                        this.projectKeywords = project.keywords ? project.keywords.join(', ') : '';
                        this.status = project.status;
                        this.mentorName = project.mentor?.name || '';
                        this.progress = project.progress || 0;
                        this.milestones = project.milestones || [];

                        // Show suggestions ONLY if NOT approved
                        if (this.status !== 'approved') {
                            this.fetchSuggestions();
                        } else {
                            this.suggestedMentors = [];
                        }
                    } else {
                        this.errorMessage = 'Project not found or access denied.';
                        this.projectId = null;
                    }
                },
                error: (err) => {
                    console.error('Error loading projects:', err);
                    this.errorMessage = 'Could not load project info.';
                }
            });
        });
    }

    onSave() {
        const projectData = {
            title: this.projectTitle.trim(),
            idea: this.aboutProject,
            guidanceNeeded: this.guidanceNeeded,
            keywords: this.projectKeywords.split(',').map(k => k.trim()).filter(k => k !== '')
        };

        if (!projectData.title || !projectData.idea) {
            this.errorMessage = 'Title and About Project are required.';
            return;
        }

        this.projectService.createProject(projectData).subscribe({
            next: (res) => {
                this.successMessage = 'Project saved successfully!';
                this.projectId = res._id;
                this.status = res.status || 'draft';
                // Add ID to URL without refreshing
                this.router.navigate([], {
                    relativeTo: this.route,
                    queryParams: { id: res._id },
                    queryParamsHandling: 'merge'
                });
                this.fetchSuggestions();
                setTimeout(() => this.successMessage = '', 3000);
            },
            error: (err) => {
                this.errorMessage = err.error.message || 'Error saving project';
            }
        });
    }

    onUpdate() {
        if (!this.projectId) return;

        const projectData = {
            title: this.projectTitle.trim(),
            idea: this.aboutProject,
            guidanceNeeded: this.guidanceNeeded,
            keywords: this.projectKeywords.split(',').map(k => k.trim()).filter(k => k !== '')
        };

        this.projectService.updateProject(this.projectId, projectData).subscribe({
            next: (res) => {
                this.successMessage = 'Project updated successfully!';
                if (this.status !== 'approved') {
                    this.fetchSuggestions();
                }
                setTimeout(() => this.successMessage = '', 3000);
            },
            error: (err) => {
                this.errorMessage = err.error.message || 'Error updating project';
            }
        });
    }

    onKeywordsChange() {
        if (this.status === 'approved') return;

        if (!this.projectKeywords.trim()) {
            this.suggestedMentors = [];
            return;
        }

        const keywordsArray = this.projectKeywords.split(',').map(k => k.trim()).filter(k => k !== '');
        if (keywordsArray.length > 0) {
            this.projectService.getSuggestionsByKeywords(keywordsArray).subscribe({
                next: (mentors) => {
                    this.suggestedMentors = mentors;
                },
                error: (err) => console.error('Error fetching suggestions by keywords', err)
            });
        } else {
            this.suggestedMentors = [];
        }
    }

    fetchSuggestions() {
        if (!this.projectId) return;
        this.projectService.getSuggestedMentors(this.projectId).subscribe({
            next: (mentors) => this.suggestedMentors = mentors,
            error: (err) => console.error('Error fetching suggestions', err)
        });
    }

    connectToMentor(mentor: any) {
        if (!this.projectId) {
            // New project: must save first
            const projectData = {
                title: this.projectTitle.trim(),
                idea: this.aboutProject,
                guidanceNeeded: this.guidanceNeeded,
                keywords: this.projectKeywords.split(',').map(k => k.trim()).filter(k => k !== '')
            };

            if (!projectData.title || !projectData.idea) {
                this.errorMessage = 'Please provide a title and idea for your project first.';
                return;
            }

            this.projectService.createProject(projectData).subscribe({
                next: (res) => {
                    this.projectId = res._id;
                    this.router.navigate([], {
                        relativeTo: this.route,
                        queryParams: { id: res._id },
                        queryParamsHandling: 'merge'
                    });
                    this.selectedMentor = mentor;
                    this.requestData = {
                        title: this.projectTitle.trim(),
                        idea: this.aboutProject,
                        guidanceNeeded: this.guidanceNeeded
                    };
                    this.showRequestModal = true;
                },
                error: (err) => this.errorMessage = 'Error saving project before connection.'
            });
            return;
        }

        this.selectedMentor = mentor;
        this.requestData = {
            title: this.projectTitle.trim(),
            idea: this.aboutProject,
            guidanceNeeded: this.guidanceNeeded
        };
        this.showRequestModal = true;
    }

    closeRequestModal() {
        this.showRequestModal = false;
        this.selectedMentor = null;
    }

    sendRequest() {
        if (!this.selectedMentor || !this.projectId) return;

        this.isSending = true;
        const projectData = {
            title: this.requestData.title.trim(),
            idea: this.requestData.idea,
            guidanceNeeded: this.requestData.guidanceNeeded,
            keywords: this.projectKeywords.split(',').map(k => k.trim()).filter(k => k !== ''),
            mentorId: this.selectedMentor._id || this.selectedMentor.id
        };

        this.projectService.updateProject(this.projectId, projectData).subscribe({
            next: (res) => {
                this.successMessage = 'Mentorship request sent successfully!';
                this.status = 'pending';
                this.mentorName = res.mentor?.name || '';
                this.suggestedMentors = [];
                this.closeRequestModal();
                setTimeout(() => this.successMessage = '', 3000);
            },
            error: (err) => {
                this.errorMessage = err.error.message || 'Error sending mentorship request';
                this.isSending = false;
            }
        });
    }

    applyToMentor(mentorId: string) {
        this.connectToMentor({ _id: mentorId, id: mentorId });
    }

    // Milestone Methods
    openSubmitModal(milestone: any) {
        this.selectedMilestone = milestone;
        this.showSubmitModal = true;
    }

    closeSubmitModal() {
        this.showSubmitModal = false;
        this.selectedMilestone = null;
        this.submissionText = '';
        this.selectedFile = null;
        this.submissionType = 'text';
    }

    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            this.selectedFile = file;
        }
    }

    submitMilestone() {
        if (!this.projectId || !this.selectedMilestone) return;

        this.submitting = true;

        if (this.submissionType === 'file' && this.selectedFile) {
            this.projectService.submitMilestoneWithFile(this.projectId, this.selectedMilestone._id, this.selectedFile).subscribe({
                next: (res) => {
                    this.successMessage = 'Milestone file submitted successfully!';
                    this.notificationsService.notifyMilestoneSubmitted(this.selectedMilestone.title);
                    this.fetchProject();
                    this.closeSubmitModal();
                    this.submitting = false;
                },
                error: (err) => {
                    this.errorMessage = err.error.message || 'Error uploading file';
                    this.notificationsService.notifyError(this.errorMessage);
                    this.submitting = false;
                }
            });
        } else {
            const data = {
                projectId: this.projectId,
                milestoneId: this.selectedMilestone._id,
                submission: this.submissionText
            };

            this.projectService.submitMilestone(data).subscribe({
                next: (res) => {
                    this.successMessage = 'Milestone submitted successfully!';
                    this.notificationsService.notifyMilestoneSubmitted(this.selectedMilestone.title);
                    this.fetchProject();
                    this.closeSubmitModal();
                    this.submitting = false;
                },
                error: (err) => {
                    this.errorMessage = err.error.message || 'Error submitting milestone';
                    this.notificationsService.notifyError(this.errorMessage);
                    this.submitting = false;
                }
            });
        }
    }

    cancelSubmissionRequest(milestone: any) {
        if (!this.projectId) return;

        this.projectService.cancelSubmission(this.projectId, milestone._id).subscribe({
            next: () => {
                this.successMessage = 'Submission cancelled';
                this.fetchProject();
            },
            error: (err) => {
                this.errorMessage = err.error.message || 'Error cancelling submission';
            }
        });
    }
}
