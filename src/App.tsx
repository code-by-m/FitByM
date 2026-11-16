import { lazy, Suspense, useEffect, useState } from 'react';
import { NavLink, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  Activity,
  House,
  Dumbbell,
  ChartNoAxesCombined,
  Settings,
  BookOpen,
  History,
  ArrowUpRight,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { db } from './database/db';
import { useAction } from './components/Notices';
const Dashboard = lazy(() => import('./features/Dashboard'));
const Exercises = lazy(() => import('./features/Exercises'));
const Plans = lazy(() => import('./features/Plans'));
const Workout = lazy(() => import('./features/Workout'));
const Progress = lazy(() => import('./features/Progress'));
const SettingsPage = lazy(() => import('./features/Settings'));
const HistoryPage = lazy(() => import('./features/History'));
const navigation = [
  ['/', 'Ana Sayfa', House],
  ['/programlar', 'Programlar', Dumbbell],
  ['/antrenman', 'Antrenman', Activity],
  ['/gelisim', 'Gelişim', ChartNoAxesCombined],
  ['/ayarlar', 'Ayarlar', Settings],
] as const;
export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();
  const profile = useLiveQuery(() => db.profiles.get('default'));
  const activeSession = useLiveQuery(() =>
    db.workoutSessions.where('status').equals('InProgress').first(),
  );
  const [registration, setRegistration] = useState<ServiceWorkerRegistration>();
  const [controllerUpdated, setControllerUpdated] = useState(false);
  const act = useAction();
  const {
    needRefresh: [refresh],
  } = useRegisterSW({
    onRegisteredSW: (_, value) => setRegistration(value),
    onNeedReload: () => {},
  });
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    let previous = navigator.serviceWorker.controller;
    const changed = () => {
      const current = navigator.serviceWorker.controller;
      if (previous && previous !== current) setControllerUpdated(true);
      previous = current;
    };
    navigator.serviceWorker.addEventListener('controllerchange', changed);
    return () => navigator.serviceWorker.removeEventListener('controllerchange', changed);
  }, []);
  useEffect(() => {
    const check = () => {
      if (navigator.onLine && document.visibilityState === 'visible')
        void registration?.update().catch(() => {
          /* Retried on the next focus. */
        });
    };
    document.addEventListener('visibilitychange', check);
    window.addEventListener('focus', check);
    const interval = window.setInterval(check, 60 * 60 * 1000);
    return () => {
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('focus', check);
      window.clearInterval(interval);
    };
  }, [registration]);
  useEffect(() => {
    db.open()
      .then(() => setReady(true))
      .catch((e) => setError(String(e)));
  }, []);
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const apply = () =>
      (document.documentElement.dataset.theme =
        profile?.theme === 'system'
          ? media.matches
            ? 'dark'
            : 'light'
          : (profile?.theme ?? 'light'));
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [profile?.theme]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  if (error)
    return (
      <main>
        <h1>Veritabanı açılamadı</h1>
        <p>{error}</p>
        <p>Özel gezinme veya tarayıcı depolama izinlerini kontrol edin.</p>
        <button onClick={() => window.location.reload()}>Yeniden dene</button>
      </main>
    );
  return (
    <>
      <a
        className="skip"
        href="#content"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById('content')?.focus();
        }}
      >
        İçeriğe geç
      </a>
      <aside className="sidebar">
        <Link className="brand" to="/">
          <span className="brand-icon">
            <Activity />
          </span>
          <span>
            FitByM<small>by CodeByM</small>
          </span>
        </Link>
        <p className="nav-label">KİŞİSEL ALANIN</p>
        <nav>
          {navigation.map(([path, label, Icon]) => (
            <NavLink key={path} to={path} end={path === '/'}>
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
          <NavLink to="/egzersizler">
            <BookOpen size={20} />
            Egzersizler
          </NavLink>
          <NavLink to="/gecmis">
            <History size={20} />
            Geçmiş
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <img src={`${import.meta.env.BASE_URL}brand/Icon.png`} alt="CodeByM" />
          <p>
            Biraz daha güçlü.
            <br />
            <strong>Her gün, kendin için.</strong>
          </p>
          <small>Verilerin bu cihazda saklanır.</small>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <Link to="/" className="mobile-brand">
            FitByM <small>by CodeByM</small>
          </Link>
          <span className="desktop-date">
            {new Date().toLocaleDateString('tr-TR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              weekday: 'long',
            })}
          </span>
          <Link className="library-link" to="/egzersizler">
            Egzersiz kütüphanesi <ArrowUpRight size={16} />
          </Link>
        </header>
        <main id="content" tabIndex={-1}>
          {(refresh || controllerUpdated) && (
            <div className="update">
              <span>
                {activeSession
                  ? 'Yeni sürüm hazır. Güncellemeden önce aktif antrenmanını bitir.'
                  : 'Yeni sürüm hazır. Açık formlarını kaydettikten sonra güncelle.'}
              </span>
              <button
                disabled={Boolean(activeSession)}
                onClick={() =>
                  void act(async () => {
                    if (activeSession) return;
                    if (controllerUpdated) {
                      window.location.reload();
                      return;
                    }
                    const worker = registration?.waiting;
                    if (!worker)
                      throw Error('Güncelleme hazırlanıyor. Kısa süre sonra yeniden deneyin.');
                    navigator.serviceWorker.addEventListener(
                      'controllerchange',
                      () => window.location.reload(),
                      { once: true },
                    );
                    worker.postMessage({ type: 'SKIP_WAITING' });
                  })
                }
              >
                Güncelle
              </button>
            </div>
          )}
          {!ready ? (
            <p role="status">Kayıtların hazırlanıyor…</p>
          ) : (
            <Suspense fallback={<p role="status">Yükleniyor…</p>}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/egzersizler" element={<Exercises />} />
                <Route path="/programlar" element={<Plans />} />
                <Route path="/antrenman" element={<Workout />} />
                <Route path="/gelisim" element={<Progress />} />
                <Route path="/ayarlar" element={<SettingsPage />} />
                <Route path="/gecmis" element={<HistoryPage />} />
                <Route
                  path="*"
                  element={
                    <>
                      <h1>Sayfa bulunamadı</h1>
                      <Link to="/">Ana sayfaya dön</Link>
                    </>
                  }
                />
              </Routes>
            </Suspense>
          )}
        </main>
        <footer className="page-footer">
          FitByM by CodeByM <span>Kendi hızında. Kendi yolunda.</span>
        </footer>
      </div>
      <nav className="bottom-nav" aria-label="Ana gezinme">
        {navigation.map(([path, label, Icon]) => (
          <NavLink key={path} to={path} end={path === '/'}>
            <Icon size={21} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
