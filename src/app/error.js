'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Home } from 'lucide-react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('App error boundary caught error:', error);
  }, [error]);

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-6 py-24 text-center">
      <div className="max-w-md mx-auto space-y-6">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-600 dark:text-amber-400">
          Application Notice
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white">
          Something went wrong
        </h1>
        <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          An unexpected error occurred while loading this page.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 text-xs font-bold uppercase tracking-wider hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            Go Home
          </Link>
        </div>
      </div>
    </main>
  );
}
