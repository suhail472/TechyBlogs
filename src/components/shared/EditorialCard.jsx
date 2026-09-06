'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Clock, Eye, Flame, Star, ArrowUpRight, CheckCircle2, ChevronRight, User, Activity } from 'lucide-react';
import { getReadingTime } from '@/utils/readingTime';
import { getEditorialBadge } from '@/lib/services/layoutStrategy';
import EditorialImage from './EditorialImage';

const formatViews = (views = 0) => {
  if (views >= 1000000) return (views / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (views >= 1000) return (views / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return views.toString();
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'Recently';
  try {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateStr));
  } catch (e) {
    return 'Recently';
  }
};

const getCategoryLabel = (blog) => {
  const section = blog.primarySection?.name || blog.categories?.[0] || 'Dispatch';
  const region = blog.primaryRegion?.name || (blog.editions?.[0]?.name ? blog.editions[0].name.replace(' Edition', '') : '');
  if (region && !section.toLowerCase().includes(region.toLowerCase())) {
    return `${section} · ${region}`;
  }
  return section;
};

/**
 * EditorialCard — 10/10 World-Class Publication Card System
 * Supports variants: 'lead', 'spotlight-single', 'featured', 'horizontal', 'compact', 'trending', 'review', 'review-spotlight', 'opinion'
 */
export default function EditorialCard({
  blog,
  variant = 'featured',
  rank = 1,
  showExcerpt = true,
  showAuthor = true,
  priority = false,
  isDarkSection = false,
  className = '',
}) {
  const readingTime = useMemo(() => getReadingTime(blog?.content || blog?.excerpt || ''), [blog]);
  const dateText = formatDate(blog?.publishedAt || blog?.createdAt || blog?.date);
  const category = getCategoryLabel(blog);
  const views = formatViews(blog?.views || 0);
  const badge = getEditorialBadge(blog);

  if (!blog) return null;

  // 1. LEAD HERO VARIANT (Commanding visual hero)
  if (variant === 'lead') {
    return (
      <article className={`group relative flex flex-col justify-between ${className}`}>
        <Link href={`/blog/${blog.slug}`} className="block">
          <div className="aspect-[16/9] overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900 relative mb-5 border border-zinc-200/80 dark:border-white/10 shadow-sm">
            <EditorialImage
              src={blog.image}
              alt={blog.title}
              category={category}
              title={blog.title}
              priority={priority}
              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
            />
            {badge && (
              <span className={`absolute top-4 left-4 inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-md whitespace-nowrap ${badge.classes}`}>
                {badge.type === 'breaking' && <Flame className="w-3 h-3" />}
                {badge.type === 'developing' && <Activity className="w-3 h-3" />}
                <span>{badge.label}</span>
              </span>
            )}
            <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-zinc-950/80 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-x-2 gap-y-1 text-xs flex-wrap">
              <span className="text-[11px] font-black uppercase tracking-[0.22em] text-red-600 dark:text-red-400">
                {category}
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">/</span>
              <span className="text-zinc-500 dark:text-zinc-400 font-medium whitespace-nowrap">{dateText}</span>
              <span className="text-zinc-300 dark:text-zinc-700">/</span>
              <span className="text-zinc-500 dark:text-zinc-400 font-medium whitespace-nowrap">{readingTime} min read</span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl lg:text-[2.4rem] font-black leading-[1.12] tracking-tight text-zinc-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-200">
              {blog.title}
            </h2>

            {showExcerpt && (blog.subtitle || blog.excerpt) && (
              <p className="text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-300 line-clamp-3 font-sans">
                {blog.subtitle || blog.excerpt}
              </p>
            )}

            {showAuthor && (
              <div className="flex items-center gap-2.5 pt-2">
                <div className="w-7 h-7 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 grid place-items-center text-xs font-black font-display">
                  {blog.author ? blog.author[0] : 'T'}
                </div>
                <div className="text-xs">
                  <span className="font-bold text-zinc-900 dark:text-white">{blog.author || 'Editorial Bureau'}</span>
                  <span className="text-zinc-400 text-[11px] ml-1.5 font-medium">· Staff Correspondent</span>
                </div>
              </div>
            )}
          </div>
        </Link>
      </article>
    );
  }

  // 2. SPOTLIGHT SINGLE VARIANT (For desk sections with 1 story)
  if (variant === 'spotlight-single') {
    return (
      <article className={`group rounded-3xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-white/10 p-6 md:p-8 transition-all hover:shadow-xl ${className}`}>
        <Link href={`/blog/${blog.slug}`} className="grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 aspect-[16/10] rounded-2xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 relative">
            <EditorialImage
              src={blog.image}
              alt={blog.title}
              category={category}
              title={blog.title}
              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
            />
            {badge && (
              <span className={`absolute top-3.5 left-3.5 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.18em] px-2.5 py-1 rounded-md whitespace-nowrap ${badge.classes}`}>
                <span>{badge.label}</span>
              </span>
            )}
          </div>

          <div className="lg:col-span-6 space-y-3.5">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600 dark:text-red-400">
                {category}
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">/</span>
              <span className="text-zinc-500 font-medium">{dateText}</span>
              <span className="text-zinc-300 dark:text-zinc-700">/</span>
              <span className="text-zinc-500 font-medium">{readingTime} min read</span>
            </div>

            <h3 className="font-display text-2xl sm:text-3xl font-black leading-tight text-zinc-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-200">
              {blog.title}
            </h3>

            {showExcerpt && (blog.subtitle || blog.excerpt) && (
              <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed line-clamp-3">
                {blog.subtitle || blog.excerpt}
              </p>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-zinc-200/80 dark:border-white/10 text-xs">
              <span className="font-bold text-zinc-800 dark:text-zinc-200">{blog.author || 'Staff Writer'}</span>
              <span className="text-red-600 dark:text-red-400 font-bold flex items-center gap-1 group-hover:gap-1.5 transition-all">
                Read Full Story <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  // 3. TRENDING / MOST READ VARIANT (Interactive numbered ranking)
  if (variant === 'trending') {
    const formattedRank = rank < 10 ? `0${rank}` : `${rank}`;
    return (
      <article className={`group flex items-start gap-3.5 py-3.5 border-b border-zinc-100 dark:border-white/5 last:border-0 ${className}`}>
        <span className="font-mono text-sm font-bold text-zinc-400 dark:text-zinc-500 group-hover:text-red-600 transition-colors duration-200 select-none shrink-0 w-7 pt-0.5">
          {formattedRank}
        </span>
        <div className="space-y-1 flex-1 min-w-0">
          <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
            {category}
          </span>
          <Link href={`/blog/${blog.slug}`} className="block">
            <h4 className="font-display text-sm font-bold leading-snug text-zinc-900 dark:text-zinc-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-200 line-clamp-2">
              {blog.title}
            </h4>
          </Link>
          <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-medium pt-0.5">
            <span>{readingTime}m read</span>
            {views !== '0' && <span>· {views} views</span>}
          </div>
        </div>
      </article>
    );
  }

  // 4. HORIZONTAL STORY ROW
  if (variant === 'horizontal') {
    return (
      <article className={`group border-b border-zinc-200/80 dark:border-white/10 py-5 last:border-0 ${className}`}>
        <Link href={`/blog/${blog.slug}`} className="grid grid-cols-[1fr,120px] sm:grid-cols-[1fr,160px] gap-4 sm:gap-6 items-start">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-red-600 dark:text-red-400">
                {category}
              </span>
              <span className="text-zinc-400 text-xs">·</span>
              <span className="text-xs text-zinc-500 font-medium">{dateText}</span>
            </div>

            <h3 className="font-display text-base sm:text-lg font-bold leading-snug text-zinc-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-200">
              {blog.title}
            </h3>

            {showExcerpt && (
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                {blog.excerpt}
              </p>
            )}

            <div className="flex items-center gap-3 pt-1 text-[11px] text-zinc-400 font-medium">
              <span>{readingTime} min read</span>
              {views !== '0' && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {views}</span>
                </>
              )}
            </div>
          </div>

          <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-white/10 shrink-0">
            <EditorialImage
              src={blog.image}
              alt={blog.title}
              category={category}
              title={blog.title}
              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
            />
          </div>
        </Link>
      </article>
    );
  }

  // 5. REVIEW SPOTLIGHT VARIANT (Rich scorecard benchmark)
  if (variant === 'review-spotlight') {
    const rating = blog.contentMetadata?.reviewMetadata?.rating || 4.8;
    const pros = blog.contentMetadata?.reviewMetadata?.pros || [];
    const cons = blog.contentMetadata?.reviewMetadata?.cons || [];
    const verdict = blog.contentMetadata?.reviewMetadata?.verdict;

    return (
      <article className={`group rounded-3xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-white/10 p-6 md:p-8 transition-all hover:shadow-xl ${className}`}>
        <Link href={`/blog/${blog.slug}`} className="grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 aspect-[16/10] rounded-2xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 relative">
            <EditorialImage
              src={blog.image}
              alt={blog.title}
              category={category}
              title={blog.title}
              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
            />
            <div className="absolute top-4 right-4 bg-zinc-950/90 text-white backdrop-blur-md px-3 py-1.5 rounded-xl text-sm font-black font-display flex items-center gap-1.5 shadow-lg border border-white/10">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>{rating}</span>
              <span className="text-zinc-400 text-[10px]">/ 5.0</span>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
                Editorial Review Spotlight
              </span>
              <span className="text-zinc-300 dark:text-zinc-700 text-xs">/</span>
              <span className="text-xs text-zinc-500 font-medium">{dateText}</span>
            </div>

            <h3 className="font-display text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-200">
              {blog.title}
            </h3>

            {verdict && (
              <p className="text-sm text-zinc-600 dark:text-zinc-300 italic leading-relaxed border-l-2 border-amber-500 pl-3.5 font-serif">
                "{verdict}"
              </p>
            )}

            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
              {blog.excerpt}
            </p>

            {(pros.length > 0 || cons.length > 0) && (
              <div className="grid sm:grid-cols-2 gap-3 pt-2">
                {pros.slice(0, 2).map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="font-bold">+</span>
                    <span className="truncate">{p}</span>
                  </div>
                ))}
                {cons.slice(0, 2).map((c, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 font-medium">
                    <span className="font-bold">−</span>
                    <span className="truncate">{c}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5 group-hover:gap-2 transition-all">
              <span>Read complete scorecard & benchmarks</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </Link>
      </article>
    );
  }

  // 6. STANDARD REVIEW SCORECARD VARIANT (For 2+ reviews)
  if (variant === 'review') {
    const rating = blog.contentMetadata?.reviewMetadata?.rating || 4.8;
    return (
      <article className={`group rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/10 p-5 flex flex-col justify-between transition-all hover:shadow-lg ${className}`}>
        <Link href={`/blog/${blog.slug}`} className="block space-y-3">
          <div className="aspect-[16/9] rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 relative">
            <EditorialImage
              src={blog.image}
              alt={blog.title}
              category={category}
              title={blog.title}
              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
            />
            <div className="absolute top-3 right-3 bg-zinc-950/90 text-white backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-black font-display flex items-center gap-1 shadow-md">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{rating}</span>
            </div>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">
              Gear Review
            </span>
            <h3 className="font-display text-base font-bold text-zinc-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 mt-1 line-clamp-2 transition-colors duration-200">
              {blog.title}
            </h3>
            {blog.contentMetadata?.reviewMetadata?.verdict && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 italic mt-2 line-clamp-2 font-serif">
                "{blog.contentMetadata.reviewMetadata.verdict}"
              </p>
            )}
          </div>
        </Link>
      </article>
    );
  }

  // 7. OPINION / COLUMNIST VARIANT (Literary Serif Voice)
  if (variant === 'opinion') {
    return (
      <article className={`group border-l-2 border-red-600 pl-4 py-2 space-y-2 ${className}`}>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600 dark:text-red-400">
            Opinion & Perspective
          </span>
        </div>
        <Link href={`/blog/${blog.slug}`} className="block">
          <h3 className="font-serif text-lg sm:text-xl font-bold leading-snug text-zinc-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-200">
            {blog.title}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
            {blog.excerpt}
          </p>
        </Link>
        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 pt-1 font-sans">
          By {blog.author || 'Editorial Columnist'}
        </p>
      </article>
    );
  }

  // 8. COMPACT FEED VARIANT
  if (variant === 'compact') {
    return (
      <article className={`group py-3 border-b border-zinc-200/60 dark:border-white/5 last:border-0 ${className}`}>
        <Link href={`/blog/${blog.slug}`} className="block space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-[0.16em] text-red-600 dark:text-red-400">
              {category}
            </span>
            <span className="text-zinc-400 text-[10px]">·</span>
            <span className="text-[10px] text-zinc-400">{dateText}</span>
          </div>
          <h4 className="font-display text-sm font-bold leading-snug text-zinc-900 dark:text-zinc-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-200 line-clamp-2">
            {blog.title}
          </h4>
        </Link>
      </article>
    );
  }

  // 9. DEFAULT: FEATURED CARD
  return (
    <article className={`group flex flex-col justify-between rounded-2xl border overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl bg-white dark:bg-zinc-900/60 border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white ${className}`}>
      <Link href={`/blog/${blog.slug}`} className="block">
        <div className="aspect-[16/10] overflow-hidden bg-zinc-100 dark:bg-zinc-800 relative">
          <EditorialImage
            src={blog.image}
            alt={blog.title}
            category={category}
            title={blog.title}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
          />
          {badge && (
            <span className={`absolute top-3 left-3 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md whitespace-nowrap ${badge.classes}`}>
              <span>{badge.label}</span>
            </span>
          )}
        </div>

        <div className="p-5 sm:p-6 space-y-2.5">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-red-600 dark:text-red-400">
              {category}
            </span>
            <span className="text-[11px] text-zinc-400 font-medium">{dateText}</span>
          </div>

          <h3 className="font-display text-lg font-bold leading-snug transition-colors duration-200 line-clamp-2 text-zinc-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400">
            {blog.title}
          </h3>

          {showExcerpt && (
            <p className="text-xs sm:text-sm line-clamp-2 leading-relaxed font-sans text-zinc-500 dark:text-zinc-400">
              {blog.excerpt}
            </p>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-white/5 text-[11px] text-zinc-400 font-medium">
            <span className="truncate max-w-[150px] font-bold text-zinc-700 dark:text-zinc-300">
              {blog.author || 'Staff Writer'}
            </span>
            <span className="flex items-center gap-1 opacity-80">
              <Clock className="w-3 h-3" /> {readingTime}m
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
