import type { FitDatabase } from './db';
import { now, type Exercise } from '../types/models';
const definitions = [
  [
    'Bodyweight Squat',
    'Bacak',
    'Ayaklar omuz genişliğinde. Kalçayı geriye göndererek çömelin; dizleri ayak yönünde tutun ve kontrollü kalkın.',
  ],
  [
    'Wall Push-Up',
    'Göğüs',
    'Eller omuz hizasında duvarda. Gövdeyi düz tutarak dirsekleri bükün, duvara yaklaşın ve geri itin.',
  ],
  [
    'Glute Bridge',
    'Kalça',
    'Sırtüstü yatın, dizler bükülü. Kalçayı sıkarak kaldırın; beli aşırı çukurlaştırmadan indirin.',
  ],
  [
    'Bird Dog',
    'Karın',
    'Dört ayak üzerinde karşı kol ve bacağı uzatın. Gövdeyi döndürmeden geri dönün. Her iki tarafı uygulayın.',
  ],
  [
    'Reverse Snow Angel',
    'Sırt',
    'Yüzüstü yatın. Kolları yerden hafif kaldırıp kalçadan baş üzerine kontrollü süpürün; boynu rahat tutun.',
  ],
  [
    'Plank',
    'Karın',
    'Dirsekler omuz altında. Gövdeyi düz tutun, nefes almaya devam edin; belin çökmesine izin vermeyin.',
  ],
  [
    'Reverse Lunge',
    'Bacak',
    'Bir ayağı geriye alın. İki dizi kontrollü bükün, ön ayaktan güç alarak kalkın. Her bacak için tekrarlayın.',
  ],
  [
    'Incline Push-Up',
    'Göğüs',
    'Elleri sağlam, kaymayan yüksek bir yüzeye yerleştirin. Gövde düzken göğsü yüzeye yaklaştırıp itin.',
  ],
  [
    'Bodyweight Good Morning',
    'Arka bacak',
    'Dizleri hafif bükün. Sırtı nötr tutarak kalçadan öne eğilin, kalçayı sıkarak doğrulun.',
  ],
  [
    'Prone W Raise',
    'Sırt',
    'Yüzüstü yatın; kollar W şeklinde. Omuzları kulaklardan uzak tutup elleri ve dirsekleri hafif kaldırın.',
  ],
  [
    'Dead Bug',
    'Karın',
    'Sırtüstü, kollar yukarıda ve dizler bükülü. Karşı kol ve bacağı uzatırken beli sabit tutun. İki tarafı uygulayın.',
  ],
  [
    'Standing Calf Raise',
    'Baldır',
    'Ayakta, gerekirse duvardan denge alın. Topukları kaldırın, kısa duraklayıp kontrollü indirin.',
  ],
];
export async function seed(db: FitDatabase) {
  const time = now();
  const exercises: Exercise[] = definitions.map(([name, muscle, instructions], i) => ({
    id: `exercise-${i}`,
    name,
    description: 'Evde başlangıç egzersizi',
    instructions,
    primaryMuscleGroup: muscle,
    secondaryMuscleGroups: [],
    equipmentType: i === 7 ? 'Sabit yüksek yüzey' : 'Ekipmansız',
    difficultyLevel: 'Başlangıç',
    trackingType: i === 5 ? 'Duration' : 'Repetitions',
    imageUrl: '',
    videoUrl: '',
    isCustom: false,
    createdAt: time,
    updatedAt: time,
  }));
  await db.exercises.bulkAdd(exercises);
  await db.workoutPlans.bulkAdd(
    ['A', 'B'].map((letter) => ({
      id: `plan-${letter}`,
      name: `FULL BODY ${letter}`,
      description: 'Evde • Başlangıç • Tüm vücut',
      isActive: true,
      createdAt: time,
      updatedAt: time,
    })),
  );
  await db.workoutPlanExercises.bulkAdd(
    exercises.map((ex, i) => ({
      id: `item-${i}`,
      workoutPlanId: i < 6 ? 'plan-A' : 'plan-B',
      exerciseId: ex.id,
      sortOrder: i % 6,
      targetSets: 2,
      targetReps: i === 5 ? undefined : [12, 12, 15, 8, 10, 0, 8, 10, 12, 12, 8, 15][i],
      targetDurationSeconds: i === 5 ? 20 : undefined,
      restSeconds: 60,
      notes: [3, 10].includes(i) ? 'Her taraf için' : i === 6 ? 'Her bacak için' : '',
    })),
  );
  await db.userGoals.add({
    id: 'default',
    targetWeightKg: 78,
    dailyCalorieTarget: 2300,
    dailyProteinTarget: 155,
    dailyCarbohydrateTarget: 247,
    dailyFatTarget: 77,
    dailyStepTarget: 0,
    weeklyWorkoutTarget: 3,
    updatedAt: time,
  });
  await db.profiles.add({
    id: 'default',
    heightCm: 172,
    startingWeightKg: 90,
    fitnessLevel: 'Başlangıç',
    trainingLocation: 'Ev',
    equipment: 'Yok',
    theme: 'system',
    units: 'metric',
  });
}
