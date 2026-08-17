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
} from 'lucide-react';
import EditorialCard from '@/components/shared/EditorialCard';
import { DEFAULT_STORIES } from '@/data/defaultStories';
import useToastStore from '@/store/useToastStore';

export default function EditorialHome({ posts = [] }) {
  const { addToast } = useToastStore();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubscribing(true);
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('Subscribed! You will receive our weekly editorial briefing.', 'success');
        setNewsletterEmail('');
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      addToast(err.message || 'Subscription received!', 'info');
      setNewsletterEmail('');
    } finally {
      setSubscribing(false);
    }
  };

  const dataset = posts && posts.length > 0 ? posts : DEFAULT_STORIES;
  const ordered = [...dataset].sort(
    (a, b) => new Date(b.publishedAt || b.createdAt || 0) - new Date(a.publishedAt || a.createdAt || 0)
  );

  const breaking = ordered.filter((p) => p.breaking).slice(0, 3);
  const heroStory = ordered.find((p) => p.featured) || ordered[0];
  const secondaryLead = ordered.filter((p) => (p._id || p.slug) !== (heroStory?._id || heroStory?.slug));

  // Specialized Desks
  const techStories = dataset.filter((p) =>
    /tech|code|react|ai|hardware|next\.js|software|python/i.test((p.categories || []).join(' ') + p.title)
  );

  const kashmirStories = dataset.filter((p) =>
    /kashmir|srinagar|dal lake|gulmarg|jammu/i.test((p.categories || []).join(' ') + p.title)
  );

  const educationStories = dataset.filter((p) =>
    /education|admissions|university|exam|syllabus|tutorial|guide/i.test((p.categories || []).join(' ') + p.title)
  );

  const reviewStories = dataset.filter((p) =>
    p.contentType === 'review' || /review|m4|macbook|hardware|scorecard/i.test((p.categories || []).join(' ') + p.title)
  );

  const opinionStories = dataset.filter((p) =>
    p.contentType === 'opinion' || /opinion|analysis|editorial|future|perspective/i.test((p.categories || []).join(' ') + p.title)
  );

  return (
    <main className="pt-24 pb-20">
      {/* 1. Real-Time Breaking / Developing Bar */}
      {breaking.length > 0 && (
        <div className="bg-zinc-950 text-white border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center gap-3 overflow-x-auto no-scrollbar">
            <span className="shrink-0 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] bg-red-600 px-2.5 py-0.5 rounded-full shadow-sm animate-pulse">
              <Flame className="w-3.5 h-3.5" /> Developing
            </span>
            <div className="h-4 w-px bg-white/20 shrink-0" />
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
        {/* 2. Publication Masthead Header */}
        <div className="py-8 md:py-10 border-b border-zinc-200/80 dark:border-white/10 flex flex-wrap justify-between items-end gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
              <p className="text-[10px] uppercase tracking-[0.24em] font-black text-red-600 dark:text-red-400">
                The Daily Journal · Global & Regional Desks
              </p>
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-black tracking-tight mt-2 text-zinc-900 dark:text-white">
              Teachy<span className="text-red-600">Blogs</span>
            </h1>
          </div>
          <div className="max-w-xs text-xs md:text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 font-sans">
            Independent digital publishing, rigorous technology analysis, university notifications, and on-the-ground Kashmir reporting.
          </div>
        </div>

        {/* 3. Primary Hero Ensemble: 7 cols Lead + 5 cols Sidebar (Secondary + Trending 1-5) */}
        {heroStory && (
          <section className="grid lg:grid-cols-12 gap-8 lg:gap-10 py-10 border-b border-zinc-200/80 dark:border-white/10">
            {/* Lead Story Column */}
            <div className="lg:col-span-7 lg:border-r lg:pr-10 border-zinc-200/80 dark:border-white/10">
              <EditorialCard blog={heroStory} variant="lead" />
            </div>

            {/* Trending & Secondary Column */}
            <aside className="lg:col-span-5 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b-2 border-zinc-950 dark:border-white">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-red-600" />
                  <h2 className="font-display font-black text-xl text-zinc-900 dark:text-white">
                    Trending & Most Read
                  </h2>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  Live Feed
                </span>
              </div>

              <div className="space-y-1">
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

        {/* 5. Technology & AI Desk */}
        {techStories.length > 0 && (
          <section className="py-12 border-b border-zinc-200/80 dark:border-white/10">
            <div className="flex items-end justify-between gap-4 mb-8 pb-3 border-b-2 border-zinc-950 dark:border-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white grid place-items-center text-xs font-black shadow-md shadow-blue-500/20">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-black text-zinc-900 dark:text-white">
                    Technology & AI Systems
                  </h2>
                  <p className="text-xs text-zinc-500 font-medium">Software engineering, Next.js architecture, and hardware benchmarks</p>
                </div>
              </div>
              <Link
                href="/section/technology"
                className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 hover:gap-2 transition-all"
              >
                All Tech <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {techStories.slice(0, 3).map((post) => (
                <EditorialCard key={String(post._id || post.slug)} blog={post} variant="featured" />
              ))}
            </div>
          </section>
        )}

        {/* 6. Kashmir Regional Bureau Spotlight (Publication Differentiator) */}
        {kashmirStories.length > 0 && (
          <section className="my-12 rounded-3xl bg-zinc-900 text-white p-6 sm:p-10 relative overflow-hidden border border-white/10 shadow-2xl">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8 pb-6 border-b border-white/15">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-red-400 mb-2">
                  <MapPin className="w-3.5 h-3.5" /> Regional Bureau Spotlight
                </span>
                <h2 className="font-display text-3xl sm:text-4xl font-black tracking-tight text-white">
                  Kashmir Edition Dispatch
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-sans">
                  Srinagar Smart City, higher education notifications, Dal Lake heritage, and valley economics.
                </p>
              </div>
              <Link
                href="/kashmir"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-zinc-950 text-xs font-black uppercase tracking-wider hover:bg-zinc-200 transition-colors shadow-lg"
              >
                Open Kashmir Bureau <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {kashmirStories.slice(0, 3).map((post) => (
                <article
                  key={String(post._id || post.slug)}
                  className="group bg-zinc-950/70 backdrop-blur-md rounded-2xl border border-white/10 p-5 space-y-3 flex flex-col justify-between hover:border-red-500/50 transition-colors"
                >
                  <Link href={`/blog/${post.slug}`} className="block space-y-3">
                    <div className="aspect-[16/9] rounded-xl overflow-hidden bg-zinc-800">
                      <img
                        src={post.image || 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d'}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-red-400">
                        {post.primarySection?.name || 'Kashmir'}
                      </span>
                      <h3 className="font-display text-base font-bold text-white group-hover:text-red-400 transition-colors mt-1 line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* 7. Education & Academia Desk */}
        {educationStories.length > 0 && (
          <section className="py-12 border-b border-zinc-200/80 dark:border-white/10">
            <div className="flex items-end justify-between gap-4 mb-8 pb-3 border-b-2 border-zinc-950 dark:border-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white grid place-items-center text-xs font-black shadow-md shadow-emerald-500/20">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-black text-zinc-900 dark:text-white">
                    Education & Admissions
                  </h2>
                  <p className="text-xs text-zinc-500 font-medium">Entrance exam notifications, university guides, and academic insights</p>
                </div>
              </div>
              <Link
                href="/section/education"
                className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 hover:gap-2 transition-all"
              >
                All Education <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {educationStories.slice(0, 3).map((post) => (
                <EditorialCard key={String(post._id || post.slug)} blog={post} variant="featured" />
              ))}
            </div>
          </section>
        )}

        {/* 8. Gear Lab & Product Reviews */}
        {reviewStories.length > 0 && (
          <section className="py-12 border-b border-zinc-200/80 dark:border-white/10">
            <div className="flex items-end justify-between gap-4 mb-8 pb-3 border-b-2 border-zinc-950 dark:border-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white grid place-items-center text-xs font-black shadow-md shadow-amber-500/20">
                  <Star className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-black text-zinc-900 dark:text-white">
                    Gear Lab & Reviews
                  </h2>
                  <p className="text-xs text-zinc-500 font-medium">Hardware benchmarks, software analysis, and hands-on scorecards</p>
                </div>
              </div>
              <Link
                href="/blogs?contentType=review"
                className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 hover:gap-2 transition-all"
              >
                All Reviews <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviewStories.slice(0, 3).map((post) => (
                <EditorialCard key={String(post._id || post.slug)} blog={post} variant="review" />
              ))}
            </div>
          </section>
        )}

        {/* 9. Columns, Opinions & Analysis + Newsletter Dispatch */}
        <section className="py-12 grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-6">
            <div className="pb-3 border-b-2 border-zinc-950 dark:border-white">
              <h2 className="font-display font-black text-2xl text-zinc-900 dark:text-white">
                Opinions & Cultural Columns
              </h2>
            </div>
            <div className="space-y-4">
              {(opinionStories.length > 0 ? opinionStories : dataset.slice(0, 3)).slice(0, 3).map((post) => (
                <EditorialCard key={String(post._id || post.slug)} blog={post} variant="opinion" />
              ))}
            </div>
          </div>

          <aside className="lg:col-span-5 rounded-3xl bg-zinc-950 text-white p-8 self-start border border-white/10 shadow-2xl space-y-5">
            <span className="text-[10px] uppercase tracking-[0.24em] text-red-400 font-black">
              The Morning Briefing
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-black leading-tight text-white">
              Essential journalism, directly in your inbox.
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
              Join readers receiving our curated weekly analysis across software engineering, regional news, and education guides.
            </p>

            <form onSubmit={handleNewsletterSubmit} className="space-y-3 pt-2">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="journalist@newsroom.com"
                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                type="submit"
                disabled={subscribing}
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider transition-colors shadow-lg shadow-red-600/30"
              >
                {subscribing ? 'Subscribing...' : 'Subscribe to The Briefing'}
              </button>
            </form>
            <p className="text-[10px] text-zinc-400 text-center font-medium">
              Zero spam. Unsubscribe with 1-click anytime.
            </p>
          </aside>
        </section>
      </div>
    </main>
  );
}
