'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Hammer,
  Truck,
  Shield,
  CheckSquare,
  Award,
  Search,
  MapPin,
  ExternalLink,
  Clock,
  User,
  Plus,
  LayoutGrid,
  Users,
  Sparkles,
  Trash2,
  CheckCircle2,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import { CalendarEvent, CalendarEventType } from '@/app/api/admin/calendar/route';
import TeamDayView from '@/components/admin/calendar/TeamDayView';
import TaskModal from '@/components/admin/calendar/TaskModal';
import UserAvatar from '@/components/admin/shared/UserAvatar';
import CustomSelect from '@/components/admin/shared/CustomSelect';

const EVENT_TYPES: Array<{ id: string; label: string; color: string }> = [
  { id: 'all', label: 'All Events', color: 'bg-slate-100 text-slate-700' },
  { id: 'roof_install', label: 'Roof Installs', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  { id: 'boom_delivery', label: 'Boom Deliveries', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'city_permit', label: 'City Permits', color: 'bg-sky-50 text-[#1878B8] border-sky-200' },
  { id: 'roof_inspection', label: 'Roof Inspections', color: 'bg-teal-50 text-teal-800 border-teal-200' },
  { id: 'warranty_checkin', label: 'Warranty Check-ins', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { id: 'task', label: 'Manual Tasks', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
];

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [team, setTeam] = useState<Array<{ id: number; name: string; role: string; email: string; avatar_url: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // View state: 'month' vs 'team_day'
  const [viewMode, setViewMode] = useState<'month' | 'team_day'>('month');

  // Filters
  const [filterType, setFilterType] = useState('all');
  const [filterPersonId, setFilterPersonId] = useState<string>('all');

  // Helper for local YYYY-MM-DD string
  const getLocalTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Calendar Date State (default to current month & day)
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(getLocalTodayStr());

  // Selected event for highlight in side panel
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);

  // Task Modal state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<CalendarEvent | null>(null);
  const [taskPrefillPersonId, setTaskPrefillPersonId] = useState<number | undefined>(undefined);
  const [taskPrefillTime, setTaskPrefillTime] = useState<string | undefined>(undefined);

  // Toast notifications
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Prefetch team directory so filters and modals are instantly ready
  useEffect(() => {
    fetch('/api/admin/users')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.users && Array.isArray(data.users)) {
          setTeam((prev) => (prev.length === 0 ? data.users : prev));
        }
      })
      .catch((err) => console.error('Failed to prefetch team directory', err));
  }, []);

  // Fetch events & team from virtual read layer
  const fetchEvents = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterType !== 'all') params.set('event_type', filterType);
      if (filterPersonId !== 'all') params.set('person_id', filterPersonId);

      const res = await fetch(`/api/admin/calendar?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        if (data.team && Array.isArray(data.team)) setTeam(data.team);
      }
    } catch (err) {
      console.error('Failed to load calendar events', err);
      showToast('Error loading calendar schedule', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterType, filterPersonId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Month navigation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function goToToday() {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(getLocalTodayStr());
  }

  // Days in month calculation
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  // Filter events locally as well for immediate reactivity
  const filteredEvents = events.filter((e) => {
    if (filterType !== 'all' && e.event_type !== filterType) return false;
    if (filterPersonId !== 'all') {
      const pid = parseInt(filterPersonId, 10);
      if (!e.assignee_ids.includes(pid) && !e.assignees.some((a) => a.id === pid)) {
        return false;
      }
    }
    return true;
  });

  // Selected date events
  const selectedDayEvents = filteredEvents.filter((e) => {
    if (e.date === selectedDateStr) return true;
    if (e.endDate && e.date <= selectedDateStr && e.endDate >= selectedDateStr) return true;
    return false;
  });

  function getEventsForDay(day: number) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filteredEvents.filter((e) => {
      if (e.date === dStr) return true;
      if (e.endDate && e.date <= dStr && e.endDate >= dStr) return true;
      return false;
    });
  }

  // Handle Save Task (Create or Update)
  const handleSaveTask = async (taskData: any) => {
    try {
      const isUpdate = Boolean(taskData.id);
      const url = '/api/admin/tasks';
      const method = isUpdate ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });

      const data = await res.json();
      if (res.ok && (data.ok || data.task)) {
        showToast(isUpdate ? 'Task updated successfully' : 'Task created and scheduled! ✓');
        if (taskData.dueAt) {
          const taskDate = String(taskData.dueAt).slice(0, 10);
          if (taskDate && /^\d{4}-\d{2}-\d{2}$/.test(taskDate)) {
            setSelectedDateStr(taskDate);
          }
        }
        await fetchEvents();
      } else {
        showToast(data.error || 'Failed to save task', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error saving task', 'error');
    }
  };

  // Handle Delete Task
  const handleDeleteTask = async (taskId: number) => {
    try {
      const res = await fetch(`/api/admin/tasks?id=${taskId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast('Task removed from calendar');
        fetchEvents();
      } else {
        showToast('Failed to delete task', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error deleting task', 'error');
    }
  };

  // Handle Task Completion Toggle
  const handleToggleTaskComplete = async (taskId: number, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, completed: !currentStatus }),
      });
      if (res.ok) {
        showToast(!currentStatus ? 'Task marked complete! 🎉' : 'Task reopened');
        fetchEvents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open task modal for new task
  const handleOpenCreateTask = (personId?: number, timeStr?: string) => {
    setEditingTask(null);
    setTaskPrefillPersonId(personId);
    setTaskPrefillTime(timeStr);
    setTaskModalOpen(true);
  };

  // Open task modal for editing existing manual task
  const handleOpenEditTask = (ev: CalendarEvent) => {
    if (ev.source_type !== 'manual_task') return;
    setEditingTask(ev);
    setTaskModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-28 md:pb-14 max-w-7xl mx-auto">
      {/* ── TOAST NOTIFICATION ── */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-2 ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : 'bg-rose-900 text-white border-rose-700'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{toast.text}</span>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <div className="admin-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl admin-tile-blue flex items-center justify-center flex-shrink-0 shadow-[0_4px_14px_rgba(47,159,227,0.3)]">
            <CalendarIcon size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#0B1E33]">
              Field Operations &amp; Dispatch Calendar
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Unified scheduling across pipeline jobs, boom deliveries, permit inspections, and crew tasks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Switcher: Month vs Team Swimlane */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setViewMode('month')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'month'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Month
            </button>
            <button
              onClick={() => setViewMode('team_day')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'team_day'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Team Swimlanes
            </button>
          </div>

          {/* New Task Button */}
          <button
            onClick={() => handleOpenCreateTask()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => {
              setRefreshing(true);
              fetchEvents();
            }}
            disabled={refreshing}
            className="p-2 rounded-xl border border-slate-200/80 bg-white/85 hover:bg-white text-slate-600 hover:text-[#0B1E33] transition-colors shadow-2xs"
            title="Refresh"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-[#2F9FE3]' : ''} />
          </button>
        </div>
      </div>

      {/* ── FILTER STRIP: EVENT TYPES & PERSON FILTER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
        {/* Event Type Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {EVENT_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFilterType(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                filterType === t.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Person / Staff Member Filter */}
        <div className="flex items-center gap-2 shrink-0">
          <label className="text-xs font-bold text-slate-500 whitespace-nowrap">
            Filter Assignee:
          </label>
          <div className="w-52">
            <CustomSelect
              value={filterPersonId}
              onChange={setFilterPersonId}
              size="sm"
              options={[
                { value: 'all', label: 'All Team Members' },
                ...team.map((u) => ({
                  value: String(u.id),
                  label: u.name,
                  description: u.role ? u.role.replace(/_/g, ' ') : 'Staff',
                })),
              ]}
            />
          </div>
        </div>
      </div>

      {/* ── VIEW 1: MONTH VIEW (Apple Liquid Glass Grid + Selected Day Drawer) ── */}
      {viewMode === 'month' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left (2/3): Calendar Month Grid */}
          <div className="lg:col-span-2 admin-card p-5 sm:p-6 space-y-4 shadow-xs">
            {/* Calendar Month Navigation Header */}
            <div className="flex items-center justify-between border-b border-slate-100/80 pb-4">
              <h2 className="text-lg sm:text-xl font-black text-[#0B1E33] tracking-tight">
                {monthNames[month]} {year}
              </h2>

              <div className="flex items-center gap-2">
                <button
                  onClick={goToToday}
                  className="px-3.5 py-1.5 rounded-full bg-slate-100/80 hover:bg-slate-200/80 text-xs font-bold text-slate-700 border border-slate-200/60 transition-all duration-200 cursor-pointer shadow-2xs"
                >
                  Today
                </button>
                <button
                  onClick={prevMonth}
                  className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-600 hover:text-[#0B1E33] border border-slate-200/80 flex items-center justify-center transition-all duration-200 cursor-pointer shadow-2xs"
                  aria-label="Previous Month"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={nextMonth}
                  className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-600 hover:text-[#0B1E33] border border-slate-200/80 flex items-center justify-center transition-all duration-200 cursor-pointer shadow-2xs"
                  aria-label="Next Month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-black uppercase tracking-wider text-slate-400 pb-1">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Calendar Grid Cells */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {calendarDays.map((day, idx) => {
                if (day === null) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="min-h-[64px] sm:min-h-[88px] rounded-2xl bg-slate-50/40 border border-transparent"
                    />
                  );
                }

                const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isSelected = dStr === selectedDateStr;
                const isToday = dStr === new Date().toISOString().slice(0, 10);
                const dayEvents = getEventsForDay(day);

                return (
                  <div
                    key={`day-${day}`}
                    onClick={() => setSelectedDateStr(dStr)}
                    className={`min-h-[64px] sm:min-h-[88px] p-2 rounded-2xl border text-left cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                      isSelected
                        ? 'bg-gradient-to-b from-sky-500/15 via-sky-500/8 to-blue-500/5 border-[#2F9FE3] shadow-[0_4px_16px_rgba(47,159,227,0.2)] ring-2 ring-[#2F9FE3]/40'
                        : isToday
                        ? 'bg-amber-50/60 border-amber-300 shadow-2xs'
                        : 'bg-white/75 border-slate-200/80 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold ${
                          isToday
                            ? 'w-6 h-6 rounded-full bg-gradient-to-br from-[#FBBF24] to-[#D97706] text-white flex items-center justify-center text-[11px] font-black shadow-xs'
                            : isSelected
                            ? 'w-6 h-6 rounded-full bg-[#2F9FE3] text-white flex items-center justify-center text-[11px] font-black shadow-xs'
                            : 'text-slate-700 font-semibold'
                        }`}
                      >
                        {day}
                      </span>

                      {dayEvents.length > 0 && (
                        <span className="text-[10px] font-mono font-black text-[#1878B8]">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    {/* Event Chips (Desktop) */}
                    <div className="hidden sm:block space-y-1 mt-1">
                      {dayEvents.slice(0, 2).map((ev) => {
                        const firstAssignee = ev.assignees && ev.assignees.length > 0 ? ev.assignees[0] : null;

                        return (
                          <div
                            key={ev.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDateStr(dStr);
                              setHighlightedEventId(ev.id);
                            }}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg truncate border leading-tight shadow-2xs flex items-center gap-1 ${
                              ev.event_type === 'roof_install'
                                ? 'bg-amber-50 text-amber-900 border-amber-200'
                                : ev.event_type === 'boom_delivery'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : ev.event_type === 'city_permit'
                                ? 'bg-sky-50 text-[#1878B8] border-sky-200'
                                : ev.event_type === 'warranty_checkin'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : ev.event_type === 'roof_inspection'
                                ? 'bg-teal-50 text-teal-800 border-teal-200'
                                : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                            }`}
                          >
                            {ev.is_synced ? (
                              <span className="text-[8px] opacity-75 shrink-0" title="Synced from pipeline">
                                🔗
                              </span>
                            ) : (
                              <span className="text-[8px] opacity-75 shrink-0">✓</span>
                            )}

                            {firstAssignee && (
                              <span className="shrink-0 text-[8px] opacity-80 font-normal">
                                {firstAssignee.name.split(' ')[0]}:
                              </span>
                            )}

                            <span className="truncate">{ev.title}</span>
                          </div>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <span className="text-[9px] font-bold text-slate-400 pl-1 block">
                          +{dayEvents.length - 2} more
                        </span>
                      )}
                    </div>

                    {/* Mobile Dot Indicators */}
                    <div className="sm:hidden flex gap-1 mt-auto pt-1">
                      {dayEvents.slice(0, 3).map((ev) => (
                        <span
                          key={ev.id}
                          className={`w-1.5 h-1.5 rounded-full shadow-2xs ${
                            ev.event_type === 'roof_install'
                              ? 'bg-[#EAA636]'
                              : ev.event_type === 'boom_delivery'
                              ? 'bg-purple-500'
                              : ev.event_type === 'city_permit'
                              ? 'bg-[#2F9FE3]'
                              : 'bg-emerald-500'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right (1/3): Selected Day Event Drawer */}
          <div className="admin-card p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="border-b border-slate-100/80 pb-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-black text-[#0284C7] tracking-wider block">
                  Selected Day Dispatch
                </span>
                <h3 className="text-lg font-black text-[#0B1E33] mt-0.5">
                  {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  {selectedDayEvents.length} operation{selectedDayEvents.length !== 1 ? 's' : ''} scheduled
                </p>
              </div>

              <button
                onClick={() => handleOpenCreateTask()}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                title="Add task for this day"
              >
                <Plus size={16} />
              </button>
            </div>

            {selectedDayEvents.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2.5">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <CalendarIcon size={22} />
                </div>
                <p className="font-semibold text-slate-500">No operations scheduled on this date.</p>
                <Link
                  href="/admin/pipeline"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0284C7] hover:underline"
                >
                  Schedule a job from pipeline &rarr;
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className={`p-4 rounded-2xl bg-white border transition-all space-y-2.5 ${
                      highlightedEventId === ev.id
                        ? 'border-sky-500 ring-2 ring-sky-200 shadow-md'
                        : 'border-slate-200/80 shadow-2xs hover:border-[#2F9FE3]/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                              ev.event_type === 'roof_install'
                                ? 'bg-amber-50 text-amber-900 border-amber-200'
                                : ev.event_type === 'boom_delivery'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : ev.event_type === 'city_permit'
                                ? 'bg-sky-50 text-[#0284C7] border-sky-200'
                                : ev.event_type === 'warranty_checkin'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : ev.event_type === 'roof_inspection'
                                ? 'bg-teal-50 text-teal-800 border-teal-200'
                                : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                            }`}
                          >
                            {ev.event_type.replace('_', ' ')}
                          </span>

                          {ev.is_synced ? (
                            <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-0.5">
                              <span>🔗 Synced</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-cyan-700 font-semibold bg-cyan-50 px-1.5 py-0.2 rounded border border-cyan-200">
                              Manual Task
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-bold text-[#0B1E33] mt-1.5">{ev.title}</h4>
                      </div>

                      {/* External Link or Edit Button */}
                      {ev.is_synced && ev.link ? (
                        <Link
                          href={ev.link}
                          className="p-1.5 rounded-xl bg-white border border-slate-200/80 text-slate-500 hover:text-[#0B1E33] shadow-2xs"
                          title="Open in Pipeline / Record"
                        >
                          <ExternalLink size={13} />
                        </Link>
                      ) : !ev.is_synced ? (
                        <button
                          onClick={() => handleOpenEditTask(ev)}
                          className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold"
                          title="Edit Task"
                        >
                          ✏️ Edit
                        </button>
                      ) : null}
                    </div>

                    {/* Customer & Address */}
                    {ev.customer && (
                      <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <User size={12} className="text-slate-400" /> {ev.customer}
                      </div>
                    )}

                    {ev.address && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <MapPin size={11} className="text-slate-400 flex-shrink-0" />
                        <span className="truncate">{ev.address}</span>
                      </div>
                    )}

                    {/* Time / Span */}
                    {ev.time && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <Clock size={11} className="text-slate-400" />
                        <span>Scheduled: {ev.time}</span>
                      </div>
                    )}

                    {/* Assignee Avatars */}
                    {ev.assignees && ev.assignees.length > 0 && (
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100 text-xs">
                        <span className="text-[10px] text-slate-400">Assigned:</span>
                        <div className="flex items-center gap-1 flex-wrap">
                          {ev.assignees.map((a, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium"
                            >
                              <UserAvatar name={a.name} avatarUrl={a.avatar_url} role={a.role} size="xs" />
                              <span>{a.name}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action buttons for manual task */}
                    {!ev.is_synced && (
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleToggleTaskComplete(ev.source_id, Boolean(ev.completed))}
                          className={`text-[11px] font-bold flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
                            ev.completed
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <CheckCircle2 size={12} />
                          <span>{ev.completed ? 'Completed' : 'Mark Done'}</span>
                        </button>

                        <button
                          onClick={() => handleDeleteTask(ev.source_id)}
                          className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold p-1"
                          title="Delete task"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}

                    {/* Action link for synced job */}
                    {ev.is_synced && ev.link && (
                      <div className="pt-2 border-t border-slate-100 flex justify-end">
                        <Link
                          href={ev.link}
                          className="text-xs font-bold text-[#0284C7] hover:underline flex items-center gap-1"
                        >
                          <span>Open Record</span>
                          <ExternalLink size={12} />
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── VIEW 2: DAY / TEAM SWIMLANE VIEW (NEW) ── */}
      {viewMode === 'team_day' && (
        <TeamDayView
          selectedDateStr={selectedDateStr}
          onSelectDate={(newDate) => setSelectedDateStr(newDate)}
          events={filteredEvents}
          team={team}
          onSelectEvent={(ev) => {
            setHighlightedEventId(ev.id);
            setViewMode('month'); // Switch to month or open details
          }}
          onEditTask={(ev) => handleOpenEditTask(ev)}
          onCreateTask={(personId, timeStr) => handleOpenCreateTask(personId, timeStr)}
        />
      )}

      {/* ── TASK MODAL (Create & Edit) ── */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        initialTask={editingTask}
        initialDate={selectedDateStr}
        initialTime={taskPrefillTime}
        initialPersonId={taskPrefillPersonId}
        team={team}
      />
    </div>
  );
}
