'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Calendar,
  Clock,
  Share2,
  Heart,
  Mail,
  ChevronDown,
  Bookmark,
  Eye,
  Play,
  RefreshCw,
  X,
  Flame,
  Info,
  MapPin,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import TopLoader from '@/components/shared/TopLoader';
import TableOfContents from '@/components/shared/TableOfContents';
import ReaderSettings from '@/components/shared/ReaderSettings';
import Comments from '@/components/shared/Comments';
import RelatedArticles from '@/components/shared/RelatedArticles';
import ImageLightbox from '@/components/shared/ImageLightbox';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer';
import { extractHeadings } from '@/utils/markdownEngine';
import { getReadingTime } from '@/utils/readingTime';
import useToastStore from '@/store/useToastStore';

function formatViews(num) {
  if (!num || num === 0) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return num.toString();
}

export default function PostClient({ blog, relatedPosts = [] }) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(blog?.likes || 0);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [viewCount, setViewCount] = useState(blog?.views || 0);

  // Sharing & customizer state
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [typography, setTypography] = useState({
    fontFamily: 'font-sans',
    fontSize: 'prose-lg',
    lineHeight: 'leading-relaxed',
  });

  // Code playground states
  const [playgroundCode, setPlaygroundCode] = useState('');
  const [showPlayground, setShowPlayground] = useState(false);
  const [playgroundKey, setPlaygroundKey] = useState(0);

  const progressBarRef = useRef(null);
  const contentRef = useRef(null);
  const { addToast } = useToastStore();
  const maxProgressRef = useRef(0);

  // Typography customizer listener
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFamily = localStorage.getItem('teachyblogs-font-family') || 'font-sans';
      const savedSize = localStorage.getItem('teachyblogs-font-size') || 'prose-lg';
      const savedHeight = localStorage.getItem('teachyblogs-line-height') || 'leading-relaxed';
      setTypography({ fontFamily: savedFamily, fontSize: savedSize, lineHeight: savedHeight });

      const handleTypeChange = (e) => {
        setTypography(e.detail);
      };
      window.addEventListener('teachyblogs-typography-change', handleTypeChange);
      return () => window.removeEventListener('teachyblogs-typography-change', handleTypeChange);
    }
  }, []);

  // Scroll progress bar
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
          if (totalHeight > 0 && progressBarRef.current) {
            const progress = (window.scrollY / totalHeight) * 100;
            progressBarRef.current.style.width = `${progress}%`;

            if (blog?.slug) {
              const roundedProgress = Math.floor(progress);
              if (roundedProgress > maxProgressRef.current) {
                maxProgressRef.current = roundedProgress;
                localStorage.setItem(`techy-reading-progress-${blog.slug}`, roundedProgress.toString());
              }
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [blog?.slug]);

  // Load bookmark and like state
  useEffect(() => {
    if (typeof window !== 'undefined' && blog?.slug) {
      const bookmarks = JSON.parse(localStorage.getItem('techy-blogs-bookmarks') || '[]');
      setBookmarked(bookmarks.includes(blog.slug));

      const likedState = localStorage.getItem(`techy-liked-${blog.slug}`);
      setLiked(!!likedState);

      const savedProgress = parseFloat(localStorage.getItem(`techy-reading-progress-${blog.slug}`) || '0');
      maxProgressRef.current = savedProgress;

      setShareUrl(window.location.href);
    }
  }, [blog?.slug]);

  // Increment view count on mount
  useEffect(() => {
    if (!blog?.slug) return;
    const incrementViews = async () => {
      try {
        const res = await fetch(`/api/posts/slug/${blog.slug}/views`, { method: 'POST' });
        const data = await res.json();
        if (data.success) setViewCount(data.views);
      } catch (err) {
        // Silently fail
      }
    };
    incrementViews();
  }, [blog?.slug]);

  const headings = useMemo(() => {
    if (!blog?.content) return [];
    return extractHeadings(blog.content);
  }, [blog?.content]);

  const readingTime = useMemo(() => {
    if (!blog?.content) return 0;
    return getReadingTime(blog.content);
  }, [blog?.content]);

  if (!blog) return null;

  const toggleBookmark = () => {
    if (typeof window === 'undefined') return;
    const bookmarks = JSON.parse(localStorage.getItem('techy-blogs-bookmarks') || '[]');
    let updated;
    if (bookmarked) {
      updated = bookmarks.filter((slug) => slug !== blog.slug);
      setBookmarked(false);
      addToast('Removed from saved articles', 'info');
    } else {
      updated = [...bookmarks, blog.slug];
      setBookmarked(true);
      addToast('Added to saved articles', 'success');
    }
    localStorage.setItem('techy-blogs-bookmarks', JSON.stringify(updated));
  };

  const handleLikeClick = async () => {
    if (liked) {
      addToast('You already liked this article!', 'info');
      return;
    }
    try {
      const res = await fetch(`/api/posts/slug/${blog.slug}/likes`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setLikesCount(data.likes);
        setLiked(true);
        localStorage.setItem(`techy-liked-${blog.slug}`, 'true');
        addToast('Article liked!', 'success');
      }
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    const emailInput = e.target.elements[0];
    const email = emailInput?.value;
    if (!email) return;

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        addToast(data.message || 'Subscribed successfully!', 'success');
        e.target.reset();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      addToast(err.message || 'Failed to subscribe', 'error');
    }
  };

  const iframeSrcDoc = useMemo(() => {
    if (!playgroundCode) return '';
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              padding: 20px;
              color: #1f2937;
              background-color: #ffffff;
              margin: 0;
            }
            * { box-sizing: border-box; }
            h1, h2 { color: #111827; }
            button {
              background: #dc2626;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 600;
            }
            button:hover { background: #b91c1c; }
          </style>
        </head>
        <body>
          ${
            playgroundCode.includes('<!DOCTYPE') || playgroundCode.includes('<html')
              ? playgroundCode
              : `
            <div id="root"></div>
            <script>
              console.log = function(...args) {
                const div = document.createElement('div');
                div.style.color = '#4b5563';
                div.style.borderBottom = '1px solid #f3f4f6';
                div.style.padding = '8px 0';
                div.style.fontFamily = 'monospace';
                div.style.fontSize = '13px';
                div.textContent = 'LOG: ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
                document.body.appendChild(div);
              };
            </script>
            ${playgroundCode.includes('<script>') ? playgroundCode : `<script>${playgroundCode}<\/script>`}
          `
          }
        </body>
      </html>
    `;
  }, [playgroundCode]);

  return (
    <div className="pb-24 pt-32 relative">
      <TopLoader />
      <ImageLightbox />

      {/* Reading Progress Bar */}
      <div
        ref={progressBarRef}
        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-red-600 to-red-500 z-[100] transition-all duration-75"
        style={{ width: '0%' }}
      />

      {/* Header */}
      <header className="container mx-auto px-6 md:px-12 max-w-[1400px] mb-12">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400"
        >
          <Link href="/" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">
            Home
          </Link>
          <span>/</span>
          {blog.primarySection ? (
            <>
              <Link
                href={`/section/${blog.primarySection.slug || blog.primarySection}`}
                className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                {blog.primarySection.name || blog.primarySection}
              </Link>
              <span>/</span>
            </>
          ) : (
            <>
              <Link href="/blogs" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">
                Stories
              </Link>
              <span>/</span>
            </>
          )}
          {blog.primaryRegion && (
            <>
              <Link
                href={blog.primaryRegion.slug === 'kashmir' ? '/kashmir' : `/edition/${blog.primaryRegion.slug}`}
                className="hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <MapPin className="w-3 h-3 text-red-500" />
                {blog.primaryRegion.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-zinc-400 dark:text-zinc-500 truncate max-w-xs">{blog.title}</span>
        </nav>

        <div className="space-y-6">
          {/* Content Type & Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {(blog.editorial?.breaking || blog.breaking) && (
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.18em] bg-red-600 text-white px-3 py-1 rounded-full animate-pulse shadow-md shadow-red-600/20">
                <Flame className="w-3.5 h-3.5" /> Breaking News
              </span>
            )}
            <span className="text-[10px] font-black uppercase tracking-widest text-red-700 dark:text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20 font-mono">
              {blog.contentType || 'Article'}
            </span>
            {blog.primaryTopic && (
              <Link
                href={`/topic/${blog.primaryTopic.slug}`}
                className="text-[9px] font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full border border-zinc-200 dark:border-white/10 hover:border-red-500 transition-colors"
              >
                {blog.primaryTopic.name}
              </Link>
            )}
            {(blog.editorial?.locationName || blog.primaryRegion) && (
              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-red-700 dark:text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                <MapPin className="w-3 h-3" />
                {blog.editorial?.locationName || blog.primaryRegion?.name}
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-zinc-900 dark:text-white leading-[1.12] tracking-tight font-display">
            {blog.title}
          </h1>

          {/* Subtitle / Dek */}
          {blog.subtitle && (
            <p className="text-lg md:text-xl font-medium text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-4xl">
              {blog.subtitle}
            </p>
          )}

          {/* Editorial Correction Notice Banner */}
          {(blog.editorial?.correction?.hasCorrection || blog.correction?.text) && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-3 max-w-3xl">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold uppercase tracking-wider block mb-0.5">Editorial Correction Note</span>
                <p className="leading-relaxed">
                  {blog.editorial?.correction?.note || blog.correction?.text}
                  {blog.editorial?.correction?.correctedAt && (
                    <span className="text-[10px] text-amber-500/80 block mt-1">
                      Updated: {new Date(blog.editorial.correction.correctedAt).toLocaleString()}
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Metadata & Author Profile */}
          <div className="flex flex-wrap items-center justify-between gap-6 pt-6 border-t border-zinc-200/80 dark:border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center font-black text-sm font-display shadow-md">
                {blog.author ? blog.author[0] : 'T'}
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {blog.author || 'Editorial Bureau'}
                </p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
                  {blog.primaryAuthor?.role || 'Staff Writer'} · TeachyBlogs
                </p>
              </div>
            </div>

            <div className="flex items-center gap-5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
              <div className="flex items-center gap-1.5" suppressHydrationWarning>
                <Calendar className="w-4 h-4 text-zinc-400" />
                {blog.date ||
                  new Date(blog.publishedAt || blog.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-zinc-400" />
                {readingTime} Min Read
              </div>
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-zinc-400" />
                {formatViews(viewCount)} Views
              </div>
              <div className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-500" />
                {formatViews(likesCount)} Likes
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Featured Cover Image */}
      <section className="container mx-auto px-6 md:px-12 max-w-[1400px] mb-16">
        <div className="aspect-[21/9] rounded-2xl overflow-hidden border border-zinc-200/50 dark:border-white/[0.06] bg-zinc-100 dark:bg-zinc-900 shadow-xl shadow-zinc-200/20 dark:shadow-black/20">
          <img src={blog.image} alt={blog.title} className="w-full h-full object-cover" />
        </div>
      </section>

      {/* Body Content Grid */}
      <article className="container mx-auto px-6 md:px-12 max-w-[1400px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Main prose column with comfortable measure */}
          <div className="lg:col-span-8 max-w-[780px]">
            <div className="mb-10">
              <ReaderSettings content={blog.content} />
            </div>

            {/* Tutorial & Guide Meta Bar */}
            {(blog.contentType === 'tutorial' || blog.contentType === 'guide') &&
              blog.contentMetadata?.tutorialMetadata && (
                <div className="mb-8 p-5 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 grid sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
                      Difficulty Level
                    </span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {blog.contentMetadata.tutorialMetadata.difficulty || 'All Levels'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
                      Estimated Time
                    </span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {blog.contentMetadata.tutorialMetadata.estimatedTime || `${readingTime} min read`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
                      Prerequisites
                    </span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {blog.contentMetadata.tutorialMetadata.prerequisites?.join(', ') || 'None required'}
                    </span>
                  </div>
                </div>
              )}

            {/* News & Reporting Note */}
            {blog.contentType === 'news' && blog.editorNote && (
              <div className="mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-300">
                <span className="font-black uppercase tracking-wider text-[10px] block mb-1">Editor's Note</span>
                <p className="leading-relaxed">{blog.editorNote}</p>
              </div>
            )}

            <div ref={contentRef}>
              <MarkdownRenderer
                content={blog.content}
                typography={typography}
                onCodePlay={(code) => {
                  setPlaygroundCode(code);
                  setPlaygroundKey((prev) => prev + 1);
                  setShowPlayground(true);
                }}
              />
            </div>

            {/* Review Scorecard */}
            {blog.contentType === 'review' && blog.contentMetadata?.reviewMetadata && (
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
                      {blog.contentMetadata.reviewMetadata.rating || 4.5}
                    </span>
                    <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">/ 5.0</span>
                  </div>
                </div>

                {blog.contentMetadata.reviewMetadata.verdict && (
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 italic leading-relaxed">
                    "{blog.contentMetadata.reviewMetadata.verdict}"
                  </p>
                )}

                <div className="grid sm:grid-cols-2 gap-6 pt-2">
                  {blog.contentMetadata.reviewMetadata.pros?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 mb-3">
                        Highlights & Pros
                      </h4>
                      <ul className="space-y-2">
                        {blog.contentMetadata.reviewMetadata.pros.map((p, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                            <span className="text-emerald-500 font-bold">+</span>
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {blog.contentMetadata.reviewMetadata.cons?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-rose-600 mb-3">
                        Drawbacks & Cons
                      </h4>
                      <ul className="space-y-2">
                        {blog.contentMetadata.reviewMetadata.cons.map((c, idx) => (
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

            {/* Multi-Sources & Attribution Citation */}
            {((blog.sources && blog.sources.length > 0) || blog.source?.name) && (
              <div className="mt-8 p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/10 text-xs">
                <div className="font-bold text-zinc-900 dark:text-white uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-red-500" />
                  <span>Editorial Sources & Documentation</span>
                </div>
                <div className="space-y-1.5">
                  {blog.sources?.map((src, i) => (
                    <div key={i} className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                      <span>• {src.name}</span>
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-600 dark:text-red-400 hover:underline font-mono text-[11px]"
                      >
                        Access Reference ↗
                      </a>
                    </div>
                  ))}
                  {blog.source?.name && !blog.sources?.length && (
                    <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                      <span>• {blog.source.name}</span>
                      {blog.source.url && (
                        <a
                          href={blog.source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-red-600 dark:text-red-400 hover:underline font-mono text-[11px]"
                        >
                          Access Reference ↗
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Social Share Strip Below Content */}
            <div className="mt-12 p-6 rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.02] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">Share this story</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  Spread independent journalism and technical reporting.
                </p>
              </div>
              <div className="flex gap-2">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(blog.title)}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-white/[0.05] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/[0.1] transition-colors"
                >
                  X / Twitter
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-white/[0.05] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/[0.1] transition-colors"
                >
                  LinkedIn
                </a>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(blog.title + ' ' + shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-white/[0.05] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/[0.1] transition-colors"
                >
                  WhatsApp
                </a>
              </div>
            </div>

            {/* Dynamic FAQs accordion */}
            {blog.faqs && blog.faqs.length > 0 && (
              <section className="mt-16 border-t border-zinc-200/80 dark:border-white/[0.06] pt-14">
                <div className="max-w-3xl">
                  <h2 className="text-2xl font-black font-display tracking-tight text-zinc-900 dark:text-white mb-2">
                    Frequently Asked Questions
                  </h2>
                  <p className="text-zinc-500 dark:text-zinc-400 font-medium mb-8 text-sm font-sans">
                    Key takeaways and answers regarding this topic.
                  </p>
                  <div className="space-y-3">
                    {blog.faqs.map((faq, idx) => {
                      const isOpen = openFaqIndex === idx;
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="rounded-2xl overflow-hidden border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-zinc-900/60"
                        >
                          <button
                            type="button"
                            onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                            className="w-full px-6 py-4 flex items-center justify-between text-left gap-4 font-bold text-zinc-900 dark:text-zinc-100 text-sm group transition-colors hover:text-red-600 dark:hover:text-red-400"
                          >
                            <span>{faq.question}</span>
                            <ChevronDown
                              className={`w-4 h-4 shrink-0 text-zinc-400 transition-transform duration-300 ${
                                isOpen ? 'rotate-180 text-red-500' : 'group-hover:text-zinc-600'
                              }`}
                            />
                          </button>
                          <div
                            className={`transition-all duration-300 ease-in-out ${
                              isOpen
                                ? 'max-h-60 opacity-100 py-4 px-6 border-t border-zinc-200/50 dark:border-white/[0.05]'
                                : 'max-h-0 opacity-0 overflow-hidden'
                            }`}
                          >
                            <p className="text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed text-sm font-sans">
                              {faq.answer}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* Comments Section */}
            <Comments slug={blog.slug} />
          </div>

          {/* Sidebar Panel */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Likes/Share panel */}
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-white/10 flex justify-around items-center relative shadow-sm">
              <button
                onClick={handleLikeClick}
                className={`flex flex-col items-center gap-1 transition-all group ${
                  liked ? 'text-rose-500' : 'text-zinc-400 hover:text-rose-500'
                }`}
              >
                <Heart className={`w-5 h-5 ${liked ? 'fill-current scale-110' : 'group-hover:scale-110 transition-transform'}`} />
                <span className="text-[9px] font-bold tracking-wider uppercase">Like</span>
              </button>
              <div className="h-7 w-px bg-zinc-200 dark:bg-white/10" />

              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className={`flex flex-col items-center gap-1 transition-all group ${
                  showShareMenu ? 'text-red-500' : 'text-zinc-400 hover:text-red-500'
                }`}
              >
                <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-bold tracking-wider uppercase">Share</span>
              </button>
              <div className="h-7 w-px bg-zinc-200 dark:bg-white/10" />

              <button
                onClick={toggleBookmark}
                className={`flex flex-col items-center gap-1 transition-all group ${
                  bookmarked ? 'text-amber-500' : 'text-zinc-400 hover:text-amber-500'
                }`}
              >
                <Bookmark
                  className={`w-5 h-5 ${
                    bookmarked ? 'fill-current scale-110 text-amber-500' : 'group-hover:scale-110 transition-transform'
                  }`}
                />
                <span className="text-[9px] font-bold tracking-wider uppercase">Save</span>
              </button>
            </div>

            {/* Table of Contents */}
            <div className="lg:sticky lg:top-24 space-y-6">
              <TableOfContents headings={headings} />

              {/* Newsletter panel */}
              <div className="p-6 rounded-2xl bg-zinc-950 text-white border border-white/10 space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-white font-display">
                  The Daily Briefing
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Get our weekly digest of software architecture, engineering explainers, and regional news.
                </p>
                <form onSubmit={handleNewsletterSubmit} className="space-y-2 pt-1">
                  <input
                    type="email"
                    placeholder="Enter email address"
                    className="w-full px-3 py-2.5 rounded-xl text-xs bg-zinc-900 border border-white/15 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-red-600 hover:bg-red-500 text-white transition-colors flex items-center justify-center gap-2"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Subscribe
                  </button>
                </form>
              </div>
            </div>
          </aside>
        </div>
      </article>

      {/* Related Articles */}
      <div className="container mx-auto px-6 md:px-12 max-w-[1400px] mt-16">
        <RelatedArticles currentSlug={blog.slug} posts={relatedPosts} />
      </div>

      {/* Interactive Code Playground Modal */}
      <AnimatePresence>
        {showPlayground && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 md:p-8">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col w-full h-full max-w-6xl max-h-[85vh]"
            >
              <div className="px-6 py-4 border-b border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-display">
                    Interactive Code Sandbox
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-medium">
                    Edit code on the left to test live results on the right.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPlaygroundKey((prev) => prev + 1)}
                    className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
                    title="Reload Sandbox"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowPlayground(false)}
                    className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
                    title="Close Sandbox"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
                <div className="flex flex-col border-r border-zinc-200 dark:border-white/10">
                  <div className="bg-zinc-100/50 dark:bg-zinc-950/20 px-4 py-2 border-b border-zinc-200 dark:border-white/10 text-[9px] font-black uppercase tracking-wider text-zinc-400">
                    Source Editor
                  </div>
                  <textarea
                    value={playgroundCode}
                    onChange={(e) => setPlaygroundCode(e.target.value)}
                    className="flex-1 p-5 font-mono text-xs outline-none bg-zinc-50 text-zinc-800 dark:bg-[#0b0f19] dark:text-zinc-200 resize-none overflow-y-auto"
                    spellCheck="false"
                  />
                </div>

                <div className="flex flex-col bg-white dark:bg-zinc-900">
                  <div className="bg-zinc-100/50 dark:bg-zinc-950/20 px-4 py-2 border-b border-zinc-200 dark:border-white/10 text-[9px] font-black uppercase tracking-wider text-zinc-400">
                    Live Result
                  </div>
                  <iframe
                    key={playgroundKey}
                    srcDoc={iframeSrcDoc}
                    className="flex-1 bg-white border-none"
                    sandbox="allow-scripts"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
