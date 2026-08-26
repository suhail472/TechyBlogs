'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function PortfolioNavbar() {
  const [activeTab, setActiveTab] = useState('HOME');
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { label: 'HOME', href: '#home' },
    { label: 'ABOUT', href: '#about' },
    { label: 'SKILLS', href: '#skills' },
    { label: 'PROJECTS', href: '#projects' },
    { label: 'EXPERIENCE', href: '#experience' },
    { label: 'BLOG', href: '/blogs' },
    { label: 'CONTACT', href: '#contact' },
  ];

  return (
    <header
      style={{
        width: '100%',
        padding: '20px 0 12px',
        position: 'relative',
        zIndex: 40,
        background: 'transparent',
      }}
    >
      <nav
        className="max-w-[1280px] mx-auto px-6 md:px-10 lg:px-14"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        {/* Brand Logo: </> */}
        <Link href="/portfolio" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 1 }}>
          <span style={{ fontSize: 28, fontWeight: 900, color: '#FF5722', lineHeight: 1 }}>&lt;</span>
          <span style={{ fontSize: 26, fontWeight: 900, color: '#111', lineHeight: 1, transform: 'rotate(-12deg)', display: 'inline-block', margin: '0 1px' }}>/</span>
          <span style={{ fontSize: 28, fontWeight: 900, color: '#111', lineHeight: 1 }}>&gt;</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center" style={{ gap: 36 }}>
          {links.map((link) => {
            const isActive = activeTab === link.label;
            return (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setActiveTab(link.label)}
                style={{
                  position: 'relative',
                  fontSize: 11.5,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: isActive ? '#FF5722' : '#222',
                  textDecoration: 'none',
                  padding: '8px 0',
                  transition: 'color 0.2s',
                }}
                className="hover:!text-[#FF5722]"
              >
                {link.label}
                {isActive && (
                  <motion.span
                    layoutId="navDot"
                    style={{
                      position: 'absolute',
                      bottom: -2,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: '#FF5722',
                      boxShadow: '0 0 8px #FF5722',
                    }}
                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  />
                )}
              </a>
            );
          })}
        </div>

        {/* Desktop CTA */}
        <div className="hidden sm:block">
          <a
            href="#contact"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 22px',
              borderRadius: 50,
              border: '1.5px solid #ddd',
              background: '#fff',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#222',
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}
            className="hover:!border-[#FF5722] hover:!text-[#FF5722] hover:shadow-md"
          >
            LET&apos;S CONNECT
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </a>
        </div>

        {/* Mobile Toggle */}
        <button
          type="button"
          className="lg:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{ background: '#fff', border: '1px solid #eee', borderRadius: 10, padding: 8, cursor: 'pointer' }}
        >
          {mobileOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          )}
        </button>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="lg:hidden"
            style={{
              position: 'absolute',
              top: '100%',
              left: 24,
              right: 24,
              background: 'rgba(255,255,255,0.97)',
              backdropFilter: 'blur(16px)',
              border: '1px solid #eee',
              borderRadius: 16,
              padding: 16,
              boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
              zIndex: 50,
            }}
          >
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => { setActiveTab(link.label); setMobileOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  color: activeTab === link.label ? '#FF5722' : '#444',
                  background: activeTab === link.label ? 'rgba(255,87,34,0.06)' : 'transparent',
                }}
              >
                {link.label}
                {activeTab === link.label && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#FF5722' }} />}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
