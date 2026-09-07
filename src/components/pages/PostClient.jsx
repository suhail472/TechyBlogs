'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
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
  Check,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import TopLoader from '@/components/shared/TopLoader';
import TableOfContents from '@/components/shared/TableOfContents';
import ReaderSettings from '@/components/shared/ReaderSettings';
import Comments from '@/components/shared/Comments';
import RelatedArticles from '@/components/shared/RelatedArticles';
import ImageLightbox from '@/components/shared/ImageLightbox';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer';
import EditorialImage from '@/components/shared/EditorialImage';
import { extractHeadings } from '@/utils/markdownEngine';
import { getReadingTime } from '@/utils/readingTime';
import useToastStore from '@/store/useToastStore';
import AiReaderDrawer from '@/components/ai/AiReaderDrawer';

function formatViews(num) {
  if (!num || num === 0) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return num.toString();
}

export default function PostClient({ blog: propBlog, post: propPost, relatedPosts = [] }) {
  const blog = propBlog || propPost;
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(blog?.likes || 0);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [viewCount, setViewCount] = useState(blog?.views || 0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  // Sharing & customizer state
  const [shareUrl, setShareUrl] = useState('');
  const [typography, setTypography] = useState({
    fontFamily: 'font-sans',
    fontSize: 'prose-lg',
    lineHeight: 'leading-loose',
  });

  // Code playground states
  const [playgroundCode, setPlaygroundCode] = useState('');
  const [showPlayground, setShowPlayground] = useState(false);
  const [playgroundKey, setPlaygroundKey] = useState(0);

  const progressBarRef = useRef(null);
  const contentRef = useRef(null);
  const { addToast } = useToastStore();
  const maxProgressRef = useRef(0);

  // Typography customizer and Focus Mode listener
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFamily = localStorage.getItem('techyblogs-font-family') || 'font-sans';
      const savedSize = localStorage.getItem('techyblogs-font-size') || 'prose-lg';
      const savedHeight = localStorage.getItem('techyblogs-line-height') || 'leading-loose';
      setTypography({ fontFamily: savedFamily, fontSize: savedSize, lineHeight: savedHeight });

      const savedFocus = localStorage.getItem('techyblogs-reader-focus-mode');
      if (savedFocus === 'true') {
        setFocusMode(true);
      }

      const handleTypeChange = (e) => {
        setTypography(e.detail);
      };
      const handleFocusToggleEvent = () => {
        setFocusMode((prev) => {
          const next = !prev;
          localStorage.setItem('techyblogs-reader-focus-mode', String(next));
          return next;
        });
      };

      window.addEventListener('techyblogs-typography-change', handleTypeChange);
      window.addEventListener('techyblogs-focus-mode-toggle', handleFocusToggleEvent);
      return () => {
        window.removeEventListener('techyblogs-typography-change', handleTypeChange);
        window.removeEventListener('techyblogs-focus-mode-toggle', handleFocusToggleEvent);
      };
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

  const toggleFocusMode = () => {
    const next = !focusMode;
    setFocusMode(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('techyblogs-reader-focus-mode', String(next));
    }
    addToast(next ? 'Zen Focus Mode active — distraction-free reading canvas' : 'Focus Mode exited — standard layout restored', 'info');
  };

  const toggleBookmark = () => {
    if (typeof window === 'undefined') return;
    const bookmarks = JSON.parse(localStorage.getItem('techy-blogs-bookmarks') || '[]');
    let updated;
    if (bookmarked) {
      updated = bookmarks.filter((slug) => slug !== blog.slug);
      setBookmarked(false);
      addToast('Removed from bookmarks', 'info');
    } else {
      updated = [...bookmarks, blog.slug];
      setBookmarked(true);
      addToast('Saved to your bookmarks!', 'success');
    }
    localStorage.setItem('techy-blogs-bookmarks', JSON.stringify(updated));
  };

  const handleLikeClick = async () => {
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

    if (nextLiked) {
      localStorage.setItem(`techy-liked-${blog.slug}`, 'true');
      addToast('Thanks for your appreciation!', 'success');
    } else {
      localStorage.removeItem(`techy-liked-${blog.slug}`);
      addToast('Like removed', 'info');
    }

    try {
      const res = await fetch(`/api/posts/slug/${blog.slug}/likes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: nextLiked ? 'like' : 'unlike' }),
      });
      const data = await res.json();
      if (data.success) {
        setLikesCount(data.likes);
      }
    } catch (err) {
      // Revert if network failed
      setLiked(!nextLiked);
      setLikesCount((prev) => (nextLiked ? Math.max(0, prev - 1) : prev + 1));
      addToast('Could not record like', 'error');
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      addToast('Article link copied to clipboard!', 'success');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const [newsletterSubscribing, setNewsletterSubscribing] = useState(false);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    const emailInput = e.target.elements[0];
    const email = emailInput?.value?.trim();
    if (!email || newsletterSubscribing) return;

    setNewsletterSubscribing(true);
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'article', articleSlug: blog?.slug }),
      });
      const data = await res.json();
      if (data.success) {
        addToast(data.message || 'Subscribed! You will receive our weekly editorial briefing.', 'success');
        e.target.reset();
      } else {
        throw new Error(data.message || 'Subscription failed');
      }
    } catch (err) {
      addToast(err.message || 'Subscription could not be processed.', 'error');
    } finally {
      setNewsletterSubscribing(false);
    }
  };

  const iframeSrcDoc = useMemo(() => {
    if (!playgroundCode) return '';
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 1rem; color: #1f2937; margin: 0; }
          </style>
        </head>
        <body>
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
        </body>
      </html>
    `;
  }, [playgroundCode]);

  return (
    <div className="pb-24 pt-20 sm:pt-28 md:pt-32 relative">
      <TopLoader />
      <ImageLightbox />

      {/* Reading Progress Indicator (Subtle 2.5px Red Bar) */}
      <div
        ref={progressBarRef}
        className="fixed top-0 left-0 right-0 h-[2.5px] bg-red-600 z-[100] transition-all duration-75"
        style={{ width: '0%' }}
      />

      {/* Header */}
      <header className="w-full mx-auto px-4 sm:px-6 md:px-12 max-w-[1600px] mb-8 sm:mb-12">
        {/* Quiet, Elegant Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-4 sm:mb-6 flex items-center gap-2 text-xs font-medium text-zinc-400 dark:text-zinc-500 overflow-hidden"
        >
          <Link href="/" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">
            Frontpage
          </Link>
          <span>/</span>
          {blog.primarySection ? (
            <>
              <Link
                href={`/section/${blog.primarySection.slug || blog.primarySection}`}
                className="hover:text-red-600 dark:hover:text-red-400 transition-colors capitalize"
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
          <span className="text-zinc-600 dark:text-zinc-300 font-semibold truncate max-w-[160px] sm:max-w-xs md:max-w-md lg:max-w-xl xl:max-w-3xl">
            {blog.title}
          </span>
        </nav>

        <div className="space-y-6 w-full">
          {/* Content Type & Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {(blog.editorial?.breaking || blog.breaking) && (
              <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] bg-red-600 text-white px-2.5 py-0.5 rounded-md shadow-sm">
                <Flame className="w-3 h-3" /> BREAKING
              </span>
            )}
            <span className="text-[10px] font-black uppercase tracking-widest text-red-700 dark:text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-md border border-red-500/20 font-mono">
              {blog.contentType || 'Article'}
            </span>
            {blog.primaryTopic && (
              <Link
                href={`/topic/${blog.primaryTopic.slug}`}
                className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-md border border-zinc-200 dark:border-white/10 hover:border-red-500 transition-colors"
              >
                {blog.primaryTopic.name}
              </Link>
            )}
            {(blog.editorial?.locationName || blog.primaryRegion) && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                <MapPin className="w-3 h-3" />
                {blog.editorial?.locationName || blog.primaryRegion?.name}
              </span>
            )}
          </div>

          {/* Authoritative Display Headline — Full-Width Editorial Canvas */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.65rem] xl:text-[2.95rem] font-bold sm:font-extrabold text-zinc-900 dark:text-white leading-[1.2] sm:leading-[1.18] tracking-[-0.015em] font-display w-full max-w-none">
            {blog.title}
          </h1>

          {/* Subtitle / Dek */}
          {blog.subtitle && (
            <p className="text-base sm:text-lg md:text-xl font-normal sm:font-medium text-zinc-600 dark:text-zinc-300 leading-relaxed w-full max-w-none font-sans">
              {blog.subtitle}
            </p>
          )}

          {/* Metadata & Journalistic Author Profile */}
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-4 sm:gap-6 pt-4 sm:pt-6 border-t border-zinc-200/80 dark:border-white/10 w-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center font-black text-sm font-display shadow-sm">
                {blog.author ? blog.author[0] : 'T'}
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-display">
                  {blog.author || 'Editorial Bureau'}
                </p>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
                  {blog.primaryAuthor?.role || 'Senior Regional Correspondent'} · TechyBlogs
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 sm:gap-5 text-xs font-semibold text-zinc-400 dark:text-zinc-500">
              <div className="flex items-center gap-1.5" suppressHydrationWarning>
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                {blog.date ||
                  new Date(blog.publishedAt || blog.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                {readingTime} min read
              </div>
              <div className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-zinc-400" />
                {formatViews(viewCount)} views
              </div>
              <div className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                {formatViews(likesCount)} likes
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Featured Cover Hero Image — edge-to-edge on mobile */}
      <section className="w-full mx-auto px-0 sm:px-6 md:px-12 max-w-[1600px] mb-8 sm:mb-14">
        <div className="aspect-[1200/630] sm:rounded-2xl overflow-hidden border-y sm:border border-zinc-200/80 dark:border-white/10 bg-zinc-100 dark:bg-zinc-900 shadow-sm">
          <EditorialImage
            src={blog.image}
            alt={blog.title}
            category={blog.primarySection?.name || blog.categories?.[0] || 'Article'}
            title={blog.title}
            priority={true}
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* Body Content Grid */}
      <article className={`w-full mx-auto px-4 sm:px-6 md:px-10 lg:px-12 ${focusMode ? 'max-w-[1280px]' : 'max-w-[1536px]'} transition-all duration-300`}>
        <div className={`grid grid-cols-1 ${focusMode ? 'w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto' : 'lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]'} gap-8 xl:gap-12 items-start w-full transition-all duration-300`}>
          {/* Main prose column — in normal mode fills 1fr right up to sidebar; in focus mode takes 100% of the centered container */}
          <div className="min-w-0 w-full">
            {/* Mobile-only: Collapsible Table of Contents BEFORE article */}
            {!focusMode && headings.length > 0 && (
              <div className="lg:hidden mb-6">
                <TableOfContents headings={headings} compact />
              </div>
            )}

            {/* Collapsible Reading Toolbar */}
            <div className="mb-6 sm:mb-10 w-full">
              <ReaderSettings
                content={blog.content}
                focusMode={focusMode}
                onToggleFocusMode={toggleFocusMode}
              />
            </div>

            {/* Tutorial & Guide Meta Bar */}
            {(blog.contentType === 'tutorial' || blog.contentType === 'guide') &&
              blog.contentMetadata?.tutorialMetadata && (
                <div className="mb-8 p-5 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 grid sm:grid-cols-3 gap-4 text-xs w-full">
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
              <div className="mb-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-300 w-full">
                <span className="font-black uppercase tracking-wider text-[10px] block mb-1">Editor's Note</span>
                <p className="leading-relaxed">{blog.editorNote}</p>
              </div>
            )}

            {/* Main Long-form Prose Body */}
            <div ref={contentRef} className="w-full text-zinc-800 dark:text-zinc-200 font-sans leading-loose text-[17px] sm:text-[18px]">
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
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 italic leading-relaxed font-serif">
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
                  <span>Editorial Sources & Verified Documentation</span>
                </div>
                <div className="space-y-2">
                  {blog.sources?.map((src, i) => (
                    <div key={i} className="flex flex-wrap items-center justify-between gap-2 text-zinc-600 dark:text-zinc-400">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">• {src.name}</span>
                        {src.type && (
                          <span className="text-[9px] uppercase px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold">
                            {src.type}
                          </span>
                        )}
                      </div>
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-600 dark:text-red-400 hover:underline font-mono text-[11px]"
                      >
                        Access Source ↗
                      </a>
                    </div>
                  ))}
                  {blog.source?.name && !blog.sources?.length && (
                    <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">• {blog.source.name}</span>
                      {blog.source.url && (
                        <a
                          href={blog.source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-red-600 dark:text-red-400 hover:underline font-mono text-[11px]"
                        >
                          Access Source ↗
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Editorial Correction Notice */}
            {(blog.editorial?.correction?.hasCorrection || blog.correction || blog.revisionNote) && (
              <div className="mt-6 p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 text-xs text-zinc-700 dark:text-zinc-300">
                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-black uppercase text-[10px] tracking-wider mb-1">
                  <Info className="w-3.5 h-3.5" />
                  <span>Editorial Correction Notice</span>
                </div>
                <p className="leading-relaxed">
                  {blog.editorial?.correction?.note || blog.correction?.text || blog.correction || blog.revisionNote}
                </p>
              </div>
            )}

            {/* Social Share Strip Below Content */}
            <div className="mt-12 p-6 rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.02] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-white font-display">Share this reporting</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  Independent journalism and regional news coverage.
                </p>
              </div>
              <div className="flex gap-2">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(blog.title)}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-white/[0.05] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/[0.1] transition-colors"
                >
                  X / Twitter
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-white/[0.05] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/[0.1] transition-colors"
                >
                  LinkedIn
                </a>
                <button
                  onClick={handleCopyLink}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-white/[0.05] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/[0.1] transition-colors flex items-center gap-1"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : null}
                  <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                </button>
              </div>
            </div>

            {/* Dynamic FAQs accordion */}
            {blog.faqs && blog.faqs.length > 0 && (
              <section className="mt-16 border-t border-zinc-200/80 dark:border-white/10 pt-14">
                <div className="w-full">
                  <h2 className="text-2xl font-black font-display tracking-tight text-zinc-900 dark:text-white mb-2">
                    Frequently Asked Questions
                  </h2>
                  <p className="text-zinc-500 dark:text-zinc-400 font-medium mb-8 text-sm font-sans">
                    Key takeaways and questions regarding this story.
                  </p>
                  <div className="space-y-3">
                    {blog.faqs.map((faq, idx) => {
                      const isOpen = openFaqIndex === idx;
                      return (
                        <div
                          key={idx}
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
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* Reader Discussion Section */}
            <Comments slug={blog.slug} />
          </div>

          {/* Sidebar Supporting Rail - Sticky on Scroll — DESKTOP ONLY */}
          {!focusMode && (
            <aside className="hidden lg:block w-full lg:sticky lg:top-24 self-start space-y-3.5">
              {/* Unified Article Utility Actions Rail */}
              <div className="p-2.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-white/10 flex justify-around items-center shadow-xs">
                <button
                  onClick={handleLikeClick}
                  className={`flex flex-col items-center gap-0.5 transition-all group ${
                    liked ? 'text-rose-500' : 'text-zinc-500 hover:text-rose-500'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current scale-110' : 'group-hover:scale-110 transition-transform'}`} />
                  <span className="text-[8.5px] font-black tracking-wider uppercase">{likesCount} Likes</span>
                </button>
                <div className="h-5 w-px bg-zinc-200 dark:bg-white/10" />

                <button
                  onClick={handleCopyLink}
                  className="flex flex-col items-center gap-0.5 transition-all text-zinc-500 hover:text-red-500 group"
                >
                  <Share2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  <span className="text-[8.5px] font-black tracking-wider uppercase">Share</span>
                </button>
                <div className="h-5 w-px bg-zinc-200 dark:bg-white/10" />

                <button
                  onClick={toggleBookmark}
                  className={`flex flex-col items-center gap-0.5 transition-all group ${
                    bookmarked ? 'text-amber-500' : 'text-zinc-500 hover:text-amber-500'
                  }`}
                >
                  <Bookmark
                    className={`w-3.5 h-3.5 ${
                      bookmarked ? 'fill-current scale-110 text-amber-500' : 'group-hover:scale-110 transition-transform'
                    }`}
                  />
                  <span className="text-[8.5px] font-black tracking-wider uppercase">{bookmarked ? 'Saved' : 'Save'}</span>
                </button>
                <div className="h-5 w-px bg-zinc-200 dark:bg-white/10" />

                <button
                  onClick={toggleFocusMode}
                  className="flex flex-col items-center gap-0.5 transition-all text-zinc-500 hover:text-amber-500 group"
                  title="Distraction-Free Focus Mode"
                >
                  <Maximize2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  <span className="text-[8.5px] font-black tracking-wider uppercase">Focus</span>
                </button>
              </div>

              {/* Table of Contents */}
              <TableOfContents headings={headings} />

                {/* Publication Newsletter Module (Editorial Card - Not Black) */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#181d28] text-zinc-900 dark:text-zinc-100 border border-slate-200/90 dark:border-white/10 space-y-2.5 shadow-2xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                    <h3 className="font-display font-black text-[11px] uppercase tracking-[0.16em] text-zinc-900 dark:text-zinc-100">
                      The Daily Briefing
                    </h3>
                  </div>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
                    Weekly software architecture, engineering explainers, and regional reports.
                  </p>
                  <form onSubmit={handleNewsletterSubmit} className="flex items-center gap-1.5 pt-0.5">
                    <input
                      type="email"
                      placeholder="Enter email..."
                      disabled={newsletterSubscribing}
                      className="flex-1 min-w-0 px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#1f2535] border border-slate-200 dark:border-white/10 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                      required
                    />
                    <button
                      type="submit"
                      disabled={newsletterSubscribing}
                      className="px-3.5 py-2 rounded-xl font-bold text-[11px] uppercase tracking-wider bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white transition-all shrink-0 flex items-center gap-1.5 shadow-xs active:scale-95"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>{newsletterSubscribing ? 'Joining...' : 'Join'}</span>
                    </button>
                  </form>
                </div>
            </aside>
          )}
        </div>
      </article>

      {/* Mobile Floating Action Bar — visible on small screens when NOT in focus mode */}
      {!focusMode && (
        <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden safe-area-bottom">
          <div className="bg-white/95 dark:bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-200/80 dark:border-white/10 px-4 py-2.5 flex items-center justify-around">
            <button
              onClick={handleLikeClick}
              className={`touch-target flex flex-col items-center gap-0.5 transition-all ${
                liked ? 'text-rose-500' : 'text-zinc-500'
              }`}
            >
              <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
              <span className="text-[9px] font-bold">{formatViews(likesCount)}</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="touch-target flex flex-col items-center gap-0.5 text-zinc-500"
            >
              <Share2 className="w-5 h-5" />
              <span className="text-[9px] font-bold">Share</span>
            </button>
            <button
              onClick={toggleBookmark}
              className={`touch-target flex flex-col items-center gap-0.5 transition-all ${
                bookmarked ? 'text-amber-500' : 'text-zinc-500'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${bookmarked ? 'fill-current' : ''}`} />
              <span className="text-[9px] font-bold">{bookmarked ? 'Saved' : 'Save'}</span>
            </button>
            <button
              onClick={toggleFocusMode}
              className="touch-target flex flex-col items-center gap-0.5 text-zinc-500"
            >
              <Maximize2 className="w-5 h-5" />
              <span className="text-[9px] font-bold">Focus</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Exit Focus Mode button */}
      <AnimatePresence>
        {focusMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40"
          >
            <button
              type="button"
              onClick={toggleFocusMode}
              className="px-4 py-2.5 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold shadow-xl border border-white/20 dark:border-zinc-800 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all group safe-area-bottom"
              title="Return to standard article layout with sidebar"
            >
              <Minimize2 className="w-4 h-4 text-amber-400 dark:text-amber-600 group-hover:rotate-90 transition-transform" />
              <span>Exit Focus Mode</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Continue Reading / Related Stories */}
      <div className="container mx-auto px-4 sm:px-6 md:px-12 max-w-[1400px] mt-12 sm:mt-20 mb-16 lg:mb-0">
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

      {/* TechyBlogs AI Editorial Reader Assistant */}
      <AiReaderDrawer
        articleSlug={blog.slug}
        articleTitle={blog.title}
        articleSection={blog.primarySection?.name || blog.categories?.[0] || 'General'}
        contentType={blog.contentType || 'article'}
      />
    </div>
  );
}
