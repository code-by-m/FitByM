import { beforeEach, afterEach, describe, it, expect } from 'vitest';
import { FitDatabase } from '../src/database/db';
import { FitnessRepository } from '../src/database/repository';
import { exportBackup, importBackup, backupSchema } from '../src/database/backup';
import { uid, now, type Exercise } from '../src/types/models';
let db: FitDatabase;
let repo: FitnessRepository;
beforeEach(async () => {
  db = new FitDatabase(`test-${uid()}`);
  repo = new FitnessRepository(db);
  await db.open();
});
afterEach(async () => {
  await db.delete();
});
const custom = (): Exercise => ({
  id: uid(),
  name: 'Özel hareket',
  description: '',
  instructions: 'Kontrollü uygula',
  primaryMuscleGroup: 'Bacak',
  secondaryMuscleGroups: [],
  equipmentType: 'Ekipmansız',
  difficultyLevel: 'Başlangıç',
  trackingType: 'Repetitions',
  imageUrl: '',
  videoUrl: '',
  isCustom: true,
  createdAt: now(),
  updatedAt: now(),
});
describe('Veritabanı ve kayıt bütünlüğü', () => {
  it('hazır egzersizin medyasını değiştirirken kimliğini ve yönergelerini korur; yedekten geri gelir', async () => {
    const original = (await db.exercises.get('exercise-0'))!;
    const media = {
      imageUrl: 'https://media.example.test/squat.png',
      videoUrl: 'https://media.example.test/squat.mp4',
    };
    await repo.saveExerciseMedia(original.id, media);
    db.close();
    await db.open();
    const updated = (await db.exercises.get(original.id))!;
    expect(updated.instructions).toBe(original.instructions);
    expect(updated.isCustom).toBe(false);
    expect(updated.imageUrl).toBe(media.imageUrl);
    const backup = await exportBackup(db);
    await repo.saveExerciseMedia(original.id, { imageUrl: '', videoUrl: '' });
    await importBackup(backup, db);
    expect((await db.exercises.get(original.id))?.videoUrl).toBe(media.videoUrl);
    await expect(
      repo.saveExerciseMedia(original.id, { ...media, videoUrl: 'javascript:alert(1)' }),
    ).rejects.toThrow();
    expect((await db.exercises.get(original.id))?.videoUrl).toBe(media.videoUrl);
  });
  it('ilk kurulumda egzersiz, A/B program ve tercihleri oluşturur; sahte ölçüm eklemez', async () => {
    expect(await db.exercises.count()).toBe(12);
    expect(await db.workoutPlans.count()).toBe(2);
    expect(await db.bodyMeasurements.count()).toBe(0);
    expect(await db.workoutSessions.count()).toBe(0);
    expect((await db.userGoals.get('default'))?.targetWeightKg).toBe(78);
  });
  it('silinen programı yeniden açılışta oluşturmaz', async () => {
    await repo.deletePlan('plan-A');
    db.close();
    await db.open();
    expect(await db.workoutPlans.get('plan-A')).toBeUndefined();
  });
  it('özel egzersiz oluşturur, düzenler ve siler', async () => {
    const ex = custom();
    await repo.saveExercise(ex);
    await repo.saveExercise({ ...ex, name: 'Yeni ad' });
    expect((await db.exercises.get(ex.id))?.name).toBe('Yeni ad');
    await repo.deleteExercise(ex.id);
    expect(await db.exercises.get(ex.id)).toBeUndefined();
  });
  it('geçersiz egzersizi reddeder', async () => {
    await expect(repo.saveExercise({ ...custom(), name: '' })).rejects.toThrow();
  });
  it('program oluşturur ve günceller; geçersiz ilişkiyi transaction ile reddeder', async () => {
    const time = now();
    const plan = {
      id: uid(),
      name: 'Test',
      description: '',
      isActive: true,
      createdAt: time,
      updatedAt: time,
    };
    const item = {
      id: uid(),
      workoutPlanId: plan.id,
      exerciseId: 'exercise-0',
      sortOrder: 0,
      targetSets: 3,
      targetReps: 10,
      restSeconds: 30,
      notes: '',
    };
    await repo.savePlan(plan, [item]);
    await repo.savePlan({ ...plan, name: 'Yeni program' }, [{ ...item, targetSets: 4 }]);
    expect((await db.workoutPlanExercises.get(item.id))?.targetSets).toBe(4);
    await expect(
      repo.savePlan({ ...plan, name: 'Bozulmamalı' }, [{ ...item, exerciseId: 'yok' }]),
    ).rejects.toThrow();
    expect((await db.workoutPlans.get(plan.id))?.name).toBe('Yeni program');
  });
  it('oturum hedeflerini kopyalar, set tamamlar, yeniden açılışta korur ve geçmişe ekler', async () => {
    const id = await repo.startSession('plan-A');
    expect(await repo.startSession('plan-B')).toBe(id);
    const ex = await db.workoutSessionExercises.where('workoutSessionId').equals(id).first();
    const set = await db.workoutSets.where('workoutSessionExerciseId').equals(ex!.id).first();
    await repo.saveSet({ ...set!, repetitions: 11, isCompleted: true, completedAt: now() });
    await db.workoutPlans.update('plan-A', { name: 'Değişti' });
    db.close();
    await db.open();
    expect((await db.workoutSets.get(set!.id))?.repetitions).toBe(11);
    expect((await db.workoutSessions.get(id))?.workoutNameSnapshot).toBe('FULL BODY A');
    await repo.finishSession(id);
    expect(await db.workoutSessions.where('status').equals('Completed').count()).toBe(1);
    await expect(repo.saveSet({ ...set!, isCompleted: true })).rejects.toThrow();
  });
  it('ölçüm ekler, hedef ve profil günceller', async () => {
    await repo.saveMeasurement({
      id: uid(),
      recordedAt: now(),
      weightKg: 89,
      waistCm: 98,
      notes: '',
    });
    expect(await db.bodyMeasurements.count()).toBe(1);
    const goals = (await db.userGoals.get('default'))!;
    const profile = (await db.profiles.get('default'))!;
    await repo.savePreferences({ ...goals, targetWeightKg: 80 }, { ...profile, heightCm: 173 });
    expect((await db.userGoals.get('default'))?.targetWeightKg).toBe(80);
    await expect(
      repo.saveMeasurement({ id: uid(), recordedAt: now(), weightKg: -1, notes: '' }),
    ).rejects.toThrow();
  });
  it('tüm tabloları yedekler ve transactional geri yükler', async () => {
    await repo.startSession('plan-A');
    const backup = await exportBackup(db);
    await repo.deletePlan('plan-B');
    await importBackup(backup, db);
    expect(await db.workoutPlans.count()).toBe(2);
    expect(await db.workoutSets.count()).toBe(12);
    expect(backup.schemaVersion).toBe(1);
  });
  it('uyumsuz sürüm ve bozuk ilişkileri mevcut kayıtlara dokunmadan reddeder', async () => {
    const backup = await exportBackup(db);
    await expect(importBackup({ ...backup, schemaVersion: 99 }, db)).rejects.toThrow();
    expect(backupSchema.safeParse({ ...backup, exercises: [] }).success).toBe(false);
    expect(await db.exercises.count()).toBe(12);
  });
  it('eşzamanlı ek setler farklı numaralar alır; bitmiş antrenman tekrar değiştirilmez', async () => {
    const session = await repo.startSession('plan-A');
    const exercise = (await db.workoutSessionExercises
      .where('workoutSessionId')
      .equals(session)
      .first())!;
    await Promise.all([
      repo.addSet(exercise.id),
      repo.addSet(exercise.id),
      repo.addSet(exercise.id),
    ]);
    const sets = await db.workoutSets
      .where('workoutSessionExerciseId')
      .equals(exercise.id)
      .toArray();
    expect(sets.map((s) => s.setNumber).sort()).toEqual([1, 2, 3, 4, 5]);
    await repo.finishSession(session);
    const before = await db.workoutSessions.get(session);
    await expect(repo.finishSession(session, true)).rejects.toThrow();
    expect(await db.workoutSessions.get(session)).toEqual(before);
  });
  it('tam kişisel veri akışını yeni bağlantıda ve JSON gidiş dönüşünde eksiksiz korur', async () => {
    const exercise = custom();
    await repo.saveExercise(exercise);
    const plan = {
      id: uid(),
      name: 'Kalıcılık programı',
      description: '',
      isActive: true,
      createdAt: now(),
      updatedAt: now(),
    };
    await repo.savePlan(plan, [
      {
        id: uid(),
        workoutPlanId: plan.id,
        exerciseId: exercise.id,
        sortOrder: 0,
        targetSets: 2,
        targetReps: 10,
        restSeconds: 30,
        notes: '',
      },
    ]);
    const id = await repo.startSession(plan.id);
    const ex = (await db.workoutSessionExercises.where('workoutSessionId').equals(id).first())!;
    const sets = await db.workoutSets.where('workoutSessionExerciseId').equals(ex.id).toArray();
    for (const set of sets)
      await repo.saveSet({ ...set, isCompleted: true, repetitions: 9, completedAt: now() });
    const databaseName = db.name;
    db.close();
    db = new FitDatabase(databaseName);
    repo = new FitnessRepository(db);
    await db.open();
    expect((await db.workoutSessions.get(id))?.status).toBe('InProgress');
    await repo.finishSession(id);
    await repo.saveMeasurement({
      id: uid(),
      recordedAt: now(),
      weightKg: 88.5,
      notes: 'Sentetik test kaydı',
    });
    const original = await exportBackup(db);
    db.close();
    db = new FitDatabase(databaseName);
    repo = new FitnessRepository(db);
    await db.open();
    const reopened = await exportBackup(db);
    expect({ ...reopened, exportedAt: original.exportedAt }).toEqual(original);
    const json: unknown = JSON.parse(JSON.stringify(original));
    expect(backupSchema.safeParse(json).success).toBe(true);
    await importBackup(json, db);
    const restored = await exportBackup(db);
    expect({ ...restored, exportedAt: original.exportedAt }).toEqual(original);
  });
});
