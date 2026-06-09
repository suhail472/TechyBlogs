'use client';

import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, Sparkles } from 'lucide-react';
import TopLoader from '@/components/shared/TopLoader';

export default function ContactClient() {
  const inputClasses = "w-full p-4 rounded-xl outline-none border text-sm transition-all bg-white/80 border-zinc-200/80 text-zinc-900 placeholder-zinc-400 focus:ring-2 focus:ring-blue-500/15 focus:border-blue-400/40 dark:bg-white/[0.03] dark:border-white/[0.06] dark:text-white dark:placeholder-zinc-500 dark:focus:border-blue-500/30 dark:focus:ring-blue-500/10";

  const contactItems = [
    {
      icon: Mail,
      label: 'Direct Email',
      value: 'suheelhilal92@gmail.com',
      href: 'mailto:suheelhilal92@gmail.com',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10 border-blue-500/15',
    },
    {
      icon: Phone,
      label: 'Phone Line',
      value: '9797935307',
      href: 'tel:9797935307',
      color: 'from-indigo-500 to-violet-500',
      bgColor: 'bg-indigo-500/10 border-indigo-500/15',
    },
    {
      icon: MapPin,
      label: 'Location',
      value: 'Kashmir, India',
      href: null,
      color: 'from-violet-500 to-purple-500',
      bgColor: 'bg-violet-500/10 border-violet-500/15',
    },
  ];

  return (
    <div className="pt-36 pb-28 px-4 md:px-8 max-w-6xl mx-auto relative">
      <TopLoader />
      
      {/* Animated blobs */}
      <div className="absolute top-32 right-[-100px] w-80 h-80 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[100px] animate-blob-drift pointer-events-none" />
      <div className="absolute bottom-32 left-[-100px] w-80 h-80 bg-violet-500/10 dark:bg-violet-500/5 rounded-full blur-[100px] animate-blob-drift-reverse pointer-events-none" />
      
      <div className="container mx-auto">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            {/* Info Column */}
            <motion.div
              initial={{ opacity: 0, x: -25 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-5 lg:sticky lg:top-28"
            >
              <span className="inline-flex items-center gap-2 text-blue-500 font-black tracking-widest uppercase text-xs mb-5 font-display px-4 py-2 rounded-full bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/15">
                <Sparkles className="w-3.5 h-3.5" />
                Get in Touch
              </span>

              <h1 className="text-5xl md:text-6xl font-black mb-5 tracking-tight font-display">
                Let's{' '}
                <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500 bg-clip-text text-transparent animate-gradient">
                  Connect
                </span>.
              </h1>
              <p className="text-base mb-10 max-w-sm font-medium leading-relaxed text-zinc-500 dark:text-zinc-400 font-sans">
                Have an exciting project, a role opening, or simply want to chat frontend designs? Send a message and let's align.
              </p>

              <div className="space-y-4">
                {contactItems.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="group"
                  >
                    {item.href ? (
                      <a href={item.href} className="flex items-center gap-4 p-4 rounded-2xl glass-card hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/10`}>
                          <item.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500 mb-0.5">{item.label}</p>
                          <p className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-blue-500 transition-colors">{item.value}</p>
                        </div>
                      </a>
                    ) : (
                      <div className="flex items-center gap-4 p-4 rounded-2xl glass-card">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shrink-0 shadow-lg shadow-violet-500/10`}>
                          <item.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500 mb-0.5">{item.label}</p>
                          <p className="text-base font-bold text-zinc-900 dark:text-white">{item.value}</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Form Column */}
            <motion.div
              initial={{ opacity: 0, x: 25 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7"
            >
              <div className="p-8 md:p-10 rounded-[2rem] glass-card shadow-2xl shadow-zinc-200/20 dark:shadow-black/20 relative overflow-hidden">
                {/* Grid pattern inside form */}
                <div className="absolute inset-0 grid-pattern pointer-events-none" />
                
                {/* Gradient line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

                <form className="space-y-6 relative z-10" onSubmit={(e) => { e.preventDefault(); alert('Message sent successfully!'); }}>
                  {/* Stacked Fields Order */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">Full Name</label>
                    <input 
                      type="text" 
                      placeholder="John Doe"
                      className={inputClasses}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">Email Address</label>
                    <input 
                      type="email" 
                      placeholder="john@example.com"
                      className={inputClasses}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">Subject</label>
                    <input 
                      type="text" 
                      placeholder="Project Inquiry"
                      className={inputClasses}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">Message Content</label>
                    <textarea 
                      rows="4"
                      placeholder="Describe your design needs or details..."
                      className={`${inputClasses} resize-none`}
                      required
                    ></textarea>
                  </div>

                  <button 
                    type="submit"
                    className="group w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-xl flex items-center justify-center gap-2.5 transition-all duration-300 transform hover:-translate-y-1 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/25 text-sm uppercase tracking-wider font-display"
                  >
                    Send Message
                    <Send className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
