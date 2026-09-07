'use client';

import { useState } from 'react';
import { Copy, Check, RotateCcw, User, Bot, ThumbsUp, ThumbsDown, BookOpen } from 'lucide-react';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer';
import RelatedStoryCard from './RelatedStoryCard';

export default function AiMessageList({
  messages = [],
  isStreaming = false,
  streamText = '',
  streamingRelatedStories = [],
  onRetry = null,
}) {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [feedback, setFeedback] = useState({}); // { [idx]: 'up' | 'down' }

  const handleCopy = async (text, idx) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (e) {
      // ignore
    }
  };

  const handleFeedback = (idx, type) => {
    setFeedback((prev) => ({ ...prev, [idx]: type }));
  };

  return (
    <div className="w-full space-y-6 py-2">
      {messages.map((msg, idx) => {
        const isUser = msg.role === 'user';

        return (
          <div
            key={idx}
            className={`w-full flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
          >
            {/* Sender Label */}
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider px-1">
              {isUser ? (
                <>
                  <span>You</span>
                  <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
                    <User className="w-2.5 h-2.5" />
                  </div>
                </>
              ) : (
                <>
                  <div className="w-4 h-4 rounded-full bg-red-600 flex items-center justify-center text-white">
                    <Bot className="w-2.5 h-2.5" />
                  </div>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">TechyBlogs AI</span>
                </>
              )}
            </div>

            {/* Message Bubble — Assistant expands to 100% full width for tables and cards */}
            <div
              className={`p-4 sm:p-5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                isUser
                  ? 'max-w-[88%] sm:max-w-[75%] bg-red-600 text-white rounded-tr-xs shadow-xs font-medium self-end'
                  : 'w-full bg-slate-50 dark:bg-[#1e2535] text-zinc-900 dark:text-zinc-100 border border-slate-200/90 dark:border-white/10 rounded-tl-xs shadow-xs self-stretch'
              }`}
            >
              {isUser ? (
                <p className="whitespace-pre-wrap font-sans">{msg.content}</p>
              ) : (
                <div className="prose prose-zinc dark:prose-invert prose-sm sm:prose-base !max-w-none w-full overflow-hidden">
                  <MarkdownRenderer content={msg.content} />
                </div>
              )}

              {/* Related Public Stories Cards (if attached) */}
              {!isUser && msg.relatedStories && msg.relatedStories.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-white/10 space-y-2.5 w-full">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-red-500" /> Recommended Related Stories:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                    {msg.relatedStories.map((story, sIdx) => (
                      <RelatedStoryCard key={sIdx} story={story} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar for Completed Assistant Responses */}
            {!isUser && (
              <div className="flex items-center gap-2.5 px-1 text-[11px] text-zinc-400">
                <button
                  type="button"
                  onClick={() => handleCopy(msg.content, idx)}
                  className="hover:text-zinc-700 dark:hover:text-zinc-200 flex items-center gap-1 transition-colors"
                  title="Copy text"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span className="text-emerald-500 text-[10px]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span className="text-[10px]">Copy</span>
                    </>
                  )}
                </button>

                <div className="h-3 w-[1px] bg-slate-200 dark:bg-white/10" />

                <button
                  type="button"
                  onClick={() => handleFeedback(idx, 'up')}
                  className={`hover:text-zinc-700 dark:hover:text-zinc-200 flex items-center gap-1 transition-colors ${
                    feedback[idx] === 'up' ? 'text-emerald-500 font-bold' : ''
                  }`}
                  title="Helpful response"
                >
                  <ThumbsUp className="w-3 h-3" />
                </button>

                <button
                  type="button"
                  onClick={() => handleFeedback(idx, 'down')}
                  className={`hover:text-zinc-700 dark:hover:text-zinc-200 flex items-center gap-1 transition-colors ${
                    feedback[idx] === 'down' ? 'text-rose-500 font-bold' : ''
                  }`}
                  title="Not helpful"
                >
                  <ThumbsDown className="w-3 h-3" />
                </button>

                {onRetry && idx === messages.length - 1 && (
                  <>
                    <div className="h-3 w-[1px] bg-slate-200 dark:bg-white/10" />
                    <button
                      type="button"
                      onClick={onRetry}
                      className="hover:text-zinc-700 dark:hover:text-zinc-200 flex items-center gap-1 transition-colors"
                      title="Regenerate answer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span className="text-[10px]">Retry</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Live Streaming Response Bubble */}
      {isStreaming && (
        <div className="w-full flex flex-col items-start space-y-1.5 animate-in fade-in duration-200">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider px-1">
            <div className="w-4 h-4 rounded-full bg-red-600 flex items-center justify-center text-white">
              <Bot className="w-2.5 h-2.5" />
            </div>
            <span className="font-bold text-zinc-800 dark:text-zinc-200">TechyBlogs AI</span>
            <span className="text-red-500 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping inline-block" />
              Thinking...
            </span>
          </div>

          <div className="w-full p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-[#1e2535] text-zinc-900 dark:text-zinc-100 border border-slate-200/90 dark:border-white/10 rounded-tl-xs shadow-xs text-xs sm:text-sm self-stretch">
            {streamText ? (
              <div className="prose prose-zinc dark:prose-invert prose-sm sm:prose-base !max-w-none w-full overflow-hidden">
                <MarkdownRenderer content={streamText} />
              </div>
            ) : (
              <div className="flex items-center gap-2.5 text-zinc-500 dark:text-zinc-400 py-2 font-mono text-xs">
                <Bot className="w-4 h-4 text-red-500 animate-pulse" />
                <span>Analyzing story and contextualizing response...</span>
              </div>
            )}

            {streamingRelatedStories && streamingRelatedStories.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-white/10 space-y-2.5 w-full">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-red-500" /> Recommended Related Stories:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                  {streamingRelatedStories.map((story, sIdx) => (
                    <RelatedStoryCard key={sIdx} story={story} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
