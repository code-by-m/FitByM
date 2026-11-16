import { z } from 'zod';
z.config(z.locales.tr());
const id = z.string().min(1).max(100);
const text = z.string().max(4000);
const positive = z.number().finite().positive();
const date = z.string().datetime();
export const exerciseSchema = z.object({
  id,
  name: z.string().trim().min(1).max(100),
  description: text,
  instructions: text,
  primaryMuscleGroup: z.string().min(1),
  secondaryMuscleGroups: z.array(text),
  equipmentType: z.string().min(1),
  difficultyLevel: z.enum(['Başlangıç', 'Orta', 'İleri']),
  trackingType: z.enum(['Repetitions', 'Duration', 'RepetitionsAndWeight', 'DurationAndWeight']),
  imageUrl: z.string(),
  videoUrl: z.string(),
  isCustom: z.boolean(),
  createdAt: date,
  updatedAt: date,
});
export const planSchema = z.object({
  id,
  name: z.string().trim().min(1).max(100),
  description: text,
  isActive: z.boolean(),
  createdAt: date,
  updatedAt: date,
});
export const planExerciseSchema = z.object({
  id,
  workoutPlanId: id,
  exerciseId: id,
  sortOrder: z.number().int().nonnegative(),
  targetSets: positive.int().max(50),
  targetReps: positive.int().max(1000).optional(),
  targetDurationSeconds: positive.int().max(86400).optional(),
  restSeconds: z.number().int().min(0).max(3600),
  notes: text,
});
export const sessionSchema = z.object({
  id,
  workoutPlanId: id,
  workoutNameSnapshot: z.string(),
  startedAt: date,
  completedAt: date.optional(),
  status: z.enum(['InProgress', 'Completed', 'Cancelled']),
  notes: text,
  restEndsAt: z.number().optional(),
});
export const sessionExerciseSchema = z.object({
  id,
  workoutSessionId: id,
  exerciseId: id,
  sortOrder: z.number().int().nonnegative(),
  exerciseNameSnapshot: z.string(),
  trackingTypeSnapshot: exerciseSchema.shape.trackingType,
  targetSetsSnapshot: positive.int(),
  targetRepsSnapshot: positive.optional(),
  targetDurationSnapshot: positive.optional(),
  restSecondsSnapshot: z.number().nonnegative(),
  skipped: z.boolean(),
});
export const setSchema = z.object({
  id,
  workoutSessionExerciseId: id,
  setNumber: positive.int(),
  repetitions: z.number().int().min(0).max(1000).optional(),
  durationSeconds: z.number().min(0).max(86400).optional(),
  weightKg: z.number().min(0).max(1000).optional(),
  isCompleted: z.boolean(),
  completedAt: date.optional(),
});
export const measurementSchema = z
  .object({
    id,
    recordedAt: date,
    weightKg: positive.max(500).optional(),
    waistCm: positive.max(400).optional(),
    chestCm: positive.max(400).optional(),
    hipCm: positive.max(400).optional(),
    armCm: positive.max(200).optional(),
    notes: text,
  })
  .refine(
    (v) => [v.weightKg, v.waistCm, v.chestCm, v.hipCm, v.armCm].some((x) => x !== undefined),
    'En az bir ölçüm girin.',
  );
export const goalsSchema = z.object({
  id,
  targetWeightKg: positive.max(500),
  dailyCalorieTarget: positive.max(15000),
  dailyProteinTarget: positive.max(1000),
  dailyCarbohydrateTarget: positive.max(2000),
  dailyFatTarget: positive.max(1000),
  dailyStepTarget: z.number().int().min(0).max(100000),
  weeklyWorkoutTarget: positive.int().max(14),
  updatedAt: date,
});
export const profileSchema = z.object({
  id,
  heightCm: positive.max(300),
  startingWeightKg: positive.max(500),
  fitnessLevel: z.string().min(1),
  trainingLocation: z.string().min(1),
  equipment: z.string(),
  theme: z.enum(['light', 'dark', 'system']),
  units: z.literal('metric'),
});
export type Exercise = z.infer<typeof exerciseSchema>;
export type WorkoutPlan = z.infer<typeof planSchema>;
export type PlanExercise = z.infer<typeof planExerciseSchema>;
export type WorkoutSession = z.infer<typeof sessionSchema>;
export type SessionExercise = z.infer<typeof sessionExerciseSchema>;
export type WorkoutSet = z.infer<typeof setSchema>;
export type Measurement = z.infer<typeof measurementSchema>;
export type Goals = z.infer<typeof goalsSchema>;
export type Profile = z.infer<typeof profileSchema>;
export const uid = () => crypto.randomUUID();
export const now = () => new Date().toISOString();
