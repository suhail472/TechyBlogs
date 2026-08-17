'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Send,
  User,
  Loader2,
  BadgeCheck,
  Pin,
  Flag,
  CornerDownRight,
  X,
  Check,
} from 'lucide-react';
import useToastStore from '@/store/useToastStore';

const REPORT_REASONS = [
  'Spam / Promotional',
  'Harassment or Hate Speech',
  'Misinformation / False Context',
  'Threatening / Abusive Language',
  'Off-Topic / Derailing',
  'Personal Information (Doxxing)',
];

export default function Comments({ slug }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); // comment object
  const [reportingComment, setReportingComment] = useState(null);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const { addToast } = useToastStore();

  useEffect(() => {
    fetchComments();
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem('techy-commenter-name') || '';
      setName(savedName);
    }
  }, [slug]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?slug=${slug}`);
      const data = await res.json();
      if (data.success) {
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;

    setSubmitting(true);
    try {
      const payload = {
        slug,
        name: name.trim(),
        text: text.trim(),
        parentId: replyingTo?._id || null,
      };

      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        addToast(
          data.data?.isEditorial
            ? 'Official response published!'
            : 'Comment submitted! It will appear once approved by an editor.',
          'success'
        );
        if (typeof window !== 'undefined') {
          localStorage.setItem('techy-commenter-name', name.trim());
        }
        setText('');
        setReplyingTo(null);
        if (data.data?.isEditorial) {
          fetchComments();
        }
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      addToast(err.message || 'Failed to submit comment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportingComment) return;

    setReportSubmitting(true);
    try {
      const res = await fetch(`/api/comments/${reportingComment._id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reportReason }),
      });
      const data = await res.json();
      if (data.success) {
        addToast(data.message || 'Comment reported to moderation team', 'success');
        setReportingComment(null);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      addToast(err.message || 'Failed to report comment', 'error');
    } finally {
      setReportSubmitting(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return 'Recently';
    const date = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <section className="mt-16 border-t border-zinc-200/80 dark:border-white/10 pt-14 font-sans">
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-8 pb-3 border-b-2 border-zinc-950 dark:border-white">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-red-600 dark:text-red-400" />
            <h2 className="font-display font-black text-2xl text-zinc-900 dark:text-white">
              Reader Discussion ({comments.length})
            </h2>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-mono">
            Civil Discourse
          </span>
        </div>

        {/* Comment Form */}
        <form onSubmit={handleSubmit} className="mb-10 p-6 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-white/10 space-y-4">
          {replyingTo && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs">
              <span className="flex items-center gap-1.5 text-red-700 dark:text-red-300 font-bold">
                <CornerDownRight className="w-3.5 h-3.5" />
                <span>Replying to {replyingTo.name}</span>
              </span>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dr. A. Rahman"
              className="w-full p-3 rounded-xl text-xs border outline-none bg-white dark:bg-zinc-800 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder-zinc-400 focus:ring-2 focus:ring-red-500/20"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Your Perspective</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Share thoughtful feedback, regional context, or technical corrections..."
              rows={4}
              className="w-full p-3 rounded-xl text-xs border outline-none bg-white dark:bg-zinc-800 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder-zinc-400 focus:ring-2 focus:ring-red-500/20 resize-none font-sans leading-relaxed"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-red-600 hover:bg-red-500 text-white transition-colors flex items-center gap-2 shadow-sm shadow-red-600/20 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>{replyingTo ? 'Post Reply' : 'Post to Discussion'}</span>
          </button>
        </form>

        {/* Comments Feed */}
        {loading ? (
          <div className="py-8 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading reader comments...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-zinc-200 dark:border-white/10 text-center text-xs text-zinc-400">
            Be the first to join the conversation on this story.
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => {
              const isChild = !!comment.parent;
              return (
                <div
                  key={comment._id}
                  className={`p-5 rounded-2xl border transition-all space-y-2 ${
                    isChild ? 'ml-6 sm:ml-10 border-l-4 border-l-red-500/50' : ''
                  } ${
                    comment.isPinned
                      ? 'bg-amber-500/[0.04] border-amber-500/30'
                      : 'bg-white dark:bg-zinc-900/60 border-zinc-200/80 dark:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="w-7 h-7 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold font-display text-xs grid place-items-center shrink-0">
                        {comment.name ? comment.name[0] : 'U'}
                      </div>
                      <span className="font-bold text-zinc-900 dark:text-white">{comment.name}</span>

                      {comment.isEditorial && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                          <BadgeCheck className="w-3 h-3" />
                          <span>{comment.editorialBadge || 'Editorial Staff'}</span>
                        </span>
                      )}

                      {comment.isPinned && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-bold">
                          <Pin className="w-3 h-3" />
                          <span>Pinned Editorial Note</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                      <span>{formatDate(comment.createdAt || comment.timestamp)}</span>
                      <button
                        type="button"
                        onClick={() => setReportingComment(comment)}
                        className="hover:text-rose-500 p-1"
                        title="Report inappropriate comment"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans pl-9">
                    {comment.text}
                  </p>

                  <div className="pt-2 pl-9 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingTo(comment);
                        window.scrollTo({ top: 400, behavior: 'smooth' });
                      }}
                      className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                    >
                      <CornerDownRight className="w-3 h-3" />
                      <span>Reply</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Report Modal */}
      <AnimatePresence>
        {reportingComment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#12151c] border border-zinc-200 dark:border-white/10 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 text-rose-500" />
                  <h3 className="font-display font-bold text-base text-zinc-900 dark:text-white">
                    Report Comment
                  </h3>
                </div>
                <button onClick={() => setReportingComment(null)} className="p-1 text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-500">
                Why are you reporting this comment by <strong>{reportingComment.name}</strong>?
              </p>

              <form onSubmit={handleReportSubmit} className="space-y-4 text-xs font-sans">
                <div className="space-y-2">
                  {REPORT_REASONS.map((r) => (
                    <label key={r} className="flex items-center gap-2.5 p-2 rounded-xl border border-zinc-200 dark:border-white/10 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800">
                      <input
                        type="radio"
                        name="report_reason"
                        value={r}
                        checked={reportReason === r}
                        onChange={() => setReportReason(r)}
                        className="text-red-600"
                      />
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">{r}</span>
                    </label>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportingComment(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reportSubmitting}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                  >
                    {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
