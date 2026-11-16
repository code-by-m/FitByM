import Dexie, { type Table } from 'dexie';
import type {
  Exercise,
  WorkoutPlan,
  PlanExercise,
  WorkoutSession,
  SessionExercise,
  WorkoutSet,
  Measurement,
  Goals,
  Profile,
} from '../types/models';
import { seed } from './seed';
export class FitDatabase extends Dexie {
  exercises!: Table<Exercise, string>;
  workoutPlans!: Table<WorkoutPlan, string>;
  workoutPlanExercises!: Table<PlanExercise, string>;
  workoutSessions!: Table<WorkoutSession, string>;
  workoutSessionExercises!: Table<SessionExercise, string>;
  workoutSets!: Table<WorkoutSet, string>;
  bodyMeasurements!: Table<Measurement, string>;
  userGoals!: Table<Goals, string>;
  profiles!: Table<Profile, string>;
  constructor(name = 'FitByM') {
    super(name);
    this.version(1).stores({
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
    this.on('populate', () => seed(this));
  }
}
export const db = new FitDatabase();
