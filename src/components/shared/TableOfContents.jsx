'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { List, ChevronDown } from 'lucide-react';

export default function TableOfContents({ headings = [] }) {
  const [activeId, setActiveId] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const observerRef = useRef(null);

  useEffect(() => {
    if (headings.length === 0) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: '-90px 0px -65% 0px',
        threshold: 0.1,
      }
    );

    const setupObserver = () => {
      let elementsObserved = 0;
      headings.forEach((heading) => {
        const el = document.getElementById(heading.id);
        if (el) {
          observerRef.current.observe(el);
          elementsObserved++;
        }
      });
      return elementsObserved > 0;
    };

    const success = setupObserver();
    let fallbackTimer;
    if (!success) {
      fallbackTimer = setTimeout(setupObserver, 200);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [headings]);

  const scrollToHeading = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 100;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
      setActiveId(id);
    }
  }, []);

  if (headings.length === 0) return null;

  return (
    <div className="rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-white/10 p-5 transition-all">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-2">
          <List className="w-4 h-4 text-red-600 dark:text-red-400" />
          <h3 className="font-display font-black text-xs uppercase tracking-[0.2em] text-zinc-900 dark:text-white">
            On This Page
          </h3>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[500px] opacity-100 mt-4 pt-3 border-t border-zinc-200/60 dark:border-white/5' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="space-y-1.5">
          {headings.map((heading, idx) => {
            const formattedRank = idx + 1 < 10 ? `0${idx + 1}` : `${idx + 1}`;
            const isActive = activeId === heading.id;
            return (
              <button
                key={heading.id}
                onClick={() => scrollToHeading(heading.id)}
                className={`flex items-start gap-2.5 w-full text-left text-xs transition-colors py-1 ${
                  isActive
                    ? 'text-red-600 dark:text-red-400 font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-medium'
                }`}
              >
                <span
                  className={`font-mono text-[11px] shrink-0 pt-0.5 ${
                    isActive ? 'text-red-600 dark:text-red-400 font-bold' : 'text-zinc-400 dark:text-zinc-500'
                  }`}
                >
                  {formattedRank}
                </span>
                <span className="line-clamp-2 leading-snug">{heading.text}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
