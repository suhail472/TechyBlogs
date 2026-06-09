'use client';

import { useEffect, useState } from 'react';
import { Trash2, Loader2, Mail, Search, UserMinus, Download } from 'lucide-react';
import useToastStore from '@/store/useToastStore';

export default function SubscribersDashboard() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalSubscribers, setTotalSubscribers] = useState(0);
  const { addToast } = useToastStore();

  const handleExportCSV = () => {
    if (subscribers.length === 0) {
      addToast('No subscribers to export', 'info');
      return;
    }
    const headers = ['ID', 'Email', 'Joined Date'];
    const rows = subscribers.map(sub => [
      sub._id,
      sub.email,
      new Date(sub.createdAt).toLocaleDateString('en-US')
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `teachyblogs_subscribers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Mailing list exported as CSV!', 'success');
  };

  useEffect(() => {
    fetchSubscribers();
  }, [search, page]);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const url = `/api/newsletter/subscribers?search=${encodeURIComponent(search)}&page=${page}&limit=20`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setSubscribers(data.subscribers || []);
        if (data.pagination) {
          setTotalSubscribers(data.pagination.total);
        }
      }
    } catch (err) {
      console.error('Failed to load subscribers:', err);
      addToast('Failed to load subscribers list', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this subscriber?')) return;
    try {
      const res = await fetch(`/api/newsletter/subscribers?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        addToast('Subscriber removed successfully', 'success');
        setSubscribers(subscribers.filter(sub => sub._id !== id));
        setTotalSubscribers(prev => prev - 1);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error('Failed to unsubscribe:', err);
      addToast(err.message || 'Action failed', 'error');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2 font-display text-slate-900 dark:text-white">Subscribers</h1>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            View mailing lists, active newsletter subscriptions, and subscriber counts.
          </p>
        </div>
        
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="px-5 py-3.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-white/[0.06] font-black text-xs uppercase tracking-wider rounded-2xl flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          
          {/* Total Subscribers Count Widget */}
          <div className="px-6 py-3.5 bg-blue-500/10 text-blue-600 dark:bg-blue-500/5 dark:text-blue-400 font-black text-xs uppercase tracking-wider rounded-2xl border border-blue-500/15 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <span>{totalSubscribers} Subscribers</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8 max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search subscriber emails..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl text-xs border outline-none transition-all focus:border-blue-400/40 focus:ring-2 focus:ring-blue-500/10 dark:focus:border-blue-500/30 bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400 dark:bg-zinc-800/10 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-500"
        />
      </div>

      {/* Subscribers List Grid / Table */}
      <div className="rounded-[2rem] border overflow-hidden bg-white border-zinc-200 shadow-xl shadow-zinc-200/30 dark:bg-zinc-800/20 dark:border-zinc-800 dark:shadow-none">
        {loading && subscribers.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-slate-400 font-bold text-sm">Retrieving subscriber listings...</span>
          </div>
        ) : subscribers.length === 0 ? (
          <div className="p-16 text-center text-slate-500 font-bold text-sm flex flex-col items-center gap-3">
            <Mail className="w-8 h-8 opacity-40 text-slate-400" />
            <span>No subscribers found matching search.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800/80">
                  <th className="px-6 py-4.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Email Address</th>
                  <th className="px-6 py-4.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Subscription Status</th>
                  <th className="px-6 py-4.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Joined Date</th>
                  <th className="px-6 py-4.5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-sm font-medium">
                {subscribers.map((sub) => (
                  <tr
                    key={sub._id}
                    className="hover:bg-blue-500/5 transition-colors"
                  >
                    <td className="px-6 py-4.5 font-bold text-slate-900 dark:text-white">
                      {sub.email}
                    </td>
                    <td className="px-6 py-4.5">
                      <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border text-emerald-500 bg-emerald-500/5 border-emerald-500/10">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-slate-500 text-xs" suppressHydrationWarning>
                      {new Date(sub.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4.5 text-right">
                      <button
                        onClick={() => handleDelete(sub._id)}
                        className="p-2.5 hover:bg-red-500/10 text-red-500 rounded-xl transition-all"
                        title="Unsubscribe / Remove Email"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
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
