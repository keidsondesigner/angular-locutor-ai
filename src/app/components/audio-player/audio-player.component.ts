import {
  Component,
  Input,
  OnDestroy,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-audio-player',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-2">
      <button 
        (click)="togglePlay()"
        class="p-2 px-4 rounded-lg border hover:bg-gray-100"
        [disabled]="!audioUrl"
        [title]="isPlaying ? 'Pause' : 'Play'"
      >
        <i class="fas" 
           [class.fa-pause]="isPlaying" 
           [class.fa-play]="!isPlaying"
           [class.text-gray-400]="!audioUrl"
           [class.text-gray-600]="audioUrl"
        ></i>
      </button>
      <div class="flex items-center gap-2">
        <div class="w-0 md:w-48 h-1 bg-gray-200 rounded cursor-pointer" (click)="seek($event)">
          <div 
            class="h-full bg-indigo-500 rounded transition-all duration-300" 
            [style.width.%]="progress"
          ></div>
        </div>
        <span class="text-sm text-gray-600 min-w-[80px]">
          {{ getFormattedTime(currentTime) }} / {{ getFormattedTime(duration) }}
        </span>
      </div>
    </div>
  `,
})
export class AudioPlayerComponent implements AfterViewInit, OnDestroy {
  @Input() set audioUrl(value: string | undefined) {
    console.log('Setting audio URL:', value);
    if (this._audioUrl !== value) {
      this._audioUrl = value || '';
      if (this.audio) {
        this.cleanup();
      }
      if (value) {
        this.initializeAudio();
      }
    }
  }
  get audioUrl(): string {
    return this._audioUrl;
  }

  private _audioUrl = '';
  private audio?: HTMLAudioElement;
  isPlaying = false;
  duration = 0;
  currentTime = 0;
  progress = 0;

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit() {
    if (this.audioUrl) {
      this.initializeAudio();
    }
  }

  ngOnDestroy() {
    this.cleanup();
  }

  private async initializeAudio() {
    try {
      console.log('Initializing audio with URL:', this.audioUrl);
      
      // Criar elemento de áudio com os tipos MIME suportados
      this.audio = new Audio();
      this.audio.preload = 'metadata';
      
      // Configurar source com tipo MIME
      const source = document.createElement('source');
      source.src = this.audioUrl;
      source.type = 'audio/mpeg';
      this.audio.appendChild(source);

      // Configurar CORS
      this.audio.crossOrigin = 'anonymous';
      
      // Configurar event listeners
      this.setupAudioEventListeners();
      
      // Carregar o áudio
      await this.audio.load();
      console.log('Audio loaded successfully');
    } catch (error) {
      console.error('Error initializing audio:', error);
      this.cleanup();
    }
  }

  private setupAudioEventListeners() {
    if (!this.audio) return;

    this.audio.addEventListener('loadedmetadata', () => {
      console.log('Audio metadata loaded:', {
        duration: this.audio?.duration,
        readyState: this.audio?.readyState
      });
      this.duration = this.audio?.duration || 0;
      this.cdr.detectChanges();
    });

    this.audio.addEventListener('timeupdate', () => {
      if (this.audio) {
        this.currentTime = this.audio.currentTime;
        this.progress = (this.currentTime / this.duration) * 100;
        this.cdr.detectChanges();
      }
    });

    this.audio.addEventListener('ended', () => {
      this.isPlaying = false;
      this.currentTime = 0;
      this.progress = 0;
      this.cdr.detectChanges();
    });

    this.audio.addEventListener('error', (e) => {
      const error = this.audio?.error;
      console.error('Audio playback error:', {
        error,
        code: error?.code,
        message: error?.message,
        networkState: this.audio?.networkState,
        readyState: this.audio?.readyState
      });
      this.isPlaying = false;
      this.cdr.detectChanges();
    });

    // Adicionar listener para stalled e waiting
    this.audio.addEventListener('stalled', () => {
      console.warn('Audio playback stalled');
    });

    this.audio.addEventListener('waiting', () => {
      console.warn('Audio playback waiting');
    });

    // Adicionar listener para canplay
    this.audio.addEventListener('canplay', () => {
      console.log('Audio can play');
    });

    // Adicionar listener para canplaythrough
    this.audio.addEventListener('canplaythrough', () => {
      console.log('Audio can play through');
    });
  }

  private cleanup() {
    if (this.audio) {
      this.audio.pause();
      this.audio.removeAttribute('src');
      Array.from(this.audio.children).forEach(child => child.remove());
      this.audio.load(); // Limpar o buffer
      this.audio = undefined;
      this.isPlaying = false;
      this.currentTime = 0;
      this.duration = 0;
      this.progress = 0;
    }
  }

  async togglePlay() {
    if (!this.audio || !this.audioUrl) return;

    try {
      if (this.isPlaying) {
        await this.audio.pause();
        this.isPlaying = false;
      } else {
        await this.audio.play();
        this.isPlaying = true;
      }
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error toggling audio playback:', error);
      this.isPlaying = false;
      this.cdr.detectChanges();
    }
  }

  seek(event: MouseEvent) {
    if (!this.audio || !this.duration) return;

    const element = event.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percentage = x / element.offsetWidth;
    const time = percentage * this.duration;

    if (isFinite(time) && time >= 0 && time <= this.duration) {
      this.audio.currentTime = time;
      this.currentTime = time;
      this.progress = percentage * 100;
    }
  }

  getFormattedTime(seconds: number): string {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
