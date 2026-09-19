import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ArrowRight, Check, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import { useCalendarEvents, CATEGORY_ACCENT_COLORS } from '@/lib/calendarStore';
import { DispatchEvent } from '@/types/calendarTypes';

export function SidebarScheduleWidget() {
  const navigate = useNavigate();
  const { events, toggleEventStatus, getDotsForDay } = useCalendarEvents();

  // Selected day number in September 2026 (defaults to 11 to match executive dashboard focus)
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(11);
  const [showAllAgenda, setShowAllAgenda] = useState(false);

  // 5-Day working week window
  const weekDays = useMemo(
    () => [
      { label: 'Mon', num: 8, dateStr: 'Mon, Sep 8, 2026' },
      { label: 'Tue', num: 9, dateStr: 'Tue, Sep 9, 2026' },
      { label: 'Wed', num: 10, dateStr: 'Wed, Sep 10, 2026', isToday: true },
      { label: 'Thu', num: 11, dateStr: 'Thu, Sep 11, 2026' },
      { label: 'Fri', num: 12, dateStr: 'Fri, Sep 12, 2026' },
    ],
    []
  );

  const activeDayObj = weekDays.find((d) => d.num === selectedDayNumber) || weekDays[3];

  // Events filtered for the selected day
  const dayEvents = useMemo(() => {
    return events.filter((e) => e.dayNumber === selectedDayNumber);
  }, [events, selectedDayNumber]);

  // Navigate to calendar with day filter
  const handleOpenCalendar = (eventId?: string) => {
    const query = eventId
      ? `/calendar?day=${selectedDayNumber}&eventId=${encodeURIComponent(eventId)}`
      : `/calendar?day=${selectedDayNumber}`;
    navigate(query);
  };

  return (
    <div className="relative z-10 rounded-2xl light-glass-panel glossy-sheen border border-white/85 shadow-xs p-3 space-y-2.5 select-none group/schedule hover:border-sky-300 transition-all">
      {/* ========================================================
          1. HEADER: Title, Date & Calendar Link
          ======================================================== */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-[#1F1F1F] leading-none">Today's Schedule</h3>
          <span className="text-[9.5px] text-slate-400 font-medium">
            {activeDayObj.dateStr}
          </span>
        </div>
        <button
          type="button"
          onClick={() => handleOpenCalendar()}
          className="text-[9.5px] font-bold text-[#0284c7] hover:text-[#0369a1] flex items-center gap-0.5 group transition-colors cursor-pointer"
        >
          <span>Calendar</span>
          <ArrowRight size={9} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* ========================================================
          2. DAY SELECTOR STRIP: MON 8 to FRI 12 with Dynamic Event Dots
          ======================================================== */}
      <div className="grid grid-cols-5 gap-1 p-1 rounded-xl bg-white/50 border border-white/80 backdrop-blur-md shadow-2xs">
        {weekDays.map((day) => {
          const isSelected = selectedDayNumber === day.num;
          const dots = getDotsForDay(day.num);

          return (
            <button
              key={day.num}
              type="button"
              onClick={() => setSelectedDayNumber(day.num)}
              className={`group flex flex-col items-center py-1.5 px-0.5 rounded-lg text-center transition-all cursor-pointer relative ${
                isSelected
                  ? 'bg-gradient-to-b from-[#1878B8] to-[#0ea5e9] text-white shadow-xs font-bold ring-1 ring-sky-300/60 scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <span
                className={`text-[8.5px] uppercase tracking-wider font-semibold ${
                  isSelected ? 'text-sky-100' : 'text-slate-400'
                }`}
              >
                {day.label}
              </span>
              <span className="text-xs font-black leading-tight mt-0.5">{day.num}</span>

              {/* Dynamic activity indicators computed from real events */}
              <div className="flex items-center justify-center gap-0.5 mt-1 h-1">
                {dots.length > 0 ? (
                  dots.map((dotClass, i) => (
                    <span
                      key={i}
                      className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/90' : dotClass}`}
                    />
                  ))
                ) : (
                  <span className="w-1 h-1 rounded-full opacity-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ========================================================
          3. INTERACTIVE AGENDA DISPATCH CARDS
          ======================================================== */}
      <div className="space-y-1.5 pt-0.5">
        {dayEvents.length === 0 ? (
          <div className="py-4 text-center rounded-xl bg-white/40 border border-white/60 p-2 text-slate-400">
            <CalendarIcon size={16} className="mx-auto mb-1 text-slate-400 opacity-60" />
            <p className="text-[10px] font-semibold text-slate-500">No dispatches scheduled</p>
            <button
              type="button"
              onClick={() => handleOpenCalendar()}
              className="text-[9px] font-bold text-[#0284c7] hover:underline mt-1 inline-block"
            >
              + Schedule on Calendar
            </button>
          </div>
        ) : (
          (showAllAgenda
            ? dayEvents
            : dayEvents.filter((e) => e.status === 'in_progress').length > 0
            ? dayEvents.filter((e) => e.status === 'in_progress')
            : [dayEvents[0]]
          ).map((event) => {
            const isCompleted = event.status === 'completed';
            const isCurrent = event.status === 'in_progress';
            const accentColor = CATEGORY_ACCENT_COLORS[event.category] || '#0284c7';

            return (
              <div
                key={event.id}
                onClick={() => handleOpenCalendar(event.id)}
                className={`group relative flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer border ${
                  isCurrent
                    ? 'bg-gradient-to-r from-rose-50/90 via-white/80 to-white/90 border-rose-300/80 shadow-xs ring-1 ring-rose-200/60 hover:border-rose-400 backdrop-blur-md'
                    : isCompleted
                    ? 'bg-white/40 border-white/60 hover:bg-white/70 backdrop-blur-xs'
                    : 'liquid-glass-tile border-white/80 hover:border-sky-300 hover:shadow-2xs'
                }`}
              >
                {/* Stage Color Left Stripe */}
                <div
                  className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full"
                  style={{ backgroundColor: isCurrent ? '#e11d48' : accentColor }}
                />

                <div className="flex items-center gap-2 pl-1.5 min-w-0">
                  {/* Status Indicator / Completion Checkbox */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleEventStatus(event.id);
                    }}
                    title={isCompleted ? 'Mark scheduled' : 'Mark completed'}
                    className="shrink-0 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                  >
                    {isCompleted ? (
                      <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-2xs">
                        <Check size={9} className="stroke-[3]" />
                      </div>
                    ) : isCurrent ? (
                      <div className="relative flex items-center justify-center w-4 h-4">
                        <span className="absolute w-3.5 h-3.5 rounded-full bg-rose-400/50 animate-ping" />
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs" />
                      </div>
                    ) : (
                      <div
                        className="w-2 h-2 rounded-full group-hover:scale-125 transition-transform"
                        style={{ backgroundColor: accentColor }}
                      />
                    )}
                  </button>

                  {/* Title & Details */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 leading-tight">
                      <span
                        className={`text-[11px] font-bold truncate ${
                          isCompleted
                            ? 'text-slate-400 line-through'
                            : isCurrent
                            ? 'text-rose-950 font-extrabold'
                            : 'text-[#1F1F1F]'
                        }`}
                      >
                        {event.title}
                      </span>
                      {isCurrent && (
                        <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[8px] font-black uppercase tracking-wider animate-pulse">
                          NOW
                        </span>
                      )}
                    </div>
                    <div className="text-[9.5px] text-slate-500 flex items-center gap-1 truncate mt-0.5">
                      <span className="font-semibold text-slate-600">{event.startTime}</span>
                      <span className="text-slate-300">•</span>
                      <span className="truncate">{event.city || event.address}</span>
                    </div>
                  </div>
                </div>

                {/* Right Badge / Time Action */}
                <div className="shrink-0 pl-1">
                  {isCompleted ? (
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/60">
                      Done
                    </span>
                  ) : isCurrent ? (
                    <span className="text-[9.5px] font-black text-rose-600 bg-rose-100/90 px-2 py-0.5 rounded-md border border-rose-200/80 shadow-2xs">
                      {event.startTime}
                    </span>
                  ) : (
                    <span className="text-[9px] font-semibold text-slate-500 bg-slate-100/80 group-hover:text-slate-700 group-hover:bg-slate-200/80 transition-colors px-1.5 py-0.5 rounded-md">
                      {event.startTime}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================
          4. VIEW ALL / COLLAPSE EXPANDER
          ======================================================== */}
      {dayEvents.length > 1 && (
        <button
          type="button"
          onClick={() => setShowAllAgenda((prev) => !prev)}
          className="w-full py-1.5 px-3 rounded-xl liquid-glass-btn text-[10px] font-bold text-slate-600 hover:text-[#0284c7] flex items-center justify-center gap-1.5 transition-all cursor-pointer group shadow-2xs"
        >
          <span>{showAllAgenda ? 'Show Less' : `View All (${dayEvents.length})`}</span>
          <ChevronDown
            size={12}
            className={`text-slate-400 group-hover:text-[#0284c7] transition-transform duration-200 ${
              showAllAgenda ? 'rotate-180' : ''
            }`}
          />
        </button>
      )}
    </div>
  );
}
