import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import Dexie from 'dexie';
import { FitDatabase } from '../src/database/db';
import { FitnessRepository } from '../src/database/repository';
import { backupSchema, exportBackup, importBackup } from '../src/database/backup';
import { NutritionRepository } from '../src/features/nutrition/repository';
import { nutritionTotals, localDay, shiftDay } from '../src/features/nutrition/lib';
import { nutritionEntrySchema, uid, now, type NutritionEntry } from '../src/types/models';
let db: FitDatabase;
let repo: NutritionRepository;
const entry = (overrides: Partial<NutritionEntry> = {}): NutritionEntry => ({
  id: uid(),
  recordedDate: '2026-11-17',
  meal: 'Öğle',
  foodName: 'Sentetik test öğünü',
  portionDescription: '1 porsiyon',
  servings: 1.5,
  caloriesPerServing: 200,
  proteinGrams: 10,
  carbohydrateGrams: 20,
  fatGrams: 5,
  notes: '',
  createdAt: now(),
  updatedAt: now(),
  ...overrides,
});
beforeEach(async () => {
  db = new FitDatabase(`nutrition-test-${uid()}`);
  repo = new NutritionRepository(db);
  await db.open();
});
afterEach(async () => {
  vi.restoreAllMocks();
  await db.delete();
});
it('porsiyon toplamlarını hesaplar ve bilinmeyen makroları ayrı belirtir', () => {
  const totals = nutritionTotals([
    entry(),
    entry({
      servings: 2,
      caloriesPerServing: 50,
      proteinGrams: undefined,
      carbohydrateGrams: undefined,
      fatGrams: undefined,
    }),
  ]);
  expect(totals.calories).toBe(400);
  expect(totals.protein).toBe(15);
  expect(totals.carbohydrate).toBe(30);
  expect(totals.fat).toBe(7.5);
  expect(totals.knownProtein).toBe(1);
  expect(totals.missingMacros).toBe(1);
});
it('yemek ekler, düzenler, tarihe göre ayırır ve yeni bağlantıda korur', async () => {
  const meal = entry();
  await repo.save(meal);
  await repo.save(entry({ recordedDate: '2026-11-18' }));
  expect(await repo.list('2026-11-17')).toHaveLength(1);
  await repo.save({ ...meal, servings: 2 });
  db.close();
  await db.open();
  expect((await repo.list('2026-11-17'))[0].servings).toBe(2);
  await repo.delete(meal.id);
  expect(await repo.list('2026-11-17')).toHaveLength(0);
});
it('geçersiz tarih, negatif değer, boş ad, NaN ve sıfır porsiyonu reddeder', async () => {
  for (const change of [
    { recordedDate: '2026-02-30' },
    { recordedDate: 'yanlış' },
    { caloriesPerServing: -1 },
    { servings: 0 },
    { servings: 101 },
    { foodName: ' ' },
    { proteinGrams: NaN },
  ])
    expect(nutritionEntrySchema.safeParse(entry(change)).success).toBe(false);
  await expect(repo.save(entry({ caloriesPerServing: -1 }))).rejects.toThrow();
  expect(await db.nutritionEntries.count()).toBe(0);
});
it('yerel takvim gününü UTC dönüşümü yapmadan işler', () => {
  expect(localDay(new Date(2026, 10, 17, 0, 15))).toBe('2026-11-17');
  expect(shiftDay('2026-12-31', 1)).toBe('2027-01-01');
  expect(shiftDay('2026-03-01', -1)).toBe('2026-02-28');
});
it('v2 yemek yedeğini eksiksiz geri yükler; eksik v2 dizisini reddeder', async () => {
  const meal = entry();
  await repo.save(meal);
  const backup = await exportBackup(db);
  expect(backup.schemaVersion).toBe(2);
  expect(backup.nutritionEntries).toHaveLength(1);
  await repo.delete(meal.id);
  await importBackup(JSON.parse(JSON.stringify(backup)), db);
  expect(await repo.list(meal.recordedDate)).toEqual([meal]);
  expect(backupSchema.safeParse({ ...backup, nutritionEntries: undefined }).success).toBe(false);
});
it('v1 yedeğini destekler ve onaylı tam restore sırasında yemek tablosunu boşaltır', async () => {
  await repo.save(entry());
  const backup = await exportBackup(db);
  const legacy = { ...backup, schemaVersion: 1, nutritionEntries: undefined };
  const parsed = backupSchema.parse(legacy);
  expect(parsed.schemaVersion).toBe(2);
  expect(parsed.nutritionEntries).toEqual([]);
  await importBackup(legacy, db);
  expect(await db.nutritionEntries.count()).toBe(0);
  expect(await db.exercises.count()).toBe(12);
});
it('restore yazma hatasında tüm tabloları transaction ile geri alır', async () => {
  await repo.save(entry());
  const before = await exportBackup(db);
  const modified = {
    ...before,
    workoutPlans: before.workoutPlans.map((p) => ({ ...p, name: 'Değişmemeli' })),
  };
  const fail = () => {
    throw new Error('sentetik yazma hatası');
  };
  db.nutritionEntries.hook('creating', fail);
  try {
    await expect(importBackup(modified, db)).rejects.toThrow('sentetik yazma hatası');
  } finally {
    db.nutritionEntries.hook('creating').unsubscribe(fail);
  }
  const after = await exportBackup(db);
  expect({ ...after, exportedAt: before.exportedAt }).toEqual(before);
});
it('gerçek v1 şemasını v2ye yükseltirken antrenman, ölçüm, hedef ve silinen program durumunu korur', async () => {
  const fitness = new FitnessRepository(db);
  await fitness.startSession('plan-A');
  await fitness.deletePlan('plan-B');
  await fitness.saveMeasurement({
    id: uid(),
    recordedAt: now(),
    weightKg: 88.5,
    notes: 'Sentetik v1 kaydı',
  });
  await db.userGoals.update('default', { dailyCalorieTarget: 2100 });
  const before = await exportBackup(db);
  const name = `legacy-v1-${uid()}`;
  const legacy = new Dexie(name);
  legacy.version(1).stores({
    exercises: 'id,name,primaryMuscleGroup,equipmentType',
    workoutPlans: 'id,name',
    workoutPlanExercises: 'id,workoutPlanId,exerciseId',
    workoutSessions: 'id,status,startedAt,workoutPlanId',
    workoutSessionExercises: 'id,workoutSessionId,exerciseId',
    workoutSets: 'id,workoutSessionExerciseId',
    bodyMeasurements: 'id,recordedAt',
    userGoals: 'id',
    profiles: 'id',
  });
  await legacy.open();
  for (const table of legacy.tables)
    await table.bulkAdd(before[table.name as keyof typeof before] as object[]);
  legacy.close();
  const upgraded = new FitDatabase(name);
  try {
    await upgraded.open();
    const after = await exportBackup(upgraded);
    expect({ ...after, exportedAt: before.exportedAt }).toEqual(before);
    expect(upgraded.verno).toBe(2);
    expect(await upgraded.nutritionEntries.count()).toBe(0);
    expect(await upgraded.workoutPlans.get('plan-B')).toBeUndefined();
  } finally {
    await upgraded.delete();
  }
});
