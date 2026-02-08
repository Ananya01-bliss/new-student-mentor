import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

interface Request {
    id: number;
    studentName: string;
    avatar: string;
    projectTitle: string;
    guidanceNeeded: string;
    matchPercentage: number;
    timestamp: Date;
    status: 'pending' | 'accepted' | 'declined';
}

@Component({
    selector: 'app-mentor-requests',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './mentor-requests.component.html',
    styleUrl: './mentor-requests.component.css'
})
export class MentorRequestsComponent implements OnInit {
    activeTab: 'pending' | 'history' = 'pending';

    requests: any[] = [];
    historyRequests: any[] = [];

    get filteredRequests() {
        return this.activeTab === 'pending' ? this.requests : this.historyRequests;
    }

    constructor(private http: HttpClient, private router: Router) { }

    ngOnInit(): void {
        this.loadRequests();
        this.loadHistory();
    }

    private getHeaders() {
        return { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` };
    }

    loadRequests(): void {
        this.http.get<any[]>('http://localhost:5000/api/projects/mentor/requests', { headers: this.getHeaders() })
            .subscribe({
                next: (data) => this.requests = data,
                error: (err) => console.error('Error loading requests:', err)
            });
    }

    loadHistory(): void {
        this.http.get<any[]>('http://localhost:5000/api/projects/mentor/mentees', { headers: this.getHeaders() })
            .subscribe({
                next: (data) => this.historyRequests = data,
                error: (err) => console.error('Error loading history:', err)
            });
    }

    setTab(tab: 'pending' | 'history') {
        this.activeTab = tab;
    }

    acceptRequest(request: any) {
        this.respondToRequest(request._id, 'approved');
    }

    declineRequest(request: any) {
        this.respondToRequest(request._id, 'rejected');
    }

    private respondToRequest(projectId: string, status: string) {
        this.http.post('http://localhost:5000/api/projects/mentor/respond',
            { projectId, status },
            { headers: this.getHeaders() })
            .subscribe({
                next: () => {
                    this.loadRequests();
                    this.loadHistory();
                },
                error: (err) => console.error('Error responding to request:', err)
            });
    }

    sendMessage(request: any) {
        this.router.navigate(['/chat'], { queryParams: { mentorId: request.student._id } });
    }
}
