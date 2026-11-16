import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { Plus } from 'lucide-react';
import { db } from '../database/db';
import { repository } from '../database/repository';
import { uid, type Measurement } from '../types/models';
import { Modal, Empty } from '../components/Modal';
import { useAction } from '../components/Notices';
import { weekStart } from './Dashboard';
function MeasurementForm({ onClose }: { onClose: () => void }) {
  const act = useAction();
  const [date] = useState(() =>
    new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
  );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const number = (key: string) => (f.get(key) ? Number(f.get(key)) : undefined);
        const value: Measurement = {
          id: uid(),
          recordedAt: new Date(String(f.get('date'))).toISOString(),
          weightKg: number('weightKg'),
          waistCm: number('waistCm'),
          chestCm: number('chestCm'),
          hipCm: number('hipCm'),
          armCm: number('armCm'),
          notes: String(f.get('notes') ?? ''),
        };
        void act(async () => {
          await repository.saveMeasurement(value);
          onClose();
        }, 'Ölçüm kaydedildi.');
      }}
    >
      <label>
        Tarih ve saat
        <input type="datetime-local" name="date" required defaultValue={date} />
      </label>
      {[
        ['weightKg', 'Ağırlık (kg)', 500],
        ['waistCm', 'Bel (cm)', 400],
        ['chestCm', 'Göğüs (cm)', 400],
        ['hipCm', 'Kalça (cm)', 400],
        ['armCm', 'Kol (cm)', 200],
      ].map(([key, label, max]) => (
        <label key={key}>
          {label}
          <input name={String(key)} type="number" min="0.1" max={max} step="0.1" />
        </label>
      ))}
      <label>
        Not
        <textarea name="notes" maxLength={4000} />
      </label>
      <button className="primary">Ölçümü kaydet</button>
    </form>
  );
}
export default function Progress() {
  const measurements =
    useLiveQuery(() => db.bodyMeasurements.orderBy('recordedAt').toArray()) ?? [];
  const sessions = useLiveQuery(() => db.workoutSessions.toArray()) ?? [];
  const exercises = useLiveQuery(() => db.workoutSessionExercises.toArray()) ?? [];
  const sets = useLiveQuery(() => db.workoutSets.toArray()) ?? [];
  const [today] = useState(Date.now);
  const [range, setRange] = useState('90');
  const [metric, setMetric] = useState<'weightKg' | 'waistCm' | 'chestCm'>('weightKg');
  const [exercise, setExercise] = useState('');
  const [adding, setAdding] = useState(false);
  const act = useAction();
  const cutoff = range === 'all' ? 0 : today - Number(range) * 86400000;
  const rows = measurements
    .filter((m) => Date.parse(m.recordedAt) >= cutoff && m[metric] !== undefined)
    .map((m) => ({ date: new Date(m.recordedAt).toLocaleDateString('tr-TR'), value: m[metric] }));
  const weights = measurements.filter((m) => m.weightKg !== undefined);
  const change = weights.length > 1 ? weights.at(-1)!.weightKg! - weights[0].weightKg! : undefined;
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const start = Date.parse(weekStart()) - (7 - i) * 7 * 86400000;
    return {
      date: new Date(start).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
      count: sessions.filter(
        (s) =>
          s.status === 'Completed' &&
          Date.parse(s.startedAt) >= start &&
          Date.parse(s.startedAt) < start + 7 * 86400000,
      ).length,
    };
  });
  const performance = exercises
    .filter((e) => e.exerciseId === exercise)
    .map((e) => {
      const session = sessions.find((s) => s.id === e.workoutSessionId && s.status === 'Completed');
      const completed = sets.filter((s) => s.workoutSessionExerciseId === e.id && s.isCompleted);
      return {
        time: session ? Date.parse(session.startedAt) : 0,
        date: session ? new Date(session.startedAt).toLocaleDateString('tr-TR') : '',
        value: completed.reduce(
          (sum, s) =>
            sum +
            (e.trackingTypeSnapshot.startsWith('Duration')
              ? (s.durationSeconds ?? 0)
              : (s.repetitions ?? 0)),
          0,
        ),
      };
    })
    .filter((r) => r.time >= cutoff && r.time > 0)
    .sort((a, b) => a.time - b.time);
  return (
    <>
      <div className="heading">
        <div>
          <p className="eyebrow">KÜÇÜK ADIMLAR, KALICI GELİŞİM</p>
          <h1>Gelişim</h1>
          <p>
            {change === undefined
              ? 'İlerlemeni görmek için ölçümlerini ekle.'
              : `İlk ölçümden bugüne ağırlık değişimi: ${change > 0 ? '+' : ''}${change.toFixed(1)} kg`}
          </p>
        </div>
        <button onClick={() => setAdding(true)}>
          <Plus size={18} />
          Ölçüm ekle
        </button>
      </div>
      <div className="filters">
        <label>
          Zaman aralığı
          <select value={range} onChange={(e) => setRange(e.target.value)}>
            <option value="30">Son 30 gün</option>
            <option value="90">Son 90 gün</option>
            <option value="365">Son yıl</option>
            <option value="all">Tüm zamanlar</option>
          </select>
        </label>
        <label>
          Ölçüm
          <select value={metric} onChange={(e) => setMetric(e.target.value as typeof metric)}>
            <option value="weightKg">Ağırlık (kg)</option>
            <option value="waistCm">Bel (cm)</option>
            <option value="chestCm">Göğüs (cm)</option>
          </select>
        </label>
      </div>
      <div className="two-columns">
        <section className="card">
          <h2>Vücut ölçümleri</h2>
          {rows.length ? (
            <div className="chart">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={rows}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={['auto', 'auto']} />
                  <Tooltip />
                  <Line
                    name={metric === 'weightKg' ? 'kg' : 'cm'}
                    dataKey="value"
                    stroke="var(--primary)"
                    strokeWidth={3}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Empty>Bu aralıkta ölçüm yok.</Empty>
          )}
        </section>
        <section className="card">
          <h2>Antrenman tutarlılığı</h2>
          <p className="muted">Son 8 haftada tamamlanan seanslar</p>
          <div className="chart">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={weeks}>
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar name="Antrenman" dataKey="count" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
      <section className="card">
        <h2>Egzersiz performansı</h2>
        <label>
          Egzersiz
          <select value={exercise} onChange={(e) => setExercise(e.target.value)}>
            <option value="">Bir egzersiz seç</option>
            {Array.from(new Map(exercises.map((e) => [e.exerciseId, e.exerciseNameSnapshot]))).map(
              ([id, name]) => (
                <option value={id} key={id}>
                  {name}
                </option>
              ),
            )}
          </select>
        </label>
        {performance.length ? (
          <div className="chart">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={performance}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  name="Seans toplamı (tekrar veya sn)"
                  dataKey="value"
                  stroke="var(--primary)"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <Empty>Grafik için egzersiz seç ve en az bir antrenman tamamla.</Empty>
        )}
      </section>
      <section className="card">
        <h2>Ölçüm günlüğü</h2>
        {measurements.length ? (
          measurements
            .slice()
            .reverse()
            .map((m) => (
              <div className="history-row" key={m.id}>
                <div>
                  <strong>{new Date(m.recordedAt).toLocaleDateString('tr-TR')}</strong>
                  <p>
                    {m.weightKg ? `${m.weightKg} kg · ` : ''}
                    {m.waistCm ? `Bel ${m.waistCm} cm · ` : ''}
                    {m.chestCm ? `Göğüs ${m.chestCm} cm · ` : ''}
                    {m.hipCm ? `Kalça ${m.hipCm} cm · ` : ''}
                    {m.armCm ? `Kol ${m.armCm} cm` : ''}
                  </p>
                  <small>{m.notes}</small>
                </div>
                <button
                  className="danger"
                  onClick={() => {
                    if (confirm('Bu ölçüm silinsin mi?'))
                      void act(async () => {
                        await db.bodyMeasurements.delete(m.id);
                      }, 'Ölçüm silindi.');
                  }}
                >
                  Sil
                </button>
              </div>
            ))
        ) : (
          <Empty>Henüz ölçüm kaydı yok.</Empty>
        )}
      </section>
      {adding && (
        <Modal title="Yeni vücut ölçümü" onClose={() => setAdding(false)}>
          <MeasurementForm onClose={() => setAdding(false)} />
        </Modal>
      )}
    </>
  );
}
