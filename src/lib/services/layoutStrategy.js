/**
 * Layout Strategy & Editorial Intelligence Engine for TeachyBlogs
 * Determines intelligent layout compositions and semantic badges based on article volume,
 * content types, importance, and engagement metrics.
 */

export function getDeskLayout(stories = [], options = {}) {
  const count = stories.length;

  if (count === 0) {
    return {
      mode: 'empty',
      shouldRender: false,
      lead: null,
      secondary: [],
      compact: [],
      overflowCount: 0,
    };
  }

  if (count === 1) {
    return {
      mode: 'single-spotlight',
      shouldRender: true,
      lead: stories[0],
      secondary: [],
      compact: [],
      overflowCount: 0,
    };
  }

  if (count === 2) {
    return {
      mode: 'balanced-pair',
      shouldRender: true,
      lead: stories[0],
      secondary: [stories[1]],
      compact: [],
      overflowCount: 0,
    };
  }

  if (count === 3) {
    return {
      mode: 'triad',
      shouldRender: true,
      lead: stories[0],
      secondary: stories.slice(1, 3),
      compact: [],
      overflowCount: 0,
    };
  }

  if (count >= 4 && count <= 6) {
    return {
      mode: 'lead-and-rail',
      shouldRender: true,
      lead: stories[0],
      secondary: stories.slice(1, 3),
      compact: stories.slice(3, 6),
      overflowCount: 0,
    };
  }

  // 7+ stories
  return {
    mode: 'ensemble',
    shouldRender: true,
    lead: stories[0],
    secondary: stories.slice(1, 4),
    compact: stories.slice(4, 7),
    overflowCount: count - 7,
  };
}

export function getEditorialBadge(post) {
  if (!post) return null;

  if (post.breaking) {
    return {
      label: 'BREAKING',
      type: 'breaking',
      classes: 'bg-red-600 text-white shadow-sm',
    };
  }

  if (post.developing) {
    return {
      label: 'DEVELOPING',
      type: 'developing',
      classes: 'bg-amber-600 text-white shadow-sm',
    };
  }

  if (post.contentType === 'review') {
    return {
      label: 'REVIEW',
      type: 'review',
      classes: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    };
  }

  if (post.contentType === 'opinion') {
    return {
      label: 'OPINION',
      type: 'opinion',
      classes: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20',
    };
  }

  if (post.contentType === 'tutorial') {
    return {
      label: 'TUTORIAL',
      type: 'tutorial',
      classes: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
    };
  }

  if (post.contentType === 'guide') {
    return {
      label: 'GUIDE',
      type: 'guide',
      classes: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    };
  }

  if (post.contentType === 'analysis') {
    return {
      label: 'ANALYSIS',
      type: 'analysis',
      classes: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20',
    };
  }

  return null;
}
