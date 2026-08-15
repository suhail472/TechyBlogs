'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
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
} from 'lucide-react';
import { calendarAPI } from '@/services/api';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function EditorialCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  useEffect(() => {
    fetchEvents();
  }, [month, year]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await calendarAPI.getEvents(month, year);
      if (res.success) {
        setEvents(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load calendar events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Calendar matrix calculations
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysArray = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push({ day: null, isCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push({ day: d, isCurrentMonth: true, dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` });
  }

  const getEventsForDay = (d) => {
    return events.filter((ev) => {
      const targetDate = ev.scheduledAt || ev.publishedAt || ev.createdAt;
      if (!targetDate) return false;
      const parsed = new Date(targetDate);
      return (
        parsed.getFullYear() === year &&
        parsed.getMonth() === month &&
        parsed.getDate() === d
      );
    });
  };

  const statusColor = (status) => {
    switch (status) {
      case 'published':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'scheduled':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'in_review':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      default:
        return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-white/10';
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight font-display">Editorial Publishing Calendar</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
            Track scheduled deadlines, upcoming stories, and publication cadence across all editions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-blue-500/25 shrink-0"
          >
            <Plus className="w-4 h-4" /> Schedule New Story
          </Link>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-white/10 p-6 mb-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black font-display tracking-tight text-zinc-900 dark:text-white">
            {MONTH_NAMES[month]} <span className="text-blue-600">{year}</span>
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl border border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-white/10 text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl border border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Syncing editorial schedule...</p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-7 gap-px mb-2 text-center text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {daysArray.map((d, index) => {
                if (!d.isCurrentMonth) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="min-h-[120px] rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/30 border border-transparent p-2"
                    />
                  );
                }

                const dayEvents = getEventsForDay(d.day);
                const isToday =
                  new Date().getDate() === d.day &&
                  new Date().getMonth() === month &&
                  new Date().getFullYear() === year;

                return (
                  <div
                    key={`day-${d.day}`}
                    onClick={() => setSelectedDay(d.day)}
                    className={`min-h-[120px] rounded-2xl p-2.5 border transition-all cursor-pointer flex flex-col justify-between ${
                      isToday
                        ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-500/5 ring-2 ring-blue-500/20'
                        : 'border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-black rounded-lg w-6 h-6 flex items-center justify-center ${
                        isToday ? 'bg-blue-600 text-white' : 'text-zinc-700 dark:text-zinc-300'
                      }`}>
                        {d.day}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[10px] font-bold text-zinc-400">
                          {dayEvents.length} {dayEvents.length === 1 ? 'story' : 'stories'}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 overflow-y-auto max-h-[80px]">
                      {dayEvents.slice(0, 3).map((ev) => (
                        <Link
                          key={ev._id}
                          href={`/admin/edit/${ev._id}`}
                          className={`block p-1.5 rounded-lg border text-[10px] font-bold truncate transition-transform hover:scale-[1.02] ${statusColor(ev.status)}`}
                          title={ev.title}
                        >
                          {ev.title}
                        </Link>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-[9px] font-bold text-zinc-400 pl-1">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-zinc-500">
        <span className="text-zinc-400 uppercase tracking-wider text-[10px]">Status Key:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Published</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span>Scheduled</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>In Review</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
          <span>Draft</span>
        </div>
      </div>
    </div>
  );
}
