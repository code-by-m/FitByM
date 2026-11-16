import { useEffect, useState } from 'react';

/** iOS may suspend interval callbacks; read wall time immediately after returning. */
export function useClock() {
  const [time, setTime] = useState(Date.now);
  useEffect(() => {
    const sync = () => setTime(Date.now());
    const timer = window.setInterval(sync, 1000);
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('focus', sync);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('focus', sync);
    };
  }, []);
  return time;
}
