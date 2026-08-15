'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  Search,
  Bookmark,
  Globe,
  ChevronDown,
  Flame,
  Layers,
  Sparkles,
} from 'lucide-react';
import ThemeToggle from '../shared/ThemeToggle';
import { taxonomyAPI } from '@/services/api';

const EDITIONS = [
  { id: 'global', name: 'Global Edition', path: '/' },
  { id: 'kashmir', name: 'Kashmir Edition', path: '/edition/kashmir' },
  { id: 'india', name: 'India Edition', path: '/edition/india' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [editionDropdownOpen, setEditionDropdownOpen] = useState(false);
  const [sections, setSections] = useState([]);
  const [savedCount, setSavedCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchNavSections = async () => {
      try {
        const res = await taxonomyAPI.getAll({ kind: 'section', navigation: 'true' });
        if (res.success && res.data) {
          setSections(res.data);
        }
      } catch (err) {
        // Fallback default sections
        setSections([
          { name: 'Technology', slug: 'technology' },
          { name: 'News', slug: 'news' },
          { name: 'Education', slug: 'education' },
          { name: 'Business', slug: 'business' },
          { name: 'Travel', slug: 'travel' },
        ]);
      }
    };
    fetchNavSections();

    // Check saved bookmarks count
    if (typeof window !== 'undefined') {
      const saved = JSON.parse(localStorage.getItem('techy-bookmarked-posts') || '[]');
      setSavedCount(saved.length);
    }
  }, []);

  const openSearch = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
  };

  const currentEdition = EDITIONS.find((e) => pathname.startsWith(e.path) && e.path !== '/') || EDITIONS[0];

  return (
    <header className="fixed top-0 z-50 w-full transition-all duration-300">
      {/* Top Edition & Utility Bar */}
      <div className="bg-zinc-950 text-white text-[11px] font-bold py-1.5 px-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Edition Switcher */}
            <div className="relative">
              <button
                onClick={() => setEditionDropdownOpen(!editionDropdownOpen)}
                className="flex items-center gap-1.5 hover:text-red-400 transition-colors uppercase tracking-wider text-[10px]"
              >
                <Globe className="w-3.5 h-3.5 text-red-500" />
                <span>{currentEdition.name}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              <AnimatePresence>
                {editionDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute top-full left-0 mt-1.5 w-48 bg-zinc-900 border border-white/15 rounded-xl shadow-2xl p-1.5 z-50 text-xs font-semibold"
                  >
                    {EDITIONS.map((ed) => (
                      <Link
                        key={ed.id}
                        href={ed.path}
                        onClick={() => setEditionDropdownOpen(false)}
                        className="block px-3 py-2 rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
                      >
                        {ed.name}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <span className="hidden sm:inline-block text-zinc-500">|</span>
            <span className="hidden sm:inline-block text-zinc-400">
              Independent digital publishing & journalism
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/saved" className="flex items-center gap-1.5 hover:text-white transition-colors text-zinc-300">
              <Bookmark className="w-3.5 h-3.5" />
              <span>Bookmarks {savedCount > 0 && `(${savedCount})`}</span>
            </Link>
            <Link href="/feed.xml" target="_blank" className="hover:text-amber-400 text-zinc-400">
              RSS Feed
            </Link>
          </div>
        </div>
      </div>

      {/* Main Masthead Nav */}
      <nav
        className={`w-full transition-all duration-300 ${
          scrolled
            ? 'py-2.5 backdrop-blur-xl border-b border-zinc-200/80 dark:border-white/10 bg-white/90 dark:bg-zinc-950/90 shadow-sm'
            : 'py-4 bg-white/95 dark:bg-zinc-950/95 border-b border-zinc-200/60 dark:border-white/10'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <span className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-sm transition-transform group-hover:scale-105 shadow-md shadow-red-600/20">
              TB
            </span>
            <div className="font-display">
              <span className="text-xl font-black tracking-tight text-zinc-900 dark:text-white">
                Teachy<span className="text-red-600">Blogs</span>
              </span>
            </div>
          </Link>

          {/* Section Navigation Links */}
          <div className="hidden lg:flex items-center space-x-1">
            <Link
              href="/blogs"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                pathname === '/blogs'
                  ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10'
                  : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white'
              }`}
            >
              All Stories
            </Link>

            {sections.slice(0, 6).map((sec) => {
              const active = pathname === `/section/${sec.slug}`;
              return (
                <Link
                  key={sec.slug}
                  href={`/section/${sec.slug}`}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    active
                      ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10'
                      : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white'
                  }`}
                >
                  {sec.name}
                </Link>
              );
            })}

            <Link
              href="/edition/kashmir"
              className="px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all flex items-center gap-1"
            >
              <Flame className="w-3.5 h-3.5" /> Kashmir
            </Link>
          </div>

          {/* Utility Tools */}
          <div className="flex items-center gap-2.5">
            {/* Search Trigger */}
            <button
              onClick={openSearch}
              className="p-2.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors flex items-center gap-2"
              aria-label="Search articles"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline-block text-xs font-medium text-zinc-400">Search ⌘K</span>
            </button>

            <ThemeToggle />

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-white/10 px-6 py-4 overflow-hidden space-y-3 text-sm font-bold"
            >
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="block py-2 text-zinc-700 dark:text-zinc-300"
              >
                Frontpage
              </Link>
              <Link
                href="/blogs"
                onClick={() => setIsOpen(false)}
                className="block py-2 text-zinc-700 dark:text-zinc-300"
              >
                All Stories & Archives
              </Link>
              <Link
                href="/edition/kashmir"
                onClick={() => setIsOpen(false)}
                className="block py-2 text-red-600 dark:text-red-400"
              >
                Kashmir Edition
              </Link>
              <div className="pt-2 border-t border-zinc-100 dark:border-white/5 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">Verticals</span>
                {sections.map((sec) => (
                  <Link
                    key={sec.slug}
                    href={`/section/${sec.slug}`}
                    onClick={() => setIsOpen(false)}
                    className="block py-1.5 text-zinc-600 dark:text-zinc-400 text-xs"
                  >
                    {sec.name}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
