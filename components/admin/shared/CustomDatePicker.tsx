'use client';

import React, { useState, useRef, useEffect, useId, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Check,
} from 'lucide-react';

export interface CustomDatePickerProps {
  value: string; // "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm" or "HH:mm"
  onChange: (value: string) => void;
  mode?: 'date' | 'datetime' | 'time';
  placeholder?: string;
  label?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
  className?: string;
  triggerClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'dark' | 'compact';
  id?: string;
  title?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const QUICK_TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
];

export default function CustomDatePicker({
  value,
  onChange,
  mode = 'date',
  placeholder,
  label,
  name,
  required = false,
  disabled = false,
  minDate,
  maxDate,
  className = '',
  triggerClassName = '',
  size = 'md',
  variant = 'default',
  id,
  title,
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Parse current value
  const parsedValue = useMemo(() => {
    if (!value) return null;
    if (mode === 'time') {
      const [h, m] = value.split(':').map(Number);
      return { year: 0, month: 0, day: 0, hours: h || 0, minutes: m || 0 };
    }
    const d = new Date(value);
    if (isNaN(d.getTime())) {
      // Fallback manual parse for YYYY-MM-DD or YYYY-MM-DDTHH:mm
      const parts = value.split('T');
      const [y, m, day] = (parts[0] || '').split('-').map(Number);
      const [hh, mm] = (parts[1] || '00:00').split(':').map(Number);
      return {
        year: y || new Date().getFullYear(),
        month: (m || 1) - 1,
        day: day || 1,
        hours: hh || 0,
        minutes: mm || 0,
      };
    }
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      day: d.getDate(),
      hours: d.getHours(),
      minutes: d.getMinutes(),
    };
  }, [value, mode]);

  // Calendar display month/year state
  const [viewDate, setViewDate] = useState<Date>(() => {
    if (parsedValue && mode !== 'time') {
      return new Date(parsedValue.year, parsedValue.month, 1);
    }
    return new Date();
  });

  // Time states
  const [selectedHours, setSelectedHours] = useState<number>(() => parsedValue?.hours ?? 9);
  const [selectedMinutes, setSelectedMinutes] = useState<number>(() => parsedValue?.minutes ?? 0);

  // Floating coordinates on desktop
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; flipUp: boolean }>({
    top: 0,
    left: 0,
    width: 320,
    flipUp: false,
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const autoId = useId();
  const pickerId = id || autoId;

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sync internal view when value changes
  useEffect(() => {
    if (parsedValue && mode !== 'time') {
      setViewDate(new Date(parsedValue.year, parsedValue.month, 1));
      setSelectedHours(parsedValue.hours);
      setSelectedMinutes(parsedValue.minutes);
    } else if (parsedValue && mode === 'time') {
      setSelectedHours(parsedValue.hours);
      setSelectedMinutes(parsedValue.minutes);
    }
  }, [parsedValue, mode]);

  // Position calculation
  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const pickerHeight = mode === 'datetime' ? 440 : 360;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const flipUp = spaceBelow < pickerHeight && spaceAbove > spaceBelow;

    const width = 320;
    let left = rect.left;
    if (left + width > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - width - 12);
    }

    setCoords({
      top: flipUp ? rect.top - 6 : rect.bottom + 6,
      left,
      width,
      flipUp,
    });
  };

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleScrollOrResize = () => {
      if (!isMobile) updatePosition();
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        pickerRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, isMobile, mode]);

  // Lock mobile body scroll
  useEffect(() => {
    if (isOpen && isMobile) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [isOpen, isMobile]);

  // Keyboard close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  // Calendar Day Generation
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday
    const totalDays = lastDay.getDate();

    const days: Array<{
      date: Date;
      isCurrentMonth: boolean;
      dayNumber: number;
      dateString: string;
      isSelected: boolean;
      isToday: boolean;
      isDisabled: boolean;
    }> = [];

    const todayStr = new Date().toISOString().split('T')[0];

    // Previous month trailing days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({
        date: d,
        isCurrentMonth: false,
        dayNumber: prevMonthLastDay - i,
        dateString,
        isSelected: Boolean(parsedValue && parsedValue.year === d.getFullYear() && parsedValue.month === d.getMonth() && parsedValue.day === d.getDate()),
        isToday: dateString === todayStr,
        isDisabled: Boolean((minDate && dateString < minDate) || (maxDate && dateString > maxDate)),
      });
    }

    // Current month days
    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, month, day);
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        date: d,
        isCurrentMonth: true,
        dayNumber: day,
        dateString,
        isSelected: Boolean(parsedValue && parsedValue.year === year && parsedValue.month === month && parsedValue.day === day),
        isToday: dateString === todayStr,
        isDisabled: Boolean((minDate && dateString < minDate) || (maxDate && dateString > maxDate)),
      });
    }

    // Next month trailing days to complete grid (up to 42 cells or 35 cells)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({
        date: d,
        isCurrentMonth: false,
        dayNumber: i,
        dateString,
        isSelected: Boolean(parsedValue && parsedValue.year === d.getFullYear() && parsedValue.month === d.getMonth() && parsedValue.day === d.getDate()),
        isToday: dateString === todayStr,
        isDisabled: Boolean((minDate && dateString < minDate) || (maxDate && dateString > maxDate)),
      });
    }

    return days;
  }, [viewDate, parsedValue, minDate, maxDate]);

  // Handlers
  const handleSelectDate = (dateStr: string) => {
    if (mode === 'date') {
      onChange(dateStr);
      setIsOpen(false);
      triggerRef.current?.focus();
    } else if (mode === 'datetime') {
      const timeStr = `${String(selectedHours).padStart(2, '0')}:${String(selectedMinutes).padStart(2, '0')}`;
      onChange(`${dateStr}T${timeStr}`);
    }
  };

  const handleTimeChange = (hours: number, minutes: number) => {
    setSelectedHours(hours);
    setSelectedMinutes(minutes);
    const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

    if (mode === 'time') {
      onChange(timeStr);
      setIsOpen(false);
      triggerRef.current?.focus();
    } else if (mode === 'datetime') {
      const baseDate = parsedValue
        ? `${parsedValue.year}-${String(parsedValue.month + 1).padStart(2, '0')}-${String(parsedValue.day).padStart(2, '0')}`
        : new Date().toISOString().split('T')[0];
      onChange(`${baseDate}T${timeStr}`);
    }
  };

  const incrementHour = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleTimeChange((selectedHours + 1) % 24, selectedMinutes);
  };

  const decrementHour = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleTimeChange((selectedHours - 1 + 24) % 24, selectedMinutes);
  };

  const incrementMinute = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const slots = [0, 15, 30, 45];
    const currIdx = slots.indexOf(selectedMinutes);
    const nextMinute = currIdx === -1 ? 0 : slots[(currIdx + 1) % slots.length];
    handleTimeChange(selectedHours, nextMinute);
  };

  const decrementMinute = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const slots = [0, 15, 30, 45];
    const currIdx = slots.indexOf(selectedMinutes);
    const prevMinute = currIdx <= 0 ? slots[slots.length - 1] : slots[currIdx - 1];
    handleTimeChange(selectedHours, prevMinute);
  };

  const toggleAmPm = (targetAmPm: 'AM' | 'PM', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const isCurrentlyPm = selectedHours >= 12;
    if (targetAmPm === 'AM' && isCurrentlyPm) {
      handleTimeChange(selectedHours - 12, selectedMinutes);
    } else if (targetAmPm === 'PM' && !isCurrentlyPm) {
      handleTimeChange(selectedHours + 12, selectedMinutes);
    }
  };

  const handleQuickPreset = (preset: 'today' | 'tomorrow' | 'nextWeek' | 'clear') => {
    if (preset === 'clear') {
      onChange('');
      setIsOpen(false);
      return;
    }

    const d = new Date();
    if (preset === 'tomorrow') d.setDate(d.getDate() + 1);
    if (preset === 'nextWeek') d.setDate(d.getDate() + 7);

    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (mode === 'date') {
      onChange(dateStr);
      setIsOpen(false);
    } else if (mode === 'datetime') {
      const timeStr = `${String(selectedHours).padStart(2, '0')}:${String(selectedMinutes).padStart(2, '0')}`;
      onChange(`${dateStr}T${timeStr}`);
    }
  };

  // Human readable label for trigger
  const displayLabel = useMemo(() => {
    if (!value) return placeholder || (mode === 'time' ? 'Select Time' : 'Select Date');

    if (mode === 'time') {
      const [h, m] = value.split(':').map(Number);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const dispH = h % 12 || 12;
      return `${dispH}:${String(m).padStart(2, '0')} ${ampm}`;
    }

    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) return value;

      const dateStr = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      if (mode === 'datetime') {
        const timeStr = d.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
        return `${dateStr} • ${timeStr}`;
      }

      return dateStr;
    } catch {
      return value;
    }
  }, [value, mode, placeholder]);

  const isSmall = size === 'sm';
  const isLarge = size === 'lg';
  const isDark = variant === 'dark';
  const isCompact = variant === 'compact';

  const paddingClass = isCompact
    ? 'px-2 py-1 text-xs'
    : isSmall
    ? 'min-h-[36px] px-3 py-1.5 text-xs font-semibold'
    : isLarge
    ? 'min-h-[48px] px-4 py-3 text-sm font-semibold'
    : 'min-h-[42px] px-3.5 py-2 text-sm font-semibold';

  return (
    <div className={`relative w-full ${className}`}>
      {label && (
        <label
          htmlFor={pickerId}
          className={`block text-xs font-semibold mb-1 tracking-wide ${
            isDark ? 'text-slate-300' : 'text-slate-500'
          }`}
        >
          {label}
        </label>
      )}

      {/* Hidden input for native HTML forms */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={value}
          required={required}
        />
      )}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        id={pickerId}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 text-left rounded-xl transition-all duration-200 cursor-pointer ${paddingClass} ${
          isDark
            ? isOpen
              ? 'bg-slate-900 border-amber-400 ring-2 ring-amber-400/30 text-white'
              : 'bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-white'
            : isOpen
            ? 'bg-white border-[#2F9FE3] ring-3 ring-[#2F9FE3]/20 shadow-md shadow-[#2F9FE3]/5 text-[#0B1E33]'
            : 'bg-white/95 hover:bg-white border border-slate-200/90 hover:border-slate-300 shadow-2xs text-[#0B1E33]'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''} ${triggerClassName}`}
      >
        <div className="flex items-center gap-2 truncate">
          {mode === 'time' ? (
            <Clock size={isSmall || isCompact ? 14 : 16} className="shrink-0 text-slate-400" />
          ) : (
            <CalendarIcon size={isSmall || isCompact ? 14 : 16} className="shrink-0 text-slate-400" />
          )}
          <span className={`truncate ${value ? 'font-medium' : isDark ? 'text-slate-500' : 'text-slate-400 font-normal'}`}>
            {displayLabel}
          </span>
        </div>

        {value && !disabled && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors ml-auto"
            title="Clear date"
          >
            <X size={12} />
          </span>
        )}
      </button>

      {/* Portaled Calendar / Time Picker */}
      {mounted && isOpen &&
        createPortal(
          isMobile ? (
            /* 📱 MOBILE BOTTOM SHEET DRAWER */
            <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
              <div
                className="fixed inset-0 bg-[#0B1E33]/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
                onClick={() => setIsOpen(false)}
              />
              <div
                ref={pickerRef}
                className="relative z-10 w-full bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl max-h-[88vh] flex flex-col p-5 pb-8 animate-in slide-in-from-bottom duration-250 ease-out"
              >
                {/* Drag Handle */}
                <div className="w-full flex justify-center pb-3" onClick={() => setIsOpen(false)}>
                  <div className="w-10 h-1.5 rounded-full bg-slate-300" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <div className="text-base font-bold text-[#0B1E33]">
                    {title || label || (mode === 'time' ? 'Select Time' : 'Select Date')}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Quick Presets (for date) */}
                {mode !== 'time' && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <button
                      type="button"
                      onClick={() => handleQuickPreset('today')}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickPreset('tomorrow')}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
                    >
                      Tomorrow
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickPreset('nextWeek')}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
                    >
                      Next Week
                    </button>
                    {value && (
                      <button
                        type="button"
                        onClick={() => handleQuickPreset('clear')}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-rose-700 ml-auto"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                )}

                {/* Calendar Body */}
                {mode !== 'time' && (
                  <div className="mb-4">
                    {/* Month Navigator */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-[#0B1E33]">
                        {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 gap-1 text-center mb-1">
                      {DAYS_OF_WEEK.map((day) => (
                        <span key={day} className="text-[11px] font-bold text-slate-400 py-1">
                          {day}
                        </span>
                      ))}
                    </div>

                    {/* Day Grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((d, i) => (
                        <button
                          key={i}
                          type="button"
                          disabled={d.isDisabled}
                          onClick={() => handleSelectDate(d.dateString)}
                          className={`h-10 rounded-xl flex items-center justify-center text-sm font-semibold transition-colors ${
                            d.isSelected
                              ? 'bg-[#1878B8] text-white shadow-sm shadow-[#1878B8]/30 font-bold'
                              : d.isToday
                              ? 'border border-[#2F9FE3] text-[#1878B8] font-bold bg-sky-50/50'
                              : d.isCurrentMonth
                              ? 'text-[#0B1E33] hover:bg-slate-100'
                              : 'text-slate-300 hover:bg-slate-50'
                          } ${d.isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          {d.dayNumber}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Time Selector for datetime or time mode */}
                {mode !== 'date' && (
                  <div className="border-t border-slate-100 pt-3">
                    <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Clock size={14} />
                      <span>Select Time</span>
                    </div>

                    <div className="flex items-center justify-center gap-2 mb-3 bg-slate-50/80 p-2 rounded-2xl border border-slate-100">
                      {/* Hour Stepper */}
                      <div className="flex items-center bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
                        <button
                          type="button"
                          onClick={decrementHour}
                          className="px-2 py-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                          title="Previous hour"
                        >
                          <ChevronDown size={14} />
                        </button>
                        <span className="w-8 text-center font-bold text-sm text-[#0B1E33] select-none">
                          {String(selectedHours % 12 || 12).padStart(2, '0')}
                        </span>
                        <button
                          type="button"
                          onClick={incrementHour}
                          className="px-2 py-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                          title="Next hour"
                        >
                          <ChevronUp size={14} />
                        </button>
                      </div>

                      <span className="font-bold text-slate-400 text-sm">:</span>

                      {/* Minute Stepper */}
                      <div className="flex items-center bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
                        <button
                          type="button"
                          onClick={decrementMinute}
                          className="px-2 py-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                          title="Previous 15 mins"
                        >
                          <ChevronDown size={14} />
                        </button>
                        <span className="w-8 text-center font-bold text-sm text-[#0B1E33] select-none">
                          {String(selectedMinutes).padStart(2, '0')}
                        </span>
                        <button
                          type="button"
                          onClick={incrementMinute}
                          className="px-2 py-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                          title="Next 15 mins"
                        >
                          <ChevronUp size={14} />
                        </button>
                      </div>

                      {/* AM / PM Toggle */}
                      <div className="flex bg-slate-200/70 p-0.5 rounded-xl text-xs font-bold shadow-2xs">
                        <button
                          type="button"
                          onClick={(e) => toggleAmPm('AM', e)}
                          className={`px-2 py-1 rounded-lg transition-all ${
                            selectedHours < 12
                              ? 'bg-white text-[#1878B8] shadow-2xs font-extrabold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          AM
                        </button>
                        <button
                          type="button"
                          onClick={(e) => toggleAmPm('PM', e)}
                          className={`px-2 py-1 rounded-lg transition-all ${
                            selectedHours >= 12
                              ? 'bg-white text-[#1878B8] shadow-2xs font-extrabold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          PM
                        </button>
                      </div>
                    </div>

                    {/* Quick slots */}
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_TIME_SLOTS.map((slot) => {
                        const [h, m] = slot.split(':').map(Number);
                        const isSelected = selectedHours === h && selectedMinutes === m;
                        const ampm = h >= 12 ? 'PM' : 'AM';
                        const dispH = h % 12 || 12;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => handleTimeChange(h, m)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                              isSelected
                                ? 'bg-[#1878B8] text-white border-[#1878B8]'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {dispH}:{String(m).padStart(2, '0')} {ampm}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Mobile Done Button */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="mt-4 w-full py-3 rounded-2xl bg-[#1878B8] text-white font-bold text-sm shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check size={16} />
                  <span>Done</span>
                </button>
              </div>
            </div>
          ) : (
            /* 💻 DESKTOP FLOATING POPOVER (PORTALED + AUTO-FLIPPED) */
            <div
              ref={pickerRef}
              style={{
                position: 'fixed',
                top: coords.flipUp ? undefined : `${coords.top}px`,
                bottom: coords.flipUp ? `${window.innerHeight - coords.top}px` : undefined,
                left: `${coords.left}px`,
                width: `${coords.width}px`,
                zIndex: 9999,
              }}
              className="rounded-2xl border border-slate-200/90 bg-white/98 backdrop-blur-2xl shadow-2xl p-4 text-[#0B1E33] animate-in fade-in zoom-in-95 duration-150"
            >
              {/* Quick Presets */}
              {mode !== 'time' && (
                <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('today')}
                    className="px-2.5 py-1 rounded-md bg-slate-50 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 border border-slate-200/70"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('tomorrow')}
                    className="px-2.5 py-1 rounded-md bg-slate-50 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 border border-slate-200/70"
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('nextWeek')}
                    className="px-2.5 py-1 rounded-md bg-slate-50 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 border border-slate-200/70"
                  >
                    +1 Wk
                  </button>
                  {value && (
                    <button
                      type="button"
                      onClick={() => handleQuickPreset('clear')}
                      className="px-2 py-1 rounded-md text-[11px] font-semibold text-rose-600 hover:bg-rose-50 ml-auto"
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}

              {/* Calendar Grid */}
              {mode !== 'time' && (
                <div>
                  {/* Month header */}
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-xs font-bold text-[#0B1E33]">
                      {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
                    </span>
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                        className="p-1 rounded-md hover:bg-slate-100 text-slate-600"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                        className="p-1 rounded-md hover:bg-slate-100 text-slate-600"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Weekdays */}
                  <div className="grid grid-cols-7 gap-1 text-center mb-1">
                    {DAYS_OF_WEEK.map((d) => (
                      <span key={d} className="text-[10px] font-bold text-slate-400 py-0.5">
                        {d}
                      </span>
                    ))}
                  </div>

                  {/* Day cells */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((d, i) => (
                      <button
                        key={i}
                        type="button"
                        disabled={d.isDisabled}
                        onClick={() => handleSelectDate(d.dateString)}
                        className={`h-7 w-full rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${
                          d.isSelected
                            ? 'bg-[#1878B8] text-white shadow-2xs font-bold'
                            : d.isToday
                            ? 'border border-[#2F9FE3] text-[#1878B8] font-bold bg-sky-50/50'
                            : d.isCurrentMonth
                            ? 'text-slate-800 hover:bg-slate-100'
                            : 'text-slate-300 hover:bg-slate-50'
                        } ${d.isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {d.dayNumber}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Time Selector for datetime or time mode */}
              {mode !== 'date' && (
                <div className={`${mode === 'datetime' ? 'border-t border-slate-100 mt-3 pt-3' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Clock size={12} />
                      Time
                    </span>
                    <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-100">
                      {/* Hour Stepper */}
                      <div className="flex items-center bg-white rounded-lg border border-slate-200 shadow-2xs">
                        <button
                          type="button"
                          onClick={decrementHour}
                          className="px-1.5 py-1 text-slate-500 hover:text-slate-900"
                        >
                          <ChevronDown size={12} />
                        </button>
                        <span className="w-6 text-center font-bold text-xs text-[#0B1E33]">
                          {String(selectedHours % 12 || 12).padStart(2, '0')}
                        </span>
                        <button
                          type="button"
                          onClick={incrementHour}
                          className="px-1.5 py-1 text-slate-500 hover:text-slate-900"
                        >
                          <ChevronUp size={12} />
                        </button>
                      </div>

                      <span className="font-bold text-slate-400 text-xs">:</span>

                      {/* Minute Stepper */}
                      <div className="flex items-center bg-white rounded-lg border border-slate-200 shadow-2xs">
                        <button
                          type="button"
                          onClick={decrementMinute}
                          className="px-1.5 py-1 text-slate-500 hover:text-slate-900"
                        >
                          <ChevronDown size={12} />
                        </button>
                        <span className="w-6 text-center font-bold text-xs text-[#0B1E33]">
                          {String(selectedMinutes).padStart(2, '0')}
                        </span>
                        <button
                          type="button"
                          onClick={incrementMinute}
                          className="px-1.5 py-1 text-slate-500 hover:text-slate-900"
                        >
                          <ChevronUp size={12} />
                        </button>
                      </div>

                      {/* AM / PM Toggle */}
                      <div className="flex bg-slate-200/70 p-0.5 rounded-lg text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={(e) => toggleAmPm('AM', e)}
                          className={`px-1.5 py-0.5 rounded transition-all ${
                            selectedHours < 12
                              ? 'bg-white text-[#1878B8] font-black shadow-2xs'
                              : 'text-slate-600'
                          }`}
                        >
                          AM
                        </button>
                        <button
                          type="button"
                          onClick={(e) => toggleAmPm('PM', e)}
                          className={`px-1.5 py-0.5 rounded transition-all ${
                            selectedHours >= 12
                              ? 'bg-white text-[#1878B8] font-black shadow-2xs'
                              : 'text-slate-600'
                          }`}
                        >
                          PM
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick slot chips */}
                  <div className="flex flex-wrap gap-1">
                    {['09:00', '12:00', '14:00', '16:30'].map((slot) => {
                      const [h, m] = slot.split(':').map(Number);
                      const isSelected = selectedHours === h && selectedMinutes === m;
                      const ampm = h >= 12 ? 'PM' : 'AM';
                      const dispH = h % 12 || 12;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => handleTimeChange(h, m)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                            isSelected
                              ? 'bg-[#1878B8] text-white border-[#1878B8]'
                              : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
                          }`}
                        >
                          {dispH}:{String(m).padStart(2, '0')} {ampm}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ),
          document.body
        )}
    </div>
  );
}
