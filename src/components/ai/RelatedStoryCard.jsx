'use client';

import Link from 'next/link';
import { ArrowUpRight, BookOpen } from 'lucide-react';

export default function RelatedStoryCard({ story }) {
  if (!story) return null;

  return (
    <Link
      href={story.url || `/blog/${story.slug}`}
      className="group block p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/10 hover:border-red-500/50 dark:hover:border-red-500/50 transition-all shadow-xs"
    >
      <div className="flex items-start gap-3">
        {story.image ? (
          <img
            src={story.image}
            alt=""
            className="w-14 h-14 rounded-xl object-cover border border-zinc-200/80 dark:border-white/10 shrink-0 group-hover:scale-102 transition-transform"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-red-600/10 text-red-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-red-600 dark:text-red-400 font-mono">
              {story.category || 'Story'}
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-red-600 transition-colors shrink-0" />
          </div>
          <h4 className="font-bold text-xs text-zinc-900 dark:text-white line-clamp-2 group-hover:text-red-600 transition-colors leading-snug">
            {story.title}
          </h4>
          {story.publishedAt && (
            <p className="text-[10px] text-zinc-400 font-mono mt-1">
              {story.publishedAt}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
