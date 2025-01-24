import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PinataService {
  private readonly apiUrl = 'https://api-keidsonroby-ai.onrender.com';
  private audioUrlCache = new BehaviorSubject<{ [key: string]: string }>({});

  constructor(private http: HttpClient) {}

  getAudioUrl(path: string): string {
    if (!path) {
      console.error('Invalid IPFS path');
      return '';
    }

    const currentCache = this.audioUrlCache.value;
    if (currentCache[path]) {
      return currentCache[path];
    }

    // Construir a URL diretamente
    const audioUrl = `${this.apiUrl}/chat-locutor/pinata/audio/${path}`;

    // Atualizar o cache
    this.audioUrlCache.next({
      ...currentCache,
      [path]: audioUrl
    });

    return audioUrl;
  }

  getUrlUpdates() {
    return this.audioUrlCache.asObservable();
  }
}
