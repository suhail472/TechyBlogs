'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PortfolioNavbar() {
  const [activeTab, setActiveTab] = useState('HOME');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'HOME', href: '#home' },
    { label: 'ABOUT', href: '#about' },
    { label: 'SKILLS', href: '#skills' },
    { label: 'PROJECTS', href: '#projects' },
    { label: 'EXPERIENCE', href: '#experience' },
    { label: 'BLOG', href: '/blogs' },
    { label: 'CONTACT', href: '#contact' },
  ];

  return (
    <header className="w-full pt-6 pb-4 px-6 md:px-12 lg:px-16 max-w-[1440px] mx-auto relative z-40 select-none">
      <nav className="flex items-center justify-between">
        {/* Brand Logo: </> */}
        <Link href="/" className="flex items-center gap-1 group">
          <div className="flex items-center text-2xl md:text-3xl font-black tracking-tighter">
            <span className="text-[#FF5722] transform -translate-x-0.5">&lt;</span>
            <span className="text-[#1E2229] font-black text-2xl md:text-3xl transform -rotate-12 mx-0.5">/</span>
            <span className="text-[#1E2229] transform translate-x-0.5">&gt;</span>
          </div>
        </Link>

        {/* Desktop Nav Items */}
        <div className="hidden lg:flex items-center gap-8 xl:gap-10">
          {navLinks.map((link) => {
            const isActive = activeTab === link.label;
            return (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setActiveTab(link.label)}
                className="relative py-2 text-xs font-black tracking-wider uppercase transition-colors"
              >
                <span
                  className={`${
                    isActive ? 'text-[#FF5722]' : 'text-[#1E2229] hover:text-[#FF5722]'
                  } transition-colors duration-200`}
                >
                  {link.label}
                </span>
                {isActive && (
                  <motion.span
                    layoutId="activeNavDot"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#FF5722] shadow-[0_0_8px_#FF5722]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </a>
            );
          })}
        </div>

        {/* Desktop CTA Button: LET'S CONNECT ↗ */}
        <div className="hidden sm:flex items-center gap-4">
          <a
            href="#contact"
            className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-zinc-300 bg-white/80 hover:bg-white text-zinc-900 hover:text-[#FF5722] hover:border-[#FF5722] text-xs font-bold tracking-wider uppercase transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <span>LET&apos;S CONNECT</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-[#FF5722] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
          </a>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-xl bg-white border border-zinc-200 text-zinc-800 hover:text-[#FF5722] transition-colors"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden absolute top-full left-6 right-6 mt-2 p-5 bg-white/95 backdrop-blur-xl border border-zinc-200 rounded-2xl shadow-xl space-y-3 z-50"
          >
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => {
                    setActiveTab(link.label);
                    setMobileMenuOpen(false);
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-between ${
                    activeTab === link.label ? 'bg-orange-50 text-[#FF5722]' : 'text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  <span>{link.label}</span>
                  {activeTab === link.label && <span className="w-1.5 h-1.5 rounded-full bg-[#FF5722]" />}
                </a>
              ))}
            </div>

            <div className="pt-2 border-t border-zinc-100">
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-full bg-[#FF5722] text-white text-xs font-bold tracking-wider uppercase shadow-md shadow-orange-500/25"
              >
                <span>LET&apos;S CONNECT</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
