'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import useToastStore from '@/store/useToastStore';

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-24 right-6 z-[999] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 md:px-0">
      <AnimatePresence>
        {toasts.map((toast) => {
          let Icon = CheckCircle;
          let iconColor = 'text-emerald-500 dark:text-emerald-450';
          let borderTheme = 'border-emerald-500/20 dark:border-emerald-400/15';
          let progressBg = 'bg-emerald-500';
          
          if (toast.type === 'error') {
            Icon = AlertCircle;
            iconColor = 'text-rose-500 dark:text-rose-450';
            borderTheme = 'border-rose-500/20 dark:border-rose-400/15';
            progressBg = 'bg-rose-500';
          } else if (toast.type === 'info') {
            Icon = Info;
            iconColor = 'text-blue-500 dark:text-blue-450';
            borderTheme = 'border-blue-500/20 dark:border-blue-400/15';
            progressBg = 'bg-blue-500';
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15 } }}
              className={`pointer-events-auto flex items-center justify-between gap-3.5 px-4.5 py-3.5 rounded-2xl glass-card border ${borderTheme} shadow-2xl shadow-zinc-200/15 dark:shadow-black/40 relative overflow-hidden w-full`}
            >
              {/* Top tiny progress indicator line */}
              <motion.div 
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 3, ease: 'linear' }}
                className={`absolute bottom-0 left-0 h-[2.5px] ${progressBg} opacity-60`}
              />

              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${iconColor} shrink-0`} />
                <span className="text-xs font-bold font-sans text-zinc-850 dark:text-zinc-200">
                  {toast.message}
                </span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors shrink-0"
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
