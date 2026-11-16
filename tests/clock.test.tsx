import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useClock } from '../src/hooks/useClock';

afterEach(() => vi.useRealTimers());
it('visibility/focus sonrası askıda geçen süreyi hemen yansıtır ve dinleyicileri temizler', () => {
  vi.useFakeTimers();
  const start = Date.now();
  const { result, unmount } = renderHook(() => useClock());
  vi.setSystemTime(start + 120000);
  act(() => document.dispatchEvent(new Event('visibilitychange')));
  expect(result.current).toBe(start + 120000);
  vi.setSystemTime(start + 180000);
  act(() => window.dispatchEvent(new Event('focus')));
  expect(result.current).toBe(start + 180000);
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
