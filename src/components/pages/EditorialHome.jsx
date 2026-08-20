'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Clock,
  Flame,
  MapPin,
  TrendingUp,
  Sparkles,
  Layers,
  Cpu,
  GraduationCap,
  Star,
  BookOpen,
  CheckCircle2,
  Mail,
  ChevronRight,
  Feather,
} from 'lucide-react';
import EditorialCard from '@/components/shared/EditorialCard';
import { getDeskLayout } from '@/lib/services/layoutStrategy';
import useToastStore from '@/store/useToastStore';
import { subscriberAPI } from '@/services/api';

export default function EditorialHome({ posts = [] }) {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const { addToast } = useToastStore();

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubscribing(true);
    try {
      const res = await subscriberAPI.subscribe(newsletterEmail.trim());
      addToast(res.message || 'Subscribed successfully to The Morning Briefing!', 'success');
      setNewsletterEmail('');
    } catch (err) {
      addToast(err.message || 'Subscription received!', 'info');
      setNewsletterEmail('');
    } finally {
      setSubscribing(false);
    }
  };

  const dataset = Array.isArray(posts) ? posts : [];
  const ordered = [...dataset].sort(
    (a, b) => new Date(b.publishedAt || b.createdAt || 0) - new Date(a.publishedAt || a.createdAt || 0)
  );

  // Genuinely breaking items only
  const breaking = ordered.filter((p) => p.breaking).slice(0, 3);
  const heroStory = ordered.find((p) => p.featured) || ordered[0];
  const secondaryLead = ordered.filter((p) => (p._id || p.slug) !== (heroStory?._id || heroStory?.slug));

  // Specialized Desks with dynamic layout strategy
  const techStories = dataset.filter((p) =>
    /tech|code|react|ai|hardware|next\.js|software|python/i.test((p.categories || []).join(' ') + p.title)
  );
  const techLayout = getDeskLayout(techStories);

  const kashmirStories = dataset.filter((p) =>
    /kashmir|srinagar|dal lake|gulmarg|jammu/i.test((p.categories || []).join(' ') + p.title)
  );
  const kashmirLayout = getDeskLayout(kashmirStories);

  const educationStories = dataset.filter((p) =>
    /education|admissions|university|exam|syllabus|tutorial|guide/i.test((p.categories || []).join(' ') + p.title)
  );
  const educationLayout = getDeskLayout(educationStories);

  const reviewStories = dataset.filter((p) =>
    p.contentType === 'review' || /review|m4|macbook|hardware|scorecard/i.test((p.categories || []).join(' ') + p.title)
  );
  const reviewLayout = getDeskLayout(reviewStories);

  const opinionStories = dataset.filter((p) =>
    p.contentType === 'opinion' || /opinion|analysis|editorial|future|perspective/i.test((p.categories || []).join(' ') + p.title)
  );

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <main className="pt-24 pb-20">
      {/* 1. Restrained Breaking Ticker */}
      {breaking.length > 0 && (
        <div className="bg-zinc-950 text-white border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-2 flex items-center gap-3 overflow-x-auto no-scrollbar">
            <span className="shrink-0 inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] bg-red-600 px-2.5 py-0.5 rounded-md shadow-sm">
              <Flame className="w-3 h-3" /> Breaking
            </span>
            <div className="h-3.5 w-px bg-white/20 shrink-0" />
            <div className="flex items-center gap-6 shrink-0 text-xs font-semibold">
              {breaking.map((post) => (
                <Link
                  key={String(post._id || post.slug)}
                  href={`/blog/${post.slug}`}
                  className="hover:text-red-400 transition-colors flex items-center gap-2"
                >
                  <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                    {post.primarySection?.name || post.categories?.[0] || 'News'}:
                  </span>
                  <span>{post.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* 2. High-Information Publication Masthead */}
        <div className="py-4 md:py-6 border-b border-zinc-200/80 dark:border-white/10 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-red-600" />
            <p className="text-[11px] uppercase tracking-[0.24em] font-black text-zinc-600 dark:text-zinc-400">
              Independent Digital Publishing · Global Desks & Regional Bureaus
            </p>
          </div>
          <div className="text-[11px] font-mono font-medium text-zinc-400 dark:text-zinc-500">
            {todayFormatted}
          </div>
        </div>

        {/* 3. Hero Ensemble: Dominant Lead + Most Read (when multiple stories exist) */}
        {heroStory && (
          <section className={`grid ${secondaryLead.length > 0 ? 'lg:grid-cols-12' : 'grid-cols-1'} gap-8 lg:gap-10 pt-6 pb-10 border-b border-zinc-200/80 dark:border-white/10`}>
            {/* Primary Lead Story */}
            <div className={secondaryLead.length > 0 ? 'lg:col-span-7 lg:border-r lg:pr-10 border-zinc-200/80 dark:border-white/10' : 'w-full'}>
              <EditorialCard blog={heroStory} variant="lead" priority={true} />
            </div>

            {/* Most Read Sidebar (5 cols) */}
            {secondaryLead.length > 0 && (
              <aside className="lg:col-span-5 space-y-4">
                <div className="flex items-center justify-between pb-2.5 border-b-2 border-zinc-950 dark:border-white">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-red-600" />
                    <h2 className="font-display font-black text-lg text-zinc-900 dark:text-white">
                      Most Read Stories
                    </h2>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 font-mono">
                    Trending Feed
                  </span>
                </div>

                <div className="space-y-0.5">
                  {secondaryLead.slice(0, 5).map((post, idx) => (
                    <EditorialCard
                      key={String(post._id || post.slug)}
                      blog={post}
                      variant="trending"
                      rank={idx + 1}
                    />
                  ))}
                </div>
              </aside>
            )}
          </section>
        )}

        {/* 4. Secondary Horizontal Stories Row */}
        {secondaryLead.length > 5 && (
          <section className="py-10 border-b border-zinc-200/80 dark:border-white/10">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {secondaryLead.slice(5, 8).map((post) => (
                <EditorialCard key={String(post._id || post.slug)} blog={post} variant="featured" />
              ))}
            </div>
          </section>
        )}

        {/* 5. Technology & AI Systems Desk */}
        {techLayout.shouldRender && (
          <section className="py-12 border-b border-zinc-200/80 dark:border-white/10">
            <div className="flex items-end justify-between gap-4 mb-8 pb-3 border-b-2 border-zinc-950 dark:border-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white grid place-items-center text-xs font-black shadow-md shadow-blue-500/20">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 block">
                    Engineering Desk
                  </span>
                  <h2 className="font-display text-2xl md:text-3xl font-black text-zinc-900 dark:text-white">
                    Technology & AI Systems
                  </h2>
                </div>
              </div>
              <Link
                href="/section/technology"
                className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 hover:gap-2 transition-all"
              >
                All Tech <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {techLayout.mode === 'single-spotlight' && (
              <EditorialCard blog={techLayout.lead} variant="spotlight-single" />
            )}
            {techLayout.mode === 'balanced-pair' && (
              <div className="grid md:grid-cols-2 gap-6">
                {[techLayout.lead, ...techLayout.secondary].map((post) => (
                  <EditorialCard key={String(post._id || post.slug)} blog={post} variant="featured" />
                ))}
              </div>
            )}
            {(techLayout.mode === 'triad' || techLayout.mode === 'lead-and-rail' || techLayout.mode === 'ensemble') && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[techLayout.lead, ...techLayout.secondary].map((post) => (
                  <EditorialCard key={String(post._id || post.slug)} blog={post} variant="featured" />
                ))}
              </div>
            )}
          </section>
        )}

        {/* 6. Kashmir Regional Bureau Section */}
        {kashmirLayout.shouldRender && (
          <section className="py-12 border-b border-zinc-200/80 dark:border-white/10">
            <div className="flex items-end justify-between gap-4 mb-8 pb-3 border-b-2 border-zinc-950 dark:border-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white grid place-items-center text-xs font-black shadow-md shadow-emerald-500/20">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 block">
                    Regional Bureau
                  </span>
                  <h2 className="font-display text-2xl md:text-3xl font-black text-zinc-900 dark:text-white">
                    Kashmir Regional Bureau
                  </h2>
                </div>
              </div>
              <Link
                href="/kashmir"
                className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 hover:gap-2 transition-all"
              >
                Open Kashmir Bureau <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {kashmirLayout.mode === 'single-spotlight' && (
              <EditorialCard blog={kashmirLayout.lead} variant="spotlight-single" />
            )}
            {kashmirLayout.mode === 'balanced-pair' && (
              <div className="grid md:grid-cols-2 gap-6">
                {[kashmirLayout.lead, ...kashmirLayout.secondary].map((post) => (
                  <EditorialCard key={String(post._id || post.slug)} blog={post} variant="featured" />
                ))}
              </div>
            )}
            {(kashmirLayout.mode === 'triad' || kashmirLayout.mode === 'lead-and-rail' || kashmirLayout.mode === 'ensemble') && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[kashmirLayout.lead, ...kashmirLayout.secondary].map((post) => (
                  <EditorialCard key={String(post._id || post.slug)} blog={post} variant="featured" />
                ))}
              </div>
            )}
          </section>
        )}

        {/* 7. Education & Academia Desk */}
        {educationLayout.shouldRender && (
          <section className="py-12 border-b border-zinc-200/80 dark:border-white/10">
            <div className="flex items-end justify-between gap-4 mb-8 pb-3 border-b-2 border-zinc-950 dark:border-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white grid place-items-center text-xs font-black shadow-md shadow-emerald-500/20">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 block">
                    Admissions & Academic Notices
                  </span>
                  <h2 className="font-display text-2xl md:text-3xl font-black text-zinc-900 dark:text-white">
                    Education & Academia
                  </h2>
                </div>
              </div>
              <Link
                href="/section/education"
                className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 hover:gap-2 transition-all"
              >
                All Education <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {educationLayout.mode === 'single-spotlight' && (
              <EditorialCard blog={educationLayout.lead} variant="spotlight-single" />
            )}
            {educationLayout.mode === 'balanced-pair' && (
              <div className="grid md:grid-cols-2 gap-6">
                {[educationLayout.lead, ...educationLayout.secondary].map((post) => (
                  <EditorialCard key={String(post._id || post.slug)} blog={post} variant="featured" />
                ))}
              </div>
            )}
            {(educationLayout.mode === 'triad' || educationLayout.mode === 'lead-and-rail' || educationLayout.mode === 'ensemble') && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[educationLayout.lead, ...educationLayout.secondary].map((post) => (
                  <EditorialCard key={String(post._id || post.slug)} blog={post} variant="featured" />
                ))}
              </div>
            )}
          </section>
        )}

        {/* 8. Gear Lab & Product Reviews */}
        {reviewLayout.shouldRender && (
          <section className="py-12 border-b border-zinc-200/80 dark:border-white/10">
            <div className="flex items-end justify-between gap-4 mb-8 pb-3 border-b-2 border-zinc-950 dark:border-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white grid place-items-center text-xs font-black shadow-md shadow-amber-500/20">
                  <Star className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 block">
                    Hardware Scorecards & Testing
                  </span>
                  <h2 className="font-display text-2xl md:text-3xl font-black text-zinc-900 dark:text-white">
                    Gear Lab & Reviews
                  </h2>
                </div>
              </div>
              <Link
                href="/blogs?contentType=review"
                className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 hover:gap-2 transition-all"
              >
                All Reviews <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {reviewLayout.mode === 'single-spotlight' ? (
              <EditorialCard blog={reviewLayout.lead} variant="review-spotlight" />
            ) : (
              <div className={`grid gap-6 ${reviewStories.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
                {[reviewLayout.lead, ...reviewLayout.secondary].map((post) => (
                  <EditorialCard key={String(post._id || post.slug)} blog={post} variant="review" />
                ))}
              </div>
            )}
          </section>
        )}

        {/* 9. Columns, Opinions & Cultural Perspective */}
        <section className="py-12 grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-6">
            <div className="pb-3 border-b-2 border-zinc-950 dark:border-white">
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-red-600 dark:text-red-400 block mb-1">
                Columnists & Analysis
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
                Opinions & Perspective
              </h2>
            </div>
            <div className="space-y-4">
              {(opinionStories.length > 0 ? opinionStories : dataset.slice(0, 3)).slice(0, 3).map((post) => (
                <EditorialCard key={String(post._id || post.slug)} blog={post} variant="opinion" />
              ))}
            </div>
          </div>

          <aside className="lg:col-span-5 rounded-3xl bg-zinc-50 dark:bg-zinc-900/60 p-7 sm:p-8 self-start border border-zinc-200/90 dark:border-white/10 shadow-sm dark:shadow-xl space-y-5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.24em] text-red-600 dark:text-red-400 font-bold">
                The Morning Briefing
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight text-zinc-900 dark:text-white">
              Essential journalism, directly in your inbox.
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
              Join readers receiving our curated weekly analysis across software engineering, regional news, and education guides.
            </p>

            <form onSubmit={handleNewsletterSubmit} className="space-y-3 pt-1">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="journalist@newsroom.com"
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 shadow-xs focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
              />
              <button
                type="submit"
                disabled={subscribing}
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-red-600/20"
              >
                {subscribing ? 'Subscribing...' : 'Subscribe to The Briefing'}
              </button>
            </form>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 text-center font-medium">
              Zero spam. Unsubscribe with 1-click anytime.
            </p>
          </aside>
        </section>
      </div>
    </main>
  );
}
