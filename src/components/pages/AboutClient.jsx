'use client';

import { motion } from 'framer-motion';
import { ExternalLink, Terminal, Globe, Code2, Layers, Palette, Zap } from 'lucide-react';
import TopLoader from '@/components/shared/TopLoader';

export default function AboutClient() {
  const skills = [
    { name: 'React', icon: '⚛️' },
    { name: 'Next.js', icon: '▲' },
    { name: 'Tailwind CSS', icon: '🎨' },
    { name: 'Node.js', icon: '🟢' },
    { name: 'TypeScript', icon: '💎' },
    { name: 'MongoDB', icon: '🍃' },
    { name: 'Zustand', icon: '🐻' },
  ];

  const highlights = [
    { icon: Code2, label: 'Clean Architecture', desc: 'Building scalable, maintainable systems' },
    { icon: Zap, label: 'Performance First', desc: 'Optimized for speed and core web vitals' },
    { icon: Palette, label: 'Design Systems', desc: 'Crafting consistent, beautiful interfaces' },
    { icon: Layers, label: 'Full Stack', desc: 'End-to-end development expertise' },
  ];

  return (
    <div className="pt-36 pb-24 px-4 md:px-8 max-w-6xl mx-auto relative">
      <TopLoader />
      
      {/* Animated decorative blobs */}
      <div className="absolute top-20 right-[-100px] w-80 h-80 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[100px] animate-blob-drift pointer-events-none" />
      <div className="absolute bottom-20 left-[-100px] w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[100px] animate-blob-drift-reverse pointer-events-none" />

      <div className="container mx-auto">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-flex items-center gap-2 text-blue-500 font-black tracking-widest uppercase text-xs mb-5 font-display px-4 py-2 rounded-full bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/15">
              <Terminal className="w-3.5 h-3.5" />
              About the Creator
            </span>
            
            <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight font-display">
              Hi, I'm{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500 bg-clip-text text-transparent animate-gradient">
                Suheel Hilal
              </span>.
            </h1>
            
            <p className="text-lg md:text-xl text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed max-w-2xl mb-12">
              A professional full-stack software engineer and frontend designer building high-performance, SEO-optimized web applications.
            </p>
            
            <div className="flex flex-col lg:flex-row gap-12 items-start">
              {/* Modern code/tech image graphic */}
              <div className="lg:w-2/5 shrink-0 w-full">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="relative"
                >
                  <div className="aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl shadow-blue-500/10 dark:shadow-blue-500/5 border border-zinc-200/50 dark:border-white/[0.06] bg-zinc-900 relative group">
                    <img 
                      src="https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=800" 
                      alt="Developer Workspace"
                      className="w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent flex items-end p-7">
                      <div className="flex items-center gap-2.5 text-white/90">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 backdrop-blur-sm flex items-center justify-center border border-blue-500/20">
                          <Terminal className="w-3.5 h-3.5 text-blue-400" />
                        </div>
                        <span className="text-xs font-mono font-semibold tracking-wider">suheel_hilal.dev</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Floating accent card */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="absolute -bottom-4 -right-4 lg:-right-8 glass-card rounded-2xl p-4 shadow-xl animate-float"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white">
                        <Code2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-zinc-900 dark:text-white">Full Stack Dev</p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">5+ Years Experience</p>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </div>

              <div className="lg:w-3/5">
                <div className="space-y-5 text-base md:text-lg font-medium leading-relaxed text-zinc-600 dark:text-zinc-400">
                  <p>
                    I build high-performance, SEO-optimized web applications using React, Next.js, and modern CSS/Tailwind architecture. Every project I build focuses on clean code, fast load times, and beautiful user experiences.
                  </p>
                  <p>
                    <strong className="text-zinc-900 dark:text-white">TeachyBlogs</strong> is my personal hub where I share tutorials on frontend optimization, clean coding practices, and core system architectures. Writing search-engine optimized, high-speed code is at the heart of everything I build.
                  </p>
                  
                  {/* Portfolio Link Button */}
                  <div className="pt-3 flex flex-wrap gap-3">
                    <a 
                      href="https://www.suhailhilal.in" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm uppercase tracking-wider transition-all duration-350 hover:-translate-y-0.5 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/25 font-display"
                    >
                      <Globe className="w-4 h-4" />
                      Visit Portfolio
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Highlight Cards */}
                <div className="mt-10 grid grid-cols-2 gap-3">
                  {highlights.map((item, index) => (
                    <motion.div 
                      key={item.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="p-4 rounded-2xl glass-card group hover:-translate-y-0.5 transition-all duration-300 cursor-default"
                    >
                      <item.icon className="w-5 h-5 text-blue-500 dark:text-blue-400 mb-2.5 group-hover:scale-110 transition-transform" />
                      <p className="text-sm font-bold text-zinc-900 dark:text-white font-display">{item.label}</p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-500 font-medium mt-0.5">{item.desc}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Skills Section */}
                <div className="mt-10">
                  <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-5 font-display">Tech Stack</h3>
                  <div className="flex flex-wrap gap-2.5">
                    {skills.map((skill, index) => (
                      <motion.span 
                        key={skill.name}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.06 }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase glass-card hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 cursor-default text-zinc-700 dark:text-zinc-300"
                      >
                        <span className="text-sm">{skill.icon}</span>
                        {skill.name}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
