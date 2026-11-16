import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search } from 'lucide-react';
import { db } from '../database/db';
import { repository } from '../database/repository';
import { exerciseSchema, uid, now, type Exercise } from '../types/models';
import { Modal, Empty } from '../components/Modal';
import { useAction } from '../components/Notices';
function ExerciseForm({ value, onClose }: { value?: Exercise; onClose: () => void }) {
  const act = useAction();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Exercise>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: value ?? {
      id: uid(),
      name: '',
      description: '',
      instructions: '',
      primaryMuscleGroup: 'Tüm vücut',
      secondaryMuscleGroups: [],
      equipmentType: 'Ekipmansız',
      difficultyLevel: 'Başlangıç',
      trackingType: 'Repetitions',
      imageUrl: '',
      videoUrl: '',
      isCustom: true,
      createdAt: now(),
      updatedAt: now(),
    },
  });
  return (
    <form
      onSubmit={handleSubmit((v) =>
        act(async () => {
          await repository.saveExercise({ ...v, updatedAt: now() });
          onClose();
        }, 'Egzersiz kaydedildi.'),
      )}
    >
      <label>
        Egzersiz adı
        <input {...register('name')} />
      </label>
      <label>
        Açıklama
        <input {...register('description')} />
      </label>
      <label>
        Uygulama adımları
        <textarea {...register('instructions')} />
      </label>
      <label>
        Kas grubu
        <input {...register('primaryMuscleGroup')} />
      </label>
      <label>
        Ekipman
        <input {...register('equipmentType')} />
      </label>
      <label>
        Seviye
        <select {...register('difficultyLevel')}>
          <option>Başlangıç</option>
          <option>Orta</option>
          <option>İleri</option>
        </select>
      </label>
      <label>
        Takip türü
        <select {...register('trackingType')}>
          <option value="Repetitions">Tekrar</option>
          <option value="Duration">Süre</option>
          <option value="RepetitionsAndWeight">Tekrar ve ağırlık</option>
          <option value="DurationAndWeight">Süre ve ağırlık</option>
        </select>
      </label>
      {Object.values(errors).map((e, i) => (
        <p className="error" key={i}>
          {e.message}
        </p>
      ))}
      <button className="primary" disabled={isSubmitting}>
        Kaydet
      </button>
    </form>
  );
}
export default function Exercises() {
  const exercises = useLiveQuery(() => db.exercises.toArray()) ?? [];
  const [search, setSearch] = useState('');
  const [muscle, setMuscle] = useState('');
  const [equipment, setEquipment] = useState('');
  const [level, setLevel] = useState('');
  const [editor, setEditor] = useState<Exercise | true>();
  const [detail, setDetail] = useState<Exercise>();
  const act = useAction();
  const filtered = exercises.filter(
    (e) =>
      e.name.toLocaleLowerCase('tr').includes(search.toLocaleLowerCase('tr')) &&
      (!muscle || e.primaryMuscleGroup === muscle) &&
      (!equipment || e.equipmentType === equipment) &&
      (!level || e.difficultyLevel === level),
  );
  return (
    <>
      <div className="heading">
        <div>
          <p className="eyebrow">HAREKET REHBERİN</p>
          <h1>Egzersiz kütüphanesi</h1>
          <p>Doğru hareketi bul, programına ekle.</p>
        </div>
        <button onClick={() => setEditor(true)}>
          <Plus size={18} />
          Egzersiz oluştur
        </button>
      </div>
      <div className="filters">
        <label>
          <span>
            <Search size={16} /> Egzersiz ara
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Örn. squat"
          />
        </label>
        {[
          [
            'Kas grubu',
            muscle,
            setMuscle,
            Array.from(new Set(exercises.map((e) => e.primaryMuscleGroup))),
          ],
          [
            'Ekipman',
            equipment,
            setEquipment,
            Array.from(new Set(exercises.map((e) => e.equipmentType))),
          ],
          ['Seviye', level, setLevel, ['Başlangıç', 'Orta', 'İleri']],
        ].map(([label, value, set, options]) => (
          <label key={String(label)}>
            {String(label)}
            <select
              value={value as string}
              onChange={(e) => (set as (s: string) => void)(e.target.value)}
            >
              <option value="">Tümü</option>
              {(options as string[]).map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <div className="exercise-grid">
        {filtered.map((e) => (
          <button className="card exercise-card" key={e.id} onClick={() => setDetail(e)}>
            <span className="badge">{e.primaryMuscleGroup}</span>
            <h2>{e.name}</h2>
            <p>
              {e.equipmentType} · {e.difficultyLevel}
            </p>
            <span className="text-link">Hareketi incele →</span>
          </button>
        ))}
      </div>
      {!filtered.length && <Empty>Bu filtrelerle eşleşen egzersiz yok.</Empty>}
      {editor && (
        <Modal
          title={editor === true ? 'Egzersiz oluştur' : 'Egzersizi düzenle'}
          onClose={() => setEditor(undefined)}
        >
          <ExerciseForm
            value={editor === true ? undefined : editor}
            onClose={() => setEditor(undefined)}
          />
        </Modal>
      )}
      {detail && (
        <Modal title={detail.name} onClose={() => setDetail(undefined)}>
          <p>{detail.description}</p>
          <p>{detail.instructions}</p>
          <p className="muted">
            {detail.primaryMuscleGroup} · {detail.equipmentType}
          </p>
          {detail.isCustom && (
            <div className="actions">
              <button
                onClick={() => {
                  setEditor(detail);
                  setDetail(undefined);
                }}
              >
                Düzenle
              </button>
              <button
                className="danger"
                onClick={() => {
                  if (confirm('Bu özel egzersiz silinsin mi?'))
                    void act(async () => {
                      await repository.deleteExercise(detail.id);
                      setDetail(undefined);
                    }, 'Egzersiz silindi.');
                }}
              >
                Sil
              </button>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
