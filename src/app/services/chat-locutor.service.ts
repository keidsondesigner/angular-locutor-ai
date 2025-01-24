import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export interface ChatMessage {
  id?: string;
  content: string;
  type: 'user' | 'assistant';
  timestamp?: Date;
  html?: SafeHtml;
}

@Injectable({
  providedIn: 'root'
})
export class ChatLocutorService {
  private readonly apiUrl = 'https://api-keidsonroby-ai.onrender.com';

  private messages = new BehaviorSubject<ChatMessage[]>([]);
  messages$ = this.messages.asObservable();

  private isLoading = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoading.asObservable();

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {}

  async sendMessage(content: string): Promise<void> {
    try {
      this.isLoading.next(true);

      // Adiciona mensagem do usuário
      const userMessage: ChatMessage = {
        content,
        type: 'user',
        timestamp: new Date()
      };
      this.addMessage(userMessage);

      // Envia mensagem para o backend
      const result = await firstValueFrom(
        this.http.post<{ response: string }>(
          `${this.apiUrl}/chat-locutor/message`,
          { message: content }
        )
      );

      if (!result) {
        throw new Error('No response from server');
      }

      // Adiciona resposta do assistente
      const assistantMessage: ChatMessage = {
        content: result.response,
        type: 'assistant',
        timestamp: new Date(),
        html: this.sanitizer.bypassSecurityTrustHtml(result.response)
      };
      this.addMessage(assistantMessage);
    } catch (error) {
      console.error('Error sending message:', error);

      // Adiciona mensagem de erro
      const errorMessage: ChatMessage = {
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
        type: 'assistant',
        timestamp: new Date()
      };
      this.addMessage(errorMessage);
    } finally {
      this.isLoading.next(false);
    }
  }

  private addMessage(message: ChatMessage) {
    const currentMessages = this.messages.value;
    this.messages.next([...currentMessages, message]);
  }

  clearMessages() {
    this.messages.next([]);
  }

  getMessages(): Observable<ChatMessage[]> {
    return this.messages$;
  }

  isLoadingMessages(): Observable<boolean> {
    return this.isLoading$;
  }
}
