import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { AuthService } from './auth.service';
import { io, Socket } from 'socket.io-client';
import { SocketService } from './socket.service';

@Injectable({
    providedIn: 'root'
})
export class ChatService {
    private apiUrl = 'http://localhost:5000/api/messages';
    private messageSubject = new Subject<any>();

    constructor(private http: HttpClient, private authService: AuthService, private socketService: SocketService) {
        // Listen for new messages from socket
        this.socketService.on('new_message').subscribe((message: any) => {
            this.messageSubject.next(message);
        });
    }

    private getHeaders() {
        return new HttpHeaders().set('Authorization', `Bearer ${this.authService.getToken() || ''}`);
    }

    // New Message Observable for components to subscribe to
    onNewMessage(): Observable<any> {
        return this.messageSubject.asObservable();
    }

    sendMessage(receiverId: string, content: string): Observable<any> {
        return this.http.post(this.apiUrl, { receiverId, content }, { headers: this.getHeaders() });
    }

    getMessages(otherUserId: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/${otherUserId}`, { headers: this.getHeaders() });
    }

    markAsRead(otherUserId: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/read/${otherUserId}`, {}, { headers: this.getHeaders() });
    }

    getConversations(): Observable<any> {
        return this.http.get(`${this.apiUrl}/conversations`, { headers: this.getHeaders() });
    }

    getUserById(userId: string): Observable<any> {
        return this.http.get(`http://localhost:5000/api/auth/${userId}`, { headers: this.getHeaders() });
    }
}

