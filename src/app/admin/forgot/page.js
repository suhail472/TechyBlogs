'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/services/api';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function Forgot() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirm) {
      setError('Passwords do not match');
      return;
    }

    if (!dobYear || !dobMonth || !dobDay) {
      setError('Please provide a complete date of birth');
      return;
    }

    setLoading(true);
    try {
      // Compose DOB in YYYY-MM-DD format
      const composedDob = `${dobYear}-${String(dobMonth).padStart(2, '0')}-${String(dobDay).padStart(2, '0')}`;
      const res = await authAPI.resetPasswordByInfo(name, email, composedDob, newPassword);
      alert(res.message || 'Password reset successful');
      router.push('/admin/login');
    } catch (err) {
      setError(err.message || 'Account recovery failed');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full px-4 py-3.5 rounded-2xl border transition-all outline-none focus:ring-2 focus:ring-blue-500/50 text-sm bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400 dark:bg-zinc-800/40 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-500";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-zinc-50 dark:bg-zinc-900">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 md:p-10 rounded-[2.5rem] border shadow-2xl z-10 bg-white border-zinc-200 shadow-zinc-200/30 dark:bg-zinc-800/30 dark:border-zinc-800 dark:backdrop-blur-xl"
      >
        <Link 
          href="/admin/login" 
          className="inline-flex items-center text-xs font-black uppercase tracking-wider text-zinc-400 hover:text-blue-500 mb-6 group transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-1 transition-transform" />
          Back to Login
        </Link>

        <h2 className="text-2xl font-black mb-4 font-display text-zinc-900 dark:text-white">Recover Password</h2>
        <p className="text-zinc-400 text-xs font-medium mb-6">Provide your administrative setup info to configure a new password.</p>
        
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-black text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Superadmin Full Name" 
            className={inputClasses} 
            required 
          />
          <input 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="Superadmin Email" 
            type="email" 
            className={inputClasses} 
            required 
          />
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1 block">Date of Birth</label>
            <div className="flex gap-2">
              <select
                value={dobDay}
                onChange={(e) => setDobDay(e.target.value)}
                className={`${inputClasses} w-1/3`}
                required
              >
                <option value="">Day</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <select
                value={dobMonth}
                onChange={(e) => setDobMonth(e.target.value)}
                className={`${inputClasses} w-1/3`}
                required
              >
                <option value="">Month</option>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              <select
                value={dobYear}
                onChange={(e) => setDobYear(e.target.value)}
                className={`${inputClasses} w-1/3`}
                required
              >
                <option value="">Year</option>
                {(() => {
                  const current = new Date().getFullYear();
                  const years = [];
                  for (let y = current; y >= 1900; y--) years.push(y);
                  return years.map((y) => <option key={y} value={y}>{y}</option>);
                })()}
              </select>
            </div>
          </div>

          <input 
            value={newPassword} 
            onChange={(e) => setNewPassword(e.target.value)} 
            placeholder="New Secure Password" 
            type="password" 
            className={inputClasses} 
            required 
          />
          
          <input 
            value={confirm} 
            onChange={(e) => setConfirm(e.target.value)} 
            placeholder="Confirm New Password" 
            type="password" 
            className={inputClasses} 
            required 
          />

          <button 
            disabled={loading} 
            type="submit" 
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reset Password'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
