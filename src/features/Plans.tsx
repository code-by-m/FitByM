import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { Plus, Play, Copy, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { db } from '../database/db';
import { repository } from '../database/repository';
import { uid, now, type WorkoutPlan, type PlanExercise } from '../types/models';
import { Modal, Empty } from '../components/Modal';
import { useAction, useNotice } from '../components/Notices';
function PlanEditor({ plan, onClose }: { plan: WorkoutPlan; onClose: () => void }) {
  const exercises = useLiveQuery(() => db.exercises.toArray()) ?? [];
  const [name, setName] = useState(plan.name);
  const [description, setDescription] = useState(plan.description);
  const [active, setActive] = useState(plan.isActive);
  const [items, setItems] = useState<PlanExercise[]>();
  const [selected, setSelected] = useState('');
  const act = useAction();
  const notice = useNotice();
  useLiveQuery(async () => {
    const loaded = await db.workoutPlanExercises
      .where('workoutPlanId')
      .equals(plan.id)
      .sortBy('sortOrder');
    setItems(loaded);
  }, [plan.id]);
  const update = (id: string, patch: Partial<PlanExercise>) =>
    setItems(items?.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  const move = (index: number, direction: number) => {
    if (!items) return;
    const copy = [...items];
    [copy[index], copy[index + direction]] = [copy[index + direction], copy[index]];
    setItems(copy);
  };
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!items) return;
        void act(async () => {
          await repository.savePlan(
            { ...plan, name, description, isActive: active, updatedAt: now() },
            items.map((v, i) => ({ ...v, sortOrder: i })),
          );
          onClose();
        }, 'Program kaydedildi.');
      }}
    >
      <label>
        Program adı
        <input required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label>
        Açıklama
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <label className="checkbox">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Önerilerde göster
      </label>
      {items?.map((item, i) => {
        const ex = exercises.find((e) => e.id === item.exerciseId);
        return (
          <fieldset key={item.id}>
            <legend>
              {i + 1}. {ex?.name ?? 'Egzersiz'}
            </legend>
            <div className="field-grid">
              <label>
                Set
                <input
                  type="number"
                  required
                  min={1}
                  max={50}
                  value={item.targetSets}
                  onChange={(e) => update(item.id, { targetSets: e.target.valueAsNumber })}
                />
              </label>
              <label>
                Tekrar
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={item.targetReps ?? ''}
                  onChange={(e) =>
                    update(item.id, {
                      targetReps: e.target.value ? e.target.valueAsNumber : undefined,
                    })
                  }
                />
              </label>
              <label>
                Süre (sn)
                <input
                  type="number"
                  min={1}
                  max={86400}
                  value={item.targetDurationSeconds ?? ''}
                  onChange={(e) =>
                    update(item.id, {
                      targetDurationSeconds: e.target.value ? e.target.valueAsNumber : undefined,
                    })
                  }
                />
              </label>
              <label>
                Dinlenme (sn)
                <input
                  type="number"
                  required
                  min={0}
                  max={3600}
                  value={item.restSeconds}
                  onChange={(e) => update(item.id, { restSeconds: e.target.valueAsNumber })}
                />
              </label>
            </div>
            <label>
              Not
              <input
                value={item.notes}
                onChange={(e) => update(item.id, { notes: e.target.value })}
              />
            </label>
            <div className="actions">
              <button
                type="button"
                aria-label="Yukarı taşı"
                disabled={i === 0}
                onClick={() => move(i, -1)}
              >
                <ArrowUp size={18} />
              </button>
              <button
                type="button"
                aria-label="Aşağı taşı"
                disabled={i === items.length - 1}
                onClick={() => move(i, 1)}
              >
                <ArrowDown size={18} />
              </button>
              <button type="button" onClick={() => setItems(items.filter((v) => v.id !== item.id))}>
                <Trash2 size={18} />
                Kaldır
              </button>
            </div>
          </fieldset>
        );
      })}
      <label>
        Egzersiz seç
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">Bir egzersiz seç</option>
          {exercises.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={() => {
          const ex = exercises.find((e) => e.id === selected);
          if (!ex || !items) {
            notice('Önce egzersiz seçin.');
            return;
          }
          setItems([
            ...items,
            {
              id: uid(),
              workoutPlanId: plan.id,
              exerciseId: ex.id,
              sortOrder: items.length,
              targetSets: 2,
              targetReps: ex.trackingType.startsWith('Duration') ? undefined : 12,
              targetDurationSeconds: ex.trackingType.startsWith('Duration') ? 20 : undefined,
              restSeconds: 60,
              notes: '',
            },
          ]);
        }}
      >
        Egzersizi ekle
      </button>
      <button className="primary" disabled={!items}>
        Programı kaydet
      </button>
    </form>
  );
}
export default function Plans() {
  const plans = useLiveQuery(() => db.workoutPlans.toArray()) ?? [];
  const items = useLiveQuery(() => db.workoutPlanExercises.toArray()) ?? [];
  const exercises = useLiveQuery(() => db.exercises.toArray()) ?? [];
  const [editing, setEditing] = useState<WorkoutPlan>();
  const act = useAction();
  const navigate = useNavigate();
  return (
    <>
      <div className="heading">
        <div>
          <p className="eyebrow">SANA UYGUN BİR RİTİM</p>
          <h1>Programlarım</h1>
          <p>Günlerini esnek tut. A ve B programlarını sırayla uygula.</p>
        </div>
        <button
          onClick={() =>
            setEditing({
              id: uid(),
              name: '',
              description: '',
              isActive: true,
              createdAt: now(),
              updatedAt: now(),
            })
          }
        >
          <Plus size={18} />
          Program oluştur
        </button>
      </div>
      <div className="two-columns">
        {plans.map((plan, i) => (
          <section className="card" key={plan.id}>
            <div className="plan-preview">
              <span className="plan-letter">{String.fromCharCode(65 + i)}</span>
              <div>
                <h2>{plan.name}</h2>
                <p>{plan.description}</p>
              </div>
            </div>
            <ol className="routine-list">
              {items
                .filter((x) => x.workoutPlanId === plan.id)
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((x) => (
                  <li key={x.id}>
                    <span>
                      {exercises.find((e) => e.id === x.exerciseId)?.name}
                      <small>{x.notes}</small>
                    </span>
                    <strong>
                      {x.targetSets} × {x.targetReps ?? `${x.targetDurationSeconds} sn`}
                    </strong>
                  </li>
                ))}
            </ol>
            <div className="actions">
              <button
                className="primary"
                onClick={() =>
                  void act(async () => {
                    await repository.startSession(plan.id);
                    navigate('/antrenman');
                  })
                }
              >
                <Play size={16} />
                Başla
              </button>
              <button onClick={() => setEditing(plan)}>Düzenle</button>
              <button
                aria-label={`${plan.name} kopyala`}
                onClick={() =>
                  void act(() => repository.duplicatePlan(plan.id), 'Program kopyalandı.')
                }
              >
                <Copy size={18} />
              </button>
              <button
                className="danger"
                aria-label={`${plan.name} sil`}
                onClick={() => {
                  if (confirm('Program silinsin mi? Geçmiş antrenmanlar korunur.'))
                    void act(() => repository.deletePlan(plan.id), 'Program silindi.');
                }}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </section>
        ))}
      </div>
      {!plans.length && <Empty>Henüz programın yok. İlk programını oluştur.</Empty>}
      {editing && (
        <Modal title="Program düzenleyici" onClose={() => setEditing(undefined)}>
          <PlanEditor plan={editing} onClose={() => setEditing(undefined)} />
        </Modal>
      )}
    </>
  );
}
