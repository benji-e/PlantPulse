import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Camera, CheckCircle2, ChevronRight, CircleHelp, Clock3, ImagePlus, Leaf, ShieldCheck, Sprout, Sun } from 'lucide-react';
import { Brand } from '../components/Brand';
import { ModelBadge } from '../components/StatusBadges';
import { Button, Card } from '../components/UI';
import { useAppStore } from '../store/appStore';
import { useTranslation } from '../hooks/useTranslation';

const slides = [
  { icon: Camera, title: 'onboardingTakeTitle', text: 'onboardingTakeText' },
  { icon: Leaf, title: 'onboardingCheckTitle', text: 'onboardingCheckText' },
  { icon: Sprout, title: 'onboardingAdviceTitle', text: 'onboardingAdviceText' }
] as const;

export function HomePage() {
  const navigate = useNavigate();
  const t = useTranslation();
  const [stage, setStage] = useState<'splash' | 'onboarding' | 'home'>(() => {
    if (sessionStorage.getItem('plantpulse-session-started')) return 'home';
    return 'splash';
  });
  const [slide, setSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [scanCount, setScanCount] = useState(0);

  useEffect(() => {
    if (stage !== 'splash') return;
    const timer = window.setTimeout(() => {
      sessionStorage.setItem('plantpulse-session-started', 'true');
      setStage(localStorage.getItem('plantpulse-onboarding-complete') ? 'home' : 'onboarding');
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [stage]);

  useEffect(() => {
    let active = true;
    import('../lib/database').then(({ database }) => database.scans.count()).then((count) => { if (active) setScanCount(count); });
    return () => { active = false; };
  }, []);

  function finishOnboarding() {
    localStorage.setItem('plantpulse-onboarding-complete', 'true');
    setStage('home');
  }

  if (stage === 'splash') {
    return <div className="splash-screen"><Brand /><div className="splash-leaf"><Leaf size={70} /></div><p className="mt-4 text-coffee">{t('splashTagline')}</p></div>;
  }
  if (stage === 'onboarding') {
    const current = slides[slide];
    const Icon = current.icon;
    return <div className="onboarding-wrap" onTouchStart={(event) => setTouchStart(event.changedTouches[0].clientX)} onTouchEnd={(event) => {
      if (touchStart === null) return;
      const change = event.changedTouches[0].clientX - touchStart;
      if (change < -40) setSlide((value) => Math.min(slides.length - 1, value + 1));
      if (change > 40) setSlide((value) => Math.max(0, value - 1));
    }}>
      <div className="flex w-full items-center justify-between"><Brand /><button className="quiet-link" onClick={finishOnboarding}>{t('skip')}</button></div>
      <div className="onboarding-art"><div className="onboarding-blob"><Icon size={76} strokeWidth={1.5} /></div><div className="onboarding-sun"><Sun /></div><div className="onboarding-leaf">🍃</div></div>
      <div className="text-center"><p className="eyebrow">{t('step')} {slide + 1} / 3</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-forest">{t(current.title)}</h1><p className="mx-auto mt-3 max-w-sm text-lg text-coffee">{t(current.text)}</p></div>
      <div className="flex justify-center gap-2">{slides.map((item, index) => <span key={item.title} className={`h-2.5 rounded-full transition-all ${index === slide ? 'w-8 bg-forest' : 'w-2.5 bg-forest/20'}`} />)}</div>
      <Button className="w-full max-w-sm" onClick={() => slide < 2 ? setSlide(slide + 1) : finishOnboarding()}>{slide < 2 ? t('next') : t('letsBegin')}<ArrowRight size={19} /></Button>
    </div>;
  }

  return (
    <div className="space-y-6 sm:space-y-8 page-enter">
      <section className="hero-panel">
        <div className="hero-content">
          <div className="flex items-center gap-2 text-sm font-extrabold text-leaf-pale"><span className="h-2 w-2 rounded-full bg-[#B9D8A7]" />{t('landingEyebrow')}</div>
          <h1 className="mt-4 max-w-xl text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl">{t('landingTitle')}</h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-white/85 sm:text-lg">{t('landingIntro')}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button className="button-light" onClick={() => { useAppStore.getState().setSelectedImage(null); navigate('/scan'); }}><Camera size={21} />{t('scanPlant')}</Button>
            <label className="button button-hero-secondary cursor-pointer"><ImagePlus size={20} />{t('uploadGallery')}<input className="sr-only" type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) { useAppStore.getState().setSelectedImage(file); navigate('/scan'); } }} /></label>
          </div>
          <div className="mt-6 flex flex-wrap gap-2"><ModelBadge /><span className="hero-private"><ShieldCheck size={16} />{t('landingProof')}</span><span className="hero-private"><CheckCircle2 size={16} />{t('landingWorksOffline')}</span></div>
        </div>
        <div className="hero-illustration">
          <img className="hero-photo hero-photo-main" src="/images/cassava-harvest-uganda.jpg" alt={t('photoHarvest')} />
          <img className="hero-photo hero-photo-small" src="/images/cassava-growers-uganda.jpg" alt={t('photoGrowers')} />
          <span className="hero-caption"><span className="pulse-dot" />{t('landingPhotoCaption')}</span>
        </div>
      </section>

      <section className="welcome-strip"><div><p className="eyebrow">{t('landingSectionIntro')}</p><h2 className="mt-2 text-2xl font-extrabold text-forest sm:text-3xl">{t('landingSectionTitle')}</h2></div><img src="/images/cassava-planting-uganda.jpg" alt={t('photoPlanting')} className="welcome-photo" loading="lazy" /></section>

      <section className="grid gap-4 md:grid-cols-3">
        <Link to="/history" className="quick-card"><span className="quick-icon bg-[#EAF2E6] text-forest"><Clock3 /></span><span className="min-w-0 flex-1"><strong>{t('myScans')}</strong><small>{scanCount ? scanCount === 1 ? t('savedOne') : t('savedCount', { count: scanCount }) : t('savedCheckups')}</small></span><ChevronRight /></Link>
        <Link to="/guide" className="quick-card"><span className="quick-icon bg-[#F5ECE3] text-coffee"><BookOpen /></span><span className="min-w-0 flex-1"><strong>{t('diseaseGuide')}</strong><small>{t('learnCassavaSigns')}</small></span><ChevronRight /></Link>
        <Link to="/help" className="quick-card"><span className="quick-icon bg-[#FFF1DF] text-warning"><CircleHelp /></span><span className="min-w-0 flex-1"><strong>{t('howItWorks')}</strong><small>{t('photoTips')}</small></span><ChevronRight /></Link>
      </section>

      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3"><div className="quick-icon bg-[#EAF2E6] text-forest"><CheckCircle2 /></div><div><h2 className="font-extrabold">{t('weakConnection')}</h2><p className="mt-1 text-sm text-coffee">{t('offlineIntro')}</p></div></div>
        <Link to="/about" className="text-link">{t('aboutTool')} <ArrowRight size={16} /></Link>
      </Card>
      <p className="text-center text-xs leading-relaxed text-coffee-light">{t('landingDisclaimer')}</p>
      <div className="text-center text-[11px] leading-relaxed text-coffee-light">
        <span>{t('photoCredits')} </span>
        <a href="https://commons.wikimedia.org/wiki/File:A_farmer_with_her_workers_harvesting_cassava.jpg" target="_blank" rel="noreferrer">Emmanuel Ssekaggo — {t('photoHarvest')}</a>
        {' · '}
        <a href="https://commons.wikimedia.org/wiki/File:A_farmer_with_her_workers_harvesting_cassava_01.jpg" target="_blank" rel="noreferrer">Emmanuel Ssekaggo — {t('photoGrowers')}</a>
        {' · '}
        <a href="https://commons.wikimedia.org/wiki/File:A_woman_organising_the_sucks_to_plant.jpg" target="_blank" rel="noreferrer">Ph scale 56 — {t('photoPlanting')}</a>
        {' · '}
        <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">{t('photoLicense')}</a>
      </div>
    </div>
  );
}
