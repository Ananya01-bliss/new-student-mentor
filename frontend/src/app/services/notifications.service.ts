import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';

export interface NotificationItem {
    id: string;
    title: string;
    body: string;
    timestamp: string; // ISO string
    read?: boolean;
    type?: 'info' | 'success' | 'warning' | 'error';
}

@Injectable({
    providedIn: 'root'
})
export class NotificationsService {
    private storageKey = 'app_notifications_v1';
    private subject = new BehaviorSubject<NotificationItem[]>(this.loadFromStorage());

    private loadFromStorage(): NotificationItem[] {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (!raw) return [];
            return JSON.parse(raw);
        } catch (e) {
            return [];
        }
    }

    private saveToStorage(items: NotificationItem[]) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(items));
            this.subject.next(items);
        } catch (e) { }
    }

    getNotifications(): Observable<NotificationItem[]> {
        return this.subject.asObservable();
    }

    addNotification(item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) {
        const list = this.loadFromStorage();
        const newItem: NotificationItem = {
            id: String(Date.now()) + Math.random().toString(36).slice(2, 7),
            title: item.title,
            body: item.body,
            timestamp: new Date().toISOString(),
            read: false,
            type: item.type || 'info'
        };
        list.unshift(newItem);
        // Keep only last 50 notifications
        const trimmed = list.slice(0, 50);
        this.saveToStorage(trimmed);
    }

    markAsRead(id: string) {
        const list = this.loadFromStorage();
        const idx = list.findIndex(n => n.id === id);
        if (idx !== -1) {
            list[idx].read = true;
            this.saveToStorage(list);
        }
    }

    markAllAsRead() {
        const list = this.loadFromStorage();
        list.forEach(n => n.read = true);
        this.saveToStorage(list);
    }

    clearAll() {
        this.saveToStorage([]);
    }

    // Quick notification helpers for common scenarios
    notifyMentorApproval(mentorName: string) {
        this.addNotification({
            title: '✅ Mentor Approved',
            body: `${mentorName} has approved your mentorship request! You can now chat with them.`,
            type: 'success'
        });
    }

    notifyMentorRejection(mentorName: string) {
        this.addNotification({
            title: '❌ Mentor Request Rejected',
            body: `${mentorName} declined your mentorship request. You can try another mentor.`,
            type: 'warning'
        });
    }

    notifyMilestoneSubmitted(milestoneName: string) {
        this.addNotification({
            title: '🎯 Milestone Submitted',
            body: `You have successfully submitted "${milestoneName}". Waiting for mentor feedback.`,
            type: 'success'
        });
    }

    notifyMilestoneApproved(milestoneName: string) {
        this.addNotification({
            title: '✅ Milestone Approved',
            body: `Milestone "${milestoneName}" has been approved by your mentor!`,
            type: 'success'
        });
    }

    notifyMilestoneRejected(milestoneName: string, feedback: string = '') {
        this.addNotification({
            title: '❌ Milestone Rejected',
            body: `Milestone "${milestoneName}" needs revision.${feedback ? ' Feedback: ' + feedback : ''}`,
            type: 'warning'
        });
    }

    notifyNewMessage(senderName: string) {
        this.addNotification({
            title: '💬 New Message',
            body: `${senderName} sent you a message. Check your chat to read it.`,
            type: 'info'
        });
    }

    notifyMentorRequest(studentName: string, projectTitle: string) {
        this.addNotification({
            title: '📋 New Mentorship Request',
            body: `${studentName} requested mentorship on "${projectTitle}".`,
            type: 'info'
        });
    }

    notifyProjectUpdate(projectTitle: string, update: string) {
        this.addNotification({
            title: '📝 Project Updated',
            body: `${projectTitle}: ${update}`,
            type: 'info'
        });
    }

    notifyError(message: string) {
        this.addNotification({
            title: '🔴 Error',
            body: message,
            type: 'error'
        });
    }
}
