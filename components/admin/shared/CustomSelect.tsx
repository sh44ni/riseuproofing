'use client';

import React, { useState, useRef, useEffect, useId, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  badge?: string;
  badgeColor?: 'emerald' | 'sky' | 'amber' | 'gold' | 'rose' | 'slate' | 'purple';
  icon?: React.ReactNode;
  description?: string;
}

export interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (SelectOption | string)[];
  placeholder?: string;
  label?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
  triggerClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'dark' | 'compact' | 'glass';
  id?: string;
  title?: string;
}

const BADGE_COLOR_MAP: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  sky: 'bg-sky-50 text-[#1878B8] border-sky-200',
  amber: 'bg-amber-50 text-amber-800 border-amber-200',
  gold: 'bg-amber-50 text-amber-700 border-amber-300',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
};

export default function CustomSelect({
  value,
  onChange,
  options: rawOptions,
  placeholder = 'Select an option...',
  label,
  name,
  required = false,
  disabled = false,
  searchable,
  className = '',
  triggerClassName = '',
  size = 'md',
  variant = 'default',
  id,
  title,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; flipUp: boolean }>({
    top: 0,
    left: 0,
    width: 200,
    flipUp: false,
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autoId = useId();
  const selectId = id || autoId;

  // Standardize options
  const normalizedOptions: SelectOption[] = useMemo(() => {
    return rawOptions.map((opt) =>
      typeof opt === 'string' ? { value: opt, label: opt } : opt
    );
  }, [rawOptions]);

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  // Filtered options based on search
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const q = searchQuery.toLowerCase();
    return normalizedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q) ||
        (opt.description && opt.description.toLowerCase().includes(q))
    );
  }, [normalizedOptions, searchQuery]);

  // Determine if search should be enabled
  const isSearchable = searchable ?? normalizedOptions.length > 7;

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update floating popover position
  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = Math.min(320, normalizedOptions.length * 44 + (isSearchable ? 52 : 16));
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const flipUp = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

    const width = Math.max(rect.width, variant === 'compact' ? 180 : 240);
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
    if (!isOpen) {
      setSearchQuery('');
      setHighlightedIndex(-1);
      return;
    }

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
        dropdownRef.current?.contains(target)
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
  }, [isOpen, isMobile]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && isSearchable) {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isSearchable]);

  // Lock body scroll on mobile sheet
  useEffect(() => {
    if (isOpen && isMobile) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, isMobile]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % filteredOptions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          onChange(filteredOptions[highlightedIndex].value);
          setIsOpen(false);
          triggerRef.current?.focus();
        }
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  const isSmall = size === 'sm';
  const isLarge = size === 'lg';
  const isDark = variant === 'dark';
  const isCompact = variant === 'compact';

  // Base Trigger Styles
  let triggerClasses = '';
  if (isDark) {
    triggerClasses = isOpen
      ? 'bg-slate-900 border-amber-400 ring-2 ring-amber-400/30 text-white'
      : 'bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700 text-white';
  } else if (isCompact) {
    triggerClasses = isOpen
      ? 'bg-white border-[#2F9FE3] ring-2 ring-[#2F9FE3]/20 text-[#0B1E33]'
      : 'bg-white/90 hover:bg-white border border-slate-200/90 text-slate-700';
  } else {
    triggerClasses = isOpen
      ? 'bg-white border-[#2F9FE3] ring-3 ring-[#2F9FE3]/20 shadow-md shadow-[#2F9FE3]/5 text-[#0B1E33]'
      : 'bg-white/95 hover:bg-white border border-slate-200/90 hover:border-slate-300 shadow-2xs text-[#0B1E33]';
  }

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
          htmlFor={selectId}
          className={`block text-xs font-semibold mb-1 tracking-wide ${
            isDark ? 'text-slate-300' : 'text-slate-500'
          }`}
        >
          {label}
        </label>
      )}

      {/* Hidden input for HTML form submission support */}
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
        id={selectId}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen((prev) => !prev);
          }
        }}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2 text-left rounded-xl transition-all duration-200 cursor-pointer ${paddingClass} ${triggerClasses} ${
          disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''
        } ${triggerClassName}`}
      >
        <div className="flex items-center gap-2 truncate min-w-0">
          {selectedOption?.icon && (
            <span className="shrink-0 text-slate-500">{selectedOption.icon}</span>
          )}
          {selectedOption ? (
            <span className="truncate font-medium">
              {selectedOption.label}
            </span>
          ) : (
            <span className={`truncate font-normal ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
          {selectedOption?.badge && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                BADGE_COLOR_MAP[selectedOption.badgeColor || 'slate']
              }`}
            >
              {selectedOption.badge}
            </span>
          )}
          <ChevronDown
            size={isSmall || isCompact ? 13 : 15}
            className={`transition-transform duration-200 ${
              isDark ? 'text-slate-400' : 'text-slate-400'
            } ${isOpen ? 'rotate-180 text-[#2F9FE3]' : ''}`}
          />
        </div>
      </button>

      {/* Portaled Menu (Desktop Popover or Mobile BottomSheet) */}
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
                ref={dropdownRef}
                className="relative z-10 w-full bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl max-h-[82vh] flex flex-col pb-6 animate-in slide-in-from-bottom duration-250 ease-out"
              >
                {/* Drag / Touch Handle */}
                <div className="w-full flex justify-center pt-3 pb-2" onClick={() => setIsOpen(false)}>
                  <div className="w-10 h-1.5 rounded-full bg-slate-300" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 pb-3 border-b border-slate-100">
                  <div className="text-base font-bold text-[#0B1E33]">
                    {title || label || placeholder || 'Select Option'}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Search Bar if enabled */}
                {isSearchable && (
                  <div className="p-3 border-b border-slate-100">
                    <div className="relative flex items-center">
                      <Search size={16} className="absolute left-3 text-slate-400" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search options..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-[#0B1E33] focus:outline-none focus:border-[#2F9FE3] focus:bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* Mobile Options List */}
                <ul className="overflow-y-auto p-2 space-y-1 overscroll-contain flex-1">
                  {filteredOptions.length === 0 ? (
                    <li className="px-4 py-8 text-center text-sm text-slate-400">
                      No matching options found
                    </li>
                  ) : (
                    filteredOptions.map((opt) => {
                      const isSelected = opt.value === value;
                      return (
                        <li
                          key={opt.value}
                          onClick={() => {
                            onChange(opt.value);
                            setIsOpen(false);
                            triggerRef.current?.focus();
                          }}
                          className={`flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl cursor-pointer text-sm font-semibold transition-colors ${
                            isSelected
                              ? 'bg-[#2F9FE3]/15 text-[#1878B8]'
                              : 'text-[#0B1E33] hover:bg-slate-50 active:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-3 truncate min-w-0">
                            {opt.icon && <span className="shrink-0 text-slate-400">{opt.icon}</span>}
                            <div className="truncate">
                              <div className="truncate text-[15px]">{opt.label}</div>
                              {opt.description && (
                                <div className="text-xs text-slate-400 font-normal truncate mt-0.5">
                                  {opt.description}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {opt.badge && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  BADGE_COLOR_MAP[opt.badgeColor || 'slate']
                                }`}
                              >
                                {opt.badge}
                              </span>
                            )}
                            {isSelected && <Check size={18} className="text-[#1878B8] stroke-[3]" />}
                          </div>
                        </li>
                      );
                    })
                  )}
                </ul>
              </div>
            </div>
          ) : (
            /* 💻 DESKTOP FLOATING POPOVER (PORTALED + AUTO-FLIPPED) */
            <div
              ref={dropdownRef}
              style={{
                position: 'fixed',
                top: coords.flipUp ? undefined : `${coords.top}px`,
                bottom: coords.flipUp ? `${window.innerHeight - coords.top}px` : undefined,
                left: `${coords.left}px`,
                width: `${coords.width}px`,
                zIndex: 9999,
              }}
              className={`rounded-2xl border shadow-2xl p-1.5 focus:outline-none animate-in fade-in zoom-in-95 duration-150 ${
                isDark
                  ? 'bg-slate-900/95 backdrop-blur-2xl border-slate-700 text-white shadow-black/40'
                  : 'bg-white/98 backdrop-blur-2xl border-slate-200/90 text-[#0B1E33] shadow-slate-900/15'
              }`}
            >
              {/* Optional Search */}
              {isSearchable && (
                <div className="p-1.5 mb-1 border-b border-slate-100">
                  <div className="relative flex items-center">
                    <Search size={14} className="absolute left-2.5 text-slate-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-xs focus:outline-none ${
                        isDark
                          ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                          : 'bg-slate-50 border border-slate-200 text-[#0B1E33] placeholder-slate-400 focus:bg-white focus:border-[#2F9FE3]'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Options List */}
              <ul
                role="listbox"
                tabIndex={-1}
                className="max-h-60 overflow-y-auto space-y-0.5 custom-scrollbar"
              >
                {filteredOptions.length === 0 ? (
                  <li className="px-3 py-4 text-center text-xs text-slate-400">
                    No options found
                  </li>
                ) : (
                  filteredOptions.map((opt, index) => {
                    const isSelected = opt.value === value;
                    const isHighlighted = index === highlightedIndex;

                    return (
                      <li
                        key={opt.value}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          onChange(opt.value);
                          setIsOpen(false);
                          triggerRef.current?.focus();
                        }}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl cursor-pointer text-xs sm:text-sm font-semibold transition-colors select-none ${
                          isSelected
                            ? isDark
                              ? 'bg-amber-400/20 text-amber-300'
                              : 'bg-[#2F9FE3]/12 text-[#1878B8]'
                            : isHighlighted
                            ? isDark
                              ? 'bg-slate-800 text-white'
                              : 'bg-slate-100/90 text-[#0B1E33]'
                            : isDark
                            ? 'text-slate-300 hover:bg-slate-800/60'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate min-w-0">
                          {opt.icon && (
                            <span className={`shrink-0 ${isSelected ? 'text-[#1878B8]' : 'text-slate-400'}`}>
                              {opt.icon}
                            </span>
                          )}
                          <div className="truncate">
                            <div className="truncate">{opt.label}</div>
                            {opt.description && (
                              <div className="text-[10px] text-slate-400 font-normal truncate">
                                {opt.description}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {opt.badge && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border ${
                                BADGE_COLOR_MAP[opt.badgeColor || 'slate']
                              }`}
                            >
                              {opt.badge}
                            </span>
                          )}
                          {isSelected && (
                            <Check
                              size={14}
                              className={isDark ? 'text-amber-400 stroke-[2.5]' : 'text-[#1878B8] stroke-[2.5]'}
                            />
                          )}
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          ),
          document.body
        )}
    </div>
  );
}
