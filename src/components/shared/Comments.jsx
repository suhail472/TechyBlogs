'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ThumbsUp,
  ThumbsDown,
  MoreVertical,
  Trash2,
  Flag,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
  Loader2,
  BadgeCheck,
  Pin,
  X,
  AlertTriangle,
  LogIn,
} from 'lucide-react';
import useAuthStore from '@/store/useAuthStore';
import useToastStore from '@/store/useToastStore';
import AuthModal from '@/components/auth/AuthModal';

const REPORT_REASONS = [
  'Spam / Promotional',
  'Harassment or Hate Speech',
  'Misinformation / False Context',
  'Threatening / Abusive Language',
  'Off-Topic / Derailing',
  'Personal Information (Doxxing)',
];

// YouTube-like colorful avatar palette based on name hash
const AVATAR_COLORS = [
  'bg-[#00796b]', // Teal
  'bg-[#3949ab]', // Indigo
  'bg-[#c2185b]', // Crimson
  'bg-[#00897b]', // Turquoise
  'bg-[#5e35b1]', // Deep Purple
  'bg-[#d81b60]', // Pink
  'bg-[#1e88e5]', // Blue
  'bg-[#00acc1]', // Cyan
  'bg-[#43a047]', // Green
  'bg-[#f4511e]', // Deep Orange
  'bg-[#8e24aa]', // Purple
  'bg-[#37474f]', // Blue Grey
];

function getAvatarColor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

function getHandle(name = '') {
  if (!name || name === '[deleted]') return '@user';
  const clean = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `@${clean || 'user'}`;
}

function formatYouTubeTimestamp(iso) {
  if (!iso) return '0 seconds ago';
  const date = new Date(iso);
  const now = new Date();
  const diffSec = Math.max(0, Math.floor((now - date) / 1000));

  if (diffSec < 45) return '0 seconds ago';
  if (diffSec < 90) return '1 minute ago';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minutes ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) return '1 week ago';
  if (diffWeeks < 4) return `${diffWeeks} weeks ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return '1 month ago';
  if (diffMonths < 12) return `${diffMonths} months ago`;

  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`;
}

export default function Comments({ slug }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [isMainFocused, setIsMainFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState('');
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [collapsedThreads, setCollapsedThreads] = useState({});
  const [reportingComment, setReportingComment] = useState(null);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [deleteConfirmComment, setDeleteConfirmComment] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [localNotices, setLocalNotices] = useState({});
  const [mySessionCommentIds, setMySessionCommentIds] = useState(new Set());

  const { user, isAuthenticated } = useAuthStore();
  const { addToast } = useToastStore();

  useEffect(() => {
    fetchComments();
    try {
      const stored = sessionStorage.getItem('tb_my_comments');
      if (stored) {
        setMySessionCommentIds(new Set(JSON.parse(stored)));
      }
    } catch (e) {}
  }, [slug]);

  const recordMyComment = (id) => {
    if (!id) return;
    setMySessionCommentIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        sessionStorage.setItem('tb_my_comments', JSON.stringify(Array.from(next)));
      } catch (e) {}
      return next;
    });
  };

  // Close menus on outside click or escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveMenuId(null);
        setDeleteConfirmComment(null);
        setReportingComment(null);
      }
    };
    const handleClickOutside = (e) => {
      if (!e.target.closest('[data-comment-menu]')) {
        setActiveMenuId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?slug=${slug}`);
      const data = await res.json();
      if (data.success) {
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setLoading(false);
    }
  };

  // Build Hierarchical Comment Tree
  const commentTree = useMemo(() => {
    const commentMap = {};
    const rootComments = [];

    comments.forEach((c) => {
      commentMap[c._id] = { ...c, replies: [] };
    });

    comments.forEach((c) => {
      if (c.parent && commentMap[c.parent]) {
        commentMap[c.parent].replies.push(commentMap[c._id]);
      } else {
        rootComments.push(commentMap[c._id]);
      }
    });

    // Pinned comments first, then chronological
    return rootComments.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(a.createdAt || a.timestamp) - new Date(b.createdAt || b.timestamp);
    });
  }, [comments]);

  const totalCommentCount = useMemo(() => {
    return comments.filter((c) => !c.isDeleted || (c.status !== 'deleted' && c.text !== '[Comment deleted by author]')).length;
  }, [comments]);

  const toggleCollapse = (commentId) => {
    setCollapsedThreads((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const handlePostMainComment = async (e) => {
    if (e) e.preventDefault();
    if (!isAuthenticated) {
      setAuthModalMessage('Sign in to share your thoughts on this story.');
      setAuthModalOpen(true);
      return;
    }
    if (!text.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          text: text.trim(),
          parentId: null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.data?._id) {
          recordMyComment(data.data._id);
        }
        setText('');
        setIsMainFocused(false);
        if (data.data?.status === 'approved') {
          addToast('Comment posted!', 'success');
          fetchComments();
        } else {
          addToast('Your comment has been submitted for editorial moderation.', 'info');
        }
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      addToast(err.message || 'Failed to post comment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostReply = async (parentId) => {
    if (!isAuthenticated) {
      setAuthModalMessage('Sign in to reply to this comment.');
      setAuthModalOpen(true);
      return;
    }
    if (!replyText.trim()) return;

    setReplySubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          text: replyText.trim(),
          parentId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.data?._id) {
          recordMyComment(data.data._id);
        }
        setReplyText('');
        setReplyingToId(null);
        // Expand parent thread to view new reply immediately
        setCollapsedThreads((prev) => ({ ...prev, [parentId]: false }));

        if (data.data?.status === 'approved') {
          addToast('Reply posted!', 'success');
          fetchComments();
        } else {
          addToast('Your reply is awaiting editorial moderation.', 'info');
        }
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      addToast(err.message || 'Failed to submit reply', 'error');
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleReaction = async (commentId, reactionType) => {
    if (!isAuthenticated) {
      setAuthModalMessage('Sign in to react to comments.');
      setAuthModalOpen(true);
      return;
    }

    const currentUserId = user?._id?.toString();

    // Optimistic UI update
    setComments((prev) =>
      prev.map((c) => {
        if (c._id !== commentId) return c;
        const currentLikes = c.likes || [];
        const currentDislikes = c.dislikes || [];
        const hasLiked = currentLikes.includes(currentUserId);
        const hasDisliked = currentDislikes.includes(currentUserId);

        let nextLikes = [...currentLikes];
        let nextDislikes = [...currentDislikes];

        if (reactionType === 'like') {
          if (hasLiked) {
            nextLikes = nextLikes.filter((id) => id !== currentUserId);
          } else {
            nextLikes.push(currentUserId);
            nextDislikes = nextDislikes.filter((id) => id !== currentUserId);
          }
        } else if (reactionType === 'dislike') {
          if (hasDisliked) {
            nextDislikes = nextDislikes.filter((id) => id !== currentUserId);
          } else {
            nextDislikes.push(currentUserId);
            nextLikes = nextLikes.filter((id) => id !== currentUserId);
          }
        }

        return {
          ...c,
          likes: nextLikes,
          dislikes: nextDislikes,
          likesCount: nextLikes.length,
          dislikesCount: nextDislikes.length,
        };
      })
    );

    try {
      const res = await fetch(`/api/comments/${commentId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction: reactionType }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message);
      }
      // Server authoritative sync
      setComments((prev) =>
        prev.map((c) =>
          c._id === commentId
            ? { ...c, likesCount: data.likesCount, dislikesCount: data.dislikesCount }
            : c
        )
      );
    } catch (err) {
      fetchComments();
      addToast(err.message || 'Failed to update reaction', 'error');
    }
  };

  const handleDeleteComment = async () => {
    if (!deleteConfirmComment) return;
    const commentId = deleteConfirmComment._id;
    setDeleting(true);

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        const deletedSet = new Set(data.deletedIds || [commentId]);
        setComments((prev) => prev.filter((c) => !deletedSet.has(c._id) && !deletedSet.has(c.parent)));
        setDeleteConfirmComment(null);
        addToast(data.deletedCount > 1 ? `Comment and ${data.deletedCount - 1} replies deleted` : 'Comment deleted', 'info');
        fetchComments();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      addToast(err.message || 'Failed to delete comment', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportingComment) return;
    const commentId = reportingComment._id;
    setReportSubmitting(true);

    try {
      const res = await fetch(`/api/comments/${commentId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reportReason }),
      });
      const data = await res.json();
      if (data.success) {
        setReportingComment(null);
        setLocalNotices((prev) => ({ ...prev, [commentId]: 'Report submitted' }));
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      addToast(err.message || 'Failed to report comment', 'error');
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleCopyLink = (commentId) => {
    const url = `${window.location.origin}${window.location.pathname}#comment-${commentId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(commentId);
    setTimeout(() => setCopiedId(null), 2000);
    setActiveMenuId(null);
  };

  // Render YouTube-Style Comment Row
  const renderComment = (comment, isReply = false) => {
    const currentUserId = user?._id?.toString() || user?.id?.toString() || '';
    const currentUserName = (user?.name || '').toLowerCase().trim();
    const commentAuthorId = comment.author ? String(comment.author) : '';
    const commentUserId = comment.user ? String(comment.user) : '';
    const commentName = (comment.name || '').toLowerCase().trim();
    const isSessionOwner = mySessionCommentIds.has(comment._id);

    const isOwner =
      isSessionOwner ||
      (
        (Boolean(commentAuthorId && currentUserId) && commentAuthorId === currentUserId) ||
        (Boolean(commentUserId && currentUserId) && commentUserId === currentUserId) ||
        (Boolean(currentUserName && commentName) && currentUserName === commentName)
      );

    const isModerator =
      isAuthenticated &&
      ['editor', 'admin', 'superadmin', 'editor in chief', 'chief editor'].includes(
        String(user?.role || '').toLowerCase().trim()
      );

    const isDeleted = comment.status === 'deleted' || comment.isDeleted;
    const hasLiked = (comment.likes || []).includes(currentUserId);
    const hasDisliked = (comment.dislikes || []).includes(currentUserId);
    const hasReplies = comment.replies && comment.replies.length > 0;
    const isCollapsed = !!collapsedThreads[comment._id];
    const isReplying = replyingToId === comment._id;
    const localNotice = localNotices[comment._id];
    const avatarColor = getAvatarColor(comment.name);
    const handle = getHandle(comment.name);

    return (
      <div key={comment._id} id={`comment-${comment._id}`} className="relative group">
        <div className="flex items-start gap-4">
          {/* Avatar (Root: 40px, Reply: 28px) */}
          <div className="shrink-0 pt-0.5">
            {comment.avatar ? (
              <img
                src={comment.avatar}
                alt={comment.name}
                className={`${
                  isReply ? 'w-7 h-7' : 'w-10 h-10'
                } rounded-full object-cover`}
              />
            ) : (
              <div
                className={`${
                  isReply ? 'w-7 h-7 text-xs' : 'w-10 h-10 text-sm'
                } ${avatarColor} text-white font-medium rounded-full grid place-items-center uppercase select-none`}
              >
                {isDeleted ? '?' : comment.name ? comment.name[0] : 'U'}
              </div>
            )}
          </div>

          {/* Comment Body */}
          <div className="min-w-0 flex-1 space-y-1">
            {/* Header: @handle + timestamp */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[13px] font-medium text-zinc-900 dark:text-[#f1f1f1]">
                  {isDeleted ? '@deleted' : handle}
                </span>

                {comment.isEditorial && !isDeleted && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-[10px] font-semibold">
                    <BadgeCheck className="w-2.5 h-2.5 text-blue-500" />
                    <span>{comment.editorialBadge || 'Author'}</span>
                  </span>
                )}

                {comment.isPinned && !isDeleted && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-semibold">
                    <Pin className="w-2.5 h-2.5" />
                    <span>Pinned</span>
                  </span>
                )}

                <span className="text-[12px] text-zinc-500 dark:text-[#aaaaaa]">
                  {formatYouTubeTimestamp(comment.createdAt || comment.timestamp)}
                </span>
              </div>

              {/* 3-Dots Menu (⋮) */}
              {!isDeleted && (
                <div className="relative shrink-0" data-comment-menu>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === comment._id ? null : comment._id);
                    }}
                    className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 rounded-full transition-colors opacity-80 group-hover:opacity-100 focus:opacity-100"
                    aria-label="Action menu"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  <AnimatePresence>
                    {activeMenuId === comment._id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -2 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -2 }}
                        transition={{ duration: 0.1 }}
                        className="absolute right-0 top-full mt-1 w-36 rounded-xl bg-white dark:bg-[#212121] border border-zinc-200 dark:border-white/10 py-1.5 shadow-2xl z-40 text-xs font-normal"
                        role="menu"
                      >
                        <button
                          type="button"
                          onClick={() => handleCopyLink(comment._id)}
                          className="w-full px-3.5 py-2 text-left text-zinc-800 dark:text-[#f1f1f1] hover:bg-zinc-100 dark:hover:bg-white/10 flex items-center gap-2.5"
                          role="menuitem"
                        >
                          <LinkIcon className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{copiedId === comment._id ? 'Link copied' : 'Copy link'}</span>
                        </button>

                        {(isOwner || isModerator) && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              setDeleteConfirmComment(comment);
                            }}
                            className="w-full px-3.5 py-2 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2.5"
                            role="menuitem"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        )}

                        {!isOwner && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              setReportingComment(comment);
                            }}
                            className="w-full px-3.5 py-2 text-left text-zinc-800 dark:text-[#f1f1f1] hover:bg-zinc-100 dark:hover:bg-white/10 flex items-center gap-2.5"
                            role="menuitem"
                          >
                            <Flag className="w-3.5 h-3.5 text-zinc-400" />
                            <span>Report</span>
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Comment Text */}
            <div className="text-[14px] text-zinc-900 dark:text-[#f1f1f1] leading-[20px] whitespace-pre-wrap break-words">
              {isDeleted ? (
                <span className="italic text-zinc-400 dark:text-zinc-500 text-xs">
                  {comment.text || '[Comment deleted by author]'}
                </span>
              ) : (
                comment.text
              )}
            </div>

            {/* Local Notice */}
            {localNotice && (
              <div className="pt-0.5">
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  ✓ {localNotice}
                </span>
              </div>
            )}

            {/* Action Row: Like, Dislike, Reply */}
            {!isDeleted && (
              <div className="flex items-center gap-2 pt-0.5 -ml-1 text-xs">
                {/* Like Button */}
                <button
                  type="button"
                  onClick={() => handleReaction(comment._id, 'like')}
                  className={`p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors flex items-center gap-1.5 ${
                    hasLiked ? 'text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-[#aaaaaa]'
                  }`}
                  aria-label="Like comment"
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${hasLiked ? 'fill-current' : ''}`} />
                  {comment.likesCount > 0 && (
                    <span className="text-[12px] font-normal">{comment.likesCount}</span>
                  )}
                </button>

                {/* Dislike Button */}
                <button
                  type="button"
                  onClick={() => handleReaction(comment._id, 'dislike')}
                  className={`p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors flex items-center gap-1.5 ${
                    hasDisliked ? 'text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-[#aaaaaa]'
                  }`}
                  aria-label="Dislike comment"
                >
                  <ThumbsDown className={`w-3.5 h-3.5 ${hasDisliked ? 'fill-current' : ''}`} />
                  {comment.dislikesCount > 0 && (
                    <span className="text-[12px] font-normal">{comment.dislikesCount}</span>
                  )}
                </button>

                {/* Reply Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (!isAuthenticated) {
                      setAuthModalMessage('Sign in to reply to this comment.');
                      setAuthModalOpen(true);
                      return;
                    }
                    setReplyingToId(isReplying ? null : comment._id);
                    setReplyText('');
                  }}
                  className="px-3 py-1 rounded-full text-[12px] font-semibold text-zinc-900 dark:text-[#f1f1f1] hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
                >
                  Reply
                </button>
              </div>
            )}

            {/* Inline Reply Box (YouTube Style) */}
            <AnimatePresence>
              {isReplying && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pt-2 pb-2 overflow-hidden"
                >
                  <div className="flex items-start gap-3">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className={`w-6 h-6 ${getAvatarColor(user?.name || '')} text-white text-[10px] font-medium rounded-full grid place-items-center uppercase`}>
                        {user?.name ? user.name[0] : 'U'}
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={`Add a reply...`}
                        className="w-full pb-1 text-[13px] bg-transparent border-b border-zinc-300 dark:border-zinc-700 focus:border-zinc-900 dark:focus:border-white text-zinc-900 dark:text-white outline-none transition-colors"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handlePostReply(comment._id);
                          }
                        }}
                      />
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setReplyingToId(null)}
                          className="px-3 py-1.5 text-xs font-semibold text-zinc-600 dark:text-[#aaaaaa] hover:bg-zinc-100 dark:hover:bg-white/10 rounded-full transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePostReply(comment._id)}
                          disabled={replySubmitting || !replyText.trim()}
                          className="px-4 py-1.5 text-xs font-semibold rounded-full bg-[#065fd4] hover:bg-[#004dc0] text-white disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 dark:disabled:text-zinc-500 transition-colors flex items-center gap-1.5"
                        >
                          {replySubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                          <span>Reply</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Collapsible Replies Toggle Button (YouTube Pill Style) */}
            {hasReplies && (
              <div className="pt-1 relative">
                <button
                  type="button"
                  onClick={() => toggleCollapse(comment._id)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-semibold text-[#065fd4] dark:text-[#3ea6ff] hover:bg-[#def1ff] dark:hover:bg-[#263850] transition-colors"
                >
                  {isCollapsed ? (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      <span>{comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}</span>
                    </>
                  ) : (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      <span>{comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Vertical line connecting from under parent avatar down to replies */}
        {hasReplies && !isCollapsed && !isReply && (
          <div className="absolute left-[19.5px] top-[44px] bottom-2 w-[1.5px] bg-zinc-300 dark:bg-zinc-700 pointer-events-none" />
        )}

        {/* Nested Replies with YouTube L-Connector Tree */}
        {hasReplies && !isCollapsed && (
          <div className="relative mt-3 space-y-4 ml-[52px]">
            {comment.replies.map((child, idx) => {
              const isLast = idx === comment.replies.length - 1;
              return (
                <div key={child._id} className="relative">
                  {/* YouTube SVG L-connector linking spine to child avatar */}
                  <svg
                    className="absolute -left-[32px] top-0 w-[32px] h-full pointer-events-none overflow-visible text-zinc-300 dark:text-zinc-700"
                    fill="none"
                  >
                    {!isLast && (
                      <line
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="100%"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    )}
                    <path
                      d="M 0 0 L 0 6 Q 0 14 8 14 L 32 14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                  {renderComment(child, true)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="mt-8 sm:mt-12 pt-6 font-sans">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header Strip: Comments count */}
        <div className="flex items-center gap-6">
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white font-sans">
            {totalCommentCount} {totalCommentCount === 1 ? 'Comment' : 'Comments'}
          </h2>
        </div>

        {/* Main Comment Input Box (YouTube Style) */}
        <div className="flex items-start gap-4">
          {isAuthenticated && user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shrink-0" />
          ) : (
            <div
              className={`w-9 h-9 sm:w-10 sm:h-10 ${
                isAuthenticated ? getAvatarColor(user?.name || '') : 'bg-[#00796b]'
              } text-white font-medium rounded-full grid place-items-center uppercase shrink-0 text-sm`}
            >
              {isAuthenticated && user?.name ? user.name[0] : 'S'}
            </div>
          )}

          <div className="flex-1 space-y-2">
            <div className="relative">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onFocus={() => {
                  if (!isAuthenticated) {
                    setAuthModalMessage('Sign in to leave a comment.');
                    setAuthModalOpen(true);
                  } else {
                    setIsMainFocused(true);
                  }
                }}
                placeholder="Add a comment..."
                className="w-full pb-1 text-[14px] bg-transparent border-b border-zinc-300 dark:border-zinc-700 focus:border-zinc-900 dark:focus:border-white text-zinc-900 dark:text-white outline-none transition-colors placeholder-zinc-500 dark:placeholder-zinc-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handlePostMainComment();
                  }
                }}
              />
            </div>

            {/* Action buttons appear when focused or has text */}
            <AnimatePresence>
              {(isMainFocused || text.trim()) && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-center justify-end gap-2 pt-1"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setText('');
                      setIsMainFocused(false);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-[#aaaaaa] hover:bg-zinc-100 dark:hover:bg-white/10 rounded-full transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handlePostMainComment}
                    disabled={submitting || !text.trim()}
                    className="px-4 py-2 text-xs font-semibold rounded-full bg-[#065fd4] hover:bg-[#004dc0] text-white disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 dark:disabled:text-zinc-500 transition-colors flex items-center gap-1.5"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Comment</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Comment Thread List */}
        {loading ? (
          <div className="py-12 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
            <span>Loading comments...</span>
          </div>
        ) : commentTree.length === 0 ? (
          <div className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No comments yet. Be the first to start the conversation.
          </div>
        ) : (
          <div className="space-y-6 pt-2">
            {commentTree.map((rootComment) => renderComment(rootComment, false))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {deleteConfirmComment && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#212121] border border-zinc-200 dark:border-white/10 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl font-sans"
            >
              <div className="space-y-1">
                <h3 className="font-semibold text-base text-zinc-900 dark:text-white">
                  Delete comment
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Delete your comment permanently?
                </p>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmComment(null)}
                  disabled={deleting}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteComment}
                  disabled={deleting}
                  className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>Delete</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Report Modal */}
      <AnimatePresence>
        {reportingComment && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#212121] border border-zinc-200 dark:border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl font-sans"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 text-rose-500" />
                  <h3 className="font-semibold text-base text-zinc-900 dark:text-white">
                    Report comment
                  </h3>
                </div>
                <button onClick={() => setReportingComment(null)} className="p-1 text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleReportSubmit} className="space-y-4 text-xs font-sans">
                <div className="space-y-2">
                  {REPORT_REASONS.map((r) => (
                    <label
                      key={r}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl border border-zinc-200 dark:border-white/10 cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/5"
                    >
                      <input
                        type="radio"
                        name="report_reason"
                        value={r}
                        checked={reportReason === r}
                        onChange={() => setReportReason(r)}
                        className="text-red-600"
                      />
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">{r}</span>
                    </label>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportingComment(null)}
                    className="px-4 py-2 rounded-full text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reportSubmitting}
                    className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold disabled:opacity-50"
                  >
                    {reportSubmitting ? 'Submitting...' : 'Report'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        message={authModalMessage}
        onSuccess={() => {
          fetchComments();
        }}
      />
    </section>
  );
}
