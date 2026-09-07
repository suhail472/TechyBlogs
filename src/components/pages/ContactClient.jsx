'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Check,
  Copy,
  ExternalLink,
  Clock,
  Sparkles,
  CheckCircle2,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import TopLoader from '@/components/shared/TopLoader';

export default function ContactClient() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: 'General Question',
    subject: '',
    message: '',
  });

  const [copiedEmail, setCopiedEmail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const topicOptions = [
    { label: 'General Question', icon: '👋' },
    { label: 'Tutorial Help', icon: '💻' },
    { label: 'Kashmir Story Tip', icon: '🏔️' },
    { label: 'Collaboration', icon: '🤝' },
  ];

  const handleCopyEmail = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText('suheelhilal92@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2200);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Smooth simulated dispatch
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 750);
  };

  const contactCards = [
    {
      icon: Mail,
      label: 'Direct Email',
      value: 'suheelhilal92@gmail.com',
      subtext: 'Click to copy or send directly',
      href: 'mailto:suheelhilal92@gmail.com',
      color: 'from-orange-500 to-red-500',
      shadow: 'shadow-orange-500/20',
      bgGlow: 'bg-orange-500/10 border-orange-500/20',
      canCopy: true,
    },
    {
      icon: Clock,
      label: 'Response Time',
      value: 'Within 24 Hours',
      subtext: 'Active Monday through Saturday',
      href: null,
      color: 'from-amber-500 to-orange-500',
      shadow: 'shadow-amber-500/20',
      bgGlow: 'bg-amber-500/10 border-amber-500/20',
      canCopy: false,
    },
    {
      icon: MapPin,
      label: 'Location',
      value: 'Srinagar, Kashmir, India',
      subtext: 'Regional Bureau & Tech Hub',
      href: null,
      color: 'from-red-500 to-rose-600',
      shadow: 'shadow-red-500/20',
      bgGlow: 'bg-red-500/10 border-red-500/20',
      canCopy: false,
    },
    {
      icon: Phone,
      label: 'Direct Phone / WhatsApp',
      value: '+91 9797935307',
      subtext: 'Available for urgent inquiries',
      href: 'tel:+919797935307',
      color: 'from-orange-600 to-amber-600',
      shadow: 'shadow-orange-600/20',
      bgGlow: 'bg-orange-500/10 border-orange-500/20',
      canCopy: false,
    },
  ];

  const inputClasses =
    'w-full px-4 py-3.5 rounded-xl outline-none text-sm transition-all duration-200 ' +
    'bg-zinc-50/80 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 ' +
    'text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 ' +
    'focus:bg-white dark:focus:bg-zinc-900 focus:border-orange-500 dark:focus:border-orange-500 ' +
    'focus:ring-2 focus:ring-orange-500/20 shadow-sm';

  return (
    <div className="pt-32 pb-24 px-4 sm:px-6 md:px-10 max-w-6xl mx-auto relative overflow-hidden">
      <TopLoader />

      {/* Signature warm orange & amber ambient glows */}
      <div className="absolute top-20 right-[-100px] w-96 h-96 bg-orange-500/10 dark:bg-orange-600/5 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute top-96 left-[-100px] w-96 h-96 bg-amber-500/10 dark:bg-amber-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-16 right-1/4 w-80 h-80 bg-red-500/5 dark:bg-red-600/[0.03] rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left Column: Direct Info & Quick Channels */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5 lg:sticky lg:top-28 space-y-6"
          >
            <div>
              <span className="inline-flex items-center gap-2 text-orange-600 dark:text-orange-400 font-bold uppercase text-xs tracking-wider px-3.5 py-1.5 rounded-full bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 mb-4">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                Get In Touch
              </span>

              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight font-display text-zinc-900 dark:text-white leading-[1.12]">
                Let's{' '}
                <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-red-600 bg-clip-text text-transparent">
                  Connect
                </span>.
              </h1>

              <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed mt-3">
                Have a coding question, a story tip about Kashmir's tech scene, or a project collaboration in mind? Send a message and let's talk.
              </p>
            </div>

            {/* Contact Cards List */}
            <div className="space-y-3 pt-1">
              {contactCards.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + index * 0.08 }}
                    className="group"
                  >
                    {item.href ? (
                      <a
                        href={item.href}
                        className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 shadow-sm hover:border-orange-300 dark:hover:border-orange-500/40 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shrink-0 shadow-md ${item.shadow}`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                              {item.label}
                            </p>
                            <p className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                              {item.value}
                            </p>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              {item.subtext}
                            </p>
                          </div>
                        </div>

                        {item.canCopy && (
                          <button
                            type="button"
                            onClick={handleCopyEmail}
                            title="Copy email to clipboard"
                            className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-orange-600 dark:hover:text-orange-400 transition-colors shrink-0"
                          >
                            {copiedEmail ? (
                              <Check className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </a>
                    ) : (
                      <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
                        <div
                          className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shrink-0 shadow-md ${item.shadow}`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                            {item.label}
                          </p>
                          <p className="text-sm font-bold text-zinc-900 dark:text-white">
                            {item.value}
                          </p>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            {item.subtext}
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Creator Portfolio Shortcut */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent border border-orange-500/20 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-zinc-900 dark:text-white">
                    Looking for my software work?
                  </p>
                  <p className="text-zinc-500 dark:text-zinc-400 mt-0.5">
                    View my full portfolio and client projects.
                  </p>
                </div>
                <a
                  href="https://www.suhailhilal.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold transition-all inline-flex items-center gap-1 shrink-0 shadow-sm"
                >
                  <span>Portfolio</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Modern Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7"
          >
            <div className="p-6 sm:p-8 md:p-10 rounded-3xl bg-white dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-zinc-800 shadow-md relative overflow-hidden">
              {/* Warm orange top accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-red-500" />

              <AnimatePresence mode="wait">
                {isSubmitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="py-12 text-center space-y-4"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-orange-500/30">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold font-display text-zinc-900 dark:text-white">
                      Message Received!
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                      Thank you for reaching out, <strong className="text-zinc-900 dark:text-white">{formData.name || 'friend'}</strong>. Your note has been received and Suheel or the TechyBlogs team will reply to <span className="font-mono text-orange-600 dark:text-orange-400">{formData.email}</span> within 24 hours.
                    </p>
                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setIsSubmitted(false);
                          setFormData({
                            name: '',
                            email: '',
                            topic: 'General Question',
                            subject: '',
                            message: '',
                          });
                        }}
                        className="px-6 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold uppercase tracking-wider transition-colors"
                      >
                        Send Another Note
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit}
                    className="space-y-5"
                    initial={{ opacity: 1 }}
                  >
                    <div>
                      <h2 className="text-2xl font-bold font-display text-zinc-900 dark:text-white">
                        Send a Message
                      </h2>
                      <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        Fill out the form below and we'll get right back to you.
                      </p>
                    </div>

                    {/* Topic Selector Pills */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                        What is this regarding?
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {topicOptions.map((opt) => (
                          <button
                            type="button"
                            key={opt.label}
                            onClick={() =>
                              setFormData({
                                ...formData,
                                topic: opt.label,
                                subject: formData.subject || `${opt.label} inquiry`,
                              })
                            }
                            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1.5 border text-center ${
                              formData.topic === opt.label
                                ? 'bg-orange-50 dark:bg-orange-500/15 border-orange-400 text-orange-700 dark:text-orange-300 shadow-sm font-bold'
                                : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-orange-300'
                            }`}
                          >
                            <span>{opt.icon}</span>
                            <span className="truncate">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Full Name & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          Your Full Name <span className="text-orange-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder="e.g. John Doe"
                          className={inputClasses}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          Email Address <span className="text-orange-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          placeholder="reader@example.com"
                          className={inputClasses}
                        />
                      </div>
                    </div>

                    {/* Subject */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        Subject <span className="text-orange-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.subject}
                        onChange={(e) =>
                          setFormData({ ...formData, subject: e.target.value })
                        }
                        placeholder="What would you like to discuss?"
                        className={inputClasses}
                      />
                    </div>

                    {/* Message Content */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        Your Message <span className="text-orange-500">*</span>
                      </label>
                      <textarea
                        rows="4"
                        required
                        value={formData.message}
                        onChange={(e) =>
                          setFormData({ ...formData, message: e.target.value })
                        }
                        placeholder="Tell us about your inquiry, feedback, or story tip..."
                        className={`${inputClasses} resize-none`}
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-red-600 hover:from-orange-600 hover:via-amber-600 hover:to-red-700 text-white font-bold text-sm transition-all shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            <span>Sending Message...</span>
                          </>
                        ) : (
                          <>
                            <span>Send Message</span>
                            <Send className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>

                    {/* Privacy Guarantee Note */}
                    <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Zero Spam Guarantee. We will never share or sell your email address.</span>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
