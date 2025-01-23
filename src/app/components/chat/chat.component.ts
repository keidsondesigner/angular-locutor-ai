import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';
import { ChatLocutorService, ChatMessage } from '../../services/chat-locutor.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-4xl mx-auto px-4">
      <div class="rounded-lg border bg-card text-card-foreground shadow-sm relative">
        <!-- Chat Messages -->
        <div #chatContainer class="h-[550px] overflow-y-auto p-6 space-y-4" (scroll)="onScroll()">
          <div *ngFor="let message of messages$ | async" 
               [class.text-right]="message.type === 'user'"
               class="animate-fade-in">
            <div [class]="message.type === 'user' ? 
                         'bg-primary text-primary-foreground ml-auto' : 
                         'bg-secondary text-secondary-foreground mr-auto'"
                 class="inline-block rounded-lg px-4 py-2.5 max-w-[80%] shadow-sm">
              <p class="whitespace-pre-wrap leading-7" [innerHTML]="sanitizeHtml(message.content)">
              </p>
              <span class="text-xs opacity-70 block mt-1.5">
                {{ message.timestamp | date:'shortTime' }}
              </span>
            </div>
          </div>

          <div *ngIf="isLoading" class="flex justify-center py-4">
            <div class="animate-pulse flex space-x-3">
              <div class="w-2.5 h-2.5 rounded-full bg-primary/70"></div>
              <div class="w-2.5 h-2.5 rounded-full bg-primary/70 animation-delay-200"></div>
              <div class="w-2.5 h-2.5 rounded-full bg-primary/70 animation-delay-400"></div>
            </div>
          </div>
        </div>

        <!-- Input Area -->
        <div class="p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <form (submit)="sendMessage()" class="flex gap-2">
            <input
              type="text"
              [(ngModel)]="messageContent"
              name="message"
              class="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 flex-1"
              placeholder="Digite sua mensagem..."
              [disabled]="isLoading"
            />
            <button
              type="submit"
              [disabled]="isLoading || !messageContent.trim()"
              class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 py-2"
            >
              Enviar
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.5s ease-in;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animation-delay-200 {
      animation-delay: 200ms;
    }

    .animation-delay-400 {
      animation-delay: 400ms;
    }
  `]
})
export class ChatComponent {
  @ViewChild('chatContainer') private chatContainer!: ElementRef;
  
  messages$: Observable<ChatMessage[]>;
  messageContent: string = '';
  isLoading: boolean = false;
  private autoScroll: boolean = true;

  constructor(
    private chatService: ChatLocutorService,
    private sanitizer: DomSanitizer
  ) {
    this.messages$ = this.chatService.messages$;
    this.chatService.isLoading$.subscribe(
      loading => this.isLoading = loading
    );
  }

  async sendMessage() {
    if (!this.messageContent.trim() || this.isLoading) return;

    const content = this.messageContent;
    this.messageContent = '';
    this.autoScroll = true;

    try {
      await this.chatService.sendMessage(content);
    } catch (error) {
      console.error('Error sending message:', error);
      // Você pode adicionar uma notificação de erro aqui
    }
  }

  sanitizeHtml(content: string): string {
    return content;
  }

  onScroll() {
    const element = this.chatContainer.nativeElement;
    const atBottom = Math.abs(
      element.scrollHeight - element.scrollTop - element.clientHeight
    ) < 50;
    this.autoScroll = atBottom;
  }

  private scrollToBottom() {
    if (this.autoScroll) {
      setTimeout(() => {
        const element = this.chatContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      });
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }
}
