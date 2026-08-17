'use client';

import { useEffect, useState } from 'react';
import { Loader2, BarChart3, Eye, Heart, MessageSquare, Mail, Layers, FileText, TrendingUp } from 'lucide-react';
import useToastStore from '@/store/useToastStore';
import AdminHeader from '@/components/admin/AdminHeader';

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
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        <span className="text-zinc-400 font-bold text-xs font-mono uppercase tracking-wider">
          Aggregating Newsroom Intelligence...
        </span>
      </div>
    );
  }

  if (!data) return null;

  const { stats, topViewsPosts = [], topLikesPosts = [], weeklyHistory = [] } = data;

  const maxViews = topViewsPosts.length > 0 ? Math.max(...topViewsPosts.map((p) => p.views || 0)) : 1;
  const maxLikes = topLikesPosts.length > 0 ? Math.max(...topLikesPosts.map((p) => p.likes || 0)) : 1;

  const cards = [
    { label: 'Published Stories', value: stats.totalPosts, icon: FileText },
    { label: 'Article Pageviews', value: stats.totalViews.toLocaleString(), icon: Eye },
    { label: 'Reader Likes', value: stats.totalLikes.toLocaleString(), icon: Heart },
    { label: 'Briefing Subscribers', value: stats.totalSubscribers.toLocaleString(), icon: Mail },
    { label: 'Reader Comments', value: stats.totalComments.toLocaleString(), icon: MessageSquare },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <AdminHeader
        title="Editorial Analytics & Reader Intelligence"
        breadcrumb={[{ label: 'Editorial Analytics' }]}
      />

      {/* Grid of Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border bg-white dark:bg-[#12151c] border-zinc-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between min-h-[120px]"
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black text-zinc-400 font-mono uppercase tracking-widest">
                {card.label}
              </span>
              <card.icon className="w-4 h-4 text-zinc-400" />
            </div>
            <p className="text-2xl font-black font-display text-zinc-900 dark:text-white mt-3">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Top Stories Leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Most Read Leaderboard */}
        <div className="p-6 rounded-2xl border bg-white dark:bg-[#12151c] border-zinc-200/80 dark:border-white/10 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-200/80 dark:border-white/10">
            <Eye className="w-4 h-4 text-red-600" />
            <h3 className="font-display font-black text-sm uppercase tracking-wider text-zinc-900 dark:text-white">
              Most Read Stories
            </h3>
          </div>

          <div className="space-y-3">
            {topViewsPosts.slice(0, 5).map((post, idx) => (
              <div key={post._id || idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="truncate max-w-[280px] sm:max-w-md text-zinc-800 dark:text-zinc-200 font-display">
                    {idx + 1}. {post.title}
                  </span>
                  <span className="font-mono text-zinc-400 shrink-0 ml-2">
                    {post.views || 0} views
                  </span>
                </div>
                <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-600 rounded-full"
                    style={{ width: `${Math.max(5, ((post.views || 0) / maxViews) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Appreciated Leaderboard */}
        <div className="p-6 rounded-2xl border bg-white dark:bg-[#12151c] border-zinc-200/80 dark:border-white/10 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-200/80 dark:border-white/10">
            <Heart className="w-4 h-4 text-rose-500" />
            <h3 className="font-display font-black text-sm uppercase tracking-wider text-zinc-900 dark:text-white">
              Most Appreciated Stories
            </h3>
          </div>

          <div className="space-y-3">
            {topLikesPosts.slice(0, 5).map((post, idx) => (
              <div key={post._id || idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="truncate max-w-[280px] sm:max-w-md text-zinc-800 dark:text-zinc-200 font-display">
                    {idx + 1}. {post.title}
                  </span>
                  <span className="font-mono text-zinc-400 shrink-0 ml-2">
                    {post.likes || 0} likes
                  </span>
                </div>
                <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${Math.max(5, ((post.likes || 0) / maxLikes) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
