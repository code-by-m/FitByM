import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { db } from '../../database/db';
import { Modal } from '../../components/Modal';
import { useAction } from '../../components/Notices';
import { now, uid, nutritionEntrySchema, type NutritionEntry } from '../../types/models';
import { localDay, shiftDay, meals, numberText, nutritionTotals } from './lib';
import { nutritionRepository } from './repository';

function FoodForm({
  entry,
  onSaved,
}: {
  entry: NutritionEntry;
  onSaved: (entry: NutritionEntry) => void;
}) {
  const act = useAction();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NutritionEntry>({
    resolver: zodResolver(nutritionEntrySchema),
    defaultValues: entry,
  });
  return (
    <form
      onSubmit={handleSubmit((value) =>
        act(async () => {
          const saved = { ...value, updatedAt: now() };
          await nutritionRepository.save(saved);
          onSaved(saved);
        }, 'Yemek kaydı kaydedildi.'),
      )}
    >
      <label>
        Yemek adı
        <input required maxLength={120} {...register('foodName')} />
      </label>
      <div className="field-grid">
        <label>
          Kayıt tarihi
          <input type="date" required {...register('recordedDate')} />
        </label>
        <label>
          Öğün
          <select {...register('meal')}>
            {meals.map((meal) => (
              <option key={meal}>{meal}</option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Porsiyon açıklaması
        <input
          maxLength={120}
          placeholder="Örn. 1 kase veya 100 g"
          {...register('portionDescription')}
        />
      </label>
      <label>
        Porsiyon adedi
        <input
          type="number"
          required
          min="0.01"
          max="100"
          step="any"
          {...register('servings', { valueAsNumber: true })}
        />
      </label>
      <fieldset>
        <legend>Bir porsiyonun besin değerleri</legend>
        <label>
          Kalori (kcal)
          <input
            type="number"
            required
            min="0"
            max="20000"
            step="any"
            {...register('caloriesPerServing', { valueAsNumber: true })}
          />
        </label>
        <div className="field-grid">
          {(
            [
              ['proteinGrams', 'Protein (g)'],
              ['carbohydrateGrams', 'Karbonhidrat (g)'],
              ['fatGrams', 'Yağ (g)'],
            ] as const
          ).map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                type="number"
                min="0"
                max={key === 'carbohydrateGrams' ? 5000 : 2000}
                step="any"
                placeholder="İsteğe bağlı"
                {...register(key, {
                  setValueAs: (value) => (value === '' ? undefined : Number(value)),
                })}
              />
            </label>
          ))}
        </div>
        <p className="small-note">
          Değerleri ambalajdan veya bildiğin porsiyon bilgisinden gir. Bilmediğin makroları boş
          bırak. Toplamlar porsiyon adediyle çarpılır.
        </p>
      </fieldset>
      <label>
        Not
        <textarea maxLength={4000} {...register('notes')} />
      </label>
      {Object.entries(errors).map(([key, error]) => (
        <p key={key} className="error" role="alert">
          {error.message}
        </p>
      ))}
      <button className="primary" disabled={isSubmitting}>
        Yemeği kaydet
      </button>
    </form>
  );
}

export default function Nutrition() {
  const [day, setDay] = useState(localDay);
  const [editing, setEditing] = useState<NutritionEntry>();
  const act = useAction();
  const data = useLiveQuery(
    async () => ({
      entries: await nutritionRepository.list(day),
      goals: await db.userGoals.get('default'),
    }),
    [day],
  );
  const add = (meal: NutritionEntry['meal'] = 'Kahvaltı') =>
    setEditing({
      id: uid(),
      recordedDate: day,
      meal,
      foodName: '',
      portionDescription: '',
      servings: 1,
      caloriesPerServing: 0,
      notes: '',
      createdAt: now(),
      updatedAt: now(),
    });
  if (!data) return <p role="status">Beslenme kayıtların yükleniyor…</p>;
  const totals = nutritionTotals(data.entries);
  const target = data.goals?.dailyCalorieTarget ?? 2300;
  const difference = target - totals.calories;
  return (
    <>
      <div className="heading">
        <div>
          <p className="eyebrow">GÜNLÜK BESLENME GÜNLÜĞÜN</p>
          <h1>Beslenme</h1>
          <p>Öğünlerini kaydet, kalori ve makrolarını takip et.</p>
        </div>
        <button onClick={() => add()}>
          <Plus size={18} />
          Yemek ekle
        </button>
      </div>
      <div className="nutrition-date-nav">
        <button aria-label="Önceki gün" onClick={() => setDay(shiftDay(day, -1))}>
          ←
        </button>
        <label>
          Gün
          <input
            type="date"
            value={day}
            onChange={(event) => {
              if (event.target.value) setDay(event.target.value);
            }}
          />
        </label>
        <button aria-label="Sonraki gün" onClick={() => setDay(shiftDay(day, 1))}>
          →
        </button>
        <button onClick={() => setDay(localDay())}>Bugün</button>
      </div>
      <section className="card nutrition-daily" aria-label="Günlük kalori özeti">
        <div className="section-title">
          <h2>Günlük kalori</h2>
          <Link to="/ayarlar">Hedefleri düzenle →</Link>
        </div>
        <div className="nutrition-kcal">
          <strong>
            {numberText(totals.calories)} <small>kcal kaydedildi</small>
          </strong>
          <span>Hedef: {numberText(target)} kcal</span>
        </div>
        <progress
          className="nutrition-progress"
          aria-label="Günlük kalori hedefi"
          max={target}
          value={Math.min(totals.calories, target)}
        />
        <p className="nutrition-remaining" role="status">
          {difference >= 0
            ? `Hedefe ${numberText(difference)} kcal kaldı`
            : `Günlük hedefin ${numberText(-difference)} kcal üstündesin`}
        </p>
        <div className="nutrition-macros">
          {[
            ['Protein', totals.protein, totals.knownProtein, data.goals?.dailyProteinTarget ?? 155],
            [
              'Karbonhidrat',
              totals.carbohydrate,
              totals.knownCarbohydrate,
              data.goals?.dailyCarbohydrateTarget ?? 247,
            ],
            ['Yağ', totals.fat, totals.knownFat, data.goals?.dailyFatTarget ?? 77],
          ].map(([label, value, known, goal]) => (
            <div key={label}>
              <span>Kaydedilen {String(label).toLocaleLowerCase('tr')}</span>
              <strong>
                {Number(known) ? `${numberText(Number(value))} g` : '—'}
                <small> / {numberText(Number(goal))} g</small>
              </strong>
            </div>
          ))}
        </div>
        {totals.missingMacros > 0 && (
          <p className="small-note">
            {totals.missingMacros} kayıtta makro bilgisi eksik; toplamlar yalnızca girilen değerleri
            içerir.
          </p>
        )}
        <p className="small-note">
          Karşılaştırma güncel günlük hedeflerine göre yapılır. Hedeflerini Ayarlar'dan
          değiştirebilirsin.
        </p>
      </section>
      {!data.entries.length && (
        <p className="empty nutrition-empty">Bu gün için henüz yemek kaydı yok.</p>
      )}
      <div className="two-columns nutrition-meals">
        {meals.map((meal) => {
          const entries = data.entries.filter((entry) => entry.meal === meal);
          return (
            <section className="card" key={meal}>
              <div className="section-title">
                <h2>{meal}</h2>
                <button onClick={() => add(meal)} aria-label={`${meal} için yemek ekle`}>
                  <Plus size={16} />
                  Ekle
                </button>
              </div>
              {entries.length ? (
                entries.map((entry) => (
                  <article className="nutrition-entry" key={entry.id}>
                    <div className="row">
                      <h3>{entry.foodName}</h3>
                      <strong>{numberText(entry.caloriesPerServing * entry.servings)} kcal</strong>
                    </div>
                    <p className="muted">
                      {numberText(entry.servings)} porsiyon
                      {entry.portionDescription ? ` · ${entry.portionDescription}` : ''}
                    </p>
                    {entry.notes && <p className="small-note">{entry.notes}</p>}
                    <div className="actions">
                      <button
                        onClick={() => setEditing(entry)}
                        aria-label={`${entry.foodName} düzenle`}
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() =>
                          setEditing({
                            ...entry,
                            id: uid(),
                            recordedDate: day,
                            createdAt: now(),
                            updatedAt: now(),
                          })
                        }
                        aria-label={`${entry.foodName} kopyala`}
                      >
                        Kopyala
                      </button>
                      <button
                        className="danger"
                        aria-label={`${entry.foodName} sil`}
                        onClick={() => {
                          if (confirm(`${entry.foodName} kaydı silinsin mi?`))
                            void act(
                              () => nutritionRepository.delete(entry.id),
                              'Yemek kaydı silindi.',
                            );
                        }}
                      >
                        Sil
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <p className="muted">Bu öğünde kayıt yok.</p>
              )}
            </section>
          );
        })}
      </div>
      {editing && (
        <Modal title="Yemek kaydı" onClose={() => setEditing(undefined)}>
          <FoodForm
            key={editing.id}
            entry={editing}
            onSaved={(saved) => {
              setDay(saved.recordedDate);
              setEditing(undefined);
            }}
          />
        </Modal>
      )}
    </>
  );
}
