'use client';

import { useState } from 'react';
import {
  GraduationCap,
  Cpu,
  MapPin,
  Compass,
  Star,
  BookOpen,
  FileText,
  Newspaper,
} from 'lucide-react';

const CATEGORY_THEMES = {
  education: {
    icon: GraduationCap,
    label: 'Education & Admissions',
    bg: 'from-slate-900 via-blue-950/50 to-zinc-950',
    border: 'border-blue-500/20',
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    accent: 'text-blue-400',
  },
  technology: {
    icon: Cpu,
    label: 'Technology & AI',
    bg: 'from-zinc-900 via-slate-950 to-zinc-950',
    border: 'border-cyan-500/20',
    badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    accent: 'text-cyan-400',
  },
  kashmir: {
    icon: MapPin,
    label: 'Kashmir Bureau',
    bg: 'from-zinc-950 via-emerald-950/30 to-zinc-900',
    border: 'border-emerald-500/20',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    accent: 'text-emerald-400',
  },
  travel: {
    icon: Compass,
    label: 'Travel & Heritage',
    bg: 'from-stone-900 via-amber-950/30 to-zinc-950',
    border: 'border-amber-500/20',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    accent: 'text-amber-400',
  },
  review: {
    icon: Star,
    label: 'Gear Lab & Review',
    bg: 'from-zinc-900 via-neutral-950 to-zinc-950',
    border: 'border-amber-500/20',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    accent: 'text-amber-400',
  },
  news: {
    icon: Newspaper,
    label: 'News & Reporting',
    bg: 'from-zinc-900 via-red-950/30 to-zinc-950',
    border: 'border-red-500/20',
    badge: 'bg-red-500/10 text-red-400 border-red-500/30',
    accent: 'text-red-400',
  },
  default: {
    icon: FileText,
    label: 'Editorial Feature',
    bg: 'from-zinc-900 via-zinc-950 to-black',
    border: 'border-white/10',
    badge: 'bg-white/10 text-zinc-300 border-white/15',
    accent: 'text-zinc-400',
  },
};

const resolveTheme = (category = '', title = '') => {
  const text = `${category} ${title}`.toLowerCase();
  if (/kashmir|srinagar|dal lake|gulmarg|jammu/i.test(text)) return CATEGORY_THEMES.kashmir;
  if (/education|admission|university|exam|syllabus|college/i.test(text)) return CATEGORY_THEMES.education;
  if (/tech|code|react|ai|next\.js|software|python|hardware|chip/i.test(text)) return CATEGORY_THEMES.technology;
  if (/travel|tour|heritage|autumn|winter/i.test(text)) return CATEGORY_THEMES.travel;
  if (/review|benchmark|rating|scorecard/i.test(text)) return CATEGORY_THEMES.review;
  if (/news|breaking|report|announcement/i.test(text)) return CATEGORY_THEMES.news;
  return CATEGORY_THEMES.default;
};

/**
 * EditorialImage Component
 * Clean, restrained image loader with automatic onError fallback that renders
 * a quiet, non-competing editorial backdrop instead of broken-image states.
 */
export default function EditorialImage({
  src,
  alt = '',
  category = '',
  title = '',
  className = 'w-full h-full object-cover',
  priority = false,
}) {
  const [imageError, setImageError] = useState(!src || src.trim() === '');
  const theme = resolveTheme(category, title);
  const IconComponent = theme.icon;

  if (imageError) {
    return (
      <div
        className={`w-full h-full min-h-[140px] bg-gradient-to-br ${theme.bg} ${theme.border} border p-5 flex flex-col justify-between relative overflow-hidden select-none`}
        role="img"
        aria-label={alt || title || theme.label}
      >
        {/* Subtle, non-intrusive top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        {/* Minimalist Top Category Badge */}
        <div className="flex items-center justify-between z-10">
          <span
            className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.18em] px-2.5 py-0.5 rounded-md border ${theme.badge}`}
          >
            <IconComponent className="w-3 h-3" />
            <span>{category || theme.label}</span>
          </span>
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
            Dispatch
          </span>
        </div>

        {/* Quiet, minimalist icon seal in center */}
        <div className="flex items-center justify-center my-auto py-2 opacity-25">
          <div className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center">
            <IconComponent className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Bottom subtle masthead rule */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[9px] text-zinc-500 z-10 font-mono">
          <span>TeachyBlogs</span>
          <span>Editorial Bureau</span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || title}
      loading={priority ? 'eager' : 'lazy'}
      onError={() => setImageError(true)}
      className={className}
    />
  );
}
