'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X as RejectIcon, Trash2, Loader2, MessageSquare, AlertCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import useToastStore from '@/store/useToastStore';
import AdminHeader from '@/components/admin/AdminHeader';
import EmptyState from '@/components/admin/EmptyState';

export default function CommentsModeration() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(''); // '' (all), 'pending', 'approved', 'rejected'
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0 });
  const { addToast } = useToastStore();

  useEffect(() => {
    fetchComments();
  }, [filter]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const url = filter ? `/api/comments?status=${filter}` : '/api/comments';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setComments(data.comments || []);
        if (data.pagination) {
          setStats((prev) => ({
            ...prev,
            total: data.pagination.total,
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load comments:', err);
      addToast('Failed to load comments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/comments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        addToast(`Comment marked as ${status}`, 'success');
        fetchComments();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error('Failed to update comment status:', err);
      addToast(err.message || 'Action failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this comment?')) return;
    try {
      const res = await fetch(`/api/comments/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        addToast('Comment deleted successfully', 'success');
        setComments(comments.filter((c) => c._id !== id));
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error('Failed to delete comment:', err);
      addToast(err.message || 'Delete failed', 'error');
    }
  };

  const statusColors = {
    pending: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
    approved: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
    rejected: 'text-rose-600 bg-rose-500/10 border-rose-500/20',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminHeader
        title="Discussion Moderation Queue"
        breadcrumb={[{ label: 'Comment Queue' }]}
      />

      {/* Tabs Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-zinc-200/80 dark:border-white/10">
        {[
          { label: 'All Discussions', value: '' },
          { label: 'Pending Approval', value: 'pending' },
          { label: 'Approved', value: 'approved' },
          { label: 'Rejected / Spam', value: 'rejected' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === tab.value
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
              Loading comment moderation queue...
            </p>
          </div>
        ) : comments.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No reader comments in this queue"
            description="All reader discussions have been reviewed or no comments match your active filter."
          />
        ) : (
          comments.map((comment) => (
            <motion.div
              key={comment._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center font-bold text-xs font-display">
                    {comment.name ? comment.name[0] : 'R'}
                  </div>
                  <div>
                    <span className="font-bold text-xs text-zinc-900 dark:text-white font-display">
                      {comment.name}
                    </span>
                    <span className="text-[11px] text-zinc-400 ml-2">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border font-mono ${
                      statusColors[comment.status] || statusColors.pending
                    }`}
                  >
                    {comment.status}
                  </span>

                  {comment.postSlug && (
                    <Link
                      href={`/blog/${comment.postSlug}`}
                      target="_blank"
                      className="p-1 text-zinc-400 hover:text-red-600 transition-colors"
                      title="View Article"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>

              <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans">
                {comment.content}
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                {comment.status !== 'approved' && (
                  <button
                    onClick={() => handleUpdateStatus(comment._id, 'approved')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                )}

                {comment.status !== 'rejected' && (
                  <button
                    onClick={() => handleUpdateStatus(comment._id, 'rejected')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
                  >
                    <RejectIcon className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                )}

                <button
                  onClick={() => handleDelete(comment._id)}
                  className="p-1.5 rounded-xl hover:bg-rose-500/10 text-zinc-400 hover:text-rose-600 transition-colors"
                  title="Delete Comment"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
