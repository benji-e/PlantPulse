import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { BookOpen, CircleHelp, House, Leaf, Settings, Sprout, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Brand } from './Brand';
import { ModelBadge } from './StatusBadges';
import { useAppStore } from '../store/appStore';
import { useTranslation } from '../hooks/useTranslation';

const navItems = [
  { to: '/', key: 'home' as const, icon: House },
  { to: '/scan', key: 'scan' as const, icon: Leaf },
  { to: '/history', key: 'history' as const, icon: Sprout },
  { to: '/guide', key: 'guide' as const, icon: BookOpen },
  { to: '/settings', key: 'settings' as const, icon: Settings }
];

export function AppShell() {
  const location = useLocation();
  const largeText = useAppStore((state) => state.largeText);
  const language = useAppStore((state) => state.language);
  const t = useTranslation();
  const pageTitle = `${t('plantPulse')} — ${t('growWithConfidence')}`;
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  useEffect(() => {
    document.documentElement.lang = language === 'lg' ? 'lg-UG' : 'en-UG';
    document.title = pageTitle;
  }, [language, pageTitle]);

  async function installApp() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    setInstallPrompt(null);
    setShowInstall(false);
  }

  return (
    <div className={largeText ? 'app-root large-text' : 'app-root'}>
      <header className="sticky top-0 z-40 border-b border-forest/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <NavLink to="/" aria-label={`${t('plantPulse')} ${t('home')}`}><Brand /></NavLink>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden items-center gap-4 md:flex lg:hidden"><ModelBadge /><NavLink className="quiet-link" to="/help">{t('help')}</NavLink></div>
            <nav className="desktop-nav hidden lg:flex" aria-label={t('mainNavigation')}>
              {navItems.map(({ to, key }) => (
                <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `desktop-nav-item ${isActive ? 'active' : ''}`}>
                  {t(key)}
                </NavLink>
              ))}
              <NavLink to="/help" className={({ isActive }) => `desktop-nav-item ${isActive ? 'active' : ''}`}>
                {t('help')}
              </NavLink>
            </nav>
            <NavLink className="icon-button md:hidden" to="/help" aria-label={t('help')}><CircleHelp size={22} /></NavLink>
          </div>
        </div>
      </header>
      {showInstall && (
        <div className="fixed inset-x-3 top-[76px] z-50 mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-forest/15 bg-white p-4 shadow-soft" role="status">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-forest/10 text-forest"><Sprout /></span>
          <div className="min-w-0 flex-1"><p className="font-extrabold">{t('keepPlantPulse')}</p><p className="text-sm text-coffee">{t('installOffline')}</p></div>
          <button className="button button-small" onClick={installApp}>{t('install')}</button>
          <button className="icon-button" onClick={() => setShowInstall(false)} aria-label={t('dismissInstall')}><X size={18} /></button>
        </div>
      )}
      <main className="mx-auto min-h-[calc(100vh-160px)] max-w-7xl px-4 pb-28 pt-5 sm:px-6 sm:pt-8 lg:pb-12 lg:px-8">
        <div className="mb-4 md:hidden"><ModelBadge /></div>
        <Outlet />
      </main>
      <footer className="border-t border-forest/10 bg-white px-4 py-6 pb-24 text-center text-sm text-coffee lg:pb-6">
        PlantPulse · {t('footerLine')}
      </footer>
      <nav className="bottom-nav lg:hidden" aria-label={t('mainNavigation')}>
        {navItems.map(({ to, key, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
            <Icon size={21} aria-hidden="true" /><span>{t(key)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}
