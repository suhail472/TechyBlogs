'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  ChevronRight,
  Flame,
  Layers,
  Sparkles,
  MapPin,
  Rss,
  Home,
  FileText,
  Compass,
} from 'lucide-react';
import ThemeToggle from '../shared/ThemeToggle';
import { taxonomyAPI } from '@/services/api';

const EDITIONS = [
  { id: 'global', name: 'Global Edition', path: '/' },
  { id: 'kashmir', name: 'Kashmir Edition', path: '/kashmir' },
  { id: 'india', name: 'India Edition', path: '/edition/india' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [editionDropdownOpen, setEditionDropdownOpen] = useState(false);
  const [sections, setSections] = useState([]);
  const [savedCount, setSavedCount] = useState(0);
  const pathname = usePathname();
  const dropdownRef = useRef(null);
  const drawerRef = useRef(null);
  const scrollYRef = useRef(0);

  // Close drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Body scroll lock for mobile drawer
  useEffect(() => {
    if (isOpen) {
      scrollYRef.current = window.scrollY;
      document.body.classList.add('body-scroll-locked');
      document.body.style.top = `-${scrollYRef.current}px`;
    } else {
      document.body.classList.remove('body-scroll-locked');
      document.body.style.top = '';
      window.scrollTo(0, scrollYRef.current);
    }
    return () => {
      document.body.classList.remove('body-scroll-locked');
      document.body.style.top = '';
    };
  }, [isOpen]);

  // Escape key handler for drawer
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Close dropdown on outside click
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
          { name: 'Travel', slug: 'travel' },
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

  const closeDrawer = useCallback(() => setIsOpen(false), []);

  const currentEdition =
    EDITIONS.find((e) => e.path !== '/' && pathname.startsWith(e.path)) || EDITIONS[0];

  const isActive = (path) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <header className="fixed top-0 z-50 w-full transition-all duration-300 safe-area-top">
      {/* Top Edition & Utility Bar — DESKTOP ONLY */}
      <div className="hidden md:block bg-zinc-950 text-white text-[11px] font-bold py-1.5 px-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Edition Switcher */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setEditionDropdownOpen(!editionDropdownOpen)}
                className="flex items-center gap-1.5 hover:text-red-400 transition-colors uppercase tracking-wider text-[10px] cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-red-500" />
                <span>{currentEdition.name.toUpperCase()}</span>
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

            <span className="text-zinc-500">|</span>
            <span className="text-zinc-400">
              Independent digital publishing & journalism
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/saved"
              className="flex items-center gap-1.5 hover:text-white transition-colors text-zinc-300"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Bookmarks {savedCount > 0 && `(${savedCount})`}</span>
            </Link>
            <Link href="/feed.xml" target="_blank" className="hover:text-amber-400 text-zinc-400">
              RSS Feed
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav
        className={`w-full transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 dark:bg-[#0b0f19]/90 backdrop-blur-md shadow-lg shadow-zinc-950/5 dark:shadow-black/20 border-b border-zinc-200/80 dark:border-white/10'
            : 'bg-white/70 dark:bg-[#0b0f19]/70 backdrop-blur-md border-b border-zinc-200/60 dark:border-white/5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 h-14 sm:h-16 flex items-center justify-between">
          {/* Mobile: Hamburger (left) */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden touch-target rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
            aria-label="Toggle Navigation"
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Brand Logo — centered on mobile, left on desktop */}
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group shrink-0 lg:mr-auto">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white font-black text-xs sm:text-sm font-display shadow-md shadow-red-600/20 group-hover:scale-105 transition-transform">
              TB
            </div>
            <span className="text-lg sm:text-xl font-black font-display tracking-tight text-zinc-900 dark:text-white">
              Techy<span className="text-red-600 dark:text-red-500">Blogs</span>
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

            <Link
              href="/kashmir"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                pathname.startsWith('/kashmir') || pathname === '/edition/kashmir'
                  ? 'text-red-600 dark:text-red-400 bg-red-500/10 font-black'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
              Kashmir
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

          {/* Utility Tools — right side */}
          <div className="flex items-center gap-1 sm:gap-2.5">
            {/* Search Trigger */}
            <Link
              href="/search"
              className="touch-target rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
              aria-label="Search articles"
            >
              <Search className="w-[18px] h-[18px] sm:w-4 sm:h-4" />
            </Link>

            {/* Theme toggle — hidden on tiny mobile, shown sm+ */}
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* ===== MOBILE NAVIGATION DRAWER ===== */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="drawer-backdrop lg:hidden"
              onClick={closeDrawer}
              aria-hidden="true"
            />

            {/* Slide-in drawer from left */}
            <motion.div
              ref={drawerRef}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-[85vw] max-w-[320px] bg-white dark:bg-zinc-950 shadow-2xl lg:hidden flex flex-col safe-area-top"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200/80 dark:border-white/10">
                <Link href="/" onClick={closeDrawer} className="flex items-center gap-2 group">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white font-black text-xs font-display shadow-md shadow-red-600/20">
                    TB
                  </div>
                  <span className="text-lg font-black font-display tracking-tight text-zinc-900 dark:text-white">
                    Techy<span className="text-red-600 dark:text-red-500">Blogs</span>
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="touch-target rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body — scrollable */}
              <div className="flex-1 overflow-y-auto overscroll-contain py-3 px-3">
                {/* Primary Navigation */}
                <div className="space-y-0.5">
                  <DrawerLink href="/" icon={Home} label="Frontpage" active={pathname === '/'} onClick={closeDrawer} />
                  <DrawerLink href="/blogs" icon={FileText} label="All Stories & Archives" active={pathname.startsWith('/blogs')} onClick={closeDrawer} />
                  <DrawerLink href="/search" icon={Search} label="Search Stories" active={pathname === '/search'} onClick={closeDrawer} />
                  <DrawerLink href="/saved" icon={Bookmark} label={`Bookmarks${savedCount > 0 ? ` (${savedCount})` : ''}`} active={pathname === '/saved'} onClick={closeDrawer} />
                </div>

                {/* Kashmir Bureau — highlighted */}
                <div className="mt-4 mb-2">
                  <Link
                    href="/kashmir"
                    onClick={closeDrawer}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm transition-all ${
                      pathname.startsWith('/kashmir')
                        ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                        : 'text-red-600 dark:text-red-400 hover:bg-red-500/5'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <span className="block leading-tight">Kashmir Bureau</span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium uppercase tracking-wider">Regional coverage</span>
                    </div>
                  </Link>
                </div>

                {/* Editorial Sections */}
                <div className="pt-3 border-t border-zinc-100 dark:border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500 block px-3 mb-2">
                    Editorial Desks
                  </span>
                  <div className="space-y-0.5">
                    {sections.map((sec) => (
                      <DrawerLink
                        key={sec.slug}
                        href={`/section/${sec.slug}`}
                        icon={Layers}
                        label={sec.name}
                        active={pathname === `/section/${sec.slug}`}
                        onClick={closeDrawer}
                        compact
                      />
                    ))}
                  </div>
                </div>

                {/* Edition Switcher */}
                <div className="pt-4 mt-3 border-t border-zinc-100 dark:border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500 block px-3 mb-2">
                    Editions
                  </span>
                  <div className="space-y-0.5">
                    {EDITIONS.map((ed) => (
                      <DrawerLink
                        key={ed.id}
                        href={ed.path}
                        icon={Globe}
                        label={ed.name}
                        active={currentEdition.id === ed.id}
                        onClick={closeDrawer}
                        compact
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="px-4 py-3 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between safe-area-bottom">
                <ThemeToggle />
                <Link
                  href="/feed.xml"
                  target="_blank"
                  className="touch-target rounded-xl text-zinc-400 hover:text-amber-500 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                  aria-label="RSS Feed"
                >
                  <Rss className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ===== Drawer Link Component ===== */
function DrawerLink({ href, icon: Icon, label, active, onClick, compact = false }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 rounded-xl font-semibold transition-all ${
        compact ? 'py-2.5 text-[13px]' : 'py-3 text-sm'
      } ${
        active
          ? 'bg-red-500/10 text-red-600 dark:text-red-400 font-bold'
          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white'
      }`}
    >
      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-red-600 dark:text-red-400' : 'text-zinc-400'}`} />
      <span>{label}</span>
      {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-red-400/60" />}
    </Link>
  );
}
