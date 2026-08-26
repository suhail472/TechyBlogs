'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─────────────────────────────────────────────
   PortfolioHero – pixel-perfect replica of the
   reference design image provided by the user.
   ───────────────────────────────────────────── */

export default function PortfolioHero() {
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  return (
    <section
      id="home"
      className="relative w-full overflow-hidden"
      style={{ background: '#FAFAFA' }}
    >
      {/* ───── BACKGROUND EFFECTS ───── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top-right warm orange ambient glow */}
        <div
          className="absolute hidden lg:block"
          style={{
            top: '-5%',
            right: '-8%',
            width: 700,
            height: 700,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,120,40,0.13) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        {/* Bottom-right orange glow */}
        <div
          className="absolute hidden lg:block"
          style={{
            bottom: '2%',
            right: '-2%',
            width: 600,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,120,40,0.15) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }}
        />
        {/* Large dashed orbital arc (behind laptop) */}
        <svg
          className="absolute hidden lg:block"
          style={{ top: '-10%', right: '0%', width: 900, height: 900, opacity: 0.5 }}
          viewBox="0 0 900 900"
          fill="none"
        >
          <circle
            cx="450" cy="450" r="380"
            stroke="url(#oGrad)" strokeWidth="1.5" strokeDasharray="8 10" fill="none"
          />
          <circle
            cx="450" cy="450" r="400"
            stroke="rgba(255,120,40,0.08)" strokeWidth="1" fill="none"
          />
          <defs>
            <linearGradient id="oGrad" x1="0" y1="0" x2="900" y2="900" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF6B22" stopOpacity="0.7" />
              <stop offset="0.5" stopColor="#FFA040" stopOpacity="0.3" />
              <stop offset="1" stopColor="#FF6B22" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
        {/* World dot-matrix texture behind laptop */}
        <div
          className="absolute hidden md:block"
          style={{
            top: 60,
            right: 40,
            width: 550,
            height: 380,
            opacity: 0.2,
            backgroundImage: 'radial-gradient(circle, #d4a26a 1px, transparent 1px)',
            backgroundSize: '14px 14px',
            maskImage: 'radial-gradient(circle at 55% 45%, black 15%, transparent 65%)',
            WebkitMaskImage: 'radial-gradient(circle at 55% 45%, black 15%, transparent 65%)',
          }}
        />
        {/* 3D perspective floor grid */}
        <div
          className="absolute hidden lg:block"
          style={{
            bottom: -30,
            left: '50%',
            transform: 'translateX(-50%) perspective(500px) rotateX(68deg) scale(1.5)',
            transformOrigin: 'bottom center',
            width: '130%',
            height: 350,
            opacity: 0.3,
            backgroundImage:
              'linear-gradient(to right, rgba(255,120,40,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,120,40,0.12) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
            maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, transparent 75%)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, transparent 75%)',
          }}
        />
      </div>

      {/* ───── MAIN CONTENT ───── */}
      <div className="relative z-10 max-w-[1280px] mx-auto px-6 md:px-10 lg:px-14 pt-8 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-0 items-start">

          {/* ═══════════════════════════════════
              LEFT COLUMN – Text, CTAs, Tech Row
              ═══════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="pt-4 lg:pt-10 space-y-5"
          >
            {/* Eyebrow: HELLO, I'M — */}
            <div className="flex items-center gap-2.5">
              <span
                style={{ color: '#FF5722', fontWeight: 800, fontSize: 13, letterSpacing: '0.18em', textTransform: 'uppercase' }}
              >
                HELLO, I&apos;M
              </span>
              <span style={{ width: 22, height: 2, background: '#FF5722', opacity: 0.5, borderRadius: 2 }} />
            </div>

            {/* Main headline */}
            <h1 style={{ lineHeight: 1.05, margin: 0 }}>
              <span
                style={{
                  display: 'block',
                  fontSize: 'clamp(2.8rem, 5.5vw, 4.5rem)',
                  fontWeight: 900,
                  color: '#111317',
                  fontFamily: 'var(--font-display), Inter, sans-serif',
                  letterSpacing: '-0.02em',
                }}
              >
                I BUILD
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: 'clamp(2.8rem, 5.5vw, 4.5rem)',
                  fontWeight: 900,
                  color: '#FF5722',
                  fontFamily: 'var(--font-display), Inter, sans-serif',
                  letterSpacing: '-0.02em',
                }}
              >
                DIGITAL EXPERIENCES
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: 'clamp(2.8rem, 5.5vw, 4.5rem)',
                  fontWeight: 900,
                  color: '#111317',
                  fontFamily: 'var(--font-display), Inter, sans-serif',
                  letterSpacing: '-0.02em',
                }}
              >
                THAT MAKE IMPACT<span style={{ color: '#FF5722' }}>.</span>
              </span>
            </h1>

            {/* Subtitle */}
            <p style={{ color: '#555', fontSize: 15, lineHeight: 1.7, maxWidth: 420, margin: 0, fontWeight: 400 }}>
              Full Stack Developer &amp; UI/UX Designer crafting
              scalable, responsive and high performance web
              applications.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-5 pt-1">
              {/* VIEW MY WORK */}
              <a
                href="#projects"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '14px 28px',
                  borderRadius: 50,
                  background: '#FF5722',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  boxShadow: '0 10px 30px -8px rgba(255,87,34,0.45)',
                  transition: 'all 0.2s',
                }}
                className="hover:shadow-[0_14px_36px_-8px_rgba(255,87,34,0.6)] hover:scale-[1.02] active:scale-[0.98]"
              >
                VIEW MY WORK
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
              </a>
              {/* WATCH INTRO */}
              <button
                type="button"
                onClick={() => setVideoModalOpen(true)}
                className="group"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 12,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <span
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'rgba(255,87,34,0.08)',
                    border: '1.5px solid rgba(255,87,34,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  className="group-hover:!bg-[#FF5722] group-hover:!border-[#FF5722] transition-all"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#FF5722" stroke="none" className="ml-0.5 group-hover:!fill-white transition-colors">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </span>
                <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#111' }}>
                  WATCH INTRO
                </span>
              </button>
            </div>

            {/* TECHNOLOGIES I WORK WITH */}
            <div className="pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#999' }}>
                  TECHNOLOGIES I WORK WITH
                </span>
                <span style={{ width: 12, height: 1, background: '#ccc' }} />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {/* React */}
                <TechIcon title="React">
                  <svg width="22" height="22" viewBox="-11.5 -10.23 23 20.46">
                    <circle cx="0" cy="0" r="2.05" fill="#61DAFB" />
                    <g stroke="#61DAFB" strokeWidth="1" fill="none">
                      <ellipse rx="11" ry="4.2" />
                      <ellipse rx="11" ry="4.2" transform="rotate(60)" />
                      <ellipse rx="11" ry="4.2" transform="rotate(120)" />
                    </g>
                  </svg>
                </TechIcon>
                {/* Next.js */}
                <TechIcon title="Next.js">
                  <span style={{ width: 22, height: 22, borderRadius: '50%', border: '1.5px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#222' }}>N</span>
                </TechIcon>
                {/* Node.js */}
                <TechIcon title="Node.js" bg="#539E43">
                  <span style={{ fontSize: 10, fontWeight: 900, color: '#fff' }}>JS</span>
                </TechIcon>
                {/* TypeScript */}
                <TechIcon title="TypeScript" bg="#3178C6" borderColor="#3178C6">
                  <span style={{ fontSize: 10, fontWeight: 900, color: '#fff' }}>TS</span>
                </TechIcon>
                {/* MongoDB */}
                <TechIcon title="MongoDB">
                  <svg width="16" height="22" viewBox="0 0 24 36" fill="#47A248">
                    <path d="M15.82 7.04C14.15 3.6 12.2 1.5 11.8 1.04a.5.5 0 0 0-.6 0c-.4.46-2.35 2.56-4.02 5.96C5.6 11.14 7 14.8 10.2 17.8c.2.18.5.18.7 0 3.2-3 4.6-6.66 3-10.76h-.08z" />
                    <path d="M12 18.6v-9.2c0-.22-.3-.34-.46-.2-1.6 1.4-2.54 3.2-2.54 5.4 0 2.1.94 3.9 2.54 5.2.16.14.46.02.46-.2v-1z" fill="#3FA037" />
                  </svg>
                </TechIcon>
                {/* Tailwind */}
                <TechIcon title="Tailwind CSS">
                  <svg width="20" height="14" viewBox="0 0 54 33" fill="#38B2AC">
                    <path d="M27 0c-7.2 0-11.7 3.6-13.5 10.8 2.7-3.6 5.85-4.95 9.45-4.05 2.054.513 3.522 2.004 5.147 3.653C30.744 13.09 33.808 16.2 40.5 16.2c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.513-3.522-2.004-5.147-3.653C36.756 3.11 33.692 0 27 0zM13.5 16.2C6.3 16.2 1.8 19.8 0 27c2.7-3.6 5.85-4.95 9.45-4.05 2.054.514 3.522 2.004 5.147 3.653C17.244 29.29 20.308 32.4 27 32.4c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.514-3.522-2.004-5.147-3.653C23.256 19.31 20.192 16.2 13.5 16.2z" />
                  </svg>
                </TechIcon>
                {/* More */}
                <TechIcon title="And more...">
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#888', letterSpacing: 2 }}>•••</span>
                </TechIcon>
              </div>
            </div>
          </motion.div>

          {/* ═══════════════════════════════════════
              RIGHT COLUMN – Laptop + Floating Cards
              ═══════════════════════════════════════ */}
          <div className="relative flex items-start justify-center lg:justify-end min-h-[420px] sm:min-h-[500px] lg:min-h-[560px]">

            {/* Laptop Image (using a realistic SVG laptop frame with code screen) */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.93 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-20 mt-10 lg:mt-6"
              style={{ width: '100%', maxWidth: 560 }}
            >
              {/* Shadow under laptop */}
              <div
                style={{
                  position: 'absolute',
                  bottom: -10,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '82%',
                  height: 20,
                  background: 'rgba(0,0,0,0.2)',
                  filter: 'blur(18px)',
                  borderRadius: '50%',
                }}
              />

              {/* Laptop Frame – Screen */}
              <div
                style={{
                  background: '#1a1a2e',
                  borderRadius: '14px 14px 0 0',
                  padding: '8px 8px 0 8px',
                  border: '2px solid #555',
                  borderBottom: 'none',
                  boxShadow: '0 30px 60px -15px rgba(0,0,0,0.5)',
                  transform: 'perspective(1200px) rotateY(-6deg) rotateX(4deg)',
                }}
              >
                {/* Camera dot */}
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#444', margin: '0 auto 4px' }} />

                {/* IDE Screen */}
                <div style={{ background: '#0d1117', borderRadius: '8px 8px 0 0', overflow: 'hidden', border: '1px solid #2d333b' }}>
                  {/* Window controls bar */}
                  <div style={{ background: '#161b22', padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2d333b' }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF5F56' }} />
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FFBD2E' }} />
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#27C93F' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, fontSize: 9, fontFamily: 'monospace' }}>
                      <span style={{ color: '#FF7B4A', fontWeight: 700, borderTop: '2px solid #FF5722', padding: '0 6px 0', lineHeight: '18px' }}>App.tsx</span>
                      <span style={{ color: '#555', padding: '0 6px', lineHeight: '18px' }}>styles.css</span>
                    </div>
                    <div style={{ width: 16 }} />
                  </div>

                  {/* Code Content */}
                  <div style={{ padding: '12px 14px', fontFamily: "'Fira Code', 'SF Mono', Monaco, monospace", fontSize: 10.5, lineHeight: 1.9, color: '#c9d1d9', minHeight: 170 }}>
                    <CodeLine n="01"><S c="#E5C07B">import</S> <S c="#61AFEF">React</S> <S c="#E5C07B">from</S> <S c="#98C379">&apos;react&apos;</S>;</CodeLine>
                    <CodeLine n="02"><S c="#C678DD">export default function</S> <S c="#61AFEF">App</S>() {'{'}</CodeLine>
                    <CodeLine n="03" indent={1}><S c="#E5C07B">const</S> <S c="#E06C75">config</S> = {'{'} <S c="#D19A66">speed</S>: <S c="#98C379">&apos;blazing&apos;</S> {'}'}</CodeLine>
                    <CodeLine n="04" indent={1}><S c="#C678DD">return</S> (</CodeLine>
                    <CodeLine n="05" indent={2}><S c="#E06C75">&lt;Portfolio</S> <S c="#D19A66">impact</S>=<S c="#98C379">&quot;high&quot;</S> <S c="#E06C75">/&gt;</S></CodeLine>
                    <CodeLine n="06" indent={1}>)</CodeLine>
                    <CodeLine n="07">{'}'}</CodeLine>
                  </div>
                </div>
              </div>

              {/* Laptop Base (keyboard deck + trackpad) */}
              <div
                style={{
                  background: 'linear-gradient(to bottom, #c8cad0, #a0a4ab)',
                  borderRadius: '0 0 14px 14px',
                  height: 18,
                  borderTop: '2px solid #b0b4ba',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: 'perspective(1200px) rotateY(-6deg) rotateX(4deg)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
              >
                <div style={{ width: 55, height: 3, background: 'rgba(0,0,0,0.15)', borderRadius: 10 }} />
              </div>
            </motion.div>

            {/* ─── FLOATING CARD: PERFORMANCE (top center-left) ─── */}
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
              className="absolute z-30"
              style={{ top: 0, left: '18%' }}
            >
              <GlassCard style={{ padding: '14px 18px', textAlign: 'center', minWidth: 150 }}>
                {/* Badge header */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,87,34,0.08)', border: '1px solid rgba(255,87,34,0.15)', borderRadius: 6, padding: '2px 8px', marginBottom: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: '#FF5722' }} />
                  <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#222' }}>PERFORMANCE</span>
                </div>
                {/* Circular gauge */}
                <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto' }}>
                  <svg width="80" height="80" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="18" cy="18" r="15.5" stroke="#eee" strokeWidth="3" fill="none" />
                    <circle cx="18" cy="18" r="15.5" stroke="#FF5722" strokeWidth="3" fill="none" strokeDasharray="95.5 100" strokeLinecap="round" />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 22, fontWeight: 900, color: '#111', lineHeight: 1 }}>98</span>
                    <span style={{ fontSize: 8, color: '#999', fontWeight: 600 }}>/100</span>
                  </div>
                </div>
                <div style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.2em', color: '#999', textTransform: 'uppercase', marginTop: 6 }}>LIGHTHOUSE SCORE</div>
              </GlassCard>
            </motion.div>

            {/* ─── FLOATING CARD: CONNECTED (mid-right, small green badge) ─── */}
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="absolute z-30 hidden lg:block"
              style={{ top: '42%', right: '5%' }}
            >
              <GlassCard style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }} />
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: '#10B981', textTransform: 'uppercase' }}>CONNECTED</span>
              </GlassCard>
            </motion.div>

            {/* ─── FLOATING CARD: </> Code card (top right) ─── */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="absolute z-30 hidden lg:block"
              style={{ top: '5%', right: '-2%' }}
            >
              <GlassCard style={{ padding: '14px 16px', minWidth: 130 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,87,34,0.08)', border: '1px solid rgba(255,87,34,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#FF5722', fontFamily: 'monospace' }}>
                    &lt;/&gt;
                  </div>
                  <div>
                    <div style={{ width: 40, height: 5, borderRadius: 4, background: '#FF5722', marginBottom: 4 }} />
                    <div style={{ width: 28, height: 3, borderRadius: 4, background: '#ddd' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ width: '100%', height: 3, borderRadius: 4, background: '#eee' }} />
                  <div style={{ width: '75%', height: 3, borderRadius: 4, background: '#eee' }} />
                </div>
              </GlassCard>
            </motion.div>

            {/* ─── FLOATING CARD: CLEAN CODE (middle left, overlapping laptop) ─── */}
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.55 }}
              className="absolute z-30"
              style={{ bottom: '20%', left: '2%' }}
            >
              <GlassCard style={{ padding: '14px 18px', minWidth: 140 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.08em', color: '#222', textTransform: 'uppercase' }}>CLEAN CODE</span>
                  <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,87,34,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FF5722" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#FF5722' }} />
                    <div style={{ width: 50, height: 4, borderRadius: 4, background: 'rgba(255,87,34,0.2)' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ddd' }} />
                    <div style={{ width: 60, height: 3, borderRadius: 4, background: '#eee' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#FF5722' }} />
                    <div style={{ width: 42, height: 3, borderRadius: 4, background: '#eee' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ddd' }} />
                    <div style={{ width: 36, height: 3, borderRadius: 4, background: '#eee' }} />
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* ─── FLOATING CARD: FULL STACK (right side) ─── */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="absolute z-30 hidden lg:block"
              style={{ bottom: '18%', right: '-4%' }}
            >
              <GlassCard style={{ padding: '14px 18px', minWidth: 155 }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.08em', color: '#222', textTransform: 'uppercase', marginBottom: 10 }}>
                  FULL STACK
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  {/* 3D layers icon */}
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,87,34,0.08)', border: '1px solid rgba(255,87,34,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF5722" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 2 7 12 12 22 7 12 2" />
                      <polyline points="2 17 12 22 22 17" />
                      <polyline points="2 12 12 17 22 12" />
                    </svg>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 10, fontWeight: 600, color: '#666' }}>
                    <span>Frontend</span>
                    <span>Backend</span>
                    <span>Database</span>
                    <span>DevOps</span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ───── BOTTOM STATS BAR ───── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-20 max-w-[1280px] mx-auto px-6 md:px-10 lg:px-14 pb-10"
      >
        <div
          style={{
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(0,0,0,0.06)',
            borderRadius: 24,
            padding: '20px 28px',
            boxShadow: '0 16px 48px -12px rgba(0,0,0,0.08)',
          }}
          className="flex flex-col lg:flex-row items-center justify-between gap-6"
        >
          {/* 4 Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 lg:gap-10 w-full lg:w-auto">
            <StatItem icon="user" value="3+" label="YEARS EXPERIENCE" />
            <StatItem icon="code" value="20+" label="PROJECTS COMPLETED" />
            <StatItem icon="smile" value="15+" label="HAPPY CLIENTS" />
            <StatItem icon="star" value="5/5" label="CLIENT RATING" />
          </div>

          {/* Availability + Scroll */}
          <div className="flex items-center gap-6 pt-3 lg:pt-0 border-t lg:border-t-0 border-zinc-100 w-full lg:w-auto justify-between lg:justify-end">
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.2em', color: '#999', textTransform: 'uppercase', display: 'block' }}>
                AVAILABLE FOR
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: '0.08em', color: '#111', textTransform: 'uppercase' }}>
                  FREELANCE PROJECTS
                </span>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 10px #10B981', display: 'inline-block' }} />
              </div>
            </div>
            <a
              href="#about"
              aria-label="Scroll down"
              style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                background: '#f5f5f5',
                border: '1px solid #e5e5e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.2s',
              }}
              className="hover:!bg-[#FF5722] hover:!border-[#FF5722] hover:!text-white group"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600 group-hover:text-white transition-colors">
                <line x1="12" y1="5" x2="12" y2="19" />
                <polyline points="19 12 12 19 5 12" />
              </svg>
            </a>
          </div>
        </div>
      </motion.div>

      {/* ─── VIDEO MODAL ─── */}
      <AnimatePresence>
        {videoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setVideoModalOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 24, maxWidth: 640, width: '100%', padding: 24, boxShadow: '0 25px 60px -12px rgba(0,0,0,0.3)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>Intro &amp; Showcase</span>
                <button type="button" onClick={() => setVideoModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#999' }}>✕</button>
              </div>
              <div style={{ background: '#0d1117', borderRadius: 16, aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: '#fff' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,87,34,0.2)', border: '2px solid #FF5722', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#FF5722"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                  </div>
                  <p style={{ fontSize: 11, color: '#777' }}>Video coming soon</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ─── Helper Components ─── */

function GlassCard({ children, style = {}, className = '' }) {
  return (
    <div
      className={className}
      style={{
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(0,0,0,0.06)',
        borderRadius: 16,
        boxShadow: '0 12px 32px -8px rgba(0,0,0,0.08)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function TechIcon({ children, title, bg, borderColor }) {
  return (
    <div
      title={title}
      style={{
        width: 44,
        height: 44,
        borderRadius: 14,
        background: bg || 'rgba(255,255,255,0.95)',
        border: `1px solid ${borderColor || 'rgba(0,0,0,0.08)'}`,
        boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      className="hover:shadow-md hover:-translate-y-0.5"
    >
      {children}
    </div>
  );
}

function StatItem({ icon, value, label }) {
  const icons = {
    user: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF5722" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
    code: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF5722" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>,
    smile: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF5722" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>,
    star: <svg width="18" height="18" viewBox="0 0 24 24" fill="#FF5722" stroke="#FF5722" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 14, background: 'rgba(255,87,34,0.06)', border: '1px solid rgba(255,87,34,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icons[icon]}
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#111', lineHeight: 1 }}>{value}</div>
        <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.15em', color: '#999', textTransform: 'uppercase', display: 'block', marginTop: 2 }}>{label}</span>
      </div>
    </div>
  );
}

function CodeLine({ n, children, indent = 0 }) {
  return (
    <div style={{ display: 'flex', gap: 10, paddingLeft: indent * 16 }}>
      <span style={{ color: '#484f58', fontSize: 9, fontFamily: 'monospace', userSelect: 'none', minWidth: 14, textAlign: 'right' }}>{n}</span>
      <span>{children}</span>
    </div>
  );
}

function S({ c, children }) {
  return <span style={{ color: c }}>{children}</span>;
}
