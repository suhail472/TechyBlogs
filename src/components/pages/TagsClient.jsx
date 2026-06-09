'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Tag, Hash, Search, Layers } from 'lucide-react';
import TopLoader from '@/components/shared/TopLoader';

export default function TagsClient({ tags = [], categories = [] }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTags = tags.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Generate a gradient for tag cards based on index
  const gradients = [
    'from-blue-500/10 to-indigo-500/10 border-blue-500/15 hover:border-blue-500/30',
    'from-indigo-500/10 to-violet-500/10 border-indigo-500/15 hover:border-indigo-500/30',
    'from-violet-500/10 to-purple-500/10 border-violet-500/15 hover:border-violet-500/30',
    'from-cyan-500/10 to-blue-500/10 border-cyan-500/15 hover:border-cyan-500/30',
    'from-emerald-500/10 to-teal-500/10 border-emerald-500/15 hover:border-emerald-500/30',
    'from-amber-500/10 to-orange-500/10 border-amber-500/15 hover:border-amber-500/30',
    'from-rose-500/10 to-pink-500/10 border-rose-500/15 hover:border-rose-500/30',
    'from-fuchsia-500/10 to-pink-500/10 border-fuchsia-500/15 hover:border-fuchsia-500/30',
  ];

  return (
    <div className="pt-36 pb-24 px-6 md:px-12 max-w-7xl mx-auto relative">
      <TopLoader />

      {/* Ambient decorative blobs */}
      <div className="absolute top-[10%] left-[-150px] w-96 h-96 bg-violet-500/10 dark:bg-violet-500/5 blur-[120px] rounded-full pointer-events-none -z-10 animate-blob-drift" />
      <div className="absolute top-[50%] right-[-200px] w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-500/5 blur-[130px] rounded-full pointer-events-none -z-10 animate-blob-drift-reverse" />

      <div className="container mx-auto">
        <header className="max-w-2xl mb-12">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <span className="inline-flex items-center gap-2 text-blue-500 font-black tracking-widest uppercase text-xs font-display px-4 py-2 rounded-full bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/15">
              <Tag className="w-3.5 h-3.5" />
              Topics
            </span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white font-display">
              Browse by Tags
            </h1>
            <p className="text-base md:text-lg text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed font-sans">
              Discover articles organized by topic. Click any tag to find related content.
            </p>
          </motion.div>
        </header>

        {/* Search Filter */}
        <div className="mb-10">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Filter tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-5 py-3 rounded-xl border text-xs outline-none transition-all focus:border-blue-400/50 focus:ring-2 focus:ring-blue-500/10 dark:focus:border-blue-500/30 bg-white/80 border-zinc-200/80 text-zinc-900 placeholder-zinc-400 dark:bg-white/[0.03] dark:border-white/[0.06] dark:text-white dark:placeholder-zinc-500"
            />
          </div>
        </div>

        {/* Categories Section */}
        {filteredCategories.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center gap-2 mb-6">
              <Layers className="w-4 h-4 text-indigo-500" />
              <h2 className="text-lg font-black uppercase tracking-wider text-zinc-900 dark:text-white font-display">
                Categories
              </h2>
              <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 dark:bg-white/[0.06] px-2 py-0.5 rounded-full">
                {filteredCategories.length}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredCategories.map((cat, idx) => (
                <motion.div
                  key={cat.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.04, 0.2) }}
                >
                  <Link
                    href={`/blogs?category=${encodeURIComponent(cat.name)}`}
                    className={`block p-4 rounded-2xl bg-gradient-to-br ${gradients[idx % gradients.length]} border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Layers className="w-4 h-4 text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 bg-white/60 dark:bg-white/[0.06] px-2 py-0.5 rounded-full">
                        {cat.count}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white font-display">
                      {cat.name}
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                      {cat.count} {cat.count === 1 ? 'article' : 'articles'}
                    </p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Tags Section */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Hash className="w-4 h-4 text-blue-500" />
            <h2 className="text-lg font-black uppercase tracking-wider text-zinc-900 dark:text-white font-display">
              Tags
            </h2>
            <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 dark:bg-white/[0.06] px-2 py-0.5 rounded-full">
              {filteredTags.length}
            </span>
          </div>

          {filteredTags.length === 0 ? (
            <div className="py-16 text-center text-zinc-400 dark:text-zinc-500 font-semibold text-sm">
              No tags found matching that filter.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {filteredTags.map((tag, idx) => (
                <motion.div
                  key={tag.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min(idx * 0.03, 0.2) }}
                >
                  <Link
                    href={`/blogs?category=${encodeURIComponent(tag.name)}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider glass-card hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 group text-zinc-700 dark:text-zinc-300"
                  >
                    <Hash className="w-3 h-3 text-blue-500 group-hover:scale-110 transition-transform" />
                    {tag.name}
                    <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-white/[0.06] px-1.5 py-0.5 rounded-full">
                      {tag.count}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
