import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Play, Plus, TrendingDown, Target, CalendarDays, Flame } from 'lucide-react';
import { db } from '../database/db';
import { repository } from '../database/repository';
import { useAction } from '../components/Notices';
import NutritionOverview from './nutrition/NutritionOverview';
export function weekStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.toISOString();
}
export default function Dashboard() {
  const data = useLiveQuery(async () => ({
    goals: await db.userGoals.get('default'),
    profile: await db.profiles.get('default'),
    measurements: await db.bodyMeasurements.orderBy('recordedAt').toArray(),
    sessions: await db.workoutSessions.orderBy('startedAt').reverse().toArray(),
    plans: await db.workoutPlans.toArray(),
    items: await db.workoutPlanExercises.toArray(),
  }));
  const navigate = useNavigate();
  const act = useAction();
  if (!data) return <p>Yükleniyor…</p>;
  const { goals, profile, measurements, sessions, plans, items } = data;
  const completed = sessions.filter((s) => s.status === 'Completed');
  const weekly = completed.filter((s) => s.startedAt >= weekStart()).length;
  const current = measurements.filter((m) => m.weightKg).at(-1)?.weightKg;
  const start = profile?.startingWeightKg ?? 90,
    target = goals?.targetWeightKg ?? 78;
  const progress =
    current === undefined
      ? 0
      : Math.max(0, Math.min(100, ((start - current) / (start - target || 1)) * 100));
  const next =
    plans.find((p) => p.isActive && p.id !== completed[0]?.workoutPlanId) ??
    plans.find((p) => p.isActive);
  const active = sessions.find((s) => s.status === 'InProgress');
  return (
    <>
      <div className="heading">
        <div>
          <p className="eyebrow">BUGÜN KENDİN İÇİN BİR ADIM</p>
          <h1>
            Harekete iyi bir başlangıç<span className="accent">.</span>
          </h1>
          <p>İlerlemeni takip et, ritmini bul. Her antrenman değerli.</p>
        </div>
        <Link className="button" to="/gelisim">
          <Plus size={18} />
          Ölçüm ekle
        </Link>
      </div>
      <section className="hero">
        <div>
          <span className="pill">EVDE ANTRENMAN · BAŞLANGIÇ</span>
          <h2>{active ? 'Kaldığın yerden devam.' : 'Gücün, istikrarında.'}</h2>
          <p>
            {active
              ? 'Antrenmanın ve tamamladığın setler kaydedildi.'
              : 'Büyük değişimler küçük adımlarla başlar. Bugün kendine biraz zaman ayır.'}
          </p>
          <button
            className="primary"
            disabled={!active && !next}
            onClick={() =>
              void act(async () => {
                if (!active && next) await repository.startSession(next.id);
                navigate('/antrenman');
              })
            }
          >
            <Play size={18} />
            {active ? 'Antrenmana devam et' : 'Antrenmana başla'}
            <ArrowRight size={18} />
          </button>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <span />
          <div className="art-caption" />
        </div>
      </section>
      <section className="stat-grid">
        <article className="stat">
          <span className="stat-icon">
            <TrendingDown />
          </span>
          <p>Güncel ağırlık</p>
          <strong>
            {current ?? '—'} <small>kg</small>
          </strong>
          <span>{current ? 'Son kaydedilen ölçüm' : 'Henüz ölçüm eklenmedi'}</span>
        </article>
        <article className="stat">
          <span className="stat-icon">
            <Target />
          </span>
          <p>Hedef ağırlık</p>
          <strong>
            {target} <small>kg</small>
          </strong>
          <span>Başlangıç tercihin: {start} kg</span>
        </article>
        <article className="stat">
          <span className="stat-icon">
            <CalendarDays />
          </span>
          <p>Bu haftaki antrenman</p>
          <strong>
            {weekly}
            <small> / {goals?.weeklyWorkoutTarget ?? 3}</small>
          </strong>
          <span>Her hafta yeni bir başlangıç</span>
        </article>
        <article className="stat">
          <span className="stat-icon">
            <Flame />
          </span>
          <p>Toplam antrenman</p>
          <strong>
            {completed.length}
            <small> seans</small>
          </strong>
          <span>Tamamladığın tüm antrenmanlar</span>
        </article>
      </section>
      <div className="two-columns">
        <section className="card">
          <div className="section-title">
            <h2>Sıradaki programın</h2>
            <Link to="/programlar">
              Tümünü gör <ArrowRight size={16} />
            </Link>
          </div>
          {next ? (
            <>
              <div className="plan-preview">
                <span className="plan-letter">{next.name.endsWith('B') ? 'B' : 'A'}</span>
                <div>
                  <h3>{next.name}</h3>
                  <p>
                    {items.filter((i) => i.workoutPlanId === next.id).length} egzersiz ·{' '}
                    {next.description}
                  </p>
                </div>
              </div>
              <p className="muted">A / B dönüşümüyle, sana uygun günlerde antrenman yap.</p>
              <Link className="text-link" to="/programlar">
                Programı incele <ArrowRight size={16} />
              </Link>
            </>
          ) : (
            <p>İlk programını oluşturarak başla.</p>
          )}
        </section>
        <section className="card">
          <div className="section-title">
            <h2>Hedefine doğru</h2>
            <span className="badge">%{Math.round(progress)}</span>
          </div>
          <p className="muted">Ağırlık hedefi ilerlemesi</p>
          <div className="progress-track">
            <div style={{ width: `${progress}%` }} />
          </div>
          <div className="row muted">
            <span>{start} kg başlangıç</span>
            <span>{target} kg hedef</span>
          </div>
          <p className="small-note">
            Ölçümler bir yol gösterici. İstikrarın da gelişiminin bir parçası.
          </p>
        </section>
      </div>
      <NutritionOverview />
      <section className="card">
        <div className="section-title">
          <h2>Son antrenmanların</h2>
          <Link to="/gecmis">
            Geçmişi gör <ArrowRight size={16} />
          </Link>
        </div>
        {completed.length ? (
          completed.slice(0, 3).map((s) => (
            <div className="history-row" key={s.id}>
              <div>
                <strong>{s.workoutNameSnapshot}</strong>
                <p>{new Date(s.startedAt).toLocaleDateString('tr-TR')}</p>
              </div>
              <span className="badge">Tamamlandı</span>
            </div>
          ))
        ) : (
          <div className="empty">
            <CalendarDays size={30} />
            <h3>Hikâyen ilk antrenmanla başlıyor.</h3>
            <p>Tamamladığın antrenmanlar burada görünecek.</p>
          </div>
        )}
      </section>
    </>
  );
}
