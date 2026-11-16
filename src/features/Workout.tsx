import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Timer, Plus } from 'lucide-react';
import { db } from '../database/db';
import { repository } from '../database/repository';
import { now, type WorkoutSet, type SessionExercise } from '../types/models';
import { useClock } from '../hooks/useClock';
import { useAction } from '../components/Notices';
import { Empty } from '../components/Modal';
export function clock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)
    .toString()
    .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}
function SetRow({ set, exercise }: { set: WorkoutSet; exercise: SessionExercise }) {
  const [value, setValue] = useState(set);
  const act = useAction();
  const save = (next: WorkoutSet) => {
    setValue(next);
    void act(() => repository.saveSet(next));
  };
  return (
    <div className={`set-row ${set.isCompleted ? 'done' : ''}`}>
      <strong>{set.setNumber}</strong>
      {exercise.trackingTypeSnapshot.startsWith('Duration') ? (
        <label>
          Süre (sn)
          <input
            type="number"
            min={0}
            max={86400}
            value={value.durationSeconds ?? ''}
            disabled={set.isCompleted}
            onChange={(e) =>
              save({
                ...value,
                durationSeconds: e.target.value ? e.target.valueAsNumber : undefined,
              })
            }
          />
        </label>
      ) : (
        <label>
          Tekrar
          <input
            type="number"
            min={0}
            max={1000}
            value={value.repetitions ?? ''}
            disabled={set.isCompleted}
            onChange={(e) =>
              save({ ...value, repetitions: e.target.value ? e.target.valueAsNumber : undefined })
            }
          />
        </label>
      )}
      <label>
        Ağırlık (kg)
        <input
          type="number"
          step="0.5"
          min={0}
          max={1000}
          placeholder="İsteğe bağlı"
          value={value.weightKg ?? ''}
          disabled={set.isCompleted}
          onChange={(e) =>
            save({ ...value, weightKg: e.target.value ? e.target.valueAsNumber : undefined })
          }
        />
      </label>
      <button
        aria-label={`${set.setNumber}. set ${set.isCompleted ? 'geri al' : 'tamamla'}`}
        className={set.isCompleted ? 'primary' : ''}
        onClick={() =>
          save({
            ...value,
            isCompleted: !set.isCompleted,
            completedAt: !set.isCompleted ? now() : undefined,
          })
        }
      >
        <Check size={20} />
      </button>
    </div>
  );
}
export default function Workout() {
  const navigate = useNavigate();
  const time = useClock();
  const act = useAction();
  const data = useLiveQuery(async () => {
    const session = await db.workoutSessions.where('status').equals('InProgress').first();
    if (!session) return null;
    const exercises = await db.workoutSessionExercises
      .where('workoutSessionId')
      .equals(session.id)
      .sortBy('sortOrder');
    const sets = await db.workoutSets
      .where('workoutSessionExerciseId')
      .anyOf(exercises.map((e) => e.id))
      .toArray();
    return { session, exercises, sets };
  });
  if (data === undefined) return <p>Yükleniyor…</p>;
  if (!data)
    return (
      <>
        <p className="eyebrow">KENDİNE AYIRDIĞIN ZAMAN</p>
        <h1>Antrenman</h1>
        <Empty>
          <Timer size={32} />
          <h2>Başlamaya hazır mısın?</h2>
          <p>Bir program seçerek ilk setine geç.</p>
          <Link className="button primary" to="/programlar">
            Programları gör
          </Link>
        </Empty>
      </>
    );
  const { session, exercises, sets } = data;
  const rest = Math.max(0, Math.ceil(((session.restEndsAt ?? 0) - time) / 1000));
  const done = sets.filter((s) => s.isCompleted).length;
  const current = exercises.find(
    (ex) => !ex.skipped && sets.some((s) => s.workoutSessionExerciseId === ex.id && !s.isCompleted),
  );
  return (
    <>
      <div className="heading">
        <div>
          <p className="eyebrow">ANTRENMAN DEVAM EDİYOR · OTOMATİK KAYIT</p>
          <h1>{session.workoutNameSnapshot}</h1>
          <p>
            {done} / {sets.length} set tamamlandı
          </p>
        </div>
        <div className="timer">
          <Timer />
          {clock((time - Date.parse(session.startedAt)) / 1000)}
        </div>
      </div>
      <div className="rest-bar">
        <strong>{rest ? `Dinlenme · ${clock(rest)}` : 'Bir sonraki set için hazırsın.'}</strong>
        <button
          onClick={() =>
            void act(async () => {
              await db.workoutSessions.update(session.id, {
                restEndsAt: rest ? undefined : Date.now() + 60000,
              });
            })
          }
        >
          {rest ? 'Dinlenmeyi bitir' : '60 sn dinlen'}
        </button>
      </div>
      {exercises.map((ex, i) => (
        <section
          className={`card workout-exercise ${current?.id === ex.id ? 'current-exercise' : ''} ${ex.skipped ? 'skipped' : ''}`}
          key={ex.id}
        >
          <div className="section-title">
            <div>
              <span className="eyebrow">
                HAREKET {i + 1} / {exercises.length}{' '}
                {current?.id === ex.id ? ' · SIRADAKİ HAREKET' : ''}
              </span>
              <h2>{ex.exerciseNameSnapshot}</h2>
              <p className="muted">
                Hedef: {ex.targetSetsSnapshot} ×{' '}
                {ex.targetRepsSnapshot ?? `${ex.targetDurationSnapshot} sn`} ·{' '}
                {ex.restSecondsSnapshot} sn dinlenme
              </p>
            </div>
            <button
              onClick={() =>
                void act(async () => {
                  await db.workoutSessionExercises.update(ex.id, { skipped: !ex.skipped });
                })
              }
            >
              {ex.skipped ? 'Geri ekle' : 'Atla'}
            </button>
          </div>
          {!ex.skipped && (
            <>
              {sets
                .filter((s) => s.workoutSessionExerciseId === ex.id)
                .sort((a, b) => a.setNumber - b.setNumber)
                .map((s) => (
                  <SetRow key={`${s.id}-${s.isCompleted}`} set={s} exercise={ex} />
                ))}
              <button onClick={() => void act(() => repository.addSet(ex.id))}>
                <Plus size={16} />
                Set ekle
              </button>
            </>
          )}
        </section>
      ))}
      <section className="card">
        <label>
          Antrenman notu
          <textarea
            defaultValue={session.notes}
            onChange={(e) =>
              void act(async () => {
                await db.workoutSessions.update(session.id, { notes: e.target.value });
              })
            }
          />
        </label>
        <div className="actions">
          <button
            className="primary"
            onClick={() => {
              if (confirm(`${done} tamamlanmış set ile antrenmanı bitir?`))
                void act(async () => {
                  await repository.finishSession(session.id);
                  navigate(`/gecmis?oturum=${session.id}`);
                }, 'Antrenman kaydedildi. Özeti Geçmiş ekranında görebilirsin.');
            }}
          >
            Antrenmanı bitir
          </button>
          <button
            className="danger"
            onClick={() => {
              if (confirm('Antrenman iptal edilsin mi? Kaydedilen setler geçmişte korunur.'))
                void act(
                  () => repository.finishSession(session.id, true),
                  'Antrenman iptal edildi.',
                );
            }}
          >
            İptal et
          </button>
          <Link to="/gecmis">Geçmiş ve özetler</Link>
        </div>
      </section>
    </>
  );
}
