'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  MapPin,
  Flame,
  Layers,
  Sparkles,
  BookOpen,
  Compass,
  GraduationCap,
  Briefcase,
  TrendingUp,
  Search,
} from 'lucide-react';
import EditorialCard from '@/components/shared/EditorialCard';

const KASHMIR_DISTRICTS = [
  { name: 'All Valley', query: '' },
  { name: 'Srinagar', query: 'srinagar' },
  { name: 'Baramulla', query: 'baramulla' },
  { name: 'Anantnag', query: 'anantnag' },
  { name: 'Kupwara', query: 'kupwara' },
  { name: 'Pulwama', query: 'pulwama' },
  { name: 'Budgam', query: 'budgam' },
  { name: 'Ganderbal', query: 'ganderbal' },
  { name: 'Bandipora', query: 'bandipora' },
  { name: 'Kulgam', query: 'kulgam' },
  { name: 'Shopian', query: 'shopian' },
  { name: 'Gulmarg', query: 'gulmarg' },
  { name: 'Pahalgam', query: 'pahalgam' },
];

const typeLabel = {
  section: 'Editorial Vertical',
  edition: 'Regional Edition',
  topic: 'Topic Authority',
  tag: 'Content Tag',
};

export default function TaxonomyLanding({ kind, item, posts = [], isKashmirHub = false }) {
  const isKashmir = isKashmirHub || item?.slug === 'kashmir';
  const title = item?.name || 'Stories';
  const description =
    item?.description ||
    `The latest ${title.toLowerCase()} journalism, analysis, deep-dives, and guides from TechyBlogs.`;

  const [selectedDistrict, setSelectedDistrict] = useState('');

  const dataset = Array.isArray(posts) ? posts : [];

  // Filter by selected district if Kashmir
  const filteredStories = selectedDistrict
    ? dataset.filter(
        (p) =>
          p.title?.toLowerCase().includes(selectedDistrict) ||
          p.excerpt?.toLowerCase().includes(selectedDistrict) ||
          p.content?.toLowerCase().includes(selectedDistrict) ||
          p.categories?.some((c) => c.toLowerCase().includes(selectedDistrict)) ||
          p.tags?.some((t) => t.toLowerCase().includes(selectedDistrict))
      )
    : dataset;

  const leadStory = filteredStories[0] || dataset[0];
  const secondaryStories = filteredStories.slice(1, 3);
  const remainingStories = filteredStories.slice(3);

  // Kashmir Desk filters
  const educationStories = dataset.filter((p) =>
    /education|admissions|university|exam|syllabus|kashmir university/i.test(
      (p.categories || []).join(' ') + p.title
    )
  );

  const tourismStories = dataset.filter((p) =>
    /travel|tourism|heritage|dal lake|gulmarg|autumn|winter|culture/i.test(
      (p.categories || []).join(' ') + p.title
    )
  );

  return (
    <main className="pt-28 md:pt-32 pb-20 max-w-7xl mx-auto px-6 md:px-10">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-zinc-500 mb-6 font-medium">
        <Link href="/" className="hover:text-red-600 transition-colors">
          Frontpage
        </Link>
        <span>/</span>
        <span className="text-zinc-400 capitalize">{kind || 'Taxonomy'}</span>
        <span>/</span>
        <span className="text-zinc-900 dark:text-white font-bold">{title}</span>
      </nav>

      {/* Editorial Header */}
      <header className="border-b-4 border-zinc-950 dark:border-white pb-8 mb-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-3xl">
            <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.24em] font-black text-red-600 dark:text-red-400 mb-2">
              {isKashmir ? <MapPin className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
              {isKashmir ? 'Kashmir Regional Bureau' : typeLabel[kind] || 'Desk'}
            </p>
            <h1 className="font-display text-4xl md:text-6xl font-black tracking-tight text-zinc-900 dark:text-white">
              {title}
            </h1>
            <p className="mt-3 text-base md:text-lg leading-relaxed text-zinc-600 dark:text-zinc-300 font-sans">
              {description}
            </p>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-900 px-4 py-2.5 rounded-2xl border border-zinc-200/80 dark:border-white/10 text-right self-start">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">
              Published Stories
            </span>
            <span className="font-display text-2xl font-black text-zinc-900 dark:text-white">
              {dataset.length}
            </span>
          </div>
        </div>

        {/* Kashmir District Bar */}
        {isKashmir && (
          <div className="mt-8 pt-6 border-t border-zinc-200/70 dark:border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Valley Districts & Hubs:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {KASHMIR_DISTRICTS.map((d) => {
                const active = selectedDistrict === d.query;
                return (
                  <button
                    key={d.name}
                    onClick={() => setSelectedDistrict(d.query)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      active
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                        : 'bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-white/5'
                    }`}
                  >
                    {d.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Primary Editorial Grid */}
      {leadStory ? (
        <section className="space-y-12">
          {/* Top Ensemble: 1 Lead + 2 Secondary + Sidebar */}
          <div className="grid lg:grid-cols-12 gap-8 pb-12 border-b border-zinc-200/80 dark:border-white/10">
            {/* Main Lead Story */}
            <div className="lg:col-span-8">
              <EditorialCard blog={leadStory} variant="lead" />
            </div>

            {/* Side Column: Trending in Section */}
            <aside className="lg:col-span-4 lg:border-l lg:pl-8 border-zinc-200/80 dark:border-white/10 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b-2 border-zinc-950 dark:border-white">
                <TrendingUp className="w-4 h-4 text-red-600" />
                <h3 className="font-display font-black text-lg text-zinc-900 dark:text-white">
                  {isKashmir ? 'Most Read in Kashmir' : 'Trending in ' + title}
                </h3>
              </div>
              <div className="space-y-2">
                {dataset.slice(0, 4).map((post, idx) => (
                  <EditorialCard
                    key={String(post._id || post.slug)}
                    blog={post}
                    variant="trending"
                    rank={idx + 1}
                  />
                ))}
              </div>
            </aside>
          </div>

          {/* Secondary 2-Card Row */}
          {secondaryStories.length > 0 && (
            <div className="grid md:grid-cols-2 gap-8 pb-12 border-b border-zinc-200/80 dark:border-white/10">
              {secondaryStories.map((post) => (
                <EditorialCard key={String(post._id || post.slug)} blog={post} variant="featured" />
              ))}
            </div>
          )}

          {/* Specialized Kashmir Desks */}
          {isKashmir && educationStories.length > 0 && (
            <section className="bg-zinc-50 dark:bg-zinc-900/40 rounded-3xl border border-zinc-200/80 dark:border-white/10 p-6 md:p-8">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-200 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 grid place-items-center">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-black text-zinc-900 dark:text-white">
                      Education & University Desks
                    </h3>
                    <p className="text-xs text-zinc-500">Admissions, exam dates, and academic notifications</p>
                  </div>
                </div>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {educationStories.slice(0, 3).map((post) => (
                  <EditorialCard key={String(post._id || post.slug)} blog={post} variant="featured" />
                ))}
              </div>
            </section>
          )}

          {isKashmir && tourismStories.length > 0 && (
            <section className="bg-zinc-50 dark:bg-zinc-900/40 rounded-3xl border border-zinc-200/80 dark:border-white/10 p-6 md:p-8">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-200 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 grid place-items-center">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-black text-zinc-900 dark:text-white">
                      Valley Heritage, Travel & Culture
                    </h3>
                    <p className="text-xs text-zinc-500">Explore Gulmarg, Dal Lake, Pahalgam & local artisans</p>
                  </div>
                </div>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tourismStories.slice(0, 3).map((post) => (
                  <EditorialCard key={String(post._id || post.slug)} blog={post} variant="featured" />
                ))}
              </div>
            </section>
          )}

          {/* Remaining Stories Grid */}
          {remainingStories.length > 0 && (
            <section className="pt-4">
              <div className="flex items-center justify-between mb-6 pb-3 border-b-2 border-zinc-950 dark:border-white">
                <h3 className="font-display text-2xl font-black text-zinc-900 dark:text-white">
                  More Stories in {title}
                </h3>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {remainingStories.map((post) => (
                  <EditorialCard key={String(post._id || post.slug)} blog={post} variant="featured" />
                ))}
              </div>
            </section>
          )}
        </section>
      ) : (
        <div className="py-24 text-center space-y-4">
          <p className="text-base text-zinc-500">No stories match this specific district filter yet.</p>
          <button
            onClick={() => setSelectedDistrict('')}
            className="px-5 py-2.5 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold uppercase tracking-wider"
          >
            Clear District Filter
          </button>
        </div>
      )}
    </main>
  );
}
