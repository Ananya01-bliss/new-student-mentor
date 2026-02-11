import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { ProjectService } from '../../services/project.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  messages: any[] = [];
  contacts: any[] = [];
  selectedContact: any = null;
  newMessage: string = '';
  currentUser: any = null;
  isApproved: boolean = false;
  statusMessage: string = '';
  errorMessage: string = '';

  constructor(
    private location: Location,
    private router: Router,
    private route: ActivatedRoute,
    private chatService: ChatService,
    private authService: AuthService,
    private projectService: ProjectService
  ) { }

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;

      const mentorId = this.route.snapshot.queryParamMap.get('mentorId');
      const projectId = this.route.snapshot.queryParamMap.get('projectId');

      if (this.currentUser?.role === 'mentor') {
        this.isApproved = true;
        this.loadConversations(mentorId);
      } else {
        this.checkMentorshipApproval(mentorId, projectId);
      }
    });

    // Listen for real-time messages
    this.chatService.onNewMessage().subscribe(msg => {
      const senderId = msg.sender._id || msg.sender;
      const currentUserId = this.currentUser?._id || this.currentUser?.id;

      // Ignore if I am the sender
      if (senderId === currentUserId) return;

      // Add to messages if it belongs to current conversation
      if (this.selectedContact && senderId === this.selectedContact._id) {
        this.messages.push(msg);
        this.scrollToBottom();
        // Mark as read immediately if chat is open
        this.chatService.markAsRead(senderId).subscribe();
      }

      // Update the contact list dynamically
      const contactIndex = this.contacts.findIndex(c => c._id === senderId);
      if (contactIndex !== -1) {
        const contact = this.contacts[contactIndex];
        contact.lastMessage = msg.content;
        contact.lastMessageTime = msg.timestamp;

        // Only increment unread if not currently selected
        if (!this.selectedContact || this.selectedContact._id !== senderId) {
          contact.unreadCount = (contact.unreadCount || 0) + 1;
        }

        // Move contact to top
        this.contacts.splice(contactIndex, 1);
        this.contacts.unshift(contact);
      } else {
        // If it's a new conversation, refresh the whole list
        this.loadConversations();
      }
    });
  }

  checkMentorshipApproval(mentorId: string | null, projectId?: string | null): void {
    if (!mentorId) {
      this.isApproved = true; // Allow existing conversations
      this.loadConversations();
      return;
    }

    // If a projectId is provided, prefer checking that project directly
    if (projectId) {
      this.projectService.getStudentProjects().subscribe({
        next: (projects) => {
          const match = projects.find((p: any) => p._id === projectId);
          if (match && match.mentor && (match.mentor._id === mentorId || match.mentor === mentorId) && match.status === 'approved') {
            this.isApproved = true;
            this.errorMessage = '';
          } else {
            // fallback to searching any approved project for this mentor
            const approvedProject = projects.find((p: any) => p.mentor && (p.mentor._id === mentorId || p.mentor === mentorId) && p.status === 'approved');
            if (approvedProject) {
              this.isApproved = true;
              this.errorMessage = '';
            } else {
              this.isApproved = false;
              this.errorMessage = 'You can only chat with mentors after they approve your mentorship request.';
              this.statusMessage = 'Waiting for mentor approval...';
            }
          }
          this.loadConversations(mentorId);
        },
        error: (err) => {
          console.error('Error checking mentorship:', err);
          this.isApproved = false;
          this.errorMessage = 'Error verifying mentorship status.';
          this.loadConversations(mentorId);
        }
      });
      return;
    }

    // Otherwise check any approved project tied to this mentor
    this.projectService.getStudentProjects().subscribe({
      next: (projects) => {
        const approvedProject = projects.find((p: any) => p.mentor && (p.mentor._id === mentorId || p.mentor === mentorId) && p.status === 'approved');
        if (approvedProject) {
          this.isApproved = true;
          this.errorMessage = '';
          this.statusMessage = '';
        } else {
          this.isApproved = false;
          this.errorMessage = 'You can only chat with mentors after they approve your mentorship request.';
          this.statusMessage = 'Waiting for mentor approval...';
        }
        this.loadConversations(mentorId);
      },
      error: (err) => {
        console.error('Error checking mentorship:', err);
        this.isApproved = false;
        this.statusMessage = '';
        this.errorMessage = 'Error verifying mentorship status.';
        this.loadConversations(mentorId);
      }
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  loadConversations(highlightId: string | null = null): void {
    this.chatService.getConversations().subscribe({
      next: (contacts) => {
        this.contacts = contacts;
        this.processSelection(highlightId);
      },
      error: (err) => {
        console.error('Error loading conversations:', err);
        if (highlightId) {
          this.processSelection(highlightId);
        }
      }
    });
  }

  private processSelection(highlightId: string | null): void {
    if (highlightId) {
      const contact = this.contacts.find(c => c._id === highlightId || c.id === highlightId);
      if (contact) {
        if (!this.selectedContact || (this.selectedContact._id !== contact._id && this.selectedContact.id !== contact._id)) {
          this.selectContact(contact);
        }
      } else if (this.isApproved) {
        this.chatService.getUserById(highlightId).subscribe(user => {
          if (user) {
            const newUser = { ...user, _id: user._id || user.id, id: user.id || user._id };
            const exists = this.contacts.find(c => c._id === newUser._id || c.id === newUser._id);
            if (!exists) {
              this.contacts.unshift(newUser);
              this.selectContact(newUser);
            } else {
              this.selectContact(exists);
            }
          }
        });
      }
    } else if (this.contacts.length > 0 && !this.selectedContact) {
      this.selectContact(this.contacts[0]);
    }
  }

  loadMessages(contactId: string): void {
    this.chatService.getMessages(contactId).subscribe(messages => {
      this.messages = messages;
      this.scrollToBottom();
    });
  }

  goBack(): void {
    this.location.back();
  }

  sendMessage(): void {
    if (!this.isApproved) {
      this.errorMessage = 'You cannot send messages until the mentor approves your request.';
      return;
    }

    if (this.newMessage.trim() && this.selectedContact) {
      const content = this.newMessage;
      this.chatService.sendMessage(this.selectedContact._id, content).subscribe(msg => {
        this.messages.push(msg);
        this.newMessage = '';
        this.scrollToBottom();

        // Update last message preview in sidebar and move to top
        if (this.selectedContact) {
          this.selectedContact.lastMessage = content;
          this.selectedContact.lastMessageTime = new Date();

          const index = this.contacts.findIndex(c => c._id === this.selectedContact._id);
          if (index !== -1) {
            this.contacts.splice(index, 1);
            this.contacts.unshift(this.selectedContact);
          }
        }
      });
    }
  }

  selectContact(contact: any): void {
    this.selectedContact = contact;
    this.loadMessages(contact._id);

    // Clear unread count locally
    contact.unreadCount = 0;

    // Mark as read in backend
    this.chatService.markAsRead(contact._id).subscribe();
  }

  isMe(msg: any): boolean {
    const senderId = msg.sender._id || msg.sender;
    const currentUserId = this.currentUser?._id || this.currentUser?.id;
    return senderId === currentUserId;
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }
}
