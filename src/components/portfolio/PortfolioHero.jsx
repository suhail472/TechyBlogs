'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpRight,
  Play,
  User,
  Code2,
  Smile,
  Star,
  ArrowDown,
  Sparkles,
  Zap,
  CheckCircle,
  Layers,
  X,
} from 'lucide-react';

export default function PortfolioHero() {
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  return (
    <section className="relative min-h-[92vh] flex flex-col justify-between overflow-hidden px-4 sm:px-6 md:px-12 lg:px-16 pt-4 pb-8 max-w-[1440px] mx-auto select-none">
      {/* ========================================================================= */}
      {/* 1. ATMOSPHERIC BACKGROUND EFFECTS: 3D Floor Grid, Orbital Rings & Ambient */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Subtle warm ambient radial light spots */}
        <div className="absolute top-[10%] right-[20%] w-[550px] h-[550px] rounded-full bg-gradient-to-br from-orange-400/15 via-amber-300/10 to-transparent blur-[120px]" />
        <div className="absolute bottom-[15%] left-[10%] w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-orange-500/10 via-amber-200/5 to-transparent blur-[100px]" />
        <div className="absolute bottom-0 right-[5%] w-[600px] h-[350px] rounded-full bg-orange-400/10 blur-[110px]" />

        {/* 3D Perspective Isometric Floor Grid */}
        <div
          className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[140%] h-[400px] opacity-40"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 107, 0, 0.15) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 107, 0, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
            transform: 'perspective(600px) rotateX(65deg) scale(1.4)',
            transformOrigin: 'bottom center',
            maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)',
          }}
        />

        {/* Giant Glowing Curved Orbital Dashed Ring (Behind Laptop) */}
        <svg
          className="absolute top-[4%] right-[-5%] w-[850px] h-[850px] opacity-60 hidden lg:block"
          viewBox="0 0 800 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="400"
            cy="400"
            r="360"
            stroke="url(#orbitGradient)"
            strokeWidth="1.5"
            strokeDasharray="6 8"
          />
          <circle
            cx="400"
            cy="400"
            r="380"
            stroke="rgba(255, 107, 0, 0.12)"
            strokeWidth="1"
          />
          <defs>
            <linearGradient id="orbitGradient" x1="0" y1="0" x2="800" y2="800" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF5722" stopOpacity="0.8" />
              <stop offset="0.5" stopColor="#FFA000" stopOpacity="0.4" />
              <stop offset="1" stopColor="#FF5722" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Subtle World Map Dot Matrix Texture */}
        <div
          className="absolute top-12 right-6 w-[650px] h-[400px] opacity-25 hidden md:block"
          style={{
            backgroundImage: 'radial-gradient(circle, #D97706 1.2px, transparent 1.2px)',
            backgroundSize: '16px 16px',
            maskImage: 'radial-gradient(circle at 60% 50%, black 20%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(circle at 60% 50%, black 20%, transparent 70%)',
          }}
        />
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN HERO TWO-COLUMN CONTENT                                           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center relative z-10 pt-4 md:pt-6">
        {/* ----------------------------------------------------------------------- */}
        {/* LEFT COLUMN: Typography, Pitch, CTAs & Technologies                     */}
        {/* ----------------------------------------------------------------------- */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 xl:col-span-5 space-y-6 md:space-y-7"
        >
          {/* Eyebrow Label: HELLO, I'M — */}
          <div className="flex items-center gap-2">
            <span className="text-[#FF5722] font-black text-xs sm:text-[13px] tracking-[0.2em] uppercase">
              HELLO, I&apos;M
            </span>
            <span className="w-6 h-[2px] bg-[#FF5722]/60 rounded-full" />
          </div>

          {/* Main Hero Headline: 3 Lines in Impact Typography */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl xl:text-[4.2rem] font-black leading-[1.04] tracking-tight text-[#111317]">
            <span className="block text-[#111317]">I BUILD</span>
            <span className="block text-[#FF5722] drop-shadow-[0_2px_12px_rgba(255,87,34,0.2)]">
              DIGITAL EXPERIENCES
            </span>
            <span className="block text-[#111317]">
              THAT MAKE IMPACT<span className="text-[#FF5722]">.</span>
            </span>
          </h1>

          {/* Subtitle Paragraph */}
          <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-[15px] md:text-base leading-relaxed max-w-lg font-medium">
            Full Stack Developer &amp; UI/UX Designer crafting scalable, responsive and high performance web applications.
          </p>

          {/* Call-to-Actions (Buttons) */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-1">
            {/* Primary Orange Pill CTA */}
            <a
              href="#projects"
              className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-gradient-to-r from-[#FF5722] to-[#FF6E26] text-white text-xs sm:text-[13px] font-black tracking-wider uppercase shadow-[0_12px_24px_-6px_rgba(255,87,34,0.45)] hover:shadow-[0_16px_32px_-6px_rgba(255,87,34,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <span>VIEW MY WORK</span>
              <ArrowUpRight className="w-4 h-4 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>

            {/* Secondary Watch Intro Button */}
            <button
              type="button"
              onClick={() => setVideoModalOpen(true)}
              className="group inline-flex items-center gap-3 py-2 px-1 text-zinc-900 dark:text-white text-xs sm:text-[13px] font-black tracking-wider uppercase hover:text-[#FF5722] transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-[#FF5722]/10 border border-[#FF5722]/25 group-hover:bg-[#FF5722] group-hover:border-[#FF5722] flex items-center justify-center transition-all duration-200 shadow-sm">
                <Play className="w-3.5 h-3.5 fill-[#FF5722] text-[#FF5722] group-hover:fill-white group-hover:text-white transition-colors ml-0.5" />
              </div>
              <span>WATCH INTRO</span>
            </button>
          </div>

          {/* TECHNOLOGIES I WORK WITH — */}
          <div className="space-y-3 pt-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold tracking-widest text-zinc-400 uppercase">
                TECHNOLOGIES I WORK WITH
              </span>
              <span className="w-4 h-[1px] bg-zinc-300 dark:bg-zinc-700" />
            </div>

            {/* Row of 7 Squircle Tech Cards */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              {/* 1. React */}
              <div className="w-11 h-11 rounded-2xl bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.05)] hover:shadow-md hover:-translate-y-1 transition-all flex items-center justify-center group cursor-pointer" title="React">
                <svg className="w-6 h-6 text-[#61DAFB] group-hover:scale-110 transition-transform" viewBox="-11.5 -10.23174 23 20.46348">
                  <circle cx="0" cy="0" r="2.05" fill="#61DAFB" />
                  <g stroke="#61DAFB" strokeWidth="1" fill="none">
                    <ellipse rx="11" ry="4.2" />
                    <ellipse rx="11" ry="4.2" transform="rotate(60)" />
                    <ellipse rx="11" ry="4.2" transform="rotate(120)" />
                  </g>
                </svg>
              </div>

              {/* 2. Next.js */}
              <div className="w-11 h-11 rounded-2xl bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.05)] hover:shadow-md hover:-translate-y-1 transition-all flex items-center justify-center group cursor-pointer" title="Next.js">
                <div className="w-6 h-6 rounded-full border border-zinc-800 dark:border-white/40 flex items-center justify-center font-display font-black text-xs text-zinc-900 dark:text-white">
                  N
                </div>
              </div>

              {/* 3. Node.js */}
              <div className="w-11 h-11 rounded-2xl bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.05)] hover:shadow-md hover:-translate-y-1 transition-all flex items-center justify-center group cursor-pointer" title="Node.js">
                <div className="w-6 h-6 rounded-lg bg-[#539E43]/10 border border-[#539E43]/30 flex items-center justify-center font-mono font-black text-[10px] text-[#539E43]">
                  JS
                </div>
              </div>

              {/* 4. TypeScript */}
              <div className="w-11 h-11 rounded-2xl bg-[#3178C6] border border-[#3178C6] shadow-[0_4px_16px_rgba(49,120,198,0.25)] hover:shadow-md hover:-translate-y-1 transition-all flex items-center justify-center group cursor-pointer" title="TypeScript">
                <span className="font-mono font-black text-xs text-white">TS</span>
              </div>

              {/* 5. MongoDB */}
              <div className="w-11 h-11 rounded-2xl bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.05)] hover:shadow-md hover:-translate-y-1 transition-all flex items-center justify-center group cursor-pointer" title="MongoDB">
                <svg className="w-5 h-5 text-[#47A248] group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.193 9.555c-1.233-4.108-4.321-7.14-4.81-7.604a.637.637 0 0 0-.825 0c-.49.464-3.578 3.496-4.811 7.604-1.464 4.877.202 8.76 4.39 12.392.257.223.633.223.89 0 4.188-3.632 5.854-7.515 4.39-12.392h-.034zm-5.176 10.354v-7.39a.478.478 0 0 1 .478-.478.478.478 0 0 1 .477.478v7.39c-2.34-1.743-3.66-4.162-3.66-7.39 0-2.88 1.488-5.32 3.66-6.732v14.122z" />
                </svg>
              </div>

              {/* 6. Tailwind CSS */}
              <div className="w-11 h-11 rounded-2xl bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.05)] hover:shadow-md hover:-translate-y-1 transition-all flex items-center justify-center group cursor-pointer" title="Tailwind CSS">
                <svg className="w-5 h-5 text-[#38B2AC] group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.001,4.8c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 C13.666,10.618,15.027,12,18.001,12c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C16.337,6.182,14.976,4.8,12.001,4.8z M6.001,12c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 c1.177,1.194,2.538,2.576,5.512,2.576c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C10.337,13.382,8.976,12,6.001,12z" />
                </svg>
              </div>

              {/* 7. More (...) */}
              <div className="w-11 h-11 rounded-2xl bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.05)] hover:shadow-md hover:-translate-y-1 transition-all flex items-center justify-center text-zinc-500 font-black tracking-widest cursor-pointer" title="And more...">
                •••
              </div>
            </div>
          </div>
        </motion.div>

        {/* ----------------------------------------------------------------------- */}
        {/* RIGHT COLUMN: 3D Laptop Mockup & 4 Floating Glassmorphic Cards          */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-6 xl:col-span-7 relative min-h-[460px] sm:min-h-[520px] md:min-h-[580px] flex items-center justify-center">
          {/* ===================================================================== */}
          {/* 3D Realistic Laptop Mockup (Angled with Code Editor)                 */}
          {/* ===================================================================== */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[580px] z-20"
            style={{
              perspective: '1200px',
            }}
          >
            {/* Ambient Ground Shadow under Laptop */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[85%] h-12 bg-black/35 blur-2xl rounded-full" />
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[70%] h-6 bg-orange-500/20 blur-xl rounded-full" />

            {/* Laptop Assembly (Screen + Base) */}
            <div
              className="relative transition-transform duration-500"
              style={{
                transform: 'rotateY(-10deg) rotateX(10deg) rotateZ(-2deg)',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Laptop Screen Top Lid */}
              <div className="relative bg-[#0F1117] rounded-t-2xl p-2.5 sm:p-3 border-2 border-zinc-700/80 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)]">
                {/* Screen Bezel & Camera */}
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 mx-auto mb-1.5 opacity-60" />

                {/* Dark IDE Display Screen */}
                <div className="bg-[#181A20] rounded-xl overflow-hidden border border-zinc-800 shadow-inner font-mono text-[10px] sm:text-[11px] leading-relaxed select-text">
                  {/* IDE Top Window Controls & Tabs */}
                  <div className="bg-[#111317] px-3 py-2 flex items-center justify-between border-b border-zinc-800/80">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                      <span className="bg-[#181A20] px-2.5 py-0.5 rounded-t text-orange-400 font-bold border-t border-orange-500">
                        App.tsx
                      </span>
                      <span className="text-zinc-500 hover:text-zinc-400">styles.css</span>
                    </div>
                    <div className="w-4" />
                  </div>

                  {/* IDE Main Workspace with Code Lines */}
                  <div className="p-3.5 sm:p-4 space-y-1.5 text-zinc-300 min-h-[170px] sm:min-h-[200px]">
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-600 text-[10px] select-none">01</span>
                      <span className="text-[#E5C07B]">import</span> <span className="text-[#61AFEF]">React</span> <span className="text-[#E5C07B]">from</span> <span className="text-[#98C379]">&apos;react&apos;</span>;
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-600 text-[10px] select-none">02</span>
                      <span className="text-[#C678DD]">export default function</span> <span className="text-[#61AFEF]">DigitalExperience</span>() &#123;
                    </div>
                    <div className="flex items-center gap-3 pl-4">
                      <span className="text-zinc-600 text-[10px] select-none">03</span>
                      <span className="text-[#E5C07B]">const</span> <span className="text-[#E06C75]">architect</span> = &#123; <span className="text-[#D19A66]">speed</span>: <span className="text-[#98C379]">&apos;100%&apos;</span>, <span className="text-[#D19A66]">scalable</span>: <span className="text-[#56B6C2]">true</span> &#125;;
                    </div>
                    <div className="flex items-center gap-3 pl-4">
                      <span className="text-zinc-600 text-[10px] select-none">04</span>
                      <span className="text-[#C678DD]">return</span> (
                    </div>
                    <div className="flex items-center gap-3 pl-8">
                      <span className="text-zinc-600 text-[10px] select-none">05</span>
                      <span className="text-[#E06C75]">&lt;HeroSection</span> <span className="text-[#D19A66]">impact</span>=<span className="text-[#98C379]">&quot;high&quot;</span> <span className="text-[#D19A66]">status</span>=<span className="text-[#98C379]">&quot;connected&quot;</span> <span className="text-[#E06C75]">/&gt;</span>
                    </div>
                    <div className="flex items-center gap-3 pl-4">
                      <span className="text-zinc-600 text-[10px] select-none">06</span>
                      );
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-600 text-[10px] select-none">07</span>
                      &#125;
                    </div>
                  </div>
                </div>
              </div>

              {/* Laptop Keyboard Base & Trackpad */}
              <div className="relative bg-gradient-to-b from-[#C4C7CC] to-[#989CA3] rounded-b-2xl h-5 sm:h-6 border-t-2 border-zinc-400 shadow-2xl flex items-center justify-center">
                <div className="w-16 h-1 bg-zinc-600/40 rounded-full" />
              </div>
            </div>
          </motion.div>

          {/* ===================================================================== */}
          {/* FLOATING CARD 1: ⚡ PERFORMANCE LIGHTHOUSE SCORE (Top-Center)        */}
          {/* ===================================================================== */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            whileHover={{ y: -4 }}
            className="absolute top-2 sm:top-4 left-[20%] sm:left-[26%] z-30 bg-white/95 dark:bg-[#151820]/95 backdrop-blur-xl border border-zinc-200/90 dark:border-white/10 rounded-2xl p-3.5 sm:p-4 shadow-[0_16px_32px_-8px_rgba(0,0,0,0.12)] space-y-2 min-w-[130px] sm:min-w-[145px] text-center"
          >
            {/* Header: ⚡ PERFORMANCE */}
            <div className="inline-flex items-center gap-1 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-md border border-orange-200/60 dark:border-orange-500/20">
              <Zap className="w-3 h-3 text-[#FF5722] fill-[#FF5722]" />
              <span className="text-[9px] font-black tracking-wider uppercase text-[#111317] dark:text-white">
                PERFORMANCE
              </span>
            </div>

            {/* Circular Gauge Meter (98%) */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-zinc-100 dark:text-zinc-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#FF5722]"
                  strokeDasharray="98, 100"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="font-display text-lg sm:text-xl font-black text-[#111317] dark:text-white leading-none">
                  98
                </span>
                <span className="text-[8px] font-mono text-zinc-400 font-bold">/100</span>
              </div>
            </div>

            <span className="text-[8px] font-mono font-bold tracking-wider text-zinc-400 uppercase block">
              LIGHTHOUSE SCORE
            </span>
          </motion.div>

          {/* ===================================================================== */}
          {/* FLOATING CARD 2: </> CODE CONNECTION CARD (Top-Right)                */}
          {/* ===================================================================== */}
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.85 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            whileHover={{ y: -4 }}
            className="absolute top-6 sm:top-10 right-0 sm:right-4 z-30 bg-white/95 dark:bg-[#151820]/95 backdrop-blur-xl border border-zinc-200/90 dark:border-white/10 rounded-2xl p-3.5 sm:p-4 shadow-[0_16px_32px_-8px_rgba(0,0,0,0.12)] space-y-3 min-w-[130px] sm:min-w-[155px]"
          >
            {/* Top row: </> icon + code bars */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/25 flex items-center justify-center font-mono font-black text-xs text-[#FF5722]">
                &lt;/&gt;
              </div>
              <div className="space-y-1 flex-1">
                <div className="w-12 h-1.5 rounded-full bg-[#FF5722]" />
                <div className="w-8 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
              </div>
            </div>

            {/* Skeleton lines */}
            <div className="space-y-1.5 pt-1">
              <div className="w-full h-1 rounded-full bg-zinc-200/80 dark:bg-zinc-700" />
              <div className="w-4/5 h-1 rounded-full bg-zinc-200/80 dark:bg-zinc-700" />
            </div>

            {/* Status: 🟢 CONNECTED */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981] animate-pulse" />
              <span className="text-[9px] font-mono font-bold tracking-widest text-[#10B981] uppercase">
                CONNECTED
              </span>
            </div>
          </motion.div>

          {/* ===================================================================== */}
          {/* FLOATING CARD 3: CLEAN CODE (Middle-Left)                             */}
          {/* ===================================================================== */}
          <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.85 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            whileHover={{ y: -4 }}
            className="absolute bottom-16 sm:bottom-20 left-0 sm:left-4 z-30 bg-white/95 dark:bg-[#151820]/95 backdrop-blur-xl border border-zinc-200/90 dark:border-white/10 rounded-2xl p-3.5 sm:p-4 shadow-[0_16px_32px_-8px_rgba(0,0,0,0.12)] space-y-2.5 min-w-[125px] sm:min-w-[140px]"
          >
            {/* Header: CLEAN CODE + ✓ badge */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-black tracking-wider uppercase text-[#111317] dark:text-white">
                CLEAN CODE
              </span>
              <div className="w-4 h-4 rounded-full bg-orange-500/15 text-[#FF5722] flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-[#FF5722]" />
              </div>
            </div>

            {/* Code Lines with Orange Dot Bullets */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5722]" />
                <div className="w-14 h-1.5 rounded-full bg-orange-200 dark:bg-orange-900/50" />
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                <div className="w-16 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5722]" />
                <div className="w-12 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                <div className="w-10 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
              </div>
            </div>
          </motion.div>

          {/* ===================================================================== */}
          {/* FLOATING CARD 4: FULL STACK LAYERS (Far-Right)                       */}
          {/* ===================================================================== */}
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.85 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            whileHover={{ y: -4 }}
            className="absolute bottom-8 sm:bottom-12 right-0 sm:right-2 z-30 bg-white/95 dark:bg-[#151820]/95 backdrop-blur-xl border border-zinc-200/90 dark:border-white/10 rounded-2xl p-3.5 sm:p-4 shadow-[0_16px_32px_-8px_rgba(0,0,0,0.12)] space-y-2.5 min-w-[135px] sm:min-w-[155px]"
          >
            <span className="text-[10px] font-black tracking-wider uppercase text-[#111317] dark:text-white block">
              FULL STACK
            </span>

            <div className="flex items-start gap-3">
              {/* 3D Stacked Layers Icon */}
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/25 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5 text-[#FF5722]" />
              </div>

              {/* 4 Stacks List */}
              <div className="space-y-0.5 text-[9px] font-bold text-zinc-600 dark:text-zinc-300 leading-tight">
                <div className="hover:text-[#FF5722] transition-colors">Frontend</div>
                <div className="hover:text-[#FF5722] transition-colors">Backend</div>
                <div className="hover:text-[#FF5722] transition-colors">Database</div>
                <div className="hover:text-[#FF5722] transition-colors">DevOps</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FLOATING BOTTOM STATS & AVAILABILITY BAR                               */}
      {/* ========================================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mt-10 sm:mt-12 relative z-20"
      >
        <div className="bg-white/90 dark:bg-[#12151c]/90 backdrop-blur-2xl border border-zinc-200/80 dark:border-white/10 rounded-3xl p-4 sm:p-5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Left Grid: 4 Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 w-full lg:w-auto">
            {/* Stat 1: 3+ YEARS EXPERIENCE */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-[#FF5722]" />
              </div>
              <div>
                <div className="font-display text-xl sm:text-2xl font-black text-[#111317] dark:text-white leading-none">
                  3+
                </div>
                <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block mt-0.5">
                  YEARS EXPERIENCE
                </span>
              </div>
            </div>

            {/* Stat 2: 20+ PROJECTS COMPLETED */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                <Code2 className="w-5 h-5 text-[#FF5722]" />
              </div>
              <div>
                <div className="font-display text-xl sm:text-2xl font-black text-[#111317] dark:text-white leading-none">
                  20+
                </div>
                <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block mt-0.5">
                  PROJECTS COMPLETED
                </span>
              </div>
            </div>

            {/* Stat 3: 15+ HAPPY CLIENTS */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                <Smile className="w-5 h-5 text-[#FF5722]" />
              </div>
              <div>
                <div className="font-display text-xl sm:text-2xl font-black text-[#111317] dark:text-white leading-none">
                  15+
                </div>
                <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block mt-0.5">
                  HAPPY CLIENTS
                </span>
              </div>
            </div>

            {/* Stat 4: 5/5 CLIENT RATING */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                <Star className="w-5 h-5 text-[#FF5722] fill-[#FF5722]" />
              </div>
              <div>
                <div className="font-display text-xl sm:text-2xl font-black text-[#111317] dark:text-white leading-none">
                  5/5
                </div>
                <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block mt-0.5">
                  CLIENT RATING
                </span>
              </div>
            </div>
          </div>

          {/* Right Section: Availability & Scroll Down */}
          <div className="flex items-center justify-between lg:justify-end gap-6 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-zinc-100 dark:border-white/5">
            {/* Availability Text & Pulse */}
            <div className="text-right">
              <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">
                AVAILABLE FOR
              </span>
              <div className="flex items-center gap-2 justify-end">
                <span className="font-display font-black text-xs sm:text-sm tracking-wider uppercase text-[#111317] dark:text-white">
                  FREELANCE PROJECTS
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10B981] animate-pulse" />
              </div>
            </div>

            {/* Circular Scroll Down Button */}
            <a
              href="#about"
              className="w-11 h-11 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 hover:bg-[#FF5722] hover:border-[#FF5722] text-zinc-700 dark:text-zinc-300 hover:text-white flex items-center justify-center transition-all duration-200 shadow-sm shrink-0 group"
              aria-label="Scroll to content"
            >
              <ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
            </a>
          </div>
        </div>
      </motion.div>

      {/* ========================================================================= */}
      {/* 4. INTERACTIVE MODAL: WATCH INTRO VIDEO PREVIEW                           */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {videoModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#12151c] border border-zinc-200 dark:border-white/10 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl overflow-hidden relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#FF5722]" />
                  <h3 className="font-display font-bold text-sm text-zinc-900 dark:text-white">
                    Showcase Intro &amp; Architecture Walkthrough
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setVideoModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Video Player Mockup */}
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-zinc-950 flex items-center justify-center border border-zinc-800">
                <div className="text-center space-y-3 p-6">
                  <div className="w-14 h-14 rounded-full bg-[#FF5722]/20 border border-[#FF5722] flex items-center justify-center mx-auto text-[#FF5722] shadow-[0_0_24px_rgba(255,87,34,0.4)]">
                    <Play className="w-6 h-6 fill-[#FF5722] ml-0.5" />
                  </div>
                  <h4 className="font-display font-black text-white text-base">
                    Full Stack Engineering &amp; High-Performance UI Showcase
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto">
                    React 19, Next.js 15, Scalable Microservices, Tailwind CSS &amp; Cloud DevOps Architecture.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setVideoModalOpen(false)}
                  className="px-6 py-2 rounded-full bg-[#FF5722] text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
