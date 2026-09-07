'use client';

import React from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Plus,
  User,
  Zap,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { CalendarEvent, CalendarEventType } from '@/app/api/admin/calendar/route';
import UserAvatar from '@/components/admin/shared/UserAvatar';
import RoleBadge from '@/components/admin/shared/RoleBadge';

interface TeamDayViewProps {
  selectedDateStr: string;
  onSelectDate: (dateStr: string) => void;
  events: CalendarEvent[];
  team: Array<{ id: number; name: string; role: string; email: string; avatar_url: string | null }>;
  onSelectEvent: (event: CalendarEvent) => void;
  onEditTask: (event: CalendarEvent) => void;
  onCreateTask: (personId?: number, timeStr?: string) => void;
}

const HOURS = [
  { hour: 7, label: '7 AM', timeKey: '07:00' },
  { hour: 8, label: '8 AM', timeKey: '08:00' },
  { hour: 9, label: '9 AM', timeKey: '09:00' },
  { hour: 10, label: '10 AM', timeKey: '10:00' },
  { hour: 11, label: '11 AM', timeKey: '11:00' },
  { hour: 12, label: '12 PM', timeKey: '12:00' },
  { hour: 13, label: '1 PM', timeKey: '13:00' },
  { hour: 14, label: '2 PM', timeKey: '14:00' },
  { hour: 15, label: '3 PM', timeKey: '15:00' },
  { hour: 16, label: '4 PM', timeKey: '16:00' },
  { hour: 17, label: '5 PM', timeKey: '17:00' },
  { hour: 18, label: '6 PM', timeKey: '18:00' },
];

const EVENT_TYPE_STYLES: Record<
  CalendarEventType,
  { bg: string; border: string; text: string; badge: string }
> = {
  roof_install: {
    bg: 'bg-amber-50 hover:bg-amber-100/80',
    border: 'border-amber-300',
    text: 'text-amber-900',
    badge: 'bg-amber-100 text-amber-900 border-amber-200',
  },
  boom_delivery: {
    bg: 'bg-purple-50 hover:bg-purple-100/80',
    border: 'border-purple-300',
    text: 'text-purple-900',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  city_permit: {
    bg: 'bg-sky-50 hover:bg-sky-100/80',
    border: 'border-sky-300',
    text: 'text-sky-900',
    badge: 'bg-sky-100 text-[#0284C7] border-sky-200',
  },
  roof_inspection: {
    bg: 'bg-teal-50 hover:bg-teal-100/80',
    border: 'border-teal-300',
    text: 'text-teal-900',
    badge: 'bg-teal-100 text-teal-800 border-teal-200',
  },
  warranty_checkin: {
    bg: 'bg-emerald-50 hover:bg-emerald-100/80',
    border: 'border-emerald-300',
    text: 'text-emerald-900',
    badge: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  },
  task: {
    bg: 'bg-cyan-50 hover:bg-cyan-100/80',
    border: 'border-cyan-300',
    text: 'text-cyan-900',
    badge: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  },
};

export default function TeamDayView({
  selectedDateStr,
  onSelectDate,
  events,
  team,
  onSelectEvent,
  onEditTask,
  onCreateTask,
}: TeamDayViewProps) {
  // Day navigation
  const prevDay = () => {
    const d = new Date(selectedDateStr + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    onSelectDate(d.toISOString().slice(0, 10));
  };

  const nextDay = () => {
    const d = new Date(selectedDateStr + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    onSelectDate(d.toISOString().slice(0, 10));
  };

  const setToday = () => {
    onSelectDate(new Date().toISOString().slice(0, 10));
  };

  // Filter events active on this date (single day or spanning multi-day)
  const dayEvents = events.filter((e) => {
    if (e.date === selectedDateStr) return true;
    if (e.endDate && e.date <= selectedDateStr && e.endDate >= selectedDateStr) return true;
    return false;
  });

  // Check which person is assigned to each event
  const isPersonAssigned = (e: CalendarEvent, personId: number, personName: string): boolean => {
    if (e.assignee_ids && e.assignee_ids.includes(personId)) return true;
    const nameLow = personName.toLowerCase().trim();
    if (e.assignees && e.assignees.some((a) => a.id === personId || (a.name && a.name.toLowerCase().trim() === nameLow))) {
      return true;
    }
    if (e.crew_lead && e.crew_lead.toLowerCase().trim() === nameLow) return true;
    return false;
  };

  // Unassigned events on this day: any event not assigned to a specific team member
  const unassignedEvents = dayEvents.filter((e) => {
    return !team.some((person) => isPersonAssigned(e, person.id, person.name));
  });

  // Helper to extract hour from ISO string
  const getEventHour = (e: CalendarEvent): number | null => {
    if (e.is_all_day || !e.start_at) return null;
    try {
      const d = new Date(e.start_at);
      return d.getHours();
    } catch {
      return null;
    }
  };

  return (
    <div className="admin-card p-4 sm:p-5 space-y-4 shadow-xs overflow-hidden">
      {/* ── TOP DAY NAVIGATION BAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs">
            <button
              onClick={prevDay}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={setToday}
              className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={nextDay}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {dayEvents.length} scheduled operation{dayEvents.length !== 1 ? 's' : ''} &bull; {team.length} crew &amp; staff members
            </p>
          </div>
        </div>

        <button
          onClick={() => onCreateTask()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Task</span>
        </button>
      </div>

      {/* ── SWIMLANE HORIZONTAL SCROLLER ── */}
      <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-2xs">
        <div className="min-w-[1250px] divide-y divide-slate-100">
          {/* Header Row: Person Column + All-Day + 12 Hourly Columns */}
          <div className="grid grid-cols-[200px_160px_repeat(12,minmax(75px,1fr))] bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200 sticky top-0 z-20">
            <div className="p-3 border-r border-slate-200 bg-slate-100/70">
              Team Member
            </div>
            <div className="p-3 text-center border-r border-slate-200 bg-amber-50/50 text-amber-900">
              All-Day / Multi-Day
            </div>
            {HOURS.map((h) => (
              <div key={h.hour} className="p-3 text-center border-r border-slate-200/80 last:border-r-0">
                {h.label}
              </div>
            ))}
          </div>

          {/* ── TEAM MEMBER SWIMLANES ── */}
          {team.map((person) => {
            const personDayEvents = dayEvents.filter((e) =>
              isPersonAssigned(e, person.id, person.name)
            );
            const allDayEvents = personDayEvents.filter((e) => e.is_all_day || getEventHour(e) === null);
            const timedEvents = personDayEvents.filter((e) => !e.is_all_day && getEventHour(e) !== null);

            return (
              <div
                key={person.id}
                className="grid grid-cols-[200px_160px_repeat(12,minmax(75px,1fr))] min-h-[76px] hover:bg-slate-50/50 transition-colors group"
              >
                {/* Person Header Column */}
                <div className="p-3 border-r border-slate-200 flex items-center gap-2.5 bg-white group-hover:bg-slate-50/80 sticky left-0 z-10">
                  <UserAvatar
                    name={person.name}
                    avatarUrl={person.avatar_url}
                    role={person.role}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {person.name}
                    </div>
                    <div className="text-[10px] text-slate-400 capitalize truncate">
                      {person.role.replace('_', ' ')}
                    </div>
                  </div>
                </div>

                {/* All-Day Slot */}
                <div className="p-1.5 border-r border-slate-200/80 bg-amber-50/20 flex flex-col gap-1 justify-center">
                  {allDayEvents.map((ev) => {
                    const style = EVENT_TYPE_STYLES[ev.event_type] || EVENT_TYPE_STYLES.task;
                    return (
                      <div
                        key={ev.id}
                        onClick={() => (ev.is_synced ? onSelectEvent(ev) : onEditTask(ev))}
                        className={`p-1.5 rounded-lg border text-[11px] font-bold shadow-2xs cursor-pointer transition-all ${style.bg} ${style.border} ${style.text}`}
                        title={ev.title}
                      >
                        <div className="flex items-center gap-1 truncate">
                          {ev.is_synced ? (
                            <span className="text-[9px]" title="Synced from pipeline">🔗</span>
                          ) : (
                            <span className="text-[9px]">✓</span>
                          )}
                          <span className="truncate">{ev.title}</span>
                        </div>
                        {ev.customer && (
                          <div className="text-[10px] font-normal opacity-85 truncate">
                            {ev.customer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {allDayEvents.length === 0 && (
                    <button
                      onClick={() => onCreateTask(person.id)}
                      className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 hover:text-slate-700 py-1 text-center transition-opacity"
                    >
                      + Add
                    </button>
                  )}
                </div>

                {/* 12 Hourly Columns */}
                {HOURS.map((h) => {
                  const hourEvents = timedEvents.filter((e) => getEventHour(e) === h.hour);

                  return (
                    <div
                      key={h.hour}
                      onClick={() => {
                        if (hourEvents.length === 0) {
                          onCreateTask(person.id, h.timeKey);
                        }
                      }}
                      className="p-1 border-r border-slate-200/60 last:border-r-0 relative group/cell hover:bg-sky-50/30 transition-colors flex flex-col gap-1 cursor-pointer"
                    >
                      {hourEvents.map((ev) => {
                        const style = EVENT_TYPE_STYLES[ev.event_type] || EVENT_TYPE_STYLES.task;
                        return (
                          <div
                            key={ev.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (ev.is_synced) onSelectEvent(ev);
                              else onEditTask(ev);
                            }}
                            className={`p-1.5 rounded-lg border text-[10px] font-bold shadow-2xs cursor-pointer transition-all ${style.bg} ${style.border} ${style.text}`}
                            title={ev.title}
                          >
                            <div className="flex items-center gap-1 truncate">
                              {ev.is_synced && <span className="text-[8px]">🔗</span>}
                              <span className="truncate">{ev.time || h.label}</span>
                            </div>
                            <div className="truncate font-semibold">{ev.title}</div>
                          </div>
                        );
                      })}

                      {hourEvents.length === 0 && (
                        <div className="opacity-0 group-hover/cell:opacity-100 flex items-center justify-center h-full text-slate-300 text-[10px] transition-opacity">
                          +
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* ── UNASSIGNED OPERATIONS POOL SWIMLANE ── */}
          {unassignedEvents.length > 0 && (
            <div className="grid grid-cols-[200px_160px_repeat(12,minmax(75px,1fr))] min-h-[76px] bg-amber-50/30 border-t-2 border-amber-300/80">
              <div className="p-3 border-r border-slate-200 flex items-center gap-2.5 bg-amber-50/60 sticky left-0 z-10">
                <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                  <Zap className="w-3.5 h-3.5 fill-white" />
                </div>
                <div>
                  <div className="text-xs font-black text-amber-950">Unassigned Pool</div>
                  <div className="text-[10px] text-amber-700 font-semibold">
                    {unassignedEvents.length} items need rep/crew
                  </div>
                </div>
              </div>

              {/* Unassigned All-Day */}
              <div className="p-1.5 border-r border-slate-200/80 flex flex-col gap-1 justify-center">
                {unassignedEvents
                  .filter((e) => e.is_all_day || getEventHour(e) === null)
                  .map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => (ev.is_synced ? onSelectEvent(ev) : onEditTask(ev))}
                      className="p-1.5 rounded-lg border border-dashed border-amber-400 bg-amber-100/60 text-amber-900 text-[11px] font-bold shadow-2xs cursor-pointer truncate"
                      title={ev.title}
                    >
                      ⚡ {ev.title}
                    </div>
                  ))}
              </div>

              {/* Unassigned Hourly Slots */}
              {HOURS.map((h) => {
                const hourEvents = unassignedEvents.filter(
                  (e) => !e.is_all_day && getEventHour(e) === h.hour
                );

                return (
                  <div
                    key={h.hour}
                    className="p-1 border-r border-slate-200/60 last:border-r-0 flex flex-col gap-1"
                  >
                    {hourEvents.map((ev) => (
                      <div
                        key={ev.id}
                        onClick={() => (ev.is_synced ? onSelectEvent(ev) : onEditTask(ev))}
                        className="p-1.5 rounded-lg border border-dashed border-amber-400 bg-amber-100/70 text-amber-950 text-[10px] font-bold shadow-2xs cursor-pointer truncate"
                        title={ev.title}
                      >
                        ⚡ {ev.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
