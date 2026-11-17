import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../database/db';
import { numberText, nutritionTotals } from './lib';
import { useToday } from './useToday';
import { nutritionRepository } from './repository';

export default function NutritionOverview() {
  const day = useToday();
  const data = useLiveQuery(
    async () => ({
      entries: await nutritionRepository.list(day),
      goals: await db.userGoals.get('default'),
    }),
    [day],
  );
  if (!data)
    return (
      <section className="card" aria-label="Beslenme özeti">
        <p role="status">Beslenme kayıtların yükleniyor…</p>
      </section>
    );
  const total = nutritionTotals(data.entries);
  const target = data.goals?.dailyCalorieTarget ?? 2300;
  return (
    <section className="card nutrition-overview">
      <div className="section-title">
        <h2>Bugünkü beslenmen</h2>
        <Link to="/beslenme">Yemek ekle →</Link>
      </div>
      <div className="row">
        <strong>
          {numberText(total.calories)} <small>kcal kaydedildi</small>
        </strong>
        <span className="muted">Hedef: {numberText(target)} kcal</span>
      </div>
      <progress
        className="nutrition-progress"
        aria-label="Bugünkü kalori hedefi"
        max={target}
        value={Math.min(total.calories, target)}
      />
      <p className="muted">
        {data.entries.length
          ? `${data.entries.length} yemek kaydı · ${total.calories > target ? `${numberText(total.calories - target)} kcal hedef üstünde` : `Hedefe ${numberText(target - total.calories)} kcal kaldı`}`
          : 'Henüz yemek kaydı yok. İlk öğününü ekleyebilirsin.'}
      </p>
    </section>
  );
}
