'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Heart, Bookmark, Eye, RefreshCw, X, AlertCircle } from 'lucide-react';
import TableOfContents from '@/components/shared/TableOfContents';
import ReaderSettings from '@/components/shared/ReaderSettings';
import QuizWidget from '@/components/shared/QuizWidget';
import { parseMarkdown, extractHeadings } from '@/utils/markdown';
import { getReadingTime } from '@/utils/readingTime';
import { createRoot } from 'react-dom/client';
import useToastStore from '@/store/useToastStore';

export default function BlogPreview({ formData }) {
  const { addToast } = useToastStore();
  const [typography, setTypography] = useState({
    fontFamily: 'font-sans',
    fontSize: 'prose-lg',
    lineHeight: 'leading-relaxed'
  });

  // Visual/mock interactivity states
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  // Code playground states
  const [playgroundCode, setPlaygroundCode] = useState('');
  const [showPlayground, setShowPlayground] = useState(false);
  const [playgroundKey, setPlaygroundKey] = useState(0);

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

  const quizRootsRef = useRef([]);

  // Hydrate interactive quizzes in parsed markdown content
  useEffect(() => {
    if (!formData.content) return;

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
          console.error('Failed to mount QuizWidget in preview:', err);
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
  }, [formData.content]);

  // Copy code and playground hooks
  useEffect(() => {
    if (!formData.content) return;
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

      // Try live button
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
  }, [formData.content, addToast]);

  const htmlContent = useMemo(() => {
    if (!formData.content) return '';
    return parseMarkdown(formData.content);
  }, [formData.content]);

  const headings = useMemo(() => {
    if (!formData.content) return [];
    return extractHeadings(formData.content);
  }, [formData.content]);

  const readingTime = useMemo(() => {
    if (!formData.content) return 0;
    return getReadingTime(formData.content);
  }, [formData.content]);

  const handleLikeClick = () => {
    if (liked) {
      setLiked(false);
      setLikesCount(prev => prev - 1);
    } else {
      setLiked(true);
      setLikesCount(prev => prev + 1);
      addToast('Demo: Article liked!', 'success');
    }
  };

  const handleBookmarkClick = () => {
    setBookmarked(!bookmarked);
    addToast(bookmarked ? 'Demo: Removed from saved' : 'Demo: Added to saved', 'info');
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

  // Filter empty faqs
  const validFaqs = useMemo(() => {
    return (formData.faqs || []).filter(faq => faq.question?.trim() || faq.answer?.trim());
  }, [formData.faqs]);

  return (
    <div className="relative pb-24 pt-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-6 sm:p-10 shadow-2xl overflow-hidden">
      
      {/* Background blobs */}
      <div className="absolute top-[15%] left-[-150px] w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none -z-10 animate-blob-drift" />
      <div className="absolute top-[45%] right-[-150px] w-96 h-96 bg-blue-500/10 dark:bg-blue-500/5 blur-[120px] rounded-full pointer-events-none -z-10 animate-blob-drift-reverse" />

      {/* Preview Info Banner */}
      <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/50 rounded-2xl flex items-center gap-3 text-xs font-semibold text-blue-700 dark:text-blue-400">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>Preview Mode: This is how your post will look on the site. Switch back to <strong>Write</strong> to make further edits.</span>
      </div>

      {/* Header */}
      <header className="mb-10">
        <div className="space-y-6">
          <div className="flex flex-wrap gap-1.5">
            {formData.categories && formData.categories.length > 0 ? (
              formData.categories.map(cat => (
                <span key={cat} className="text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 dark:bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/10 dark:border-indigo-500/15">
                  {cat}
                </span>
              ))
            ) : (
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full">
                Uncategorized
              </span>
            )}
          </div>
          
          <h1 className="text-3xl md:text-5xl font-black text-zinc-900 dark:text-white leading-[1.15] tracking-tight font-display">
            {formData.title?.trim() || <span className="text-zinc-350 dark:text-zinc-650">Untitled Post</span>}
          </h1>

          {/* Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-6 pt-4 border-t border-zinc-200/80 dark:border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xs font-display shadow-md shadow-blue-500/15">
                SH
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Suheel Hilal</p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Writer</p>
              </div>
            </div>
            
            <div className="flex items-center gap-5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-zinc-400" />
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-zinc-400" />
                {readingTime} Min Read
              </div>
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-zinc-400" />
                0 Views
              </div>
              <div className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-500" />
                {likesCount} Likes
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Featured Cover Image */}
      <section className="mb-12">
        <div className="aspect-[21/9] rounded-2xl overflow-hidden border border-zinc-200/50 dark:border-white/[0.06] bg-zinc-100 dark:bg-zinc-800 shadow-lg relative flex items-center justify-center">
          {formData.image ? (
            <img
              src={formData.image}
              alt={formData.title || 'Preview Cover'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-6 text-zinc-450 dark:text-zinc-555 flex flex-col items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider">No cover image uploaded</span>
              <span className="text-[10px]">Your featured image will show up here</span>
            </div>
          )}
        </div>
      </section>

      {/* Excerpt section */}
      {formData.excerpt?.trim() && (
        <section className="mb-10 p-6 rounded-2xl border border-zinc-150 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/10 italic text-sm text-zinc-600 dark:text-zinc-400 font-sans">
          <span className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1 uppercase tracking-widest text-[9px]">Summary / Excerpt</span>
          "{formData.excerpt}"
        </section>
      )}

      {/* Body Content Grid */}
      <article>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main prose */}
          <div className="lg:col-span-8">
            <div className="mb-10">
              <ReaderSettings content={formData.content} />
            </div>

            {htmlContent.trim() ? (
              <div 
                className={`prose max-w-none prose-zinc dark:prose-invert prose-headings:text-zinc-900 dark:prose-headings:text-zinc-100 prose-p:text-zinc-700 dark:prose-p:text-zinc-300 prose-strong:text-zinc-900 dark:prose-strong:text-zinc-100 prose-code:text-blue-600 dark:prose-code:text-blue-400 ${typography.fontFamily} ${typography.fontSize} ${typography.lineHeight}`}
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            ) : (
              <div className="text-center py-20 border-2 border-dashed border-zinc-200 dark:border-zinc-850 rounded-3xl text-zinc-400 dark:text-zinc-500 text-sm font-semibold">
                No content written yet. Switch back to Write mode to type some content.
              </div>
            )}

            {/* Social Share Mock Block */}
            {htmlContent.trim() && (
              <div className="mt-12 p-6 rounded-2xl border border-zinc-250/30 dark:border-white/[0.04] bg-zinc-50 dark:bg-white/[0.01] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-250">Enjoyed this tutorial?</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Share it with your colleagues and developer communities.</p>
                </div>
                <div className="flex gap-2">
                  <span className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-white/[0.03] text-zinc-400 dark:text-zinc-500 cursor-not-allowed select-none border border-zinc-200/50 dark:border-white/[0.04]">
                    Twitter / X
                  </span>
                  <span className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-white/[0.03] text-zinc-400 dark:text-zinc-500 cursor-not-allowed select-none border border-zinc-200/50 dark:border-white/[0.04]">
                    LinkedIn
                  </span>
                </div>
              </div>
            )}

            {/* Dynamic FAQs accordion */}
            {validFaqs.length > 0 && (
              <section className="mt-16 border-t border-zinc-200/80 dark:border-white/[0.06] pt-12">
                <div className="max-w-3xl">
                  <h2 className="text-2xl font-black font-display tracking-tight text-zinc-900 dark:text-white mb-2">
                    Frequently Asked Questions
                  </h2>
                  <p className="text-zinc-500 dark:text-zinc-400 font-medium mb-8 text-xs font-sans">
                    Quick answers to the most common questions regarding this article.
                  </p>
                  <div className="space-y-3">
                    {validFaqs.map((faq, idx) => {
                      const isOpen = openFaqIndex === idx;
                      return (
                        <div 
                          key={idx}
                          className={`rounded-2xl overflow-hidden transition-all duration-300 premium-card ${
                            isOpen 
                              ? 'shadow-lg shadow-blue-500/5 dark:shadow-blue-500/[0.02]' 
                              : 'hover:shadow-md hover:shadow-blue-500/[0.03]'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                            className="w-full px-6 py-4 flex items-center justify-between text-left gap-4 font-bold text-zinc-900 dark:text-zinc-100 text-sm group transition-colors hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            <span>{faq.question || <em className="text-zinc-400 dark:text-zinc-650">Empty Question</em>}</span>
                            <span className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-500' : 'group-hover:text-zinc-600'}`}>▼</span>
                          </button>
                          {isOpen && (
                            <div className="py-4 px-6 border-t border-zinc-200/30 dark:border-white/[0.04] bg-zinc-50/20 dark:bg-zinc-950/10">
                              <p className="text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed text-xs font-sans">
                                {faq.answer || <em className="text-zinc-400 dark:text-zinc-650">Empty Answer</em>}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Sidebar Panel */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Likes/Share panel */}
            <div className="p-5 rounded-2xl premium-card flex justify-around items-center relative">
              <button 
                type="button"
                onClick={handleLikeClick} 
                className={`flex flex-col items-center gap-1.5 transition-all group ${liked ? 'text-rose-500' : 'text-zinc-400 dark:text-zinc-500 hover:text-rose-500'}`}
              >
                <span className="text-base">❤️</span>
                <span className="text-[9px] font-bold tracking-wider uppercase font-display">Like</span>
              </button>
              <div className="h-8 w-[1px] bg-zinc-200/50 dark:bg-white/[0.06]" />
              
              <button 
                type="button"
                onClick={() => addToast('Demo: Share option is for display only', 'info')}
                className="flex flex-col items-center gap-1.5 transition-all text-zinc-450 dark:text-zinc-500 hover:text-blue-500 group"
              >
                <span className="text-base">🔗</span>
                <span className="text-[9px] font-bold tracking-wider uppercase font-display">Share</span>
              </button>
              <div className="h-8 w-[1px] bg-zinc-200/50 dark:bg-white/[0.06]" />
              
              <button 
                type="button"
                onClick={handleBookmarkClick}
                className={`flex flex-col items-center gap-1.5 transition-all group ${bookmarked ? 'text-amber-500' : 'text-zinc-400 dark:text-zinc-500 hover:text-amber-500'}`}
              >
                <span className="text-base">🔖</span>
                <span className="text-[9px] font-bold tracking-wider uppercase font-display">Save</span>
              </button>
            </div>

            {/* Table of Contents */}
            <div className="lg:sticky lg:top-24 space-y-6">
              <TableOfContents headings={headings} />
            </div>
          </aside>
        </div>
      </article>

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
                    Interactive Code Sandbox (Preview)
                  </h3>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">Edit code in the sandbox pane on the left to test live results on the right.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => setPlaygroundKey(prev => prev + 1)}
                    className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800 text-zinc-550 dark:text-zinc-350 transition-colors"
                    title="Reload Sandbox"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button 
                    type="button"
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
                  <div className="bg-zinc-100/50 dark:bg-zinc-955/20 px-4 py-2 border-b border-zinc-250/20 dark:border-white/[0.04] text-[9px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Source Editor
                  </div>
                  <textarea
                    value={playgroundCode}
                    onChange={(e) => setPlaygroundCode(e.target.value)}
                    className="flex-1 p-5 font-mono text-xs outline-none bg-zinc-55 text-zinc-800 dark:bg-[#0b0f19] dark:text-zinc-200 resize-none overflow-y-auto"
                    spellCheck="false"
                  />
                </div>

                {/* Preview Right */}
                <div className="flex flex-col bg-white dark:bg-zinc-900">
                  <div className="bg-zinc-100/50 dark:bg-zinc-955/20 px-4 py-2 border-b border-zinc-250/20 dark:border-white/[0.04] text-[9px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
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
