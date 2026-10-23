import { create } from 'zustand';
import type { Diagnosis, ModelStatus } from '../lib/types';

interface AppState {
  diagnosis: Diagnosis | null;
  selectedImage: File | null;
  model: ModelStatus;
  language: 'en' | 'lg';
  largeText: boolean;
  setDiagnosis: (diagnosis: Diagnosis | null) => void;
  setSelectedImage: (image: File | null) => void;
  setModel: (model: ModelStatus) => void;
  setLanguage: (language: 'en' | 'lg') => void;
  setLargeText: (largeText: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  diagnosis: null,
  selectedImage: null,
  model: { state: 'loading', progress: 0 },
  language: (localStorage.getItem('plantpulse-language') as 'en' | 'lg') || 'en',
  largeText: localStorage.getItem('plantpulse-large-text') === 'true',
  setDiagnosis: (diagnosis) => set({ diagnosis }),
  setSelectedImage: (selectedImage) => set({ selectedImage }),
  setModel: (model) => set({ model }),
  setLanguage: (language) => {
    localStorage.setItem('plantpulse-language', language);
    set({ language });
  },
  setLargeText: (largeText) => {
    localStorage.setItem('plantpulse-large-text', String(largeText));
    set({ largeText });
  }
}));
