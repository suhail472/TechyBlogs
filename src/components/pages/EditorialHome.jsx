'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Clock,
  Flame,
  MapPin,
  TrendingUp,
  Layers,
  Cpu,
  GraduationCap,
  Star,
  BookOpen,
  CheckCircle2,
  Mail,
  ChevronRight,
  ChevronLeft,
  Feather,
  Camera,
  ShieldCheck,
  Globe,
  Activity,
  SlidersHorizontal,
} from 'lucide-react';
import EditorialCard from '@/components/shared/EditorialCard';
import { getDeskLayout } from '@/lib/services/layoutStrategy';
import useToastStore from '@/store/useToastStore';
import { subscriberAPI } from '@/services/api';
import { DEFAULT_STORIES } from '@/data/defaultStories';

export default function EditorialHome({ posts = [] }) {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [selectedHeroIndex, setSelectedHeroIndex] = useState(0);
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

  // Merge provided posts with rich DEFAULT_STORIES to guarantee full, vibrant presentation
  const dataset = useMemo(() => {
    const raw = Array.isArray(posts) && posts.length > 0 ? posts : DEFAULT_STORIES;
    if (raw.length < 8) {
      const existingSlugs = new Set(raw.map((p) => p.slug));
      const supplements = DEFAULT_STORIES.filter((s) => !existingSlugs.has(s.slug));
      return [...raw, ...supplements];
    }
    return raw;
  }, [posts]);

  const ordered = useMemo(() => {
    return [...dataset].sort(
      (a, b) => new Date(b.publishedAt || b.createdAt || 0) - new Date(a.publishedAt || a.createdAt || 0)
    );
  }, [dataset]);

  // Breaking ticker stories
  const breaking = useMemo(() => {
    const brk = ordered.filter((p) => p.breaking);
    return brk.length > 0 ? brk.slice(0, 4) : ordered.slice(0, 3);
  }, [ordered]);

  // Repeated ticker stories for seamless continuous infinite marquee loop
  const tickerStories = useMemo(() => {
    if (!breaking || breaking.length === 0) return [];
    if (breaking.length === 1) return [...breaking, ...breaking, ...breaking, ...breaking];
    if (breaking.length === 2) return [...breaking, ...breaking, ...breaking];
    if (breaking.length === 3) return [...breaking, ...breaking];
    return breaking;
  }, [breaking]);

  // Hero Lead Candidate Stories for Template Switcher
  const heroCandidates = useMemo(() => {
    return ordered.slice(0, 5);
  }, [ordered]);

  // Active Hero Story based on user selected template / index
  const heroStory = heroCandidates[selectedHeroIndex] || heroCandidates[0] || ordered[0];

  // Secondary Lead & Trending Stories
  const secondaryLead = useMemo(() => {
    return ordered.filter((p) => (p._id || p.slug) !== (heroStory?._id || heroStory?.slug));
  }, [ordered, heroStory]);

  // Specialized Desks with dynamic layout strategy
  const techStories = useMemo(() => {
    return dataset.filter((p) =>
      /tech|code|react|ai|hardware|next\.js|software|python|webgpu/i.test((p.categories || []).join(' ') + ' ' + (p.tags || []).join(' ') + ' ' + p.title)
    );
  }, [dataset]);
  const techLayout = getDeskLayout(techStories);

  const kashmirStories = useMemo(() => {
    return dataset.filter((p) =>
      /kashmir|srinagar|dal lake|gulmarg|jammu|pampore|zabarwan/i.test((p.categories || []).join(' ') + ' ' + (p.tags || []).join(' ') + ' ' + p.title)
    );
  }, [dataset]);
  const kashmirLayout = getDeskLayout(kashmirStories);

  const educationStories = useMemo(() => {
    return dataset.filter((p) =>
      /education|admissions|university|exam|syllabus|tutorial|guide|gate|iit/i.test((p.categories || []).join(' ') + ' ' + (p.tags || []).join(' ') + ' ' + p.title)
    );
  }, [dataset]);
  const educationLayout = getDeskLayout(educationStories);

  const reviewStories = useMemo(() => {
    return dataset.filter((p) =>
      p.contentType === 'review' || /review|m4|macbook|hardware|scorecard|keyboard|keychron/i.test((p.categories || []).join(' ') + ' ' + (p.tags || []).join(' ') + ' ' + p.title)
    );
  }, [dataset]);
  const reviewLayout = getDeskLayout(reviewStories);

  const opinionStories = useMemo(() => {
    return dataset.filter((p) =>
      p.contentType === 'opinion' || /opinion|analysis|editorial|future|perspective|critique|death of/i.test((p.categories || []).join(' ') + ' ' + p.title)
    );
  }, [dataset]);

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const handlePrevHero = () => {
    setSelectedHeroIndex((prev) => (prev === 0 ? heroCandidates.length - 1 : prev - 1));
  };

  const handleNextHero = () => {
    setSelectedHeroIndex((prev) => (prev === heroCandidates.length - 1 ? 0 : prev + 1));
  };

  // Hero Curated Desks
  const heroTemplates = [
    { label: 'AI & Edge Systems', icon: Cpu, badge: 'Tech Lead' },
    { label: 'Hardware Scorecard', icon: Star, badge: 'Gear Lab' },
    { label: 'Kashmir Bureau', icon: MapPin, badge: 'Regional' },
    { label: 'Academic Roadmap', icon: GraduationCap, badge: 'Education' },
    { label: 'Systems Analysis', icon: Activity, badge: 'Opinion' },
  ];

  return (
    <main className="pt-24 pb-20">
      {/* 1. Infinite Floating Breaking Ticker */}
      {breaking.length > 0 && (
        <div className="bg-zinc-950 text-white border-b border-white/10 shadow-inner overflow-hidden relative select-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-2.5 flex items-center gap-3 relative">
            {/* Fixed Sticky Breaking Label */}
            <div className="shrink-0 flex items-center gap-3 z-10 bg-zinc-950 pr-2">
              <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] bg-red-600 px-2.5 py-0.5 rounded-md shadow-sm animate-pulse whitespace-nowrap">
                <Flame className="w-3 h-3 fill-current" /> Breaking
              </span>
              <div className="h-3.5 w-px bg-white/20 shrink-0" />
            </div>

            {/* Seamless Infinite Marquee Track (Right to Left) */}
            <div className="relative flex-1 overflow-hidden min-w-0 mask-marquee-edges">
              <div className="animate-marquee-infinite flex items-center">
                {/* Track A */}
                <div className="flex items-center gap-8 shrink-0 pr-8">
                  {tickerStories.map((post, idx) => (
                    <Link
                      key={`ticker-a-${post._id || post.slug}-${idx}`}
                      href={`/blog/${post.slug}`}
                      className="hover:text-red-400 transition-colors flex items-center gap-2 shrink-0 text-xs font-semibold whitespace-nowrap group"
                    >
                      <span className="text-zinc-400 group-hover:text-red-300 transition-colors text-[10px] font-bold uppercase tracking-wider">
                        {post.primarySection?.name || post.categories?.[0] || 'News'}:
                      </span>
                      <span className="group-hover:underline underline-offset-2">{post.title}</span>
                      <span className="text-zinc-600 font-mono text-[10px] ml-1">///</span>
                    </Link>
                  ))}
                </div>

                {/* Track B (Exact duplicate for seamless continuous infinite right-to-left marquee) */}
                <div className="flex items-center gap-8 shrink-0 pr-8" aria-hidden="true">
                  {tickerStories.map((post, idx) => (
                    <Link
                      key={`ticker-b-${post._id || post.slug}-${idx}`}
                      href={`/blog/${post.slug}`}
                      tabIndex={-1}
                      className="hover:text-red-400 transition-colors flex items-center gap-2 shrink-0 text-xs font-semibold whitespace-nowrap group"
                    >
                      <span className="text-zinc-400 group-hover:text-red-300 transition-colors text-[10px] font-bold uppercase tracking-wider">
                        {post.primarySection?.name || post.categories?.[0] || 'News'}:
                      </span>
                      <span className="group-hover:underline underline-offset-2">{post.title}</span>
                      <span className="text-zinc-600 font-mono text-[10px] ml-1">///</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10">
        {/* 2. High-Information Publication Masthead */}
        <div className="py-3.5 sm:py-4 md:py-5 border-b border-zinc-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-red-600" />
            </span>
            <p className="text-[10px] sm:text-[11px] uppercase tracking-wider sm:tracking-[0.24em] font-black text-zinc-700 dark:text-zinc-300 leading-snug break-words">
              Independent Digital Publishing <span className="text-zinc-400 dark:text-zinc-600 font-normal">·</span> Global Desks &amp; Regional Bureaus
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-[11px] font-mono font-medium text-zinc-400 dark:text-zinc-500 pl-4.5 sm:pl-0">
            <span className="hidden sm:inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified Editorial Journal
            </span>
            <span className="hidden sm:inline">·</span>
            <span>{todayFormatted}</span>
          </div>
        </div>

        {/* 3. Sleek Editorial Desks & Lead Story Selector */}
        <div className="pt-4 sm:pt-5 pb-3 sm:pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-200/80 dark:border-white/10">
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-[10px] font-black uppercase tracking-[0.16em] whitespace-nowrap shadow-xs">
              <SlidersHorizontal className="w-3 h-3 text-red-500 shrink-0" />
              <span>Curated Desks</span>
            </span>
            <span className="text-zinc-400 dark:text-zinc-500 text-[11px] font-medium hidden sm:inline whitespace-nowrap">
              Switch lead story coverage
            </span>
          </div>

          {/* Desk Pill Selectors */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-shadow-x max-w-full py-1 min-w-0">
            {heroCandidates.map((story, idx) => {
              const template = heroTemplates[idx] || { label: `Desk 0${idx + 1}`, icon: Layers };
              const Icon = template.icon;
              const isSelected = selectedHeroIndex === idx;

              return (
                <button
                  key={story._id || story.slug || idx}
                  onClick={() => setSelectedHeroIndex(idx)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 shrink-0 whitespace-nowrap border ${
                    isSelected
                      ? 'bg-red-600 text-white border-red-600 shadow-sm shadow-red-600/20'
                      : 'bg-zinc-100/90 hover:bg-zinc-200/90 dark:bg-zinc-900/80 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200/80 dark:border-white/10'
                  }`}
                  title={story.title}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[11px] tracking-tight">{template.label}</span>
                </button>
              );
            })}

            {/* Quick Slider Arrow Nav */}
            <div className="flex items-center gap-1 pl-1.5 shrink-0">
              <button
                onClick={handlePrevHero}
                aria-label="Previous lead story"
                className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-white/10 flex items-center justify-center text-zinc-600 dark:text-zinc-300 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleNextHero}
                aria-label="Next lead story"
                className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-white/10 flex items-center justify-center text-zinc-600 dark:text-zinc-300 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 4. Hero Ensemble: Dominant Lead + Most Read Trending Column */}
        {heroStory && (
          <section className={`grid ${secondaryLead.length > 0 ? 'lg:grid-cols-12' : 'grid-cols-1'} gap-8 lg:gap-10 pt-6 pb-10 border-b border-zinc-200/80 dark:border-white/10`}>
            {/* Primary Lead Story */}
            <div className={secondaryLead.length > 0 ? 'lg:col-span-7 lg:border-r lg:pr-10 border-zinc-200/80 dark:border-white/10' : 'w-full'}>
              <div className="transition-all duration-300">
                <EditorialCard blog={heroStory} variant="lead" priority={true} />
              </div>
            </div>

            {/* Most Read Trending Sidebar (5 cols) */}
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
                      key={String(post._id || post.slug || idx)}
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

        {/* 5. Live Publication Quick Intelligence Ribbon */}
        <section className="py-6 border-b border-zinc-200/80 dark:border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-white/5 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600 dark:text-red-400 block font-mono">
              Active Desks
            </span>
            <p className="font-display font-black text-xl text-zinc-900 dark:text-white">18 Desks</p>
            <span className="text-[10px] text-zinc-400">Global & Regional Coverage</span>
          </div>
          <div className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-white/5 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 block font-mono">
              Monthly Readership
            </span>
            <p className="font-display font-black text-xl text-zinc-900 dark:text-white">140,000+</p>
            <span className="text-[10px] text-zinc-400">Software Engineers & Scholars</span>
          </div>
          <div className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-white/5 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 block font-mono">
              Regional Hub
            </span>
            <p className="font-display font-black text-xl text-zinc-900 dark:text-white">Kashmir Bureau</p>
            <span className="text-[10px] text-zinc-400">Srinagar · Gulmarg · Pampore</span>
          </div>
          <div className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-white/5 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 block font-mono">
              Gear Lab Scorecards
            </span>
            <p className="font-display font-black text-xl text-zinc-900 dark:text-white">4.9 / 5.0 Avg</p>
            <span className="text-[10px] text-zinc-400">Independent Hardware Benchmarks</span>
          </div>
        </section>

        {/* 6. Secondary Horizontal Stories Row */}
        {secondaryLead.length > 5 && (
          <section className="py-10 border-b border-zinc-200/80 dark:border-white/10">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {secondaryLead.slice(5, 8).map((post) => (
                <EditorialCard key={String(post._id || post.slug)} blog={post} variant="featured" />
              ))}
            </div>
          </section>
        )}

        {/* 7. Technology & AI Systems Desk */}
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

        {/* 8. Kashmir Regional Bureau Section */}
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

        {/* 9. Education & Academia Desk */}
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

        {/* 10. Gear Lab & Product Reviews */}
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

        {/* 11. Columns, Opinions & Cultural Perspective */}
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
