import { useState, useEffect } from 'react';

/**
 * Debounces a value by `delay` ms. Default delay: 500ms (LabMango standard).
 * Mandatory for all filter/search inputs — replaces saga debounce(500, ...) pattern.
 */
export function useDebouncedValue<T>(value: T, delay = 500): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
