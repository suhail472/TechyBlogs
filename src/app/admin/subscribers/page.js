'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Mail,
  Send,
  Download,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Flame,
  Clock,
  Sparkles,
  Layers,
  FileText,
  Smartphone,
  Monitor,
  Eye,
  Trash2,
  ShieldAlert,
  RotateCcw,
  TrendingUp,
  RefreshCw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Tag,
  Check,
  Award,
} from 'lucide-react';
import { subscriberAPI, campaignAPI, postAPI, taxonomyAPI } from '@/services/api';
import useToastStore from '@/store/useToastStore';
import AdminHeader from '@/components/admin/AdminHeader';
import EmptyState from '@/components/admin/EmptyState';

const MAIN_TABS = [
  { id: 'directory', label: 'Audience Directory', icon: Users },
  { id: 'campaigns', label: 'Campaigns & Briefings', icon: Mail },
  { id: 'segments', label: 'Audience Segments', icon: Layers },
  { id: 'conversions', label: 'Conversion Intelligence', icon: TrendingUp },
];

const TEMPLATES = [
  { id: 'morning_brief', label: 'Morning Briefing' },
  { id: 'weekly_digest', label: 'Weekly Digest' },
  { id: 'breaking_alert', label: 'Breaking News Alert' },
  { id: 'kashmir_edition', label: 'Kashmir Edition' },
  { id: 'technology_brief', label: 'Technology Brief' },
];

export default function SubscribersDashboard() {
  const [activeTab, setActiveTab] = useState('directory');
  const [metrics, setMetrics] = useState(null);
  const [growthData, setGrowthData] = useState([]);
  const [growthRange, setGrowthRange] = useState('30d');
  const [desks, setDesks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Audience Directory state
  const [subscribers, setSubscribers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [editionFilter, setEditionFilter] = useState('all');
  const [topicFilter, setTopicFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Campaigns state
  const [campaigns, setCampaigns] = useState([]);
  const [campaignFilter, setCampaignFilter] = useState('all');

  // Conversion state
  const [convertingArticles, setConvertingArticles] = useState([]);

  // Modals & Drawers
  const [composerOpen, setComposerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop' | 'mobile'
  const [previewHtml, setPreviewHtml] = useState('');
  const [testEmailModalOpen, setTestEmailModalOpen] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [selectedCampaignForAction, setSelectedCampaignForAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Article Picker state
  const [publishedPosts, setPublishedPosts] = useState([]);
  const [postSearch, setPostSearch] = useState('');

  // Segment Estimator state
  const [segmentConfig, setSegmentConfig] = useState({
    edition: 'all',
    topics: [],
    minEngagementScore: 0,
  });
  const [segmentEstimate, setSegmentEstimate] = useState(null);

  // New Campaign Form State
  const [campaignForm, setCampaignForm] = useState({
    title: '',
    subject: '',
    previewText: '',
    template: 'morning_brief',
    edition: 'global',
    intro: '',
    closing: '',
    featuredStories: [],
  });

  const { addToast } = useToastStore();

  // Load Desks
  const fetchDesks = useCallback(async () => {
    try {
      const res = await taxonomyAPI.getAll({ kind: 'section' });
      if (res?.data) setDesks(res.data);
    } catch (e) {}
  }, []);

  // Fetch Metrics
  const fetchMetrics = useCallback(async () => {
    try {
      const res = await subscriberAPI.getMetrics();
      if (res.success) setMetrics(res.stats);
    } catch (err) {
      console.warn('Failed to load audience metrics:', err);
    }
  }, []);

  // Fetch Growth Analytics
  const fetchGrowth = useCallback(async () => {
    try {
      const res = await subscriberAPI.getGrowth(growthRange);
      if (res.success) setGrowthData(res.dataPoints || []);
    } catch (err) {
      console.warn('Failed to load growth:', err);
    }
  }, [growthRange]);

  // Fetch Subscribers List
  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 20,
        status: statusFilter,
        edition: editionFilter,
        topic: topicFilter,
        source: sourceFilter,
        sort: sortOption,
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await subscriberAPI.getList(params);
      if (res.success) {
        setSubscribers(res.subscribers || []);
        if (res.pagination) setTotalPages(res.pagination.pages || 1);
      }
    } catch (err) {
      console.error('Failed to load subscribers:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, editionFilter, topicFilter, sourceFilter, searchQuery, sortOption, page]);

  // Fetch Campaigns
  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await campaignAPI.getAll(campaignFilter);
      if (res.success) setCampaigns(res.campaigns || []);
    } catch (err) {
      console.warn('Failed to load campaigns:', err);
    }
  }, [campaignFilter]);

  // Fetch Conversions
  const fetchConversions = useCallback(async () => {
    try {
      const res = await subscriberAPI.getConversions();
      if (res.success) setConvertingArticles(res.articles || []);
    } catch (err) {
      console.warn('Failed to load conversions:', err);
    }
  }, []);

  // Fetch Published Posts for Picker
  const fetchPublishedPosts = useCallback(async () => {
    try {
      const res = await postAPI.getAll({ status: 'published', limit: 20, search: postSearch });
      if (res.data) setPublishedPosts(res.data);
    } catch (err) {}
  }, [postSearch]);

  // Estimate Segment
  const estimateSegment = useCallback(async () => {
    try {
      const res = await campaignAPI.previewSegment(segmentConfig);
      if (res.success) setSegmentEstimate(res);
    } catch (err) {}
  }, [segmentConfig]);

  useEffect(() => {
    fetchDesks();
    fetchMetrics();
    fetchGrowth();
  }, [fetchDesks, fetchMetrics, fetchGrowth]);

  useEffect(() => {
    if (activeTab === 'directory') fetchSubscribers();
    if (activeTab === 'campaigns') fetchCampaigns();
    if (activeTab === 'conversions') fetchConversions();
    if (activeTab === 'segments') estimateSegment();
  }, [activeTab, fetchSubscribers, fetchCampaigns, fetchConversions, estimateSegment]);

  // CSV Export
  const handleExportCSV = () => {
    const url = `/api/admin/subscribers/export?status=${statusFilter}&edition=${editionFilter}&topic=${topicFilter}`;
    window.open(url, '_blank');
    addToast('Subscriber export initiated', 'info');
  };

  // Suppress / Restore / Delete
  const handleSuppress = async (id) => {
    const reason = window.prompt('Enter suppression reason (e.g. bounce, policy violation):');
    if (!reason) return;
    try {
      const res = await subscriberAPI.suppress(id, reason);
      addToast(res.message || 'Subscriber suppressed', 'success');
      fetchSubscribers();
      fetchMetrics();
    } catch (err) {
      addToast(err.message || 'Action failed', 'error');
    }
  };

  const handleRestore = async (id) => {
    try {
      const res = await subscriberAPI.restore(id);
      addToast(res.message || 'Subscriber restored', 'success');
      fetchSubscribers();
      fetchMetrics();
    } catch (err) {
      addToast(err.message || 'Action failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete subscriber record?')) return;
    try {
      const res = await subscriberAPI.deleteSubscriber(id);
      addToast(res.message || 'Subscriber deleted', 'success');
      fetchSubscribers();
      fetchMetrics();
    } catch (err) {
      addToast(err.message || 'Action failed', 'error');
    }
  };

  // Add story to Campaign Form
  const handleAddStoryToCampaign = (post) => {
    if (campaignForm.featuredStories.some((s) => s.post === post._id)) {
      addToast('Story already added to this campaign', 'info');
      return;
    }
    const storyItem = {
      post: post._id,
      headline: post.title,
      excerpt: post.metaDescription || post.summary || '',
      desk: post.primarySection?.name || 'General',
      image: post.image || '',
      url: `https://teachyblogs.com/blogs/${post.slug}`,
    };
    setCampaignForm((prev) => ({
      ...prev,
      featuredStories: [...prev.featuredStories, storyItem],
    }));
    addToast(`Added "${post.title.slice(0, 30)}..." to briefing`, 'success');
  };

  const handleRemoveStoryFromCampaign = (idx) => {
    setCampaignForm((prev) => ({
      ...prev,
      featuredStories: prev.featuredStories.filter((_, i) => i !== idx),
    }));
  };

  // Save Campaign Draft
  const handleSaveCampaign = async (e) => {
    e.preventDefault();
    if (!campaignForm.title || !campaignForm.subject) {
      addToast('Campaign title and subject are required', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const res = await campaignAPI.create({
        ...campaignForm,
        content: {
          intro: campaignForm.intro,
          closing: campaignForm.closing,
          featuredStories: campaignForm.featuredStories,
        },
      });
      if (res.success) {
        addToast('Campaign draft created successfully!', 'success');
        setComposerOpen(false);
        fetchCampaigns();
      }
    } catch (err) {
      addToast(err.message || 'Failed to create campaign', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Live Preview
  const handleOpenPreview = async (campaign) => {
    setSelectedCampaignForAction(campaign);
    try {
      const res = await campaignAPI.test(campaign._id, 'preview@teachyblogs.com');
      if (res.htmlPreview) {
        setPreviewHtml(res.htmlPreview);
        setPreviewOpen(true);
      }
    } catch (err) {
      addToast(err.message || 'Failed to generate preview', 'error');
    }
  };

  // Send Test Email
  const handleSendTest = async (e) => {
    e.preventDefault();
    if (!testEmailAddress || !selectedCampaignForAction) return;
    setActionLoading(true);
    try {
      const res = await campaignAPI.test(selectedCampaignForAction._id, testEmailAddress.trim());
      addToast(res.message || 'Test email dispatched', 'success');
      setTestEmailModalOpen(false);
      setTestEmailAddress('');
    } catch (err) {
      addToast(err.message || 'Test email failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Dispatch Campaign Live
  const handleDispatchCampaign = async (campaign) => {
    if (
      !window.confirm(
        `🚨 CONFIRM SEND: Dispatch "${campaign.title}" to ${campaign.recipientCount || 'all active'} subscribers? This cannot be undone.`
      )
    )
      return;

    setActionLoading(true);
    try {
      const res = await campaignAPI.send(campaign._id);
      addToast(res.message || 'Campaign dispatched!', 'success');
      fetchCampaigns();
      fetchMetrics();
    } catch (err) {
      addToast(err.message || 'Dispatch failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* 1. TOP COMMAND HEADER */}
      <AdminHeader
        title="Audience & Newsletter Operations Center"
        breadcrumb={[{ label: 'Reader Relationships, Editorial Briefings & Conversion Intelligence' }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                fetchPublishedPosts();
                setComposerOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs shadow-red-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Campaign</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors border border-zinc-200 dark:border-white/10"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRefreshing(true);
                fetchMetrics();
                if (activeTab === 'directory') fetchSubscribers();
                if (activeTab === 'campaigns') fetchCampaigns();
              }}
              disabled={refreshing}
              className="p-2 rounded-xl border border-zinc-200/80 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-300"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        }
      />

      {/* 2. LIVE AUDIENCE PULSE STRIP */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Total Audience</span>
          <p className="font-display text-2xl font-black text-zinc-900 dark:text-white">
            {metrics?.totalSubscribers ?? 0}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Active Subscribers</span>
          <p className="font-display text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {metrics?.activeSubscribers ?? 0}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">New This Week</span>
          <p className="font-display text-2xl font-black text-blue-600 dark:text-blue-400">
            +{metrics?.newThisWeek ?? 0}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Unsubscribed</span>
          <p className="font-display text-2xl font-black text-amber-600 dark:text-amber-400">
            {metrics?.unsubscribedCount ?? 0}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Suppressed</span>
          <p className="font-display text-2xl font-black text-rose-600 dark:text-rose-400">
            {metrics?.suppressedCount ?? 0}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Net Growth Rate</span>
          <p className="font-display text-2xl font-black text-purple-600 dark:text-purple-400">
            {metrics?.growthRate ?? '0.0%'}
          </p>
        </div>
      </section>

      {/* 3. WORKSPACE NAVIGATION TABS */}
      <section className="flex items-center gap-1.5 border-b border-zinc-200/80 dark:border-white/10 pb-1 overflow-x-auto no-scrollbar">
        {MAIN_TABS.map((tab) => {
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
      {/* TAB 1: AUDIENCE DIRECTORY & GROWTH */}
      {/* ========================================================================= */}
      {activeTab === 'directory' && (
        <div className="space-y-6">
          {/* Time Series Growth Strip */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-red-600" />
                <h3 className="font-display font-bold text-sm text-zinc-900 dark:text-white">
                  Audience Acquisition & Retention Trends
                </h3>
              </div>

              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-[10px] font-mono font-bold">
                {['7d', '30d', '90d', '12m'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setGrowthRange(r)}
                    className={`px-2 py-0.5 rounded-lg ${
                      growthRange === r ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs' : 'text-zinc-400'
                    }`}
                  >
                    {r.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Growth Mini Data Points Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-white/5">
                <span className="text-[10px] font-mono text-zinc-400 uppercase">Gross Acquisition</span>
                <p className="font-bold text-base text-zinc-900 dark:text-white">
                  +{growthData.reduce((acc, d) => acc + (d.acquisitions || 0), 0)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-white/5">
                <span className="text-[10px] font-mono text-zinc-400 uppercase">Unsubscribes</span>
                <p className="font-bold text-base text-rose-600">
                  -{growthData.reduce((acc, d) => acc + (d.unsubscribes || 0), 0)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-white/5">
                <span className="text-[10px] font-mono text-zinc-400 uppercase">Net Reader Gain</span>
                <p className="font-bold text-base text-emerald-600">
                  +{growthData.reduce((acc, d) => acc + (d.netGrowth || 0), 0)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-white/5">
                <span className="text-[10px] font-mono text-zinc-400 uppercase">Retention Health</span>
                <p className="font-bold text-base text-purple-600">97.4%</p>
              </div>
            </div>
          </div>

          {/* Directory Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 text-xs font-bold outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="unsubscribed">Unsubscribed</option>
                <option value="suppressed">Suppressed</option>
              </select>

              {/* Edition Filter */}
              <select
                value={editionFilter}
                onChange={(e) => {
                  setEditionFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 text-xs font-bold outline-none"
              >
                <option value="all">All Editions</option>
                <option value="global">Global Edition</option>
                <option value="india">India Edition</option>
                <option value="kashmir">Kashmir Edition</option>
              </select>

              {/* Source Filter */}
              <select
                value={sourceFilter}
                onChange={(e) => {
                  setSourceFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 text-xs font-bold outline-none"
              >
                <option value="all">All Acquisition Sources</option>
                <option value="homepage">Homepage Hero</option>
                <option value="article">Article Footer</option>
                <option value="kashmir_hub">Kashmir Hub</option>
                <option value="import">CSV Import</option>
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
                placeholder="Search by email..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 outline-none focus:ring-2 focus:ring-red-500/20"
              />
            </div>
          </div>

          {/* Directory Table */}
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 bg-zinc-100 dark:bg-zinc-800/40 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : subscribers.length === 0 ? (
            <EmptyState
              title="No subscribers found"
              description="No subscribers matched your current status, edition, or search criteria."
              className="my-12"
            />
          ) : (
            <div className="bg-white dark:bg-[#12151c] rounded-2xl border border-zinc-200/80 dark:border-white/10 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200/80 dark:border-white/10 font-mono text-[10px] text-zinc-400 uppercase">
                    <tr>
                      <th className="px-5 py-3 font-bold">Subscriber</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                      <th className="px-4 py-3 font-bold">Edition & Topics</th>
                      <th className="px-4 py-3 font-bold">Source</th>
                      <th className="px-4 py-3 font-bold">Engagement</th>
                      <th className="px-4 py-3 font-bold">Joined</th>
                      <th className="px-5 py-3 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                    {subscribers.map((sub) => (
                      <tr key={sub._id} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3 font-bold text-zinc-900 dark:text-white">
                          <span>{sub.email}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                              sub.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : sub.status === 'unsubscribed'
                                ? 'bg-amber-500/10 text-amber-600'
                                : 'bg-rose-500/10 text-rose-600'
                            }`}
                          >
                            {sub.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 space-x-1">
                          <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold capitalize">
                            {sub.preferences?.edition || 'global'}
                          </span>
                          {sub.preferences?.topics?.slice(0, 2).map((t) => (
                            <span key={t} className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[10px]">
                              {t}
                            </span>
                          ))}
                        </td>
                        <td className="px-4 py-3 text-zinc-500 capitalize">
                          {sub.sourceArticle ? (
                            <span title={sub.sourceArticle.title} className="text-red-600 font-bold">
                              Article Lead
                            </span>
                          ) : (
                            sub.source || 'homepage'
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${sub.engagementScore || 50}%` }}
                              />
                            </div>
                            <span className="font-mono text-[10px] text-zinc-400">{sub.engagementScore || 50}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-zinc-400 font-mono text-[11px]">
                          {new Date(sub.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3 text-right space-x-2">
                          {sub.status === 'active' ? (
                            <button
                              type="button"
                              onClick={() => handleSuppress(sub._id)}
                              className="text-[11px] font-bold text-rose-600 hover:underline"
                            >
                              Suppress
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRestore(sub._id)}
                              className="text-[11px] font-bold text-emerald-600 hover:underline"
                            >
                              Restore
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(sub._id)}
                            className="text-zinc-400 hover:text-rose-600"
                            title="Delete record"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between text-xs text-zinc-500">
                  <span>Page {page} of {totalPages}</span>
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
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CAMPAIGNS & BRIEFINGS */}
      {/* ========================================================================= */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {['all', 'draft', 'scheduled', 'sent'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setCampaignFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize ${
                    campaignFilter === st
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                      : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {campaigns.length === 0 ? (
            <EmptyState
              title="No campaigns found"
              description="Create a new Morning Briefing or Weekly Digest to engage your subscribers."
              className="my-12"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaigns.map((camp) => (
                <div
                  key={camp._id}
                  className="p-5 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-display font-bold text-sm text-zinc-900 dark:text-white">
                          {camp.title}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-mono font-bold capitalize">
                          {camp.edition}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1 font-mono">
                        Subject: "{camp.subject}"
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                        camp.status === 'sent'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : camp.status === 'scheduled'
                          ? 'bg-blue-500/10 text-blue-600'
                          : 'bg-amber-500/10 text-amber-600'
                      }`}
                    >
                      {camp.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-zinc-100 dark:border-white/5 text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-400 font-mono">Stories</span>
                      <p className="font-bold text-zinc-900 dark:text-white">
                        {camp.content?.featuredStories?.length || 0}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 font-mono">Recipients</span>
                      <p className="font-bold text-zinc-900 dark:text-white">
                        {camp.recipientCount || 0}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 font-mono">Created</span>
                      <p className="font-mono text-[11px] text-zinc-500">
                        {new Date(camp.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenPreview(camp)}
                        className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCampaignForAction(camp);
                          setTestEmailModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Test Send</span>
                      </button>
                    </div>

                    {camp.status !== 'sent' && (
                      <button
                        type="button"
                        onClick={() => handleDispatchCampaign(camp)}
                        disabled={actionLoading}
                        className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs shadow-red-600/20"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Dispatch Now</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AUDIENCE SEGMENTS */}
      {/* ========================================================================= */}
      {activeTab === 'segments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 space-y-5">
            <div>
              <h3 className="font-display font-bold text-base text-zinc-900 dark:text-white">
                Live Audience Segment Builder
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Configure targeted criteria to evaluate deliverable audience size.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">
                  Target Publication Edition
                </label>
                <div className="flex items-center gap-2">
                  {['all', 'global', 'india', 'kashmir'].map((ed) => (
                    <button
                      key={ed}
                      type="button"
                      onClick={() => setSegmentConfig((prev) => ({ ...prev, edition: ed }))}
                      className={`px-3.5 py-2 rounded-xl font-bold capitalize border ${
                        segmentConfig.edition === ed
                          ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent'
                          : 'border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {ed}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">
                  Topic & Desk Affinity
                </label>
                <div className="flex flex-wrap gap-2">
                  {desks.map((d) => {
                    const isSelected = segmentConfig.topics.includes(d.name);
                    return (
                      <button
                        key={d._id}
                        type="button"
                        onClick={() => {
                          setSegmentConfig((prev) => ({
                            ...prev,
                            topics: isSelected
                              ? prev.topics.filter((t) => t !== d.name)
                              : [...prev.topics, d.name],
                          }));
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-colors ${
                          isSelected
                            ? 'bg-red-600 text-white border-red-600'
                            : 'border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {d.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">
                  Minimum Engagement Score ({segmentConfig.minEngagementScore}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="90"
                  step="10"
                  value={segmentConfig.minEngagementScore}
                  onChange={(e) =>
                    setSegmentConfig((prev) => ({
                      ...prev,
                      minEngagementScore: parseInt(e.target.value, 10),
                    }))
                  }
                  className="w-full accent-red-600"
                />
              </div>
            </div>
          </div>

          {/* Real-Time Audience Estimation Card */}
          <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/10 space-y-4">
            <h4 className="font-display font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider">
              Server Calculated Audience
            </h4>

            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-xl bg-white dark:bg-[#12151c] border border-zinc-200 dark:border-white/10">
                <span className="text-[10px] font-mono text-zinc-400 uppercase">Deliverable Recipients</span>
                <p className="font-display text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {segmentEstimate?.recipientCount ?? metrics?.activeSubscribers ?? 0}
                </p>
                <span className="text-[10px] text-zinc-400">Active, non-suppressed subscribers</span>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-[#12151c] border border-zinc-200 dark:border-white/10">
                <span className="text-[10px] font-mono text-zinc-400 uppercase">Excluded From Send</span>
                <p className="font-display text-2xl font-black text-rose-600 mt-1">
                  {segmentEstimate?.suppressedCount ?? metrics?.suppressedCount ?? 0}
                </p>
                <span className="text-[10px] text-zinc-400">Unsubscribed, bounced, or suppressed</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CONVERSION INTELLIGENCE */}
      {/* ========================================================================= */}
      {activeTab === 'conversions' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 space-y-1">
            <h3 className="font-display font-bold text-sm text-zinc-900 dark:text-white">
              Top Subscriber-Converting Articles
            </h3>
            <p className="text-xs text-zinc-500">
              Identifies which published editorial stories drive reader subscriptions.
            </p>
          </div>

          {convertingArticles.length === 0 ? (
            <EmptyState
              title="No conversion attribution yet"
              description="Reader subscriptions will be tracked and attributed to articles as readers sign up from article pages."
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
                    <th className="px-5 py-3 font-bold text-right">Subscriptions Attributed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                  {convertingArticles.map((art, idx) => (
                    <tr key={art.postId || idx} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.02]">
                      <td className="px-5 py-3 font-bold text-zinc-900 dark:text-white">
                        <Link href={`/blogs/${art.slug}`} target="_blank" className="hover:text-red-600">
                          {art.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold">
                          {art.desk}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500">{art.author}</td>
                      <td className="px-5 py-3 text-right font-display font-black text-sm text-emerald-600">
                        +{art.subscriptions}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CAMPAIGN COMPOSER & ARTICLE PICKER */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {composerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#12151c] border border-zinc-200 dark:border-white/10 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-red-600" />
                  <h3 className="font-display font-bold text-lg text-zinc-900 dark:text-white">
                    Compose Newsletter Campaign
                  </h3>
                </div>
                <button onClick={() => setComposerOpen(false)} className="p-1 text-zinc-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCampaign} className="space-y-5 text-xs font-sans">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-mono font-bold text-[10px] text-zinc-400 uppercase block">Internal Title</label>
                    <input
                      type="text"
                      value={campaignForm.title}
                      onChange={(e) => setCampaignForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="e.g. Tuesday Morning Briefing — Aug 18"
                      className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-mono font-bold text-[10px] text-zinc-400 uppercase block">Subject Line</label>
                    <input
                      type="text"
                      value={campaignForm.subject}
                      onChange={(e) => setCampaignForm((p) => ({ ...p, subject: e.target.value }))}
                      placeholder="e.g. Inside the New AI Paradigm & Regional Education Shifts"
                      className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-mono font-bold text-[10px] text-zinc-400 uppercase block">Template</label>
                    <select
                      value={campaignForm.template}
                      onChange={(e) => setCampaignForm((p) => ({ ...p, template: e.target.value }))}
                      className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 outline-none"
                    >
                      {TEMPLATES.map((t) => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-mono font-bold text-[10px] text-zinc-400 uppercase block">Target Edition</label>
                    <select
                      value={campaignForm.edition}
                      onChange={(e) => setCampaignForm((p) => ({ ...p, edition: e.target.value }))}
                      className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 outline-none"
                    >
                      <option value="global">Global Edition</option>
                      <option value="india">India Edition</option>
                      <option value="kashmir">Kashmir Edition</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-mono font-bold text-[10px] text-zinc-400 uppercase block">Preheader Preview</label>
                    <input
                      type="text"
                      value={campaignForm.previewText}
                      onChange={(e) => setCampaignForm((p) => ({ ...p, previewText: e.target.value }))}
                      placeholder="Short preview text for inbox..."
                      className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-mono font-bold text-[10px] text-zinc-400 uppercase block">Editorial Intro Note</label>
                  <textarea
                    rows={2}
                    value={campaignForm.intro}
                    onChange={(e) => setCampaignForm((p) => ({ ...p, intro: e.target.value }))}
                    placeholder="Good morning readers. Today’s lead coverage explores..."
                    className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 outline-none"
                  />
                </div>

                {/* Published Stories Picker Section */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-zinc-900 dark:text-white uppercase tracking-wider">
                      Featured Stories in this Edition ({campaignForm.featuredStories.length})
                    </h4>
                  </div>

                  {campaignForm.featuredStories.map((story, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#12151c] border border-zinc-200 dark:border-white/10 text-xs"
                    >
                      <div className="min-w-0 pr-3">
                        <span className="font-bold text-zinc-900 dark:text-white truncate block">{story.headline}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">{story.desk}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveStoryFromCampaign(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* Search and add stories */}
                  <div className="pt-2">
                    <span className="text-[10px] font-mono text-zinc-400 block mb-1.5">Pick from Published Articles</span>
                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                      {publishedPosts.map((post) => (
                        <div
                          key={post._id}
                          className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#12151c] border border-zinc-200 dark:border-white/5 hover:border-red-500/30 text-xs cursor-pointer"
                          onClick={() => handleAddStoryToCampaign(post)}
                        >
                          <span className="truncate max-w-md font-bold text-zinc-800 dark:text-zinc-200">{post.title}</span>
                          <button
                            type="button"
                            className="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-700 dark:text-zinc-300"
                          >
                            + Add
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setComposerOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                  >
                    {actionLoading ? 'Saving...' : 'Save Campaign Draft'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: LIVE MULTI-DEVICE PREVIEW */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {previewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#12151c] border border-zinc-200 dark:border-white/10 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <Eye className="w-4 h-4 text-red-600" />
                  <h4 className="font-display font-bold text-sm text-zinc-900 dark:text-white">
                    Live Newsletter Email Preview
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setPreviewDevice('desktop')}
                      className={`p-1.5 rounded-lg ${previewDevice === 'desktop' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs' : 'text-zinc-400'}`}
                      title="Desktop View (600px)"
                    >
                      <Monitor className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice('mobile')}
                      className={`p-1.5 rounded-lg ${previewDevice === 'mobile' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs' : 'text-zinc-400'}`}
                      title="Mobile View (375px)"
                    >
                      <Smartphone className="w-4 h-4" />
                    </button>
                  </div>
                  <button onClick={() => setPreviewOpen(false)} className="p-1.5 text-zinc-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 p-6 bg-zinc-100 dark:bg-zinc-950 overflow-y-auto flex justify-center">
                <div
                  className="bg-white rounded-xl shadow-lg overflow-hidden transition-all"
                  style={{ width: previewDevice === 'mobile' ? '375px' : '600px' }}
                >
                  <iframe
                    srcDoc={previewHtml}
                    title="Newsletter Preview"
                    className="w-full min-h-[600px] border-0"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: TEST EMAIL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {testEmailModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#12151c] border border-zinc-200 dark:border-white/10 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-red-600" />
                  <h4 className="font-display font-bold text-sm text-zinc-900 dark:text-white">
                    Send Campaign Test Email
                  </h4>
                </div>
                <button onClick={() => setTestEmailModalOpen(false)} className="p-1 text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-500">
                Dispatch a rendered preview of "{selectedCampaignForAction?.title}" to an explicit test inbox.
              </p>

              <form onSubmit={handleSendTest} className="space-y-4 text-xs font-sans">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block">Recipient Email</label>
                  <input
                    type="email"
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    placeholder="editor@teachyblogs.com"
                    className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 outline-none"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setTestEmailModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                  >
                    {actionLoading ? 'Sending...' : 'Send Test'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
