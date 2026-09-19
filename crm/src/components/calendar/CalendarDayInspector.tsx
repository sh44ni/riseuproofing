import React from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  Plus,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Edit3,
  Trash2,
  Check,
  Briefcase,
  Flag,
} from 'lucide-react';
import { TeamOperationEvent } from '@/types/calendarTypes';
import { CATEGORY_CONFIG } from '@/data/calendarData';

interface CalendarDayInspectorProps {
  selectedDay: number;
  currentYear?: number;
  currentMonth?: number;
  events: TeamOperationEvent[];
  onOpenNewTask: () => void;
  onToggleStatus: (eventId: string) => void;
  onEditEvent?: (event: TeamOperationEvent) => void;
  onDeleteEvent?: (eventId: string) => void;
}

export function CalendarDayInspector({
  selectedDay,
  currentYear,
  currentMonth,
  events,
  onOpenNewTask,
  onToggleStatus,
  onEditEvent,
  onDeleteEvent,
}: CalendarDayInspectorProps) {
  const dayEvents = events.filter((e) => e.dayNumber === selectedDay);

  const year = currentYear || 2026;
  const month = currentMonth || 9;

  const getFormattedDate = (day: number) => {
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formattedDate = getFormattedDate(selectedDay);

  return (
    <div className="bg-white/85 light-glass-panel rounded-3xl border border-white/90 shadow-sm p-4 sm:p-5 flex flex-col justify-between select-none h-full">
      {/* Top Header */}
      <div className="shrink-0 flex items-start justify-between gap-3 pb-3.5 border-b border-slate-200/70">
        <div>
          <div className="text-[10.5px] font-black text-[#0284c7] tracking-wider uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7] animate-pulse" />
            <span>Day Operations &amp; Tasks</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-0.5">
            {formattedDate}
          </h3>
          <div className="text-xs text-slate-500 font-semibold mt-0.5 flex items-center gap-1.5">
            <span>
              {dayEvents.length} {dayEvents.length === 1 ? 'operation' : 'operations'} scheduled
            </span>
            {dayEvents.length > 3 && (
              <span className="px-2 py-0.5 rounded-full bg-sky-100 text-[#0284c7] font-bold text-[10px]">
                Stacked Schedule
              </span>
            )}
          </div>
        </div>

        {/* Action Button: + Add Operation */}
        <button
          type="button"
          onClick={onOpenNewTask}
          title="Schedule operation for this date"
          className="h-8 px-2.5 rounded-xl bg-gradient-to-r from-[#1878B8] to-sky-500 hover:opacity-95 text-white flex items-center gap-1 text-xs font-bold shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <Plus size={14} className="stroke-[3]" />
          <span className="hidden sm:inline">Add Task</span>
        </button>
      </div>

      {/* Main Scrollable Body */}
      <div className="flex-1 min-h-0 py-3 overflow-y-auto pr-1">
        {dayEvents.length === 0 ? (
          /* Empty State */
          <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-sky-50/90 border border-sky-200/80 flex items-center justify-center text-[#1878B8] shadow-2xs">
              <CalendarDays size={26} className="stroke-[1.8]" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">
                No operations scheduled for this day
              </div>
              <p className="text-xs text-slate-400 mt-0.5 max-w-[240px]">
                Assign yourself or a colleague a task, client visit, or project operation.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenNewTask}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#1878B8] hover:text-[#0284c7] hover:underline transition-all cursor-pointer pt-1"
            >
              <span>+ Schedule an operation</span>
              <span className="text-sm">→</span>
            </button>
          </div>
        ) : (
          /* Populated Operational Cards */
          <div className="space-y-3">
            {dayEvents.map((evt) => {
              const cfg = CATEGORY_CONFIG[evt.category] || CATEGORY_CONFIG['team_task'];
              const isDone = evt.completed || evt.status === 'completed';
              const priorityColor =
                evt.priority === 'urgent'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : evt.priority === 'high'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200';

              return (
                <div
                  key={evt.id}
                  className={`p-3.5 rounded-2xl border transition-all bg-white/95 shadow-2xs hover:border-sky-300 space-y-2.5 ${
                    isDone ? 'opacity-70 bg-slate-50/80 border-slate-200' : 'border-slate-200/90'
                  }`}
                >
                  {/* Row 1: Checkbox + Due Time + Category + Priority + Actions */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {/* Interactive Completion Checkbox */}
                      <button
                        type="button"
                        onClick={() => onToggleStatus(evt.id)}
                        title={isDone ? 'Mark active' : 'Mark completed'}
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                          isDone
                            ? 'bg-emerald-500 border-emerald-600 text-white shadow-2xs'
                            : 'border-slate-300 hover:border-emerald-500 bg-white'
                        }`}
                      >
                        {isDone && <Check size={12} className="stroke-[3]" />}
                      </button>

                      {/* Time Window */}
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-mono text-[10.5px] font-bold border border-slate-200/80 flex items-center gap-1">
                        <Clock size={10} className="text-slate-500" />
                        <span>{evt.startTime || '09:00 AM'}{evt.endTime ? ` – ${evt.endTime}` : ''}</span>
                      </span>

                      {/* Category Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${cfg.badgeClass}`}
                      >
                        {cfg.pillLabel}
                      </span>

                      {/* Priority Badge */}
                      {evt.priority && (
                        <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold uppercase border ${priorityColor}`}>
                          {evt.priority}
                        </span>
                      )}
                    </div>

                    {/* Edit / Delete Buttons */}
                    <div className="flex items-center gap-1">
                      {onEditEvent && (
                        <button
                          type="button"
                          onClick={() => onEditEvent(evt)}
                          title="Edit operation details"
                          className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-[#1878B8] transition-colors cursor-pointer"
                        >
                          <Edit3 size={12} />
                        </button>
                      )}

                      {onDeleteEvent && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete operation "${evt.title}"?`)) {
                              onDeleteEvent(evt.id);
                            }
                          }}
                          title="Delete operation"
                          className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Operation Title */}
                  <div>
                    <div className={`font-black text-sm text-slate-900 leading-snug ${isDone ? 'line-through text-slate-500' : ''}`}>
                      {evt.title}
                    </div>
                    {evt.description && (
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {evt.description}
                      </p>
                    )}
                  </div>

                  {/* Optional Linked CRM Entity */}
                  {evt.entityName && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/80">
                      <Briefcase size={11} className="text-[#1878B8] shrink-0" />
                      <span className="font-semibold text-slate-500">
                        {evt.entityType === 'lead' ? 'Lead:' : evt.entityType === 'job' ? 'Project:' : 'Linked:'}
                      </span>
                      <span className="font-bold text-slate-900 truncate">
                        {evt.entityName}
                      </span>
                      {evt.city && <span className="text-[10.5px] text-slate-400 ml-auto">({evt.city})</span>}
                    </div>
                  )}

                  {/* Location Address if provided */}
                  {evt.address && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <MapPin size={11} className="text-[#1878B8] shrink-0" />
                      <span className="truncate">{evt.address}{evt.city ? `, ${evt.city}` : ''}</span>
                    </div>
                  )}

                  {/* Assignee Footer */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px]">
                    <div className="flex items-center gap-2 text-slate-700 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-lg bg-gradient-to-tr ${
                          evt.assignedToAvatarColor || 'from-sky-500 to-blue-600'
                        } text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-2xs`}
                      >
                        {evt.assignedToInitials || 'TM'}
                      </div>
                      <div className="truncate">
                        <span className="font-bold text-slate-900">
                          {evt.assignedToName || 'Team Member'}
                        </span>
                        {evt.assignedToRole && (
                          <span className="text-slate-400 ml-1.5 text-[10.5px] font-medium hidden sm:inline">
                            • {evt.assignedToRole}
                          </span>
                        )}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isDone
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {isDone ? 'Done' : 'Active'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Summary Footer */}
      <div className="shrink-0 pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs text-slate-500 font-semibold">
        <span>Team Schedule</span>
        <button
          type="button"
          onClick={onOpenNewTask}
          className="text-[#1878B8] hover:text-[#0284c7] font-bold transition-colors cursor-pointer"
        >
          + Add New Task
        </button>
      </div>
    </div>
  );
}

export default CalendarDayInspector;
