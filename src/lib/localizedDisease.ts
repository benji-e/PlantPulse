import lugandaDiseases from '../i18n/diseases-lg.json';
import type { Disease } from './types';

export function localizedDisease(disease: Disease, language: 'en' | 'lg'): Disease {
  if (language === 'en') return disease;
  const translated = lugandaDiseases[disease.id as keyof typeof lugandaDiseases];
  return translated ? { ...disease, ...translated } : disease;
}
