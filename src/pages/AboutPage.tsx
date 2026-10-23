import { useEffect, useState, type ReactNode } from 'react';
import { Activity, ArrowLeft, Cpu, HardDrive, Wifi, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, PageTitle } from '../components/UI';
import { useOnlineStatus } from '../components/StatusBadges';
import { useAppStore } from '../store/appStore';
import { useTranslation } from '../hooks/useTranslation';

export function AboutPage() {
  const t = useTranslation();
  const model = useAppStore((state) => state.model);
  const diagnosis = useAppStore((state) => state.diagnosis);
  const online = useOnlineStatus();
  const [modelSize, setModelSize] = useState(t('notCached'));

  useEffect(() => {
    let active = true;
    async function readSize() {
      if (!('caches' in window)) return;
      const keys = await caches.keys();
      const modelCacheName = keys.find((key) => key === 'plantpulse-model-v2');
      if (!modelCacheName) return;
      const cache = await caches.open(modelCacheName);
      const requests = await cache.keys();
      let bytes = 0;
      for (const request of requests) {
        if (!new URL(request.url).pathname.startsWith('/model/')) continue;
        const response = await cache.match(request);
        if (response) bytes += Number(response.headers.get('content-length')) || (await response.clone().arrayBuffer()).byteLength;
      }
      if (active && bytes > 0) setModelSize(`${(bytes / (1024 * 1024)).toFixed(2)} MB`);
    }
    void readSize();
    return () => { active = false; };
  }, []);

  return <div className="mx-auto max-w-3xl page-enter"><Link className="back-link mb-5" to="/settings"><ArrowLeft size={18} />{t('backSettings')}</Link><PageTitle eyebrow={t('aboutEyebrow')} title={t('aboutTitle')} text={t('aboutIntro')} />
    <Card className="divide-y divide-forest/10 p-0">
      <InfoRow icon={<Activity />} label={t('modelStatus')} value={model.state === 'ready' ? t('loadedReady') : model.state === 'loading' ? `${t('modelLoading')} (${model.progress}%)` : t('modelUnavailable')} />
      <InfoRow icon={<HardDrive />} label={t('cachedModelFiles')} value={modelSize} />
      <InfoRow icon={<Cpu />} label={t('inferenceBackend')} value={model.backend ?? '—'} />
      <InfoRow icon={<Activity />} label={t('lastInference')} value={diagnosis ? `${diagnosis.inferenceMs.toFixed(1)} ms` : t('noScansYet')} />
      <InfoRow icon={online ? <Wifi /> : <WifiOff />} label={t('connection')} value={online ? t('online') : t('offline')} />
      <InfoRow icon={<HardDrive />} label={t('inputPreprocessing')} value="160 × 160 RGB · −1 … 1" />
      <InfoRow icon={<Activity />} label={t('modelScope')} value={`${t('cropCassava')} · 5`} />
    </Card>
    <p className="mt-5 text-sm leading-relaxed text-coffee">{t('aboutAccuracy')}</p>
    <p className="mt-3 text-sm leading-relaxed text-coffee">{t('aboutPrivacy')}</p>
  </div>;
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="settings-row"><span className="settings-icon">{icon}</span><span className="flex-1"><strong>{label}</strong></span><span className="max-w-[55%] break-words text-right text-sm text-coffee">{value}</span></div>;
}
