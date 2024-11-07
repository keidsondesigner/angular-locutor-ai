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

  private initializeAudio() {
    this.audio = new Audio(this.audioUrl);
    this.setupAudioEventListeners();
  }

  private setupAudioEventListeners() {
    if (!this.audio) return;

    this.audio.addEventListener('loadedmetadata', () => {
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
      console.warn('Audio playback error:', e);
      this.isPlaying = false;
      this.cdr.detectChanges();
    });

    // Preload the audio
    this.audio.load();
  }

  private cleanup() {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio.remove();
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
        this.audio.pause();
        this.isPlaying = false;
      } else {
        await this.audio.play();
        this.isPlaying = true;
      }
      this.cdr.detectChanges();
    } catch (error) {
      console.warn('Error toggling audio playback:', error);
      this.isPlaying = false;
      this.cdr.detectChanges();
    }
  }

  seek(event: MouseEvent) {
    if (!this.audio || !this.duration) return;

    const element = event.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percentage = x / rect.width;

    this.audio.currentTime = percentage * this.duration;
    this.currentTime = this.audio.currentTime;
    this.progress = percentage * 100;
    this.cdr.detectChanges();
  }

  getFormattedTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}
