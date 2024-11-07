import { Component } from '@angular/core';
import { TTSFormComponent } from './components/tts-form.component';
import { TTSHistoryComponent } from './components/tts-history.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TTSFormComponent, TTSHistoryComponent],
  template: `
    <div class="min-h-screen bg-gray-50 py-8 px-4">
      <header class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          Text to Speech Converter
        </h1>
        <p class="text-gray-600">
          Convert your text to natural-sounding speech
        </p>
      </header>
      
      <main class="container mx-auto max-w-4xl">
        <app-tts-form></app-tts-form>
        <app-tts-history></app-tts-history>
      </main>
    </div>
  `
})
export class AppComponent {}