'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, BarChart3, Eye, Heart, MessageSquare, Mail, Layers, FileText } from 'lucide-react';
import useToastStore from '@/store/useToastStore';

export default function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToastStore();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/analytics');
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        throw new Error(json.message);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
      addToast('Failed to retrieve analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center flex flex-col items-center justify-center gap-3 min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="text-slate-400 font-bold text-sm">Aggregating workspace analytics...</span>
      </div>
    );
  }

  if (!data) return null;

  const { stats, topViewsPosts = [], topLikesPosts = [], weeklyHistory = [] } = data;

  const maxViews = topViewsPosts.length > 0 ? Math.max(...topViewsPosts.map(p => p.views || 0)) : 1;
  const maxLikes = topLikesPosts.length > 0 ? Math.max(...topLikesPosts.map(p => p.likes || 0)) : 1;
  const maxHistorySubscribers = weeklyHistory.length > 0 ? Math.max(...weeklyHistory.map(h => h.subscribers)) : 1;
  const maxHistoryViews = weeklyHistory.length > 0 ? Math.max(...weeklyHistory.map(h => h.views)) : 1;

  const cards = [
    { label: 'Total Articles', value: stats.totalPosts, icon: FileText, color: 'from-blue-500 to-indigo-500' },
    { label: 'Page Views', value: stats.totalViews.toLocaleString(), icon: Eye, color: 'from-indigo-500 to-violet-500' },
    { label: 'Article Likes', value: stats.totalLikes.toLocaleString(), icon: Heart, color: 'from-pink-500 to-rose-500' },
    { label: 'Subscribers', value: stats.totalSubscribers.toLocaleString(), icon: Mail, color: 'from-emerald-500 to-teal-500' },
    { label: 'Comments Posted', value: stats.totalComments.toLocaleString(), icon: MessageSquare, color: 'from-amber-500 to-orange-500' },
  ];

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-4xl font-black tracking-tight mb-2 font-display text-slate-900 dark:text-white">Analytics</h1>
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Monitor your blog performance, reading behaviors, and audience growth.
        </p>
      </div>

      {/* Grid of Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-12">
        {cards.map((card, i) => (
          <div
            key={i}
            className="p-6 rounded-3xl border bg-white border-zinc-200 shadow-sm dark:bg-zinc-800/20 dark:border-zinc-800/80 hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between min-h-[140px]"
          >
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest">{card.label}</span>
              <card.icon className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            </div>
            <p className="text-2xl font-black font-display text-slate-900 dark:text-white mt-4">{card.value}</p>
            {/* Ambient accent slider */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.color}`} />
          </div>
        ))}
      </div>

      {/* Weekly Growth Trend Line Graph */}
      <div className="p-8 rounded-[2rem] border bg-white border-zinc-200 shadow-sm dark:bg-zinc-800/20 dark:border-zinc-800/80 mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2.5">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-display">
              Weekly Growth Trend
            </h3>
          </div>
          {/* Legend indicators */}
          <div className="flex gap-4 text-[10px] font-black uppercase tracking-wider">
            <div className="flex items-center gap-1.5 text-blue-500">
              <span className="w-3 h-1 bg-blue-500 rounded-full inline-block" />
              <span>Page Views</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-500">
              <span className="w-3 h-1 bg-emerald-500 rounded-full inline-block" />
              <span>New Subscribers</span>
            </div>
          </div>
        </div>

        <div className="w-full h-[220px] relative overflow-visible px-4">
          <svg viewBox="0 0 520 200" className="w-full h-full overflow-visible">
            {/* Grid lines */}
            <line x1="10" y1="40" x2="510" y2="40" stroke="rgba(128,128,128,0.1)" strokeDasharray="4" />
            <line x1="10" y1="110" x2="510" y2="110" stroke="rgba(128,128,128,0.1)" strokeDasharray="4" />
            <line x1="10" y1="180" x2="510" y2="180" stroke="rgba(128,128,128,0.2)" />

            {/* Views Path (Blue line) */}
            <motion.path
              d={weeklyHistory.length > 0 ? weeklyHistory.map((h, i) => `${i === 0 ? 'M' : 'L'} ${i * 83.3 + 10} ${180 - (h.views / (maxHistoryViews || 1)) * 140}`).join(' ') : ''}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />

            {/* Subscribers Path (Green line) */}
            <motion.path
              d={weeklyHistory.length > 0 ? weeklyHistory.map((h, i) => `${i === 0 ? 'M' : 'L'} ${i * 83.3 + 10} ${180 - (h.subscribers / (maxHistorySubscribers || 1)) * 140}`).join(' ') : ''}
              fill="none"
              stroke="#10b981"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
            />

            {/* Data Node Dots */}
            {weeklyHistory.map((h, i) => {
              const scaleYSub = 180 - (h.subscribers / (maxHistorySubscribers || 1)) * 140;
              const scaleYViews = 180 - (h.views / (maxHistoryViews || 1)) * 140;
              const posX = i * 83.3 + 10;
              return (
                <g key={i} className="group cursor-pointer">
                  {/* Views nodes */}
                  <circle cx={posX} cy={scaleYViews} r="4" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
                  {/* Subscribers nodes */}
                  <circle cx={posX} cy={scaleYSub} r="4" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                </g>
              );
            })}
          </svg>
          
          {/* X Axis Labels */}
          <div className="flex justify-between mt-3 text-[9px] font-black text-zinc-400 dark:text-zinc-500 px-2 uppercase tracking-widest">
            {weeklyHistory.map((h, i) => (
              <span key={i} className="w-[83.3px] text-center">{h.label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Analytics Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Page Views Chart */}
        <div className="p-8 rounded-[2rem] border bg-white border-zinc-200 shadow-sm dark:bg-zinc-800/20 dark:border-zinc-800/80">
          <div className="flex items-center gap-2.5 mb-6">
            <Eye className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-display">
              Top Articles by Views
            </h3>
          </div>
          <div className="space-y-5">
            {topViewsPosts.map((post, index) => {
              const percentage = maxViews > 0 ? (post.views / maxViews) * 100 : 0;
              return (
                <div key={post._id} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    <span className="truncate max-w-[280px]">{post.title}</span>
                    <span>{post.views.toLocaleString()}</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-100 dark:bg-white/[0.04] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                    />
                  </div>
                </div>
              );
            })}
            {topViewsPosts.length === 0 && (
              <p className="text-xs text-zinc-500 text-center py-6">No view stats recorded yet.</p>
            )}
          </div>
        </div>

        {/* Article Likes Chart */}
        <div className="p-8 rounded-[2rem] border bg-white border-zinc-200 shadow-sm dark:bg-zinc-800/20 dark:border-zinc-800/80">
          <div className="flex items-center gap-2.5 mb-6">
            <Heart className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-display">
              Top Articles by Likes
            </h3>
          </div>
          <div className="space-y-5">
            {topLikesPosts.map((post, index) => {
              const percentage = maxLikes > 0 ? ((post.likes || 0) / maxLikes) * 100 : 0;
              return (
                <div key={post._id} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    <span className="truncate max-w-[280px]">{post.title}</span>
                    <span>{(post.likes || 0).toLocaleString()}</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-100 dark:bg-white/[0.04] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-pink-500 to-rose-600 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                    />
                  </div>
                </div>
              );
            })}
            {topLikesPosts.length === 0 && (
              <p className="text-xs text-zinc-500 text-center py-6">No likes recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
