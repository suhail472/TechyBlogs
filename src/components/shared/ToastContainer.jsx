'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import useToastStore from '@/store/useToastStore';

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-6 inset-x-0 z-[9999] flex flex-col items-center gap-2 pointer-events-none px-4 safe-area-bottom"
    >
      <AnimatePresence mode="sync">
        {toasts.map((toast) => {
          let Icon = Check;
          let iconWrapperClass = 'text-emerald-400 bg-emerald-500/15 ring-1 ring-emerald-500/20';

          if (toast.type === 'error') {
            Icon = AlertCircle;
            iconWrapperClass = 'text-rose-400 bg-rose-500/15 ring-1 ring-rose-500/20';
          } else if (toast.type === 'info') {
            Icon = Info;
            iconWrapperClass = 'text-sky-400 bg-sky-500/15 ring-1 ring-sky-500/20';
          } else if (toast.type === 'warning') {
            Icon = AlertTriangle;
            iconWrapperClass = 'text-amber-400 bg-amber-500/15 ring-1 ring-amber-500/20';
          }

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 18, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.94 }}
              transition={{ type: 'spring', damping: 26, stiffness: 360 }}
              className="pointer-events-auto inline-flex items-center gap-2.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-zinc-900/95 dark:bg-[#18181b]/95 text-white backdrop-blur-xl border border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.35)] ring-1 ring-white/5 select-none max-w-sm sm:max-w-md"
            >
              {/* Refined Status Icon Badge */}
              <div className={`p-1 rounded-full shrink-0 ${iconWrapperClass}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>

              {/* Toast Message */}
              <span className="text-[13px] font-medium text-zinc-100 tracking-[-0.01em] leading-snug">
                {toast.message}
              </span>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="p-1 -mr-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
