'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import BlogCard from '@/components/shared/BlogCard';
import TopLoader from '@/components/shared/TopLoader';
import { Search, ArrowRight, Clock } from 'lucide-react';
import { getReadingTime } from '@/utils/readingTime';

export default function HomeClient({ initialBlogs = [] }) {
  const [allBlogs, setAllBlogs] = useState(initialBlogs);
  const [filteredBlogs, setFilteredBlogs] = useState(initialBlogs);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Filter logic for search and category selection
  useEffect(() => {
    let result = allBlogs;
    if (selectedCategory !== 'All') {
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
  }, [searchQuery, selectedCategory, allBlogs]);

  // Extract all unique categories
  const categories = ['All', ...new Set(allBlogs.flatMap(b => b.categories || []))];

  const latestBlog = filteredBlogs[0] || allBlogs[0];
  const remainingBlogs = filteredBlogs.slice(1);

  return (
    <div className="pb-12 pt-20 lg:pt-22 relative">
      <TopLoader />
      
      {/* Featured Hero Section */}
      <section className="py-6 px-6 md:px-12 lg:px-16 max-w-[1440px] mx-auto">
        {latestBlog ? (
          <div className="relative p-8 md:py-10 md:px-12 lg:py-12 lg:px-16 rounded-[2.5rem] overflow-hidden glass-card shadow-2xl shadow-zinc-200/20 dark:shadow-black/30">
            {/* Grid pattern background */}
            <div className="absolute inset-0 grid-pattern pointer-events-none" />
            
            {/* Gradient accent line at top */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

            {/* Floating ambient orbs inside the card */}
            <div className="absolute top-8 right-12 w-48 h-48 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[80px] animate-blob-drift pointer-events-none" />
            <div className="absolute bottom-8 left-12 w-56 h-56 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[80px] animate-blob-drift-reverse pointer-events-none" />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10"
            >
              {/* Details */}
              <div className="lg:col-span-5 space-y-5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-500/15 to-indigo-500/15 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider border border-blue-500/20 dark:border-blue-400/15"
                  >
                    Featured Article
                  </motion.div>
                  <div className="flex gap-1.5">
                    {(latestBlog.categories || []).map((cat, i) => (
                      <motion.span 
                        key={cat}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className="text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 dark:bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/10 dark:border-indigo-500/15"
                      >
                        {cat}
                      </motion.span>
                    ))}
                  </div>
                </div>
                
                <h1 className="text-2xl md:text-3xl lg:text-[2.4rem] font-black leading-[1.15] text-zinc-900 dark:text-white tracking-tight font-display">
                  <Link href={`/blog/${latestBlog.slug}`} className="transition-colors hover:text-zinc-900 dark:hover:text-white">
                    {latestBlog.title}
                  </Link>
                </h1>
                
                <p className="text-sm md:text-[15px] leading-relaxed text-zinc-500 dark:text-zinc-400 font-medium">
                  {latestBlog.excerpt}
                </p>

                <div className="flex items-center gap-4 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                  <span>By {latestBlog.author || 'Suheel Hilal'}</span>
                  <span className="text-zinc-300 dark:text-zinc-700">•</span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {getReadingTime(latestBlog.content)} Min Read
                  </span>
                </div>

                <div className="pt-2">
                  <Link
                    href={`/blog/${latestBlog.slug}`}
                    className="group inline-flex items-center px-7 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 dark:shadow-blue-500/10 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/25 font-display"
                  >
                    Read Article
                    <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>

              {/* Banner */}
              <div className="lg:col-span-7">
                <Link href={`/blog/${latestBlog.slug}`} className="block group">
                  <div className="aspect-[16/9.5] rounded-[2rem] overflow-hidden border border-zinc-200/50 dark:border-white/[0.06] bg-zinc-100 dark:bg-zinc-900 shadow-xl shadow-zinc-200/30 dark:shadow-black/30 transition-all duration-500 group-hover:scale-[1.01] group-hover:shadow-2xl group-hover:shadow-blue-500/10">
                    <img
                      src={latestBlog.image}
                      alt={latestBlog.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                </Link>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="text-center py-20 text-zinc-400 uppercase font-black text-xs">No articles available.</div>
        )}
      </section>

      {/* Categories & Search */}
      <section className="py-6 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6 items-center justify-between border-y border-zinc-200/80 dark:border-white/[0.06] py-8">
          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 border ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-500 text-white shadow-md shadow-blue-500/15 dark:shadow-blue-500/10'
                    : 'bg-white/60 border-zinc-200/80 text-zinc-500 hover:text-zinc-900 hover:bg-white hover:border-zinc-300 dark:bg-white/[0.03] dark:border-white/[0.06] dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/[0.06] dark:hover:border-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-80 shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-5 py-3 rounded-xl border text-xs outline-none transition-all focus:border-blue-400/50 focus:ring-2 focus:ring-blue-500/10 dark:focus:border-blue-500/30 bg-white/80 border-zinc-200/80 text-zinc-900 placeholder-zinc-400 dark:bg-white/[0.03] dark:border-white/[0.06] dark:text-white dark:placeholder-zinc-500"
            />
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="px-6 md:px-12 max-w-7xl mx-auto pt-4">
        {remainingBlogs.length === 0 ? (
          <div className="py-24 text-center text-zinc-400 dark:text-zinc-500 font-bold text-sm">
            No matching articles found. Try another query or category.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {remainingBlogs.map((blog, index) => (
              <motion.div
                key={blog._id || blog.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.08, 0.25), duration: 0.4 }}
              >
                <BlogCard blog={blog} />
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
