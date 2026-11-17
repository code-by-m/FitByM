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
import { ExercisePreview } from '../components/ExercisePreview';
import { getExercisePreview } from '../lib/exercise-previews';
export function clock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)
    .toString()
    .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}
function SetRow({
  set,
  exercise,
  onCompleted,
}: {
  set: WorkoutSet;
  exercise: SessionExercise;
  onCompleted: () => Promise<void>;
}) {
  const [value, setValue] = useState(set);
  const act = useAction();
  const save = (next: WorkoutSet) => {
    setValue(next);
    void act(async () => {
      await repository.saveSet(next);
      if (next.isCompleted) await onCompleted();
    });
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
  const [selectedId, setSelectedId] = useState<string>();
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
  const focused = exercises.find((ex) => ex.id === selectedId) ?? current ?? exercises.at(-1);
  const focusedIndex = exercises.findIndex((ex) => ex.id === focused?.id);
  const visibleExercises = focused ? [{ exercise: focused, index: focusedIndex }] : [];
  const completedExercises = exercises.filter(
    (ex) =>
      !ex.skipped &&
      sets.some((s) => s.workoutSessionExerciseId === ex.id) &&
      sets.filter((s) => s.workoutSessionExerciseId === ex.id).every((s) => s.isCompleted),
  );
  const selectExercise = (id: string) => {
    setSelectedId(id);
    requestAnimationFrame(() => document.getElementById('active-exercise')?.focus());
  };
  const advanceIfFinished = async (id: string) => {
    // Read committed records, including rapid consecutive set completions.
    const latestExercises = await db.workoutSessionExercises
      .where('workoutSessionId')
      .equals(session.id)
      .sortBy('sortOrder');
    const latestSets = await db.workoutSets
      .where('workoutSessionExerciseId')
      .anyOf(latestExercises.map((ex) => ex.id))
      .toArray();
    const finished = latestExercises.find((ex) => ex.id === id);
    if (
      !finished ||
      (!finished.skipped &&
        latestSets.some((s) => s.workoutSessionExerciseId === id && !s.isCompleted))
    )
      return;
    const pending = latestExercises.filter(
      (ex) =>
        !ex.skipped &&
        latestSets.some((s) => s.workoutSessionExerciseId === ex.id && !s.isCompleted),
    );
    const next = pending.find((ex) => ex.sortOrder > finished.sortOrder) ?? pending[0];
    setSelectedId((previous) => (previous && previous !== id ? previous : (next?.id ?? id)));
  };
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
      <nav className="workout-sequence" aria-label="Antrenman hareketleri">
        <ol className="workout-steps">
          {exercises.map((ex, i) => (
            <li key={ex.id}>
              <button
                aria-current={focused?.id === ex.id ? 'step' : undefined}
                onClick={() => selectExercise(ex.id)}
              >
                <span className="step-number">{i + 1}</span>
                <span>
                  {ex.exerciseNameSnapshot}
                  <small>
                    {ex.skipped
                      ? 'Atlandı'
                      : completedExercises.some((item) => item.id === ex.id)
                        ? 'Tamamlandı'
                        : focused?.id === ex.id
                          ? 'Seçili hareket'
                          : 'Bekliyor'}
                  </small>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
      {!current && done > 0 && (
        <p className="workout-complete" role="status">
          Kalan hareket yok. Setlerini kontrol edip antrenmanı bitirebilirsin.
        </p>
      )}
      {visibleExercises.map(({ exercise: ex, index: i }) => (
        <section
          className={`card workout-exercise ${current?.id === ex.id ? 'current-exercise' : ''} ${ex.skipped ? 'skipped' : ''}`}
          key={ex.id}
          id="active-exercise"
          tabIndex={-1}
          aria-label={`${i + 1}. hareket: ${ex.exerciseNameSnapshot}`}
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
                  if (!ex.skipped) await advanceIfFinished(ex.id);
                })
              }
            >
              {ex.skipped ? 'Geri ekle' : 'Atla'}
            </button>
          </div>
          <div
            className={`workout-exercise-body ${getExercisePreview(ex.exerciseId, ex.exerciseNameSnapshot) ? 'has-preview' : ''}`}
          >
            {getExercisePreview(ex.exerciseId, ex.exerciseNameSnapshot) && (
              <div className="workout-guide" aria-label="Hareket önizlemesi">
                <ExercisePreview
                  exerciseId={ex.exerciseId}
                  name={ex.exerciseNameSnapshot}
                  controls
                />
              </div>
            )}
            {!ex.skipped ? (
              <div className="workout-set-panel">
                {sets
                  .filter((s) => s.workoutSessionExerciseId === ex.id)
                  .sort((a, b) => a.setNumber - b.setNumber)
                  .map((s) => (
                    <SetRow
                      key={`${s.id}-${s.isCompleted}`}
                      set={s}
                      exercise={ex}
                      onCompleted={() => advanceIfFinished(ex.id)}
                    />
                  ))}
                <button onClick={() => void act(() => repository.addSet(ex.id))}>
                  <Plus size={16} />
                  Set ekle
                </button>
              </div>
            ) : (
              <p className="muted">Bu hareket atlandı. İstersen geri ekleyebilirsin.</p>
            )}
          </div>
          <div className="workout-step-actions">
            <button disabled={i === 0} onClick={() => selectExercise(exercises[i - 1].id)}>
              ← Önceki hareket
            </button>
            <span>
              {i + 1} / {exercises.length}
            </span>
            <button
              disabled={i === exercises.length - 1}
              onClick={() => selectExercise(exercises[i + 1].id)}
            >
              Sonraki hareket →
            </button>
          </div>
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
