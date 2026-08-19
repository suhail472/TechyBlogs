'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Mail, User, ShieldCheck, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import useAuthStore from '@/store/useAuthStore';
import useToastStore from '@/store/useToastStore';

export default function AuthModal({ isOpen, onClose, onSuccess, initialMode = 'login', message = '' }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login, register, devBypassLogin } = useAuthStore();
  const { addToast } = useToastStore();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      if (mode === 'login') {
        const success = await login(email.trim(), password);
        if (success) {
          addToast('Signed in successfully', 'success');
          if (onSuccess) onSuccess();
          onClose();
        } else {
          setErrorMsg('Invalid email or password');
        }
      } else {
        if (!name.trim()) {
          setErrorMsg('Please enter your full name');
          setSubmitting(false);
          return;
        }
        const success = await register(name.trim(), email.trim(), password);
        if (success) {
          addToast('Account created! Please sign in.', 'success');
          setMode('login');
        } else {
          setErrorMsg('Failed to create account. Email may already be in use.');
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDevBypass = () => {
    devBypassLogin();
    addToast('Signed in as Chief Editor (Demo Mode)', 'success');
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        {/* Backdrop click */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative bg-white dark:bg-[#151922] border border-zinc-200 dark:border-white/10 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl z-10 font-sans"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 font-mono">
                  TeachyBlogs Identity
                </span>
              </div>
              <h2 id="auth-modal-title" className="font-display font-black text-xl sm:text-2xl text-zinc-900 dark:text-white">
                {mode === 'login' ? 'Join the Conversation' : 'Create Reader Account'}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {message || (mode === 'login'
                  ? 'Sign in to comment, reply, like, and participate in discussion.'
                  : 'Join the TeachyBlogs community for civil discussions.')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-800/80 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {mode === 'register' && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">Your Full Name</label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. A. Rahman"
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border outline-none bg-zinc-50/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder-zinc-400 focus:ring-2 focus:ring-red-500/20"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">Email Address</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 w-4 h-4 text-zinc-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border outline-none bg-zinc-50/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder-zinc-400 focus:ring-2 focus:ring-red-500/20"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">Password</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 w-4 h-4 text-zinc-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border outline-none bg-zinc-50/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder-zinc-400 focus:ring-2 focus:ring-red-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3 rounded-xl font-bold uppercase tracking-wider bg-red-600 hover:bg-red-500 text-white transition-colors flex items-center justify-center gap-2 shadow-sm shadow-red-600/20 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In to Continue' : 'Create My Account'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Bypass (Useful for paired review and testing) */}
          <div className="pt-3 border-t border-zinc-200/80 dark:border-white/10">
            <button
              type="button"
              onClick={handleDevBypass}
              className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>1-Click Demo Sign-In (Chief Editor)</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
