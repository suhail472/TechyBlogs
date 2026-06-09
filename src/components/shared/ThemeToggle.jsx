'use client';

import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import useThemeStore from '../../store/useThemeStore';
import { useEffect, useState } from 'react';

const ThemeToggle = () => {
  const { toggleTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  // Sync mounted status to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className="p-2 rounded-xl transition-all duration-300 border bg-zinc-50 border-zinc-200/80 text-zinc-800 hover:bg-zinc-100 hover:border-zinc-300 dark:bg-zinc-900/60 dark:border-zinc-800/80 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:border-zinc-700/80 flex items-center justify-center shadow-sm"
      aria-label="Toggle color theme"
    >
      {mounted ? (
        <>
          <Sun className="w-4.5 h-4.5 hidden dark:block text-amber-400" />
          <Moon className="w-4.5 h-4.5 block dark:hidden text-zinc-700" />
        </>
      ) : (
        // Placeholder skeleton with same visual footprint during SSR
        <div className="w-4.5 h-4.5" />
      )}
    </motion.button>
  );
};

export default ThemeToggle;
