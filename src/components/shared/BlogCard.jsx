'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowUpRight, Clock, Eye } from 'lucide-react';
import { getReadingTime } from '@/utils/readingTime';

const BlogCard = ({ blog }) => {
  const readingTime = useMemo(() => getReadingTime(blog.content), [blog.content]);
  const views = blog.views || 0;
  const formattedViews = views >= 1000 ? (views / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : views.toString();
  return (
    <div
      className="group relative rounded-2xl overflow-hidden transition-all duration-500 premium-card hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/[0.06] dark:hover:shadow-blue-500/[0.03]"
    >
      <Link href={`/blog/${blog.slug}`} className="block">
        <div className="aspect-[16/10] overflow-hidden relative">
          <img
            src={blog.image}
            alt={blog.title}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Floating read icon */}
          <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 dark:bg-white/10 backdrop-blur-md flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-lg">
            <ArrowUpRight className="w-4 h-4 text-zinc-900 dark:text-white" />
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-3 text-xs font-semibold tracking-wider text-zinc-400 dark:text-zinc-500">
            <div className="flex gap-1.5 flex-wrap">
              {(blog.categories || []).map((cat) => (
                <span key={cat} className="text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 dark:bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/10 dark:border-indigo-500/15">
                  {cat}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-zinc-450 dark:text-zinc-500 font-bold shrink-0">
              <span suppressHydrationWarning>
                {blog.date || new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {readingTime}m
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {formattedViews}
              </span>
            </div>
          </div>
          
          <h3 className="text-lg font-bold leading-snug text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 font-display">
            {blog.title}
          </h3>
          
          <p className="mt-2.5 text-sm line-clamp-2 leading-relaxed text-zinc-500 dark:text-zinc-400">
            {blog.excerpt}
          </p>
          
          <div className="mt-5 flex items-center text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 opacity-0 translate-x-[-4px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
            Read Article
            <ArrowUpRight className="ml-1.5 w-3.5 h-3.5" />
          </div>
        </div>
      </Link>
    </div>
  );
};

export default BlogCard;
