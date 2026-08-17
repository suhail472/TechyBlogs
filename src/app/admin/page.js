'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Edit,
  Trash2,
  ExternalLink,
  Plus,
  AlertCircle,
  Clock,
  Eye,
  Heart,
  MessageSquare,
  Search,
  Filter,
  FileText,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { postAPI } from '@/services/api';
import useAuthStore from '@/store/useAuthStore';
import StatusBadge from '@/components/admin/StatusBadge';
import EmptyState from '@/components/admin/EmptyState';
import AdminHeader from '@/components/admin/AdminHeader';
import useToastStore from '@/store/useToastStore';

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingCommentsCount, setPendingCommentsCount] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [postsRes, analyticsRes] = await Promise.allSettled([
        postAPI.getAllPosts({ status: 'all', limit: 100 }),
        fetch('/api/admin/analytics').then((r) => r.json()),
      ]);

      if (postsRes.status === 'fulfilled' && postsRes.value?.posts) {
        setBlogs(postsRes.value.posts);
      }

      if (analyticsRes.status === 'fulfilled' && analyticsRes.value?.stats) {
        setPendingCommentsCount(analyticsRes.value.stats.pendingComments || 0);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Permanently delete story "${title}" from the publication?`)) {
      try {
        await postAPI.deletePost(id);
        setBlogs((prev) => prev.filter((b) => b._id !== id));
        addToast('Story deleted successfully', 'info');
      } catch (error) {
        addToast('Failed to delete story: ' + error.message, 'error');
      }
    }
  };

  const filteredBlogs = useMemo(() => {
    return blogs.filter((b) => {
      const matchesFilter =
        activeFilter === 'all'
          ? true
          : (b.status || 'published').toLowerCase() === activeFilter.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        b.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.categories?.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesFilter && matchesSearch;
    });
  }, [blogs, activeFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = blogs.length;
    const published = blogs.filter((b) => !b.status || b.status === 'published').length;
    const drafts = blogs.filter((b) => b.status === 'draft').length;
    const inReview = blogs.filter((b) => b.status === 'in_review').length;
    const scheduled = blogs.filter((b) => b.status === 'scheduled').length;
    const totalViews = blogs.reduce((acc, curr) => acc + (curr.views || 0), 0);

    return { total, published, drafts, inReview, scheduled, totalViews };
  }, [blogs]);

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <AdminHeader
        title={`${greeting}, ${user?.name?.split(' ')[0] || 'Editor'}`}
        breadcrumb={[{ label: 'Workspace Overview' }]}
      />

      {/* Attention Required Tray */}
      {(stats.drafts > 0 || pendingCommentsCount > 0 || stats.inReview > 0) && (
        <section className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 grid sm:grid-cols-3 gap-4 text-xs font-semibold">
          {stats.drafts > 0 && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/60 dark:bg-zinc-800/40">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <FileText className="w-4 h-4 shrink-0" />
                <span>{stats.drafts} Unfinished Drafts</span>
              </div>
              <button
                onClick={() => setActiveFilter('draft')}
                className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-300 hover:underline"
              >
                Inspect →
              </button>
            </div>
          )}

          {pendingCommentsCount > 0 && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/60 dark:bg-zinc-800/40">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span>{pendingCommentsCount} Flagged Comments</span>
              </div>
              <Link
                href="/admin/comments"
                className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-300 hover:underline"
              >
                Moderate →
              </Link>
            </div>
          )}

          {stats.scheduled > 0 && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/60 dark:bg-zinc-800/40">
              <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                <Calendar className="w-4 h-4 shrink-0" />
                <span>{stats.scheduled} Stories Scheduled</span>
              </div>
              <Link
                href="/admin/calendar"
                className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-300 hover:underline"
              >
                Calendar →
              </Link>
            </div>
          )}
        </section>
      )}

      {/* Newsroom Metric Tiles */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-1">
          <span className="text-[10px] uppercase tracking-widest font-black text-zinc-400 font-mono">
            Published Stories
          </span>
          <p className="font-display text-3xl font-black text-zinc-900 dark:text-white">
            {stats.published}
          </p>
          <span className="text-[11px] text-zinc-500 font-medium">Across all editorial desks</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-1">
          <span className="text-[10px] uppercase tracking-widest font-black text-zinc-400 font-mono">
            Total Readers
          </span>
          <p className="font-display text-3xl font-black text-zinc-900 dark:text-white">
            {stats.totalViews >= 1000 ? `${(stats.totalViews / 1000).toFixed(1)}k` : stats.totalViews}
          </p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
            Live article pageviews
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-1">
          <span className="text-[10px] uppercase tracking-widest font-black text-zinc-400 font-mono">
            Active Drafts
          </span>
          <p className="font-display text-3xl font-black text-zinc-900 dark:text-white">
            {stats.drafts}
          </p>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
            In progress / unpublished
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-1">
          <span className="text-[10px] uppercase tracking-widest font-black text-zinc-400 font-mono">
            Scheduled Pipeline
          </span>
          <p className="font-display text-3xl font-black text-zinc-900 dark:text-white">
            {stats.scheduled}
          </p>
          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold">
            Pending calendar release
          </span>
        </div>
      </section>

      {/* Newsroom Stories Table Section */}
      <section className="rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs overflow-hidden">
        {/* Table Filter Strip */}
        <div className="p-4 border-b border-zinc-200/80 dark:border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {['all', 'published', 'draft', 'in_review', 'scheduled'].map((tab) => {
              const active = activeFilter === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                    active
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5'
                  }`}
                >
                  {tab.replace('_', ' ')}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-64">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter stories or author..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/10 outline-none focus:ring-2 focus:ring-red-500/20"
              />
            </div>
          </div>
        </div>

        {/* Stories List / Table */}
        {loading ? (
          <div className="p-12 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredBlogs.length === 0 ? (
          <EmptyState
            title="No newsroom stories found"
            description="No articles match your active filter criteria. Write a new story to populate the publication."
            actionLabel="Create Story"
            actionHref="/admin/create"
            className="m-6"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-200/80 dark:border-white/10 font-mono">
                <tr>
                  <th className="py-3 px-5">Story & Kicker</th>
                  <th className="py-3 px-4">Desk</th>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Performance</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-white/5">
                {filteredBlogs.map((story) => (
                  <tr key={story._id || story.slug} className="hover:bg-zinc-50/70 dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="py-3.5 px-5 max-w-sm">
                      <div className="space-y-0.5">
                        <Link
                          href={`/admin/edit/${story._id || story.slug}`}
                          className="font-bold text-zinc-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 line-clamp-1 transition-colors"
                        >
                          {story.title}
                        </Link>
                        <p className="text-[11px] text-zinc-400 line-clamp-1">
                          {story.subtitle || story.excerpt || 'No dek provided'}
                        </p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                        {story.primarySection?.name || story.categories?.[0] || 'General'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-zinc-700 dark:text-zinc-300">
                      {story.author || 'Editorial Bureau'}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={story.status || 'published'} />
                    </td>

                    <td className="py-3.5 px-4 text-zinc-500 font-mono text-[11px]">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3 text-zinc-400" /> {story.views || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3 text-rose-500" /> {story.likes || 0}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/admin/edit/${story._id || story.slug}`}
                          className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 dark:border-white/10 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
                          title="Edit in Article Studio"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>

                        <Link
                          href={`/blog/${story.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 dark:border-white/10 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
                          title="View on Live Site"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          onClick={() => handleDelete(story._id, story.title)}
                          className="p-1.5 rounded-lg border border-zinc-200 hover:bg-rose-50 hover:text-rose-600 dark:border-white/10 dark:hover:bg-rose-500/10 text-zinc-400 transition-colors"
                          title="Delete Story"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
