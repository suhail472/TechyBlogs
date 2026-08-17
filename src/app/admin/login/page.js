'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Mail, Eye, EyeOff, Loader2, Sparkles, Shield, Zap } from 'lucide-react';
import useAuthStore from '@/store/useAuthStore';
import useToastStore from '@/store/useToastStore';

export default function Login() {
  const router = useRouter();
  const { login, devBypassLogin } = useAuthStore();
  const { addToast } = useToastStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bypassLoading, setBypassLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const success = await login(email, password, token);
      if (success) {
        addToast('Welcome back to TeachyBlogs Newsroom', 'success');
        router.push('/admin');
      } else {
        setError('Invalid credentials or security token. Please verify and try again.');
      }
    } catch (err) {
      setError(err?.message || 'Login request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDevBypass = () => {
    setBypassLoading(true);
    devBypassLogin();
    addToast('⚡ Development login bypassed. Welcome Chief Editor!', 'success');
    setTimeout(() => {
      router.push('/admin');
    }, 150);
  };

  const inputClasses =
    'w-full pl-10 pr-4 py-3 rounded-xl border text-xs outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-white dark:bg-[#12151c] border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white placeholder-zinc-400 font-sans';

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#FAFAFA] dark:bg-[#0c0e12] text-zinc-900 dark:text-zinc-100 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-[420px] p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xl space-y-6"
      >
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5 transition-transform group-hover:-translate-x-0.5" />
          Back to Public Site
        </Link>

        {/* Brand identity header */}
        <div className="space-y-1.5">
          <div className="w-10 h-10 bg-red-600 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-md shadow-red-600/20 font-display">
            TB
          </div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white font-display">
            Newsroom <span className="text-red-600">Console</span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">
            Sign in to access editorial tools and publication desks.
          </p>
        </div>

        {/* 1-Click Dev Bypass Button */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 font-mono flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" /> Dev Fast Access
            </span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono font-bold">
              Development
            </span>
          </div>
          <button
            type="button"
            onClick={handleDevBypass}
            disabled={bypassLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            {bypassLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
            ) : (
              <Sparkles className="w-4 h-4 text-zinc-950" />
            )}
            <span>⚡ 1-Click Dev Bypass (Chief Editor)</span>
          </button>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200 dark:border-white/10" />
          </div>
          <span className="relative px-3 bg-white dark:bg-[#12151c] text-[10px] font-mono uppercase tracking-widest text-zinc-400">
            Or Sign In With Credentials
          </span>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Email input field */}
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="email"
              placeholder="Editor Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClasses}
              required
            />
          </div>

          {/* Password input field */}
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Newsroom Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClasses}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Optional security token */}
          <div className="relative">
            <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Security Key (Optional)"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className={inputClasses}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm shadow-red-600/20 mt-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : null}
            <span>{loading ? 'Authenticating...' : 'Sign In To Newsroom'}</span>
          </button>
        </form>

        <div className="text-center">
          <Link
            href="/admin/forgot"
            className="text-[11px] font-medium text-zinc-400 hover:text-red-600 transition-colors"
          >
            Forgot your newsroom credentials?
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
