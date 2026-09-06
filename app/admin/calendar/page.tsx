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
} from 'lucide-react';
import { CalendarEvent } from '@/app/api/admin/calendar/route';

const EVENT_TYPES = [
  { id: 'all', label: 'All Events', color: 'bg-slate-100 text-slate-700' },
  { id: 'job', label: 'Roof Installs', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  { id: 'delivery', label: 'Boom Deliveries', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'city_inspection', label: 'City Permits', color: 'bg-sky-50 text-[#1878B8] border-sky-200' },
  { id: 'task', label: 'Tasks', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { id: 'warranty', label: 'Warranty Check-ins', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { id: 'inspection', label: 'Roof Inspections', color: 'bg-teal-50 text-teal-800 border-teal-200' },
];

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState('all');

  // Calendar Date State (default to current month)
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/calendar');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('Failed to load calendar events', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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
    setSelectedDateStr(today.toISOString().slice(0, 10));
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

  // Filter events
  const filteredEvents = events.filter(e => {
    if (filterType === 'all') return true;
    return e.type === filterType;
  });

  // Selected date events
  const selectedDayEvents = filteredEvents.filter(e => {
    if (e.date === selectedDateStr) return true;
    if (e.endDate && e.date <= selectedDateStr && e.endDate >= selectedDateStr) return true;
    return false;
  });

  function getEventsForDay(day: number) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filteredEvents.filter(e => {
      if (e.date === dStr) return true;
      if (e.endDate && e.date <= dStr && e.endDate >= dStr) return true;
      return false;
    });
  }

  return (
    <div className="space-y-6 pb-28 md:pb-14 max-w-7xl mx-auto">
      {/* Header — Apple Liquid Glass Card */}
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
              Schedule active roof installs, supplier boom deliveries, and city permit inspections
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setRefreshing(true);
              fetchEvents();
            }}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200/80 bg-white/85 hover:bg-white text-xs font-bold text-slate-700 shadow-2xs transition-all duration-200 cursor-pointer apple-spring-press"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-[#2F9FE3]' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs — Apple Liquid Glass Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
        {EVENT_TYPES.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setFilterType(t.id)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer apple-spring-press ${
              filterType === t.id
                ? 'admin-glass-pill-gold-active shadow-xs scale-[1.02]'
                : 'admin-glass-pill text-slate-600 hover:text-[#0B1E33]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Calendar Grid & Day Detail (2 Columns on Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2/3): Apple Liquid Glass Calendar Month Grid */}
        <div className="lg:col-span-2 admin-card p-5 sm:p-6 space-y-4 shadow-xs">
          {/* Calendar Month Navigation Header */}
          <div className="flex items-center justify-between border-b border-slate-100/80 pb-4">
            <h2 className="text-lg sm:text-xl font-black text-[#0B1E33] tracking-tight">
              {monthNames[month]} {year}
            </h2>

            <div className="flex items-center gap-2">
              <button
                onClick={goToToday}
                className="px-3.5 py-1.5 rounded-full bg-slate-100/80 hover:bg-slate-200/80 text-xs font-bold text-slate-700 border border-slate-200/60 transition-all duration-200 cursor-pointer apple-spring-press shadow-2xs"
              >
                Today
              </button>
              <button
                onClick={prevMonth}
                className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-600 hover:text-[#0B1E33] border border-slate-200/80 flex items-center justify-center transition-all duration-200 cursor-pointer apple-spring-press shadow-2xs"
                aria-label="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={nextMonth}
                className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-600 hover:text-[#0B1E33] border border-slate-200/80 flex items-center justify-center transition-all duration-200 cursor-pointer apple-spring-press shadow-2xs"
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

          {/* Calendar Grid Cells — Tactile Liquid Squircles */}
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
                  className={`min-h-[64px] sm:min-h-[88px] p-2 rounded-2xl border text-left cursor-pointer transition-all duration-200 flex flex-col justify-between apple-spring-press ${
                    isSelected
                      ? 'bg-gradient-to-b from-sky-500/15 via-sky-500/8 to-blue-500/5 border-[#2F9FE3] shadow-[0_4px_16px_rgba(47,159,227,0.2),inset_0_1px_1px_rgba(255,255,255,0.95)] ring-2 ring-[#2F9FE3]/40'
                      : isToday
                      ? 'bg-amber-50/60 border-amber-300 shadow-2xs'
                      : 'bg-white/75 border-slate-200/80 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isToday
                          ? 'w-6 h-6 rounded-full bg-gradient-to-br from-[#FBBF24] to-[#D97706] text-white flex items-center justify-center text-[11px] font-black shadow-[0_2px_8px_rgba(234,166,54,0.35)]'
                          : isSelected
                          ? 'w-6 h-6 rounded-full bg-[#2F9FE3] text-white flex items-center justify-center text-[11px] font-black shadow-[0_2px_8px_rgba(47,159,227,0.4)]'
                          : 'text-slate-700 font-semibold'
                      }`}
                    >
                      {day}
                    </span>

                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-mono font-black text-[#1878B8] sm:hidden">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Event Chips (Desktop) */}
                  <div className="hidden sm:block space-y-1 mt-1">
                    {dayEvents.slice(0, 2).map(ev => {
                      return (
                        <div
                          key={ev.id}
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-lg truncate border leading-tight shadow-2xs ${
                            ev.type === 'job'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : ev.type === 'delivery'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : ev.type === 'city_inspection'
                              ? 'bg-sky-50 text-[#1878B8] border-sky-200'
                              : ev.type === 'warranty'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                          }`}
                        >
                          {ev.title}
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
                    {dayEvents.slice(0, 3).map(ev => (
                      <span
                        key={ev.id}
                        className={`w-1.5 h-1.5 rounded-full shadow-2xs ${
                          ev.type === 'job'
                            ? 'bg-[#EAA636]'
                            : ev.type === 'delivery'
                            ? 'bg-purple-500'
                            : ev.type === 'city_inspection'
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
          <div className="border-b border-slate-100/80 pb-3.5">
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
              {selectedDayEvents.length} event{selectedDayEvents.length !== 1 ? 's' : ''} scheduled
            </p>
          </div>

          {selectedDayEvents.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2.5">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <CalendarIcon size={22} />
              </div>
              <p className="font-semibold text-slate-500">No operations scheduled on this date.</p>
              <Link
                href="/admin/jobs"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0284C7] hover:underline"
              >
                Schedule a job from pipeline &rarr;
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDayEvents.map(ev => (
                <div
                  key={ev.id}
                  className="p-4 rounded-2xl bg-white/80 border border-slate-200/80 shadow-2xs space-y-2.5 transition-all hover:border-[#2F9FE3]/40 hover:shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                          ev.type === 'job'
                            ? 'bg-amber-50 text-amber-900 border-amber-200'
                            : ev.type === 'delivery'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : ev.type === 'city_inspection'
                            ? 'bg-sky-50 text-[#0284C7] border-sky-200'
                            : ev.type === 'warranty'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                        }`}
                      >
                        {ev.type.replace('_', ' ')}
                      </span>
                      <h4 className="text-xs font-bold text-[#0B1E33] mt-1.5">{ev.title}</h4>
                    </div>

                    {ev.link && (
                      <Link
                        href={ev.link}
                        className="p-1.5 rounded-xl bg-white border border-slate-200/80 text-slate-500 hover:text-[#0B1E33] shadow-2xs apple-spring-press"
                        title="View Details"
                      >
                        <ExternalLink size={13} />
                      </Link>
                    )}
                  </div>

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

                  {ev.crewLead && (
                    <div className="text-[11px] text-amber-800 font-medium">
                      Foreman / Lead: {ev.crewLead}
                    </div>
                  )}

                  {ev.contractValue && ev.contractValue > 0 && (
                    <div className="text-xs font-mono font-black text-emerald-700">
                      ${ev.contractValue.toLocaleString()} Contract
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
