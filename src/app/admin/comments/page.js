'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Check,
  X as RejectIcon,
  Trash2,
  Loader2,
  AlertTriangle,
  Flag,
  Shield,
  Search,
  ExternalLink,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Pin,
  Flame,
  User,
  SlidersHorizontal,
  RefreshCw,
  Clock,
  Sparkles,
  Layers,
  FileText,
  BadgeCheck,
  CornerDownRight,
  X,
  Send,
} from 'lucide-react';
import { commentAPI, taxonomyAPI } from '@/services/api';
import useToastStore from '@/store/useToastStore';
import AdminHeader from '@/components/admin/AdminHeader';
import EmptyState from '@/components/admin/EmptyState';

const STATUS_TABS = [
  { id: 'needs_attention', label: 'Needs Attention', countKey: 'reportedCount' },
  { id: 'pending', label: 'Pending Approval', countKey: 'pendingCount' },
  { id: 'reported', label: 'Reported Flags', countKey: 'reportedCount' },
  { id: 'spam', label: 'Spam Detected', countKey: 'spamCount' },
  { id: 'approved', label: 'Approved', countKey: 'approvedToday' },
  { id: 'rejected', label: 'Rejected', countKey: 'rejectedToday' },
  { id: 'all', label: 'All Comments', countKey: 'totalComments' },
];

export default function CommentsModerationPage() {
  const [comments, setComments] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [desks, setDesks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [activeTab, setActiveTab] = useState('needs_attention');
  const [selectedDesk, setSelectedDesk] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('needs_attention');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Selection & Inspector state
  const [selectedIds, setSelectedIds] = useState([]);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [inspectingComment, setInspectingComment] = useState(null);
  const [threadData, setThreadData] = useState(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [moderatorNote, setModeratorNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const { addToast } = useToastStore();

  // Load Desks
  const fetchDesks = useCallback(async () => {
    try {
      const res = await taxonomyAPI.getAll({ kind: 'section' });
      if (res?.data) setDesks(res.data);
    } catch (e) {
      // Fallback
    }
  }, []);

  // Fetch Metrics
  const fetchMetrics = useCallback(async () => {
    try {
      const res = await commentAPI.getMetrics();
      if (res.success) setMetrics(res.stats);
    } catch (err) {
      console.warn('Failed to load metrics:', err);
    }
  }, []);

  // Fetch Queue
  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 20,
        sort: sortBy,
      };

      if (activeTab === 'needs_attention') {
        params.sort = 'needs_attention';
        params.status = 'all';
      } else if (activeTab !== 'all') {
        params.status = activeTab;
      }

      if (selectedDesk !== 'all') params.desk = selectedDesk;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await commentAPI.getQueue(params);
      if (res.success) {
        setComments(res.comments || []);
        if (res.pagination) {
          setTotalPages(res.pagination.pages || 1);
        }
      }
    } catch (err) {
      console.error('Failed to load comments queue:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, selectedDesk, searchQuery, sortBy, page]);

  useEffect(() => {
    fetchDesks();
    fetchMetrics();
  }, [fetchDesks, fetchMetrics]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Open Inspector
  const handleOpenInspector = async (comment) => {
    setInspectingComment(comment);
    setModeratorNote(comment.moderatorNotes || '');
    setInspectorOpen(true);
    setThreadLoading(true);
    try {
      const res = await commentAPI.getThread(comment._id);
      if (res.success) {
        setThreadData(res);
      }
    } catch (err) {
      console.error('Failed to load thread:', err);
    } finally {
      setThreadLoading(false);
    }
  };

  // Moderate Single Action
  const handleModerate = async (id, action, note = '') => {
    setActionLoading(true);
    try {
      const res = await commentAPI.moderate(id, action, note);
      addToast(res.message || `Comment marked as ${action}`, 'success');
      fetchComments();
      fetchMetrics();
      if (inspectingComment?._id === id) {
        setInspectorOpen(false);
        setInspectingComment(null);
      }
    } catch (err) {
      addToast(err.message || 'Action failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk Moderate Action
  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0) return;
    if (action === 'deleted' && !window.confirm(`Permanently delete ${selectedIds.length} comments?`)) return;

    setActionLoading(true);
    try {
      const res = await commentAPI.bulkModerate(selectedIds, action);
      addToast(res.message || `Processed ${selectedIds.length} comments`, 'success');
      setSelectedIds([]);
      fetchComments();
      fetchMetrics();
    } catch (err) {
      addToast(err.message || 'Bulk operation failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle selection
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === comments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(comments.map((c) => c._id));
    }
  };

  // Keyboard Navigation for Inspector
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!inspectorOpen || !inspectingComment) return;
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handleModerate(inspectingComment._id, 'approved');
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleModerate(inspectingComment._id, 'rejected');
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleModerate(inspectingComment._id, 'spam');
      } else if (e.key === 'Escape') {
        setInspectorOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inspectorOpen, inspectingComment]);

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* 1. TOP COMMAND BAR */}
      <AdminHeader
        title="Community Moderation & Discussion Center"
        breadcrumb={[{ label: 'Reader Safety, Discussion Health & Editorial Engagement' }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setRefreshing(true);
                fetchComments();
                fetchMetrics();
              }}
              disabled={refreshing}
              className="p-2 rounded-xl border border-zinc-200/80 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-300 transition-colors"
              title="Refresh queue"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        }
      />

      {/* 2. LIVE MODERATION PULSE STRIP */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Pending Review</span>
          <p className="font-display text-2xl font-black text-amber-600 dark:text-amber-400">
            {metrics?.pendingCount ?? 0}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Reported Flags</span>
          <p className="font-display text-2xl font-black text-rose-600 dark:text-rose-400">
            {metrics?.reportedCount ?? 0}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Spam Detected</span>
          <p className="font-display text-2xl font-black text-purple-600 dark:text-purple-400">
            {metrics?.spamCount ?? 0}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Approved Today</span>
          <p className="font-display text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {metrics?.approvedToday ?? 0}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Rejected Today</span>
          <p className="font-display text-2xl font-black text-zinc-600 dark:text-zinc-400">
            {metrics?.rejectedToday ?? 0}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Discussions</span>
          <p className="font-display text-2xl font-black text-blue-600 dark:text-blue-400">
            {metrics?.activeDiscussionsCount ?? 0}
          </p>
        </div>
      </section>

      {/* 3. TABS & FILTER TOOLBAR */}
      <section className="space-y-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 border-b border-zinc-200/80 dark:border-white/10">
          {STATUS_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setPage(1);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                  active
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5'
                }`}
              >
                <span>{tab.label}</span>
                {tab.id === 'reported' && metrics?.reportedCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-mono font-black">
                    {metrics.reportedCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Desk Filter */}
            <select
              value={selectedDesk}
              onChange={(e) => {
                setSelectedDesk(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 text-xs font-bold outline-none"
            >
              <option value="all">All Desks</option>
              {desks.map((d) => (
                <option key={d._id} value={d.slug}>{d.name}</option>
              ))}
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 text-xs font-bold outline-none"
            >
              <option value="needs_attention">Priority: Needs Attention</option>
              <option value="reported">Most Reported</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search comments, users, articles..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 outline-none focus:ring-2 focus:ring-red-500/20"
            />
          </div>
        </div>
      </section>

      {/* 4. MODERATION QUEUE CARDS */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 bg-zinc-100 dark:bg-zinc-800/40 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <EmptyState
          title="Moderation queue is clear"
          description="There are no pending, reported, or suspicious comments requiring review."
          className="my-12"
        />
      ) : (
        <section className="space-y-3">
          {/* Select all header */}
          <div className="flex items-center justify-between px-2 text-xs text-zinc-500">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.length === comments.length && comments.length > 0}
                onChange={handleSelectAll}
                className="rounded text-red-600"
              />
              <span className="text-[11px] font-bold">Select All</span>
            </label>
            <span className="font-mono text-[11px]">Showing {comments.length} items</span>
          </div>

          {comments.map((comment) => (
            <div
              key={comment._id}
              className={`p-5 rounded-2xl bg-white dark:bg-[#12151c] border transition-all space-y-3 ${
                comment.reportCount > 0
                  ? 'border-rose-500/30 dark:border-rose-500/20 shadow-xs'
                  : 'border-zinc-200/80 dark:border-white/10'
              }`}
            >
              {/* Comment Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(comment._id)}
                    onChange={() => handleToggleSelect(comment._id)}
                    className="rounded text-red-600 mt-0.5"
                  />

                  <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-700 dark:text-zinc-300 shrink-0">
                    {comment.name.charAt(0)}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-display font-bold text-sm text-zinc-900 dark:text-white truncate">
                        {comment.name}
                      </h4>
                      {comment.isEditorial && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                          <BadgeCheck className="w-3 h-3" />
                          <span>{comment.editorialBadge || 'Staff'}</span>
                        </span>
                      )}
                      {comment.isPinned && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-bold">
                          <Pin className="w-3 h-3" />
                          <span>Pinned</span>
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] text-zinc-400 font-mono">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Status & Reports Pill */}
                <div className="flex items-center gap-2">
                  {comment.reportCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 text-[10px] font-bold flex items-center gap-1">
                      <Flag className="w-3 h-3" />
                      <span>{comment.reportCount} Report{comment.reportCount > 1 ? 's' : ''}</span>
                    </span>
                  )}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                      comment.status === 'approved'
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : comment.status === 'pending'
                        ? 'bg-amber-500/10 text-amber-600'
                        : comment.status === 'spam'
                        ? 'bg-purple-500/10 text-purple-600'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {comment.status}
                  </span>
                </div>
              </div>

              {/* Comment Content */}
              <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans pl-12">
                {comment.text}
              </p>

              {/* Article Context & Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-100 dark:border-white/5 pl-12 text-xs">
                {/* Article Context */}
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <Link
                    href={`/blogs/${comment.slug}`}
                    target="_blank"
                    className="font-bold text-zinc-900 dark:text-white hover:text-red-600 truncate max-w-xs flex items-center gap-1"
                  >
                    <span>{comment.post?.title || comment.slug}</span>
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
                  </Link>
                  {comment.post?.primarySection && (
                    <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[10px] font-mono">
                      {comment.post.primarySection.name || 'Desk'}
                    </span>
                  )}
                </div>

                {/* Inline Actions */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenInspector(comment)}
                    className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1"
                  >
                    <span>Context</span>
                  </button>

                  {comment.status !== 'approved' && (
                    <button
                      type="button"
                      onClick={() => handleModerate(comment._id, 'approved')}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  )}

                  {comment.status !== 'rejected' && (
                    <button
                      type="button"
                      onClick={() => handleModerate(comment._id, 'rejected')}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 hover:bg-rose-500/10 text-xs font-bold text-rose-600 flex items-center gap-1"
                    >
                      <RejectIcon className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  )}

                  {comment.status !== 'spam' && (
                    <button
                      type="button"
                      onClick={() => handleModerate(comment._id, 'spam')}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 hover:bg-purple-500/10 text-xs font-bold text-purple-600 flex items-center gap-1"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Spam</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleModerate(comment._id, comment.isPinned ? 'unpin' : 'pin')}
                    disabled={actionLoading}
                    className={`p-1.5 rounded-xl border transition-colors ${
                      comment.isPinned
                        ? 'border-amber-500 bg-amber-500/10 text-amber-600'
                        : 'border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400'
                    }`}
                    title={comment.isPinned ? 'Unpin Response' : 'Pin Editorial Response'}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-white/10">
              <span className="text-xs text-zinc-500">Page {page} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded-lg border text-xs font-bold disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 rounded-lg border text-xs font-bold disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 5. FLOATING BULK ACTIONS BAR */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 text-xs font-bold"
          >
            <span>{selectedIds.length} comments selected</span>
            <div className="h-4 w-px bg-white/20 dark:bg-zinc-950/20" />
            <button
              type="button"
              onClick={() => handleBulkAction('approved')}
              className="text-emerald-400 dark:text-emerald-600 hover:underline"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => handleBulkAction('rejected')}
              className="text-rose-400 dark:text-rose-600 hover:underline"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={() => handleBulkAction('spam')}
              className="text-purple-400 dark:text-purple-600 hover:underline"
            >
              Mark Spam
            </button>
            <button
              type="button"
              onClick={() => handleBulkAction('deleted')}
              className="text-zinc-400 hover:text-rose-400 hover:underline"
            >
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. CONTEXTUAL THREAD INSPECTOR DRAWER */}
      <AnimatePresence>
        {inspectorOpen && inspectingComment && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white dark:bg-[#12151c] border-l border-zinc-200 dark:border-white/10 w-full max-w-xl h-full p-6 space-y-6 overflow-y-auto shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-red-600" />
                  <h3 className="font-display font-bold text-base text-zinc-900 dark:text-white">
                    Comment Context & Thread Inspector
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectorOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Target Comment Details */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Target Comment</span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {new Date(inspectingComment.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs">
                    {inspectingComment.name.charAt(0)}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-zinc-900 dark:text-white">{inspectingComment.name}</h5>
                    <span className="text-[10px] text-zinc-400 font-mono capitalize">Status: {inspectingComment.status}</span>
                  </div>
                </div>

                <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans">
                  {inspectingComment.text}
                </p>
              </div>

              {/* Reports Breakdown (if reported) */}
              {inspectingComment.reports?.length > 0 && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-rose-600 font-bold text-xs">
                    <Flag className="w-4 h-4" />
                    <span>Report Signals ({inspectingComment.reports.length})</span>
                  </div>
                  <ul className="text-xs space-y-1 text-rose-700 dark:text-rose-300">
                    {inspectingComment.reports.map((r, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span>•</span>
                        <span>{r.reason}</span>
                        <span className="text-[10px] opacity-70 font-mono">({new Date(r.createdAt).toLocaleTimeString()})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Full Discussion Thread */}
              <div className="space-y-3">
                <h4 className="font-display font-bold text-xs uppercase tracking-wider text-zinc-400">
                  Full Article Thread
                </h4>

                {threadLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {threadData?.thread?.map((tc) => (
                      <div
                        key={tc._id}
                        className={`p-3 rounded-xl border text-xs space-y-1 ${
                          tc._id === inspectingComment._id
                            ? 'border-red-500 bg-red-500/5 dark:bg-red-500/10'
                            : 'border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-900/50'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                          <span className="font-bold text-zinc-700 dark:text-zinc-300">{tc.name}</span>
                          <span>{new Date(tc.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-xs text-zinc-700 dark:text-zinc-300">{tc.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Private Moderator Notes */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block">
                  Private Moderator Notes
                </label>
                <textarea
                  rows={2}
                  value={moderatorNote}
                  onChange={(e) => setModeratorNote(e.target.value)}
                  placeholder="Add private note explaining decision..."
                  className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-xs outline-none resize-none"
                />
              </div>

              {/* Actions & Keyboard Shortcuts Hint */}
              <div className="pt-3 border-t border-zinc-200 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleModerate(inspectingComment._id, 'approved', moderatorNote)}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                  >
                    Approve (A)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModerate(inspectingComment._id, 'rejected', moderatorNote)}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                  >
                    Reject (R)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModerate(inspectingComment._id, 'spam', moderatorNote)}
                    className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                  >
                    Spam (S)
                  </button>
                </div>

                <p className="text-[10px] text-zinc-400 text-center font-mono">
                  Shortcuts: [A] Approve • [R] Reject • [S] Spam • [Esc] Close
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
