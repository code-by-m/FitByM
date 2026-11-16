import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useForm } from 'react-hook-form';
import { db } from '../database/db';
import { repository } from '../database/repository';
import {
  backupSchema,
  exportBackup,
  importBackup,
  resetData,
  download,
  csv,
  type Backup,
} from '../database/backup';
import { now, type Goals, type Profile } from '../types/models';
import { useAction, useNotice } from '../components/Notices';
import { Modal } from '../components/Modal';
function Preferences({ goals, profile }: { goals: Goals; profile: Profile }) {
  const { register, handleSubmit } = useForm<Goals & Profile>({
    defaultValues: { ...goals, ...profile },
  });
  const act = useAction();
  return (
    <form
      onSubmit={handleSubmit((v) =>
        act(
          () =>
            repository.savePreferences(
              {
                ...goals,
                targetWeightKg: v.targetWeightKg,
                dailyCalorieTarget: v.dailyCalorieTarget,
                dailyProteinTarget: v.dailyProteinTarget,
                dailyCarbohydrateTarget: v.dailyCarbohydrateTarget,
                dailyFatTarget: v.dailyFatTarget,
                dailyStepTarget: v.dailyStepTarget,
                weeklyWorkoutTarget: v.weeklyWorkoutTarget,
                updatedAt: now(),
              },
              {
                ...profile,
                heightCm: v.heightCm,
                startingWeightKg: v.startingWeightKg,
                fitnessLevel: v.fitnessLevel,
                trainingLocation: v.trainingLocation,
                equipment: v.equipment,
                theme: v.theme,
              },
            ),
          'Tercihler kaydedildi.',
        ),
      )}
    >
      <div className="field-grid">
        {[
          ['heightCm', 'Boy (cm)', 300],
          ['startingWeightKg', 'Başlangıç ağırlığı (kg)', 500],
          ['targetWeightKg', 'Hedef ağırlık (kg)', 500],
          ['weeklyWorkoutTarget', 'Haftalık antrenman hedefi', 14],
          ['dailyCalorieTarget', 'Günlük kalori (kcal)', 15000],
          ['dailyProteinTarget', 'Protein (g)', 1000],
          ['dailyCarbohydrateTarget', 'Karbonhidrat (g)', 2000],
          ['dailyFatTarget', 'Yağ (g)', 1000],
          ['dailyStepTarget', 'Adım hedefi (0: kapalı)', 100000],
        ].map(([key, label, max]) => (
          <label key={key}>
            {label}
            <input
              type="number"
              min={key === 'dailyStepTarget' ? 0 : 0.1}
              max={max}
              step={['weeklyWorkoutTarget', 'dailyStepTarget'].includes(String(key)) ? 1 : 0.1}
              required
              {...register(key as keyof (Goals & Profile), { valueAsNumber: true })}
            />
          </label>
        ))}
        <label>
          Seviye
          <select {...register('fitnessLevel')}>
            <option>Başlangıç</option>
            <option>Orta</option>
            <option>İleri</option>
          </select>
        </label>
        <label>
          Antrenman yeri
          <input required {...register('trainingLocation')} />
        </label>
        <label>
          Ekipman
          <input {...register('equipment')} />
        </label>
        <label>
          Tema
          <select {...register('theme')}>
            <option value="system">Sistem</option>
            <option value="light">Açık</option>
            <option value="dark">Koyu</option>
          </select>
        </label>
        <label>
          Birim
          <select disabled value="metric">
            <option value="metric">Metrik (kg / cm)</option>
          </select>
        </label>
      </div>
      <p className="small-note">Bu değerler kişisel tercihlerindir; tıbbi öneri değildir.</p>
      <button className="primary">Tercihleri kaydet</button>
    </form>
  );
}
export default function Settings() {
  const goals = useLiveQuery(() => db.userGoals.get('default'));
  const profile = useLiveQuery(() => db.profiles.get('default'));
  const [backup, setBackup] = useState<Backup>();
  const act = useAction();
  const notice = useNotice();
  return (
    <>
      <p className="eyebrow">SENİN ALANIN, SENİN TERCİHLERİN</p>
      <h1>Ayarlar</h1>
      <section className="card">
        <h2>Profil ve hedefler</h2>
        {goals && profile && (
          <Preferences key={goals.updatedAt + profile.theme} goals={goals} profile={profile} />
        )}
      </section>
      <section className="card">
        <h2>Verilerin sende kalsın</h2>
        <p>
          Tüm kayıtlar bu tarayıcının IndexedDB alanında, bu cihazda saklanır. Başka cihazlarla
          otomatik eşitlenmez. Tarayıcı verileri silindiğinde kayıtların da silinebilir. Düzenli
          yedek al.
        </p>
        <div className="actions">
          <button
            onClick={() =>
              void act(
                async () =>
                  download(
                    JSON.stringify(await exportBackup(), null, 2),
                    `FitByM-yedek-${new Date().toISOString().slice(0, 10)}.json`,
                  ),
                'Yedek dosyası hazırlandı.',
              )
            }
          >
            JSON yedek indir
          </button>
          <label className="button file-input">
            Yedek seç
            <input
              type="file"
              accept=".json,application/json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                if (file.size > 20 * 1024 * 1024) {
                  notice('Yedek en fazla 20 MB olabilir.');
                  return;
                }
                void act(async () => {
                  setBackup(backupSchema.parse(JSON.parse(await file.text())));
                });
              }}
            />
          </label>
          <button
            onClick={() =>
              void act(async () => {
                const records = await db.bodyMeasurements.orderBy('recordedAt').toArray();
                download(
                  csv([
                    [
                      'Tarih',
                      'Ağırlık (kg)',
                      'Bel (cm)',
                      'Göğüs (cm)',
                      'Kalça (cm)',
                      'Kol (cm)',
                      'Not',
                    ],
                    ...records.map((m) => [
                      m.recordedAt,
                      m.weightKg,
                      m.waistCm,
                      m.chestCm,
                      m.hipCm,
                      m.armCm,
                      m.notes,
                    ]),
                  ]),
                  'FitByM-olcumler.csv',
                  'text/csv;charset=utf-8',
                );
              })
            }
          >
            Ölçümler CSV
          </button>
          <button
            onClick={() =>
              void act(async () => {
                const records = await db.workoutSessions.toArray();
                download(
                  csv([
                    ['Program', 'Başlangıç', 'Bitiş', 'Durum', 'Not'],
                    ...records.map((s) => [
                      s.workoutNameSnapshot,
                      s.startedAt,
                      s.completedAt,
                      s.status,
                      s.notes,
                    ]),
                  ]),
                  'FitByM-antrenmanlar.csv',
                  'text/csv;charset=utf-8',
                );
              })
            }
          >
            Geçmiş CSV
          </button>
        </div>
      </section>
      <section className="card">
        <h2>iPhone'a yükle</h2>
        <p>
          Safari'de uygulamayı aç. Paylaş menüsünden “Ana Ekrana Ekle”yi seç. İlk çevrimiçi
          açılıştan sonra uygulama kabuğu çevrimdışı kullanılabilir.
        </p>
        <p>
          Yeni sürüm hazır olduğunda güncelleme bildirimi görünür. Önemli kayıtların için ayrıca
          JSON yedeğini sakla.
        </p>
      </section>
      <section className="card">
        <h2>FitByM by CodeByM</h2>
        <img
          className="about-logo"
          src={`${import.meta.env.BASE_URL}brand/Icon.png`}
          alt="CodeByM resmî simgesi"
        />
        <p>Sürüm 0.1.0 · Kişisel fitness günlüğü</p>
        <a href="https://github.com/code-by-m/brand" target="_blank" rel="noreferrer">
          Resmî CodeByM marka varlıkları
        </a>
      </section>
      <section className="card">
        <h2>Verileri sıfırla</h2>
        <p>
          Egzersizler, programlar, antrenmanlar ve ölçümler silinir. Profil ve hedeflerin korunur.
          İlk programlar otomatik yeniden oluşturulmaz.
        </p>
        <button
          className="danger"
          onClick={() => {
            if (
              confirm(
                'Tüm fitness kayıtları kalıcı olarak silinecek. Yedek aldınız mı? Devam edilsin mi?',
              )
            )
              void act(() => resetData(), 'Kayıtlar sıfırlandı.');
          }}
        >
          Fitness verilerini sil
        </button>
      </section>
      {backup && (
        <Modal title="Yedeği geri yükle" onClose={() => setBackup(undefined)}>
          <p>Yedek tarihi: {new Date(backup.exportedAt).toLocaleString('tr-TR')}</p>
          <p>
            {backup.exercises.length} egzersiz · {backup.workoutPlans.length} program ·{' '}
            {backup.workoutSessions.length} antrenman · {backup.bodyMeasurements.length} ölçüm
          </p>
          <p className="error">
            Bu işlem mevcut tüm verileri yedekteki verilerle değiştirecek. Önce güncel verilerini
            dışa aktar.
          </p>
          <button
            className="danger"
            onClick={() =>
              void act(async () => {
                await importBackup(backup);
                setBackup(undefined);
              }, 'Yedek geri yüklendi.')
            }
          >
            Onaylıyorum, verileri değiştir
          </button>
        </Modal>
      )}
    </>
  );
}
