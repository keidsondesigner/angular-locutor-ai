import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { PinataService } from './pinata.service';

export interface TTSGeneration {
  id: string;
  user_id?: string;
  title: string;
  content: string;
  audio_path: string;
  created_at: Date;
}

@Injectable({
  providedIn: 'root',
})
export class TTSService {
  private readonly apiUrl = 'http://localhost:3000';
  private isGenerating = new BehaviorSubject<boolean>(false);
  isGenerating$ = this.isGenerating.asObservable();

  private generations = new BehaviorSubject<TTSGeneration[]>([]);
  generations$ = this.generations.asObservable();

  constructor(
    private http: HttpClient,
    private pinataService: PinataService
  ) {
    this.loadGenerations();
  }

  private async loadGenerations() {
    try {
      const data = await firstValueFrom(
        this.http.get<TTSGeneration[]>(`${this.apiUrl}/chat-locutor/tts/generations`)
      );
      this.generations.next(data);
    } catch (error) {
      console.error('Error loading generations:', error);
      this.generations.next([]);
    }
  }

  async generateSpeech(text: string, title: string): Promise<TTSGeneration> {
    this.isGenerating.next(true);

    try {
      const result = await firstValueFrom(
        this.http.post<TTSGeneration>(`${this.apiUrl}/chat-locutor/tts/generate`, {
          text,
          title
        })
      );

      await this.loadGenerations();
      return result;
    } catch (error) {
      console.error('Error in generateSpeech:', error);
      throw error;
    } finally {
      this.isGenerating.next(false);
    }
  }

  getGenerations(): Observable<TTSGeneration[]> {
    return this.generations$;
  }

  getAudioUrl(path: string): string {
    return this.pinataService.getAudioUrl(path);
  }

  getUrlUpdates() {
    return this.pinataService.getUrlUpdates();
  }

  async deleteGeneration(id: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete(`${this.apiUrl}/chat-locutor/tts/generation/${id}`)
      );
      await this.loadGenerations();
    } catch (error) {
      console.error('Error deleting generation:', error);
      throw error;
    }
  }
}