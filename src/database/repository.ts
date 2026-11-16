import { db, type FitDatabase } from './db';
import {
  exerciseSchema,
  planSchema,
  planExerciseSchema,
  measurementSchema,
  goalsSchema,
  profileSchema,
  setSchema,
  uid,
  now,
  type Exercise,
  type WorkoutPlan,
  type PlanExercise,
  type WorkoutSet,
  type Measurement,
  type Goals,
  type Profile,
} from '../types/models';
import { exerciseMediaSchema } from '../lib/media';
export class FitnessRepository {
  constructor(readonly database: FitDatabase = db) {}
  async saveExerciseMedia(id: string, input: { imageUrl: string; videoUrl: string }) {
    const media = exerciseMediaSchema.parse(input);
    await this.database.transaction('rw', this.database.exercises, async () => {
      if (!(await this.database.exercises.get(id))) throw Error('Egzersiz bulunamadı.');
      await this.database.exercises.update(id, { ...media, updatedAt: now() });
    });
  }
  async saveExercise(value: Exercise) {
    const item = exerciseSchema.parse(value);
    const existing = await this.database.exercises.get(item.id);
    if (existing && !existing.isCustom) throw Error('Hazır egzersiz değiştirilemez.');
    await this.database.exercises.put(item);
  }
  async deleteExercise(id: string) {
    await this.database.transaction(
      'rw',
      [this.database.exercises, this.database.workoutPlanExercises],
      async () => {
        const ex = await this.database.exercises.get(id);
        if (!ex?.isCustom) throw Error('Yalnızca özel egzersizler silinebilir.');
        if (await this.database.workoutPlanExercises.where('exerciseId').equals(id).count())
          throw Error('Önce egzersizi programlardan kaldırın.');
        await this.database.exercises.delete(id);
      },
    );
  }
  async savePlan(plan: WorkoutPlan, items: PlanExercise[]) {
    planSchema.parse(plan);
    items.forEach((v) => {
      planExerciseSchema.parse(v);
      if (v.workoutPlanId !== plan.id) throw Error('Program ilişkisi geçersiz.');
      if (!v.targetReps && !v.targetDurationSeconds) throw Error('Tekrar veya süre girin.');
    });
    await this.database.transaction(
      'rw',
      [this.database.workoutPlans, this.database.workoutPlanExercises, this.database.exercises],
      async () => {
        for (const item of items) {
          const exercise = await this.database.exercises.get(item.exerciseId);
          if (!exercise) throw Error('Egzersiz bulunamadı.');
          const validTarget = exercise.trackingType.startsWith('Duration')
            ? item.targetDurationSeconds
            : item.targetReps;
          if (!validTarget)
            throw Error(`${exercise.name}: takip türüne uygun tekrar veya süre girin.`);
        }
        await this.database.workoutPlans.put(plan);
        await this.database.workoutPlanExercises.where('workoutPlanId').equals(plan.id).delete();
        await this.database.workoutPlanExercises.bulkAdd(items);
      },
    );
  }
  async deletePlan(id: string) {
    await this.database.transaction(
      'rw',
      [this.database.workoutPlans, this.database.workoutPlanExercises],
      async () => {
        await this.database.workoutPlans.delete(id);
        await this.database.workoutPlanExercises.where('workoutPlanId').equals(id).delete();
      },
    );
  }
  async duplicatePlan(id: string) {
    const p = await this.database.workoutPlans.get(id);
    if (!p) throw Error('Program bulunamadı.');
    const newId = uid();
    await this.savePlan(
      { ...p, id: newId, name: `${p.name} (Kopya)`, createdAt: now(), updatedAt: now() },
      (await this.database.workoutPlanExercises.where('workoutPlanId').equals(id).toArray()).map(
        (x) => ({ ...x, id: uid(), workoutPlanId: newId }),
      ),
    );
  }
  async startSession(planId: string) {
    return this.database.transaction(
      'rw',
      [
        this.database.workoutPlans,
        this.database.workoutPlanExercises,
        this.database.exercises,
        this.database.workoutSessions,
        this.database.workoutSessionExercises,
        this.database.workoutSets,
      ],
      async () => {
        const active = await this.database.workoutSessions
          .where('status')
          .equals('InProgress')
          .first();
        if (active) return active.id;
        const plan = await this.database.workoutPlans.get(planId);
        if (!plan) throw Error('Program bulunamadı.');
        const items = await this.database.workoutPlanExercises
          .where('workoutPlanId')
          .equals(planId)
          .sortBy('sortOrder');
        if (!items.length) throw Error('Programa en az bir egzersiz ekleyin.');
        const id = uid();
        await this.database.workoutSessions.add({
          id,
          workoutPlanId: planId,
          workoutNameSnapshot: plan.name,
          startedAt: now(),
          status: 'InProgress',
          notes: '',
        });
        for (const item of items) {
          const ex = await this.database.exercises.get(item.exerciseId);
          if (!ex) throw Error('Egzersiz bulunamadı.');
          const eid = uid();
          await this.database.workoutSessionExercises.add({
            id: eid,
            workoutSessionId: id,
            exerciseId: ex.id,
            sortOrder: item.sortOrder,
            exerciseNameSnapshot: ex.name,
            trackingTypeSnapshot: ex.trackingType,
            targetSetsSnapshot: item.targetSets,
            targetRepsSnapshot: item.targetReps,
            targetDurationSnapshot: item.targetDurationSeconds,
            restSecondsSnapshot: item.restSeconds,
            skipped: false,
          });
          await this.database.workoutSets.bulkAdd(
            Array.from({ length: item.targetSets }, (_, i) => ({
              id: uid(),
              workoutSessionExerciseId: eid,
              setNumber: i + 1,
              repetitions: item.targetReps,
              durationSeconds: item.targetDurationSeconds,
              isCompleted: false,
            })),
          );
        }
        return id;
      },
    );
  }
  async saveSet(value: WorkoutSet) {
    const item = setSchema.parse(value);
    await this.database.transaction(
      'rw',
      [
        this.database.workoutSets,
        this.database.workoutSessionExercises,
        this.database.workoutSessions,
      ],
      async () => {
        const ex = await this.database.workoutSessionExercises.get(item.workoutSessionExerciseId);
        const session = ex && (await this.database.workoutSessions.get(ex.workoutSessionId));
        if (!ex || session?.status !== 'InProgress') throw Error('Antrenman aktif değil.');
        if (item.isCompleted) {
          const duration = ex.trackingTypeSnapshot.startsWith('Duration');
          if (!(duration ? item.durationSeconds : item.repetitions))
            throw Error('Tamamlamak için tekrar veya süre girin.');
        }
        const existing = await this.database.workoutSets.get(item.id);
        if (existing && existing.workoutSessionExerciseId !== item.workoutSessionExerciseId)
          throw Error('Set başka bir egzersize taşınamaz.');
        const siblings = await this.database.workoutSets
          .where('workoutSessionExerciseId')
          .equals(ex.id)
          .toArray();
        if (!existing && siblings.some((s) => s.id !== item.id && s.setNumber === item.setNumber))
          throw Error('Bu set numarası zaten kullanılıyor.');
        await this.database.workoutSets.put({
          ...item,
          completedAt: item.isCompleted ? (item.completedAt ?? now()) : undefined,
        });
        if (item.isCompleted)
          await this.database.workoutSessions.update(session.id, {
            restEndsAt: Date.now() + ex.restSecondsSnapshot * 1000,
          });
      },
    );
  }
  async addSet(exerciseId: string) {
    return this.database.transaction(
      'rw',
      [
        this.database.workoutSets,
        this.database.workoutSessionExercises,
        this.database.workoutSessions,
      ],
      async () => {
        const ex = await this.database.workoutSessionExercises.get(exerciseId);
        if (!ex) throw Error('Egzersiz bulunamadı.');
        const sets = await this.database.workoutSets
          .where('workoutSessionExerciseId')
          .equals(ex.id)
          .toArray();
        await this.saveSet({
          id: uid(),
          workoutSessionExerciseId: ex.id,
          setNumber: Math.max(0, ...sets.map((s) => s.setNumber)) + 1,
          repetitions: ex.targetRepsSnapshot,
          durationSeconds: ex.targetDurationSnapshot,
          isCompleted: false,
        });
      },
    );
  }
  async finishSession(id: string, cancel = false) {
    await this.database.transaction('rw', this.database.workoutSessions, async () => {
      const session = await this.database.workoutSessions.get(id);
      if (session?.status !== 'InProgress') throw Error('Antrenman aktif değil.');
      await this.database.workoutSessions.update(id, {
        status: cancel ? 'Cancelled' : 'Completed',
        completedAt: now(),
        restEndsAt: undefined,
      });
    });
  }
  async saveMeasurement(value: Measurement) {
    await this.database.bodyMeasurements.put(measurementSchema.parse(value));
  }
  async savePreferences(goals: Goals, profile: Profile) {
    goalsSchema.parse(goals);
    profileSchema.parse(profile);
    await this.database.transaction(
      'rw',
      [this.database.userGoals, this.database.profiles],
      async () => {
        await this.database.userGoals.put(goals);
        await this.database.profiles.put(profile);
      },
    );
  }
}
export const repository = new FitnessRepository();
