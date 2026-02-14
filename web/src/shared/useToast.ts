import { useState, useCallback, useRef } from 'react';

export interface Toast {
  id: string;
  message: string;
  onUndo?: () => void;
}

let toastCounter = 0;

export function useToast(autoDismissMs = 6000) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message: string, onUndo?: () => void) => {
    const id = `toast-${++toastCounter}`;
    const toast: Toast = { id, message, onUndo };
    setToasts((prev) => [...prev, toast]);

    const timer = setTimeout(() => {
      timersRef.current.delete(id);
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, autoDismissMs);
    timersRef.current.set(id, timer);

    return id;
  }, [autoDismissMs]);

  return { toasts, show, dismiss };
}
