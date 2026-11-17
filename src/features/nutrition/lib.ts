import type { NutritionEntry } from '../../types/models';

export const meals = ['Kahvaltı', 'Öğle', 'Akşam', 'Ara öğün'] as const;
export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function shiftDay(day: string, amount: number) {
  const date = new Date(`${day}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return localDay(date);
}
const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
export const numberText = (value: number) =>
  value.toLocaleString('tr-TR', { maximumFractionDigits: 4 });
export function nutritionTotals(entries: NutritionEntry[]) {
  const sum = (key: 'caloriesPerServing' | 'proteinGrams' | 'carbohydrateGrams' | 'fatGrams') =>
    round(entries.reduce((total, entry) => total + (entry[key] ?? 0) * entry.servings, 0));
  return {
    calories: sum('caloriesPerServing'),
    protein: sum('proteinGrams'),
    carbohydrate: sum('carbohydrateGrams'),
    fat: sum('fatGrams'),
    knownProtein: entries.filter((e) => e.proteinGrams !== undefined).length,
    knownCarbohydrate: entries.filter((e) => e.carbohydrateGrams !== undefined).length,
    knownFat: entries.filter((e) => e.fatGrams !== undefined).length,
    missingMacros: entries.filter(
      (e) =>
        e.proteinGrams === undefined ||
        e.carbohydrateGrams === undefined ||
        e.fatGrams === undefined,
    ).length,
  };
}
