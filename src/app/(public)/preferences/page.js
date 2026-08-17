'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, CheckCircle2, AlertCircle, Loader2, Sliders, Check } from 'lucide-react';
import useToastStore from '@/store/useToastStore';

const TOPIC_OPTIONS = ['Technology', 'Artificial Intelligence', 'Education', 'Science', 'Business', 'Travel', 'Culture', 'Kashmir'];

function PreferenceContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [edition, setEdition] = useState('global');
  const [frequency, setFrequency] = useState('daily');
  const [topics, setTopics] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { addToast } = useToastStore();

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('Missing preference token. Please use the link provided in your email.');
      return;
    }

    const fetchPrefs = async () => {
      try {
        const res = await fetch(`/api/newsletter/preferences?token=${token}`);
        const data = await res.json();
        if (data.success && data.subscriber) {
          setEmail(data.subscriber.email);
          if (data.subscriber.preferences) {
            setEdition(data.subscriber.preferences.edition || 'global');
            setFrequency(data.subscriber.preferences.frequency || 'daily');
            setTopics(data.subscriber.preferences.topics || []);
          }
        } else {
          setError(data.message || 'Invalid or expired preference link.');
        }
      } catch (err) {
        setError('Failed to load subscriber preferences.');
      } finally {
        setLoading(false);
      }
    };

    fetchPrefs();
  }, [token]);

  const handleToggleTopic = (t) => {
    setTopics((prev) => (prev.includes(t) ? prev.filter((item) => item !== t) : [...prev, t]));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/newsletter/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          preferences: { edition, frequency, topics },
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('Preferences saved successfully!', 'success');
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      addToast(err.message || 'Failed to update preferences', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center space-y-2">
        <Loader2 className="w-6 h-6 text-red-600 animate-spin mx-auto" />
        <p className="text-xs text-zinc-500 font-mono">Loading newsletter preferences...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 rounded-3xl bg-white dark:bg-[#12151c] border border-zinc-200 dark:border-white/10 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h3 className="font-bold text-base text-zinc-900 dark:text-white">Link Expired</h3>
        <p className="text-xs text-zinc-500">{error}</p>
        <Link href="/" className="inline-block pt-2 text-xs font-bold text-red-600 hover:underline">
          Return to TeachyBlogs
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto my-12 p-8 bg-white dark:bg-[#12151c] border border-zinc-200 dark:border-white/10 rounded-3xl shadow-xl space-y-6 font-sans">
      <div className="border-b border-zinc-200 dark:border-white/10 pb-4 space-y-1">
        <span className="text-[10px] font-mono font-bold text-red-600 uppercase tracking-widest">
          Subscriber Controls
        </span>
        <h2 className="font-display font-bold text-2xl text-zinc-900 dark:text-white">
          Newsletter Preferences
        </h2>
        <p className="text-xs text-zinc-500">
          Managing delivery settings for <strong>{email}</strong>
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Edition Selection */}
        <div className="space-y-2">
          <label className="font-mono font-bold text-[10px] text-zinc-400 uppercase block">
            Primary Edition
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'global', label: 'Global Edition' },
              { id: 'india', label: 'India Edition' },
              { id: 'kashmir', label: 'Kashmir Edition' },
            ].map((ed) => (
              <button
                key={ed.id}
                type="button"
                onClick={() => setEdition(ed.id)}
                className={`p-3 rounded-2xl font-bold border text-center transition-all ${
                  edition === ed.id
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent shadow-xs'
                    : 'border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                }`}
              >
                {ed.label}
              </button>
            ))}
          </div>
        </div>

        {/* Frequency */}
        <div className="space-y-2">
          <label className="font-mono font-bold text-[10px] text-zinc-400 uppercase block">
            Delivery Frequency
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'daily', label: 'Daily Briefing' },
              { id: 'weekly', label: 'Weekly Digest' },
              { id: 'breaking', label: 'Breaking Only' },
            ].map((fq) => (
              <button
                key={fq.id}
                type="button"
                onClick={() => setFrequency(fq.id)}
                className={`p-3 rounded-2xl font-bold border text-center transition-all ${
                  frequency === fq.id
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent shadow-xs'
                    : 'border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                }`}
              >
                {fq.label}
              </button>
            ))}
          </div>
        </div>

        {/* Topic Affinities */}
        <div className="space-y-2">
          <label className="font-mono font-bold text-[10px] text-zinc-400 uppercase block">
            Topics & Desks of Interest
          </label>
          <div className="flex flex-wrap gap-2">
            {TOPIC_OPTIONS.map((t) => {
              const active = topics.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleToggleTopic(t)}
                  className={`px-3 py-1.5 rounded-xl font-bold border transition-colors flex items-center gap-1.5 ${
                    active
                      ? 'bg-red-600 text-white border-red-600'
                      : 'border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  {active && <Check className="w-3 h-3" />}
                  <span>{t}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-200 dark:border-white/10 flex items-center justify-between">
          <Link
            href={`/unsubscribe?token=${token}`}
            className="text-[11px] font-bold text-rose-600 hover:underline"
          >
            Unsubscribe from all emails
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function PreferencesPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-center text-xs text-zinc-400">Loading...</div>}>
        <PreferenceContent />
      </Suspense>
    </div>
  );
}
