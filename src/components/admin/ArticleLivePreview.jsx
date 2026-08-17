'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Heart,
  Bookmark,
  Eye,
  Share2,
  Mail,
  MapPin,
  Flame,
  ExternalLink,
  Info,
  ChevronDown,
  Monitor,
  Tablet,
  Smartphone,
} from 'lucide-react';
import TableOfContents from '@/components/shared/TableOfContents';
import ReaderSettings from '@/components/shared/ReaderSettings';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer';
import EditorialImage from '@/components/shared/EditorialImage';
import { extractHeadings } from '@/utils/markdownEngine';
import { getReadingTime } from '@/utils/readingTime';

export default function ArticleLivePreview({ formData, className = '' }) {
  const [deviceViewport, setDeviceViewport] = useState('desktop'); // 'desktop', 'tablet', 'mobile'
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const headings = useMemo(() => {
    return extractHeadings(formData?.content || '');
  }, [formData?.content]);

  const readingTime = useMemo(() => {
    return getReadingTime(formData?.content || '');
  }, [formData?.content]);

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const viewportWidthClass =
    deviceViewport === 'mobile'
      ? 'max-w-[390px] border-x border-zinc-200 dark:border-white/10 shadow-2xl my-4 mx-auto rounded-3xl overflow-hidden'
      : deviceViewport === 'tablet'
      ? 'max-w-[768px] border-x border-zinc-200 dark:border-white/10 shadow-2xl my-4 mx-auto rounded-3xl overflow-hidden'
      : 'w-full';

  return (
    <div className={`flex flex-col bg-[#FAFAFA] dark:bg-[#0c0e12] ${className}`}>
      {/* Device QA Viewport Switcher Toolbar */}
      <div className="sticky top-0 z-20 bg-white/90 dark:bg-[#12151c]/90 backdrop-blur-md px-6 py-2.5 border-b border-zinc-200/80 dark:border-white/10 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono font-bold text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Live Public Article Simulation
          </span>
        </div>

        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-xl">
          <button
            type="button"
            onClick={() => setDeviceViewport('desktop')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              deviceViewport === 'desktop'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
            title="Desktop View (100%)"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Desktop</span>
          </button>

          <button
            type="button"
            onClick={() => setDeviceViewport('tablet')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              deviceViewport === 'tablet'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
            title="Tablet View (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tablet</span>
          </button>

          <button
            type="button"
            onClick={() => setDeviceViewport('mobile')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              deviceViewport === 'mobile'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
            title="Mobile View (390px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mobile</span>
          </button>
        </div>
      </div>

      {/* Real Public Article Container */}
      <div className={`transition-all duration-300 ${viewportWidthClass} bg-white dark:bg-[#0c0e12] min-h-screen py-10 px-4 sm:px-8 lg:px-12`}>
        {/* Breadcrumbs */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex flex-wrap items-center gap-2 text-xs font-medium text-zinc-400 dark:text-zinc-500"
        >
          <span>Frontpage</span>
          <span>/</span>
          <span className="capitalize">{formData?.primarySection?.name || formData?.primarySection || formData?.categories?.[0] || 'Stories'}</span>
          <span>/</span>
          {formData?.primaryRegion && (
            <>
              <span className="flex items-center gap-1 text-red-500 font-bold">
                <MapPin className="w-3 h-3" />
                {formData?.primaryRegion?.name || formData?.primaryRegion}
              </span>
              <span>/</span>
            </>
          )}
          <span className="text-zinc-600 dark:text-zinc-300 font-semibold truncate max-w-xs">
            {formData?.title || 'Untitled Story'}
          </span>
        </nav>

        {/* Masthead Header */}
        <header className="space-y-6 mb-12">
          <div className="flex flex-wrap items-center gap-2">
            {(formData?.editorial?.breaking || formData?.breaking) && (
              <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] bg-red-600 text-white px-2.5 py-0.5 rounded-md shadow-sm">
                <Flame className="w-3 h-3" /> BREAKING
              </span>
            )}
            <span className="text-[10px] font-black uppercase tracking-widest text-red-700 dark:text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-md border border-red-500/20 font-mono">
              {formData?.contentType || 'Article'}
            </span>
            {formData?.primaryTopic && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-md border border-zinc-200 dark:border-white/10">
                {formData.primaryTopic.name || formData.primaryTopic}
              </span>
            )}
            {(formData?.editorial?.locationName || formData?.primaryRegion) && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                <MapPin className="w-3 h-3" />
                {formData?.editorial?.locationName || formData?.primaryRegion?.name || formData?.primaryRegion}
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-black text-zinc-950 dark:text-white leading-[1.12] tracking-tight font-display max-w-4xl">
            {formData?.title || 'Untitled Story'}
          </h1>

          {formData?.subtitle && (
            <p className="text-lg md:text-xl font-medium text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-3xl font-sans">
              {formData.subtitle}
            </p>
          )}

          {/* Journalist Author Byline & Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-6 pt-6 border-t border-zinc-200/80 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center font-black text-sm font-display shadow-sm">
                {formData?.author ? formData.author[0] : 'T'}
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-display">
                  {formData?.author || 'Editorial Bureau'}
                </p>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
                  {formData?.primaryAuthor?.role || 'Senior Regional Correspondent'} · TeachyBlogs
                </p>
              </div>
            </div>

            <div className="flex items-center gap-5 text-xs font-semibold text-zinc-400 dark:text-zinc-500">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                {todayFormatted}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                {readingTime} min read
              </div>
              <div className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-zinc-400" />
                0 views
              </div>
              <div className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                0 likes
              </div>
            </div>
          </div>
        </header>

        {/* Hero Cover Image */}
        {formData?.image && (
          <div className="aspect-[21/9] rounded-2xl overflow-hidden border border-zinc-200/80 dark:border-white/10 bg-zinc-100 dark:bg-zinc-900 shadow-sm mb-12">
            <EditorialImage
              src={formData.image}
              alt={formData.title}
              category={formData?.primarySection?.name || formData?.categories?.[0] || 'Article'}
              title={formData.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Main Body Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className={deviceViewport === 'desktop' ? 'lg:col-span-8 max-w-[740px]' : 'w-full'}>
            {/* Reading Toolbar Simulation */}
            <div className="mb-8">
              <ReaderSettings content={formData?.content || ''} />
            </div>

            {/* Tutorial Metadata */}
            {(formData?.contentType === 'tutorial' || formData?.contentType === 'guide') &&
              formData?.contentMetadata?.tutorialMetadata && (
                <div className="mb-8 p-5 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 grid sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
                      Difficulty Level
                    </span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {formData.contentMetadata.tutorialMetadata.difficulty || 'All Levels'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
                      Estimated Time
                    </span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {formData.contentMetadata.tutorialMetadata.estimatedTime || `${readingTime} min read`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
                      Prerequisites
                    </span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {formData.contentMetadata.tutorialMetadata.prerequisites?.join(', ') || 'None required'}
                    </span>
                  </div>
                </div>
              )}

            {/* News Editor's Note */}
            {formData?.contentType === 'news' && formData?.editorNote && (
              <div className="mb-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-300">
                <span className="font-black uppercase tracking-wider text-[10px] block mb-1">Editor's Note</span>
                <p className="leading-relaxed">{formData.editorNote}</p>
              </div>
            )}

            {/* Rendered Prose Body */}
            <div className="text-zinc-800 dark:text-zinc-200 font-serif leading-[1.8] text-[17px] sm:text-[18px]">
              <MarkdownRenderer content={formData?.content || ''} />
            </div>

            {/* Review Scorecard */}
            {formData?.contentType === 'review' && formData?.contentMetadata?.reviewMetadata && (
              <div className="mt-12 p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-white/10">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600 dark:text-red-400">
                      Verdict & Rating
                    </span>
                    <h3 className="text-xl font-bold font-display mt-1">Review Assessment</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-black font-display text-zinc-900 dark:text-white">
                      {formData.contentMetadata.reviewMetadata.rating || 4.5}
                    </span>
                    <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">/ 5.0</span>
                  </div>
                </div>

                {formData.contentMetadata.reviewMetadata.verdict && (
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 italic leading-relaxed font-serif">
                    "{formData.contentMetadata.reviewMetadata.verdict}"
                  </p>
                )}

                <div className="grid sm:grid-cols-2 gap-6 pt-2">
                  {formData.contentMetadata.reviewMetadata.pros?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 mb-3">
                        Highlights & Pros
                      </h4>
                      <ul className="space-y-2">
                        {formData.contentMetadata.reviewMetadata.pros.map((p, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                            <span className="text-emerald-500 font-bold">+</span>
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {formData.contentMetadata.reviewMetadata.cons?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-rose-600 mb-3">
                        Drawbacks & Cons
                      </h4>
                      <ul className="space-y-2">
                        {formData.contentMetadata.reviewMetadata.cons.map((c, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                            <span className="text-rose-500 font-bold">−</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sources & Citations */}
            {((formData?.sources && formData.sources.length > 0) || formData?.source?.name) && (
              <div className="mt-8 p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/10 text-xs">
                <div className="font-bold text-zinc-900 dark:text-white uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-red-500" />
                  <span>Editorial Sources & Verified Documentation</span>
                </div>
                <div className="space-y-2">
                  {formData.sources?.map((src, i) => (
                    <div key={i} className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">• {src.name}</span>
                      <span className="text-red-600 dark:text-red-400 font-mono text-[11px]">
                        {src.url} ↗
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Editorial Correction Notice */}
            {(formData?.editorial?.correction?.hasCorrection || formData?.correction) && (
              <div className="mt-6 p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 text-xs text-zinc-700 dark:text-zinc-300">
                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-black uppercase text-[10px] tracking-wider mb-1">
                  <Info className="w-3.5 h-3.5" />
                  <span>Editorial Correction Notice</span>
                </div>
                <p className="leading-relaxed">
                  {formData.editorial?.correction?.note || formData.correction?.text || formData.correction}
                </p>
              </div>
            )}

            {/* Dynamic FAQs */}
            {formData?.faqs && formData.faqs.length > 0 && (
              <section className="mt-14 border-t border-zinc-200/80 dark:border-white/10 pt-10">
                <h2 className="text-2xl font-black font-display tracking-tight text-zinc-900 dark:text-white mb-6">
                  Frequently Asked Questions
                </h2>
                <div className="space-y-3">
                  {[...formData.faqs]
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                    .map((faq, idx) => {
                      const isOpen = openFaqIndex === idx;
                      return (
                        <div
                          key={faq.id || `preview_faq_${idx}`}
                          className="rounded-2xl overflow-hidden border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-zinc-900/60"
                        >
                        <button
                          type="button"
                          onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                          className="w-full px-6 py-4 flex items-center justify-between text-left gap-4 font-bold text-zinc-900 dark:text-zinc-100 text-sm hover:text-red-600 transition-colors"
                        >
                          <span>{faq.question}</span>
                          <ChevronDown
                            className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-red-500' : ''}`}
                          />
                        </button>
                        {isOpen && (
                          <div className="py-4 px-6 border-t border-zinc-200/50 dark:border-white/[0.05]">
                            <p className="text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed text-sm font-sans">
                              {faq.answer}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* Supporting Sidebar Column (Desktop only) */}
          {deviceViewport === 'desktop' && (
            <aside className="lg:col-span-4 space-y-6">
              <div className="p-3.5 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-white/10 flex justify-around items-center text-zinc-400 text-xs">
                <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> 0 Likes</span>
                <span className="flex items-center gap-1"><Share2 className="w-3.5 h-3.5" /> Share</span>
                <span className="flex items-center gap-1"><Bookmark className="w-3.5 h-3.5" /> Save</span>
              </div>

              <div className="sticky top-20 space-y-6">
                <TableOfContents headings={headings} />

                {/* Newsletter Box */}
                <div className="p-6 rounded-2xl bg-zinc-950 text-white border border-white/10 space-y-3 shadow-xl">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                    <h3 className="font-display font-black text-xs uppercase tracking-[0.2em]">
                      The Daily Briefing
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                    Get weekly software architecture, engineering explainers, and regional reports.
                  </p>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
