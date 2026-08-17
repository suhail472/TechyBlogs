'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Plus, ExternalLink, Bell, Sparkles, Home } from 'lucide-react';
import SearchCommandModal from './SearchCommandModal';
import useAuthStore from '@/store/useAuthStore';

export default function AdminHeader({ title = '', breadcrumb = [], actions = null }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const { user } = useAuthStore();
  const pathname = usePathname();

  // Keyboard shortcut listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="mb-8 pb-5 border-b border-zinc-200/80 dark:border-white/10 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Breadcrumbs & Title */}
        <div>
          {breadcrumb.length > 0 && (
            <nav className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium mb-1.5">
              <Link href="/admin" className="hover:text-red-600 transition-colors">
                Newsroom
              </Link>
              {breadcrumb.map((crumb, idx) => (
                <span key={idx} className="flex items-center gap-1.5">
                  <span>/</span>
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}

          {title && (
            <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
              {title}
            </h1>
          )}
        </div>

        {/* Right: Workspace Controls & Contextual Actions */}
        <div className="flex items-center gap-3">
          {/* Global Search Bar Shortcut */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/10 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 shadow-xs transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            <span className="hidden sm:inline-block">Search newsroom...</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-400 rounded border border-zinc-200 dark:border-white/10">
              ⌘K
            </kbd>
          </button>

          {/* New Story Quick Action (unless already on /create) */}
          {pathname !== '/admin/create' && (
            <Link
              href="/admin/create"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-red-600 hover:bg-red-500 text-white transition-colors shadow-sm shadow-red-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Story</span>
            </Link>
          )}

          {/* Contextual Custom Actions */}
          {actions}
        </div>
      </header>

      {/* Global Command Palette Modal */}
      <SearchCommandModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
