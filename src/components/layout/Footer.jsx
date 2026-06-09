'use client';

import Link from 'next/link';
import { ArrowRight, Heart, Rss } from 'lucide-react';

const Footer = () => {
  const handleSubscribe = (e) => {
    e.preventDefault();
    alert('Subscribed successfully to newsletter!');
  };

  const quickLinks = [
    { name: 'Home', path: '/' },
    { name: 'Blogs Archive', path: '/blogs' },
    { name: 'Browse Tags', path: '/tags' },
    { name: 'Saved Articles', path: '/saved' },
    { name: 'About Author', path: '/about' },
    { name: 'Contact Info', path: '/contact' },
  ];

  const categories = [
    { name: 'Design', path: '/blogs?category=Design' },
    { name: 'Tech', path: '/blogs?category=Tech' },
    { name: 'React', path: '/blogs?category=React' },
    { name: 'CSS', path: '/blogs?category=CSS' },
  ];

  return (
    <footer className="relative border-t transition-colors duration-300 border-zinc-200/80 dark:border-white/[0.04] bg-white dark:bg-[#070a12] text-zinc-600 dark:text-zinc-300">
      {/* Gradient accent at top */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
      
      <div className="container mx-auto px-6 md:px-12 pt-20 pb-12 max-w-7xl relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16 mb-16">
          
          {/* Brand Column */}
          <div className="md:col-span-4 space-y-6">
            <Link href="/" className="group flex items-center gap-2.5 text-xl font-bold tracking-tight">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-sm transition-transform group-hover:scale-[1.05] shadow-lg shadow-blue-500/15">T</div>
              <span className="text-zinc-900 dark:text-white font-display">Techy<span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent font-extrabold">Blogs</span></span>
            </Link>
            
            <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              An editorial project sharing modern web architecture insights, React components development patterns, and CSS design tokens guides.
            </p>

            {/* Social + RSS links */}
            <div className="flex gap-2.5">
              <a
                href="/feed.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 glass-card hover:-translate-y-0.5 hover:shadow-md hover:shadow-orange-500/5 text-zinc-500 hover:text-orange-500 dark:text-zinc-400 dark:hover:text-orange-400"
                aria-label="RSS Feed"
              >
                <Rss className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 glass-card hover:-translate-y-0.5 hover:shadow-md hover:shadow-blue-500/5 text-zinc-500 hover:text-blue-500 dark:text-zinc-400 dark:hover:text-blue-400"
                aria-label="Twitter"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 glass-card hover:-translate-y-0.5 hover:shadow-md hover:shadow-blue-500/5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                aria-label="GitHub"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.193 22 16.44 22 12.017 22 6.484 17.522 2 12 2z"/>
                </svg>
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 glass-card hover:-translate-y-0.5 hover:shadow-md hover:shadow-blue-500/5 text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400"
                aria-label="LinkedIn"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick links Column */}
          <div className="md:col-span-2 sm:col-span-6">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-6">
              Navigation
            </h4>
            <ul className="space-y-3.5 text-sm font-semibold">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.path} 
                    className="inline-block transition-all duration-200 text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 hover:translate-x-1"
                  >
                    <span>{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories Column */}
          <div className="md:col-span-2 sm:col-span-6">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-6">
              Categories
            </h4>
            <ul className="space-y-3.5 text-sm font-semibold">
              {categories.map((cat) => (
                <li key={cat.name}>
                  <Link 
                    href={cat.path} 
                    className="inline-block transition-all duration-200 text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 hover:translate-x-1"
                  >
                    <span>{cat.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="md:col-span-4 space-y-6">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-6">
              Author's Newsletter
            </h4>
            <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              Join 5,000+ developers receiving our weekly digests of code layouts and design techniques.
            </p>
            <form onSubmit={handleSubscribe} className="relative flex items-center max-w-sm">
              <input 
                type="email" 
                placeholder="email@example.com" 
                className="w-full pl-4 pr-12 py-3.5 text-xs rounded-xl border outline-none transition-all focus:border-blue-400/40 focus:ring-2 focus:ring-blue-500/10 dark:focus:border-blue-500/30 bg-white/80 border-zinc-200/80 text-zinc-900 placeholder-zinc-400 dark:bg-white/[0.03] dark:border-white/[0.06] dark:text-white dark:placeholder-zinc-500"
                required
              />
              <button 
                type="submit" 
                className="absolute right-1.5 p-2.5 rounded-lg transition-all flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/15 hover:shadow-lg"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>

        {/* Bottom copyright legal row */}
        <div className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold border-zinc-200/50 dark:border-white/[0.04] text-zinc-400 dark:text-zinc-500">
          <div className="flex items-center gap-1">
            &copy; {new Date().getFullYear()} TechyBlogs. Made with <Heart className="w-3 h-3 text-rose-500 fill-rose-500 inline mx-0.5" /> by Suheel Hilal.
          </div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">Terms of Service</Link>
            <Link href="/cookies" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">Cookies Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
