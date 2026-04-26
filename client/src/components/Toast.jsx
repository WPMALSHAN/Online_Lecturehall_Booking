import { createContext, useCallback, useContext, useRef, useState } from 'react';

/* ─── Types: 'success' | 'error' | 'warning' | 'info' ─────────────────────── */

const ToastContext = createContext(null);

let _idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message, type = 'info', duration = 4000) => {
      const id = ++_idCounter;
      setToasts((prev) => [...prev, { id, message, type }]);
      timers.current[id] = setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss],
  );

  // Convenience helpers
  toast.success = (msg, dur)  => toast(msg, 'success', dur);
  toast.error   = (msg, dur)  => toast(msg, 'error',   dur ?? 6000);
  toast.warning = (msg, dur)  => toast(msg, 'warning', dur);
  toast.info    = (msg, dur)  => toast(msg, 'info',    dur);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

/* ─── Visual config per type ──────────────────────────────────────────────── */

const CONFIG = {
  success: {
    icon: '✅',
    bar:  'bg-green-500',
    bg:   'bg-white border-green-200',
    text: 'text-green-800',
    btn:  'text-green-400 hover:text-green-700',
  },
  error: {
    icon: '❌',
    bar:  'bg-red-500',
    bg:   'bg-white border-red-200',
    text: 'text-red-800',
    btn:  'text-red-400 hover:text-red-700',
  },
  warning: {
    icon: '⚠️',
    bar:  'bg-amber-400',
    bg:   'bg-white border-amber-200',
    text: 'text-amber-800',
    btn:  'text-amber-400 hover:text-amber-700',
  },
  info: {
    icon: 'ℹ️',
    bar:  'bg-blue-500',
    bg:   'bg-white border-blue-200',
    text: 'text-blue-800',
    btn:  'text-blue-400 hover:text-blue-700',
  },
};

/* ─── Single toast card ───────────────────────────────────────────────────── */

function ToastCard({ toast: t, onDismiss }) {
  const cfg = CONFIG[t.type] ?? CONFIG.info;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-xl border shadow-xl shadow-black/10 ${cfg.bg} px-4 py-3.5
        animate-[slideIn_0.25s_ease-out]`}
    >
      {/* colour bar */}
      <span className={`absolute inset-y-0 left-0 w-1 rounded-l-xl ${cfg.bar}`} />

      {/* icon */}
      <span className="mt-0.5 shrink-0 select-none text-base leading-none">{cfg.icon}</span>

      {/* message */}
      <p className={`flex-1 text-sm font-medium leading-snug ${cfg.text}`}>{t.message}</p>

      {/* close */}
      <button
        type="button"
        onClick={() => onDismiss(t.id)}
        aria-label="Close notification"
        className={`mt-0.5 shrink-0 text-lg leading-none transition ${cfg.btn}`}
      >
        ×
      </button>
    </div>
  );
}

/* ─── Container (fixed bottom-right) ─────────────────────────────────────── */

function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5"
      style={{ maxWidth: '22rem' }}
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
