import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationsService, NotificationItem } from '../../services/notifications.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {
  notifications: NotificationItem[] = [];
  filteredNotifications: NotificationItem[] = [];
  filterUnread: boolean = false;
  currentUserId: string = '';

  constructor(
    private notificationsService: NotificationsService,
    public router: Router
  ) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.currentUserId = user._id || user.id;
  }

  ngOnInit(): void {
    this.notificationsService.getNotifications().subscribe(list => {
      this.notifications = list;
      this.applyFilter();
    });
  }

  markRead(n: NotificationItem) {
    this.notificationsService.markAsRead(n.id);
    this.applyFilter();
  }

  goToChat(mentorId: string | undefined) {
    if (mentorId) {
      this.router.navigate(['/chat'], { queryParams: { mentorId: mentorId } });
    }
  }

  clearAll() {
    if (confirm('Are you sure you want to clear all notifications?')) {
      this.notificationsService.clearAll();
      this.applyFilter();
    }
  }

  toggleUnreadFilter() {
    this.filterUnread = !this.filterUnread;
    this.applyFilter();
  }

  private applyFilter() {
    if (this.filterUnread) {
      this.filteredNotifications = this.notifications.filter(n => !n.read);
    } else {
      this.filteredNotifications = [...this.notifications];
    }
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  getIcon(n: NotificationItem): string {
    const title = n.title.toLowerCase();
    if (title.includes('mentor')) return '👨‍🏫';
    if (title.includes('project')) return '📋';
    if (title.includes('milestone')) return '🎯';
    if (title.includes('message')) return '💬';
    if (title.includes('approval')) return '✅';
    if (title.includes('rejected')) return '❌';
    if (title.includes('warning')) return '⚠️';
    if (title.includes('error')) return '🔴';
    return '🔔';
  }
}
