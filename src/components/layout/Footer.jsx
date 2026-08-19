'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Rss, Globe, MapPin, ShieldCheck, Mail, ArrowUp, ChevronDown } from 'lucide-react';
import useToastStore from '@/store/useToastStore';

/* Collapsible footer section — open by default on desktop, accordion on mobile */
function FooterSection({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      {/* Mobile: collapsible toggle */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="md:hidden w-full flex items-center justify-between py-3"
      >
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-white">
          {title}
        </h4>
        <ChevronDown
          className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Desktop: always-visible heading */}
      <h4 className="hidden md:block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-white mb-3">
        {title}
      </h4>

      {/* Content — collapsed on mobile, always visible on desktop */}
      <div
        className={`overflow-hidden transition-all duration-300 md:!max-h-[500px] md:!opacity-100 ${
          open ? 'max-h-[500px] opacity-100 pb-3' : 'max-h-0 opacity-0'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export default function Footer() {
  const { addToast } = useToastStore();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('Subscribed! You are on the editorial dispatch list.', 'success');
        setEmail('');
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      addToast(err.message || 'Subscription received!', 'info');
      setEmail('');
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const editorialDesks = [
    { name: 'Technology & AI', path: '/section/technology' },
    { name: 'News & Reporting', path: '/section/news' },
    { name: 'Education & Admissions', path: '/section/education' },
    { name: 'Business & Economy', path: '/section/business' },
    { name: 'Travel & Culture', path: '/section/travel' },
    { name: 'Reviews & Gear Lab', path: '/blogs?contentType=review' },
  ];

  const regionalEditions = [
    { name: 'Global Edition', path: '/' },
    { name: 'Kashmir Bureau', path: '/kashmir' },
    { name: 'India Edition', path: '/edition/india' },
    { name: 'Srinagar Coverage', path: '/edition/kashmir' },
  ];

  const readerTools = [
    { name: 'All Stories & Archive', path: '/blogs' },
    { name: 'Faceted Search (⌘K)', path: '/search' },
    { name: 'Saved Bookmarks', path: '/saved' },
    { name: 'Topic Directory', path: '/tags' },
    { name: 'RSS Feed (XML)', path: '/feed.xml' },
  ];

  return (
    <footer className="border-t border-zinc-200/80 dark:border-white/10 bg-zinc-50 dark:bg-[#070a12] text-zinc-600 dark:text-zinc-300 transition-colors safe-area-bottom">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 pt-10 sm:pt-16 pb-8 sm:pb-12">
        {/* Top Grid — 4-column on desktop, stacked accordion on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-0 md:gap-10 lg:gap-12 pb-8 sm:pb-14 border-b border-zinc-200/80 dark:border-white/10">
          {/* Brand Column (4 cols) — always visible */}
          <div className="lg:col-span-4 space-y-4 pb-6 md:pb-0">
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white font-black text-sm font-display shadow-md shadow-red-600/20 group-hover:scale-105 transition-transform">
                TB
              </div>
              <span className="text-xl font-black font-display tracking-tight text-zinc-900 dark:text-white">
                Teachy<span className="text-red-600">Blogs</span>
              </span>
            </Link>

            <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 font-sans max-w-sm">
              An independent digital publishing platform providing authoritative technical deep-dives, higher education guides, hardware reviews, and dedicated Kashmir regional journalism.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <Link
                href="/feed.xml"
                target="_blank"
                className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-zinc-500 hover:text-amber-500 transition-colors touch-target"
                aria-label="RSS Feed"
              >
                <Rss className="w-4 h-4" />
              </Link>
              <Link
                href="/kashmir"
                className="px-3 py-1.5 rounded-xl bg-red-600/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-1.5 hover:bg-red-600/20 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" /> Kashmir Bureau
              </Link>
            </div>
          </div>

          {/* Desks Column (2 cols) — collapsible on mobile */}
          <div className="lg:col-span-2 border-t md:border-t-0 border-zinc-200/60 dark:border-white/5">
            <FooterSection title="Editorial Desks">
              <ul className="space-y-2 text-xs font-semibold">
                {editorialDesks.map((d) => (
                  <li key={d.name}>
                    <Link href={d.path} className="text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors py-1 block">
                      {d.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </FooterSection>
          </div>

          {/* Regional & Tools Column (2 cols) — collapsible on mobile */}
          <div className="lg:col-span-2 border-t md:border-t-0 border-zinc-200/60 dark:border-white/5">
            <FooterSection title="Regional & Tools">
              <ul className="space-y-2 text-xs font-semibold">
                {regionalEditions.map((r) => (
                  <li key={r.name}>
                    <Link href={r.path} className="text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors py-1 block">
                      {r.name}
                    </Link>
                  </li>
                ))}
                {readerTools.slice(1, 3).map((t) => (
                  <li key={t.name}>
                    <Link href={t.path} className="text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors py-1 block">
                      {t.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </FooterSection>
          </div>

          {/* Newsletter Column (4 cols) — always visible */}
          <div className="lg:col-span-4 pt-4 md:pt-0 border-t md:border-t-0 border-zinc-200/60 dark:border-white/5">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-white mb-3 pt-3 md:pt-0">
              The Morning Briefing
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-sans mb-3">
              Receive our weekend digest of long-form reporting, software architecture guides, and university alerts.
            </p>
            {/* Mobile: stacked form; Desktop: inline form */}
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="reader@example.com"
                  className="w-full px-4 py-3 sm:py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-sm sm:text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="touch-target px-5 py-3 sm:py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shrink-0"
                aria-label="Subscribe"
              >
                <span>Subscribe</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Masthead & Legal Bar */}
        <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row sm:flex-wrap items-center justify-between gap-4 text-xs text-zinc-400">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1">
            <span>© {new Date().getFullYear()} TeachyBlogs. All rights reserved.</span>
            <span className="hidden sm:inline">·</span>
            <Link href="/about" className="hover:text-zinc-900 dark:hover:text-white py-1">About Masthead</Link>
            <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-white py-1">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-white py-1">Terms</Link>
            <Link href="/contact" className="hover:text-zinc-900 dark:hover:text-white py-1">Newsroom Contact</Link>
          </div>

          <button
            onClick={scrollToTop}
            className="touch-target flex items-center gap-1.5 text-xs font-bold hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
