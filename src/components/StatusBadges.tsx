import { CheckCircle2, CloudOff, LoaderCircle } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useTranslation } from '../hooks/useTranslation';

export function ModelBadge() {
  const model = useAppStore((state) => state.model);
  const t = useTranslation();
  if (model.state === 'loading') {
    return <span className="badge badge-neutral"><LoaderCircle size={16} className="animate-spin" />{t('modelLoading')} {model.progress}%</span>;
  }
  if (model.state === 'error') {
    return null;
  }
  return <span className={`badge ${model.offlineReady ? 'badge-success' : 'badge-neutral'}`}><CheckCircle2 size={16} />{model.offlineReady ? t('offlineReady') : t('diagnosisReady')}</span>;
}

export function NetworkBadge() {
  const online = useOnlineStatus();
  const t = useTranslation();
  return <span className="badge badge-neutral">{online ? <CheckCircle2 size={16} /> : <CloudOff size={16} />}{online ? t('online') : t('offline')}</span>;
}

export function useOnlineStatus() {
  const [online, setOnline] = React.useState(navigator.onLine);
  React.useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  return online;
}

import React from 'react';
