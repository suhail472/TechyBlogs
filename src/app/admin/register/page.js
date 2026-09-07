'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  RefreshCw,
  Key,
  Copy,
  Check,
  Award,
  PenTool,
  Crown,
} from 'lucide-react';
import useAuthStore from '@/store/useAuthStore';
import useToastStore from '@/store/useToastStore';

export default function AdminRegister() {
  const router = useRouter();
  const { register } = useAuthStore();
  const { addToast } = useToastStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('editor');
  const [registrationSecret, setRegistrationSecret] = useState('');
  const [token, setToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [error, setError] = useState('');

  const generateRandomToken = () => {
    const random = 'TB-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    setToken(random);
    addToast(`Generated Security Token: ${random}`, 'info');
  };

  const handleCopyToken = async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      setCopiedToken(true);
      addToast('Security token copied to clipboard!', 'success');
      setTimeout(() => setCopiedToken(false), 2000);
    } catch (e) {}
  };

  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: 'None', color: 'bg-zinc-200 dark:bg-zinc-700' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
    if (score <= 3) return { score: 2, label: 'Moderate', color: 'bg-amber-500' };
    if (score <= 4) return { score: 3, label: 'Strong', color: 'bg-blue-500' };
    return { score: 4, label: 'Very Strong', color: 'bg-emerald-500' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');

    if (!registrationSecret.trim()) {
      setError('Master Registration Passkey is required to authorize staff account creation.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your password.');
      return;
    }

    if (!token.trim()) {
      setError('Mandatory security token is required for all staff accounts.');
      return;
    }

    if (token.trim().length < 4) {
      setError('Security token must be at least 4 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          registrationSecret: registrationSecret.trim(),
          loginToken: token.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create newsroom account');
      }

      addToast(`Newsroom account created! Your security token is "${token.trim()}". Save it for logging in.`, 'success');
      router.push('/admin/login');
    } catch (err) {
      setError(err.message || 'Registration failed. Please verify your authorization passkey.');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses =
    'w-full pl-10 pr-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-white/10 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all font-sans';

  const roles = [
    {
      id: 'admin',
      title: 'Chief Editor',
      sub: 'Superadmin · Full Access',
      icon: Crown,
    },
    {
      id: 'editor',
      title: 'Senior Editor',
      sub: 'Drafts, Desking & Publishing',
      icon: Award,
    },
    {
      id: 'author',
      title: 'Correspondent',
      sub: 'Author · Draft Submissions',
      icon: PenTool,
    },
  ];

  const passStrength = getPasswordStrength(password);

  return (
    <div className="min-h-screen flex flex-col justify-between relative bg-[#FAFAFA] dark:bg-[#07090E] text-zinc-900 dark:text-zinc-100 font-sans selection:bg-red-500/20 selection:text-red-600 overflow-x-hidden">
      {/* Background Ambient Glows & Grid Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[850px] h-[500px] bg-gradient-to-b from-red-600/15 via-rose-600/5 to-transparent blur-[160px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[450px] h-[450px] bg-amber-500/5 blur-[140px] rounded-full" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      {/* Top Header Navigation */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-6 sm:pt-8 flex items-center justify-between">
        <Link
          href="/admin/login"
          className="inline-flex items-center gap-2.5 text-xs font-bold text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white transition-all group"
        >
          <div className="p-2 rounded-xl bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-white/10 group-hover:border-red-500/40 shadow-xs group-hover:shadow-md transition-all">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-zinc-600 dark:text-zinc-300" />
          </div>
          <span>Back to Sign In</span>
        </Link>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono font-medium">Staff Onboarding Gate</span>
        </div>
      </header>

      {/* Main Registration Card */}
      <main className="relative z-10 w-full max-w-lg mx-auto px-4 py-8 sm:py-10 flex items-center justify-center">
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
                Staff <span className="text-red-600 dark:text-red-500">Registration</span>
              </h1>
              <p className="text-xs sm:text-[13px] text-zinc-500 dark:text-zinc-400 font-medium">
                Enroll authorized newsroom staff with Master Passkey.
              </p>
            </div>
          </div>

          {/* Master Key Security Gate Badge */}
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-zinc-700 dark:text-zinc-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-red-600 dark:text-red-400">
              <Shield className="w-3.5 h-3.5" />
              <span className="uppercase text-[10px] tracking-wider font-mono">Restricted Newsroom Gate</span>
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400 font-sans">
              Registration requires the newsroom master passkey to prevent unauthorized admin account creation.
            </p>
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

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Master Registration Secret Passkey */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center justify-between">
                <span>Master Registration Passkey *</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-600 dark:text-red-400 font-mono font-bold">
                  REQUIRED
                </span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-red-500">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="Enter newsroom master passkey"
                  value={registrationSecret}
                  onChange={(e) => setRegistrationSecret(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-red-500/5 dark:bg-red-500/10 border border-red-500/30 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all font-sans"
                />
              </div>
            </div>

            {/* Role Selector */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Staff Role & Clearance
              </label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map((r) => {
                  const Icon = r.icon;
                  const isSelected = role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-md'
                          : 'bg-zinc-50 dark:bg-zinc-800/40 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mb-2 ${isSelected ? 'text-red-500 dark:text-red-600' : 'text-zinc-400'}`} />
                      <div>
                        <div className="font-bold text-xs leading-tight">{r.title}</div>
                        <div className={`text-[9px] mt-0.5 leading-tight ${isSelected ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400'}`}>
                          {r.sub}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Staff Full Name *
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suhail Hilal"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClasses}
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Staff Email Address *
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="staff@techyblogging.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClasses}
                />
              </div>
            </div>

            {/* Password & Strength */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Password *
                </label>
                {password && (
                  <span className={`text-[10px] font-bold uppercase tracking-wider font-mono ${
                    passStrength.score >= 3 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                  }`}>
                    {passStrength.label}
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="At least 6 characters"
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

              {/* Password Strength Meter Bar */}
              {password && (
                <div className="grid grid-cols-4 gap-1 pt-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        step <= passStrength.score ? passStrength.color : 'bg-zinc-200 dark:bg-zinc-700/50'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Confirm Password *
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClasses}
                />
                {confirmPassword && confirmPassword === password && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>

            {/* Mandatory Security Token / Key */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Mandatory Security Token *</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 font-mono font-bold">
                    REQUIRED
                  </span>
                </label>
                <button
                  type="button"
                  onClick={generateRandomToken}
                  className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3 text-amber-500" />
                  <span>Auto-Generate</span>
                </button>
              </div>

              <div className="relative flex items-center gap-2">
                <div className="relative flex-1">
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
                {token && (
                  <button
                    type="button"
                    onClick={handleCopyToken}
                    className="px-3.5 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold shrink-0"
                  >
                    {copiedToken ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-tight">
                Save this token! You will be required to enter it alongside your password whenever signing in or performing factor recovery.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/25 cursor-pointer disabled:opacity-75 mt-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Authorizing & Enrolling Account...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 text-white" />
                  <span>Enroll Newsroom Account</span>
                </>
              )}
            </button>
          </form>

          {/* Already have an account */}
          <div className="pt-2 text-center border-t border-zinc-100 dark:border-white/5 space-y-1">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Already have a newsroom account?{' '}
              <Link href="/admin/login" className="font-bold text-red-600 dark:text-red-400 hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-6 pb-6 text-center text-xs text-zinc-400 dark:text-zinc-600">
        <p>© {new Date().getFullYear()} TechyBlogs Publication Group · Protected by Multi-Factor Gate</p>
      </footer>
    </div>
  );
}
