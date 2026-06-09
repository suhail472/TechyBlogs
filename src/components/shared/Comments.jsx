'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, User, Loader2 } from 'lucide-react';
import useToastStore from '@/store/useToastStore';

export default function Comments({ slug }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
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

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, name: name.trim(), text: text.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('Comment submitted! It will appear once approved by an admin.', 'success');
        if (typeof window !== 'undefined') {
          localStorage.setItem('techy-commenter-name', name.trim());
        }
        setText('');
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
      addToast(err.message || 'Failed to submit comment', 'error');
    }
  };

  const formatDate = (iso) => {
    const date = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <section className="mt-16 border-t border-zinc-200/80 dark:border-white/[0.06] pt-16">
      <div className="max-w-3xl">
        <div className="flex items-center gap-2.5 mb-8">
          <MessageCircle className="w-5 h-5 text-blue-500" />
          <h2 className="text-2xl font-black font-display tracking-tight text-zinc-900 dark:text-white">
            Discussion ({comments.length})
          </h2>
        </div>

        {/* Comment Form */}
        <form onSubmit={handleSubmit} className="mb-10 p-6 rounded-2xl premium-card relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full p-3 rounded-xl text-xs border outline-none transition-all focus:border-blue-400/40 focus:ring-2 focus:ring-blue-500/10 dark:focus:border-blue-500/30 bg-white/80 border-zinc-200/80 text-zinc-900 placeholder-zinc-400 dark:bg-white/[0.03] dark:border-white/[0.06] dark:text-white dark:placeholder-zinc-500"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5 mb-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">Comment</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Share your thoughts on this article..."
              rows="3"
              className="w-full p-3 rounded-xl text-xs border outline-none transition-all focus:border-blue-400/40 focus:ring-2 focus:ring-blue-500/10 dark:focus:border-blue-500/30 bg-white/80 border-zinc-200/80 text-zinc-900 placeholder-zinc-400 dark:bg-white/[0.03] dark:border-white/[0.06] dark:text-white dark:placeholder-zinc-500 resize-none"
              required
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/15 hover:shadow-lg hover:-translate-y-0.5 font-display"
          >
            <Send className="w-3.5 h-3.5" />
            Post Comment
          </button>
        </form>

        {/* Comments List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-6 text-zinc-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
              <p className="text-xs font-bold">Loading comments...</p>
            </div>
          ) : (
            <AnimatePresence>
              {comments.map((comment) => (
                <motion.div
                  key={comment._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-5 rounded-2xl premium-card group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-sm">
                        {comment.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{comment.name}</p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium" suppressHydrationWarning>
                          {formatDate(comment.createdAt || comment.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                    {comment.text}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {!loading && comments.length === 0 && (
            <div className="text-center py-12 text-zinc-400 dark:text-zinc-500">
              <MessageCircle className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-bold">No comments yet</p>
              <p className="text-xs font-medium mt-1">Be the first to share your thoughts!</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
