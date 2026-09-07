'use client';

import { useEffect, useState } from 'react';
import { Bot, MessageSquare } from 'lucide-react';

export default function AiFloatingButton({ isOpen, onToggle, articleTitle = '' }) {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
    }
  }, []);

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label="Open TechyBlogs AI Reader Assistant"
      aria-expanded={isOpen}
      className={`fixed bottom-6 left-6 z-40 touch-target flex items-center gap-2.5 px-4 py-2.5 rounded-full font-display font-bold text-xs shadow-lg transition-all duration-300 ${
        isOpen
          ? 'bg-red-600 text-white border border-red-600 shadow-red-600/30 scale-95 ring-2 ring-red-500/30'
          : 'bg-white dark:bg-[#1e2433] text-zinc-800 dark:text-zinc-100 border border-zinc-200/90 dark:border-white/15 hover:border-red-500/60 hover:text-red-600 dark:hover:text-red-400 shadow-zinc-200/60 dark:shadow-none hover:shadow-red-500/10 hover:scale-105 active:scale-95'
      }`}
    >
      <div className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 transition-colors ${
        isOpen ? 'bg-white text-red-600' : 'bg-red-600 text-white'
      }`}>
        <Bot className="w-3.5 h-3.5" />
      </div>

      <span className="hidden sm:inline tracking-tight font-black">
        TechyBlogs <span className={isOpen ? 'text-white' : 'text-red-600 dark:text-red-400'}>AI</span>
      </span>
      <span className="sm:hidden font-black">AI</span>

      <span className={`hidden md:inline-flex items-center text-[10px] font-mono px-1.5 py-0.5 rounded-md font-bold ml-0.5 ${
        isOpen ? 'bg-white/20 text-white' : 'bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400'
      }`}>
        {isMac ? '⌘J' : 'Ctrl+J'}
      </span>
    </button>
  );
}
