'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Loader2,
  Mail,
  Lock,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Shield,
  Key,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';
import { authAPI } from '@/services/api';
import useToastStore from '@/store/useToastStore';
import OtpInput from '@/components/shared/OtpInput';

export default function ForgotPasswordAndToken() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToastStore();

  // Mode: 'password' | 'token'
  const initialMode = searchParams.get('mode') === 'token' ? 'token' : 'password';
  const [mode, setMode] = useState(initialMode);

  // Steps: 1 (Request Email) | 2 (Enter OTP) | 3 (Reset Secret) | 4 (Success)
  const [step, setStep] = useState(1);

  // Form State
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newToken, setNewToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [devOtp, setDevOtp] = useState('');

  // Sync mode if URL param changes
  useEffect(() => {
    const urlMode = searchParams.get('mode');
    if (urlMode === 'token' || urlMode === 'password') {
      setMode(urlMode);
    }
  }, [searchParams]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Mask email for display (e.g. ad***@techyblogs.com)
  const getMaskedEmail = (raw) => {
    if (!raw || !raw.includes('@')) return raw;
    const [local, domain] = raw.split('@');
    if (local.length <= 2) return `${local[0]}*@${domain}`;
    return `${local.slice(0, 2)}${'*'.repeat(Math.min(5, local.length - 2))}@${domain}`;
  };

  // Helper: Auto-generate token
  const handleGenerateToken = () => {
    const random = 'TB-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    setNewToken(random);
    addToast(`Generated Security Token: ${random}`, 'info');
  };

  // Helper: Paste from clipboard
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const cleaned = text.replace(/\D/g, '').slice(0, 6);
      if (cleaned) {
        setOtp(cleaned);
        if (cleaned.length === 6) {
          handleVerifyOtp(null, cleaned);
        }
      }
    } catch (e) {
      console.warn('Clipboard read permission denied or unavailable');
    }
  };

  // Calculate password strength
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

  // STEP 1: Request OTP Code
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid staff email address.');
      return;
    }

    setLoading(true);
    try {
      const purpose = mode === 'token' ? 'SECURITY_TOKEN_RECOVERY' : 'PASSWORD_RESET';
      const res = await authAPI.requestOtp(email.trim(), purpose);
      setCooldown(res.cooldownSeconds || 60);
      if (res.devOtp) {
        setDevOtp(res.devOtp);
      }
      setStep(2);
      addToast('Verification code dispatched to your email.', 'success');
    } catch (err) {
      setError(err.message || 'Failed to request verification code.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (e, codeToVerify) => {
    if (e) e.preventDefault();
    if (loading) return;
    setError('');

    const targetCode = codeToVerify || otp;
    if (!targetCode || targetCode.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    setLoading(true);
    try {
      const purpose = mode === 'token' ? 'SECURITY_TOKEN_RECOVERY' : 'PASSWORD_RESET';
      await authAPI.verifyOtp(email.trim(), targetCode.trim(), purpose);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Complete Password Reset or Token Recovery
  const handleCompleteReset = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');

    if (mode === 'password') {
      if (newPassword.length < 6) {
        setError('New password must be at least 6 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match. Please verify your new password.');
        return;
      }

      setLoading(true);
      try {
        await authAPI.recoverPassword(email.trim(), otp.trim(), newPassword);
        setStep(4);
      } catch (err) {
        setError(err.message || 'Password reset failed. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      // Security Token Recovery
      if (!currentPassword) {
        setError('Current password is required to verify your identity.');
        return;
      }
      if (!newToken || newToken.trim().length < 4) {
        setError('New security token must be at least 4 characters long.');
        return;
      }

      setLoading(true);
      try {
        await authAPI.recoverSecurityToken(
          email.trim(),
          otp.trim(),
          currentPassword,
          newToken.trim()
        );
        setStep(4);
      } catch (err) {
        setError(err.message || 'Security token recovery failed.');
      } finally {
        setLoading(false);
      }
    }
  };

  const inputClasses =
    'w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-white/10 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all font-sans';

  const strength = getPasswordStrength(newPassword);

  return (
    <div className="min-h-screen flex flex-col justify-between relative bg-[#FAFAFA] dark:bg-[#0a0c10] text-zinc-900 dark:text-zinc-100 font-sans selection:bg-red-500/20 selection:text-red-600 overflow-x-hidden">
      {/* Background Ambient Glows & Grid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-red-600/10 via-red-600/5 to-transparent blur-[140px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-500/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:28px_28px]" />
      </div>

      {/* Top Navigation */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-6 sm:pt-8 flex items-center justify-between">
        <Link
          href="/admin/login"
          className="inline-flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors group"
        >
          <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 group-hover:border-red-500/40 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-zinc-600 dark:text-zinc-300" />
          </div>
          <span>Back to Newsroom Sign In</span>
        </Link>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/10 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
          <Shield className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
          <span>Security Protocol 2.0</span>
        </div>
      </header>

      {/* Main Recovery Card */}
      <main className="relative z-10 w-full max-w-lg mx-auto px-4 py-8 sm:py-12 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="w-full rounded-3xl bg-white/95 dark:bg-[#121620]/95 backdrop-blur-xl border border-zinc-200/90 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.45)] p-6 sm:p-10 space-y-6"
        >
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-lg shadow-red-600/25 mb-1">
              <span className="font-black text-lg tracking-wider font-display select-none">TB</span>
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-[1.75rem] font-extrabold tracking-tight text-zinc-950 dark:text-white font-display">
                Account <span className="text-red-600 dark:text-red-500">Recovery</span>
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                {step === 1 && 'Verify your email to recover your credentials.'}
                {step === 2 && 'Enter the 6-digit one-time code sent to your email.'}
                {step === 3 && (mode === 'password' ? 'Create a secure new password.' : 'Generate or configure a new personal security token.')}
                {step === 4 && 'Account credentials successfully updated.'}
              </p>
            </div>
          </div>

          {/* Mode Switch Tabs (Only in Step 1) */}
          {step === 1 && (
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-white/5 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setMode('password');
                  setError('');
                }}
                className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'password'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-950 dark:text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Forgot Password</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('token');
                  setError('');
                }}
                className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'token'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-950 dark:text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Forgot Security Token</span>
              </button>
            </div>
          )}

          {/* Inline Error Notice */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span className="leading-snug">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ========================================================================= */}
          {/* STEP 1: REQUEST OTP CODE                                                 */}
          {/* ========================================================================= */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
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
                    placeholder="admin@teachyblogs.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClasses}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-red-600/25 cursor-pointer disabled:opacity-75"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Dispatching Verification Code...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 text-white" />
                    <span>Send Verification Code</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: ENTER 6-DIGIT OTP                                                */}
          {/* ========================================================================= */}
          {step === 2 && (
            <form onSubmit={(e) => handleVerifyOtp(e, otp)} className="space-y-6">
              <div className="text-center space-y-1">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  We sent a 6-digit one-time code to:
                </p>
                <p className="text-sm font-bold font-mono text-zinc-900 dark:text-white">
                  {getMaskedEmail(email)}
                </p>
              </div>

              <div className="py-2">
                <OtpInput
                  value={otp}
                  onChange={setOtp}
                  onComplete={(code) => handleVerifyOtp(null, code)}
                  disabled={loading}
                  error={Boolean(error)}
                />
              </div>

              {/* Dev Helper Banner (Local testing) */}
              {devOtp && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-medium">
                    <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>
                      Dev Code: <strong className="font-mono font-bold">{devOtp}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOtp(devOtp);
                      handleVerifyOtp(null, devOtp);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-450 text-zinc-950 font-bold text-[11px] transition-colors cursor-pointer"
                  >
                    1-Click Auto-Fill
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 pt-1">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="hover:text-zinc-900 dark:hover:text-white font-medium cursor-pointer"
                  >
                    Change Email
                  </button>

                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    className="hover:text-zinc-900 dark:hover:text-white font-medium text-[11px] underline cursor-pointer"
                  >
                    Paste from Clipboard
                  </button>
                </div>

                <div>
                  {cooldown > 0 ? (
                    <span className="font-mono font-bold text-zinc-400">
                      Resend in {String(Math.floor(cooldown / 60)).padStart(2, '0')}:
                      {String(cooldown % 60).padStart(2, '0')}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      disabled={loading}
                      className="font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Resend Code</span>
                    </button>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-red-600/25 cursor-pointer disabled:opacity-75"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 text-white" />
                    <span>Verify Code & Continue</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: RESET PASSWORD OR SECURITY TOKEN                                 */}
          {/* ========================================================================= */}
          {step === 3 && (
            <form onSubmit={handleCompleteReset} className="space-y-4">
              {mode === 'password' ? (
                <>
                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                      New Password *
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="At least 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-white/10 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all font-sans"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg transition-colors cursor-pointer"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password Strength Meter */}
                    {newPassword && (
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="text-zinc-500">Strength:</span>
                          <span className="text-zinc-700 dark:text-zinc-300">{strength.label}</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex gap-1">
                          <div
                            className={`h-full transition-all duration-300 ${strength.color}`}
                            style={{ width: `${(strength.score / 4) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                      Confirm New Password *
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Repeat your new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={inputClasses}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Current Password (Identity Check) */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                      Current Password (Identity Verification) *
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Enter your current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className={inputClasses}
                      />
                    </div>
                  </div>

                  {/* New Security Token */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                        New Personal Security Token *
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateToken}
                        className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3 text-amber-500" />
                        <span>Auto-Generate</span>
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="e.g. TB-NEWKEY or click Auto-Generate"
                        value={newToken}
                        onChange={(e) => setNewToken(e.target.value)}
                        className={inputClasses}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-tight">
                      Your old security token will be immediately invalidated upon saving.
                    </p>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-red-600/25 cursor-pointer disabled:opacity-75 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Updating Credentials...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>
                      {mode === 'password' ? 'Reset Password & Secure Account' : 'Update Security Token'}
                    </span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: SUCCESS CONFIRMATION                                             */}
          {/* ========================================================================= */}
          {step === 4 && (
            <div className="text-center py-4 space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-zinc-950 dark:text-white font-display">
                  {mode === 'password' ? 'Password Reset Complete' : 'Security Token Updated'}
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-sm mx-auto">
                  {mode === 'password'
                    ? 'Your newsroom password has been updated. You can now sign into the command center with your new credentials.'
                    : 'Your personal security token has been updated and your previous token invalidated. Use your new token on sign in.'}
                </p>
              </div>

              <Link
                href="/admin/login"
                className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold text-xs uppercase tracking-wider transition-all hover:bg-zinc-800 dark:hover:bg-zinc-100 shadow-md"
              >
                <span>Sign In To Newsroom</span>
              </Link>
            </div>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-6 pb-6 text-center text-xs text-zinc-400 dark:text-zinc-600">
        <p>© {new Date().getFullYear()} TeachyBlogs Publication Group. All rights reserved.</p>
      </footer>
    </div>
  );
}
