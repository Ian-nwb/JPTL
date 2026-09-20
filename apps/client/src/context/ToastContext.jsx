import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, [removeToast]);

  const toast = {
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration),
    warning: (msg, duration) => addToast(msg, 'warning', duration),
    info: (msg, duration) => addToast(msg, 'info', duration),
    dismiss: (id) => removeToast(id),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((t) => {
            const isSuccess = t.type === 'success';
            const isError = t.type === 'error';
            const isWarning = t.type === 'warning';

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={`
                  pointer-events-auto p-4 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-start gap-3
                  ${
                    isSuccess
                      ? 'bg-slate-900/95 dark:bg-[#0C101C]/95 border-emerald-500/30 text-white'
                      : isError
                      ? 'bg-slate-900/95 dark:bg-[#0C101C]/95 border-rose-500/30 text-white'
                      : isWarning
                      ? 'bg-slate-900/95 dark:bg-[#0C101C]/95 border-amber-500/30 text-white'
                      : 'bg-slate-900/95 dark:bg-[#0C101C]/95 border-indigo-500/30 text-white'
                  }
                `}
              >
                <div className="shrink-0 mt-0.5">
                  {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                  {isError && <AlertCircle className="w-5 h-5 text-rose-400" />}
                  {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                  {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-indigo-400" />}
                </div>

                <div className="flex-1 pr-1">
                  <p className="text-xs font-semibold font-grotesk leading-relaxed text-slate-100">
                    {t.message}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeToast(t.id)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition btn-press shrink-0"
                  aria-label="Close notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Graceful fallback if invoked outside provider
    return {
      success: (msg) => console.log('[Toast Success]:', msg),
      error: (msg) => console.error('[Toast Error]:', msg),
      warning: (msg) => console.warn('[Toast Warning]:', msg),
      info: (msg) => console.info('[Toast Info]:', msg),
      dismiss: () => {},
    };
  }
  return context;
}
