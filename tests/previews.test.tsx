import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ExercisePreview } from '../src/components/ExercisePreview';
import { exercisePreviews, getExercisePreview } from '../src/lib/exercise-previews';
import { FitDatabase } from '../src/database/db';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
it('tohumdaki 12 hareketin tamamına kullanıcı bağlantısı olmadan önizleme sağlar', async () => {
  const db = new FitDatabase(`preview-test-${crypto.randomUUID()}`);
  try {
    await db.open();
    const exercises = await db.exercises.toArray();
    expect(exercises).toHaveLength(12);
    for (const exercise of exercises) {
      expect(exercise.imageUrl).toBe('');
      expect(exercise.videoUrl).toBe('');
      expect(getExercisePreview(exercise.id, exercise.name)).toBeDefined();
    }
  } finally {
    await db.delete();
  }
});
it('her hareket için özgün iki pozisyon gösterir ve bilinmeyen hareket uydurmaz', () => {
  expect(Object.keys(exercisePreviews)).toHaveLength(12);
  for (const preview of Object.values(exercisePreviews))
    expect(preview.first).not.toEqual(preview.second);
  expect(getExercisePreview('exercise-0', 'Başka hareket')).toBeUndefined();
  expect(getExercisePreview('toString', 'toString')).toBeUndefined();
  const { container } = render(<ExercisePreview exerciseId="custom" name="Özel hareket" />);
  expect(container).toBeEmptyDOMElement();
});
it('otomatik oynamaz; açık kullanıcı eylemiyle oynar ve durdurulabilir', () => {
  vi.useFakeTimers();
  const view = render(<ExercisePreview exerciseId="exercise-0" name="Bodyweight Squat" controls />);
  expect(view.container.querySelectorAll('circle')).toHaveLength(2);
  expect(vi.getTimerCount()).toBe(0);
  fireEvent.click(screen.getByRole('button', { name: 'Hareketi oynat' }));
  expect(view.container.querySelectorAll('circle')).toHaveLength(1);
  const first = view.container.querySelector('polyline')!.getAttribute('points');
  act(() => vi.advanceTimersByTime(1600));
  expect(view.container.querySelector('polyline')!.getAttribute('points')).not.toBe(first);
  fireEvent.click(screen.getByRole('button', { name: 'Durdur' }));
  expect(view.container.querySelectorAll('circle')).toHaveLength(2);
  expect(vi.getTimerCount()).toBe(0);
  view.unmount();
});
