import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
  Firestore,
  Timestamp,
  DocumentData,
  enableIndexedDbPersistence,
  enableMultiTabIndexedDbPersistence
} from 'firebase/firestore';
import { TTSGeneration } from './tts.service';
import { BehaviorSubject } from 'rxjs';

const firebaseConfig = {
  apiKey: 'AIzaSyBngZjIHKsjVCHITjNnk6nazMOKF1f0bxw',
  authDomain: 'angular-locutor.firebaseapp.com',
  projectId: 'angular-locutor',
  storageBucket: 'angular-locutor.firebasestorage.app',
  messagingSenderId: '635936756191',
  appId: '1:635936756191:web:845cc46303a6b9ed5df46a',
};

interface FirestoreGeneration extends DocumentData {
  user_id?: string;
  title: string;
  content: string;
  audio_path: string;
  created_at: Timestamp;
}

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private db: Firestore;
  private isOnline = new BehaviorSubject<boolean>(true);
  private localCache: TTSGeneration[] = [];
  private pendingOperations: Array<() => Promise<void>> = [];

  constructor() {
    const app = initializeApp(firebaseConfig);
    this.db = getFirestore(app);
    this.setupOfflineSupport();
    this.setupConnectivityListener();
  }

  private async setupOfflineSupport() {
    try {
      await enableIndexedDbPersistence(this.db);
      console.log('Offline persistence enabled');
    } catch (error) {
      if ((error as any)?.code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence enabled in first tab only');
      } else if ((error as any)?.code === 'unimplemented') {
        console.warn('Browser doesn\'t support persistence');
      }
    }
  }

  private setupConnectivityListener() {
    window.addEventListener('online', () => this.handleConnectivityChange(true));
    window.addEventListener('offline', () => this.handleConnectivityChange(false));
  }

  private async handleConnectivityChange(isOnline: boolean) {
    this.isOnline.next(isOnline);
    if (isOnline) {
      await this.processPendingOperations();
    }
  }

  private async processPendingOperations() {
    while (this.pendingOperations.length > 0) {
      const operation = this.pendingOperations.shift();
      if (operation) {
        try {
          await operation();
        } catch (error) {
          console.error('Error processing pending operation:', error);
          this.pendingOperations.push(operation);
          break;
        }
      }
    }
  }

  async getGenerations(): Promise<TTSGeneration[]> {
    try {
      if (!this.isOnline.value && this.localCache.length > 0) {
        return this.localCache;
      }

      const q = query(
        collection(this.db, 'generations'),
        orderBy('created_at', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const generations = querySnapshot.docs.map((doc) => {
        const data = doc.data() as FirestoreGeneration;
        return {
          id: doc.id,
          title: data.title,
          content: data.content,
          audio_path: data.audio_path,
          created_at: data.created_at.toDate(),
        };
      });

      this.localCache = generations;
      return generations;
    } catch (error) {
      console.warn('Error fetching generations, using cached data:', error);
      return this.localCache;
    }
  }

  async createGeneration(
    generation: Partial<TTSGeneration>
  ): Promise<TTSGeneration> {
    const generationData = {
      ...generation,
      created_at: Timestamp.fromDate(new Date()),
    };

    try {
      const docRef = await addDoc(
        collection(this.db, 'generations'),
        generationData
      );

      const newGeneration = {
        id: docRef.id,
        ...generation,
        created_at: new Date(),
      } as TTSGeneration;

      this.localCache.unshift(newGeneration);
      return newGeneration;
    } catch (error) {
      if (!this.isOnline.value) {
        const tempId = `temp_${Date.now()}`;
        const tempGeneration = {
          id: tempId,
          ...generation,
          created_at: new Date(),
        } as TTSGeneration;

        this.localCache.unshift(tempGeneration);
        this.pendingOperations.push(async () => {
          await this.createGeneration(generation);
          this.localCache = this.localCache.filter(g => g.id !== tempId);
        });

        return tempGeneration;
      }
      throw error;
    }
  }

  async deleteGeneration(id: string): Promise<void> {
    try {
      await deleteDoc(doc(this.db, 'generations', id));
      this.localCache = this.localCache.filter(g => g.id !== id);
    } catch (error) {
      if (!this.isOnline.value) {
        this.localCache = this.localCache.filter(g => g.id !== id);
        this.pendingOperations.push(async () => {
          await this.deleteGeneration(id);
        });
        return;
      }
      throw error;
    }
  }

  isOffline(): boolean {
    return !this.isOnline.value;
  }
}