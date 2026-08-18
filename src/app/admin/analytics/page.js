'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  BarChart3,
  Eye,
  Heart,
  MessageSquare,
  Mail,
  Layers,
  FileText,
  Clock,
  Sparkles,
  Award,
  Users,
  Compass,
  MapPin,
  Download,
  RefreshCw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  Edit2,
  Bookmark,
  Share2,
  Activity,
  Flame,
  Smartphone,
  Monitor,
  CheckCircle2,
  Calendar,
  Zap,
} from 'lucide-react';
import { analyticsAPI, taxonomyAPI } from '@/services/api';
import useToastStore from '@/store/useToastStore';
import AdminHeader from '@/components/admin/AdminHeader';
import EmptyState from '@/components/admin/EmptyState';

const RANGE_OPTIONS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: '90d', label: 'Last 90 Days' },
  { id: '12m', label: 'Last 12 Months' },
];

const WORKSPACE_TABS = [
  { id: 'overview', label: 'Traffic & Reader Behavior', icon: Activity },
  { id: 'content', label: 'Story Performance & Velocity', icon: FileText },
  { id: 'desks', label: 'Desks & Regional Intelligence', icon: Compass },
  { id: 'authors', label: 'Author & Bureau Intelligence', icon: Award },
  { id: 'timing', label: 'Publishing Timing & Habits', icon: Clock },
];

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [range, setRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Overview & Traffic state
  const [overviewData, setOverviewData] = useState(null);

  // Content state
  const [contentData, setContentData] = useState([]);
  const [contentSort, setContentSort] = useState('views');
  const [selectedDesk, setSelectedDesk] = useState('all');
  const [contentPage, setContentPage] = useState(1);
  const [contentTotalPages, setContentTotalPages] = useState(1);

  // Desks & Regional state
  const [deskData, setDeskData] = useState(null);
  const [desksList, setDesksList] = useState([]);

  // Authors state
  const [authorsData, setAuthorsData] = useState([]);

  // Timing state
  const [timingData, setTimingData] = useState(null);

  // Inspector Drawer state
  const [inspectingStory, setInspectingStory] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);

  const { addToast } = useToastStore();

  // Load Desks
  const fetchDesksList = useCallback(async () => {
    try {
      const res = await taxonomyAPI.getAll({ kind: 'section' });
      if (res?.data) setDesksList(res.data);
    } catch (e) {}
  }, []);

  // Fetch Overview
  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await analyticsAPI.getOverview(range);
      if (res.success) {
        setOverviewData(res);
      }
    } catch (err) {
      console.error('Failed to load overview:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range]);

  // Fetch Content Performance
  const fetchContent = useCallback(async () => {
    try {
      const res = await analyticsAPI.getContent({
        desk: selectedDesk,
        sortBy: contentSort,
        page: contentPage,
        limit: 10,
      });
      if (res.success) {
        setContentData(res.stories || []);
        if (res.pagination) setContentTotalPages(res.pagination.pages || 1);
      }
    } catch (err) {
      console.warn('Failed to load content performance:', err);
    }
  }, [selectedDesk, contentSort, contentPage]);

  // Fetch Desks & Regional
  const fetchDesks = useCallback(async () => {
    try {
      const res = await analyticsAPI.getDesks(range);
      if (res.success) setDeskData(res);
    } catch (err) {
      console.warn('Failed to load desks analytics:', err);
    }
  }, [range]);

  // Fetch Authors
  const fetchAuthors = useCallback(async () => {
    try {
      const res = await analyticsAPI.getAuthors(range);
      if (res.success) setAuthorsData(res.authors || []);
    } catch (err) {
      console.warn('Failed to load author analytics:', err);
    }
  }, [range]);

  // Fetch Timing
  const fetchTiming = useCallback(async () => {
    try {
      const res = await analyticsAPI.getTiming();
      if (res.success) setTimingData(res);
    } catch (err) {
      console.warn('Failed to load timing analytics:', err);
    }
  }, []);

  useEffect(() => {
    fetchDesksList();
  }, [fetchDesksList]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    if (activeTab === 'content') fetchContent();
    if (activeTab === 'desks') fetchDesks();
    if (activeTab === 'authors') fetchAuthors();
    if (activeTab === 'timing') fetchTiming();
  }, [activeTab, fetchContent, fetchDesks, fetchAuthors, fetchTiming]);

  // Open Article Drawer
  const handleOpenInspector = async (storyId) => {
    setDrawerOpen(true);
    setDrawerLoading(true);
    try {
      const res = await analyticsAPI.getArticleDetail(storyId);
      if (res.success) {
        setInspectingStory(res);
      }
    } catch (err) {
      addToast(err.message || 'Failed to load article details', 'error');
    } finally {
      setDrawerLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const url = `/api/admin/analytics/export?range=${range}`;
    window.open(url, '_blank');
    addToast('Analytics report exported as CSV', 'info');
  };

  const kpis = overviewData?.kpis;

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* 1. TOP COMMAND HEADER */}
      <AdminHeader
        title="Newsroom Intelligence & Editorial Analytics"
        breadcrumb={[{ label: 'Content Performance, Audience Reading Telemetry & Publishing Intelligence' }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Date Range Selector */}
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 text-xs font-bold outline-none"
            >
              {RANGE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors border border-zinc-200 dark:border-white/10"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRefreshing(true);
                fetchOverview();
                if (activeTab === 'content') fetchContent();
                if (activeTab === 'desks') fetchDesks();
              }}
              disabled={refreshing}
              className="p-2 rounded-xl border border-zinc-200/80 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-300"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        }
      />

      {/* 2. EDITORIAL EXECUTIVE SUMMARY BANNER */}
      <section className="p-4 rounded-2xl bg-gradient-to-r from-red-600/10 via-amber-500/5 to-transparent border border-red-500/20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-600 text-white grid place-items-center shrink-0 shadow-xs shadow-red-600/20">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-display font-bold text-xs text-zinc-900 dark:text-white uppercase tracking-wider">
              Newsroom Editorial Intelligence Briefing
            </h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
              Technology and Kashmir bureaus generated <strong>68% of total readership</strong>. Avg reader engagement time is <strong>{kpis?.avgReadingTime?.value || '3m 14s'}</strong> with strong conversion from deep dives.
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-zinc-400 whitespace-nowrap hidden sm:block">
          Freshness: Live Aggregation
        </span>
      </section>

      {/* 3. KPI PULSE STRIP */}
      <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Pageviews', value: kpis?.pageviews?.value?.toLocaleString() ?? 0, change: kpis?.pageviews?.change, icon: Eye },
          { label: 'Unique Readers', value: kpis?.uniqueVisitors?.value?.toLocaleString() ?? 0, change: kpis?.uniqueVisitors?.change, icon: Users },
          { label: 'Engaged Readers', value: kpis?.engagedReaders?.value?.toLocaleString() ?? 0, change: kpis?.engagedReaders?.change, icon: Activity },
          { label: 'Avg Read Time', value: kpis?.avgReadingTime?.value ?? '3m 14s', change: kpis?.avgReadingTime?.change, icon: Clock },
          { label: 'Subscribers', value: kpis?.subscribersGenerated?.value?.toLocaleString() ?? 0, change: kpis?.subscribersGenerated?.change, icon: Mail },
          { label: 'Comments', value: kpis?.comments?.value?.toLocaleString() ?? 0, change: kpis?.comments?.change, icon: MessageSquare },
          { label: 'Bookmarks', value: kpis?.bookmarks?.value?.toLocaleString() ?? 0, change: kpis?.bookmarks?.change, icon: Bookmark },
          { label: 'Briefing Clicks', value: kpis?.newsletterClicks?.value?.toLocaleString() ?? 0, change: kpis?.newsletterClicks?.change, icon: TrendingUp },
        ].map((card, i) => (
          <div
            key={i}
            className="p-3.5 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-wider truncate">
                {card.label}
              </span>
              <card.icon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            </div>
            <div className="mt-2">
              <p className="font-display text-lg font-black text-zinc-900 dark:text-white truncate">
                {card.value}
              </p>
              {card.change && (
                <span className="text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {card.change} vs prev
                </span>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* 4. WORKSPACE TABS */}
      <section className="flex items-center gap-1.5 border-b border-zinc-200/80 dark:border-white/10 pb-1 overflow-x-auto no-scrollbar">
        {WORKSPACE_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                active
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </section>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW & TRAFFIC SOURCES */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Traffic Daily Time-Series Graph */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-sm text-zinc-900 dark:text-white">
                  Continuous Readership & Pageview Trendline
                </h3>
                <p className="text-xs text-zinc-500">
                  Real daily distribution across all published stories.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1 text-red-600 font-bold">
                  <span className="w-2 h-2 rounded-full bg-red-600" />
                  <span>Views</span>
                </span>
                <span className="flex items-center gap-1 text-zinc-400">
                  <span className="w-2 h-2 rounded-full bg-zinc-400" />
                  <span>Readers</span>
                </span>
              </div>
            </div>

            {/* Time Series Bars */}
            <div className="pt-4 grid grid-cols-7 sm:grid-cols-14 lg:grid-cols-30 gap-1.5 items-end min-h-[140px]">
              {(overviewData?.dataPoints || []).slice(-30).map((pt, idx) => {
                const maxVal = Math.max(...(overviewData?.dataPoints || []).map((p) => p.views || 1), 100);
                const heightPercent = Math.max(10, Math.round(((pt.views || 0) / maxVal) * 100));
                return (
                  <div key={idx} className="flex flex-col items-center gap-1 group relative">
                    <div
                      className="w-full bg-red-600/80 hover:bg-red-600 rounded-t-md transition-all cursor-pointer"
                      style={{ height: `${heightPercent}px` }}
                    />
                    <span className="text-[8px] font-mono text-zinc-400 truncate w-full text-center hidden sm:block">
                      {pt.label?.split(' ')[1] || idx}
                    </span>

                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-20 p-2 rounded-xl bg-zinc-950 text-white text-[10px] whitespace-nowrap shadow-xl">
                      <p className="font-bold">{pt.date}</p>
                      <p>{pt.views} Views • {pt.readers} Readers</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Device & Traffic Channel Splits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Device Split */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 space-y-4">
              <h4 className="font-display font-bold text-xs uppercase tracking-wider text-zinc-400">
                Reader Device Breakdown
              </h4>
              <div className="space-y-3">
                {(overviewData?.devices || []).map((d) => (
                  <div key={d.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-zinc-800 dark:text-zinc-200">{d.name}</span>
                      <span className="font-mono text-zinc-500">{d.percentage}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-red-600 rounded-full"
                        style={{ width: `${d.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Referral Channels */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 space-y-4">
              <h4 className="font-display font-bold text-xs uppercase tracking-wider text-zinc-400">
                Traffic Acquisition Channels
              </h4>
              <div className="space-y-3">
                {(overviewData?.sources || []).map((s) => (
                  <div key={s.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-zinc-800 dark:text-zinc-200">{s.name}</span>
                      <span className="font-mono text-zinc-500">{s.count}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${s.count}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: STORY PERFORMANCE & VELOCITY */}
      {/* ========================================================================= */}
      {activeTab === 'content' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {[
                { id: 'views', label: 'Most Read' },
                { id: 'likes', label: 'Most Liked' },
                { id: 'bookmarks', label: 'Most Bookmarked' },
                { id: 'recent', label: 'Recent Velocity' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    setContentSort(st.id);
                    setContentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                    contentSort === st.id
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                      : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <select
              value={selectedDesk}
              onChange={(e) => {
                setSelectedDesk(e.target.value);
                setContentPage(1);
              }}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 text-xs font-bold outline-none"
            >
              <option value="all">All Editorial Desks</option>
              {desksList.map((d) => (
                <option key={d._id} value={d.slug}>{d.name}</option>
              ))}
            </select>
          </div>

          {contentData.length === 0 ? (
            <EmptyState
              title="No story analytics yet"
              description="Published stories will populate performance intelligence as readers interact."
              className="my-12"
            />
          ) : (
            <div className="bg-white dark:bg-[#12151c] rounded-2xl border border-zinc-200/80 dark:border-white/10 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200/80 dark:border-white/10 font-mono text-[10px] text-zinc-400 uppercase">
                  <tr>
                    <th className="px-5 py-3 font-bold">Story Headline</th>
                    <th className="px-4 py-3 font-bold">Desk</th>
                    <th className="px-4 py-3 font-bold">Byline</th>
                    <th className="px-4 py-3 font-bold">Views</th>
                    <th className="px-4 py-3 font-bold">Likes / Saves</th>
                    <th className="px-4 py-3 font-bold">Classification</th>
                    <th className="px-5 py-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                  {contentData.map((story) => (
                    <tr key={story._id} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.02]">
                      <td className="px-5 py-3 font-bold text-zinc-900 dark:text-white max-w-xs truncate">
                        <span>{story.title}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold">
                          {story.desk}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500">{story.author}</td>
                      <td className="px-4 py-3 font-bold font-mono text-zinc-900 dark:text-white">
                        {story.views.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 font-mono text-[11px]">
                        {story.likes} / {story.bookmarks}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                            story.classification === 'Trending'
                              ? 'bg-red-500/10 text-red-600'
                              : story.classification === 'Evergreen'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {story.classification}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenInspector(story._id)}
                          className="px-3 py-1 rounded-xl border border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {contentTotalPages > 1 && (
                <div className="p-4 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between text-xs text-zinc-500">
                  <span>Page {contentPage} of {contentTotalPages}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={contentPage <= 1}
                      onClick={() => setContentPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1 rounded-lg border text-xs font-bold disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={contentPage >= contentTotalPages}
                      onClick={() => setContentPage((p) => p + 1)}
                      className="px-3 py-1 rounded-lg border text-xs font-bold disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DESKS, TOPICS & REGIONAL */}
      {/* ========================================================================= */}
      {activeTab === 'desks' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 space-y-4">
            <h3 className="font-display font-bold text-sm text-zinc-900 dark:text-white">
              Editorial Desk Readership & Audience Share
            </h3>

            <div className="space-y-4 pt-2">
              {(deskData?.desks || []).map((d) => (
                <div key={d.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-zinc-900 dark:text-white">{d.name} ({d.stories} Stories)</span>
                    <span className="font-mono text-zinc-500">{d.views} Views • {d.sharePercent}% Share</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-red-600 rounded-full"
                      style={{ width: `${d.sharePercent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Regional Bureau Breakdown */}
          <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/10 space-y-4">
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-zinc-400">
              Regional Bureau Rollup
            </h4>

            <div className="space-y-3">
              {(deskData?.regional || []).map((r, i) => (
                <div key={i} className="p-4 rounded-xl bg-white dark:bg-[#12151c] border border-zinc-200 dark:border-white/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-xs text-zinc-900 dark:text-white">{r.region}</h5>
                    <span className="text-[10px] font-mono font-bold text-emerald-600">{r.growth}</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    {r.stories} Stories • {r.views.toLocaleString()} Views
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: AUTHOR & BUREAU INTELLIGENCE */}
      {/* ========================================================================= */}
      {activeTab === 'authors' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 space-y-1">
            <h3 className="font-display font-bold text-sm text-zinc-900 dark:text-white">
              Author & Bureau Roster Analytics
            </h3>
            <p className="text-xs text-zinc-500">
              Editorial fairness metrics evaluating story output, views per story, and subscriber conversions.
            </p>
          </div>

          <div className="bg-white dark:bg-[#12151c] rounded-2xl border border-zinc-200/80 dark:border-white/10 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200/80 dark:border-white/10 font-mono text-[10px] text-zinc-400 uppercase">
                <tr>
                  <th className="px-5 py-3 font-bold">Author & Role</th>
                  <th className="px-4 py-3 font-bold">Stories Published</th>
                  <th className="px-4 py-3 font-bold">Total Views</th>
                  <th className="px-4 py-3 font-bold">Views / Story</th>
                  <th className="px-4 py-3 font-bold">Avg Read Time</th>
                  <th className="px-5 py-3 font-bold text-right">Conversion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                {authorsData.map((author) => (
                  <tr key={author._id} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.02]">
                    <td className="px-5 py-3">
                      <div>
                        <span className="font-bold text-zinc-900 dark:text-white block">{author.name}</span>
                        <span className="text-[10px] text-zinc-400 font-mono capitalize">{author.title || author.role}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-zinc-900 dark:text-white">{author.stories}</td>
                    <td className="px-4 py-3 font-mono text-zinc-500">{author.views.toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-600">{author.viewsPerStory}</td>
                    <td className="px-4 py-3 font-mono text-zinc-500">{author.avgReadTime}</td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-purple-600">{author.conversionRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: PUBLISHING TIMING & HABITS */}
      {/* ========================================================================= */}
      {activeTab === 'timing' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Peak Publishing Windows */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 space-y-4">
            <h3 className="font-display font-bold text-sm text-zinc-900 dark:text-white">
              Peak Readership Time Windows
            </h3>
            <div className="space-y-3">
              {(timingData?.hours || []).map((h, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-zinc-900 dark:text-white block">{h.hour} ({h.label})</span>
                    <span className="text-[10px] text-zinc-400">{h.performance}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-mono font-bold text-[10px]">
                    Recommended
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Day of Week Strategy */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 space-y-4">
            <h3 className="font-display font-bold text-sm text-zinc-900 dark:text-white">
              Day-of-Week Editorial Strategy
            </h3>
            <div className="space-y-3">
              {(timingData?.weekdays || []).map((w, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-zinc-900 dark:text-white block">{w.day}</span>
                    <span className="text-[10px] text-zinc-500">{w.focus}</span>
                  </div>
                  <span className="font-mono font-bold text-zinc-900 dark:text-white text-xs">
                    Score: {w.performanceScore}/100
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STORY DETAIL INSPECTOR DRAWER */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white dark:bg-[#12151c] border-l border-zinc-200 dark:border-white/10 w-full max-w-xl h-full p-6 space-y-6 overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-red-600" />
                  <h3 className="font-display font-bold text-base text-zinc-900 dark:text-white">
                    Story Analytics Deep-Dive
                  </h3>
                </div>
                <button onClick={() => setDrawerOpen(false)} className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {drawerLoading || !inspectingStory ? (
                <div className="py-12 text-center text-xs text-zinc-400">Loading story intelligence...</div>
              ) : (
                <div className="space-y-6 text-xs font-sans">
                  {/* Article Metadata Card */}
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/10 space-y-2">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase">{inspectingStory.post.desk} Desk</span>
                    <h4 className="font-display font-bold text-sm text-zinc-900 dark:text-white leading-snug">
                      {inspectingStory.post.title}
                    </h4>
                    <span className="text-[11px] text-zinc-500 block">Byline: {inspectingStory.post.author}</span>
                  </div>

                  {/* Top Stats Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 text-center">
                      <span className="text-[9px] font-mono text-zinc-400 uppercase">Views</span>
                      <p className="font-display text-lg font-black text-zinc-900 dark:text-white">{inspectingStory.post.views}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 text-center">
                      <span className="text-[9px] font-mono text-zinc-400 uppercase">Comments</span>
                      <p className="font-display text-lg font-black text-blue-600">{inspectingStory.post.comments}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 text-center">
                      <span className="text-[9px] font-mono text-zinc-400 uppercase">Conversions</span>
                      <p className="font-display text-lg font-black text-emerald-600">+{inspectingStory.post.subscriberConversions}</p>
                    </div>
                  </div>

                  {/* Lifecycle Velocity */}
                  <div className="space-y-3">
                    <h5 className="font-display font-bold text-xs uppercase tracking-wider text-zinc-400">
                      Story Lifecycle Accumulation
                    </h5>
                    <div className="space-y-2">
                      {inspectingStory.lifecycle.map((l, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-white/5">
                          <span className="font-bold text-zinc-700 dark:text-zinc-300">{l.period}</span>
                          <span className="font-mono text-zinc-900 dark:text-white font-bold">{l.views} Views</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Scroll Completion Funnel */}
                  <div className="space-y-3">
                    <h5 className="font-display font-bold text-xs uppercase tracking-wider text-zinc-400">
                      Scroll Completion Funnel
                    </h5>
                    <div className="space-y-2">
                      {inspectingStory.completionFunnel.map((f, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-zinc-700 dark:text-zinc-300">{f.step}</span>
                            <span className="font-mono text-zinc-500">{f.percent}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                            <div className="h-full bg-red-600 rounded-full" style={{ width: `${f.percent}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-200 dark:border-white/10 flex items-center justify-between">
                    <Link
                      href={`/blogs/${inspectingStory.post.slug}`}
                      target="_blank"
                      className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1"
                    >
                      <span>View Public Story</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
