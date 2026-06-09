'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Mail, Eye, EyeOff, Loader2, Shield } from 'lucide-react';
import useAuthStore from '@/store/useAuthStore';

export default function Login() {
  const router = useRouter();
  const { login } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const success = await login(email, password, token);
      if (success) {
        router.push('/admin');
      } else {
        setError('Invalid credentials or security token. Please try again.');
      }
    } catch (err) {
      setError(err?.message || 'Login request failed');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full pl-10 pr-4 py-3 rounded-xl border text-xs outline-none transition-all focus:border-blue-400/50 focus:ring-2 focus:ring-blue-500/10 dark:focus:border-blue-500/30 bg-white/80 border-zinc-200 text-zinc-900 placeholder-zinc-400 dark:bg-white/[0.03] dark:border-white/[0.06] dark:text-white dark:placeholder-zinc-500";

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-300 bg-zinc-50 dark:bg-[#0b0f19]">
      {/* Animated background blobs for premium depth */}
      <div className="fixed top-0 left-[-10%] w-[50%] h-[500px] bg-gradient-to-br from-blue-500/8 via-indigo-500/5 to-transparent dark:from-blue-500/4 dark:via-indigo-500/3 blur-[120px] rounded-full pointer-events-none -z-10 animate-blob-drift" />
      <div className="fixed bottom-0 right-[-10%] w-[45%] h-[500px] bg-gradient-to-br from-indigo-500/8 via-violet-500/5 to-transparent dark:from-indigo-500/4 dark:via-violet-500/2 blur-[120px] rounded-full pointer-events-none -z-10 animate-blob-drift-reverse" />

      {/* Main card panel container */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[420px] p-8 sm:p-10 rounded-[2rem] relative overflow-hidden glass-card shadow-2xl shadow-zinc-200/20 dark:shadow-black/30 z-10"
      >
        {/* Gradient accent line at top */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors group mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5 transition-transform group-hover:-translate-x-0.5" />
          Back to Site
        </Link>

        {/* Brand identity header */}
        <div className="mb-8">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-lg flex items-center justify-center font-black text-sm mb-4 shadow-lg shadow-blue-500/15">
            T
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white font-display mb-1">
            Admin <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent font-extrabold">Console</span>
          </h1>
          <p className="text-zinc-400 dark:text-zinc-500 text-xs font-semibold uppercase tracking-wider">
            Sign in to manage articles
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 dark:text-red-400 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email input field */}
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="email"
              placeholder="Admin Email Address"
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
              placeholder="Password Credentials"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-11 py-3 rounded-xl border text-xs outline-none transition-all focus:border-blue-400/50 focus:ring-2 focus:ring-blue-500/10 dark:focus:border-blue-500/30 bg-white/80 border-zinc-200 text-zinc-900 placeholder-zinc-400 dark:bg-white/[0.03] dark:border-white/[0.06] dark:text-white dark:placeholder-zinc-500"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Security Login Token input field */}
          <div className="relative">
            <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Secure Login Token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className={inputClasses}
              required
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 font-bold text-xs uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 dark:shadow-blue-500/10 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/25 font-display disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>Access Dashboard</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/admin/forgot" className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-blue-500 dark:hover:text-blue-400 font-semibold transition-colors">
            Forgot Password Credentials?
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
