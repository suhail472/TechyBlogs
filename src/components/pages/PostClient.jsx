'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Calendar, Clock, Share2, Heart, Mail, ChevronDown, Bookmark, Eye, Play, RefreshCw, X } from 'lucide-react';
import TopLoader from '@/components/shared/TopLoader';
import TableOfContents from '@/components/shared/TableOfContents';
import ReaderSettings from '@/components/shared/ReaderSettings';
import Comments from '@/components/shared/Comments';
import RelatedArticles from '@/components/shared/RelatedArticles';
import ImageLightbox from '@/components/shared/ImageLightbox';
import { parseMarkdown, extractHeadings } from '@/utils/markdown';
import { getReadingTime } from '@/utils/readingTime';
import useToastStore from '@/store/useToastStore';
import { createRoot } from 'react-dom/client';
import QuizWidget from '@/components/shared/QuizWidget';

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
    lineHeight: 'leading-relaxed'
  });

  // Code playground states
  const [playgroundCode, setPlaygroundCode] = useState('');
  const [showPlayground, setShowPlayground] = useState(false);
  const [playgroundKey, setPlaygroundKey] = useState(0);

  const progressBarRef = useRef(null);
  const contentRef = useRef(null);
  const { addToast } = useToastStore();
  const maxProgressRef = useRef(0);

  // shareUrl state is set on client mount to avoid hydration mismatch

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

  // Scroll progress bar and max progress tracker
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
          if (totalHeight > 0 && progressBarRef.current) {
            const progress = (window.scrollY / totalHeight) * 100;
            progressBarRef.current.style.width = `${progress}%`;
            
            // Track maximum reading progress in localStorage using cached ref check
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

  const quizRootsRef = useRef([]);

  // Dynamically hydrate interactive QuizWidgets in markdown content
  useEffect(() => {
    if (!blog?.content) return;

    const timeoutId = setTimeout(() => {
      // Clean up previous roots
      quizRootsRef.current.forEach(root => {
        try {
          root.unmount();
        } catch (e) {
          // Ignore
        }
      });
      quizRootsRef.current = [];

      const quizContainers = document.querySelectorAll('.interactive-quiz-container');
      quizContainers.forEach((container) => {
        container.innerHTML = '';
        try {
          const rawQuestion = container.getAttribute('data-question');
          const rawOptions = container.getAttribute('data-options');
          const rawAnswer = container.getAttribute('data-answer');

          const question = decodeURIComponent(rawQuestion);
          const options = JSON.parse(decodeURIComponent(rawOptions));
          const correctAnswer = parseInt(rawAnswer) || 0;

          const root = createRoot(container);
          root.render(
            <QuizWidget
              question={question}
              options={options}
              correctAnswer={correctAnswer}
            />
          );
          quizRootsRef.current.push(root);
        } catch (err) {
          console.error('Failed to mount QuizWidget:', err);
        }
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      quizRootsRef.current.forEach(root => {
        try {
          root.unmount();
        } catch (e) {
          // Ignore
        }
      });
      quizRootsRef.current = [];
    };
  }, [blog?.content]);

  // Inject copy code and interactive sandbox buttons
  useEffect(() => {
    if (!blog?.content) return;
    const preElements = document.querySelectorAll('article pre');
    preElements.forEach((pre) => {
      if (pre.querySelector('.copy-code-btn')) return;

      pre.classList.add('relative', 'group');

      // Copy code button
      const button = document.createElement('button');
      button.className = 'copy-code-btn absolute top-3 right-3 p-1.5 rounded-lg bg-zinc-200/50 hover:bg-zinc-200 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 opacity-0 group-hover:opacity-100 transition-all duration-200 text-[10px] font-bold font-sans flex items-center gap-1 border border-zinc-300/30 dark:border-zinc-700/30 backdrop-blur-md pointer-events-auto';
      button.innerHTML = `
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span>Copy</span>
      `;

      button.addEventListener('click', async () => {
        const codeText = pre.querySelector('code')?.innerText || '';
        try {
          await navigator.clipboard.writeText(codeText);
          button.innerHTML = `
            <svg class="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span class="text-emerald-500 font-bold font-sans">Copied!</span>
          `;
          addToast('Code snippet copied!', 'success');
          setTimeout(() => {
            button.innerHTML = `
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span>Copy</span>
            `;
          }, 2000);
        } catch (err) {
          console.error('Failed to copy text: ', err);
        }
      });

      pre.appendChild(button);

      // Interactive playground button
      const playButton = document.createElement('button');
      playButton.className = 'play-code-btn absolute top-3 right-16 p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-all duration-200 text-[10px] font-bold font-sans flex items-center gap-1 border border-blue-500/20 dark:border-blue-500/35 backdrop-blur-md pointer-events-auto';
      playButton.innerHTML = `
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
        <span>Try Live</span>
      `;

      playButton.addEventListener('click', () => {
        const codeText = pre.querySelector('code')?.innerText || '';
        setPlaygroundCode(codeText);
        setPlaygroundKey(prev => prev + 1);
        setShowPlayground(true);
      });

      pre.appendChild(playButton);
    });
  }, [blog?.content, addToast]);

  const htmlContent = useMemo(() => {
    if (!blog?.content) return '';
    return parseMarkdown(blog.content);
  }, [blog?.content]);

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
      updated = bookmarks.filter(slug => slug !== blog.slug);
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
              background: #3b82f6;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 600;
            }
            button:hover { background: #2563eb; }
          </style>
        </head>
        <body>
          ${playgroundCode.includes('<!DOCTYPE') || playgroundCode.includes('<html') ? playgroundCode : `
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
          `}
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
        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 z-[100] transition-all duration-75"
        style={{ width: '0%' }}
      />
      
      {/* Background blobs */}
      <div className="absolute top-[15%] left-[-150px] w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none -z-10 animate-blob-drift" />
      <div className="absolute top-[45%] right-[-150px] w-96 h-96 bg-blue-500/10 dark:bg-blue-500/5 blur-[120px] rounded-full pointer-events-none -z-10 animate-blob-drift-reverse" />

      {/* Header */}
      <header className="container mx-auto px-6 md:px-12 max-w-[1400px] mb-12">
        <Link 
          href="/blogs" 
          className="group inline-flex items-center gap-1.5 text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 mb-8 transition-all text-xs font-bold uppercase tracking-wider font-display px-4 py-2 rounded-full bg-zinc-100 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/[0.06] hover:-translate-x-0.5"
        >
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Archive
        </Link>
        
        <div className="space-y-6">
          <div className="flex gap-1.5">
            {(blog.categories || []).map(cat => (
              <span key={cat} className="text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 dark:bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/10 dark:border-indigo-500/15">
                {cat}
              </span>
            ))}
          </div>
          
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-zinc-900 dark:text-white leading-[1.15] tracking-tight font-display">
            {blog.title}
          </h1>

          {/* Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-6 pt-4 border-t border-zinc-200/80 dark:border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xs font-display shadow-md shadow-blue-500/15">
                {blog.author ? blog.author.split(' ').map(n=>n[0]).join('') : 'SH'}
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{blog.author || 'Suheel Hilal'}</p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Writer</p>
              </div>
            </div>
            
            <div className="flex items-center gap-5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
              <div className="flex items-center gap-1.5" suppressHydrationWarning>
                <Calendar className="w-4 h-4 text-zinc-400" />
                {blog.date || new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
          <img
            src={blog.image}
            alt={blog.title}
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* Body Content Grid */}
      <article className="container mx-auto px-6 md:px-12 max-w-[1400px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Main prose */}
          <div className="lg:col-span-8">
            <div className="mb-10">
              <ReaderSettings content={blog.content} />
            </div>
            
            <div 
              ref={contentRef}
              className={`prose max-w-none prose-zinc dark:prose-invert prose-headings:text-zinc-900 dark:prose-headings:text-zinc-100 prose-p:text-zinc-700 dark:prose-p:text-zinc-300 prose-strong:text-zinc-900 dark:prose-strong:text-zinc-100 prose-code:text-blue-600 dark:prose-code:text-blue-400 ${typography.fontFamily} ${typography.fontSize} ${typography.lineHeight}`}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />

            {/* Social Share Modal Block Below Content */}
            <div className="mt-12 p-6 rounded-2xl border border-zinc-250/30 dark:border-white/[0.04] bg-zinc-50 dark:bg-white/[0.01] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-250">Enjoyed this tutorial?</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Share it with your colleagues and developers community.</p>
              </div>
              <div className="flex gap-2">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(blog.title)}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-white/[0.03] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/[0.06] transition-colors"
                >
                  Twitter / X
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-white/[0.03] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/[0.06] transition-colors"
                >
                  LinkedIn
                </a>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(blog.title + ' ' + shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-white/[0.03] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/[0.06] transition-colors"
                >
                  WhatsApp
                </a>
              </div>
            </div>

            {/* Dynamic FAQs accordion */}
            {blog.faqs && blog.faqs.length > 0 && (
              <section className="mt-20 border-t border-zinc-200/80 dark:border-white/[0.06] pt-16">
                <div className="max-w-3xl">
                  <h2 className="text-3xl font-black font-display tracking-tight text-zinc-900 dark:text-white mb-3">
                    Frequently Asked Questions
                  </h2>
                  <p className="text-zinc-500 dark:text-zinc-400 font-medium mb-10 text-base font-sans">
                    Quick answers to the most common questions regarding this article.
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
                          className={`rounded-2xl overflow-hidden transition-all duration-300 premium-card ${
                            isOpen 
                              ? 'shadow-lg shadow-blue-500/5 dark:shadow-blue-500/[0.02]' 
                              : 'hover:shadow-md hover:shadow-blue-500/[0.03]'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                            className="w-full px-6 py-5 flex items-center justify-between text-left gap-4 font-bold text-zinc-900 dark:text-zinc-100 text-base group transition-colors hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            <span>{faq.question}</span>
                            <ChevronDown className={`w-5 h-5 shrink-0 text-zinc-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-500' : 'group-hover:text-zinc-600'}`} />
                          </button>
                          <div 
                            className={`transition-all duration-300 ease-in-out ${
                              isOpen 
                                ? 'max-h-60 opacity-100 py-5 px-6 border-t border-zinc-200/30 dark:border-white/[0.04]' 
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
            <div className="p-5 rounded-2xl premium-card flex justify-around items-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/5 relative">
              
              <button 
                onClick={handleLikeClick} 
                className={`flex flex-col items-center gap-1.5 transition-all group ${liked ? 'text-rose-500' : 'text-zinc-400 dark:text-zinc-500 hover:text-rose-500'}`}
              >
                <Heart className={`w-5 h-5 ${liked ? 'fill-current scale-110' : 'group-hover:scale-110 transition-transform'}`} />
                <span className="text-[9px] font-bold tracking-wider uppercase font-display">Like</span>
              </button>
              <div className="h-8 w-[1px] bg-zinc-200/50 dark:bg-white/[0.06]" />
              
              <button 
                onClick={() => setShowShareMenu(!showShareMenu)}
                className={`flex flex-col items-center gap-1.5 transition-all group ${showShareMenu ? 'text-blue-500' : 'text-zinc-400 dark:text-zinc-500 hover:text-blue-500'}`}
              >
                <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-bold tracking-wider uppercase font-display">Share</span>
              </button>
              <div className="h-8 w-[1px] bg-zinc-200/50 dark:bg-white/[0.06]" />
              
              <button 
                onClick={toggleBookmark}
                className={`flex flex-col items-center gap-1.5 transition-all group ${bookmarked ? 'text-amber-500' : 'text-zinc-400 dark:text-zinc-500 hover:text-amber-500'}`}
              >
                <Bookmark className={`w-5 h-5 ${bookmarked ? 'fill-current scale-110 text-amber-500' : 'group-hover:scale-110 transition-transform'}`} />
                <span className="text-[9px] font-bold tracking-wider uppercase font-display">Save</span>
              </button>

              {/* Share Overlay Menu */}
              <AnimatePresence>
                {showShareMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute bottom-18 right-4 left-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-4 shadow-xl z-50 flex flex-col gap-2.5"
                  >
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center mb-0.5">
                      Share This Article
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 text-center">
                      <a
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(blog.title)}&url=${encodeURIComponent(shareUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/[0.03] text-zinc-700 dark:text-zinc-300 font-extrabold text-[10px] uppercase tracking-wider border border-zinc-100 dark:border-zinc-800/80"
                      >
                        X / Twitter
                      </a>
                      <a
                        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/[0.03] text-zinc-700 dark:text-zinc-300 font-extrabold text-[10px] uppercase tracking-wider border border-zinc-100 dark:border-zinc-800/80"
                      >
                        LinkedIn
                      </a>
                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(blog.title + ' ' + shareUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/[0.03] text-zinc-700 dark:text-zinc-300 font-extrabold text-[10px] uppercase tracking-wider border border-zinc-100 dark:border-zinc-800/80"
                      >
                        WhatsApp
                      </a>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(shareUrl);
                          addToast('Link copied!', 'success');
                          setShowShareMenu(false);
                        }}
                        className="py-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/[0.03] text-zinc-700 dark:text-zinc-300 font-extrabold text-[10px] uppercase tracking-wider border border-zinc-100 dark:border-zinc-800/80"
                      >
                        Copy Link
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Table of Contents */}
            <div className="lg:sticky lg:top-24 space-y-6">
              <TableOfContents headings={headings} />

              {/* Newsletter panel */}
              <div className="mt-6 p-6 rounded-2xl premium-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/5 relative overflow-hidden">
                {/* Gradient accent */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                
                <h3 className="font-bold text-sm uppercase tracking-wider mb-2 text-zinc-900 dark:text-zinc-100 font-display">Author's Newsletter</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mb-5 leading-relaxed font-sans">Stay updated with engineering insights, tutorials, and articles on modern development stacks.</p>
                <form onSubmit={handleNewsletterSubmit} className="space-y-2.5">
                  <input 
                    type="email" 
                    placeholder="Enter email address"
                    className="w-full p-3.5 rounded-xl text-xs border outline-none transition-all focus:border-blue-400/40 focus:ring-2 focus:ring-blue-500/10 dark:focus:border-blue-500/30 bg-white/80 border-zinc-200/80 placeholder-zinc-400 dark:bg-white/[0.03] dark:border-white/[0.06] dark:text-white dark:placeholder-zinc-500"
                    required
                  />
                  <button className="w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/15 hover:shadow-lg font-display hover:-translate-y-0.5">
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
      <div className="container mx-auto px-6 md:px-12 max-w-[1400px]">
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
              {/* Top bar */}
              <div className="px-6 py-4 border-b border-zinc-250/20 dark:border-white/[0.04] bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-display">
                    Interactive Code Sandbox
                  </h3>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">Edit code in the sandbox pane on the left to test live results on the right.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setPlaygroundKey(prev => prev + 1)}
                    className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800 text-zinc-550 dark:text-zinc-350 transition-colors"
                    title="Reload Sandbox"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setShowPlayground(false)}
                    className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800 text-zinc-550 dark:text-zinc-350 transition-colors"
                    title="Close Sandbox"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Split layout Pane */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
                {/* Editor Left */}
                <div className="flex flex-col border-r border-zinc-250/20 dark:border-white/[0.04]">
                  <div className="bg-zinc-100/50 dark:bg-zinc-950/20 px-4 py-2 border-b border-zinc-250/20 dark:border-white/[0.04] text-[9px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Source Editor
                  </div>
                  <textarea
                    value={playgroundCode}
                    onChange={(e) => setPlaygroundCode(e.target.value)}
                    className="flex-1 p-5 font-mono text-xs outline-none bg-zinc-50 text-zinc-800 dark:bg-[#0b0f19] dark:text-zinc-200 resize-none overflow-y-auto"
                    spellCheck="false"
                  />
                </div>

                {/* Preview Right */}
                <div className="flex flex-col bg-white dark:bg-zinc-900">
                  <div className="bg-zinc-100/50 dark:bg-zinc-950/20 px-4 py-2 border-b border-zinc-250/20 dark:border-white/[0.04] text-[9px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
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
