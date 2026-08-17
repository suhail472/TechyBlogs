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
    badge: 'text-blue-700 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
  },
  technology: {
    icon: Cpu,
    label: 'Technology & AI',
    badge: 'text-cyan-700 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  },
  kashmir: {
    icon: MapPin,
    label: 'Kashmir Bureau',
    badge: 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
  travel: {
    icon: Compass,
    label: 'Travel & Heritage',
    badge: 'text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
  review: {
    icon: Star,
    label: 'Gear Lab & Review',
    badge: 'text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
  news: {
    icon: Newspaper,
    label: 'News & Reporting',
    badge: 'text-red-700 dark:text-red-400 bg-red-500/10 border-red-500/20',
  },
  default: {
    icon: FileText,
    label: 'Editorial Dispatch',
    badge: 'text-zinc-700 dark:text-zinc-300 bg-zinc-500/10 border-zinc-500/20',
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
 * a quiet, non-competing editorial backdrop matching the site's light/dark theme.
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
        className="w-full h-full min-h-[140px] bg-zinc-100 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-white/10 p-5 flex flex-col justify-between relative overflow-hidden select-none transition-colors"
        role="img"
        aria-label={alt || title || theme.label}
      >
        {/* Minimalist Top Category Badge */}
        <div className="flex items-center justify-between z-10">
          <span
            className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.18em] px-2.5 py-0.5 rounded-md border ${theme.badge}`}
          >
            <IconComponent className="w-3 h-3" />
            <span>{category || theme.label}</span>
          </span>
          <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Dispatch
          </span>
        </div>

        {/* Quiet, minimalist icon seal in center */}
        <div className="flex items-center justify-center my-auto py-2 opacity-30 dark:opacity-20">
          <div className="w-10 h-10 rounded-xl border border-zinc-300 dark:border-white/10 flex items-center justify-center">
            <IconComponent className="w-5 h-5 text-zinc-700 dark:text-zinc-200" />
          </div>
        </div>

        {/* Bottom subtle masthead rule */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-200/80 dark:border-white/5 text-[9px] text-zinc-400 dark:text-zinc-500 z-10 font-mono">
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
