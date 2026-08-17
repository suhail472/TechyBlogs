'use client';

import { Flame, Activity, Clock, CheckCircle2, FileEdit, Archive, Eye } from 'lucide-react';

const STATUS_CONFIG = {
  published: {
    label: 'Published',
    classes: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    icon: CheckCircle2,
  },
  approved: {
    label: 'Approved',
    classes: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    icon: CheckCircle2,
  },
  in_review: {
    label: 'In Review',
    classes: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    icon: Eye,
  },
  scheduled: {
    label: 'Scheduled',
    classes: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
    icon: Clock,
  },
  draft: {
    label: 'Draft',
    classes: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 border-zinc-500/20',
    icon: FileEdit,
  },
  archived: {
    label: 'Archived',
    classes: 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-500 border-zinc-500/20',
    icon: Archive,
  },
  breaking: {
    label: 'BREAKING',
    classes: 'bg-red-600 text-white border-red-600 shadow-xs shadow-red-600/20',
    icon: Flame,
    isBreaking: true,
  },
  developing: {
    label: 'DEVELOPING',
    classes: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    icon: Activity,
  },
};

export default function StatusBadge({ status = 'draft', className = '' }) {
  const normalized = (status || 'draft').toLowerCase().replace(/\s+/g, '_');
  const config = STATUS_CONFIG[normalized] || STATUS_CONFIG.draft;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border font-mono select-none ${config.classes} ${className}`}
    >
      {config.isBreaking && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
      <Icon className="w-3 h-3" />
      <span>{config.label}</span>
    </span>
  );
}
