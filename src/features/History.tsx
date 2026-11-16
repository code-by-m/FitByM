import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../database/db';
import { Modal, Empty } from '../components/Modal';
import { clock } from './Workout';
import type { WorkoutSession } from '../types/models';
export default function History() {
  const sessions =
    useLiveQuery(() => db.workoutSessions.orderBy('startedAt').reverse().toArray()) ?? [];
  const exercises = useLiveQuery(() => db.workoutSessionExercises.toArray()) ?? [];
  const sets = useLiveQuery(() => db.workoutSets.toArray()) ?? [];
  const [params, setParams] = useSearchParams();
  const [chosen, setSelected] = useState<WorkoutSession>();
  const selected = chosen ?? sessions.find((s) => s.id === params.get('oturum'));
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [name, setName] = useState('');
  const filtered = sessions.filter(
    (s) =>
      s.status !== 'InProgress' &&
      (!from || s.startedAt >= new Date(`${from}T00:00:00`).toISOString()) &&
      (!to || s.startedAt <= new Date(`${to}T23:59:59`).toISOString()) &&
      (!name || s.workoutNameSnapshot === name),
  );
  return (
    <>
      <p className="eyebrow">EMEĞİNİN GÜNLÜĞÜ</p>
      <h1>Antrenman geçmişi</h1>
      <div className="filters">
        <label>
          Başlangıç
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label>
          Bitiş
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <label>
          Program
          <select value={name} onChange={(e) => setName(e.target.value)}>
            <option value="">Tümü</option>
            {Array.from(new Set(sessions.map((s) => s.workoutNameSnapshot))).map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
      </div>
      <section className="card">
        {filtered.map((s) => {
          const ids = exercises.filter((e) => e.workoutSessionId === s.id).map((e) => e.id);
          const completed = sets.filter(
            (x) => ids.includes(x.workoutSessionExerciseId) && x.isCompleted,
          );
          return (
            <button className="history-row full-width" key={s.id} onClick={() => setSelected(s)}>
              <div>
                <strong>{s.workoutNameSnapshot}</strong>
                <p>{new Date(s.startedAt).toLocaleString('tr-TR')}</p>
              </div>
              <div>
                <span>
                  {completed.length} set ·{' '}
                  {clock(
                    (Date.parse(s.completedAt ?? s.startedAt) - Date.parse(s.startedAt)) / 1000,
                  )}
                </span>
                <p>{s.status === 'Completed' ? 'Tamamlandı' : 'İptal edildi'}</p>
              </div>
            </button>
          );
        })}
        {!filtered.length && <Empty>Bu aralıkta kayıtlı antrenman yok.</Empty>}
      </section>
      {selected && (
        <Modal
          title={selected.workoutNameSnapshot}
          onClose={() => {
            setSelected(undefined);
            setParams({});
          }}
        >
          <p>{new Date(selected.startedAt).toLocaleString('tr-TR')}</p>
          <p>
            Süre:{' '}
            {clock(
              (Date.parse(selected.completedAt ?? selected.startedAt) -
                Date.parse(selected.startedAt)) /
                1000,
            )}
          </p>
          {exercises
            .filter((e) => e.workoutSessionId === selected.id)
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((e) => {
              const completed = sets.filter(
                (s) => s.workoutSessionExerciseId === e.id && s.isCompleted,
              );
              const previous = exercises
                .filter((x) => x.exerciseId === e.exerciseId && x.workoutSessionId !== selected.id)
                .filter((x) =>
                  sessions.some(
                    (s) =>
                      s.id === x.workoutSessionId &&
                      s.status === 'Completed' &&
                      s.startedAt < selected.startedAt,
                  ),
                )
                .sort((a, b) =>
                  (
                    sessions.find((s) => s.id === b.workoutSessionId)?.startedAt ?? ''
                  ).localeCompare(
                    sessions.find((s) => s.id === a.workoutSessionId)?.startedAt ?? '',
                  ),
                )[0];
              return (
                <div className="history-detail" key={e.id}>
                  <h3>
                    {e.exerciseNameSnapshot} {e.skipped ? '(atlandı)' : ''}
                  </h3>
                  <p>{completed.length ? 'Tamamlanan setler:' : 'Tamamlanmış set yok.'}</p>
                  {completed.map((s) => (
                    <p key={s.id}>
                      {s.setNumber}. set:{' '}
                      {s.repetitions !== undefined
                        ? `${s.repetitions} tekrar`
                        : `${s.durationSeconds} sn`}
                      {s.weightKg !== undefined ? ` · ${s.weightKg} kg` : ''}
                    </p>
                  ))}
                  {previous && (
                    <small>
                      Önceki antrenman:{' '}
                      {sets
                        .filter((s) => s.workoutSessionExerciseId === previous.id && s.isCompleted)
                        .map(
                          (s) =>
                            `${s.repetitions ?? s.durationSeconds}${s.repetitions !== undefined ? ' tekrar' : ' sn'}${s.weightKg ? ` / ${s.weightKg} kg` : ''}`,
                        )
                        .join(', ') || 'Tamamlanan set yok'}
                    </small>
                  )}
                </div>
              );
            })}
          <p>Not: {selected.notes || 'Not eklenmedi.'}</p>
        </Modal>
      )}
    </>
  );
}
