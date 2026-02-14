import { useState, useEffect, useRef } from 'react';

interface DeferredLoadingOptions {
  /** Milliseconds before showing the loading indicator (default: 300) */
  showDelay?: number;
  /** Minimum milliseconds to hold the indicator once shown (default: 0, disabled) */
  minDuration?: number;
}

/**
 * Defers a boolean loading state so that brief loading flashes are suppressed.
 * If loading finishes before `showDelay`, the consumer never sees `true`.
 * Once shown, optionally holds for `minDuration` to avoid a brief flicker.
 */
export function useDeferredLoading(
  isLoading: boolean,
  options?: DeferredLoadingOptions,
): boolean {
  const showDelay = options?.showDelay ?? 300;
  const minDuration = options?.minDuration ?? 0;

  const [visible, setVisible] = useState(false);
  const shownAtRef = useRef<number | null>(null);
  const showTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (isLoading) {
      // Clear any pending hide timer — we're loading again
      clearTimeout(hideTimerRef.current);

      // Start delay before showing
      showTimerRef.current = setTimeout(() => {
        shownAtRef.current = Date.now();
        setVisible(true);
      }, showDelay);
    } else {
      // Loading finished — cancel the show timer if it hasn't fired
      clearTimeout(showTimerRef.current);

      if (shownAtRef.current !== null && minDuration > 0) {
        // Hold visible for the remainder of minDuration
        const elapsed = Date.now() - shownAtRef.current;
        const remaining = Math.max(0, minDuration - elapsed);
        hideTimerRef.current = setTimeout(() => {
          shownAtRef.current = null;
          setVisible(false);
        }, remaining);
      } else {
        // Use a zero-delay timer so setVisible is not called synchronously
        // within the effect body (satisfies react-hooks/set-state-in-effect).
        shownAtRef.current = null;
        hideTimerRef.current = setTimeout(() => {
          setVisible(false);
        }, 0);
      }
    }

    return () => {
      clearTimeout(showTimerRef.current);
      clearTimeout(hideTimerRef.current);
    };
  }, [isLoading, showDelay, minDuration]);

  return visible;
}
