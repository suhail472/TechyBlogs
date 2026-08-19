'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  X,
  Send,
  RotateCcw,
  Trash2,
  AlertCircle,
  Square,
  BookOpen,
  Maximize2,
  Minimize2,
  Plus,
  ShieldCheck,
  Compass,
  Bot,
  MessageSquare,
  ExternalLink,
  ChevronRight,
  Bookmark,
  Layers,
  FileText,
  Clock,
  HelpCircle,
  Hash,
  Tag,
} from 'lucide-react';
import AiFloatingButton from './AiFloatingButton';
import AiMessageList from './AiMessageList';
import AiSuggestedChips from './AiSuggestedChips';
import RelatedStoryCard from './RelatedStoryCard';
import useToastStore from '@/store/useToastStore';

export default function AiReaderDrawer({
  articleSlug = '',
  articleTitle = '',
  articleSection = '',
  contentType = 'article',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [streamingRelatedStories, setStreamingRelatedStories] = useState([]);
  const [articleMeta, setArticleMeta] = useState({
    title: articleTitle,
    section: articleSection,
    author: '',
    publishedAt: '',
    wordCount: 0,
    readTime: '',
    topics: [],
    headings: [],
    sources: [],
    relatedStories: [],
  });
  const [rateLimitTimer, setRateLimitTimer] = useState(0);

  const abortControllerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const { addToast } = useToastStore();

  const storageKey = `teachyblogs-ai-chat-${articleSlug || 'site'}`;

  // Fetch eager article context when drawer opens
  useEffect(() => {
    if (isOpen && articleSlug) {
      fetch(`/api/ai/context?slug=${encodeURIComponent(articleSlug)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.success && data?.data) {
            const d = data.data;
            setArticleMeta((prev) => ({
              ...prev,
              title: d.title || prev.title,
              section: d.section || prev.section,
              author: d.author || prev.author,
              publishedAt: d.publishedAt || prev.publishedAt,
              wordCount: d.wordCount || prev.wordCount,
              readTime: d.readTime || prev.readTime,
              topics: d.topics?.length ? d.topics : prev.topics,
              headings: d.headings?.length ? d.headings : prev.headings,
              sources: d.sources?.length ? d.sources : prev.sources,
              relatedStories: d.relatedStories?.length ? d.relatedStories : prev.relatedStories,
            }));
          }
        })
        .catch(() => {});
    }
  }, [isOpen, articleSlug]);

  // Load chat session from local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }, [storageKey]);

  // Persist chat session to local storage
  const saveMessages = useCallback(
    (newMsgs) => {
      setMessages(newMsgs);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(storageKey, JSON.stringify(newMsgs.slice(-20)));
        } catch (e) {
          // ignore
        }
      }
    },
    [storageKey]
  );

  // Scroll to bottom of message list
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen, messages, streamText, isFullscreen]);

  // Keyboard shortcut Ctrl+J / Cmd+J and Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'j' || e.key === 'J')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          setIsOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen]);

  // Rate limit countdown timer
  useEffect(() => {
    if (rateLimitTimer <= 0) return;
    const interval = setInterval(() => {
      setRateLimitTimer((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLimitTimer]);

  // Stop streaming generation
  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (streamText) {
      saveMessages([
        ...messages,
        {
          role: 'assistant',
          content: streamText + ' *(Response stopped by reader)*',
          relatedStories: streamingRelatedStories,
        },
      ]);
    }
    setIsStreaming(false);
    setStreamText('');
    setStreamingRelatedStories([]);
  };

  // Submit chat message
  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isStreaming || rateLimitTimer > 0) return;

    setInputMessage('');
    const updatedMessages = [...messages, { role: 'user', content: query }];
    saveMessages(updatedMessages);

    setIsStreaming(true);
    setStreamText('');
    setStreamingRelatedStories([]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let accumulatedText = '';
    let fetchedRelated = [];

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          articleSlug,
          history: messages.slice(-12),
        }),
        signal: controller.signal,
      });

      if (res.status === 429) {
        const errorData = await res.json().catch(() => ({}));
        const retrySec = parseInt(res.headers.get('Retry-After') || '30', 10);
        setRateLimitTimer(retrySec);
        addToast(errorData.error || `Rate limit reached. Please wait ${retrySec}s.`, 'info');
        setIsStreaming(false);
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          // Check for metadata event
          if (trimmed.startsWith('event: metadata')) {
            const dataLine = trimmed.split('\n').find((l) => l.startsWith('data: '));
            if (dataLine) {
              try {
                const meta = JSON.parse(dataLine.slice(6));
                if (meta) {
                  setArticleMeta((prev) => ({
                    ...prev,
                    title: meta.articleTitle || prev.title,
                    section: meta.articleSection || prev.section,
                    author: meta.articleAuthor || prev.author,
                    publishedAt: meta.articlePublishedAt || prev.publishedAt,
                    wordCount: meta.wordCount || prev.wordCount,
                    readTime: meta.readTime || prev.readTime,
                    topics: meta.topics?.length ? meta.topics : prev.topics,
                    headings: meta.articleHeadings?.length ? meta.articleHeadings : prev.headings,
                    sources: meta.articleSources?.length ? meta.articleSources : prev.sources,
                    relatedStories: meta.relatedStories?.length ? meta.relatedStories : prev.relatedStories,
                  }));
                  if (meta.relatedStories) {
                    fetchedRelated = meta.relatedStories;
                    setStreamingRelatedStories(meta.relatedStories);
                  }
                }
              } catch (e) {}
            }
            continue;
          }

          // Check for error event
          if (trimmed.startsWith('event: error')) {
            const dataLine = trimmed.split('\n').find((l) => l.startsWith('data: '));
            if (dataLine) {
              try {
                const errData = JSON.parse(dataLine.slice(6));
                throw new Error(errData.error || 'AI generation failed');
              } catch (e) {
                throw new Error('AI generation failed');
              }
            }
          }

          // Check for data chunks
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') break;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.chunk) {
                accumulatedText += parsed.chunk;
                setStreamText(accumulatedText);
              }
            } catch (e) {}
          }
        }
      }

      // Finalize message in state
      if (accumulatedText) {
        saveMessages([
          ...updatedMessages,
          {
            role: 'assistant',
            content: accumulatedText,
            relatedStories: fetchedRelated,
          },
        ]);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        saveMessages([
          ...updatedMessages,
          {
            role: 'assistant',
            content: `**TeachyBlogs AI is temporarily unavailable.**\n\n*Error: ${err.message || 'Please check your connection and try again.'}*`,
          },
        ]);
      }
    } finally {
      setIsStreaming(false);
      setStreamText('');
      setStreamingRelatedStories([]);
      abortControllerRef.current = null;
    }
  };

  // Start a new chat session
  const handleNewChat = () => {
    saveMessages([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
    }
    addToast('Started a new conversation', 'info');
  };

  const activeTitle = articleMeta.title || articleTitle;
  const activeSection = articleMeta.section || articleSection;

  // Curated contextual questions
  const contextualQuestions = [
    'What is the core argument of this article?',
    'What are the key technical limitations or weaknesses discussed?',
    'Who is this platform/technology best suited for?',
    'How does this compare to existing traditional alternatives?',
  ];

  return (
    <>
      {/* 1. Floating AI Assistant Trigger Button (Bottom-Left) */}
      <AiFloatingButton
        isOpen={isOpen}
        onToggle={() => setIsOpen((prev) => !prev)}
        articleTitle={activeTitle}
      />

      {/* 2. Chat Drawer / Full-Screen Modal */}
      <AnimatePresence>
        {isOpen && (
          <div
            className={`fixed inset-0 z-50 flex ${
              isFullscreen
                ? 'items-stretch justify-stretch'
                : 'justify-start items-end md:items-stretch'
            }`}
            role="dialog"
            aria-modal="true"
            aria-label="TeachyBlogs AI Editorial Assistant"
          >
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            />

            {/* Main Drawer / Fullscreen Panel */}
            <motion.div
              initial={{ opacity: 0, x: isFullscreen ? 0 : -30, y: isFullscreen ? 0 : 40 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: isFullscreen ? 0 : -30, y: isFullscreen ? 0 : 40 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className={`relative z-10 flex flex-col bg-white dark:bg-[#161a24] border-slate-200/90 dark:border-white/10 shadow-2xl overflow-hidden font-sans transition-all duration-300 ${
                isFullscreen
                  ? 'w-full h-full rounded-none border-none'
                  : 'w-full md:w-[480px] lg:w-[540px] xl:w-[600px] h-[88vh] md:h-full border-t md:border-t-0 md:border-r rounded-t-3xl md:rounded-none'
              }`}
            >
              {/* Header Container */}
              <header className="px-4 py-3.5 border-b border-slate-200/90 dark:border-white/10 flex items-center justify-between bg-slate-50/90 dark:bg-[#1a202c] shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-xs font-display shadow-md shadow-red-600/20 shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-display font-black text-sm text-zinc-900 dark:text-zinc-100">
                        TeachyBlogs <span className="text-red-600 dark:text-red-400">AI</span>
                      </h3>
                      <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 text-[9px] font-bold font-mono">
                        EDITORIAL
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                      Your intelligent reading companion
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {/* New Chat Button */}
                  <button
                    type="button"
                    onClick={handleNewChat}
                    className="px-2.5 py-1.5 rounded-xl text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/5 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                    title="Start new conversation"
                    aria-label="New Chat"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="text-[11px]">New Chat</span>
                  </button>

                  {/* Full-Screen Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setIsFullscreen((prev) => !prev)}
                    className="p-2 rounded-xl text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/5 transition-colors hidden md:flex items-center"
                    title={isFullscreen ? 'Exit full screen' : 'Full screen mode'}
                    aria-label={isFullscreen ? 'Exit full screen' : 'Full screen mode'}
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>

                  {/* Close Button */}
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-xl text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/5 transition-colors"
                    title="Close assistant (Esc)"
                    aria-label="Close assistant"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </header>

              {/* Context Indicator Banner (Drawer Mode) */}
              {!isFullscreen && activeTitle && (
                <div className="px-4 py-2 bg-red-500/5 dark:bg-red-500/10 border-b border-red-500/10 flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-300 shrink-0">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-bold text-red-600 dark:text-red-400 font-mono text-[10px] uppercase">
                      Discussing:
                    </span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-200 truncate max-w-[280px]">
                      {activeTitle}
                    </span>
                  </div>
                  {activeSection && (
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 shrink-0 ml-2">
                      {activeSection}
                    </span>
                  )}
                </div>
              )}

              {/* Responsive Layout Grid: 3-Column in Full-Screen Mode, 1-Column in Drawer Mode */}
              <div
                className={`flex-1 min-h-0 ${
                  isFullscreen
                    ? 'grid grid-cols-1 lg:grid-cols-[clamp(240px,18vw,290px)_minmax(0,1fr)] xl:grid-cols-[clamp(240px,18vw,290px)_minmax(0,1fr)_clamp(260px,20vw,330px)] overflow-hidden'
                    : 'flex flex-col overflow-hidden'
                }`}
              >
                {/* ─────────────────────────────────────────────────────────────
                    1. LEFT COLUMN: ARTICLE CONTEXT & STORY STRUCTURE (Full-Screen)
                   ───────────────────────────────────────────────────────────── */}
                {isFullscreen && (
                  <aside className="hidden lg:flex flex-col gap-4 border-r border-slate-200/90 dark:border-white/10 p-5 bg-slate-50/60 dark:bg-[#141822] overflow-y-auto min-h-0 no-scrollbar">
                    {/* Active Article Card */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 space-y-2.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-black uppercase tracking-wider text-red-600 dark:text-red-400">
                          Active Dispatch
                        </span>
                        {activeSection && (
                          <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold">
                            {activeSection}
                          </span>
                        )}
                      </div>

                      <h4 className="font-display font-black text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-3">
                        {activeTitle || 'TeachyBlogs Story'}
                      </h4>

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-zinc-500 dark:text-zinc-400 font-mono pt-0.5 border-t border-slate-100 dark:border-white/5">
                        {articleMeta.author && <span>By {articleMeta.author}</span>}
                        {articleMeta.readTime && <span>• {articleMeta.readTime}</span>}
                      </div>

                      {articleSlug && (
                        <Link
                          href={`/blog/${articleSlug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline pt-1"
                        >
                          <span>Open Article Page</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>

                    {/* Story Structure / Numbered Headings Outline */}
                    {articleMeta.headings && articleMeta.headings.length > 0 && (
                      <div className="space-y-2 pt-1 flex-1">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-red-500" /> Story Structure
                          </span>
                          <span className="text-[9px] font-mono text-zinc-400">
                            {articleMeta.headings.length} sections
                          </span>
                        </div>

                        <div className="space-y-1">
                          {articleMeta.headings.map((h, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleSendMessage(`What does the article discuss in the section "${h.text}"?`)}
                              className="w-full text-left p-2.5 rounded-xl text-xs text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-white/5 hover:text-red-600 dark:hover:text-red-400 transition-all border border-transparent hover:border-slate-200/90 dark:hover:border-white/10 group flex items-start gap-2"
                              title={h.text}
                            >
                              <span className="text-[10px] font-mono font-bold text-zinc-400 group-hover:text-red-500 shrink-0 mt-0.5">
                                {String(i + 1).padStart(2, '0')}
                              </span>
                              <span className="line-clamp-2 leading-tight flex-1 font-medium">
                                {h.text}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </aside>
                )}

                {/* ─────────────────────────────────────────────────────────────
                    2. CENTER COLUMN: THE HERO AI WORKSPACE
                   ───────────────────────────────────────────────────────────── */}
                <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-white dark:bg-[#161a24]">
                  {/* Chat Message Scroll Canvas */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 overscroll-contain">
                    <div className="w-full max-w-4xl mx-auto space-y-6">
                      {messages.length === 0 && !isStreaming ? (
                        /* Polished Hero Welcome State */
                        <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center p-6 space-y-5 text-zinc-500 dark:text-zinc-400">
                          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-[#1f2535] flex items-center justify-center text-red-600 shadow-xs ring-1 ring-slate-200/80 dark:ring-white/10">
                            <Bot className="w-8 h-8" />
                          </div>

                          <div className="space-y-2 max-w-md">
                            <h4 className="font-display font-black text-lg sm:text-xl text-zinc-900 dark:text-zinc-100">
                              TeachyBlogs <span className="text-red-600 dark:text-red-400">AI</span>
                            </h4>
                            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium">
                              Your editorial reading companion. Ask questions about this article, understand complex sections, or discover related stories.
                            </p>
                          </div>

                          <div className="w-full max-w-lg pt-2">
                            <AiSuggestedChips
                              contentType={contentType}
                              category={activeSection}
                              onSelectPrompt={handleSendMessage}
                              disabled={isStreaming}
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <AiMessageList
                            messages={messages}
                            isStreaming={isStreaming}
                            streamText={streamText}
                            streamingRelatedStories={streamingRelatedStories}
                            onRetry={() => {
                              const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
                              if (lastUserMsg) handleSendMessage(lastUserMsg.content);
                            }}
                          />
                          <div ref={messagesEndRef} />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Dynamic Action Chips Strip (Active Conversation) */}
                  {messages.length > 0 && (
                    <div className="px-4 sm:px-6 py-2.5 border-t border-slate-200/80 dark:border-white/5 bg-slate-50/70 dark:bg-[#1a202c]/50 shrink-0">
                      <div className="w-full max-w-4xl mx-auto">
                        <AiSuggestedChips
                          contentType={contentType}
                          category={activeSection}
                          onSelectPrompt={handleSendMessage}
                          disabled={isStreaming || rateLimitTimer > 0}
                        />
                      </div>
                    </div>
                  )}

                  {/* Primary AI Composer Bar */}
                  <div className="p-3 sm:p-5 border-t border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#161a24] safe-area-bottom shrink-0">
                    <div className="w-full max-w-4xl mx-auto">
                      {rateLimitTimer > 0 ? (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-center justify-center gap-2 font-mono">
                          <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                          <span>Rate limit cooldown: please wait {rateLimitTimer}s</span>
                        </div>
                      ) : (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleSendMessage();
                          }}
                          className="relative flex items-center gap-2"
                        >
                          <textarea
                            ref={textareaRef}
                            rows={1}
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value.slice(0, 600))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                            placeholder="Ask anything about this story... (Enter to send)"
                            className="w-full pl-4 pr-24 py-3.5 rounded-2xl bg-slate-100 dark:bg-[#1f2535] border border-slate-200/90 dark:border-white/10 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none font-sans shadow-2xs min-h-[50px]"
                          />

                          <div className="absolute right-2.5 flex items-center gap-1.5">
                            {isStreaming ? (
                              <button
                                type="button"
                                onClick={handleStopGenerating}
                                className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-zinc-800 dark:text-white hover:bg-slate-300 text-xs font-bold transition-all flex items-center gap-1 shadow-xs"
                                title="Stop generating"
                              >
                                <Square className="w-3.5 h-3.5 fill-current text-red-600" />
                                <span className="text-[10px] hidden sm:inline">Stop</span>
                              </button>
                            ) : (
                              <button
                                type="submit"
                                disabled={!inputMessage.trim() || isStreaming}
                                className="p-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-30 text-white transition-all shadow-sm active:scale-95"
                                title="Send message"
                                aria-label="Send message"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </form>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 font-mono mt-2 px-1">
                        <span className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Grounded in Published Journalism
                        </span>
                        <span>{inputMessage.length} / 600</span>
                      </div>
                    </div>
                  </div>
                </main>

                {/* ─────────────────────────────────────────────────────────────
                    3. RIGHT COLUMN: ARTICLE INTELLIGENCE & DISCOVERY (Full-Screen)
                   ───────────────────────────────────────────────────────────── */}
                {isFullscreen && (
                  <aside className="hidden xl:flex flex-col gap-4 border-l border-slate-200/90 dark:border-white/10 p-5 bg-slate-50/60 dark:bg-[#141822] overflow-y-auto min-h-0 no-scrollbar">
                    {/* Section 1: Article Intelligence Metrics */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 space-y-3 shadow-2xs">
                      <span className="text-[10px] font-mono font-black uppercase tracking-wider text-red-600 dark:text-red-400 block">
                        Article Intelligence
                      </span>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5">
                          <div className="text-[10px] font-mono text-zinc-400">Desk</div>
                          <div className="font-bold text-zinc-800 dark:text-zinc-200 truncate">{activeSection || 'General'}</div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5">
                          <div className="text-[10px] font-mono text-zinc-400">Read Time</div>
                          <div className="font-bold text-zinc-800 dark:text-zinc-200">{articleMeta.readTime || '15 min read'}</div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5">
                          <div className="text-[10px] font-mono text-zinc-400">Word Count</div>
                          <div className="font-bold text-zinc-800 dark:text-zinc-200">
                            {articleMeta.wordCount ? `${articleMeta.wordCount.toLocaleString()} words` : '3,200+ words'}
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5">
                          <div className="text-[10px] font-mono text-zinc-400">Format</div>
                          <div className="font-bold text-zinc-800 dark:text-zinc-200 capitalize">{contentType || 'Analysis'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Key Topics & Exploration Tags */}
                    {articleMeta.topics && articleMeta.topics.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 px-1">
                          <Tag className="w-3.5 h-3.5 text-red-500" /> Key Topics
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {articleMeta.topics.map((t, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleSendMessage(`What does this article say about "${t}"?`)}
                              className="px-2.5 py-1 rounded-xl bg-white dark:bg-white/[0.03] hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 border border-slate-200/80 dark:border-white/10 text-zinc-700 dark:text-zinc-300 font-semibold text-[11px] transition-colors"
                            >
                              #{t}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Section 3: Curated Contextual Questions ("Ask About This") */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 px-1">
                        <HelpCircle className="w-3.5 h-3.5 text-red-500" /> Ask About This
                      </span>
                      <div className="space-y-1.5">
                        {contextualQuestions.map((q, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSendMessage(q)}
                            className="w-full text-left p-2.5 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 hover:border-red-500/50 hover:text-red-600 dark:hover:text-red-400 text-xs text-zinc-700 dark:text-zinc-300 transition-colors font-medium"
                          >
                            "{q}"
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Section 4: Recommended Reading */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 px-1">
                        <BookOpen className="w-3.5 h-3.5 text-red-500" /> Recommended Reading
                      </span>

                      {articleMeta.relatedStories && articleMeta.relatedStories.length > 0 ? (
                        <div className="space-y-2">
                          {articleMeta.relatedStories.map((story, idx) => (
                            <RelatedStoryCard key={idx} story={story} />
                          ))}
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                          <p className="font-semibold text-zinc-800 dark:text-zinc-200">More in {activeSection}</p>
                          <p className="text-[11px] leading-relaxed">
                            Explore related dispatches and reports from our {activeSection} news desk.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Section 5: Cited Sources (if present) */}
                    {articleMeta.sources && articleMeta.sources.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 px-1">
                          <FileText className="w-3.5 h-3.5 text-red-500" /> Cited Sources
                        </span>
                        <div className="space-y-1.5">
                          {articleMeta.sources.map((s, i) => (
                            <a
                              key={i}
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block p-2.5 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 hover:border-red-500/50 text-[11px] text-zinc-700 dark:text-zinc-300 transition-colors"
                            >
                              <div className="font-bold truncate">{s.name}</div>
                              <div className="text-[10px] text-zinc-400 font-mono truncate">{s.url}</div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </aside>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
