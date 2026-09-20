import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, HelpCircle, Check, X, ShieldAlert } from 'lucide-react';

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'primary'
  loading = false,
  icon: CustomIcon,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={loading ? undefined : onClose}
        />

        {/* Modal Window */}
        <motion.div
          className="relative w-full max-w-md p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0E1322] border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 text-left z-10"
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ type: 'spring', stiffness: 450, damping: 28 }}
        >
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                variant === 'danger'
                  ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-lg shadow-rose-500/10'
                  : variant === 'warning'
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-lg shadow-amber-500/10'
                  : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20 shadow-lg shadow-indigo-500/10'
              }`}
            >
              {CustomIcon ? (
                <CustomIcon className="w-6 h-6" />
              ) : variant === 'danger' ? (
                <Trash2 className="w-6 h-6" />
              ) : variant === 'warning' ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <HelpCircle className="w-6 h-6" />
              )}
            </div>

            <div className="space-y-1.5 flex-1 pr-6">
              <h3 className="text-base sm:text-lg font-bold font-grotesk text-slate-900 dark:text-white leading-snug">
                {title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                {description}
              </p>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition btn-press cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-xs font-semibold font-grotesk transition btn-press cursor-pointer"
            >
              {cancelText}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={onConfirm}
              className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold font-grotesk transition shadow-md btn-press cursor-pointer flex items-center gap-2 ${
                variant === 'danger'
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                  : variant === 'warning'
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
              }`}
            >
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>{confirmText}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
