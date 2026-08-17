'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, User, Loader2 } from 'lucide-react';
import useToastStore from '@/store/useToastStore';

export default function Comments({ slug }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
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
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, name: name.trim(), text: text.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('Comment submitted! It will appear once approved by an editor.', 'success');
        if (typeof window !== 'undefined') {
          localStorage.setItem('techy-commenter-name', name.trim());
        }
        setText('');
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      addToast(err.message || 'Failed to submit comment', 'error');
    } finally {
      setSubmitting(false);
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
    <section className="mt-16 border-t border-zinc-200/80 dark:border-white/10 pt-14">
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
            <span>Post to Discussion</span>
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
            {comments.map((comment, idx) => (
              <div
                key={comment._id || idx}
                className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-white/10 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold font-display text-[10px] grid place-items-center">
                      {comment.name ? comment.name[0] : 'U'}
                    </div>
                    <span className="font-bold text-zinc-900 dark:text-white">{comment.name}</span>
                  </div>
                  <span className="text-[11px] text-zinc-400">{formatDate(comment.createdAt)}</span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans pl-8">
                  {comment.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
