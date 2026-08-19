'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
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
  FileText,
  Compass,
  Radio,
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
  const scrollYRef = useRef(0);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Body scroll lock for mobile sidebar
  useEffect(() => {
    if (sidebarOpen) {
      scrollYRef.current = window.scrollY;
      document.body.classList.add('body-scroll-locked');
      document.body.style.top = `-${scrollYRef.current}px`;
    } else {
      document.body.classList.remove('body-scroll-locked');
      document.body.style.top = '';
      if (scrollYRef.current) window.scrollTo(0, scrollYRef.current);
    }
    return () => {
      document.body.classList.remove('body-scroll-locked');
      document.body.style.top = '';
    };
  }, [sidebarOpen]);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && sidebarOpen) closeSidebar();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [sidebarOpen, closeSidebar]);

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
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#0c0e12]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-red-600 border-t-transparent animate-spin" />
          <span className="text-zinc-500 font-bold text-xs font-mono uppercase tracking-wider">
            Authenticating Newsroom Session...
          </span>
        </div>
      </div>
    );
  }

  if (isAuthPage) {
    return <>{children}</>;
  }

  const menuSections = [
    {
      title: 'OVERVIEW',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
      ],
    },
    {
      title: 'EDITORIAL',
      items: [
        { icon: PlusCircle, label: 'Article Studio', path: '/admin/create' },
        { icon: Calendar, label: 'Publishing Calendar', path: '/admin/calendar' },
      ],
    },
    {
      title: 'AUDIENCE & CRM',
      items: [
        { icon: BarChart3, label: 'Editorial Analytics', path: '/admin/analytics' },
        {
          icon: MessageSquare,
          label: 'Comment Queue',
          path: '/admin/comments',
          badge: pendingCommentsCount > 0 ? pendingCommentsCount : null,
        },
        { icon: Mail, label: 'Briefing Subscribers', path: '/admin/subscribers' },
      ],
    },
    {
      title: 'PUBLICATION IA',
      items: [
        { icon: Layers, label: 'Taxonomy Architecture', path: '/admin/taxonomy' },
        { icon: Users, label: 'Staff Correspondents', path: '/admin/authors' },
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FAFAFA] text-zinc-900 dark:bg-[#0c0e12] dark:text-zinc-100 relative overflow-x-hidden font-sans">
      <TopLoader />

      {/* Mobile Top Bar */}
      <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-white/10 sticky top-0 z-20 w-full backdrop-blur-xl">
        <Link href="/admin" className="text-lg font-black tracking-tight font-display text-zinc-900 dark:text-white flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center text-xs font-black shadow-sm shadow-red-600/20">
            TB
          </span>
          <span>TeachyBlogs <span className="text-red-600 dark:text-red-400 text-[10px] uppercase font-mono tracking-wider ml-1">Newsroom</span></span>
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="touch-target p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
          aria-label="Toggle Navigation"
          aria-expanded={sidebarOpen}
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar Backdrop Overlay (Mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-25 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-68 bg-white dark:bg-[#12151c] border-r border-zinc-200/80 dark:border-white/10 p-4 sm:p-5 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 safe-area-top ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:static'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto pr-1">
          {/* Logo & Newsroom Identity */}
          <div className="mb-8 hidden lg:block">
            <Link href="/admin" className="text-xl font-black tracking-tight font-display text-zinc-900 dark:text-white flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center text-xs font-black shadow-md shadow-red-600/20">
                TB
              </span>
              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-bold text-sm">TeachyBlogs</span>
                  <span className="text-[9px] font-black uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded font-mono">
                    Newsroom
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-1 font-medium">Publishing Operating System</p>
              </div>
            </Link>
          </div>

          {/* Navigation Groups */}
          <div className="space-y-6 flex-1">
            {menuSections.map((section) => (
              <div key={section.title}>
                <p className="text-[9px] uppercase font-black tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-2 px-3 font-mono">
                  {section.title}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = pathname === item.path;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center justify-between px-3 py-2.5 sm:py-2 rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-l-2 border-red-600 shadow-xs'
                            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-red-600 dark:text-red-400' : 'text-zinc-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                              isActive
                                ? 'bg-red-600 text-white'
                                : 'bg-red-500 text-white animate-pulse'
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

          {/* User Profile & Back to Public Site */}
          <div className="pt-5 mt-5 border-t border-zinc-200/80 dark:border-white/10 space-y-1.5">
            <div className="px-3 py-2 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/60 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center text-[10px] font-black font-display shrink-0">
                  {user?.name ? user.name[0] : 'E'}
                </div>
                <div className="truncate">
                  <p className="text-[11px] font-bold text-zinc-900 dark:text-white truncate">
                    {user?.name || 'Editor in Chief'}
                  </p>
                  <p className="text-[9px] text-zinc-400 uppercase font-mono">
                    {user?.role || 'Admin'}
                  </p>
                </div>
              </div>
            </div>

            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white transition-all"
            >
              <HomeIcon className="w-3.5 h-3.5" />
              <span>Public Live Site ↗</span>
            </Link>

            <button
              onClick={() => {
                logout();
                router.push('/admin/login');
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
