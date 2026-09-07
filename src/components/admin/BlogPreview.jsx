'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Heart, Bookmark, Eye, RefreshCw, X, AlertCircle } from 'lucide-react';
import TableOfContents from '@/components/shared/TableOfContents';
import ReaderSettings from '@/components/shared/ReaderSettings';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer';
import { extractHeadings } from '@/utils/markdownEngine';
import { getReadingTime } from '@/utils/readingTime';
import useToastStore from '@/store/useToastStore';

export default function BlogPreview({ formData }) {
  const { addToast } = useToastStore();
  const [typography, setTypography] = useState({
    fontFamily: 'font-sans',
    fontSize: 'prose-lg',
    lineHeight: 'leading-relaxed',
  });

  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  // Playground modal
  const [playgroundCode, setPlaygroundCode] = useState('');
  const [showPlayground, setShowPlayground] = useState(false);
  const [playgroundKey, setPlaygroundKey] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFamily = localStorage.getItem('techyblogs-font-family') || 'font-sans';
      const savedSize = localStorage.getItem('techyblogs-font-size') || 'prose-lg';
      const savedHeight = localStorage.getItem('techyblogs-line-height') || 'leading-relaxed';
      setTypography({ fontFamily: savedFamily, fontSize: savedSize, lineHeight: savedHeight });

      const handleTypeChange = (e) => {
        setTypography(e.detail);
      };
      window.addEventListener('techyblogs-typography-change', handleTypeChange);
      return () => window.removeEventListener('techyblogs-typography-change', handleTypeChange);
    }
  }, []);

  const headings = useMemo(() => {
    return extractHeadings(formData.content);
  }, [formData.content]);

  const readingTime = useMemo(() => {
    return getReadingTime(formData.content);
  }, [formData.content]);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      {/* Editorial Preview Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white px-6 py-2.5 text-xs font-bold flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Eye className="w-4 h-4" /> Live Editorial High-Fidelity Simulation
        </span>
        <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-extrabold">
          {formData.status || 'Draft'}
        </span>
      </div>

      <div className="p-6 md:p-12 max-w-5xl mx-auto">
        {/* Article Masthead */}
        <header className="mb-10 pb-8 border-b border-zinc-200 dark:border-white/10 space-y-4">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              {formData.categories?.[0] || 'Article'}
            </span>
            <span className="text-zinc-400 text-xs">•</span>
            <span className="text-xs text-zinc-500 flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5" /> {readingTime} min read
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black font-display tracking-tight text-zinc-900 dark:text-white leading-tight">
            {formData.title || 'Untitled Article'}
          </h1>

          {formData.subtitle && (
            <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed">
              {formData.subtitle}
            </p>
          )}

          {formData.image && (
            <div className="pt-4">
              <img
                src={formData.image}
                alt={formData.title}
                className="w-full aspect-[1200/630] object-cover rounded-2xl shadow-xl"
              />
            </div>
          )}
        </header>

        {/* Reader Toolbar */}
        <div className="flex items-center justify-between pb-8 mb-8 border-b border-zinc-200 dark:border-white/10">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                setLiked(!liked);
                setLikesCount((prev) => (liked ? prev - 1 : prev + 1));
                addToast({ message: liked ? 'Removed like' : 'Article liked!', type: 'info' });
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                liked
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                  : 'border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500'
              }`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
              <span>{likesCount}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setBookmarked(!bookmarked);
                addToast({ message: bookmarked ? 'Bookmark removed' : 'Article bookmarked!', type: 'info' });
              }}
              className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                bookmarked
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                  : 'border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>

          <ReaderSettings />
        </div>

        {/* Article Body & Table of Contents */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            <MarkdownRenderer
              content={formData.content}
              typography={typography}
              onCodePlay={(code) => {
                setPlaygroundCode(code);
                setPlaygroundKey((prev) => prev + 1);
                setShowPlayground(true);
              }}
            />

            {/* FAQs Accordion */}
            {formData.faqs && formData.faqs.length > 0 && (
              <section className="mt-16 pt-10 border-t border-zinc-200 dark:border-white/10">
                <h3 className="text-xl font-bold font-display tracking-tight mb-6">Frequently Asked Questions</h3>
                <div className="space-y-3">
                  {formData.faqs.map((faq, idx) => (
                    <div
                      key={idx}
                      className="border border-zinc-200 dark:border-white/10 rounded-xl overflow-hidden bg-zinc-50/50 dark:bg-zinc-950/30"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                        className="w-full text-left px-5 py-4 text-sm font-bold flex items-center justify-between gap-4 hover:text-indigo-600 transition-colors"
                      >
                        <span>{faq.question}</span>
                        <span className="text-lg font-mono">{openFaqIndex === idx ? '−' : '+'}</span>
                      </button>
                      {openFaqIndex === idx && (
                        <div className="px-5 pb-4 text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed border-t border-zinc-200/50 dark:border-white/5 pt-3">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Table of Contents Column */}
          {headings.length > 0 && (
            <div className="hidden lg:block lg:col-span-4">
              <div className="sticky top-28">
                <TableOfContents headings={headings} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Code Playground Modal */}
      <AnimatePresence>
        {showPlayground && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
              <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300 font-mono flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live JS / Code Sandbox
                </span>
                <button
                  type="button"
                  onClick={() => setShowPlayground(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5">
                <pre className="p-4 rounded-xl bg-black font-mono text-xs text-emerald-400 overflow-x-auto max-h-60 mb-4">
                  {playgroundCode}
                </pre>
                <div className="text-[11px] text-zinc-500 italic">
                  Interactive evaluation executed in isolated sandbox.
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
