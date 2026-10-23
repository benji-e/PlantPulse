import { useMemo, useState } from 'react';
import { BookOpen, ChevronDown, Search } from 'lucide-react';
import diseaseData from '../data/diseases.json';
import type { Disease } from '../lib/types';
import { Card, PageTitle } from '../components/UI';
import { useTranslation } from '../hooks/useTranslation';
import { useAppStore } from '../store/appStore';
import { localizedDisease } from '../lib/localizedDisease';

const diseases = diseaseData as Disease[];

export function GuidePage() {
  const t = useTranslation();
  const language = useAppStore((state) => state.language);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const results = useMemo(() => diseases.map((disease) => localizedDisease(disease, language)).filter((disease) => {
    const matchesCrop = filter === 'all' || disease.crop === 'Cassava';
    const text = `${disease.name} ${disease.shortDescription} ${disease.symptoms.join(' ')}`.toLowerCase();
    return matchesCrop && text.includes(query.toLowerCase().trim());
  }), [filter, language, query]);

  return <div className="page-enter"><PageTitle eyebrow={t('guideEyebrow')} title={t('guideTitle')} text={t('guideIntro')} />
    <div className="mb-5 flex flex-col gap-3 sm:flex-row">
      <label className="search-field flex-1"><Search size={19} /><span className="sr-only">{t('searchGuide')}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('searchPlaceholder')} /></label>
      <label className="filter-select"><span className="sr-only">{t('filterCrop')}</span><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">{t('allCrops')}</option><option value="cassava">{t('cropCassava')}</option></select></label>
    </div>
    <div className="space-y-3">{results.map((disease) => {
      const open = openId === disease.id;
      return <Card key={disease.id} className="overflow-hidden p-0">
        <button className="guide-toggle" aria-expanded={open} onClick={() => setOpenId(open ? null : disease.id)}>
          <span className={`guide-icon ${disease.id === 'healthy' ? 'bg-[#EAF2E6] text-forest' : 'bg-[#FFF1DF] text-warning'}`}><BookOpen /></span>
          <span className="min-w-0 flex-1 text-left"><small className="block font-extrabold uppercase tracking-wider text-coffee-light">{t('cropCassava')}</small><strong className="mt-1 block text-lg">{disease.name}</strong><span className="mt-1 block text-sm font-normal leading-relaxed text-coffee">{disease.shortDescription}</span></span>
          <ChevronDown className={`shrink-0 transition ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && <div className="guide-detail">
          <h3>{t('whatSee')}</h3><ul className="advice-list">{disease.symptoms.map((item) => <li key={item}>{item}</li>)}</ul>
          <h3 className="mt-5">{t('whatToDoNow')}</h3><ul className="advice-list">{disease.whatToDoNow.map((item) => <li key={item}>{item}</li>)}</ul>
          <h3 className="mt-5">{t('prevention')}</h3><ul className="advice-list">{disease.prevention.map((item) => <li key={item}>{item}</li>)}</ul>
          <h3 className="mt-5">{t('whenExpert')}</h3><p className="mt-2 text-coffee">{disease.whenToCall}</p>
        </div>}
      </Card>;
    })}</div>
    {results.length === 0 && <div className="empty-state"><div className="empty-icon"><Search /></div><h2 className="mt-4 text-xl font-extrabold">{t('noMatches')}</h2><p className="mt-2 text-coffee">{t('tryAnotherSearch')}</p></div>}
    <p className="mt-6 rounded-2xl bg-warm p-4 text-sm leading-relaxed text-coffee">{t('guideDisclaimer')}</p>
  </div>;
}
