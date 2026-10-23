import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { ArrowRight, Clock3, Leaf, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { database } from '../lib/database';
import { MODEL_CONFIG } from '../config/model';
import { EmptyState, PageTitle } from '../components/UI';
import { useAppStore } from '../store/appStore';
import { useTranslation } from '../hooks/useTranslation';
import { localizedDisease } from '../lib/localizedDisease';

export function HistoryPage() {
  const t = useTranslation();
  const language = useAppStore((state) => state.language);
  const navigate = useNavigate();
  const scans = useLiveQuery(() => database.scans.orderBy('createdAt').reverse().toArray(), []);
  const setDiagnosis = useAppStore((state) => state.setDiagnosis);
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!scans) return;
    const urls = Object.fromEntries(scans.map((scan) => [scan.id, URL.createObjectURL(scan.thumbnail)]));
    setThumbnailUrls(urls);
    return () => Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
  }, [scans]);

  function openScan(scan: NonNullable<typeof scans>[number]) {
    setDiagnosis(scan);
    navigate('/result');
  }

  async function deleteScan(id: string) {
    await database.scans.delete(id);
  }

  return <div className="page-enter"><PageTitle eyebrow={t('historyEyebrow')} title={t('historyTitle')} text={t('historyIntro')} />
    {scans === undefined ? <div className="loading-card">{t('loadingScans')}</div> : scans.length === 0 ? <EmptyState icon={<Leaf size={34} />} title={t('emptyHistoryTitle')} text={t('emptyHistoryText')} action={<Link className="button" to="/scan"><Leaf size={19} />{t('scanPlantLower')}</Link>} /> : (
      <div className="grid gap-3 md:grid-cols-2">
        {scans.map((scan) => {
          const prediction = scan.predictions[0];
          const disease = localizedDisease(prediction.disease, language);
          return <article key={scan.id} className="scan-row">
            <button className="scan-open" onClick={() => openScan(scan)} aria-label={`${t('viewResult')}: ${disease.name}`}>
              <img className="scan-thumbnail" src={thumbnailUrls[scan.id]} alt="" />
              <span className="min-w-0 flex-1 text-left"><strong className="block truncate text-base">{prediction.confidence < MODEL_CONFIG.confidenceThreshold ? t('notSure') : disease.name}</strong><small className="mt-1 block text-coffee">{new Date(scan.createdAt).toLocaleDateString(language === 'lg' ? 'lg-UG' : 'en-UG')} · {Math.round(prediction.confidence * 100)}% {t('modelScore')}</small><small className="mt-1 inline-flex items-center gap-1 font-extrabold text-forest">{t('viewResult')} <ArrowRight size={14} /></small></span>
            </button>
            <button className="icon-button text-danger" aria-label={t('deleteScan')} onClick={() => void deleteScan(scan.id)}><Trash2 size={19} /></button>
          </article>;
        })}
      </div>
    )}
    <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-coffee-light"><Clock3 size={15} />{t('savedLocalOnly')}</p>
  </div>;
}
