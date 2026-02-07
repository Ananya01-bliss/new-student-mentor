import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  messages: any[] = [];
  contacts: any[] = [];
  selectedContact: any = null;
  newMessage: string = '';
  currentUser: any = null;

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private chatService: ChatService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;

      const mentorId = this.route.snapshot.queryParamMap.get('mentorId');
      this.loadConversations(mentorId);
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

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  loadConversations(highlightId: string | null = null): void {
    this.chatService.getConversations().subscribe(contacts => {
      this.contacts = contacts;

      if (highlightId) {
        const contact = this.contacts.find(c => c._id === highlightId);
        if (contact) {
          this.selectContact(contact);
        } else {
          // If not in conversations yet, fetch user details to start a new one
          this.chatService.getUserById(highlightId).subscribe(user => {
            if (user) {
              // Add to local contacts list temporarily
              this.contacts.unshift(user);
              this.selectContact(user);
            }
          });
        }
      } else if (this.contacts.length > 0 && !this.selectedContact) {
        this.selectContact(this.contacts[0]);
      }
    });
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
