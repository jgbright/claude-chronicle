import type { Toast as ToastData } from './useToast';

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastProps) {
  return (
    <div className="toast" role="status">
      <span className="toast__message">{toast.message}</span>
      {toast.onUndo && (
        <button
          className="toast__undo"
          onClick={() => {
            toast.onUndo!();
            onDismiss(toast.id);
          }}
        >
          Undo
        </button>
      )}
      <button
        className="toast__close"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
      >
        &times;
      </button>
    </div>
  );
}

interface ContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ContainerProps) {
  if (toasts.length === 0) return null;
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
