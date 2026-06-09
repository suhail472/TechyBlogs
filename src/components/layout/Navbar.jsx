'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Search, Command } from 'lucide-react';
import ThemeToggle from '../shared/ThemeToggle';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Blogs', path: '/blogs' },
    { name: 'Tags', path: '/tags' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  // Open search modal via custom event
  const openSearch = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
  };

  return (
    <nav
      className={`fixed top-0 z-50 w-full transition-all duration-500 ${
        scrolled
          ? 'py-3.5 backdrop-blur-xl border-b border-zinc-200/60 dark:border-white/[0.06] bg-white/80 dark:bg-[#0b0f19]/80 shadow-[0_4px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.3)]'
          : 'py-5 bg-transparent border-b border-transparent'
      }`}
    >
      <div className="container mx-auto px-6 md:px-12 flex items-center justify-between max-w-7xl">
        <Link href="/" className="group flex items-center gap-2.5 text-xl font-bold tracking-tight shrink-0">
          <div className="w-8 h-8 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-lg flex items-center justify-center font-black text-sm transition-transform group-hover:scale-[1.03]">
            T
          </div>
          <span className="text-zinc-900 dark:text-white font-display">
            Techy<span className="font-extrabold text-blue-600 dark:text-blue-500">Blogs</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-1">
          <div className="flex items-center space-x-8 mr-4">
            {navLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
                <Link
                  key={link.name}
                  href={link.path}
                  className={`text-sm font-semibold tracking-wide relative py-1.5 transition-colors duration-300 ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                  }`}
                >
                  <span>{link.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600 dark:bg-blue-400"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Search trigger */}
          <button
            onClick={openSearch}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-300 border bg-white/60 border-zinc-200/80 text-zinc-400 hover:text-zinc-600 hover:bg-white hover:border-zinc-300 dark:bg-white/[0.03] dark:border-white/[0.06] dark:text-zinc-500 dark:hover:text-zinc-300 dark:hover:bg-white/[0.06] mr-2"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Search</span>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-white/[0.06] text-zinc-400 border border-zinc-200/80 dark:border-white/[0.08] font-mono text-[9px]">
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          </button>

          <div className="pl-4 border-l border-zinc-200 dark:border-zinc-800 flex items-center">
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden flex items-center space-x-3">
          <button
            onClick={openSearch}
            className="p-2 rounded-lg transition-colors text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            <Search className="w-5 h-5" />
          </button>
          <ThemeToggle />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg transition-colors text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden absolute top-full left-0 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl"
          >
            <div className="flex flex-col px-6 py-4 space-y-3 font-semibold">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`text-sm py-2.5 px-3 rounded-lg transition-colors ${
                    pathname === link.path
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : 'text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
