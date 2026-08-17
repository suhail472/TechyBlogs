'use client';

import { useEffect, useState } from 'react';
import { Trash2, Loader2, Mail, Search, Download } from 'lucide-react';
import useToastStore from '@/store/useToastStore';
import AdminHeader from '@/components/admin/AdminHeader';
import EmptyState from '@/components/admin/EmptyState';

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
    const rows = subscribers.map((sub) => [
      sub._id,
      sub.email,
      new Date(sub.createdAt).toLocaleDateString('en-US'),
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');
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
        setSubscribers(subscribers.filter((sub) => sub._id !== id));
        setTotalSubscribers((prev) => prev - 1);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error('Failed to unsubscribe:', err);
      addToast(err.message || 'Action failed', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminHeader
        title="Morning Briefing & Newsletter CRM"
        breadcrumb={[{ label: 'Subscribers' }]}
        actions={
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors border border-zinc-200 dark:border-white/10"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        }
      />

      {/* Filter & Metric Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email subscribers..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 outline-none focus:ring-2 focus:ring-red-500/20"
          />
        </div>

        <div className="px-4 py-2 bg-red-500/10 text-red-600 dark:text-red-400 font-black text-xs uppercase tracking-wider rounded-xl border border-red-500/20 flex items-center gap-2 font-mono">
          <Mail className="w-4 h-4" />
          <span>{totalSubscribers} Verified Subscribers</span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
              Loading subscriber database...
            </p>
          </div>
        ) : subscribers.length === 0 ? (
          <EmptyState
            icon={Mail}
            title="No newsletter subscribers found"
            description="When readers subscribe through the Daily Briefing modules, they will appear here."
            className="m-6"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200/80 dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-400 font-mono">
                <tr>
                  <th className="py-3.5 px-6">Subscriber Email</th>
                  <th className="py-3.5 px-6">Joined Date</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-white/5">
                {subscribers.map((sub) => (
                  <tr key={sub._id} className="hover:bg-zinc-50/70 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6 font-bold text-zinc-900 dark:text-white">
                      {sub.email}
                    </td>
                    <td className="py-4 px-6 font-mono text-zinc-500">
                      {new Date(sub.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                        Active
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDelete(sub._id)}
                        className="p-1.5 rounded-lg border border-zinc-200 hover:bg-rose-50 hover:text-rose-600 dark:border-white/10 dark:hover:bg-rose-500/10 text-zinc-400 transition-colors"
                        title="Remove Subscriber"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
