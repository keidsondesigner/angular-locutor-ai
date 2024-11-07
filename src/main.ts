import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { TTSComponent } from './app/components/tts.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TTSComponent],
  template: `
    <div class="min-h-screen py-8 bg-background">
      <header class="text-center mb-12 mt-12">
        <h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-indigo-500">
          Locutor de Promoções
        </h1>
        <p class="text-xl font-semibold text-slate-600">
          Converta seus texto para voz natural
        </p>
      </header>
      
      <app-tts></app-tts>

      <footer class="text-center mt-12 text-sm text-muted-foreground">
        <p>Desenvolvido com Angular, Firebase, Pinata e ElevenLabs Ai <i class="fas fa-heart text-red-500"></i> por Keidson Roby<p>
      </footer>
    </div>
  `,
})
export class App {}

bootstrapApplication(App, {
  providers: [provideHttpClient()],
});
