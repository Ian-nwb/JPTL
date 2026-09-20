import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce rapid value updates (e.g. search input fields)
 * @param {T} value
 * @param {number} delayMs - Delay in milliseconds (default 300ms)
 * @returns {T}
 */
export function useDebounce(value, delayMs = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
