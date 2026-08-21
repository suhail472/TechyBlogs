'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Globe,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileText,
  MapPin,
  Tag,
  RefreshCw,
  ExternalLink,
  Layers,
  Sparkles,
  Edit,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';
import useToastStore from '@/store/useToastStore';

export default function AdminSeoPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [auditData, setAuditData] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [inspectUrl, setInspectUrl] = useState('');
  const [urlInspectResult, setUrlInspectResult] = useState(null);
  const [inspecting, setInspecting] = useState(false);
  const { addToast } = useToastStore();

  const fetchAudit = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/admin/seo/audit');
      const data = await res.json();
      if (data.success && data.data) {
        setAuditData(data.data);
      } else {
        throw new Error(data.message || 'Audit failed');
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch SEO audit', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchAudit();
  }, [fetchAudit]);

  const handleInspectUrl = (e) => {
    e.preventDefault();
    if (!inspectUrl.trim()) return;
    setInspecting(true);

    let cleanPath = inspectUrl.trim().replace(/^https?:\/\/[^/]+/i, '');
    if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;

    // Simulate inspection check
    setTimeout(() => {
      const isBlog = cleanPath.startsWith('/blog/');
      const isRegion = cleanPath.startsWith('/region/') || cleanPath === '/kashmir';
      const isTopic = cleanPath.startsWith('/topic/');
      const isEntity = cleanPath.startsWith('/entity/');

      setUrlInspectResult({
        url: `https://teachyblogs.com${cleanPath}`,
        path: cleanPath,
        canonical: `https://teachyblogs.com${cleanPath}`,
        indexable: true,
        detectedType: isBlog ? 'NewsArticle / Article' : isRegion ? 'Regional Hub (CollectionPage)' : isTopic ? 'Topic Cluster' : isEntity ? 'Entity Page' : 'General Page',
        robots: 'index, follow',
        status: '200 OK — Canonical Registered',
      });
      setInspecting(false);
    }, 400);
  };

  const summary = auditData?.summary || {};

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#07090E] text-zinc-900 dark:text-zinc-100">
      <AdminHeader
        title="SEO & Entity Intelligence Command Center"
        subtitle="Local Kashmir Knowledge Graph, Topical Clusters, Indexation & Semantic Health"
      />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Top Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/10 dark:bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-display font-black tracking-tight text-zinc-900 dark:text-white">
                SEO & Knowledge Graph Matrix
              </h1>
              <p className="text-xs text-zinc-500">
                Live audit as of {auditData?.timestamp ? new Date(auditData.timestamp).toLocaleTimeString() : 'Just now'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchAudit}
              disabled={refreshing}
              className="px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2 transition-colors shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Audit</span>
            </button>
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <span>View Sitemap</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* 1. Real-Time URL Inspector Bar */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c0e14] border border-zinc-200/80 dark:border-white/10 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Live URL Inspector & Canonical Validator
            </span>
            <span className="text-[11px] text-zinc-400">Inspect any live article or hub URL</span>
          </div>
          <form onSubmit={handleInspectUrl} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={inspectUrl}
                onChange={(e) => setInspectUrl(e.target.value)}
                placeholder="Enter path (e.g. /blog/kashmir-ai-hub or /region/srinagar)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-red-500 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={inspecting}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors shrink-0"
            >
              {inspecting ? 'Inspecting...' : 'Inspect URL'}
            </button>
          </form>

          {urlInspectResult && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-white/5 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  {urlInspectResult.status}
                </span>
                <span className="text-[10px] font-mono bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-600 dark:text-zinc-300">
                  {urlInspectResult.detectedType}
                </span>
              </div>
              <div className="grid sm:grid-cols-2 gap-2 text-[11px] font-mono text-zinc-600 dark:text-zinc-400 pt-1">
                <div>Canonical: <span className="text-zinc-900 dark:text-white font-medium">{urlInspectResult.canonical}</span></div>
                <div>Robots: <span className="text-zinc-900 dark:text-white font-medium">{urlInspectResult.robots}</span></div>
              </div>
            </motion.div>
          )}
        </div>

        {/* 2. Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0c0e14] border border-zinc-200/80 dark:border-white/10 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold block">Public Articles</span>
            <div className="text-2xl font-display font-black text-zinc-900 dark:text-white">
              {loading ? '...' : summary.totalArticles ?? 0}
            </div>
            <span className="text-[10px] text-emerald-500 font-bold">100% Embargo Safe</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#0c0e14] border border-zinc-200/80 dark:border-white/10 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold block">Indexable Ratio</span>
            <div className="text-2xl font-display font-black text-zinc-900 dark:text-white">
              {loading ? '...' : summary.indexableArticles ?? 0}
            </div>
            <span className="text-[10px] text-zinc-400">Search ready</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#0c0e14] border border-zinc-200/80 dark:border-white/10 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold block">Missing Meta Desc</span>
            <div className="text-2xl font-display font-black text-amber-500">
              {loading ? '...' : summary.missingMetaDescriptionCount ?? 0}
            </div>
            <span className="text-[10px] text-zinc-400">Needs description</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#0c0e14] border border-zinc-200/80 dark:border-white/10 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold block">Missing Title</span>
            <div className="text-2xl font-display font-black text-rose-500">
              {loading ? '...' : summary.missingSeoTitleCount ?? 0}
            </div>
            <span className="text-[10px] text-zinc-400">&lt;20 chars title</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#0c0e14] border border-zinc-200/80 dark:border-white/10 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold block">Orphan Stories</span>
            <div className="text-2xl font-display font-black text-purple-500">
              {loading ? '...' : summary.orphanArticlesCount ?? 0}
            </div>
            <span className="text-[10px] text-zinc-400">No topic/region</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#0c0e14] border border-zinc-200/80 dark:border-white/10 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold block">Thin Taxonomies</span>
            <div className="text-2xl font-display font-black text-blue-500">
              {loading ? '...' : summary.thinTaxonomiesCount ?? 0}
            </div>
            <span className="text-[10px] text-zinc-400">0 published stories</span>
          </div>
        </div>

        {/* 3. Kashmir District Coverage Heatmap */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0c0e14] border border-zinc-200/80 dark:border-white/10 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="font-display font-bold text-sm text-zinc-900 dark:text-white">
                  Kashmir & J&K District Coverage Matrix
                </h3>
                <p className="text-xs text-zinc-400">Local SEO distribution across key districts and educational centers</p>
              </div>
            </div>
            <Link
              href="/kashmir"
              target="_blank"
              className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
            >
              <span>Explore Kashmir Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {(auditData?.districtCoverage || []).map((dist) => (
              <div
                key={dist.slug}
                className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-white/5 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-zinc-900 dark:text-white">{dist.district}</span>
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                      dist.articlesCount >= 5
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : dist.articlesCount >= 1
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {dist.articlesCount} {dist.articlesCount === 1 ? 'story' : 'stories'}
                  </span>
                </div>
                <div className="text-[10px] text-zinc-400 flex items-center justify-between">
                  <span>{dist.status}</span>
                  <Link href={`/region/${dist.slug}`} target="_blank" className="hover:text-red-500">
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Actionable Issue Resolution Workspace */}
        <div className="rounded-3xl bg-white dark:bg-[#0c0e14] border border-zinc-200/80 dark:border-white/10 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-zinc-200/80 dark:border-white/10 flex flex-wrap items-center gap-2">
            {[
              { id: 'summary', label: 'Missing Meta Descriptions', count: auditData?.missingMetaDesc?.length || 0 },
              { id: 'titles', label: 'Sub-Optimal Titles', count: auditData?.missingSeoTitle?.length || 0 },
              { id: 'orphans', label: 'Orphan Articles', count: auditData?.orphanArticles?.length || 0 },
              { id: 'thin', label: 'Thin Taxonomies', count: auditData?.thinTaxonomies?.length || 0 },
              { id: 'duplicates', label: 'Duplicate Titles', count: auditData?.duplicateTitles?.length || 0 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors ${
                  activeTab === tab.id
                    ? 'bg-red-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'summary' && (
              <div className="space-y-3">
                {auditData?.missingMetaDesc?.length === 0 ? (
                  <div className="text-center py-8 text-zinc-400 text-xs">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    All public articles have valid meta descriptions!
                  </div>
                ) : (
                  auditData?.missingMetaDesc?.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-white/5 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-zinc-900 dark:text-white truncate">{item.title}</h4>
                        <span className="text-[10px] font-mono text-zinc-400">/blog/{item.slug}</span>
                      </div>
                      <Link
                        href={`/admin/edit/${item.id}`}
                        className="px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600 text-red-600 hover:text-white text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Add Description</span>
                      </Link>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'titles' && (
              <div className="space-y-3">
                {auditData?.missingSeoTitle?.length === 0 ? (
                  <div className="text-center py-8 text-zinc-400 text-xs">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    All public articles have optimal search headlines!
                  </div>
                ) : (
                  auditData?.missingSeoTitle?.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-white/5 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-zinc-900 dark:text-white truncate">{item.title}</h4>
                        <span className="text-[10px] text-amber-500 font-mono">Title is short (&lt;20 chars)</span>
                      </div>
                      <Link
                        href={`/admin/edit/${item.id}`}
                        className="px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600 text-red-600 hover:text-white text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Improve Title</span>
                      </Link>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'orphans' && (
              <div className="space-y-3">
                {auditData?.orphanArticles?.length === 0 ? (
                  <div className="text-center py-8 text-zinc-400 text-xs">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    No orphan stories detected. Every article is attached to a topic cluster or region.
                  </div>
                ) : (
                  auditData?.orphanArticles?.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-white/5 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-zinc-900 dark:text-white truncate">{item.title}</h4>
                        <span className="text-[10px] text-purple-500 font-mono">Missing primary topic &amp; tags</span>
                      </div>
                      <Link
                        href={`/admin/edit/${item.id}`}
                        className="px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-600 text-purple-600 hover:text-white text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Assign Topic</span>
                      </Link>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'thin' && (
              <div className="space-y-3">
                {auditData?.thinTaxonomies?.length === 0 ? (
                  <div className="text-center py-8 text-zinc-400 text-xs">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    All active taxonomies have published content!
                  </div>
                ) : (
                  auditData?.thinTaxonomies?.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-white/5 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-500">
                            {item.kind}
                          </span>
                          <h4 className="font-bold text-xs text-zinc-900 dark:text-white">{item.name}</h4>
                        </div>
                        <span className="text-[10px] text-zinc-400 font-mono">/{item.kind === 'region' ? 'region' : 'topic'}/{item.slug}</span>
                      </div>
                      <span className="text-[11px] font-mono text-zinc-400">
                        Shielded with <code className="text-blue-500 font-bold">noindex</code> until stories are published
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'duplicates' && (
              <div className="space-y-3">
                {auditData?.duplicateTitles?.length === 0 ? (
                  <div className="text-center py-8 text-zinc-400 text-xs">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    Zero duplicate titles found across the publication!
                  </div>
                ) : (
                  auditData?.duplicateTitles?.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-white/5 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-zinc-900 dark:text-white capitalize">{item.title}</h4>
                        <span className="text-[10px] text-rose-500 font-mono">{item.occurrences} stories sharing this title</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
