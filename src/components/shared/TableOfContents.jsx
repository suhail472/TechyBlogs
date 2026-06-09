'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { List, ChevronRight } from 'lucide-react';

export default function TableOfContents({ headings = [] }) {
  const [activeId, setActiveId] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const observerRef = useRef(null);

  // Set up IntersectionObserver for active heading tracking
  useEffect(() => {
    if (headings.length === 0) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Find the first heading that is intersecting
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: '-80px 0px -60% 0px',
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
    <div className="p-5 rounded-2xl glass-card transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5 relative overflow-hidden">
      {/* Gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-3 group"
      >
        <div className="flex items-center gap-2">
          <List className="w-4 h-4 text-blue-500" />
          <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-display">
            On This Page
          </h3>
        </div>
        <ChevronRight
          className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
        />
      </button>

      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <nav className="space-y-0.5 border-l-2 border-zinc-200/50 dark:border-white/[0.06]">
          {headings.map((heading) => (
            <button
              key={heading.id}
              onClick={() => scrollToHeading(heading.id)}
              className={`block w-full text-left text-xs font-medium py-1.5 transition-all duration-200 border-l-2 -ml-[2px] ${
                heading.level === 1
                  ? 'pl-3'
                  : heading.level === 2
                  ? 'pl-3'
                  : 'pl-6'
              } ${
                activeId === heading.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-bold bg-blue-500/5'
                  : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-600'
              }`}
            >
              <span className="line-clamp-1">{heading.text}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
