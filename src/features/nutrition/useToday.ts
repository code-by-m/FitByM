import { useEffect, useState } from 'react';
import { localDay } from './lib';

export function useToday() {
  const [day, setDay] = useState(localDay);
  useEffect(() => {
    const sync = () => setDay(localDay());
    const timer = window.setInterval(sync, 60000);
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);
  return day;
}
