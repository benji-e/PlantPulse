import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, CheckCircle2, ChevronDown, Clipboard, Leaf, Mic, Save, Share2, Volume2, VolumeX } from 'lucide-react';
import { Button, Card } from '../components/UI';
import { database } from '../lib/database';
import { MODEL_CONFIG } from '../config/model';
import type { Diagnosis } from '../lib/types';
import { useAppStore } from '../store/appStore';
import { useTranslation } from '../hooks/useTranslation';
import { localizedDisease } from '../lib/localizedDisease';

export function ResultPage() {
  const t = useTranslation();
  const navigate = useNavigate();
  const diagnosis = useAppStore((state) => state.diagnosis);
  const language = useAppStore((state) => state.language);
  const setSelectedImage = useAppStore((state) => state.setSelectedImage);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState<string | null>('what');
  const [message, setMessage] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const top = diagnosis?.predictions[0];
  const topDisease = top ? localizedDisease(top.disease, language) : undefined;
  const sharedDiseaseName = topDisease?.name ?? t('notSure');
  const uncertain = !top || top.confidence < MODEL_CONFIG.confidenceThreshold;

  useEffect(() => {
    if (!diagnosis) return;
    let alive = true;
    database.scans.get(diagnosis.id).then((record) => { if (alive && record) setSaved(true); });
    return () => { alive = false; };
  }, [diagnosis]);

  useEffect(() => {
    if (!diagnosis) {
      setPhotoUrl('');
      return;
    }
    const url = URL.createObjectURL(diagnosis.thumbnail);
    setPhotoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [diagnosis]);

  const advice = useMemo(() => topDisease ? `${topDisease.name}. ${topDisease.shortDescription} ${t('whatToDoNow')}: ${topDisease.whatToDoNow.join(' ')} ${t('prevention')}: ${topDisease.prevention.join(' ')} ${topDisease.whenToCall} ${t('decisionSupportOnly')}` : '', [topDisease, t]);
  if (!diagnosis || !top || !topDisease) return <div className="text-center page-enter"><Card className="mx-auto max-w-lg p-8"><h1 className="text-2xl font-extrabold">{t('noResultTitle')}</h1><p className="mt-2 text-coffee">{t('noResultText')}</p><Button className="mt-5" onClick={() => navigate('/scan')}><Leaf size={19} />{t('scanPlantLower')}</Button></Card></div>;

  async function saveResult() {
    await database.scans.put(diagnosis as Diagnosis);
    setSaved(true);
    setMessage(t('scanSaved'));
  }

  async function shareResult() {
    const text = uncertain ? `PlantPulse: ${t('notSure')}. ${t('notSureMessage')}` : `PlantPulse: ${sharedDiseaseName} (${Math.round(top.confidence * 100)}% ${t('modelScore')}). ${t('decisionSupportOnly')}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'PlantPulse leaf check', text }); return; } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setMessage(t('shareCopied'));
    } catch {
      setMessage(t('shareUnavailable'));
    }
  }

  function toggleSpeech() {
    if (!('speechSynthesis' in window)) {
      setMessage(t('speechUnavailable'));
      return;
    }
    if (speaking) {
      speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(advice);
    utterance.lang = language === 'lg' ? 'lg-UG' : 'en-UG';
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => { setSpeaking(false); setMessage(t('speechFailed')); };
    speechSynthesis.speak(utterance);
    setSpeaking(true);
  }

  function accordion(id: string, label: string, contents: ReactNode) {
    const open = expanded === id;
    return <div className="advice-item"><button className="advice-toggle" aria-expanded={open} onClick={() => setExpanded(open ? null : id)}><span>{label}</span><ChevronDown size={20} className={open ? 'rotate-180 transition' : 'transition'} /></button>{open && <div className="advice-content">{contents}</div>}</div>;
  }

  return (
    <div className="result-page">
      <div className="mb-5"><Link className="back-link" to="/scan"><ArrowLeft size={18} />{t('scanAnotherLeaf')}</Link></div>
      <div className="grid items-start gap-5 lg:grid-cols-[.82fr_1.18fr]">
        <Card className="overflow-hidden p-0">
          <img src={photoUrl} alt={t('leafPhotoAlt')} className="result-photo" />
          <div className="p-4"><div className={`status-chip ${uncertain ? 'chip-neutral' : topDisease.id === 'healthy' ? 'chip-success' : 'chip-warning'}`}><span className="status-dot" />{uncertain ? t('uncertainResult') : topDisease.id === 'healthy' ? t('healthyLooking') : t('diseaseDetected')}</div><p className="mt-3 text-sm text-coffee-light">{t('cropCassava')} · {new Date(diagnosis.createdAt).toLocaleString(language === 'lg' ? 'lg-UG' : 'en-UG')}</p></div>
        </Card>
        <div>
          <Card className={`p-5 sm:p-7 ${uncertain ? 'border border-ink/10' : ''}`}>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="eyebrow">{uncertain ? t('clearerLook') : t('leafResult')}</p><h1 className="mt-2 text-3xl font-extrabold leading-tight text-forest sm:text-4xl">{uncertain ? t('notSure') : topDisease.name}</h1><p className="mt-2 font-bold text-coffee">{t('cropCassava')}</p></div>
              {!uncertain && <div className="confidence-gauge" style={{ '--gauge': `${Math.round(top.confidence * 100)}%` } as CSSProperties}><div><strong>{Math.round(top.confidence * 100)}%</strong><small>{t('modelScore')}</small></div></div>}
            </div>
            {uncertain ? <div className="notice notice-neutral mt-5"><p className="font-extrabold">{t('notSure')}</p><p className="mt-1">{t('notSureMessage')}</p></div> : <p className="mt-4 leading-relaxed text-coffee">{topDisease.shortDescription}</p>}
            {!uncertain && <div className="mt-5"><button className="listen-button" onClick={toggleSpeech}>{speaking ? <VolumeX size={20} /> : <Volume2 size={20} />}{speaking ? t('listenStop') : t('listenAdvice')}<Mic className="ml-auto" size={17} /></button></div>}
          </Card>
          {!uncertain && <Card className="mt-5 p-0">
            {accordion('what', t('whatItIs'), <><p>{topDisease.shortDescription}</p><p className="mt-3 font-extrabold">{t('thingsToLookFor')}</p><ul className="advice-list">{topDisease.symptoms.map((symptom) => <li key={symptom}>{symptom}</li>)}</ul></>)}
            {accordion('now', t('whatToDoNow'), <ul className="advice-list">{topDisease.whatToDoNow.map((step) => <li key={step}>{step}</li>)}</ul>)}
            {accordion('prevent', t('preventIt'), <ul className="advice-list">{topDisease.prevention.map((step) => <li key={step}>{step}</li>)}</ul>)}
            {accordion('expert', t('callExpert'), <p>{topDisease.whenToCall}</p>)}
            <p className="px-5 pb-5 text-xs leading-relaxed text-coffee-light">{t('decisionSupportOnly')}</p>
          </Card>}
          {diagnosis.predictions.length > 1 && <details className="other-possibilities mt-5"><summary><span>{t('otherPossibilities')}</span><ChevronDown size={18} /></summary><div className="space-y-3 px-5 pb-5">{diagnosis.predictions.slice(1).map((item) => <div key={item.label} className="flex justify-between gap-4 border-t border-forest/10 pt-3"><span className="font-bold">{localizedDisease(item.disease, language).name}</span><span className="shrink-0 text-coffee">{Math.round(item.confidence * 100)}% {t('modelScore')}</span></div>)}<p className="text-xs text-coffee-light">{t('modelScoresNotProbabilities')}</p></div></details>}
        </div>
      </div>
      <div className="result-actions mt-5">
        <Button className={saved ? 'button-saved' : ''} onClick={saveResult} disabled={saved}>{saved ? <Check size={19} /> : <Save size={19} />}{saved ? t('savedHistory') : t('saveHistory')}</Button>
        <button className="button button-secondary" onClick={shareResult}><Share2 size={19} />{t('share')}</button>
        <button className="button button-secondary" onClick={() => { speechSynthesis?.cancel(); setSelectedImage(null); navigate('/scan'); }}><Leaf size={19} />{t('scanAnother')}</button>
      </div>
      {message && <p className="mt-3 text-center text-sm font-bold text-forest" role="status"><CheckCircle2 className="mr-1 inline" size={16} />{message}</p>}
      <p className="mt-4 text-center text-xs text-coffee-light">{t('modelScore')}: {Math.round(top.confidence * 100)}% · {diagnosis.inferenceMs.toFixed(0)} ms · {diagnosis.backend.toUpperCase()} <Clipboard className="ml-1 inline" size={12} /></p>
    </div>
  );
}
