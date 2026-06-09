'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Edit, Trash2, Eye, Plus, Loader2, AlertCircle } from 'lucide-react';
import useThemeStore from '@/store/useThemeStore';
import { postAPI } from '@/services/api';

export default function Dashboard() {
  const router = useRouter();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, scheduled: 0, drafts: 0 });
  const [pendingCommentsCount, setPendingCommentsCount] = useState(0);

  useEffect(() => {
    fetchBlogs();
    fetchPendingComments();
  }, []);

  const fetchPendingComments = async () => {
    try {
      const res = await fetch('/api/admin/analytics');
      const data = await res.json();
      if (data.success && data.stats) {
        setPendingCommentsCount(data.stats.pendingComments || 0);
      }
    } catch (err) {
      console.error('Failed to fetch pending comments:', err);
    }
  };

  const fetchBlogs = async () => {
    try {
      const response = await postAPI.getAllPosts();
      if (response.posts) {
        setBlogs(response.posts);
        
        // Compute stats
        const scheduled = response.posts.filter(b => b.status === 'scheduled').length;
        const drafts = response.posts.filter(b => b.status === 'draft').length;
        setStats({
          total: response.posts.length,
          scheduled,
          drafts,
        });
      }
    } catch (error) {
      console.error('Failed to fetch admin dashboard blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this blog post?')) {
      try {
        await postAPI.deletePost(id);
        setBlogs(blogs.filter(b => b._id !== id));
        setStats(prev => ({ ...prev, total: prev.total - 1 }));
        alert('Post deleted successfully');
      } catch (error) {
        console.error('Failed to delete post:', error);
        alert('Failed to delete post: ' + error.message);
      }
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2 font-display text-slate-900 dark:text-white">Workspace</h1>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Manage your articles, draft content, and view writing statistics.
          </p>
        </div>
        <Link
          href="/admin/create"
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/25 shrink-0"
        >
          <Plus className="w-4.5 h-4.5" />
          Create New Article
        </Link>
      </div>

      {/* Alert Warning for Pending Comments */}
      {pendingCommentsCount > 0 && (
        <div className="mb-8 p-4 rounded-2xl border border-rose-500/10 bg-rose-500/5 text-rose-600 dark:text-rose-455 flex items-center justify-between gap-4 text-xs font-bold font-sans">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4.5 h-4.5 animate-bounce" />
            <span>You have {pendingCommentsCount} comments waiting in the moderation approval queue!</span>
          </div>
          <Link
            href="/admin/comments"
            className="px-4.5 py-2 rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition-colors uppercase tracking-wider text-[10px] font-black"
          >
            Moderate
          </Link>
        </div>
      )}

      {/* Stats Summary Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[
          { label: 'Total Articles', value: stats.total, color: 'from-blue-600 to-indigo-600' },
          { label: 'Scheduled Releases', value: stats.scheduled, color: 'from-indigo-600 to-violet-600' },
          { label: 'Draft Content', value: stats.drafts, color: 'from-violet-600 to-fuchsia-600' },
        ].map((stat, i) => (
          <div 
            key={i}
            className="p-8 rounded-3xl border transition-all duration-300 hover:shadow-xl relative overflow-hidden bg-white border-zinc-200 shadow-sm dark:bg-zinc-800/20 dark:border-zinc-800/80 dark:shadow-none"
          >
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{stat.label}</p>
            <p className="text-3xl font-black font-display text-slate-900 dark:text-white">{stat.value}</p>
            {/* Visual gradient accent line */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color}`} />
          </div>
        ))}
      </div>

      {/* Blog List Table Wrapper */}
      <div className="rounded-[2rem] border overflow-hidden transition-all duration-300 bg-white border-zinc-200 shadow-xl shadow-zinc-200/30 dark:bg-zinc-800/20 dark:border-zinc-800 dark:shadow-none">
        {loading ? (
          <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-slate-400 font-bold text-sm">Retrieving article listings...</span>
          </div>
        ) : blogs.length === 0 ? (
          <div className="p-16 text-center text-slate-500 font-bold text-sm">
            No articles found. Create your first blog post to begin!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800/80">
                  <th className="px-6 py-4.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Article</th>
                  <th className="px-6 py-4.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Categories</th>
                  <th className="px-6 py-4.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Published Date</th>
                  <th className="px-6 py-4.5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-sm font-medium">
                {blogs.map((blog) => (
                  <tr key={blog._id} className="group hover:bg-blue-500/5 transition-colors">
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-4">
                        <img 
                          src={blog.image} 
                          alt="" 
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-zinc-200 dark:border-zinc-800 bg-zinc-800/20" 
                        />
                        <div className="truncate max-w-[240px] font-bold text-slate-900 dark:text-white hover:text-blue-500 transition-colors">
                          {blog.title}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4.5">
                      <div className="flex gap-1.5 flex-wrap">
                        {(blog.categories || []).slice(0,2).map(cat => (
                          <span key={cat} className="text-[9px] font-black uppercase tracking-wider text-blue-500 bg-blue-500/5 px-2 py-0.5 rounded-md">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4.5 text-slate-500 text-xs" suppressHydrationWarning>
                      {new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>

                    <td className="px-6 py-4.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link 
                          href={`/blog/${blog.slug}`}
                          target="_blank"
                          className="p-2.5 hover:bg-blue-500/10 text-blue-500 rounded-xl transition-all"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link 
                          href={`/admin/edit/${blog._id}`}
                          className="p-2.5 hover:bg-amber-500/10 text-amber-500 rounded-xl transition-all"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(blog._id)}
                          className="p-2.5 hover:bg-red-500/10 text-red-500 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
