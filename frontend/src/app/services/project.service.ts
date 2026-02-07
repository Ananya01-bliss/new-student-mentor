import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class ProjectService {
    private apiUrl = 'http://localhost:5000/api/projects';

    constructor(private http: HttpClient, private authService: AuthService) { }

    private getHeaders() {
        return new HttpHeaders().set('x-auth-token', this.authService.getToken() || '');
    }

    createProject(projectData: any): Observable<any> {
        return this.http.post(this.apiUrl, projectData, { headers: this.getHeaders() });
    }

    getStudentProjects(): Observable<any> {
        return this.http.get(`${this.apiUrl}/student`, { headers: this.getHeaders() });
    }

    getMentorRequests(): Observable<any> {
        return this.http.get(`${this.apiUrl}/mentor/requests`, { headers: this.getHeaders() });
    }

    respondToRequest(projectId: string, status: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/mentor/respond`, { projectId, status }, { headers: this.getHeaders() });
    }

    getMentorMentees(): Observable<any> {
        return this.http.get(`${this.apiUrl}/mentor/mentees`, { headers: this.getHeaders() });
    }

    updateProject(id: string, projectData: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, projectData, { headers: this.getHeaders() });
    }

    addMilestone(data: { projectId: string, title: string, description: string, dueDate: Date }): Observable<any> {
        return this.http.post(`${this.apiUrl}/add-milestone`, data, { headers: this.getHeaders() });
    }

    submitMilestone(data: { projectId: string, milestoneId: string, submission: string }): Observable<any> {
        return this.http.post(`${this.apiUrl}/submit-milestone`, data, { headers: this.getHeaders() });
    }

    submitMilestoneWithFile(projectId: string, milestoneId: string, file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectId);
        formData.append('milestoneId', milestoneId);

        // We don't set Content-Type header here so that the browser sets it correctly with boundary
        const headers = new HttpHeaders().set('x-auth-token', this.authService.getToken() || '');
        return this.http.post(`${this.apiUrl}/submit-milestone-file`, formData, { headers });
    }

    cancelSubmission(projectId: string, milestoneId: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/cancel-submission`, { projectId, milestoneId }, { headers: this.getHeaders() });
    }

    evaluateMilestone(data: { projectId: string, milestoneId: string, status: string, feedback: string }): Observable<any> {
        return this.http.post(`${this.apiUrl}/evaluate-milestone`, data, { headers: this.getHeaders() });
    }

    deleteProject(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
    }

    getSuggestedMentors(projectId: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/${projectId}/suggested-mentors`, { headers: this.getHeaders() });
    }

    getSuggestionsByKeywords(keywords: string[]): Observable<any> {
        return this.http.post(`${this.apiUrl}/suggestions`, { keywords }, { headers: this.getHeaders() });
    }

    completeMentorship(projectId: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/mentor/complete`, { projectId }, { headers: this.getHeaders() });
    }

    getMentorStats(): Observable<any> {
        return this.http.get(`${this.apiUrl}/mentor/stats`, { headers: this.getHeaders() });
    }
}

