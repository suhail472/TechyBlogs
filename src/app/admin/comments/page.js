'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X as RejectIcon, Trash2, Loader2, MessageSquare, AlertCircle } from 'lucide-react';
import useToastStore from '@/store/useToastStore';

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
          setStats(prev => ({
            ...prev,
            total: data.pagination.total
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
        setComments(comments.filter(c => c._id !== id));
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error('Failed to delete comment:', err);
      addToast(err.message || 'Delete failed', 'error');
    }
  };

  const statusColors = {
    pending: 'text-amber-500 bg-amber-500/5 border-amber-500/10',
    approved: 'text-emerald-500 bg-emerald-500/5 border-emerald-500/10',
    rejected: 'text-rose-500 bg-rose-500/5 border-rose-500/10',
  };

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-4xl font-black tracking-tight mb-2 font-display text-slate-900 dark:text-white">Comments</h1>
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Moderate discussions and filter comment postings.
        </p>
      </div>

      {/* Tabs Filter */}
      <div className="flex gap-2 mb-8 border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
        {[
          { label: 'All Discussions', value: '' },
          { label: 'Pending Approval', value: 'pending' },
          { label: 'Approved', value: 'approved' },
          { label: 'Rejected', value: 'rejected' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
              filter === tab.value
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                : 'text-zinc-550 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Comment List */}
      <div className="rounded-[2rem] border overflow-hidden bg-white border-zinc-200 shadow-xl shadow-zinc-200/30 dark:bg-zinc-800/20 dark:border-zinc-800 dark:shadow-none">
        {loading ? (
          <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-slate-400 font-bold text-sm">Loading comments...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="p-16 text-center text-slate-500 font-bold text-sm flex flex-col items-center gap-3">
            <MessageSquare className="w-8 h-8 opacity-40 text-slate-400" />
            <span>No comments found under this filter.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800/80">
                  <th className="px-6 py-4.5 text-[10px] font-black uppercase tracking-widest text-slate-500 w-1/4">Author</th>
                  <th className="px-6 py-4.5 text-[10px] font-black uppercase tracking-widest text-slate-500 w-1/3">Comment</th>
                  <th className="px-6 py-4.5 text-[10px] font-black uppercase tracking-widest text-slate-500 w-1/6">Article Slug</th>
                  <th className="px-6 py-4.5 text-[10px] font-black uppercase tracking-widest text-slate-500 w-1/12">Status</th>
                  <th className="px-6 py-4.5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right w-1/6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-sm font-medium">
                <AnimatePresence>
                  {comments.map((comment) => (
                    <motion.tr
                      key={comment._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-blue-500/5 transition-colors"
                    >
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs shrink-0">
                            {comment.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="truncate max-w-[150px]">
                            <p className="font-bold text-slate-900 dark:text-white">{comment.name}</p>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
                              {new Date(comment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4.5">
                        <p className="text-xs text-slate-650 dark:text-zinc-300 font-medium max-w-xs break-words">
                          {comment.text}
                        </p>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className="text-[10px] font-bold font-mono text-zinc-500 truncate max-w-[120px] block">
                          {comment.slug}
                        </span>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border ${statusColors[comment.status]}`}>
                          {comment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {comment.status !== 'approved' && (
                            <button
                              onClick={() => handleUpdateStatus(comment._id, 'approved')}
                              className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all"
                              title="Approve Comment"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          {comment.status !== 'rejected' && (
                            <button
                              onClick={() => handleUpdateStatus(comment._id, 'rejected')}
                              className="p-2 text-amber-500 hover:bg-amber-500/10 rounded-xl transition-all"
                              title="Reject Comment"
                            >
                              <RejectIcon className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(comment._id)}
                            className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                            title="Delete Comment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
