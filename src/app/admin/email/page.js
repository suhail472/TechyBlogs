'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Inbox,
  Send,
  Star,
  Archive,
  Trash2,
  Mail,
  Search,
  RefreshCw,
  MoreVertical,
  Reply,
  ReplyAll,
  CheckCircle2,
  AlertCircle,
  Clock,
  Tag,
  Paperclip,
  ArrowLeft,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Shield,
  Filter,
  CheckSquare,
  Square,
  FileText,
  User,
  CornerDownLeft,
} from 'lucide-react';
import { emailAPI } from '@/services/api';
import useToastStore from '@/store/useToastStore';

const FOLDERS = [
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'unread', label: 'Unread', icon: Mail },
  { id: 'sent', label: 'Sent', icon: Send },
  { id: 'starred', label: 'Starred', icon: Star },
  { id: 'archived', label: 'Archived', icon: Archive },
  { id: 'trash', label: 'Trash', icon: Trash2 },
];

const LABELS = [
  { id: 'Newsroom', label: 'Newsroom', color: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200' },
  { id: 'Article Tips', label: 'Article Tips', color: 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300' },
  { id: 'Reader Support', label: 'Reader Support', color: 'bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300' },
  { id: 'Business', label: 'Business', color: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300' },
  { id: 'Press', label: 'Press', color: 'bg-purple-100 text-purple-900 dark:bg-purple-950/60 dark:text-purple-300' },
  { id: 'Newsletter', label: 'Newsletter', color: 'bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-300' },
  { id: 'Security Alert', label: 'Security Alert', color: 'bg-red-100 text-red-900 dark:bg-red-950/60 dark:text-red-300' },
];

export default function AdminEmailCenter() {
  const { addToast } = useToastStore();

  // Navigation State
  const [currentFolder, setCurrentFolder] = useState('inbox');
  const [selectedLabel, setSelectedLabel] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('lastActivity');
  const [page, setPage] = useState(1);

  // Data State
  const [threads, setThreads] = useState([]);
  const [counts, setCounts] = useState({
    inbox: { unread: 0, total: 0 },
    starred: { total: 0 },
    sent: { total: 0 },
    archived: { total: 0 },
    trash: { total: 0 },
  });
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1, limit: 25 });
  const [loadingThreads, setLoadingThreads] = useState(true);

  // Selected Thread State
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [threadMessages, setThreadMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [expandedMessageIds, setExpandedMessageIds] = useState(new Set());

  // Reply Composer State
  const [replyText, setReplyText] = useState('');
  const [replyCc, setReplyCc] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [replySuccess, setReplySuccess] = useState(false);
  const [replyError, setReplyError] = useState('');

  // New Message Modal State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeLabel, setComposeLabel] = useState('Newsroom');
  const [sendingCompose, setSendingCompose] = useState(false);
  const [composeError, setComposeError] = useState('');

  // Bulk Selection State
  const [selectedThreadIds, setSelectedThreadIds] = useState(new Set());

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch Threads
  const fetchThreads = useCallback(async () => {
    setLoadingThreads(true);
    try {
      const res = await emailAPI.getThreads({
        folder: currentFolder,
        label: selectedLabel,
        search: debouncedSearch,
        page,
        limit: 25,
        sortBy,
      });

      if (res.success) {
        setThreads(res.data || []);
        if (res.counts) setCounts(res.counts);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (err) {
      console.warn('Failed to fetch threads:', err.message);
    } finally {
      setLoadingThreads(false);
    }
  }, [currentFolder, selectedLabel, debouncedSearch, page, sortBy]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  // Fetch Thread Messages when selected
  useEffect(() => {
    if (!selectedThreadId) {
      setThreadMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setLoadingMessages(true);
      setReplyError('');
      setReplySuccess(false);
      try {
        const res = await emailAPI.getThreadMessages(selectedThreadId);
        if (res.success && res.data) {
          setThreadMessages(res.data);
          // By default expand the latest message, and expand all if thread has <= 3 messages
          const msgIds = res.data.map((m) => m._id);
          if (msgIds.length <= 3) {
            setExpandedMessageIds(new Set(msgIds));
          } else {
            setExpandedMessageIds(new Set([msgIds[msgIds.length - 1]]));
          }

          // Optimistically update unread count in thread list
          setThreads((prev) =>
            prev.map((t) => (t.threadId === selectedThreadId ? { ...t, unreadCount: 0 } : t))
          );
        }
      } catch (err) {
        setReplyError('Failed to load conversation messages.');
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [selectedThreadId]);

  // Toggle Message Card Expand/Collapse
  const toggleMessageExpand = (msgId) => {
    setExpandedMessageIds((prev) => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId);
      else next.add(msgId);
      return next;
    });
  };

  // Star / Unstar Thread
  const handleToggleStar = async (threadId, e) => {
    if (e) e.stopPropagation();
    const currentThread = threads.find((t) => t.threadId === threadId);
    const nextState = !currentThread?.isStarred;

    // Optimistic UI update
    setThreads((prev) =>
      prev.map((t) => (t.threadId === threadId ? { ...t, isStarred: nextState } : t))
    );

    try {
      await emailAPI.performAction({
        threadId,
        action: nextState ? 'star' : 'unstar',
      });
    } catch (err) {
      // Revert on error
      setThreads((prev) =>
        prev.map((t) => (t.threadId === threadId ? { ...t, isStarred: !nextState } : t))
      );
    }
  };

  // Archive Thread
  const handleArchiveThread = async (threadId, e) => {
    if (e) e.stopPropagation();
    try {
      await emailAPI.performAction({
        threadId,
        action: 'archive',
      });
      setThreads((prev) => prev.filter((t) => t.threadId !== threadId));
      if (selectedThreadId === threadId) {
        setSelectedThreadId(null);
      }
      addToast('Conversation archived', 'info');
      fetchThreads();
    } catch (err) {
      addToast('Failed to archive conversation', 'error');
    }
  };

  // Trash Thread
  const handleTrashThread = async (threadId, e) => {
    if (e) e.stopPropagation();
    try {
      await emailAPI.performAction({
        threadId,
        action: 'trash',
      });
      setThreads((prev) => prev.filter((t) => t.threadId !== threadId));
      if (selectedThreadId === threadId) {
        setSelectedThreadId(null);
      }
      addToast('Conversation moved to Trash', 'info');
      fetchThreads();
    } catch (err) {
      addToast('Failed to delete conversation', 'error');
    }
  };

  // Bulk Actions
  const handleBulkAction = async (action) => {
    if (selectedThreadIds.size === 0) return;
    const threadIdArray = Array.from(selectedThreadIds);
    try {
      await Promise.all(
        threadIdArray.map((threadId) =>
          emailAPI.performAction({ threadId, action })
        )
      );
      setSelectedThreadIds(new Set());
      addToast(`Updated ${threadIdArray.length} conversations`, 'success');
      fetchThreads();
    } catch (err) {
      addToast('Bulk action failed', 'error');
    }
  };

  // Send Reply
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (sendingReply || !replyText.trim()) return;

    const latestMessage = threadMessages[threadMessages.length - 1];
    if (!latestMessage) return;

    setSendingReply(true);
    setReplyError('');
    setReplySuccess(false);

    try {
      const ccArray = replyCc
        ? replyCc.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const res = await emailAPI.sendReply({
        originalEmailId: latestMessage._id,
        text: replyText.trim(),
        cc: ccArray,
      });

      if (res.success && res.data?.email) {
        setThreadMessages((prev) => [...prev, res.data.email]);
        setExpandedMessageIds((prev) => new Set([...prev, res.data.email._id]));
        setReplyText('');
        setReplyCc('');
        setShowCc(false);
        setReplySuccess(true);
        setTimeout(() => setReplySuccess(false), 4000);
        fetchThreads();
      }
    } catch (err) {
      setReplyError(err.message || 'Failed to dispatch reply via Resend.');
    } finally {
      setSendingReply(false);
    }
  };

  // Send New Composed Email
  const handleSendCompose = async (e) => {
    e.preventDefault();
    if (sendingCompose || !composeTo.trim() || !composeBody.trim()) return;

    setSendingCompose(true);
    setComposeError('');

    try {
      const res = await emailAPI.sendEmail({
        to: composeTo.trim(),
        subject: composeSubject.trim() || '(No Subject)',
        text: composeBody.trim(),
        labels: [composeLabel],
      });

      if (res.success) {
        setIsComposeOpen(false);
        setComposeTo('');
        setComposeSubject('');
        setComposeBody('');
        addToast('Email dispatched via Resend', 'success');
        fetchThreads();
      }
    } catch (err) {
      setComposeError(err.message || 'Failed to send outbound email.');
    } finally {
      setSendingCompose(false);
    }
  };

  // Format relative timestamp
  const formatTimestamp = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-zinc-50 dark:bg-[#0c0e12] font-sans overflow-hidden">
      {/* ========================================================================= */}
      {/* TOP COMMAND HEADER                                                       */}
      {/* ========================================================================= */}
      <header className="shrink-0 h-16 bg-white dark:bg-[#121620] border-b border-zinc-200 dark:border-white/10 px-4 sm:px-6 flex items-center justify-between gap-4 z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-600/10 dark:bg-red-500/10 text-red-600 dark:text-red-400">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-zinc-950 dark:text-white font-display flex items-center gap-2">
              <span>Newsroom Email Center</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-bold">
                Resend API
              </span>
            </h1>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              Threaded conversations, reader tips, and editorial replies
            </p>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setIsComposeOpen(true)}
            className="py-2 px-3.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Compose</span>
          </button>

          <button
            type="button"
            onClick={fetchThreads}
            disabled={loadingThreads}
            title="Refresh inbox"
            className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loadingThreads ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3-COLUMN MAIN CLIENT LAYOUT                                              */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ----------------------------------------------------------------------- */}
        {/* COLUMN 1: FOLDERS & LABELS SIDEBAR (Desktop)                           */}
        {/* ----------------------------------------------------------------------- */}
        <aside className="hidden md:flex flex-col w-56 lg:w-64 bg-white dark:bg-[#121620] border-r border-zinc-200 dark:border-white/10 p-3 space-y-6 shrink-0 overflow-y-auto">
          {/* Main Folders */}
          <div className="space-y-1">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">
              Folders
            </span>
            {FOLDERS.map((f) => {
              const Icon = f.icon;
              const isActive = currentFolder === f.id && !selectedLabel;
              let badgeCount = 0;
              if (f.id === 'inbox') badgeCount = counts.inbox?.unread || 0;
              if (f.id === 'starred') badgeCount = counts.starred?.total || 0;

              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setCurrentFolder(f.id);
                    setSelectedLabel('');
                    setSelectedThreadId(null);
                    setPage(1);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-bold shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{f.label}</span>
                  </div>
                  {badgeCount > 0 && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
                        isActive
                          ? 'bg-red-600 text-white'
                          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Category Labels */}
          <div className="space-y-1">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">
              Categories
            </span>
            {LABELS.map((lbl) => {
              const isActive = selectedLabel === lbl.id;
              return (
                <button
                  key={lbl.id}
                  type="button"
                  onClick={() => {
                    setSelectedLabel(isActive ? '' : lbl.id);
                    setSelectedThreadId(null);
                    setPage(1);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold border border-red-200 dark:border-red-900/40'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 opacity-60" />
                    <span>{lbl.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Inbound Webhook Guidance Pill */}
          <div className="mt-auto p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-white/5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              <Shield className="w-3 h-3 text-emerald-500" />
              <span>Resend Inbound</span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
              Inbound webhook active at <code className="font-mono text-[10px]">/api/webhooks/resend/inbound</code>.
            </p>
          </div>
        </aside>

        {/* ----------------------------------------------------------------------- */}
        {/* COLUMN 2: THREAD LIST                                                  */}
        {/* ----------------------------------------------------------------------- */}
        <div
          className={`w-full md:w-80 lg:w-96 flex flex-col bg-white dark:bg-[#10131a] border-r border-zinc-200 dark:border-white/10 shrink-0 overflow-hidden ${
            selectedThreadId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Search & Sort Controls */}
          <div className="p-3 border-b border-zinc-200 dark:border-white/10 space-y-2 shrink-0 bg-white dark:bg-[#10131a]">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search subject, sender, body..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-transparent focus:border-zinc-300 dark:focus:border-white/20 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 outline-none transition-all font-sans"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Mobile Folder Selector Bar */}
            <div className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {FOLDERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setCurrentFolder(f.id);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 cursor-pointer ${
                    currentFolder === f.id
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Bulk Actions Bar (when items selected) */}
            {selectedThreadIds.size > 0 ? (
              <div className="flex items-center justify-between px-2 py-1 bg-red-50 dark:bg-red-950/30 rounded-lg text-xs">
                <span className="font-bold text-red-600 dark:text-red-400">
                  {selectedThreadIds.size} selected
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleBulkAction('markRead')}
                    className="p-1 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 cursor-pointer"
                    title="Mark Read"
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkAction('archive')}
                    className="p-1 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 cursor-pointer"
                    title="Archive"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkAction('trash')}
                    className="p-1 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 cursor-pointer"
                    title="Trash"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
                <span>
                  {pagination.total} conversation{pagination.total === 1 ? '' : 's'}
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent border-none text-zinc-600 dark:text-zinc-400 font-medium text-[11px] outline-none cursor-pointer"
                >
                  <option value="lastActivity">Most Recent</option>
                  <option value="subject">Subject A-Z</option>
                  <option value="unread">Unread First</option>
                </select>
              </div>
            )}
          </div>

          {/* Thread List Scrollable Body */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-white/5">
            {loadingThreads ? (
              <div className="p-8 text-center text-zinc-400 space-y-2">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-zinc-400" />
                <p className="text-xs">Loading conversations...</p>
              </div>
            ) : threads.length === 0 ? (
              <div className="p-8 text-center text-zinc-400 space-y-2">
                <Inbox className="w-8 h-8 mx-auto text-zinc-300 dark:text-zinc-600 stroke-[1.5]" />
                <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400">No emails found</p>
                <p className="text-[11px] text-zinc-400">Your mailbox folder is clear.</p>
              </div>
            ) : (
              threads.map((thread) => {
                const isSelected = selectedThreadId === thread.threadId;
                const hasUnread = thread.unreadCount > 0;
                const latest = thread.latestMessage || {};
                const senderName = latest.from?.name || latest.from?.email || 'Unknown';
                const initial = senderName.charAt(0).toUpperCase() || 'E';

                return (
                  <div
                    key={thread.threadId}
                    onClick={() => setSelectedThreadId(thread.threadId)}
                    className={`p-3.5 transition-colors cursor-pointer relative group ${
                      isSelected
                        ? 'bg-red-50/70 dark:bg-red-950/20 border-l-4 border-red-600'
                        : hasUnread
                        ? 'bg-zinc-50/80 dark:bg-zinc-800/30 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 dark:from-zinc-700 dark:to-zinc-800 text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {initial}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-xs truncate ${
                              hasUnread
                                ? 'font-black text-zinc-950 dark:text-white'
                                : 'font-semibold text-zinc-700 dark:text-zinc-300'
                            }`}
                          >
                            {senderName}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                            {formatTimestamp(thread.lastActivity)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <p
                            className={`text-xs truncate ${
                              hasUnread
                                ? 'font-bold text-zinc-900 dark:text-white'
                                : 'font-medium text-zinc-600 dark:text-zinc-400'
                            }`}
                          >
                            {thread.subject}
                          </p>
                          {thread.messageCount > 1 && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-bold shrink-0">
                              {thread.messageCount}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-zinc-400 truncate line-clamp-1">
                          {latest.text || '(No body text)'}
                        </p>

                        {/* Labels & Star Actions */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-1">
                            {thread.labels?.map((lbl) => (
                              <span
                                key={lbl}
                                className="text-[9px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-medium"
                              >
                                {lbl}
                              </span>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleToggleStar(thread.threadId, e)}
                            className={`p-1 rounded transition-colors cursor-pointer ${
                              thread.isStarred
                                ? 'text-amber-500'
                                : 'text-zinc-300 dark:text-zinc-600 hover:text-zinc-500'
                            }`}
                          >
                            <Star className="w-3.5 h-3.5" fill={thread.isStarred ? 'currentColor' : 'none'} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Footer */}
          {pagination.totalPages > 1 && (
            <div className="p-2 border-t border-zinc-200 dark:border-white/10 flex items-center justify-between text-xs text-zinc-400 shrink-0">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-[11px]">
                {page} / {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* COLUMN 3: SELECTED CONVERSATION THREAD VIEWER                          */}
        {/* ----------------------------------------------------------------------- */}
        <div
          className={`flex-1 flex flex-col bg-zinc-50 dark:bg-[#0c0e12] overflow-hidden ${
            !selectedThreadId ? 'hidden md:flex items-center justify-center' : 'flex'
          }`}
        >
          {!selectedThreadId ? (
            <div className="text-center p-8 text-zinc-400 space-y-2 max-w-sm">
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-white/10 flex items-center justify-center mx-auto text-zinc-400 shadow-sm">
                <Mail className="w-7 h-7 stroke-[1.5]" />
              </div>
              <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                Select an email conversation
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Choose a conversation from the left to view messages, reader inquiries, and dispatch threaded replies via Resend.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Thread Top Action Bar */}
              <div className="h-14 px-4 sm:px-6 bg-white dark:bg-[#121620] border-b border-zinc-200 dark:border-white/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedThreadId(null)}
                    className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 md:hidden cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
                  </button>
                  <h2 className="text-xs sm:text-sm font-bold text-zinc-950 dark:text-white truncate max-w-md">
                    {threadMessages[0]?.subject || 'Conversation'}
                  </h2>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleToggleStar(selectedThreadId)}
                    className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 cursor-pointer"
                    title="Star conversation"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleArchiveThread(selectedThreadId)}
                    className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 cursor-pointer"
                    title="Archive conversation"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTrashThread(selectedThreadId)}
                    className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-rose-500 cursor-pointer"
                    title="Move to trash"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Message Stream */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {loadingMessages ? (
                  <div className="p-8 text-center text-zinc-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-zinc-400" />
                  </div>
                ) : (
                  threadMessages.map((msg, idx) => {
                    const isExpanded = expandedMessageIds.has(msg._id);
                    const isOutbound = msg.direction === 'outbound';
                    const senderName = msg.from?.name || msg.from?.email || 'Unknown';
                    const senderInitial = senderName.charAt(0).toUpperCase() || 'E';

                    return (
                      <motion.div
                        key={msg._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`rounded-2xl border transition-all ${
                          isOutbound
                            ? 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-white/10'
                            : 'bg-white dark:bg-[#121620] border-zinc-200 dark:border-white/10 shadow-sm'
                        }`}
                      >
                        {/* Header (Click to collapse/expand) */}
                        <div
                          onClick={() => toggleMessageExpand(msg._id)}
                          className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                                isOutbound
                                  ? 'bg-red-600 text-white'
                                  : 'bg-zinc-800 dark:bg-zinc-700 text-white'
                              }`}
                            >
                              {senderInitial}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-zinc-950 dark:text-white truncate">
                                  {senderName}
                                </span>
                                {isOutbound && (
                                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                                    Editorial Team
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-zinc-400 truncate">
                                To: {msg.to?.map((t) => t.email).join(', ') || 'Newsroom'}
                              </p>
                            </div>
                          </div>

                          <span className="text-[11px] font-mono text-zinc-400 shrink-0">
                            {new Date(msg.createdAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {/* Collapsed Excerpt Preview */}
                        {!isExpanded && (
                          <div className="px-4 pb-3 text-xs text-zinc-500 dark:text-zinc-400 truncate line-clamp-1">
                            {msg.text || '(HTML message body)'}
                          </div>
                        )}

                        {/* Expanded Full Message Content */}
                        {isExpanded && (
                          <div className="px-4 sm:px-6 pb-6 pt-2 border-t border-zinc-100 dark:border-white/5 space-y-4">
                            {/* Render sanitized HTML safely */}
                            {msg.html ? (
                              <div
                                className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans prose dark:prose-invert max-w-none break-words"
                                dangerouslySetInnerHTML={{ __html: msg.html }}
                              />
                            ) : (
                              <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap font-sans">
                                {msg.text}
                              </p>
                            )}

                            {/* Attachments */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="pt-3 border-t border-zinc-100 dark:border-white/5 space-y-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                  Attachments ({msg.attachments.length})
                                </span>
                                <div className="flex flex-wrap gap-2">
                                  {msg.attachments.map((att, attIdx) => (
                                    <div
                                      key={attIdx}
                                      className="flex items-center gap-2 p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 text-xs font-mono text-zinc-700 dark:text-zinc-300"
                                    >
                                      <Paperclip className="w-3.5 h-3.5 text-zinc-400" />
                                      <span className="truncate max-w-[150px]">{att.filename}</span>
                                      <span className="text-[10px] text-zinc-400">
                                        ({Math.round(att.size / 1024)} KB)
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Sticky Reply Composer */}
              <div className="p-4 sm:p-6 bg-white dark:bg-[#121620] border-t border-zinc-200 dark:border-white/10 shrink-0 space-y-3">
                <form onSubmit={handleSendReply} className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <Reply className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                      <span>
                        Replying to:{' '}
                        <strong className="text-zinc-900 dark:text-white">
                          {threadMessages[threadMessages.length - 1]?.from?.email || 'Sender'}
                        </strong>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowCc(!showCc)}
                      className="text-[11px] font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                    >
                      {showCc ? '- Hide CC' : '+ Add CC'}
                    </button>
                  </div>

                  {showCc && (
                    <input
                      type="text"
                      placeholder="CC emails (comma separated)"
                      value={replyCc}
                      onChange={(e) => setReplyCc(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white outline-none focus:border-red-500"
                    />
                  )}

                  <textarea
                    required
                    rows={3}
                    placeholder="Write a professional newsroom reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-white/10 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all resize-y min-h-[90px] font-sans"
                  />

                  {/* Inline Composer Feedback & Actions */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs">
                      {replyError && (
                        <span className="text-rose-500 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {replyError}
                        </span>
                      )}
                      {replySuccess && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Reply dispatched via Resend ✓
                        </span>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={sendingReply || !replyText.trim()}
                      className="py-2.5 px-5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      {sendingReply ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Dispatching...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Reply</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* COMPOSE NEW EMAIL MODAL                                                  */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isComposeOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-xl bg-white dark:bg-[#121620] rounded-3xl border border-zinc-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-red-600" />
                  <h3 className="text-sm font-bold text-zinc-950 dark:text-white font-display">
                    Compose Newsroom Message
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSendCompose} className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto">
                {composeError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{composeError}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    To Recipient *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="editor@partner.com or reader@gmail.com"
                    value={composeTo}
                    onChange={(e) => setComposeTo(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-white/10 text-xs sm:text-sm text-zinc-900 dark:text-white outline-none focus:border-red-500 font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Editorial Inquiry regarding Article Publication"
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-white/10 text-xs sm:text-sm text-zinc-900 dark:text-white outline-none focus:border-red-500 font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Category Label
                  </label>
                  <select
                    value={composeLabel}
                    onChange={(e) => setComposeLabel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-white/10 text-xs sm:text-sm text-zinc-900 dark:text-white outline-none focus:border-red-500 font-sans cursor-pointer"
                  >
                    {LABELS.map((lbl) => (
                      <option key={lbl.id} value={lbl.id}>
                        {lbl.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Message Body *
                  </label>
                  <textarea
                    required
                    rows={6}
                    placeholder="Compose your message..."
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    className="w-full p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-white/10 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-red-500 font-sans"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsComposeOpen(false)}
                    className="py-2.5 px-4 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    Discard
                  </button>

                  <button
                    type="submit"
                    disabled={sendingCompose}
                    className="py-2.5 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {sendingCompose ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
