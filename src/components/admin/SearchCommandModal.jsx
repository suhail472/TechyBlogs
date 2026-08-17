'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, Layers, MapPin, Users, ArrowRight, X, Sparkles } from 'lucide-react';
import { postAPI, taxonomyAPI, authorAPI } from '@/services/api';

export default function SearchCommandModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ stories: [], topics: [], regions: [], authors: [] });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ stories: [], topics: [], regions: [], authors: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ stories: [], topics: [], regions: [], authors: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [postsRes, taxRes, authRes] = await Promise.allSettled([
          postAPI.getAllPosts({ search: query, limit: 5 }),
          taxonomyAPI.getAll({ search: query }),
          authorAPI.getAll(),
        ]);

        const stories = postsRes.status === 'fulfilled' && postsRes.value?.posts ? postsRes.value.posts.slice(0, 5) : [];
        const taxonomies = taxRes.status === 'fulfilled' && taxRes.value?.data ? taxRes.value.data : [];
        const authors = authRes.status === 'fulfilled' && authRes.value?.data 
          ? authRes.value.data.filter(a => a.name?.toLowerCase().includes(query.toLowerCase())).slice(0, 4) 
          : [];

        const topics = taxonomies.filter(t => t.kind === 'topic' || t.kind === 'section').slice(0, 4);
        const regions = taxonomies.filter(t => t.kind === 'region' || t.kind === 'edition').slice(0, 4);

        setResults({ stories, topics, regions, authors });
      } catch (e) {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (url) => {
    onClose();
    router.push(url);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-start justify-center pt-20 px-4 bg-zinc-950/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          className="w-full max-w-2xl rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
        >
          {/* Search Input Bar */}
          <div className="flex items-center px-4 py-3.5 border-b border-zinc-200 dark:border-white/10 gap-3">
            <Search className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search stories, topics, regional bureaus, or correspondents..."
              className="w-full text-sm font-medium bg-transparent outline-none text-zinc-900 dark:text-white placeholder-zinc-400 font-sans"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded border border-zinc-200 dark:border-white/10">
              ESC
            </kbd>
          </div>

          {/* Results Container */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
            {loading && (
              <div className="py-8 text-center text-zinc-400 text-xs font-medium">
                Searching newsroom database...
              </div>
            )}

            {!loading && !query && (
              <div className="py-8 text-center text-zinc-400 space-y-1">
                <p className="font-semibold text-zinc-700 dark:text-zinc-300 text-xs">Global Newsroom Command</p>
                <p className="text-[11px] text-zinc-400">Type to search articles, taxonomy branches, or staff correspondents.</p>
              </div>
            )}

            {!loading && query && results.stories.length === 0 && results.topics.length === 0 && results.authors.length === 0 && (
              <div className="py-8 text-center text-zinc-400 text-xs">
                No matching newsroom records found for "{query}".
              </div>
            )}

            {/* Stories */}
            {results.stories.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-2.5 mb-1.5 font-mono">
                  Stories
                </p>
                <div className="space-y-0.5">
                  {results.stories.map((story) => (
                    <button
                      key={story._id || story.slug}
                      onClick={() => handleSelect(`/admin/edit/${story._id || story.slug}`)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 text-left group transition-colors"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <FileText className="w-3.5 h-3.5 text-zinc-400 group-hover:text-red-500 shrink-0" />
                        <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate">{story.title}</span>
                      </div>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 shrink-0 ml-2">
                        {story.status || 'Published'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Topics & Sections */}
            {results.topics.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-2.5 mb-1.5 font-mono">
                  Topics & Sections
                </p>
                <div className="space-y-0.5">
                  {results.topics.map((tax) => (
                    <button
                      key={tax._id || tax.slug}
                      onClick={() => handleSelect(`/admin/taxonomy`)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 text-left group transition-colors"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Layers className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">{tax.name}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">({tax.kind})</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Regions & Bureaus */}
            {results.regions.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-2.5 mb-1.5 font-mono">
                  Bureaus & Regions
                </p>
                <div className="space-y-0.5">
                  {results.regions.map((reg) => (
                    <button
                      key={reg._id || reg.slug}
                      onClick={() => handleSelect(`/admin/taxonomy`)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 text-left group transition-colors"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">{reg.name}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Authors */}
            {results.authors.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-2.5 mb-1.5 font-mono">
                  Authors & Correspondents
                </p>
                <div className="space-y-0.5">
                  {results.authors.map((auth) => (
                    <button
                      key={auth._id || auth.slug}
                      onClick={() => handleSelect(`/admin/authors`)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 text-left group transition-colors"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Users className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">{auth.name}</span>
                        <span className="text-[10px] text-zinc-400">{auth.role || 'Staff Writer'}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
