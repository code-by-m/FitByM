import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useToday } from '../src/features/nutrition/useToday';
afterEach(() => vi.useRealTimers());
it('gün değişiminde uygulamaya dönünce günlük özet tarihini yeniler', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 10, 17, 23, 59));
  const { result, unmount } = renderHook(() => useToday());
  expect(result.current).toBe('2026-11-17');
  vi.setSystemTime(new Date(2026, 10, 18, 0, 1));
  act(() => window.dispatchEvent(new Event('focus')));
  expect(result.current).toBe('2026-11-18');
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
