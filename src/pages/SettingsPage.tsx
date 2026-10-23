import { useState } from 'react';
import { ChevronRight, Languages, Type, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { database } from '../lib/database';
import { useAppStore } from '../store/appStore';
import { Card, PageTitle } from '../components/UI';
import { useTranslation } from '../hooks/useTranslation';

export function SettingsPage() {
  const t = useTranslation();
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const largeText = useAppStore((state) => state.largeText);
  const setLargeText = useAppStore((state) => state.setLargeText);
  const [message, setMessage] = useState('');

  async function clearHistory() {
    if (!window.confirm(t('clearConfirm'))) return;
    await database.scans.clear();
    setMessage(t('historyCleared'));
  }

  return <div className="mx-auto max-w-3xl page-enter"><PageTitle eyebrow={t('settingsEyebrow')} title={t('settingsTitle')} text={t('settingsIntro')} />
    <Card className="divide-y divide-forest/10 p-0">
      <div className="settings-row"><span className="settings-icon"><Languages /></span><span className="flex-1"><strong>{t('language')}</strong><small className="block text-coffee">{t('languageHint')}</small></span><select aria-label={t('language')} className="settings-select" value={language} onChange={(event) => setLanguage(event.target.value as 'en' | 'lg')}><option value="en">{t('english')}</option><option value="lg">{t('luganda')}</option></select></div>
      <div className="settings-row"><span className="settings-icon"><Type /></span><span className="flex-1"><strong>{t('largerText')}</strong><small className="block text-coffee">{t('largerTextHint')}</small></span><button className={`switch ${largeText ? 'switch-on' : ''}`} role="switch" aria-checked={largeText} aria-label={t('largerText')} onClick={() => setLargeText(!largeText)}><span /></button></div>
      <button className="settings-row w-full text-left" onClick={() => void clearHistory()}><span className="settings-icon text-danger"><Trash2 /></span><span className="flex-1"><strong>{t('clearScans')}</strong><small className="block text-coffee">{t('clearScansHint')}</small></span><ChevronRight /></button>
      <Link className="settings-row" to="/about"><span className="settings-icon"><Type /></span><span className="flex-1"><strong>{t('aboutDeveloper')}</strong><small className="block text-coffee">{t('aboutDeveloperHint')}</small></span><ChevronRight /></Link>
      <Link className="settings-row" to="/help"><span className="settings-icon"><Languages /></span><span className="flex-1"><strong>{t('helpTips')}</strong><small className="block text-coffee">{t('helpTipsHint')}</small></span><ChevronRight /></Link>
    </Card>
    {message && <p className="mt-4 text-sm font-bold text-forest" role="status">{message}</p>}
    <p className="mt-6 text-sm leading-relaxed text-coffee">{t('photoPrivateText')}</p>
  </div>;
}
