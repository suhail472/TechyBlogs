'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight, FileText, Command } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { postAPI } from '@/services/api';

export default function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const router = useRouter();
  const debounceRef = useRef(null);

  // Keyboard shortcut to open/close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Search with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await postAPI.searchPosts(query);
        setResults(response.posts || []);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Search failed:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const navigateToResult = useCallback((slug) => {
    setIsOpen(false);
    router.push(`/blog/${slug}`);
  }, [router]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      navigateToResult(results[selectedIndex].slug);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]"
          onClick={() => setIsOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-[90vw] max-w-xl rounded-2xl overflow-hidden border shadow-2xl bg-white border-zinc-200/80 dark:bg-[#111726] dark:border-white/[0.08] dark:shadow-black/40"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-200/80 dark:border-white/[0.06]">
              <Search className="w-5 h-5 text-zinc-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search articles..."
                className="w-full text-sm bg-transparent outline-none text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 font-medium"
              />
              <button
                onClick={() => setIsOpen(false)}
                className="shrink-0 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-all text-xs font-bold"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[400px] overflow-y-auto">
              {loading && (
                <div className="px-5 py-8 text-center text-zinc-400 text-xs font-bold">
                  Searching...
                </div>
              )}

              {!loading && query && results.length === 0 && (
                <div className="px-5 py-8 text-center">
                  <p className="text-zinc-400 text-xs font-bold">No articles found for &quot;{query}&quot;</p>
                </div>
              )}

              {!loading && results.length > 0 && (
                <div className="py-2">
                  {results.map((post, idx) => (
                    <button
                      key={post._id}
                      onClick={() => navigateToResult(post.slug)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full text-left px-5 py-3.5 flex items-start gap-3.5 transition-all duration-150 ${
                        selectedIndex === idx
                          ? 'bg-blue-500/10 dark:bg-blue-500/[0.08]'
                          : 'hover:bg-zinc-50 dark:hover:bg-white/[0.03]'
                      }`}
                    >
                      <FileText className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                          {post.title}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1 font-medium">
                          {post.excerpt}
                        </p>
                        <div className="flex gap-1.5 mt-1.5">
                          {(post.categories || []).slice(0, 2).map(cat => (
                            <span key={cat} className="text-[8px] font-black uppercase tracking-wider text-indigo-500 bg-indigo-500/5 px-1.5 py-0.5 rounded">
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ArrowRight className={`w-4 h-4 shrink-0 mt-0.5 transition-all ${
                        selectedIndex === idx ? 'text-blue-500 translate-x-0.5' : 'text-zinc-300 dark:text-zinc-600'
                      }`} />
                    </button>
                  ))}
                </div>
              )}

              {!loading && !query && (
                <div className="px-5 py-8 text-center">
                  <Search className="w-8 h-8 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
                  <p className="text-xs font-bold text-zinc-400">Type to search articles</p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Search by title, content, or tags</p>
                </div>
              )}
            </div>

            {/* Footer hints */}
            <div className="px-5 py-3 border-t border-zinc-200/80 dark:border-white/[0.06] flex items-center justify-between text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-white/[0.06] text-zinc-500 border border-zinc-200 dark:border-white/[0.08] font-mono text-[9px]">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-white/[0.06] text-zinc-500 border border-zinc-200 dark:border-white/[0.08] font-mono text-[9px]">↵</kbd>
                  Open
                </span>
              </div>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-white/[0.06] text-zinc-500 border border-zinc-200 dark:border-white/[0.08] font-mono text-[9px]">Esc</kbd>
                Close
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Exported trigger button for Navbar
export function SearchTrigger({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-300 border bg-white/60 border-zinc-200/80 text-zinc-400 hover:text-zinc-600 hover:bg-white hover:border-zinc-300 dark:bg-white/[0.03] dark:border-white/[0.06] dark:text-zinc-500 dark:hover:text-zinc-300 dark:hover:bg-white/[0.06]"
    >
      <Search className="w-3.5 h-3.5" />
      <span className="hidden lg:inline">Search</span>
      <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-white/[0.06] text-zinc-400 border border-zinc-200/80 dark:border-white/[0.08] font-mono text-[9px] ml-1">
        <Command className="w-2.5 h-2.5" />K
      </kbd>
    </button>
  );
}
