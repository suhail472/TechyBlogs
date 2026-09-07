'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Terminal,
  Globe,
  Code2,
  Layers,
  Palette,
  Zap,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Sparkles,
  BookOpen,
  Activity,
  Server,
  Database,
  Lock,
  ArrowRight,
  Send,
  Compass,
  FileCode2,
} from 'lucide-react';
import TopLoader from '@/components/shared/TopLoader';

export default function AboutClient() {
  const [activeTab, setActiveTab] = useState('architecture');
  const [copied, setCopied] = useState(false);

  const stats = [
    {
      value: '2,500+',
      label: 'Words Per Article',
      desc: 'Uncompromising long-form depth on software design and regional affairs',
      icon: BookOpen,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-500/10 border-red-500/20',
    },
    {
      value: '100/100',
      label: 'Performance Target',
      desc: 'Sub-second rendering with Next.js 15 App Router and Zero-CLS layouts',
      icon: Zap,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      value: '0 Trackers',
      label: 'Strict Privacy Ethos',
      desc: 'Zero third-party spyware, no ad network scripts, and encrypted sessions',
      icon: ShieldCheck,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      value: '< 25ms',
      label: 'Edge Response',
      desc: 'Smart caching, static prerender generation, and global asset delivery',
      icon: Activity,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
    },
  ];

  const codeSnippets = {
    architecture: `// techyblogs.platform.config.ts
export const TechyBlogsEngine = {
  version: '2.4.0',
  framework: 'Next.js 15 (App Router, Server Actions)',
  rendering: 'Hybrid Prerender + Incremental Cache',
  runtime: {
    core: 'React 19 Concurrent Architecture',
    styling: 'Tailwind CSS Modern Design System',
    animations: 'Framer Motion Spring Physics',
    typography: ['Plus Jakarta Sans', 'Lora Serif', 'Manrope']
  },
  editorialIntelligence: {
    aiProvider: 'Groq Ultra-Fast LLaMA 3.3',
    latencyBudgetMs: 500,
    safetyFilters: ['Prompt Injection Shield', 'Hallucination Trap']
  },
  database: 'MongoDB Atlas + Mongoose High-Throughput Cluster',
  security: ['Strict CSP', 'Argon2/Bcrypt Admin Tokens', 'Zero-Tracking']
};`,
    creator: `{
  "leadArchitect": "Suheel Hilal",
  "role": "Principal Software Architect & Lead Editor",
  "location": "Kashmir, India",
  "portfolio": "https://www.suhailhilal.in",
  "github": "https://github.com/suheelhilal",
  "linkedin": "https://linkedin.com/in/suheelhilal",
  "expertise": [
    "Full-Stack Web Architecture (Next.js, React, Node)",
    "Clean Code & Core Web Vitals Optimization",
    "Technical Journalism & Peer-Reviewed Writing",
    "Regional Tech Hub Analysis & Economic Dispatches"
  ],
  "philosophy": "Journalism without noise; software without bloat."
}`,
    charter: `# TechyBlogs Editorial Charter

1. FACTUAL ACCURACY & RIGOR
   Every claim, benchmark, and historical context is double-verified
   against primary source documentation and reproducible tests.

2. INDEPENDENT HARDWARE & SOFTWARE REVIEWS
   We accept zero paid endorsements. Hardware and frameworks are tested
   in production environments with reproducible benchmarks.

3. KASHMIR REGIONAL BUREAU
   Unflinching, dedicated spotlight on Kashmir's emerging engineering
   talent, university research, infrastructure, and culture.

4. CIVIC COMMUNITY DIALOGUE
   Civic moderation assisted by automated sentiment and injection guards
   ensures thoughtful, respectful developer discussion.`
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const techStack = [
    { category: 'Frontend', items: ['Next.js 15', 'React 19', 'Tailwind CSS', 'Framer Motion', 'KaTeX Math', 'Zustand'] },
    { category: 'Backend & Data', items: ['Node.js', 'MongoDB Atlas', 'Mongoose ODM', 'Resend API', 'JWT Security'] },
    { category: 'Media & AI', items: ['Cloudinary CDN', 'Groq LLaMA 3.3', 'In-Memory Rate Limiter', 'Edge Cache'] },
  ];

  const pillars = [
    {
      icon: Code2,
      title: 'Architectural Integrity',
      desc: 'Building with pure semantic web standards, zero extraneous JavaScript weight, and responsive typography optimized for long reading sessions.',
    },
    {
      icon: Compass,
      title: 'Kashmir Regional Bureau',
      desc: 'Chronicling the digital economy of Jammu & Kashmir — from local SaaS startups in Rangreth to university research at NIT and KU.',
    },
    {
      icon: Cpu,
      title: 'Hands-On Hardware Lab',
      desc: 'Exhaustive real-world engineering evaluations of next-gen silicon, developer workstations, and high-performance developer peripherals.',
    },
    {
      icon: Lock,
      title: 'Privacy-First Experience',
      desc: 'No invasive cookie banners, no retargeting pixels, and no sellout to advertiser data brokers. Your reading habits belong strictly to you.',
    },
  ];

  return (
    <div className="pt-32 pb-24 px-4 sm:px-6 md:px-10 max-w-7xl mx-auto relative overflow-hidden">
      <TopLoader />

      {/* Ambient background glows — pure CSS, no images */}
      <div className="absolute top-20 right-[-120px] w-96 h-96 bg-red-500/10 dark:bg-red-600/5 rounded-full blur-[120px] animate-blob-drift pointer-events-none" />
      <div className="absolute top-96 left-[-120px] w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/5 rounded-full blur-[130px] animate-blob-drift-reverse pointer-events-none" />
      <div className="absolute bottom-20 right-1/3 w-80 h-80 bg-amber-500/5 dark:bg-amber-500/[0.03] rounded-full blur-[110px] pointer-events-none" />

      {/* Header & Hero Section */}
      <div className="max-w-4xl mx-auto text-center space-y-6 pt-4 sm:pt-8 pb-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs font-black uppercase tracking-widest font-display shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Editorial Masthead &amp; Architecture Lab</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black font-display tracking-tight text-zinc-900 dark:text-white leading-[1.08]"
        >
          Engineering Meets{' '}
          <span className="bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 bg-clip-text text-transparent">
            Uncompromising
          </span>{' '}
          Journalism.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base sm:text-lg md:text-xl text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed max-w-3xl mx-auto"
        >
          <strong className="text-zinc-900 dark:text-white font-bold">TechyBlogs</strong> is an independent digital publication and engineering laboratory founded by{' '}
          <span className="text-zinc-900 dark:text-white font-bold underline decoration-red-500 decoration-2 underline-offset-4">
            Suheel Hilal
          </span>. We combine deep architectural code analyses, lab-tested hardware benchmarks, and dedicated regional dispatches from Jammu &amp; Kashmir.
        </motion.p>

        {/* Quick Action Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-3 pt-2"
        >
          <a
            href="https://www.suhailhilal.in"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-md hover:-translate-y-0.5"
          >
            <Globe className="w-3.5 h-3.5 text-red-500 dark:text-red-600" />
            <span>Creator Portfolio</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-zinc-200 text-xs font-bold uppercase tracking-wider hover:border-red-500/40 hover:text-red-600 dark:hover:text-red-400 transition-all shadow-sm hover:-translate-y-0.5"
          >
            <Send className="w-3.5 h-3.5 text-zinc-500" />
            <span>Newsroom Desk</span>
          </Link>
          <Link
            href="/blogs"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600/10 dark:bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white transition-all shadow-sm hover:-translate-y-0.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Read Stories</span>
          </Link>
        </motion.div>
      </div>

      {/* Metrics Ribbon */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14"
      >
        {stats.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="p-5 rounded-2xl glass-card border border-zinc-200/80 dark:border-white/5 relative overflow-hidden group hover:border-red-500/30 transition-all duration-300 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Pillar 0{index + 1}
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black font-display text-zinc-900 dark:text-white tracking-tight">
                {item.value}
              </p>
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-1">
                {item.label}
              </p>
              <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400 mt-1">
                {item.desc}
              </p>
            </div>
          );
        })}
      </motion.div>

      {/* Interactive System Workstation / Architecture Console (Modern replacement for static photo) */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="mb-14 rounded-3xl border border-zinc-200/80 dark:border-white/10 bg-zinc-950 text-zinc-100 shadow-2xl overflow-hidden"
      >
        {/* Terminal Header */}
        <div className="flex flex-wrap items-center justify-between px-5 py-3.5 bg-zinc-900/90 border-b border-white/10 gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 mr-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <span className="text-xs font-mono font-semibold text-zinc-300 flex items-center gap-1.5">
              <FileCode2 className="w-3.5 h-3.5 text-red-400" />
              techyblogs.internal.spec
            </span>
          </div>

          {/* Interactive Tabs */}
          <div className="flex items-center gap-1 bg-zinc-950/80 p-1 rounded-xl border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('architecture')}
              className={`px-3 py-1 rounded-lg font-mono text-[11px] transition-colors ${
                activeTab === 'architecture'
                  ? 'bg-red-600 text-white font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              1. sys.config.ts
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('creator')}
              className={`px-3 py-1 rounded-lg font-mono text-[11px] transition-colors ${
                activeTab === 'creator'
                  ? 'bg-red-600 text-white font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              2. creator.json
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('charter')}
              className={`px-3 py-1 rounded-lg font-mono text-[11px] transition-colors ${
                activeTab === 'charter'
                  ? 'bg-red-600 text-white font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              3. charter.md
            </button>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-mono transition-colors border border-white/10"
              aria-label="Copy code block"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-zinc-400" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Code Viewport */}
        <div className="p-6 md:p-8 font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto bg-[#0a0d14]">
          <AnimatePresence mode="wait">
            <motion.pre
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="text-zinc-300 whitespace-pre"
            >
              <code>{codeSnippets[activeTab]}</code>
            </motion.pre>
          </AnimatePresence>
        </div>

        {/* Terminal Status Bar */}
        <div className="flex flex-wrap items-center justify-between px-5 py-2.5 bg-zinc-900/60 border-t border-white/5 text-[11px] font-mono text-zinc-400 gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              STATUS: PRODUCTION_STABLE
            </span>
            <span className="hidden sm:inline text-zinc-600">|</span>
            <span className="hidden sm:inline">LOC: SRINAGAR_KASHMIR_IN</span>
          </div>
          <div className="flex items-center gap-3 text-zinc-500">
            <span>ENC: UTF-8</span>
            <span>NEXT: 15.5.23</span>
            <span>REACT: 19</span>
          </div>
        </div>
      </motion.div>

      {/* Bento Grid: Mission, Creator & Editorial Capabilities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-14">
        {/* Creator Dossier Card (Span 5) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="lg:col-span-5 p-6 sm:p-8 rounded-3xl glass-card border border-zinc-200/80 dark:border-white/10 flex flex-col justify-between relative overflow-hidden group shadow-md"
        >
          <div className="space-y-5">
            <div className="flex items-center gap-3.5">
              {/* Monogram Brand Mark */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white font-black text-xl font-display shadow-lg shadow-red-600/25 shrink-0 group-hover:scale-105 transition-transform">
                SH
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 font-display">
                  Founder &amp; Principal Architect
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white font-display">
                  Suheel Hilal
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  Full-Stack Engineer · Srinagar, Kashmir
                </p>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300 font-medium">
              A software engineer specialized in reactive frontend design, distributed web performance, and state-of-the-art Next.js systems. 
              Created TechyBlogs to provide rigorous, ad-free journalism and high-utility developer tutorials without algorithmic filler.
            </p>

            <div className="space-y-2.5 pt-2 border-t border-zinc-200/60 dark:border-white/5 text-xs">
              <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                <span className="font-semibold">Engineering Focus</span>
                <span className="font-mono text-zinc-900 dark:text-white font-bold">Next.js 15, React 19, Node</span>
              </div>
              <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                <span className="font-semibold">Personal Domain</span>
                <a
                  href="https://www.suhailhilal.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-bold"
                >
                  suhailhilal.in
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                <span className="font-semibold">Open Source Code</span>
                <a
                  href="https://github.com/suheelhilal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-zinc-900 dark:text-white hover:text-red-500 transition-colors inline-flex items-center gap-1 font-bold"
                >
                  @suheelhilal
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-zinc-200/60 dark:border-white/5 flex flex-wrap gap-2.5">
            <a
              href="https://www.suhailhilal.in"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-red-600/20"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Full Portfolio</span>
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 text-xs font-bold uppercase tracking-wider hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Direct Note</span>
            </Link>
          </div>
        </motion.div>

        {/* Editorial Pillars (Span 7) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {pillars.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="p-5 sm:p-6 rounded-3xl glass-card border border-zinc-200/80 dark:border-white/10 hover:border-red-500/30 transition-all duration-300 flex flex-col justify-between group shadow-sm"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-red-600/10 dark:bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base sm:text-lg font-black font-display text-zinc-900 dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* Tech Stack Matrix */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="p-6 sm:p-8 rounded-3xl glass-card border border-zinc-200/80 dark:border-white/10 mb-14"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-200/60 dark:border-white/5">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-display">
              Under The Hood
            </span>
            <h3 className="text-xl sm:text-2xl font-black font-display text-zinc-900 dark:text-white mt-0.5">
              Production Technology Stack
            </h3>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md">
            Every library and service is chosen for zero-dependency overhead, deterministic rendering, and instant edge execution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          {techStack.map((stack) => (
            <div key={stack.category} className="space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                {stack.category}
              </h4>
              <div className="flex flex-wrap gap-2">
                {stack.items.map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-white/5 text-xs font-bold text-zinc-800 dark:text-zinc-200 font-mono hover:border-red-500/30 transition-colors"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Reader Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.45 }}
        className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-black text-white border border-white/10 relative overflow-hidden shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-[10px] font-black uppercase tracking-wider font-display">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Direct Newsroom Engagement
          </span>
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-black font-display tracking-tight text-white">
            Have a story lead, research paper, or engineering challenge?
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-medium">
            We welcome technical contributions, corrections, academic feedback, and investigative tips from engineers, educators, and readers worldwide.
          </p>
          <div className="pt-3 flex flex-wrap items-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-red-600/20"
            >
              <span>Submit Newsroom Query</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/feed.xml"
              target="_blank"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors border border-white/10"
            >
              <span>Subscribe to RSS</span>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
