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
    <div className="space-y-6 pb-24 md:pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-[16px] bg-sky-50 border border-sky-200 text-[#1878B8]">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#0B1E33]">
              Field Operations &amp; Dispatch Calendar
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
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
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 shadow-xs transition-all duration-300 ease-out cursor-pointer"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-[#2F9FE3]' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {EVENT_TYPES.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setFilterType(t.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ease-out whitespace-nowrap cursor-pointer ${
              filterType === t.id
                ? 'admin-btn-gold shadow-xs'
                : 'bg-white text-slate-600 hover:text-[#0B1E33] border border-slate-200 shadow-2xs'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Calendar Grid & Day Detail (2 Columns on Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2/3): Calendar Month Grid */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-[20px] bg-white border border-slate-200/80 space-y-4 shadow-xs">
          {/* Calendar Month Navigation Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-lg sm:text-xl font-black text-[#0B1E33]">
              {monthNames[month]} {year}
            </h2>

            <div className="flex items-center gap-1.5">
              <button
                onClick={goToToday}
                className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200 transition-all duration-300 ease-out cursor-pointer"
              >
                Today
              </button>
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-[#0B1E33] border border-slate-200 transition-all duration-300 ease-out cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-[#0B1E33] border border-slate-200 transition-all duration-300 ease-out cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 pb-1">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Calendar Grid Cells */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="min-h-[64px] sm:min-h-[88px] rounded-xl bg-slate-50/50 border border-transparent"
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
                  className={`min-h-[64px] sm:min-h-[88px] p-1.5 sm:p-2 rounded-xl border text-left cursor-pointer transition-all duration-300 ease-out flex flex-col justify-between ${
                    isSelected
                      ? 'bg-sky-50/50 border-[#2F9FE3] shadow-xs ring-2 ring-[#2F9FE3]/30'
                      : isToday
                      ? 'bg-amber-50/40 border-[#EAA636]/40'
                      : 'bg-white border-slate-200/70 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isToday
                          ? 'w-5 h-5 rounded-full bg-[#EAA636] text-white flex items-center justify-center text-[10px]'
                          : isSelected
                          ? 'text-[#1878B8] font-black'
                          : 'text-slate-700'
                      }`}
                    >
                      {day}
                    </span>

                    {dayEvents.length > 0 && (
                      <span className="text-[9px] font-mono font-bold text-slate-500 sm:hidden">
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
                          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded truncate border leading-tight ${
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
                      <div className="text-[9px] text-slate-400 font-mono">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>

                  {/* Mobile Dot Indicators */}
                  <div className="sm:hidden flex gap-1 mt-auto pt-1">
                    {dayEvents.slice(0, 3).map(ev => (
                      <span
                        key={ev.id}
                        className={`w-1.5 h-1.5 rounded-full ${
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
        <div className="p-5 sm:p-6 rounded-[20px] bg-white border border-slate-200/80 space-y-4 shadow-xs">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[10px] uppercase font-bold text-[#1878B8] tracking-wider">
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
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedDayEvents.length} event{selectedDayEvents.length !== 1 ? 's' : ''} scheduled
            </p>
          </div>

          {selectedDayEvents.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <CalendarIcon size={28} className="mx-auto text-slate-300" />
              <p>No operations scheduled on this date.</p>
              <Link
                href="/admin/jobs"
                className="inline-block text-[#1878B8] hover:underline font-semibold"
              >
                Schedule a job from pipeline &rarr;
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDayEvents.map(ev => (
                <div
                  key={ev.id}
                  className="p-3.5 rounded-[16px] bg-slate-50/80 border border-slate-200/80 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${
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
                        {ev.type.replace('_', ' ')}
                      </span>
                      <h4 className="text-xs font-bold text-[#0B1E33] mt-1">{ev.title}</h4>
                    </div>

                    {ev.link && (
                      <Link
                        href={ev.link}
                        className="p-1 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-[#0B1E33]"
                        title="View Details"
                      >
                        <ExternalLink size={12} />
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
                    <div className="text-xs font-mono font-bold text-emerald-700">
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
