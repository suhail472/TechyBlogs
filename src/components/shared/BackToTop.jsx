'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
          
          setIsVisible(scrollY > 300);
          
          if (totalHeight > 0) {
            setProgress(scrollY / totalHeight);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const radius = 18;
  const strokeWidth = 2.5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-[90] w-12 h-12 rounded-full flex items-center justify-center bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-450 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500/30 shadow-lg shadow-zinc-200/25 dark:shadow-black/50 hover:-translate-y-1 transition-all duration-300 pointer-events-auto"
          aria-label="Back to top"
        >
          {/* Circular SVG progress ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              className="text-zinc-100 dark:text-zinc-900"
              strokeWidth={strokeWidth}
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="24"
              cy="24"
            />
            <circle
              className="text-blue-500 dark:text-blue-400 transition-all duration-75"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="24"
              cy="24"
            />
          </svg>
          <ArrowUp className="w-4 h-4 relative z-10" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
