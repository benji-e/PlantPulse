export interface Disease {
  id: string;
  label: string;
  name: string;
  crop: string;
  shortDescription: string;
  symptoms: string[];
  whatToDoNow: string[];
  prevention: string[];
  whenToCall: string;
}

export interface Prediction {
  label: string;
  confidence: number;
  disease: Disease;
}

export interface Diagnosis {
  id: string;
  createdAt: number;
  predictions: Prediction[];
  inferenceMs: number;
  backend: string;
  thumbnail: Blob;
}

export interface ModelStatus {
  state: 'loading' | 'ready' | 'error';
  progress: number;
  error?: string;
  backend?: string;
  offlineReady?: boolean;
}
