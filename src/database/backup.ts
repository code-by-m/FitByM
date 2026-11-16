import { z } from 'zod';
import { db, type FitDatabase } from './db';
import {
  exerciseSchema,
  planSchema,
  planExerciseSchema,
  sessionSchema,
  sessionExerciseSchema,
  setSchema,
  measurementSchema,
  goalsSchema,
  profileSchema,
} from '../types/models';
export const backupSchema = z
  .object({
    schemaVersion: z.literal(1),
    exportedAt: z.string().datetime(),
    exercises: z.array(exerciseSchema),
    workoutPlans: z.array(planSchema),
    workoutPlanExercises: z.array(planExerciseSchema),
    workoutSessions: z.array(sessionSchema),
    workoutSessionExercises: z.array(sessionExerciseSchema),
    workoutSets: z.array(setSchema),
    bodyMeasurements: z.array(measurementSchema),
    userGoals: z.array(goalsSchema),
    profiles: z.array(profileSchema),
  })
  .superRefine((v, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
    for (const [key, rows] of Object.entries(v)) {
      if (Array.isArray(rows) && new Set(rows.map((r) => r.id)).size !== rows.length)
        fail(`${key}: yinelenen kimlik`);
    }
    const ids = (rows: { id: string }[]) => new Set(rows.map((r) => r.id));
    const exercises = ids(v.exercises),
      plans = ids(v.workoutPlans),
      sessions = ids(v.workoutSessions),
      items = ids(v.workoutSessionExercises);
    for (const row of v.workoutPlanExercises)
      if (!plans.has(row.workoutPlanId) || !exercises.has(row.exerciseId))
        fail('Program ilişkisi bozuk.');
    for (const row of v.workoutSessionExercises)
      if (!sessions.has(row.workoutSessionId)) fail('Antrenman ilişkisi bozuk.');
    for (const row of v.workoutSets)
      if (!items.has(row.workoutSessionExerciseId)) fail('Set ilişkisi bozuk.');
    if (v.workoutSessions.filter((s) => s.status === 'InProgress').length > 1)
      fail('Birden fazla aktif antrenman.');
    if (
      v.userGoals.length !== 1 ||
      v.userGoals[0]?.id !== 'default' ||
      v.profiles.length !== 1 ||
      v.profiles[0]?.id !== 'default'
    )
      fail('Profil ve hedefler eksik.');
  });
export type Backup = z.infer<typeof backupSchema>;
export async function exportBackup(database: FitDatabase = db): Promise<Backup> {
  return database.transaction('r', database.tables, async () =>
    backupSchema.parse({
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      ...Object.fromEntries(
        await Promise.all(database.tables.map(async (t) => [t.name, await t.toArray()])),
      ),
    }),
  );
}
export async function importBackup(input: unknown, database: FitDatabase = db) {
  const backup = backupSchema.parse(input);
  await database.transaction('rw', database.tables, async () => {
    for (const table of database.tables) {
      await table.clear();
      await table.bulkAdd(backup[table.name as keyof Backup] as object[]);
    }
  });
}
export async function resetData(database: FitDatabase = db) {
  await database.transaction('rw', database.tables, async () => {
    for (const table of database.tables)
      if (!['profiles', 'userGoals'].includes(table.name)) await table.clear();
  });
}
export function download(content: string, name: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export function csv(rows: (string | number | undefined)[][]) {
  return (
    '\uFEFF' +
    rows
      .map((row) => row.map((v) => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(','))
      .join('\r\n')
  );
}
