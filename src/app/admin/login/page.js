'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Zap,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Fingerprint,
  Sparkles,
} from 'lucide-react';
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
    if (loading) return;
    setLoading(true);
    setError('');

    try {
      const success = await login(email.trim(), password, token.trim());
      if (success) {
        addToast('Welcome back to TeachyBlogs Newsroom', 'success');
        router.push('/admin');
      } else {
        setError('Invalid credentials or security key. Please check your email, password, and security token.');
      }
    } catch (err) {
      setError(err?.message || 'Authentication request failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDevBypass = () => {
    if (bypassLoading) return;
    setBypassLoading(true);
    devBypassLogin();
    addToast('⚡ Development login bypassed. Welcome Chief Editor!', 'success');
    setTimeout(() => {
      router.push('/admin');
    }, 250);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between relative bg-[#FAFAFA] dark:bg-[#07090E] text-zinc-900 dark:text-zinc-100 font-sans selection:bg-red-500/20 selection:text-red-600 overflow-x-hidden">
      {/* Background Ambient Glows & Subtle Grid Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[850px] h-[500px] bg-gradient-to-b from-red-600/15 via-rose-600/5 to-transparent blur-[160px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[450px] h-[450px] bg-blue-500/5 blur-[140px] rounded-full" />
        <div className="absolute top-[30%] right-[-5%] w-[400px] h-[400px] bg-amber-500/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      {/* Top Header Navigation */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-6 sm:pt-8 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 text-xs font-bold text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white transition-all group"
        >
          <div className="p-2 rounded-xl bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-white/10 group-hover:border-red-500/40 shadow-xs group-hover:shadow-md transition-all">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-zinc-600 dark:text-zinc-300" />
          </div>
          <span>Return to Publication</span>
        </Link>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono font-medium">Newsroom v2.4</span>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="relative z-10 w-full max-w-md mx-auto px-4 py-8 sm:py-10 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full rounded-3xl bg-white/95 dark:bg-[#0E131F]/90 backdrop-blur-2xl border border-zinc-200/80 dark:border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.06)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.55)] p-6 sm:p-9 space-y-6"
        >
          {/* Brand Identity & Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-gradient-to-br from-red-600 via-red-600 to-rose-700 text-white shadow-xl shadow-red-600/30 mb-1 ring-4 ring-red-600/10">
              <span className="font-black text-xl tracking-wider font-display select-none">TB</span>
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-[1.65rem] font-black tracking-tight text-zinc-950 dark:text-white font-display">
                Newsroom <span className="text-red-600 dark:text-red-500">Command</span>
              </h1>
              <p className="text-xs sm:text-[13px] text-zinc-500 dark:text-zinc-400 font-medium">
                Sign in to manage editorials, desking, and publications.
              </p>
            </div>
          </div>

          {/* 1-Click Fast Dev Bypass Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/25 dark:border-amber-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5 font-mono">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Developer Fast Access</span>
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-mono font-bold">
                Local Dev
              </span>
            </div>
            <button
              type="button"
              onClick={handleDevBypass}
              disabled={bypassLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-450 active:scale-[0.99] text-zinc-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm shadow-amber-500/20 cursor-pointer disabled:opacity-75"
            >
              {bypassLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
              ) : (
                <Zap className="w-4 h-4 text-zinc-950" />
              )}
              <span>{bypassLoading ? 'Signing In...' : '1-Click Superadmin Sign In'}</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-zinc-200 dark:border-white/10" />
            <span className="absolute px-3 bg-white dark:bg-[#0E131F] text-[10px] font-bold uppercase tracking-widest text-zinc-400 select-none">
              Or Sign In With Key
            </span>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span className="leading-snug">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Staff Email Address
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="editor@techyblogging.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-white/10 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all font-sans"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Password
                </label>
                <Link
                  href="/admin/forgot?mode=password"
                  className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-white/10 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Mandatory Security Token */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                  <span>Security Token</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 font-mono font-bold">
                    MANDATORY
                  </span>
                </label>
                <Link
                  href="/admin/forgot?mode=token"
                  className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  Forgot token?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. TB-XXXXXX"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-white/10 text-xs sm:text-sm font-mono text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/25 cursor-pointer disabled:opacity-75 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 text-white" />
                  <span>Sign In To Newsroom</span>
                </>
              )}
            </button>
          </form>

          {/* Registration Link & Security Footer */}
          <div className="pt-2 text-center border-t border-zinc-100 dark:border-white/5 space-y-2">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Need staff or editorial access?{' '}
              <Link href="/admin/register" className="font-bold text-red-600 dark:text-red-400 hover:underline">
                Register here
              </Link>
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center justify-center gap-1.5">
              <Fingerprint className="w-3.5 h-3.5 text-zinc-400" />
              <span>Multi-Factor Authentication & Cryptographic Gate</span>
            </p>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-6 pb-6 text-center text-xs text-zinc-400 dark:text-zinc-600">
        <p>© {new Date().getFullYear()} TeachyBlogs Publication Group · Security Protected</p>
      </footer>
    </div>
  );
}
