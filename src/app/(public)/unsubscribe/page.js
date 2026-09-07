'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setMessage('Invalid or missing unsubscribe token.');
      return;
    }

    const processUnsubscribe = async () => {
      try {
        const res = await fetch('/api/newsletter/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, reason: '1-click link unsubscribe' }),
        });
        const data = await res.json();
        if (data.success) {
          setSuccess(true);
          setMessage(data.message || 'You have been successfully unsubscribed.');
        } else {
          setMessage(data.message || 'Unable to process unsubscribe request.');
        }
      } catch (err) {
        setMessage('Network error. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    processUnsubscribe();
  }, [token]);

  return (
    <div className="max-w-md mx-auto my-16 p-8 bg-white dark:bg-[#12151c] border border-zinc-200 dark:border-white/10 rounded-3xl shadow-xl text-center space-y-4">
      {loading ? (
        <div className="py-8 space-y-3">
          <Loader2 className="w-8 h-8 text-red-600 animate-spin mx-auto" />
          <p className="text-xs text-zinc-500 font-mono">Processing unsubscribe request...</p>
        </div>
      ) : success ? (
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 grid place-items-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="font-display font-bold text-xl text-zinc-900 dark:text-white">
            Unsubscribed Successfully
          </h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
            {message} You will no longer receive editorial briefings from TechyBlogs.
          </p>
          <div className="pt-4">
            <Link
              href="/"
              className="inline-block px-5 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold"
            >
              Return to TechyBlogs Home
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-600 grid place-items-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="font-display font-bold text-xl text-zinc-900 dark:text-white">
            Unsubscribe Link Invalid
          </h2>
          <p className="text-xs text-zinc-500 leading-relaxed font-sans">{message}</p>
          <div className="pt-4">
            <Link href="/" className="text-xs font-bold text-red-600 hover:underline">
              Return to Homepage
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-center text-xs text-zinc-400">Loading...</div>}>
        <UnsubscribeContent />
      </Suspense>
    </div>
  );
}
