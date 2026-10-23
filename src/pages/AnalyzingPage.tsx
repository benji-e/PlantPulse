import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Leaf, RotateCcw } from 'lucide-react';
import { Button, Card } from '../components/UI';
import { prepareImage, createThumbnail } from '../lib/images';
import { MODEL_CONFIG } from '../config/model';
import { classifyImage } from '../services/classifier';
import { useAppStore } from '../store/appStore';
import { useTranslation } from '../hooks/useTranslation';

export function AnalyzingPage() {
  const t = useTranslation();
  const navigate = useNavigate();
  const selectedImage = useAppStore((state) => state.selectedImage);
  const setDiagnosis = useAppStore((state) => state.setDiagnosis);
  const setModel = useAppStore((state) => state.setModel);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!selectedImage) {
      setError(t('chooseBeforeCheck'));
      return () => { active = false; };
    }
    async function analyze() {
      try {
        const canvas = await prepareImage(selectedImage!, MODEL_CONFIG.maxImageDimension);
        const result = await classifyImage(canvas, (progress) => setModel({ state: 'loading', progress }));
        const thumbnail = await createThumbnail(selectedImage!);
        if (!active) return;
        setDiagnosis({
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          predictions: result.predictions,
          inferenceMs: result.inferenceMs,
          backend: result.backend,
          thumbnail
        });
        setModel({ state: 'ready', progress: 100, backend: result.backend });
        navigate('/result', { replace: true });
      } catch {
        if (!active) return;
        const message = t('modelUnavailable');
        setError(message);
        setModel({ state: 'error', progress: 0, error: message });
      }
    }
    void analyze();
    return () => { active = false; };
  }, [navigate, selectedImage, setDiagnosis, setModel]);

  if (error) {
    return <div className="mx-auto max-w-xl page-enter"><Card className="p-6 text-center sm:p-9"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-danger/10 text-danger"><AlertTriangle size={31} /></div><h1 className="mt-4 text-2xl font-extrabold">{t('analyzeErrorTitle')}</h1><p className="mt-3 text-coffee">{error}</p><p className="mt-2 text-sm text-coffee-light">{t('analyzeErrorPrivacy')}</p><Button className="mt-6 w-full sm:w-auto" onClick={() => navigate('/scan')}><RotateCcw size={19} />{t('chooseAnotherPhoto')}</Button></Card></div>;
  }

  return <div className="mx-auto flex min-h-[55vh] max-w-xl flex-col items-center justify-center text-center page-enter"><div className="analyzing-orbit"><span className="orbit-leaf"><Leaf size={35} /></span></div><p className="eyebrow mt-8">{t('analyzingEyebrow')}</p><h1 className="mt-2 text-3xl font-extrabold text-forest">{t('analyzingTitle')}</h1><p className="mt-3 max-w-sm text-coffee">{t('analyzingIntro')}</p><div className="mt-6 h-2 w-48 overflow-hidden rounded-full bg-forest/10"><div className="progress-indeterminate h-full rounded-full bg-forest" /></div></div>;
}
