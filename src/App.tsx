import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import { AppShell } from './components/AppShell';
import { useAppStore } from './store/appStore';
import { useTranslation } from './hooks/useTranslation';

const HomePage = lazy(() => import('./pages/HomePage').then((module) => ({ default: module.HomePage })));
const PhotoPicker = lazy(() => import('./components/PhotoPicker').then((module) => ({ default: module.PhotoPicker })));
const AnalyzingPage = lazy(() => import('./pages/AnalyzingPage').then((module) => ({ default: module.AnalyzingPage })));
const ResultPage = lazy(() => import('./pages/ResultPage').then((module) => ({ default: module.ResultPage })));
const HistoryPage = lazy(() => import('./pages/HistoryPage').then((module) => ({ default: module.HistoryPage })));
const GuidePage = lazy(() => import('./pages/GuidePage').then((module) => ({ default: module.GuidePage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })));
const HelpPage = lazy(() => import('./pages/HelpPage').then((module) => ({ default: module.HelpPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then((module) => ({ default: module.AboutPage })));

function ScreenLoader() {
  const t = useTranslation();
  return <div className="loading-card" role="status">{t('openingPlantPulse')}</div>;
}

function Startup() {
  const setModel = useAppStore((state) => state.setModel);
  useEffect(() => {
    let active = true;
    registerSW({ immediate: true });
    async function startModel() {
      try {
        const { cacheModelAssets, warmClassifier } = await import('./services/classifier');
        const { backend } = await warmClassifier((progress) => {
          if (active) setModel({ state: 'loading', progress });
        });
        let offlineReady = false;
        let offlineError: string | undefined;
        try {
          await cacheModelAssets();
          offlineReady = true;
        } catch (error) {
          offlineError = `Offline caching failed: ${error instanceof Error ? error.message : String(error)}`;
        }
        if (active) setModel({ state: 'ready', progress: 100, backend, offlineReady, error: offlineError });
      } catch (error) {
        if (active) {
          const message = error instanceof Error ? error.message : String(error);
          setModel({ state: 'error', progress: 0, error: message });
        }
      }
    }
    void startModel();
    return () => {
      active = false;
    };
  }, [setModel]);

  return <BrowserRouter>
    <Suspense fallback={<ScreenLoader />}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/scan" element={<PhotoPicker />} />
          <Route path="/capture" element={<PhotoPicker />} />
          <Route path="/analyzing" element={<AnalyzingPage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/guide" element={<GuidePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  </BrowserRouter>;
}

export default Startup;
