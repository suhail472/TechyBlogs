'use client';

import { useState, useEffect, useRef } from 'react';
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
  Check,
  MapPin,
  Flame,
  Layers,
  Sparkles,
} from 'lucide-react';
import ThemeToggle from '../shared/ThemeToggle';
import { taxonomyAPI } from '@/services/api';

const EDITIONS = [
  { id: 'global', name: 'Global Edition', label: 'Global', path: '/', badge: '🌍' },
  { id: 'kashmir', name: 'Kashmir Edition', label: 'Kashmir', path: '/edition/kashmir', badge: '🏔️' },
  { id: 'india', name: 'India Edition', label: 'India', path: '/edition/india', badge: '🇮🇳' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [editionDropdownOpen, setEditionDropdownOpen] = useState(false);
  const [sections, setSections] = useState([]);
  const [savedCount, setSavedCount] = useState(0);
  const pathname = usePathname();
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setEditionDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        if (res.success && res.data && res.data.length > 0) {
          setSections(res.data);
        } else {
          throw new Error('No sections');
        }
      } catch (err) {
        setSections([
          { name: 'Technology', slug: 'technology' },
          { name: 'News', slug: 'news' },
          { name: 'Education', slug: 'education' },
          { name: 'Business', slug: 'business' },
          { name: 'Travel & Culture', slug: 'travel' },
          { name: 'Lifestyle', slug: 'lifestyle' },
        ]);
      }
    };
    fetchNavSections();

    if (typeof window !== 'undefined') {
      const saved = JSON.parse(localStorage.getItem('techy-blogs-bookmarks') || '[]');
      setSavedCount(saved.length);
    }
  }, []);

  const openSearch = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
  };

  // Determine current active edition
  const currentEdition =
    EDITIONS.find((e) => e.path !== '/' && pathname.startsWith(e.path)) || EDITIONS[0];

  return (
    <header className="fixed top-0 z-50 w-full transition-all duration-300">
      {/* Top Edition & Utility Masthead Bar */}
      <div className="bg-zinc-950 text-white text-[11px] font-bold py-2 px-6 border-b border-white/10 relative z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Edition Switcher Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setEditionDropdownOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white transition-all uppercase tracking-wider text-[11px] cursor-pointer"
                aria-expanded={editionDropdownOpen}
                aria-haspopup="true"
              >
                <span className="text-sm">{currentEdition.badge}</span>
                <span className="font-extrabold">{currentEdition.name}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                    editionDropdownOpen ? 'rotate-180 text-white' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {editionDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute top-full left-0 mt-2 w-56 bg-zinc-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-2 z-[100] text-xs font-semibold"
                  >
                    <div className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-zinc-400 font-bold border-b border-white/10 mb-1">
                      Select Regional Edition
                    </div>
                    {EDITIONS.map((ed) => {
                      const isSelected = ed.id === currentEdition.id;
                      return (
                        <Link
                          key={ed.id}
                          href={ed.path}
                          onClick={() => setEditionDropdownOpen(false)}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                            isSelected
                              ? 'bg-red-600/20 text-red-400 border border-red-500/30 font-bold'
                              : 'text-zinc-300 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <span className="flex items-center gap-2.5">
                            <span className="text-base">{ed.badge}</span>
                            <span>{ed.name}</span>
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-red-400" />}
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <span className="hidden sm:inline-block text-zinc-600">|</span>
            <span className="hidden sm:inline-block text-zinc-400 font-medium">
              Independent digital publishing & journalism
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/saved"
              className="flex items-center gap-1.5 hover:text-white transition-colors text-zinc-300"
            >
              <Bookmark className="w-3.5 h-3.5 text-zinc-400" />
              <span>Bookmarks {savedCount > 0 && `(${savedCount})`}</span>
            </Link>
            <Link
              href="/feed.xml"
              target="_blank"
              className="hover:text-amber-400 text-zinc-400 hidden sm:inline-block"
            >
              RSS Feed
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav
        className={`w-full transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md shadow-lg shadow-zinc-950/5 dark:shadow-black/20 border-b border-zinc-200/80 dark:border-white/10'
            : 'bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md border-b border-zinc-200/60 dark:border-white/5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white font-black text-sm font-display shadow-md shadow-red-600/20 group-hover:scale-105 transition-transform">
              TB
            </div>
            <span className="text-xl font-black font-display tracking-tight text-zinc-900 dark:text-white">
              Teachy<span className="text-red-600 dark:text-red-500">Blogs</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                pathname === '/'
                  ? 'text-red-600 dark:text-red-400 bg-red-500/5'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Home
            </Link>
            <Link
              href="/blogs"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                pathname.startsWith('/blogs')
                  ? 'text-red-600 dark:text-red-400 bg-red-500/5'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              All Stories
            </Link>

            <div className="h-4 w-px bg-zinc-200 dark:bg-white/10 mx-1.5" />

            {sections.slice(0, 5).map((sec) => (
              <Link
                key={sec.slug}
                href={`/section/${sec.slug}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  pathname === `/section/${sec.slug}`
                    ? 'text-red-600 dark:text-red-400 bg-red-500/5 font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {sec.name}
              </Link>
            ))}
          </div>

          {/* Utility Tools */}
          <div className="flex items-center gap-2.5">
            {/* Search Trigger Button */}
            <Link
              href="/search"
              className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors flex items-center gap-2 text-xs font-bold"
              aria-label="Search articles"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline-block font-sans text-zinc-400">Search</span>
            </Link>

            <ThemeToggle />

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5"
              aria-label="Toggle menu"
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
              className="lg:hidden bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-white/10 px-6 py-4 overflow-hidden space-y-4 text-sm font-bold"
            >
              <div className="pb-3 border-b border-zinc-100 dark:border-white/5">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-2">
                  Regional Editions
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {EDITIONS.map((ed) => (
                    <Link
                      key={ed.id}
                      href={ed.path}
                      onClick={() => setIsOpen(false)}
                      className={`p-2 rounded-xl text-center text-xs font-bold border ${
                        currentEdition.id === ed.id
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <div className="text-base mb-0.5">{ed.badge}</div>
                      {ed.label}
                    </Link>
                  ))}
                </div>
              </div>

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
                href="/search"
                onClick={() => setIsOpen(false)}
                className="block py-2 text-zinc-700 dark:text-zinc-300"
              >
                Faceted Search
              </Link>

              <div className="pt-2 border-t border-zinc-100 dark:border-white/5 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
                  Verticals & Sections
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {sections.map((sec) => (
                    <Link
                      key={sec.slug}
                      href={`/section/${sec.slug}`}
                      onClick={() => setIsOpen(false)}
                      className="block p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 text-xs hover:text-red-600"
                    >
                      {sec.name}
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
