import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { PinataService } from './pinata.service';
import { BehaviorSubject, Observable } from 'rxjs';

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
  private isGenerating = new BehaviorSubject<boolean>(false);
  isGenerating$ = this.isGenerating.asObservable();

  private generations = new BehaviorSubject<TTSGeneration[]>([]);
  generations$ = this.generations.asObservable();

  constructor(
    private firebaseService: FirebaseService,
    private pinataService: PinataService
  ) {
    this.loadGenerations();
  }

  private async loadGenerations() {
    try {
      const data = await this.firebaseService.getGenerations();
      this.generations.next(data);
    } catch (error) {
      console.error('Error loading generations:', error);
      this.generations.next([]);
    }
  }

  async generateSpeech(text: string, title: string): Promise<TTSGeneration> {
    this.isGenerating.next(true);

    try {
      const VOICE_ID = 'UaeEQHfiDI8l58WWXiwS';
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': 'sk_d6323d237e2ae547b73d79cb5475b5b6097a06a56e0bc6be',
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      const audioBlob = await response.blob();
      const file = new File([audioBlob], `${Date.now()}.mp3`, {
        type: 'audio/mpeg',
      });

      const { path } = await this.pinataService.uploadAudio(file);

      const generation: Partial<TTSGeneration> = {
        title,
        content: text,
        audio_path: path,
      };

      const result = await this.firebaseService.createGeneration(generation);
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

  async deleteGeneration(id: string): Promise<void> {
    try {
      await this.firebaseService.deleteGeneration(id);
      await this.loadGenerations();
    } catch (error) {
      console.error('Error deleting generation:', error);
      throw error;
    }
  }
}