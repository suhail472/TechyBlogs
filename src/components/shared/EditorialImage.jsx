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
  Sparkles,
  Newspaper,
  Layers,
} from 'lucide-react';

/**
 * Category-based fallback motifs and color palettes
 */
const CATEGORY_THEMES = {
  education: {
    icon: GraduationCap,
    label: 'Education & Admissions',
    bg: 'from-blue-950/80 via-slate-900 to-indigo-950',
    border: 'border-blue-500/20',
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    accent: 'text-blue-400',
  },
  technology: {
    icon: Cpu,
    label: 'Technology & AI',
    bg: 'from-zinc-950 via-slate-900 to-zinc-900',
    border: 'border-cyan-500/20',
    badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    accent: 'text-cyan-400',
  },
  kashmir: {
    icon: MapPin,
    label: 'Kashmir Bureau',
    bg: 'from-zinc-950 via-emerald-950/40 to-slate-900',
    border: 'border-emerald-500/20',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    accent: 'text-emerald-400',
  },
  travel: {
    icon: Compass,
    label: 'Travel & Heritage',
    bg: 'from-amber-950/40 via-stone-900 to-zinc-950',
    border: 'border-amber-500/20',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    accent: 'text-amber-400',
  },
  review: {
    icon: Star,
    label: 'Gear Lab & Review',
    bg: 'from-zinc-950 via-neutral-900 to-zinc-900',
    border: 'border-amber-500/20',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    accent: 'text-amber-400',
  },
  news: {
    icon: Newspaper,
    label: 'News & Reporting',
    bg: 'from-zinc-950 via-slate-900 to-zinc-900',
    border: 'border-red-500/20',
    badge: 'bg-red-500/10 text-red-400 border-red-500/20',
    accent: 'text-red-400',
  },
  default: {
    icon: FileText,
    label: 'Editorial Feature',
    bg: 'from-zinc-950 via-slate-900 to-zinc-900',
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
 * Robust image loader that automatically handles missing, broken, or failed remote images
 * by rendering an intentional, category-driven editorial placeholder instead of a broken browser icon.
 */
export default function EditorialImage({
  src,
  alt = '',
  category = '',
  title = '',
  className = 'w-full h-full object-cover',
  aspectRatio = '',
  priority = false,
  showTitleInFallback = true,
}) {
  const [imageError, setImageError] = useState(!src || src.trim() === '');
  const theme = resolveTheme(category, title);
  const IconComponent = theme.icon;

  if (imageError) {
    return (
      <div
        className={`w-full h-full min-h-[160px] bg-gradient-to-br ${theme.bg} ${theme.border} border p-6 flex flex-col justify-between relative overflow-hidden select-none`}
        role="img"
        aria-label={alt || title || theme.label}
      >
        {/* Subtle geometric background watermark */}
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
          <IconComponent className="w-48 h-48 text-white" />
        </div>

        {/* Top Kicker / Badge */}
        <div className="flex items-center justify-between z-10">
          <span
            className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full border ${theme.badge}`}
          >
            <IconComponent className="w-3.5 h-3.5" />
            <span>{category || theme.label}</span>
          </span>
          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 font-display">
            TeachyBlogs Dispatch
          </span>
        </div>

        {/* Center / Bottom Editorial Watermark Text */}
        {showTitleInFallback && title && (
          <div className="z-10 mt-4 max-w-lg">
            <p className="font-display font-black text-white/90 text-sm md:text-base leading-snug line-clamp-2">
              {title}
            </p>
          </div>
        )}

        {/* Bottom subtle rule */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[10px] text-zinc-400 z-10">
          <span className="font-semibold text-zinc-400 font-sans">Editorial Coverage</span>
          <span className="text-zinc-500 font-mono">TeachyBlogs Bureau</span>
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
