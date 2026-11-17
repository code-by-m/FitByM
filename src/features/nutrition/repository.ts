import { db, type FitDatabase } from '../../database/db';
import { nutritionEntrySchema, type NutritionEntry } from '../../types/models';
export class NutritionRepository {
  constructor(readonly database: FitDatabase = db) {}
  list(day: string) {
    return this.database.nutritionEntries.where('recordedDate').equals(day).sortBy('createdAt');
  }
  async save(entry: NutritionEntry) {
    await this.database.nutritionEntries.put(nutritionEntrySchema.parse(entry));
  }
  async delete(id: string) {
    await this.database.nutritionEntries.delete(id);
  }
}
export const nutritionRepository = new NutritionRepository();
