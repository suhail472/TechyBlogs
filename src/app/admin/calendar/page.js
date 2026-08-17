'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  FileText,
  AlertCircle,
  Loader2,
  Eye,
  Edit2,
  Plus,
  Search,
  Filter,
  SlidersHorizontal,
  MapPin,
  Building2,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  Kanban,
  ListTodo,
  CalendarDays,
  CalendarRange,
  X,
  Check,
  Flame,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { calendarAPI, taxonomyAPI, authorAPI } from '@/services/api';
import useToastStore from '@/store/useToastStore';
import AdminHeader from '@/components/admin/AdminHeader';
import EmptyState from '@/components/admin/EmptyState';

const VIEW_MODES = [
  { id: 'month', label: 'Month Grid', icon: CalendarDays },
  { id: 'week', label: 'Week Planner', icon: CalendarRange },
  { id: 'day', label: 'Day Agenda', icon: ListTodo },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'board', label: 'Editorial Board', icon: Kanban },
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function EditorialCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [events, setEvents] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dynamic filter options
  const [desks, setDesks] = useState([]);
  const [bureaus, setBureaus] = useState([]);
  const [authors, setAuthors] = useState([]);

  // Selected filters
  const [selectedDesk, setSelectedDesk] = useState('all');
  const [selectedBureau, setSelectedBureau] = useState('all');
  const [selectedAuthor, setSelectedAuthor] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [scheduleModal, setScheduleModal] = useState({ open: false, post: null });
  const [planningDrawer, setPlanningDrawer] = useState({ open: false, post: null });
  const [submitting, setSubmitting] = useState(false);

  // Schedule Form State
  const [scheduleForm, setScheduleForm] = useState({
    scheduledAt: '',
    timezone: 'Asia/Kolkata',
    embargoAt: '',
    deadline: '',
    priority: 'normal',
  });

  const { addToast } = useToastStore();

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  // Load Dynamic Taxonomy & Authors
  const fetchTaxonomyAndAuthors = useCallback(async () => {
    try {
      const [sectionsRes, regionsRes, authorsRes] = await Promise.allSettled([
        taxonomyAPI.getAll({ kind: 'section' }),
        taxonomyAPI.getAll({ kind: 'region' }),
        authorAPI.getAll(),
      ]);

      if (sectionsRes.status === 'fulfilled' && sectionsRes.value?.data) {
        setDesks(sectionsRes.value.data);
      }
      if (regionsRes.status === 'fulfilled' && regionsRes.value?.data) {
        setBureaus(regionsRes.value.data);
      }
      if (authorsRes.status === 'fulfilled' && authorsRes.value?.data) {
        setAuthors(authorsRes.value.data);
      }
    } catch (e) {
      // Fallback gracefully
    }
  }, []);

  // Fetch Metrics
  const fetchMetrics = useCallback(async () => {
    try {
      const res = await calendarAPI.getMetrics();
      if (res.success) {
        setMetrics(res.stats);
      }
    } catch (err) {
      console.warn('Failed to load calendar metrics:', err);
    }
  }, []);

  // Fetch Calendar Events
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      let startDate, endDate;

      if (viewMode === 'month') {
        startDate = new Date(year, month, 1);
        endDate = new Date(year, month + 1, 0, 23, 59, 59);
      } else if (viewMode === 'week') {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        startDate = startOfWeek;
        endDate = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
      } else {
        // Day, Timeline, Board
        const startOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0);
        startDate = new Date(startOfDay.getTime() - 14 * 24 * 60 * 60 * 1000);
        endDate = new Date(startOfDay.getTime() + 14 * 24 * 60 * 60 * 1000);
      }

      const params = {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      };
      if (selectedDesk !== 'all') params.desk = selectedDesk;
      if (selectedBureau !== 'all') params.bureau = selectedBureau;
      if (selectedAuthor !== 'all') params.author = selectedAuthor;
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (selectedPriority !== 'all') params.priority = selectedPriority;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await calendarAPI.getEvents(params);
      if (res.success) {
        setEvents(res.posts || []);
        setConflicts(res.conflicts || []);
      }
    } catch (err) {
      console.error('Failed to load calendar events:', err);
    } finally {
      setLoading(false);
    }
  }, [viewMode, currentDate, month, year, selectedDesk, selectedBureau, selectedAuthor, selectedStatus, selectedPriority, searchQuery]);

  useEffect(() => {
    fetchTaxonomyAndAuthors();
    fetchMetrics();
  }, [fetchTaxonomyAndAuthors, fetchMetrics]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Date Navigation Handlers
  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Open Schedule Modal
  const handleOpenSchedule = (post) => {
    const existingDate = post.scheduledAt ? new Date(post.scheduledAt) : new Date(Date.now() + 2 * 60 * 60 * 1000);
    // Format to datetime-local input YYYY-MM-DDTHH:mm
    const localIso = new Date(existingDate.getTime() - existingDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    setScheduleForm({
      scheduledAt: localIso,
      timezone: post.publishedTimezone || 'Asia/Kolkata',
      embargoAt: post.embargoAt ? new Date(post.embargoAt).toISOString().slice(0, 16) : '',
      deadline: post.deadline ? new Date(post.deadline).toISOString().slice(0, 16) : '',
      priority: post.priority || 'normal',
    });
    setScheduleModal({ open: true, post });
  };

  // Submit Schedule Mutation
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduleModal.post || !scheduleForm.scheduledAt) {
      addToast('Please select a scheduled publication date & time', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await calendarAPI.schedule(scheduleModal.post._id, {
        scheduledAt: new Date(scheduleForm.scheduledAt).toISOString(),
        timezone: scheduleForm.timezone,
        embargoAt: scheduleForm.embargoAt ? new Date(scheduleForm.embargoAt).toISOString() : null,
        deadline: scheduleForm.deadline ? new Date(scheduleForm.deadline).toISOString() : null,
        priority: scheduleForm.priority,
      });

      addToast(res.message || 'Story scheduled successfully', 'success');
      setScheduleModal({ open: false, post: null });
      fetchEvents();
      fetchMetrics();
    } catch (err) {
      addToast(err.message || 'Scheduling failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Planning Updates
  const handlePlanningSubmit = async (e) => {
    e.preventDefault();
    if (!planningDrawer.post) return;

    setSubmitting(true);
    try {
      const res = await calendarAPI.updatePlanning(planningDrawer.post._id, {
        deadline: scheduleForm.deadline ? new Date(scheduleForm.deadline).toISOString() : null,
        embargoAt: scheduleForm.embargoAt ? new Date(scheduleForm.embargoAt).toISOString() : null,
        priority: scheduleForm.priority,
      });

      addToast(res.message || 'Planning details updated', 'success');
      setPlanningDrawer({ open: false, post: null });
      fetchEvents();
      fetchMetrics();
    } catch (err) {
      addToast(err.message || 'Failed to update planning details', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Month Grid Calculation
  const daysArray = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const result = [];

    for (let i = 0; i < firstDayIndex; i++) {
      result.push({ day: null, isCurrentMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      result.push({ day: d, isCurrentMonth: true });
    }
    return result;
  }, [month, year]);

  const getEventsForDay = (d) => {
    return events.filter((ev) => {
      const targetDate = ev.scheduledAt || ev.publishedAt || ev.deadline || ev.createdAt;
      if (!targetDate) return false;
      const parsed = new Date(targetDate);
      return parsed.getFullYear() === year && parsed.getMonth() === month && parsed.getDate() === d;
    });
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* 1. TOP COMMAND BAR */}
      <AdminHeader
        title="Editorial Calendar & Planning Engine"
        breadcrumb={[{ label: 'Newsroom Planning, Scheduling & Publication Control' }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToday}
              className="px-3 py-1.5 rounded-xl border border-zinc-200/80 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              Today
            </button>
            <div className="flex items-center rounded-xl border border-zinc-200/80 dark:border-white/10 overflow-hidden">
              <button
                type="button"
                onClick={handlePrev}
                className="p-1.5 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-300"
                aria-label="Previous Period"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="p-1.5 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-300"
                aria-label="Next Period"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <Link
              href="/admin/create"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-red-600 hover:bg-red-500 text-white transition-colors shadow-sm shadow-red-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Plan Story</span>
            </Link>
          </div>
        }
      />

      {/* 2. LIVE PLANNING PULSE STRIP */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Published Today</span>
          <p className="font-display text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {metrics?.publishedToday ?? 0}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Scheduled Today</span>
          <p className="font-display text-2xl font-black text-blue-600 dark:text-blue-400">
            {metrics?.scheduledToday ?? 0}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Overdue Deadlines</span>
          <p className="font-display text-2xl font-black text-rose-600 dark:text-rose-400">
            {metrics?.overdueCount ?? 0}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Due in 24h</span>
          <p className="font-display text-2xl font-black text-amber-600 dark:text-amber-400">
            {metrics?.dueSoonCount ?? 0}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">In Review Pipeline</span>
          <p className="font-display text-2xl font-black text-purple-600 dark:text-purple-400">
            {metrics?.inReviewCount ?? 0}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Embargoed Releases</span>
          <p className="font-display text-2xl font-black text-cyan-600 dark:text-cyan-400">
            {metrics?.embargoedCount ?? 0}
          </p>
        </div>
      </section>

      {/* 3. CONFLICT DETECTION BANNER */}
      {conflicts.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="font-bold">Editorial Conflict Warning:</span>
            <span>{conflicts[0].message}</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase font-mono">
            {conflicts.length} Warning{conflicts.length > 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* 4. VIEW MODE TABS & FILTERS */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-zinc-200/80 dark:border-white/10">
          {/* View Modes */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {VIEW_MODES.map((mode) => {
              const Icon = mode.icon;
              const active = viewMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setViewMode(mode.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                    active
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>

          <div className="text-xs font-bold font-display text-zinc-900 dark:text-white uppercase tracking-wider">
            {MONTH_NAMES[month]} {year}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Desk Filter */}
            <select
              value={selectedDesk}
              onChange={(e) => setSelectedDesk(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 text-xs font-bold outline-none"
            >
              <option value="all">All Desks</option>
              {desks.map((d) => (
                <option key={d._id} value={d.slug}>{d.name}</option>
              ))}
            </select>

            {/* Bureau Filter */}
            <select
              value={selectedBureau}
              onChange={(e) => setSelectedBureau(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 text-xs font-bold outline-none"
            >
              <option value="all">All Bureaus</option>
              {bureaus.map((b) => (
                <option key={b._id} value={b.slug}>{b.name}</option>
              ))}
            </select>

            {/* Author Filter */}
            <select
              value={selectedAuthor}
              onChange={(e) => setSelectedAuthor(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 text-xs font-bold outline-none"
            >
              <option value="all">All Authors</option>
              {authors.map((a) => (
                <option key={a._id} value={a.slug || a.username}>{a.name}</option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 text-xs font-bold outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High Priority</option>
              <option value="normal">Normal</option>
              <option value="low">Low Priority</option>
            </select>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search planned stories..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 outline-none focus:ring-2 focus:ring-red-500/20"
            />
          </div>
        </div>
      </section>

      {/* 5. VIEW 1: MONTH GRID */}
      {viewMode === 'month' && (
        <section className="rounded-3xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 shadow-xs overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-zinc-200/80 dark:border-white/10 bg-zinc-50/50 dark:bg-zinc-900/50 text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 py-3 text-center">
            {WEEKDAY_NAMES.map((w) => (
              <div key={w}>{w}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-zinc-200/60 dark:divide-white/5 min-h-[500px]">
            {daysArray.map((cell, idx) => {
              if (!cell.isCurrentMonth) {
                return <div key={`empty-${idx}`} className="bg-zinc-50/20 dark:bg-zinc-900/10 min-h-[110px]" />;
              }

              const dayEvents = getEventsForDay(cell.day);
              const isToday =
                new Date().getDate() === cell.day &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

              return (
                <div
                  key={`day-${cell.day}`}
                  className={`p-2 min-h-[110px] transition-colors flex flex-col justify-between ${
                    isToday ? 'bg-red-500/[0.03] dark:bg-red-500/[0.05]' : 'hover:bg-zinc-50/50 dark:hover:bg-white/[0.01]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded-lg ${
                        isToday ? 'bg-red-600 text-white' : 'text-zinc-500'
                      }`}
                    >
                      {cell.day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-mono text-zinc-400">{dayEvents.length}</span>
                    )}
                  </div>

                  <div className="space-y-1 overflow-hidden">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <button
                        key={ev._id}
                        type="button"
                        onClick={() => handleOpenSchedule(ev)}
                        className="w-full text-left p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-white/5 text-[11px] space-y-0.5 group transition-all truncate block"
                      >
                        <div className="flex items-center gap-1">
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              ev.status === 'published'
                                ? 'bg-emerald-500'
                                : ev.status === 'scheduled'
                                ? 'bg-blue-500'
                                : 'bg-amber-500'
                            }`}
                          />
                          <span className="font-bold text-zinc-900 dark:text-white truncate block flex-1">
                            {ev.title}
                          </span>
                        </div>
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[9px] font-mono text-zinc-400 block text-center">
                        +{dayEvents.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 6. VIEW 2: EDITORIAL BOARD (KANBAN) */}
      {viewMode === 'board' && (
        <section className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {['draft', 'in_review', 'approved', 'scheduled', 'published'].map((colStatus) => {
            const colStories = events.filter((e) => e.status === colStatus);
            return (
              <div
                key={colStatus}
                className="p-4 rounded-3xl bg-zinc-50/70 dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 space-y-3 flex flex-col h-[600px]"
              >
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200/80 dark:border-white/10">
                  <h4 className="font-display font-bold text-xs uppercase tracking-wider text-zinc-900 dark:text-white capitalize">
                    {colStatus.replace('_', ' ')}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono text-[10px] font-bold">
                    {colStories.length}
                  </span>
                </div>

                <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
                  {colStories.map((post) => (
                    <div
                      key={post._id}
                      className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-2 group hover:border-red-500/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold text-red-600 dark:text-red-400 uppercase">
                          {post.primarySection?.name || 'General'}
                        </span>
                        {post.priority === 'urgent' && (
                          <span className="px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-600 text-[9px] font-bold uppercase">
                            Urgent
                          </span>
                        )}
                      </div>

                      <h5 className="font-display font-bold text-xs text-zinc-900 dark:text-white line-clamp-2">
                        {post.title}
                      </h5>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-white/5 text-[10px] text-zinc-400">
                        <span>{post.primaryAuthor?.name || post.author}</span>
                        <button
                          type="button"
                          onClick={() => handleOpenSchedule(post)}
                          className="font-bold text-red-600 hover:underline"
                        >
                          Schedule ↗
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* 7. VIEW 3: TIMELINE & DAY AGENDA */}
      {(viewMode === 'timeline' || viewMode === 'day' || viewMode === 'week') && (
        <section className="rounded-3xl bg-white dark:bg-[#12151c] border border-zinc-200/80 dark:border-white/10 p-6 shadow-xs space-y-4">
          <div className="divide-y divide-zinc-200/60 dark:divide-white/5">
            {events.length === 0 ? (
              <EmptyState
                title="No editorial events for this window"
                description="Schedule drafts, set deadlines, or plan upcoming releases for this timeline."
                actionLabel="+ Plan Story"
                onAction={() => handleOpenSchedule({ title: 'New Story', _id: '' })}
                className="my-12"
              />
            ) : (
              events.map((post) => (
                <div key={post._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 uppercase">
                        {post.scheduledAt ? new Date(post.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Flexible'}
                      </span>
                      <span className="text-xs font-bold text-red-600 dark:text-red-400 font-mono">
                        {post.primarySection?.name || 'Technology'}
                      </span>
                      {post.primaryRegion && (
                        <span className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono">
                          <MapPin className="w-3 h-3 text-red-500" />
                          <span>{post.primaryRegion.name}</span>
                        </span>
                      )}
                    </div>

                    <h4 className="font-display font-bold text-sm text-zinc-900 dark:text-white truncate">
                      {post.title}
                    </h4>

                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <span>By {post.primaryAuthor?.name || post.author}</span>
                      <span>•</span>
                      <span className="capitalize">{post.status}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleOpenSchedule(post)}
                      className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300"
                    >
                      Reschedule
                    </button>
                    <Link
                      href={`/admin/edit/${post._id}`}
                      className="p-1.5 rounded-xl border border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                      title="Open in Studio"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* 8. MODAL: QUICK SCHEDULE & PUBLICATION READINESS */}
      <AnimatePresence>
        {scheduleModal.open && scheduleModal.post && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#12151c] border border-zinc-200 dark:border-white/10 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <h3 className="font-display font-bold text-base text-zinc-900 dark:text-white">
                    Schedule Publication
                  </h3>
                </div>
                <button onClick={() => setScheduleModal({ open: false, post: null })} className="p-1 text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-white/5 space-y-1">
                <h4 className="font-display font-bold text-xs text-zinc-900 dark:text-white line-clamp-1">
                  {scheduleModal.post.title}
                </h4>
                <p className="text-[11px] text-zinc-500">
                  By {scheduleModal.post.primaryAuthor?.name || scheduleModal.post.author} • {scheduleModal.post.primarySection?.name || 'Desk'}
                </p>
              </div>

              <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs font-sans">
                {/* Date and Time Selector */}
                <div>
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">
                    Scheduled Publication Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleForm.scheduledAt}
                    onChange={(e) => setScheduleForm((prev) => ({ ...prev, scheduledAt: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs font-mono outline-none"
                    required
                  />
                </div>

                {/* Timezone and Priority */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Timezone</label>
                    <select
                      value={scheduleForm.timezone}
                      onChange={(e) => setScheduleForm((prev) => ({ ...prev, timezone: e.target.value }))}
                      className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none"
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Editorial Priority</label>
                    <select
                      value={scheduleForm.priority}
                      onChange={(e) => setScheduleForm((prev) => ({ ...prev, priority: e.target.value }))}
                      className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs outline-none"
                    >
                      <option value="normal">Normal Priority</option>
                      <option value="high">High Priority</option>
                      <option value="urgent">Urgent</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setScheduleModal({ open: false, post: null })}
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Confirm Schedule</span>
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
