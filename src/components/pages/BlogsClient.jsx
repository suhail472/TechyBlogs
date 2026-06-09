'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import BlogCard from '@/components/shared/BlogCard';
import TopLoader from '@/components/shared/TopLoader';
import { Search, BookOpen } from 'lucide-react';

export default function BlogsClient({ initialBlogs = [], initialCategory = 'All' }) {
  const [allBlogs, setAllBlogs] = useState(initialBlogs);
  const [filteredBlogs, setFilteredBlogs] = useState(initialBlogs);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = JSON.parse(localStorage.getItem('techy-blogs-bookmarks') || '[]');
      setBookmarks(saved);
    }
  }, []);

  useEffect(() => {
    setSelectedCategory(initialCategory);
    setShowBookmarksOnly(false);
  }, [initialCategory]);

  useEffect(() => {
    let result = allBlogs;
    if (showBookmarksOnly) {
      result = result.filter(b => bookmarks.includes(b.slug));
    } else if (selectedCategory !== 'All') {
      result = result.filter(b => b.categories?.includes(selectedCategory));
    }
    if (searchQuery.trim()) {
      result = result.filter(
        b =>
          b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredBlogs(result);
  }, [searchQuery, selectedCategory, showBookmarksOnly, bookmarks, allBlogs]);

  const categories = ['All', ...new Set(allBlogs.flatMap(b => b.categories || []))];

  return (
    <div className="pt-36 pb-24 px-6 md:px-12 max-w-7xl mx-auto relative">
      <TopLoader />
      
      {/* Ambient decorative blobs */}
      <div className="absolute top-[10%] left-[-150px] w-96 h-96 bg-blue-500/10 dark:bg-blue-500/5 blur-[120px] rounded-full pointer-events-none -z-10 animate-blob-drift" />
      <div className="absolute top-[50%] right-[-200px] w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/5 blur-[130px] rounded-full pointer-events-none -z-10 animate-blob-drift-reverse" />
      
      <div className="container mx-auto">
        <header className="max-w-2xl mb-12">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <span className="inline-flex items-center gap-2 text-blue-500 font-black tracking-widest uppercase text-xs font-display px-4 py-2 rounded-full bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/15">
              <BookOpen className="w-3.5 h-3.5" />
              Blog Archive
            </span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white font-display">
              Article Archive
            </h1>
            <p className="text-base md:text-lg text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed font-sans">
              Explore design patterns, system architecture essays, styling tips, and thoughts on edge computing.
            </p>
          </motion.div>
        </header>

        {/* Filter Toolbar */}
        <div className="flex flex-col lg:flex-row gap-6 items-center justify-between border-y border-zinc-200/80 dark:border-white/[0.06] py-8 mb-12">
          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setShowBookmarksOnly(false);
                }}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 border ${
                  selectedCategory === cat && !showBookmarksOnly
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-500 text-white shadow-md shadow-blue-500/15'
                    : 'bg-white/60 border-zinc-200/80 text-zinc-500 hover:text-zinc-900 hover:bg-white hover:border-zinc-300 dark:bg-white/[0.03] dark:border-white/[0.06] dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/[0.06] dark:hover:border-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
            
            <button
              onClick={() => {
                setShowBookmarksOnly(true);
                setSelectedCategory('');
                if (typeof window !== 'undefined') {
                  setBookmarks(JSON.parse(localStorage.getItem('techy-blogs-bookmarks') || '[]'));
                }
              }}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 border flex items-center gap-1.5 ${
                showBookmarksOnly
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 border-amber-500 text-white shadow-md shadow-amber-500/15'
                  : 'bg-white/60 border-zinc-200/80 text-amber-600 hover:text-amber-700 hover:bg-white hover:border-zinc-300 dark:bg-white/[0.03] dark:border-white/[0.06] dark:text-amber-500 dark:hover:text-amber-400 dark:hover:bg-white/[0.06] dark:hover:border-white/10'
              }`}
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
              Saved ({bookmarks.length})
            </button>
          </div>

          <div className="relative w-full lg:w-80 shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Filter by keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-5 py-3 rounded-xl border text-xs outline-none transition-all focus:border-blue-400/50 focus:ring-2 focus:ring-blue-500/10 dark:focus:border-blue-500/30 bg-white/80 border-zinc-200/80 text-zinc-900 placeholder-zinc-400 dark:bg-white/[0.03] dark:border-white/[0.06] dark:text-white dark:placeholder-zinc-500"
            />
          </div>
        </div>

        {filteredBlogs.length === 0 ? (
          <div className="py-24 text-center text-zinc-400 dark:text-zinc-500 font-semibold text-sm">
            No articles found matching that filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {filteredBlogs.map((blog, index) => (
              <motion.div
                key={blog._id || blog.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.2), duration: 0.4 }}
              >
                <BlogCard blog={blog} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
