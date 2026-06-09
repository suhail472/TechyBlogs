'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, PlusCircle, LogOut, Home as HomeIcon, Menu, X, MessageSquare, Mail, BarChart3 } from 'lucide-react';
import useAuthStore from '@/store/useAuthStore';
import TopLoader from '@/components/shared/TopLoader';

import { getCookie } from '@/lib/cookies';

export default function AdminLayout({ children }) {
  const { isAuthenticated, getMe, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [verifying, setVerifying] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCommentsCount, setPendingCommentsCount] = useState(0);

  const isAuthPage = pathname === '/admin/login' || pathname === '/admin/forgot';

  useEffect(() => {
    if (isAuthPage || verifying) return;
    const fetchPendingComments = async () => {
      try {
        const res = await fetch('/api/admin/analytics');
        const data = await res.json();
        if (data.success && data.stats) {
          setPendingCommentsCount(data.stats.pendingComments || 0);
        }
      } catch (err) {
        // Silently fail
      }
    };
    fetchPendingComments();
  }, [isAuthPage, verifying]);


  useEffect(() => {
    const verify = async () => {
      // If we are on an auth page, skip active check redirects
      if (isAuthPage) {
        setVerifying(false);
        return;
      }

      const token = getCookie('token');
      if (!token) {
        router.push('/admin/login');
        // Do NOT call setVerifying(false) to prevent layout flash during redirect transition
        return;
      }

      setVerifying(true);
      const user = await getMe();
      if (!user) {
        router.push('/admin/login');
        // Do NOT call setVerifying(false)
        return;
      }
      setVerifying(false);
    };

    verify();
  }, [pathname, isAuthenticated, getMe, router, isAuthPage]);

  if (verifying && !isAuthPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
          <span className="text-slate-500 font-bold text-sm">Authenticating admin session...</span>
        </div>
      </div>
    );
  }

  // If it's a login or forgot page, just render the child card without sidebar
  if (isAuthPage) {
    return <>{children}</>;
  }

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: PlusCircle, label: 'Create Post', path: '/admin/create' },
    { icon: MessageSquare, label: 'Comments', path: '/admin/comments' },
    { icon: Mail, label: 'Subscribers', path: '/admin/subscribers' },
    { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
    { icon: HomeIcon, label: 'Back to Site', path: '/' },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-zinc-50 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100 relative overflow-x-hidden">
      <TopLoader />

      {/* Mobile Top Bar */}
      <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-950 border-b border-zinc-200/80 dark:border-zinc-800/50 sticky top-0 z-20 w-full backdrop-blur-xl bg-white/90 dark:bg-zinc-950/80">
        <Link href="/" className="text-xl font-bold tracking-tight font-display text-zinc-900 dark:text-white">
          Techy<span className="font-extrabold text-blue-500">Blogs</span>
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 text-zinc-650 dark:text-zinc-355 hover:bg-zinc-55 dark:hover:bg-zinc-900 transition-colors"
          aria-label="Toggle Sidebar"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-20 lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`w-64 border-r fixed inset-y-0 left-0 z-30 transition-all duration-300 ease-in-out bg-white border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800/50 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-8 border-b dark:border-zinc-800/50 border-zinc-100 flex items-center justify-between">
          <div>
            <Link href="/" className="text-2xl font-black tracking-tight mb-2 block font-display">
              Techy<span className="text-blue-500">Blogs</span>
            </Link>
            <span className="inline-block text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 bg-blue-500/10 text-blue-500 rounded-md">
              Admin Management
            </span>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 dark:text-zinc-550"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="mt-8 px-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            const isComments = item.label === 'Comments';
            return (
              <Link
                key={item.label}
                href={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'text-zinc-550 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </div>
                {isComments && pendingCommentsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-500 text-white animate-pulse">
                    {pendingCommentsCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-8 left-0 w-full px-4">
          <button 
            onClick={async () => {
              setSidebarOpen(false);
              await logout();
              router.push('/');
            }}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider text-red-500 hover:bg-red-500/10 transition-all duration-300"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 lg:ml-64 p-6 sm:p-8 md:p-12 overflow-y-auto max-w-full">
        <div className="container mx-auto max-w-5xl">
          {children}
        </div>
      </main>
    </div>
  );
}
