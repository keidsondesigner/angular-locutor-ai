import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TTSService, TTSGeneration } from '../services/tts.service';
import { FirebaseService } from '../services/firebase.service';
import { AudioPlayerComponent } from './audio-player/audio-player.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tts',
  standalone: true,
  imports: [CommonModule, FormsModule, AudioPlayerComponent],
  template: `
    <div class="max-w-4xl mx-auto px-4">
      <!-- Offline Warning -->
      <div *ngIf="isOffline" class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <i class="fas fa-wifi-slash text-yellow-400"></i>
          </div>
          <div class="ml-3">
            <p class="text-sm text-yellow-700">
            O sistema(Firebase), está atualmente offline. As alterações serão sincronizadas quando voltar a estar online.
            </p>
          </div>
        </div>
      </div>

      <!-- Input Form -->
      <div class="bg-white rounded-lg border shadow-sm p-6 mb-8">
        <h2 class="text-2xl font-bold mb-6 text-slate-700">Texto em Fala</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1">Título</label>
            <input
              [(ngModel)]="title"
              type="text"
              class="w-full p-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Digite um título para sua conversão"
              [disabled]="isLoading"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1">Texto</label>
            <textarea
              [(ngModel)]="content"
              rows="4"
              class="w-full p-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Digite um texto para converter em fala"
              [disabled]="isLoading"
            ></textarea>
          </div>
          <button
            (click)="generateSpeech()"
            [disabled]="isLoading || !content.trim() || !title.trim()"
            class="w-full bg-indigo-500 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {{ isLoading ? 'Convertendo...' : 'Converter para Áudio' }}
          </button>
          <p *ngIf="error" class="text-red-500 text-sm">{{ error }}</p>
        </div>
      </div>

      <!-- History -->
      <div class="bg-white rounded-lg border shadow-sm p-6">
        <h3 class="text-xl font-bold mb-4 text-slate-700">Histórico de Converções</h3>
        <div class="space-y-4">
          <div *ngFor="let gen of generations" 
               class="bg-white border rounded-lg p-4"
               [class.opacity-50]="gen.id.startsWith('temp_')">
            <div class="mb-2">
              <div class="flex items-center justify-between">
                <h4 class="text-xl font-bold text-slate-600">{{ gen.title }}</h4>
                <span *ngIf="gen.id.startsWith('temp_')" 
                      class="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                  Pending sync
                </span>
              </div>
              <p class="text-slate-400 text-sm">{{ gen.created_at | date }}</p>
            </div>
            
            <p class="text-slate-500 mb-4">{{ gen.content }}</p>
            
            <div class="flex items-center justify-between">
              <app-audio-player [audioUrl]="audioUrls[gen.audio_path]"></app-audio-player>
              <div class="flex gap-2">
                <button 
                  (click)="downloadAudio(gen)"
                  class="p-2 px-4 rounded-lg border hover:bg-gray-100"
                  [disabled]="!audioUrls[gen.audio_path]"
                  title="Download"
                >
                  <i class="fas fa-download text-gray-600"></i>
                </button>
                <button 
                  (click)="deleteGeneration(gen)"
                  class="p-2 px-4 rounded-lg border hover:bg-gray-100"
                  title="Delete"
                >
                  <i class="fas fa-trash text-gray-600"></i>
                </button>
              </div>
            </div>
          </div>
          
          <p *ngIf="generations.length === 0" class="text-center text-gray-500 py-4">
            No generations available
          </p>
        </div>
      </div>
    </div>
  `,
})
export class TTSComponent implements OnInit, OnDestroy {
  title = '';
  content = '';
  isLoading = false;
  error = '';
  generations: TTSGeneration[] = [];
  audioUrls: { [key: string]: string } = {};
  isOffline = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private ttsService: TTSService,
    private firebaseService: FirebaseService
  ) {
    this.isOffline = this.firebaseService.isOffline();
  }

  ngOnInit() {
    this.subscriptions.push(
      this.ttsService.getGenerations().subscribe((generations) => {
        this.generations = generations;
        this.loadAudioUrls();
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private async loadAudioUrls() {
    for (const gen of this.generations) {
      if (!gen.id.startsWith('temp_') && !this.audioUrls[gen.audio_path]) {
        try {
          const url = await this.ttsService.getAudioUrl(gen.audio_path);
          if (url) {
            this.audioUrls = { ...this.audioUrls, [gen.audio_path]: url };
          }
        } catch (error) {
          console.error('Error loading audio URL:', error);
        }
      }
    }
  }

  async generateSpeech() {
    if (!this.title.trim() || !this.content.trim() || this.isLoading) return;

    this.isLoading = true;
    this.error = '';

    try {
      const generation = await this.ttsService.generateSpeech(
        this.content,
        this.title
      );
      if (!generation.id.startsWith('temp_')) {
        const url = await this.ttsService.getAudioUrl(generation.audio_path);
        if (url) {
          this.audioUrls = { ...this.audioUrls, [generation.audio_path]: url };
        }
      }
      this.title = '';
      this.content = '';
    } catch (error) {
      this.error =
        error instanceof Error
          ? error.message
          : 'An error occurred while generating speech';
      console.error('Error generating speech:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async downloadAudio(generation: TTSGeneration) {
    if (generation.id.startsWith('temp_')) return;

    try {
      const url = this.audioUrls[generation.audio_path];
      if (!url) {
        throw new Error('Audio URL not found');
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to download audio');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${generation.title}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading audio:', error);
      this.error = 'Failed to download audio';
    }
  }

  async deleteGeneration(generation: TTSGeneration) {
    if (confirm('Deseja apagar esta geração?')) {
      try {
        await this.ttsService.deleteGeneration(generation.id);
      } catch (error) {
        console.error('Error deleting generation:', error);
        this.error = 'Failed to delete generation';
      }
    }
  }
}
