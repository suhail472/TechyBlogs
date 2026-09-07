'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Globe,
  Code2,
  Zap,
  Check,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  BookOpen,
  ArrowRight,
  Send,
  Compass,
  Laptop,
  Heart,
  MessageSquare,
  Smile,
  CheckCircle2,
  Bookmark,
} from 'lucide-react';
import TopLoader from '@/components/shared/TopLoader';

export default function AboutClient() {
  const [activeTab, setActiveTab] = useState('what-we-do');

  const highlights = [
    {
      title: 'Detailed Guides',
      desc: 'Step-by-step tutorials that explain not just how to write code, but how things work under the hood.',
      icon: BookOpen,
      badge: 'Step by Step',
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20',
    },
    {
      title: 'Fast & Lightweight',
      desc: 'Built to load almost instantly on any phone or laptop, with zero lag and clean reading modes.',
      icon: Zap,
      badge: 'Speed First',
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
    },
    {
      title: 'No Annoying Ads',
      desc: 'No pop-up banners, no sponsored clickbait, and no tracking cookies. Your reading experience comes first.',
      icon: ShieldCheck,
      badge: 'Clean & Safe',
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
    },
    {
      title: 'Real-World Testing',
      desc: 'Honest reviews of laptops, processors, and developer tools based on daily real-world programming use.',
      icon: Laptop,
      badge: '100% Unbiased',
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
    },
  ];

  const topics = [
    {
      icon: Code2,
      title: 'Modern Web Development',
      desc: 'Practical tutorials on React, Next.js, JavaScript, and Tailwind CSS. We focus on clean code patterns you can directly use in your daily work.',
    },
    {
      icon: Compass,
      title: 'Kashmir Tech & Startups',
      desc: 'Stories celebrating software companies, students, and engineers working in Jammu & Kashmir. We cover local talent and growing tech hubs.',
    },
    {
      icon: Laptop,
      title: 'Hardware & Gear Reviews',
      desc: 'Hands-on reviews of Apple silicon, laptops, developer keyboards, and setups. No sponsored fluff — just honest pros and cons.',
    },
    {
      icon: Heart,
      title: 'Easy Reading Experience',
      desc: 'Built-in tools to make reading enjoyable, including warm sepia tones, font size sliders, reading progress bars, and bookmarking.',
    },
  ];

  const tabContent = {
    'what-we-do': {
      title: 'What You Will Find on TechyBlogs',
      subtitle: 'Clear, practical, and honest tech content written for curious minds.',
      points: [
        {
          heading: 'Practical Tutorials',
          detail: 'No copy-pasting code that breaks. Every guide is tested with real projects and explained in clear, simple English.',
        },
        {
          heading: 'Unbiased Hardware Insights',
          detail: 'When we review a laptop or chip, we buy it or test it in real workflows. We never take money to give positive reviews.',
        },
        {
          heading: 'Dedicated Regional Stories',
          detail: 'Highlighting tech talent and education in Srinagar and across Jammu & Kashmir to inspire the next generation of builders.',
        },
      ],
    },
    'creator': {
      title: 'Who is Behind TechyBlogs?',
      subtitle: 'A personal project built with care by Suheel Hilal.',
      points: [
        {
          heading: 'Software Engineer & Builder',
          detail: 'I specialize in building full-stack web applications with React, Next.js, and Node.js, focusing on speed and clean design.',
        },
        {
          heading: 'Passion for Teaching',
          detail: 'I believe programming should be accessible to everyone. Writing articles helps me clarify concepts and help others learn.',
        },
        {
          heading: 'Rooted in Kashmir',
          detail: 'Based in Srinagar, Kashmir, building software for the web and writing about the rapid growth of remote work and tech talent here.',
        },
      ],
    },
    'promise': {
      title: 'Our Three Simple Promises to You',
      subtitle: 'How we respect your time and attention whenever you visit.',
      points: [
        {
          heading: '1. Always Plain English',
          detail: 'We avoid unnecessary buzzwords. If a concept is complex, we use clear analogies and step-by-step examples to make it easy.',
        },
        {
          heading: '2. Your Privacy Comes First',
          detail: 'We do not sell your data or use invasive tracking cookies. You can browse freely without being followed across the internet.',
        },
        {
          heading: '3. Completely Free to Read',
          detail: 'No subscriptions, no paywalls, and no hidden catches. Knowledge should be open and accessible to all readers.',
        },
      ],
    },
  };

  const simpleStack = [
    { label: 'Frontend & UI', tools: 'React 19, Next.js 15, Tailwind CSS' },
    { label: 'Backend & Data', tools: 'Node.js, MongoDB Atlas database' },
    { label: 'Speed & Delivery', tools: 'Global edge network, Instant image delivery' },
    { label: 'Helpful Features', tools: 'Built-in AI reading helper, Dyslexia-friendly fonts' },
  ];

  return (
    <div className="pt-32 pb-24 px-4 sm:px-6 md:px-10 max-w-6xl mx-auto relative overflow-hidden">
      <TopLoader />

      {/* Soft, gentle background glows — light and dark compatible */}
      <div className="absolute top-16 right-[-80px] w-96 h-96 bg-red-500/5 dark:bg-red-600/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-80 left-[-80px] w-96 h-96 bg-blue-500/5 dark:bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Section */}
      <div className="max-w-3xl mx-auto text-center space-y-5 pt-4 sm:pt-8 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold"
        >
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span>About TechyBlogs</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold font-display tracking-tight text-zinc-900 dark:text-white leading-[1.15]"
        >
          Practical Tech Guides, Tutorials, and{' '}
          <span className="bg-gradient-to-r from-red-600 via-rose-500 to-amber-600 bg-clip-text text-transparent">
            Stories
          </span>.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base sm:text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal"
        >
          Welcome! <strong className="text-zinc-900 dark:text-white font-semibold">TechyBlogs</strong> was created by{' '}
          <strong className="text-zinc-900 dark:text-white font-semibold">Suheel Hilal</strong> to share clear coding guides, honest reviews of tech gear, and uplifting stories about developers in Kashmir. Everything here is written in simple, everyday English so anyone can follow along.
        </motion.p>

        {/* Friendly Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-3 pt-2"
        >
          <a
            href="https://www.suhailhilal.in"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-all shadow-sm hover:-translate-y-0.5"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Visit Creator Portfolio</span>
            <ExternalLink className="w-3 h-3 opacity-80" />
          </a>
          <Link
            href="/blogs"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition-all hover:-translate-y-0.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span>Browse All Articles</span>
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-red-400 dark:hover:border-red-400 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition-all hover:-translate-y-0.5"
          >
            <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
            <span>Say Hello</span>
          </Link>
        </motion.div>
      </div>

      {/* 4 Feature Cards (Clean light/dark adaptive) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
      >
        {highlights.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="p-5 rounded-2xl bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 shadow-sm hover:border-red-300 dark:hover:border-red-500/30 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <span className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center ${item.color}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                    {item.badge}
                  </span>
                </div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-1.5">
                  {item.title}
                </h2>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
                  {item.desc}
                </p>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Interactive Feature Explorer (Clean, light/dark responsive, NOT pitch black!) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mb-12 rounded-3xl bg-white dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-zinc-800 shadow-sm overflow-hidden"
      >
        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/80 gap-3 bg-zinc-50/60 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-red-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              Explore Our Story
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-200/60 dark:bg-zinc-800 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('what-we-do')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'what-we-do'
                  ? 'bg-white dark:bg-zinc-700 text-red-600 dark:text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              What We Write
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('creator')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'creator'
                  ? 'bg-white dark:bg-zinc-700 text-red-600 dark:text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              About Suheel
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('promise')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'promise'
                  ? 'bg-white dark:bg-zinc-700 text-red-600 dark:text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Our Promise
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white font-display">
                  {tabContent[activeTab].title}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                  {tabContent[activeTab].subtitle}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {tabContent[activeTab].points.map((point) => (
                  <div
                    key={point.heading}
                    className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800"
                  >
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2 font-bold text-sm">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{point.heading}</span>
                    </div>
                    <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-300 font-normal">
                      {point.detail}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Creator Profile & Topics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
        {/* Meet the Creator Card (Span 5) */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="lg:col-span-5 p-6 sm:p-7 rounded-3xl bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3.5">
              {/* Creator Monogram (clean, elegant, no images) */}
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center text-white font-bold text-lg font-display shadow-md shadow-red-500/20 shrink-0">
                SH
              </div>
              <div>
                <span className="text-[11px] font-semibold text-red-600 dark:text-red-400">
                  Creator &amp; Lead Author
                </span>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white font-display">
                  Suheel Hilal
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Software Engineer · Kashmir, India
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              Hi! I'm Suheel. I build web applications and write about technology. I created TechyBlogs because I wanted a clean, honest corner of the internet where people can learn modern programming without getting buried in popups or confusing jargon.
            </p>

            <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
              <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                <span>What I Build</span>
                <span className="font-semibold text-zinc-900 dark:text-white">Web Apps with React &amp; Next.js</span>
              </div>
              <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                <span>Personal Portfolio</span>
                <a
                  href="https://www.suhailhilal.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1 font-semibold"
                >
                  suhailhilal.in
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                <span>GitHub</span>
                <a
                  href="https://github.com/suheelhilal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 inline-flex items-center gap-1 font-semibold"
                >
                  @suheelhilal
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          <div className="pt-5 mt-5 border-t border-zinc-100 dark:border-zinc-800 flex gap-2">
            <a
              href="https://www.suhailhilal.in"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold transition-all shadow-sm"
            >
              <Globe className="w-3.5 h-3.5 text-red-500" />
              <span>Visit Portfolio</span>
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <Send className="w-3.5 h-3.5 text-zinc-400" />
              <span>Send Note</span>
            </Link>
          </div>
        </motion.div>

        {/* Topics We Cover (Span 7) */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {topics.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="p-5 rounded-3xl bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex flex-col justify-between hover:border-red-300 dark:hover:border-red-500/30 transition-all duration-200"
              >
                <div>
                  <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mb-3">
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <h4 className="text-base font-bold text-zinc-900 dark:text-white mb-1.5 font-display">
                    {item.title}
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* Simple Tech Details */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="p-6 rounded-3xl bg-zinc-50/80 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/60 mb-12"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-zinc-200/60 dark:border-zinc-800/60">
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
              How TechyBlogs is Built
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Designed with modern tools for speed, reliability, and ease of use.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 text-xs">
          {simpleStack.map((col) => (
            <div key={col.label} className="space-y-1">
              <p className="font-semibold text-zinc-900 dark:text-white">
                {col.label}
              </p>
              <p className="text-zinc-500 dark:text-zinc-400">
                {col.tools}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Reader Call to Action (CLEAN & GENTLE, NOT PITCH BLACK!) */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45 }}
        className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-red-50/80 via-white to-zinc-50 dark:from-zinc-900 dark:via-zinc-900/80 dark:to-zinc-950 border border-red-100 dark:border-zinc-800 shadow-sm relative overflow-hidden"
      >
        <div className="relative z-10 max-w-xl space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100/80 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-xs font-semibold">
            <MessageSquare className="w-3 h-3 text-red-500" />
            Get in Touch
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-zinc-900 dark:text-white leading-tight">
            Have a question, feedback, or an idea for an article?
          </h3>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
            Whether you want to suggest a new topic, ask a coding question, or simply say hi, my inbox is always open. I read and reply to every message.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-all shadow-sm hover:-translate-y-0.5"
            >
              <span>Send a Message</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/blogs"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-semibold transition-all border border-zinc-200 dark:border-zinc-700"
            >
              <span>Explore Articles</span>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
