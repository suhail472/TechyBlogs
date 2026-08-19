'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  RefreshCw,
  Flame,
  Activity,
  AlertCircle,
  AlertTriangle,
  Clock,
  Calendar,
  Eye,
  Heart,
  MessageSquare,
  FileText,
  CheckCircle2,
  Check,
  X,
  Layers,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  Filter,
  Trash2,
  Edit,
  ExternalLink,
  Lock,
  Globe,
  Radio,
  SlidersHorizontal,
  Send,
  Archive,
  UserCheck,
  FolderOpen,
  ArrowUpRight,
  MoreVertical,
  ChevronLeft,
  Loader2,
  Bookmark,
  Sparkles,
} from 'lucide-react';
import { postAPI, adminAPI, taxonomyAPI, authorAPI } from '@/services/api';
import useAuthStore from '@/store/useAuthStore';
import useToastStore from '@/store/useToastStore';
import StatusBadge from '@/components/admin/StatusBadge';
import EmptyState from '@/components/admin/EmptyState';
import AdminHeader from '@/components/admin/AdminHeader';

export default function NewsroomCommandCenter() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  // Command Center Overview Data State
  const [pulseData, setPulseData] = useState(null);
  const [loadingPulse, setLoadingPulse] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Stories Table & Filtering State
  const [stories, setStories] = useState([]);
  const [loadingStories, setLoadingStories] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [contentTypeFilter, setContentTypeFilter] = useState('all');
  const [authorFilter, setAuthorFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 20 });

  // Taxonomy & Authors for Dropdown Filters
  const [sections, setSections] = useState([]);
  const [authors, setAuthors] = useState([]);

  // Multi-Select & Bulk Operations State
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkActionSubmitting, setBulkActionSubmitting] = useState(false);
  const [bulkConfirmModal, setBulkConfirmModal] = useState({ open: false, action: null, title: '', message: '', targetData: {} });
  const [deleteModal, setDeleteModal] = useState({ open: false, story: null });

  // Urgent Stories Active Tab: 'all', 'breaking', 'developing'
  const [urgentTab, setUrgentTab] = useState('all');

  // Load Command Center Pulse Data
  const fetchPulseData = useCallback(async () => {
    try {
      const res = await adminAPI.getCommandCenterData();
      if (res.success) {
        setPulseData(res);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.warn('Failed to load command center pulse:', err);
    } finally {
      setLoadingPulse(false);
    }
  }, []);

  // Load Stories Table Data
  const fetchStories = useCallback(async () => {
    setLoadingStories(true);
    try {
      const options = {
        status: statusFilter === 'all' ? 'all' : statusFilter,
        page,
        limit: 20,
      };
      if (sectionFilter !== 'all') options.category = sectionFilter;
      if (contentTypeFilter !== 'all') options.contentType = contentTypeFilter;
      if (searchQuery.trim()) options.search = searchQuery.trim();

      const res = await postAPI.getAllPosts(options);
      if (res.posts) {
        let list = res.posts;
        if (authorFilter !== 'all') {
          list = list.filter((p) => (p.author || '').toLowerCase() === authorFilter.toLowerCase());
        }
        setStories(list);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      console.error('Failed to load newsroom stories:', err);
    } finally {
      setLoadingStories(false);
    }
  }, [statusFilter, sectionFilter, contentTypeFilter, authorFilter, searchQuery, page]);

  // Initial Data Fetch
  useEffect(() => {
    fetchPulseData();
    // Load taxonomy & authors for filter bars
    Promise.allSettled([taxonomyAPI.getAll({ kind: 'section' }), authorAPI.getAll()]).then(([taxRes, authRes]) => {
      if (taxRes.status === 'fulfilled' && taxRes.value?.data) {
        setSections(taxRes.value.data);
      }
      if (authRes.status === 'fulfilled' && authRes.value?.data) {
        setAuthors(authRes.value.data);
      }
    });
  }, [fetchPulseData]);

  // Refetch Stories on filter change
  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  // Keyboard shortcut Ctrl+N / Cmd+N for Quick Create
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        router.push('/admin/create');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  // Bulk Selection Handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(stories.map((s) => s._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  // Execute Bulk Action
  const handleExecuteBulkAction = async () => {
    const { action, targetData } = bulkConfirmModal;
    if (!action || selectedIds.length === 0) return;

    setBulkActionSubmitting(true);
    try {
      const res = await postAPI.bulkAction(action, selectedIds, targetData);
      if (res.success) {
        addToast(res.message || 'Bulk operation completed', 'success');
        setSelectedIds([]);
        setBulkConfirmModal({ open: false, action: null, title: '', message: '', targetData: {} });
        fetchPulseData();
        fetchStories();
      } else {
        throw new Error(res.message || 'Bulk action failed');
      }
    } catch (err) {
      addToast(err.message || 'Bulk action error', 'error');
    } finally {
      setBulkActionSubmitting(false);
    }
  };

  // Single Delete Story Handler
  const handleConfirmDelete = async () => {
    if (!deleteModal.story) return;
    try {
      await postAPI.deletePost(deleteModal.story._id);
      addToast(`Story "${deleteModal.story.title}" deleted`, 'info');
      setDeleteModal({ open: false, story: null });
      fetchPulseData();
      fetchStories();
    } catch (err) {
      addToast('Failed to delete story: ' + err.message, 'error');
    }
  };

  // Format dynamic time greeting
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // Filter urgent stories based on active tab
  const filteredUrgentStories = useMemo(() => {
    if (!pulseData?.urgentStories) return [];
    if (urgentTab === 'breaking') {
      return pulseData.urgentStories.filter((s) => s.editorial?.breaking || s.breaking);
    }
    if (urgentTab === 'developing') {
      return pulseData.urgentStories.filter((s) => s.editorial?.developing || s.developing);
    }
    return pulseData.urgentStories;
  }, [pulseData?.urgentStories, urgentTab]);

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* 1. NEWSROOM TOP COMMAND BAR */}
      <AdminHeader
        title={`Newsroom Command Center`}
        breadcrumb={[{ label: 'Operations & Desk Dashboard' }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                fetchPulseData();
                fetchStories();
                addToast('Newsroom metrics refreshed', 'info');
              }}
              className="p-2 rounded-xl border border-zinc-200/80 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors flex items-center gap-1.5 text-xs font-bold"
              title="Refresh Newsroom Pulse"
              aria-label="Refresh Newsroom Data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sync</span>
            </button>

            <Link
              href="/admin/create"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-red-600 hover:bg-red-500 text-white transition-colors shadow-sm shadow-red-600/20"
              title="Create New Story (Ctrl+N)"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New Story</span>
            </Link>
          </div>
        }
      />

      {/* 2. OPERATIONAL PUBLICATION PULSE STRIP */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-red-600 animate-pulse" />
            <span className="text-[11px] font-mono font-black uppercase tracking-widest text-zinc-400">
              Publication Pulse · {todayFormatted}
            </span>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
            Last synced {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Tile 1: Published Today */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-1">
            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 font-mono block">
              Published Today
            </span>
            <p className="font-display text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {pulseData?.pulse?.publishedToday ?? 0}
            </p>
            <span className="text-[10px] text-zinc-500 font-medium">Stories live today</span>
          </div>

          {/* Tile 2: Scheduled Pipeline */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-1">
            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 font-mono block">
              Scheduled
            </span>
            <p className="font-display text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
              {pulseData?.pulse?.scheduledToday ?? 0}
            </p>
            <span className="text-[10px] text-zinc-500 font-medium">Upcoming releases</span>
          </div>

          {/* Tile 3: In Review Queue */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-1">
            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 font-mono block">
              In Review
            </span>
            <p className="font-display text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
              {pulseData?.pulse?.inReview ?? 0}
            </p>
            <span className="text-[10px] text-zinc-500 font-medium">Awaiting approval</span>
          </div>

          {/* Tile 4: Active Drafts */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-1">
            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 font-mono block">
              Active Drafts
            </span>
            <p className="font-display text-2xl sm:text-3xl font-black text-zinc-800 dark:text-zinc-100">
              {pulseData?.pulse?.drafts ?? 0}
            </p>
            <span className="text-[10px] text-zinc-500 font-medium">In workstation</span>
          </div>

          {/* Tile 5: Breaking Stories */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-1">
            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 font-mono block">
              Breaking / Live
            </span>
            <p className="font-display text-2xl sm:text-3xl font-black text-red-600 dark:text-red-400">
              {pulseData?.pulse?.breakingCount ?? 0}
            </p>
            <span className="text-[10px] text-zinc-500 font-medium">Critical alerts</span>
          </div>

          {/* Tile 6: Reader Traffic / Views */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-1">
            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 font-mono block">
              Total Pageviews
            </span>
            <p className="font-display text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
              {(pulseData?.pulse?.totalViews || 0) >= 1000
                ? `${((pulseData?.pulse?.totalViews || 0) / 1000).toFixed(1)}k`
                : pulseData?.pulse?.totalViews || 0}
            </p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Total live reads</span>
          </div>
        </div>
      </section>

      {/* 3. URGENT & LIVE STORIES DESK (Breaking & Developing Stories) */}
      {pulseData?.urgentStories?.length > 0 && (
        <section className="rounded-2xl bg-white dark:bg-[#12151c] border border-red-500/30 dark:border-red-500/20 shadow-xs overflow-hidden">
          <div className="p-4 bg-red-500/5 border-b border-red-500/20 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600" />
              </span>
              <h2 className="font-display text-sm font-bold text-red-950 dark:text-red-300 uppercase tracking-wide">
                Urgent Stories & Live Desk ({pulseData.urgentStories.length})
              </h2>
            </div>

            {/* Sub-tabs */}
            <div className="flex items-center gap-1 bg-white/80 dark:bg-zinc-900/80 p-0.5 rounded-xl border border-red-500/20 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setUrgentTab('all')}
                className={`px-2.5 py-0.5 rounded-lg transition-colors ${urgentTab === 'all' ? 'bg-red-600 text-white' : 'text-zinc-600 dark:text-zinc-400'}`}
              >
                All Urgent ({pulseData.urgentStories.length})
              </button>
              <button
                type="button"
                onClick={() => setUrgentTab('breaking')}
                className={`px-2.5 py-0.5 rounded-lg transition-colors ${urgentTab === 'breaking' ? 'bg-red-600 text-white' : 'text-zinc-600 dark:text-zinc-400'}`}
              >
                Breaking News
              </button>
              <button
                type="button"
                onClick={() => setUrgentTab('developing')}
                className={`px-2.5 py-0.5 rounded-lg transition-colors ${urgentTab === 'developing' ? 'bg-red-600 text-white' : 'text-zinc-600 dark:text-zinc-400'}`}
              >
                Developing
              </button>
            </div>
          </div>

          <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUrgentStories.map((story) => {
              const isBreaking = story.editorial?.breaking || story.breaking;
              return (
                <div
                  key={story._id}
                  className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-white/10 hover:border-red-500/40 bg-zinc-50/50 dark:bg-white/[0.02] flex flex-col justify-between space-y-3 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1 ${
                          isBreaking
                            ? 'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/30'
                            : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {isBreaking ? <Flame className="w-2.5 h-2.5 text-red-600" /> : <Activity className="w-2.5 h-2.5 text-amber-600" />}
                        <span>{isBreaking ? 'Breaking News' : 'Developing Story'}</span>
                      </span>

                      <span className="text-[10px] font-mono text-zinc-400">
                        {story.primarySection || story.categories?.[0] || 'General'}
                      </span>
                    </div>

                    <Link
                      href={`/admin/edit/${story._id}`}
                      className="font-display font-bold text-sm text-zinc-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 line-clamp-2 transition-colors block"
                    >
                      {story.title}
                    </Link>

                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                      {story.subtitle || story.excerpt || 'No subtitle dek recorded'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-zinc-200/60 dark:border-white/5 flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500 font-medium">By {story.author || 'Editorial Bureau'}</span>
                    <Link
                      href={`/admin/edit/${story._id}`}
                      className="font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-0.5"
                    >
                      <span>Open Story</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. EDITORIAL WORK QUEUE & TODAY'S PUBLISHING TIMELINE (2-Column Grid) */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column: Actionable Editorial Work Queue (Needs Attention) */}
        <section className="rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs flex flex-col overflow-hidden">
          <div className="p-4 border-b border-zinc-200/80 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <h2 className="font-display font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wide">
                Editorial Work Queue ({pulseData?.needsAttention?.length || 0})
              </h2>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">Actionable items requiring editor focus</span>
          </div>

          <div className="p-4 flex-1 overflow-y-auto space-y-3">
            {pulseData?.needsAttention?.length === 0 ? (
              <div className="py-8 text-center text-zinc-400 space-y-1">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 opacity-60" />
                <p className="text-xs font-bold text-zinc-600 dark:text-zinc-300">All Caught Up</p>
                <p className="text-[11px] text-zinc-400">No stories currently missing required assets or awaiting review.</p>
              </div>
            ) : (
              pulseData?.needsAttention?.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-zinc-200/70 dark:border-white/5 hover:border-amber-500/30 bg-zinc-50/50 dark:bg-white/[0.01] flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                          item.priority === 'high'
                            ? 'bg-rose-500/10 text-rose-600'
                            : item.priority === 'medium'
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-blue-500/10 text-blue-600'
                        }`}
                      >
                        {item.type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">{item.section}</span>
                    </div>

                    <p className="font-bold text-xs text-zinc-900 dark:text-white truncate">{item.title}</p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{item.reason}</p>
                  </div>

                  <Link
                    href={`/admin/edit/${item.postId}`}
                    className="px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-red-600 hover:text-white text-zinc-700 dark:text-zinc-200 font-bold text-[11px] shrink-0 transition-colors"
                  >
                    Fix ↗
                  </Link>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Right Column: Today's Publishing Schedule & Next to Publish */}
        <section className="rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs flex flex-col overflow-hidden">
          <div className="p-4 border-b border-zinc-200/80 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-500" />
              <h2 className="font-display font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wide">
                Today's Publishing Schedule
              </h2>
            </div>
            <Link href="/admin/calendar" className="text-[10px] font-bold text-purple-600 hover:underline">
              Full Calendar →
            </Link>
          </div>

          <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
            {/* Imminent Next Release Hero Card */}
            {pulseData?.nextScheduled ? (
              <div className="p-3.5 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">
                    NEXT TO PUBLISH
                  </span>
                  <span className="text-xs font-mono font-bold text-purple-700 dark:text-purple-300">
                    {new Date(pulseData.nextScheduled.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <Link
                  href={`/admin/edit/${pulseData.nextScheduled._id}`}
                  className="font-bold text-sm text-zinc-900 dark:text-white hover:text-purple-600 block line-clamp-1"
                >
                  {pulseData.nextScheduled.title}
                </Link>
                <div className="flex items-center justify-between text-[11px] text-zinc-500">
                  <span>{pulseData.nextScheduled.primarySection || 'General'} · By {pulseData.nextScheduled.author}</span>
                  <Link href={`/admin/edit/${pulseData.nextScheduled._id}`} className="font-bold text-purple-600 hover:underline">
                    Inspect ↗
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 text-center text-xs text-zinc-400">
                No upcoming stories scheduled for release today.
              </div>
            )}

            {/* Chronological Timeline List */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">
                Today's Timeline
              </span>
              {pulseData?.publishingTimeline?.length === 0 ? (
                <p className="text-xs text-zinc-400 text-center py-2">No activity logged for today yet.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {pulseData?.publishingTimeline?.map((item) => {
                    const time = item.publishedAt ? new Date(item.publishedAt) : new Date(item.scheduledAt);
                    const isPub = item.status === 'published';
                    return (
                      <div key={item._id} className="flex items-center justify-between text-xs py-1 border-b border-zinc-100 dark:border-white/5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[11px] text-zinc-400 shrink-0">
                            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className={`w-2 h-2 rounded-full shrink-0 ${isPub ? 'bg-emerald-500' : 'bg-purple-500'}`} />
                          <Link href={`/admin/edit/${item._id}`} className="font-medium text-zinc-800 dark:text-zinc-200 hover:underline truncate">
                            {item.title}
                          </Link>
                        </div>
                        <StatusBadge status={item.status} className="shrink-0 scale-90" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* 5. NEWSROOM STORIES DESK & WORKFLOW TABLE (With Multi-Select Bulk Actions) */}
      <section className="rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs overflow-hidden">
        {/* Table Header & Search/Filter Strip */}
        <div className="p-4 border-b border-zinc-200/80 dark:border-white/10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display font-bold text-base text-zinc-900 dark:text-white">
                Newsroom Stories & Editorial Queue
              </h2>
              <p className="text-xs text-zinc-500">
                Manage, publish, and bulk-assign stories across all editorial desks
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search headlines, authors, slugs..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/10 outline-none focus:ring-2 focus:ring-red-500/20"
              />
            </div>
          </div>

          {/* Filter Dropdowns & Status Tabs */}
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-zinc-100 dark:border-white/5">
            {/* Status Pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              {['all', 'published', 'draft', 'in_review', 'scheduled', 'archived'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setStatusFilter(tab);
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap shrink-0 ${
                    statusFilter === tab
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5'
                  }`}
                >
                  {tab.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Dimensional Selectors: Desk, Content Type, Author */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {/* Desk Filter */}
              <select
                value={sectionFilter}
                onChange={(e) => {
                  setSectionFilter(e.target.value);
                  setPage(1);
                }}
                className="p-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/10 text-xs font-medium outline-none"
              >
                <option value="all">All Desks</option>
                {sections.map((sec) => (
                  <option key={sec._id || sec.name} value={sec.name}>
                    {sec.name}
                  </option>
                ))}
              </select>

              {/* Content Type Filter */}
              <select
                value={contentTypeFilter}
                onChange={(e) => {
                  setContentTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="p-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/10 text-xs font-medium outline-none"
              >
                <option value="all">All Formats</option>
                <option value="article">Standard Article</option>
                <option value="news">News / Reporting</option>
                <option value="tutorial">Tutorial</option>
                <option value="guide">Guide</option>
                <option value="review">Review</option>
                <option value="opinion">Opinion</option>
              </select>

              {/* Author Filter */}
              <select
                value={authorFilter}
                onChange={(e) => {
                  setAuthorFilter(e.target.value);
                  setPage(1);
                }}
                className="p-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/10 text-xs font-medium outline-none"
              >
                <option value="all">All Authors</option>
                {authors.map((auth) => (
                  <option key={auth._id || auth.name} value={auth.name}>
                    {auth.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* FLOATING BULK ACTIONS BAR (When 1+ items selected) */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-zinc-900 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-700 shadow-md z-10 lg:relative fixed bottom-0 left-0 right-0 lg:static safe-area-bottom"
            >
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center text-[10px]">
                  {selectedIds.length}
                </span>
                <span>{selectedIds.length} Stories Selected</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Bulk Publish */}
                <button
                  type="button"
                  onClick={() =>
                    setBulkConfirmModal({
                      open: true,
                      action: 'publish',
                      title: `Publish ${selectedIds.length} Stories?`,
                      message: `Selected stories will be validated and immediately made publicly accessible.`,
                    })
                  }
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors flex items-center gap-1"
                >
                  <Send className="w-3 h-3" /> Publish
                </button>

                {/* Bulk Archive */}
                <button
                  type="button"
                  onClick={() =>
                    setBulkConfirmModal({
                      open: true,
                      action: 'archive',
                      title: `Archive ${selectedIds.length} Stories?`,
                      message: `Selected stories will be unlisted and moved to the archive.`,
                    })
                  }
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold transition-colors flex items-center gap-1"
                >
                  <Archive className="w-3 h-3" /> Archive
                </button>

                {/* Bulk Delete */}
                <button
                  type="button"
                  onClick={() =>
                    setBulkConfirmModal({
                      open: true,
                      action: 'delete',
                      title: `Permanently Delete ${selectedIds.length} Stories?`,
                      message: `This action CANNOT be undone. All revisions and database records will be permanently removed.`,
                    })
                  }
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>

                {/* Clear Selection */}
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="p-1 rounded text-zinc-400 hover:text-white"
                  title="Clear Selection"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stories List / Table */}
        {loadingStories ? (
          <div className="p-12 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : stories.length === 0 ? (
          <EmptyState
            title="No newsroom stories found"
            description="No articles match your active filter criteria. Write a new story to populate the publication."
            actionLabel="Create Story"
            actionHref="/admin/create"
            className="m-6"
          />
        ) : (
          <div>
            {/* MOBILE CARD VIEW — visible on <lg screens */}
            <div className="lg:hidden divide-y divide-zinc-200/60 dark:divide-white/5">
              {stories.map((story) => {
                const isChecked = selectedIds.includes(story._id);
                return (
                  <div
                    key={story._id}
                    className={`p-4 space-y-3 ${isChecked ? 'bg-red-500/5 dark:bg-red-500/10' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSelect(story._id)}
                        className="w-4 h-4 text-red-600 rounded mt-1 shrink-0"
                      />
                      {story.image ? (
                        <img
                          src={story.image}
                          alt=""
                          className="w-14 h-14 rounded-xl object-cover border border-zinc-200 dark:border-white/10 shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0 font-mono text-xs">
                          TB
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/admin/edit/${story._id}`}
                          className="font-bold text-sm text-zinc-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 line-clamp-2 transition-colors block"
                        >
                          {story.title}
                        </Link>
                        <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                          {story.subtitle || story.excerpt || 'No subtitle dek'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pl-7">
                      <div className="flex items-center gap-2 flex-wrap text-[11px]">
                        <StatusBadge status={story.status || 'published'} />
                        <span className="text-zinc-500 font-medium">
                          {story.primarySection?.name || story.categories?.[0] || 'General'}
                        </span>
                        <span className="text-zinc-400">·</span>
                        <span className="text-zinc-400 font-medium">
                          {story.author || 'Editorial Bureau'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/admin/edit/${story._id}`}
                          className="touch-target p-1.5 rounded-lg border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        {story.status === 'published' && (
                          <Link
                            href={`/blog/${story.slug}`}
                            target="_blank"
                            className="touch-target p-1.5 rounded-lg border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300"
                            title="View"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeleteModal({ open: true, story })}
                          className="touch-target p-1.5 rounded-lg border border-zinc-200 dark:border-white/10 text-zinc-400 hover:text-rose-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pl-7 text-[10px] text-zinc-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {story.views || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3 text-rose-500" /> {story.likes || 0}
                      </span>
                      <span>
                        {new Date(story.updatedAt || story.createdAt || Date.now()).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP TABLE VIEW — visible on lg+ screens */}
            <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-200/80 dark:border-white/10 font-mono">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={stories.length > 0 && selectedIds.length === stories.length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-red-600 rounded"
                    />
                  </th>
                  <th className="py-3 px-3">Story & Dek</th>
                  <th className="py-3 px-4">Desk</th>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Performance</th>
                  <th className="py-3 px-4">Updated</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-white/5">
                {stories.map((story) => {
                  const isChecked = selectedIds.includes(story._id);
                  return (
                    <tr
                      key={story._id}
                      className={`hover:bg-zinc-50/70 dark:hover:bg-white/[0.02] transition-colors group ${
                        isChecked ? 'bg-red-500/5 dark:bg-red-500/10' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(story._id)}
                          className="w-4 h-4 text-red-600 rounded"
                        />
                      </td>

                      <td className="py-3.5 px-3 max-w-sm">
                        <div className="flex items-center gap-3">
                          {story.image ? (
                            <img
                              src={story.image}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover border border-zinc-200 dark:border-white/10 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0 font-mono text-[10px]">
                              TB
                            </div>
                          )}

                          <div className="space-y-0.5 min-w-0">
                            <Link
                              href={`/admin/edit/${story._id}`}
                              className="font-bold text-zinc-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 line-clamp-1 transition-colors"
                            >
                              {story.title}
                            </Link>
                            <p className="text-[11px] text-zinc-400 line-clamp-1">
                              {story.subtitle || story.excerpt || 'No subtitle dek'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                          {story.primarySection?.name || story.primarySection || story.categories?.[0] || 'General'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-zinc-700 dark:text-zinc-300">
                        {story.author || 'Editorial Bureau'}
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={story.status || 'published'} />
                      </td>

                      <td className="py-3.5 px-4 text-zinc-500 font-mono text-[11px]">
                        <div className="flex items-center gap-2.5">
                          <span className="flex items-center gap-1" title="Views">
                            <Eye className="w-3 h-3 text-zinc-400" /> {story.views || 0}
                          </span>
                          <span className="flex items-center gap-1" title="Likes">
                            <Heart className="w-3 h-3 text-rose-500" /> {story.likes || 0}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px]">
                        {new Date(story.updatedAt || story.createdAt || Date.now()).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/admin/edit/${story._id}`}
                            className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 dark:border-white/10 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
                            title="Edit in Article Studio"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>

                          {story.status === 'published' && (
                            <Link
                              href={`/blog/${story.slug}`}
                              target="_blank"
                              className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 dark:border-white/10 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
                              title="View on Public Site"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          )}

                          <button
                            type="button"
                            onClick={() => setDeleteModal({ open: true, story })}
                            className="p-1.5 rounded-lg border border-zinc-200 hover:bg-rose-50 hover:text-rose-600 dark:border-white/10 dark:hover:bg-rose-500/10 text-zinc-400 transition-colors"
                            title="Delete Story"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Table Pagination Bar */}
        <div className="p-4 border-t border-zinc-200/80 dark:border-white/10 flex items-center justify-between text-xs text-zinc-500 font-mono">
          <span>
            Showing {(page - 1) * pagination.limit + 1}–{Math.min(page * pagination.limit, pagination.total || stories.length)} of {pagination.total || stories.length} stories
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-bold">
              {page} / {pagination.totalPages || 1}
            </span>
            <button
              type="button"
              disabled={page >= (pagination.totalPages || 1)}
              onClick={() => setPage((prev) => Math.min(prev + 1, pagination.totalPages || 1))}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 6. PERFORMANCE SNAPSHOT & REGIONAL BUREAUS & ACTIVITY AUDIT (3-Column Layout) */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Column 1: Top Performing Stories */}
        <section className="rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-white/5">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <h3 className="font-display font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wide">
              Top Stories (Live Reads)
            </h3>
          </div>

          <div className="space-y-3">
            {pulseData?.topStories?.map((top, idx) => (
              <div key={top._id} className="flex items-start gap-2.5 text-xs">
                <span className="font-mono font-black text-sm text-zinc-300 dark:text-zinc-700 w-4">
                  0{idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <Link href={`/admin/edit/${top._id}`} className="font-bold text-zinc-900 dark:text-white hover:underline truncate block">
                    {top.title}
                  </Link>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono mt-0.5">
                    <span className="text-emerald-600 font-bold">{top.views || 0} views</span>
                    <span>•</span>
                    <span>{top.primarySection || 'General'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Column 2: Desk & Bureau Coverage Distribution */}
        <section className="rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-white/5">
            <Layers className="w-4 h-4 text-blue-500" />
            <h3 className="font-display font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wide">
              Editorial Desk Distribution
            </h3>
          </div>

          <div className="space-y-3">
            {pulseData?.deskMetrics?.map((d) => (
              <div key={d.desk} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-zinc-700 dark:text-zinc-300 font-bold">{d.desk}</span>
                  <span className="font-mono text-zinc-400 text-[11px]">{d.count} stories</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-600 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(10, (d.count / (pulseData.pulse?.publishedToday + 5)) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Column 3: Recent Editorial Activity Audit Feed */}
        <section className="rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-white/5">
            <Clock className="w-4 h-4 text-zinc-400" />
            <h3 className="font-display font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wide">
              Recent Newsroom Activity
            </h3>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {pulseData?.recentActivity?.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-4">No recent activity recorded.</p>
            ) : (
              pulseData?.recentActivity?.map((act) => (
                <div key={act.id} className="text-xs space-y-0.5 border-b border-zinc-100 dark:border-white/5 pb-2">
                  <p className="text-zinc-700 dark:text-zinc-300">
                    <strong className="text-zinc-900 dark:text-white">{act.actor}</strong>{' '}
                    <span className="capitalize">{act.action}</span>{' '}
                    <Link href={`/admin/edit/${act.postId}`} className="font-bold text-red-600 hover:underline">
                      "{act.postTitle}"
                    </Link>
                  </p>
                  <p className="text-[10px] text-zinc-400 font-mono">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {act.role}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* 7. MODAL: BULK ACTION CONFIRMATION */}
      <AnimatePresence>
        {bulkConfirmModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#12151c] border border-zinc-200 dark:border-white/10 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <h3 className="font-display font-bold text-base text-zinc-900 dark:text-white">
                    {bulkConfirmModal.title}
                  </h3>
                </div>
                <button
                  onClick={() => setBulkConfirmModal({ open: false, action: null, title: '', message: '', targetData: {} })}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {bulkConfirmModal.message}
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBulkConfirmModal({ open: false, action: null, title: '', message: '', targetData: {} })}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBulkAction}
                  disabled={bulkActionSubmitting}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50 flex items-center gap-1.5"
                >
                  {bulkActionSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Confirm Action</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. MODAL: SINGLE DELETE CONFIRMATION */}
      <AnimatePresence>
        {deleteModal.open && deleteModal.story && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#12151c] border border-zinc-200 dark:border-white/10 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                  <h3 className="font-display font-bold text-base text-zinc-900 dark:text-white">
                    Delete Story
                  </h3>
                </div>
                <button onClick={() => setDeleteModal({ open: false, story: null })} className="p-1 text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Are you sure you want to permanently delete <strong>"{deleteModal.story.title}"</strong>? This will remove all revision history and cannot be recovered.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModal({ open: false, story: null })}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider"
                >
                  Delete Story
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
