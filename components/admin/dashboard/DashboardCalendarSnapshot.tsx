'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  ChevronRight,
  Clock,
  MapPin,
  User,
  HardHat,
  ClipboardCheck,
  Truck,
  FileCheck,
  CheckCircle2,
  RefreshCw,
  CheckSquare,
} from 'lucide-react';
import { CalendarEvent } from '@/app/api/admin/calendar/route';

interface DashboardCalendarSnapshotProps {
  userId: number;
  userRole: string;
}

export default function DashboardCalendarSnapshot({
  userId,
  userRole,
}: DashboardCalendarSnapshotProps) {
  const isPrivileged =
    userRole === 'owner' ||
    userRole === 'project_manager' ||
    userRole === 'office_admin';

  const [filterMode, setFilterMode] = useState<'all' | 'my'>(
    isPrivileged ? 'all' : 'my'
  );
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0);

  // Generate next 7 days (today + 6 days)
  const days = useMemo(() => {
    const list: { dateStr: string; dayName: string; dayNum: number; isToday: boolean }[] = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayName = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });
      list.push({
        dateStr,
        dayName,
        dayNum: d.getDate(),
        isToday: i === 0,
      });
    }
    return list;
  }, []);

  const fetchCalendar = React.useCallback(async () => {
    setLoading(true);
    try {
      const url =
        filterMode === 'my'
          ? `/api/admin/calendar?person_id=${userId}`
          : `/api/admin/calendar`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : data.events || []);
      }
    } catch (err) {
      console.error('Failed to load calendar events', err);
    } finally {
      setLoading(false);
    }
  }, [filterMode, userId]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  // Group events by date string
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    days.forEach((d) => {
      map[d.dateStr] = [];
    });

    events.forEach((e) => {
      const dateKey = e.date || (e.start_at ? e.start_at.slice(0, 10) : '');
      if (dateKey && map[dateKey]) {
        map[dateKey].push(e);
      }
    });
    return map;
  }, [events, days]);

  const activeDateStr = days[selectedDayOffset]?.dateStr || days[0].dateStr;
  const activeDayEvents = eventsByDate[activeDateStr] || [];

  return (
    <div className="p-5 sm:p-6 rounded-2xl admin-card bg-white border border-slate-200/80 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1878B8] flex items-center justify-center font-bold flex-shrink-0">
            <CalendarIcon size={16} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-[#0B1E33] truncate">
                Calendar Snapshot
              </h2>
              <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                7 Days
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">Dispatch, inspections &amp; milestones</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Privilege Toggle */}
          {isPrivileged && (
            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-[11px] font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2 py-1 rounded-md transition cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-white text-[#0B1E33] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All Crew
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('my')}
                className={`px-2 py-1 rounded-md transition cursor-pointer ${
                  filterMode === 'my'
                    ? 'bg-white text-[#0B1E33] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                My Schedule
              </button>
            </div>
          )}

          <Link
            href="/admin/calendar"
            className="text-xs text-[#1878B8] hover:text-[#0B1E33] font-semibold flex items-center gap-1 transition-colors"
          >
            <span>Full View</span>
            <ChevronRight size={13} />
          </Link>
        </div>
      </div>

      {/* 7-Day Horizontal Selector */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 pt-1">
        {days.map((day, idx) => {
          const isSelected = selectedDayOffset === idx;
          const count = eventsByDate[day.dateStr]?.length || 0;

          return (
            <button
              key={day.dateStr}
              type="button"
              onClick={() => setSelectedDayOffset(idx)}
              className={`p-1.5 sm:p-2 rounded-xl text-center transition-all flex flex-col items-center justify-between border cursor-pointer ${
                isSelected
                  ? 'bg-[#0B1E33] text-white border-[#0B1E33] shadow-2xs scale-[1.02]'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/70'
              }`}
            >
              <span
                className={`text-[10px] font-bold ${
                  isSelected ? 'text-amber-400' : day.isToday ? 'text-[#1878B8]' : 'text-slate-400'
                }`}
              >
                {day.dayName}
              </span>
              <span className="text-xs sm:text-sm font-black my-0.5">{day.dayNum}</span>
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  count > 0
                    ? isSelected
                      ? 'bg-amber-400'
                      : 'bg-[#1878B8]'
                    : 'bg-transparent'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Events for Selected Day */}
      <div className="space-y-2 min-h-[140px]">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
          <span>
            {days[selectedDayOffset]?.isToday
              ? "Today's Schedule"
              : `${days[selectedDayOffset]?.dayName}, ${activeDateStr}`}
          </span>
          <span className="font-semibold text-slate-700">
            {activeDayEvents.length} {activeDayEvents.length === 1 ? 'Event' : 'Events'}
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw size={14} className="animate-spin text-[#1878B8]" />
            <span>Loading schedule...</span>
          </div>
        ) : activeDayEvents.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-1.5 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <CheckCircle2 size={20} className="text-slate-300" />
            <p className="font-medium text-slate-600">No scheduled items on this day.</p>
            <p className="text-[10px] text-slate-400">Open full calendar to schedule new dispatches or visits.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeDayEvents.map((evt) => (
              <CalendarEventCard key={evt.id} event={evt} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CalendarEventCard({ event }: { event: CalendarEvent }) {
  const meta = getEventTypeMeta(event.event_type, event.source_type);
  const targetLink =
    event.link ||
    (event.source_type === 'pipeline_job'
      ? `/admin/jobs?id=${event.source_id}`
      : event.source_type === 'inspection'
      ? `/admin/inspections?id=${event.source_id}`
      : event.source_type === 'pipeline_lead'
      ? `/admin/leads/${event.source_id}`
      : `/admin/calendar`);

  return (
    <Link
      href={targetLink}
      className="p-3 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-2xs transition-all flex items-start justify-between gap-3 group block"
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <div className={`p-1.5 rounded-lg ${meta.badgeBg} ${meta.badgeColor} flex-shrink-0 mt-0.5`}>
          {meta.icon}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#0B1E33] group-hover:text-[#1878B8] transition-colors truncate">
              {event.title}
            </span>
            <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border ${meta.tagStyle}`}>
              {meta.label}
            </span>
          </div>

          {(event.customer || event.address) && (
            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 truncate">
              {event.customer && <span className="font-semibold text-slate-700">{event.customer}</span>}
              {event.customer && event.address && <span>•</span>}
              {event.address && (
                <span className="flex items-center gap-0.5 truncate text-slate-500">
                  <MapPin size={10} className="text-slate-400 flex-shrink-0" />
                  <span className="truncate">{event.address}</span>
                </span>
              )}
            </div>
          )}

          {event.assignees && event.assignees.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500">
              <User size={10} className="text-slate-400" />
              <span>{event.assignees.map((a) => a.name).join(', ')}</span>
            </div>
          )}
        </div>
      </div>

      <div className="text-right flex-shrink-0 flex flex-col items-end justify-between self-stretch">
        <span className="text-[11px] font-mono font-semibold text-slate-600 flex items-center gap-1">
          <Clock size={11} className="text-slate-400" />
          {event.time || 'All Day'}
        </span>
        <ChevronRight size={13} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
      </div>
    </Link>
  );
}

function getEventTypeMeta(eventType: string, sourceType: string) {
  switch (eventType) {
    case 'roof_install':
      return {
        label: 'Jobsite Install',
        badgeBg: 'bg-blue-50',
        badgeColor: 'text-blue-700',
        tagStyle: 'bg-blue-50 text-blue-800 border-blue-200',
        icon: <HardHat size={14} />,
      };
    case 'roof_inspection':
      return {
        label: '12-Pt Inspection',
        badgeBg: 'bg-emerald-50',
        badgeColor: 'text-emerald-700',
        tagStyle: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        icon: <ClipboardCheck size={14} />,
      };
    case 'boom_delivery':
      return {
        label: 'Material Boom',
        badgeBg: 'bg-amber-50',
        badgeColor: 'text-amber-800',
        tagStyle: 'bg-amber-50 text-amber-800 border-amber-200',
        icon: <Truck size={14} />,
      };
    case 'city_permit':
      return {
        label: 'City Permit',
        badgeBg: 'bg-cyan-50',
        badgeColor: 'text-cyan-800',
        tagStyle: 'bg-cyan-50 text-cyan-800 border-cyan-200',
        icon: <FileCheck size={14} />,
      };
    case 'task':
      return {
        label: 'Task',
        badgeBg: 'bg-purple-50',
        badgeColor: 'text-purple-700',
        tagStyle: 'bg-purple-50 text-purple-800 border-purple-200',
        icon: <CheckSquare size={14} />,
      };
    default:
      return {
        label: sourceType.replace('_', ' '),
        badgeBg: 'bg-slate-50',
        badgeColor: 'text-slate-700',
        tagStyle: 'bg-slate-50 text-slate-700 border-slate-200',
        icon: <CalendarIcon size={14} />,
      };
  }
}
