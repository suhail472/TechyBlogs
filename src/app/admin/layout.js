'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  PlusCircle,
  LogOut,
  Home as HomeIcon,
  Menu,
  X,
  MessageSquare,
  Mail,
  BarChart3,
  Layers,
  Users,
  Calendar,
  Sparkles,
} from 'lucide-react';
import useAuthStore from '@/store/useAuthStore';
import TopLoader from '@/components/shared/TopLoader';
import { getCookie } from '@/lib/cookies';

export default function AdminLayout({ children }) {
  const { isAuthenticated, user, getMe, logout } = useAuthStore();
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
      if (isAuthPage) {
        setVerifying(false);
        return;
      }

      const token = getCookie('token');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      setVerifying(true);
      const authedUser = await getMe();
      if (!authedUser) {
        router.push('/admin/login');
        return;
      }
      setVerifying(false);
    };

    verify();
  }, [pathname, isAuthenticated, getMe, router, isAuthPage]);

  if (verifying && !isAuthPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
          <span className="text-zinc-500 font-bold text-sm">Authenticating editorial session...</span>
        </div>
      </div>
    );
  }

  if (isAuthPage) {
    return <>{children}</>;
  }

  const menuSections = [
    {
      title: 'Editorial',
      items: [
        { icon: LayoutDashboard, label: 'Workspace', path: '/admin' },
        { icon: PlusCircle, label: 'New Story', path: '/admin/create' },
        { icon: Calendar, label: 'Calendar', path: '/admin/calendar' },
      ],
    },
    {
      title: 'Organization',
      items: [
        { icon: Layers, label: 'Taxonomy', path: '/admin/taxonomy' },
        { icon: Users, label: 'Authors & Team', path: '/admin/authors' },
      ],
    },
    {
      title: 'Audience & Growth',
      items: [
        {
          icon: MessageSquare,
          label: 'Comments',
          path: '/admin/comments',
          badge: pendingCommentsCount > 0 ? pendingCommentsCount : null,
        },
        { icon: Mail, label: 'Subscribers', path: '/admin/subscribers' },
        { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 relative overflow-x-hidden">
      <TopLoader />

      {/* Mobile Top Bar */}
      <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-white/10 sticky top-0 z-20 w-full backdrop-blur-xl">
        <Link href="/admin" className="text-xl font-black tracking-tight font-display text-zinc-900 dark:text-white flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black">TB</span>
          <span>Editorial <span className="text-blue-500 font-extrabold text-xs uppercase tracking-widest px-2 py-0.5 bg-blue-500/10 rounded-full">CMS</span></span>
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
          aria-label="Toggle Navigation"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-72 bg-white dark:bg-zinc-900/95 border-r border-zinc-200/80 dark:border-white/10 p-6 flex flex-col justify-between transition-transform duration-300 backdrop-blur-xl lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:static'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto pr-1">
          {/* Logo & Role */}
          <div className="mb-8 hidden lg:block">
            <Link href="/admin" className="text-xl font-black tracking-tight font-display text-zinc-900 dark:text-white flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm font-black shadow-lg shadow-blue-500/20">
                TB
              </span>
              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-bold">TeachyBlogs</span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">CMS</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 font-medium">Publishing Newsroom</p>
              </div>
            </Link>
          </div>

          {/* Navigation Groups */}
          <div className="space-y-6 flex-1">
            {menuSections.map((section) => (
              <div key={section.title}>
                <p className="text-[10px] uppercase font-black tracking-[0.18em] text-zinc-400 dark:text-zinc-500 mb-2 px-3">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.path;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              isActive
                                ? 'bg-white text-blue-600'
                                : 'bg-rose-500 text-white animate-pulse'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* User Profile & Back to Site */}
          <div className="pt-6 mt-6 border-t border-zinc-200/80 dark:border-white/10 space-y-2">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white transition-all"
            >
              <HomeIcon className="w-4 h-4" />
              <span>Public Live Site</span>
            </Link>

            <button
              onClick={() => {
                logout();
                router.push('/admin/login');
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
