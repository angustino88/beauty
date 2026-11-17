import { useEffect, useState } from 'react';
import { secondsUntil } from './agentModel';

/** Seconds left until `expiresAt`, ticking every second; 0 without a deadline. */
export function useCountdown(expiresAt: string | undefined): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!expiresAt) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);
  return expiresAt ? secondsUntil(expiresAt, now) : 0;
}
