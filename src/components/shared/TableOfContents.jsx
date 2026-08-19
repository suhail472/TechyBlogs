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
    <div className="rounded-xl bg-zinc-50/70 dark:bg-zinc-900/50 border border-zinc-200/70 dark:border-white/10 p-3.5 transition-all">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left group py-0.5"
      >
        <div className="flex items-center gap-2">
          <List className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
          <h3 className="font-display font-black text-[11px] uppercase tracking-[0.16em] text-zinc-900 dark:text-white">
            On This Page
          </h3>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-red-500' : ''}`}
        />
      </button>

      <div
        className={`transition-all duration-200 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[300px] opacity-100 mt-2.5 pt-2.5 border-t border-zinc-200/50 dark:border-white/5' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="space-y-0.5 max-h-[240px] overflow-y-auto pr-1">
          {headings.map((heading, idx) => {
            const formattedRank = idx + 1 < 10 ? `0${idx + 1}` : `${idx + 1}`;
            const isActive = activeId === heading.id;
            return (
              <button
                key={heading.id}
                onClick={() => scrollToHeading(heading.id)}
                className={`flex items-start gap-2 w-full text-left text-[11.5px] transition-colors py-1 px-1.5 rounded-md ${
                  isActive
                    ? 'text-red-600 dark:text-red-400 font-bold bg-red-50/60 dark:bg-red-500/10'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/70 dark:hover:bg-white/5 font-medium'
                }`}
              >
                <span
                  className={`font-mono text-[10px] shrink-0 pt-0.5 ${
                    isActive ? 'text-red-600 dark:text-red-400 font-bold' : 'text-zinc-400 dark:text-zinc-500'
                  }`}
                >
                  {formattedRank}
                </span>
                <span className="line-clamp-2 leading-tight">{heading.text}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
