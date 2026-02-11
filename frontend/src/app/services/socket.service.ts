import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class SocketService {
    private socket: Socket;
    private connectedSubject = new BehaviorSubject<boolean>(false);
    public connected$ = this.connectedSubject.asObservable();

    constructor(private authService: AuthService) {
        this.socket = io('http://localhost:5000', {
            withCredentials: true,
            autoConnect: true
        });

        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket.id);
            this.connectedSubject.next(true);
            this.joinUserRoom();
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
            this.connectedSubject.next(false);
        });

        // Listen for user changes to rejoin room
        let lastUserId: string | null = null;
        this.authService.currentUser.subscribe(user => {
            if (lastUserId) {
                this.leaveUserRoom(lastUserId);
            }
            if (user) {
                lastUserId = user._id || user.id;
                this.joinUserRoom();
            } else {
                lastUserId = null;
            }
        });
    }

    private leaveUserRoom(userId: string) {
        if (this.socket.connected) {
            console.log('Leaving room:', userId);
            this.socket.emit('leave', userId);
        }
    }

    private joinUserRoom() {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        const userId = user?._id || user?.id;
        if (userId && this.socket.connected) {
            console.log('Joining room:', userId);
            this.socket.emit('join', userId);
        }
    }

    on(event: string): Observable<any> {
        return new Observable(observer => {
            this.socket.on(event, (data) => observer.next(data));
            return () => this.socket.off(event);
        });
    }

    emit(event: string, data: any) {
        this.socket.emit(event, data);
    }

    getSocketId(): string | undefined {
        return this.socket.id;
    }
}
