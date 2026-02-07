import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ProjectService } from '../../services/project.service';

@Component({
    selector: 'app-find-mentor',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './find-mentor.component.html',
    styleUrl: './find-mentor.component.css'
})
export class FindMentorComponent implements OnInit {
    searchQuery: string = '';
    selectedExpertise: string[] = [];

    expertises: string[] = ['AI', 'Cloud Computing', 'React', 'Python', 'Data Science', 'Machine Learning'];
    experienceLevels: string[] = ['Beginner (0-2 years)', 'Intermediate (2-5 years)', 'Expert (5+ years)'];
    mentors: any[] = [];
    filteredMentors: any[] = [];

    showRequestModal: boolean = false;
    selectedMentor: any = null;
    requestData = {
        title: '',
        idea: '',
        guidanceNeeded: ''
    };
    isSending: boolean = false;

    constructor(
        private http: HttpClient,
        private router: Router,
        private route: ActivatedRoute,
        private projectService: ProjectService
    ) { }

    ngOnInit(): void {
        this.loadMentors();
        this.checkQueryParams();
    }

    checkQueryParams(): void {
        this.route.queryParams.subscribe(params => {
            const mentorId = params['mentorId'];
            const autoOpen = params['autoOpen'];

            if (mentorId && autoOpen === 'true') {
                this.prefillAndOpen(mentorId);
            }
        });
    }

    prefillAndOpen(mentorId: string): void {
        // Fetch current projects to pre-fill the request
        this.projectService.getStudentProjects().subscribe({
            next: (projects) => {
                if (projects && projects.length > 0) {
                    const primaryProject = projects.find((p: any) => p.mentor) || projects[0];
                    this.requestData.title = primaryProject.title;
                    this.requestData.idea = primaryProject.idea;
                    this.requestData.guidanceNeeded = primaryProject.guidanceNeeded || '';
                }
                this.waitForMentorsAndOpen(mentorId);
            }
        });
    }

    waitForMentorsAndOpen(mentorId: string): void {
        const check = () => {
            if (this.mentors.length > 0) {
                const mentor = this.mentors.find(m => m._id === mentorId);
                if (mentor) {
                    this.openRequestModal(mentor);
                }
            } else {
                setTimeout(check, 100);
            }
        };
        check();
    }

    loadMentors(): void {
        this.http.get<any[]>('http://localhost:5000/api/auth/mentors').subscribe({
            next: (data) => {
                this.mentors = data;
                this.filteredMentors = [...this.mentors];
            },
            error: (err) => console.error('Error fetching mentors:', err)
        });
    }

    filterMentors(): void {
        this.filteredMentors = this.mentors.filter(mentor => {
            const matchesSearch = mentor.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                (mentor.expertise && mentor.expertise.some((e: string) => e.toLowerCase().includes(this.searchQuery.toLowerCase())));

            const matchesExpertise = this.selectedExpertise.length === 0 ||
                (mentor.expertise && this.selectedExpertise.some(e => mentor.expertise.includes(e)));

            return matchesSearch && matchesExpertise;
        });
    }

    toggleExpertise(expertise: string): void {
        const index = this.selectedExpertise.indexOf(expertise);
        if (index > -1) {
            this.selectedExpertise.splice(index, 1);
        } else {
            this.selectedExpertise.push(expertise);
        }
        this.filterMentors();
    }

    openRequestModal(mentor: any): void {
        this.selectedMentor = mentor;
        this.showRequestModal = true;
    }

    closeRequestModal(): void {
        this.showRequestModal = false;
        this.selectedMentor = null;
        this.requestData = { title: '', idea: '', guidanceNeeded: '' };
    }

    sendRequest(): void {
        if (!this.requestData.title || !this.requestData.idea) return;

        this.isSending = true;
        const payload = {
            ...this.requestData,
            mentorId: this.selectedMentor._id
        };

        this.http.post('http://localhost:5000/api/projects', payload, {
            headers: { 'x-auth-token': localStorage.getItem('token') || '' }
        }).subscribe({
            next: (res) => {
                alert('Mentorship request sent successfully!');
                this.isSending = false;
                this.closeRequestModal();
            },
            error: (err) => {
                console.error('Error sending request:', err);
                alert('Failed to send request. Please try again.');
                this.isSending = false;
            }
        });
    }

    connectMentor(mentor: any): void {
        // Navigate to chat with the mentor ID as a query parameter
        this.router.navigate(['/chat'], { queryParams: { mentorId: mentor._id } });
    }
}
