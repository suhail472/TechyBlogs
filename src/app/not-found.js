import Link from 'next/link';
import { ArrowLeft, Home, Search } from 'lucide-react';

export const metadata = {
  title: '404 - Page Not Found | TeachyBlogs',
  description: 'The requested page or article could not be found on TeachyBlogs.',
};

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-6 py-24 text-center">
      <div className="max-w-md mx-auto space-y-6">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-600 dark:text-red-400">
          Error 404
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white">
          Page Not Found
        </h1>
        <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          The story, section, or page you are looking for might have been moved, renamed, or is currently unavailable.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity shadow-md"
          >
            <Home className="w-3.5 h-3.5" />
            Back Home
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 text-xs font-bold uppercase tracking-wider hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            Search Stories
          </Link>
        </div>
      </div>
    </main>
  );
}
