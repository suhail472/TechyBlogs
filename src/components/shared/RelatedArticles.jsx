'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ArrowUpRight, Clock } from 'lucide-react';
import { getReadingTime } from '@/utils/readingTime';

export default function RelatedArticles({ currentSlug, posts = [] }) {
  const related = useMemo(() => {
    return posts.filter(p => p.slug !== currentSlug).slice(0, 3);
  }, [posts, currentSlug]);

  if (related.length === 0) return null;

  return (
    <section className="mt-20 border-t border-zinc-200/80 dark:border-white/[0.06] pt-16">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-black font-display tracking-tight text-zinc-900 dark:text-white mb-2">
              Related Articles
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm">
              Continue reading with these related posts
            </p>
          </div>
          <Link
            href="/blogs"
            className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors"
          >
            View All
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {related.map((post) => (
            <Link
              key={post._id}
              href={`/blog/${post.slug}`}
              className="group rounded-2xl overflow-hidden premium-card transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-500/[0.06]"
            >
              <div className="aspect-[16/10] overflow-hidden relative">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2.5">
                  {(post.categories || []).slice(0, 2).map(cat => (
                    <span key={cat} className="text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 dark:bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/10 dark:border-indigo-500/15">
                      {cat}
                    </span>
                  ))}
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 font-display leading-snug">
                  {post.title}
                </h3>
                <div className="mt-3 flex items-center gap-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {getReadingTime(post.content)} min
                  </span>
                  <span>•</span>
                  <span suppressHydrationWarning>
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
