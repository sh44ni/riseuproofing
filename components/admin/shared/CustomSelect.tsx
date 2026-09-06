'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  badge?: string;
  badgeColor?: 'emerald' | 'sky' | 'amber' | 'gold' | 'rose' | 'slate' | 'purple';
  icon?: React.ReactNode;
  description?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  size?: 'sm' | 'md';
  id?: string;
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
  options,
  placeholder = 'Select an option...',
  label,
  disabled = false,
  className = '',
  triggerClassName = '',
  size = 'md',
  id,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const autoId = useId();
  const selectId = id || autoId;

  const selectedOption = options.find(opt => opt.value === value);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Sync highlighted index when opened
  useEffect(() => {
    if (isOpen) {
      const idx = options.findIndex(opt => opt.value === value);
      setHighlightedIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, options, value]);

  // Handle keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0 && highlightedIndex < options.length) {
          onChange(options[highlightedIndex].value);
          setIsOpen(false);
        } else {
          setIsOpen(true);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => (prev + 1) % options.length);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => (prev - 1 + options.length) % options.length);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  }

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && listboxRef.current && highlightedIndex >= 0) {
      const activeEl = listboxRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const isSmall = size === 'sm';

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold text-slate-500 mb-1 tracking-wide"
        >
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        id={selectId}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2 text-left rounded-xl transition-all duration-200 cursor-pointer ${
          isSmall
            ? 'min-h-[38px] px-3 py-1.5 text-xs font-semibold'
            : 'min-h-[44px] px-3.5 py-2.5 text-sm font-semibold'
        } ${
          disabled
            ? 'bg-slate-100/80 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
            : isOpen
            ? 'bg-white border-[#2F9FE3] ring-3 ring-[#2F9FE3]/20 shadow-md shadow-[#2F9FE3]/5'
            : 'bg-white/90 hover:bg-white border border-slate-200/90 hover:border-slate-300 shadow-2xs text-[#0B1E33]'
        } ${triggerClassName}`}
        style={{
          boxShadow: isOpen
            ? '0 0 0 3px rgba(47, 159, 227, 0.20), inset 0 1px 1.5px rgba(255, 255, 255, 0.95)'
            : 'inset 0 1px 1.5px rgba(255, 255, 255, 0.95), 0 1px 2px rgba(11, 30, 51, 0.04)',
        }}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon && (
            <span className="shrink-0 text-slate-500">{selectedOption.icon}</span>
          )}
          {selectedOption ? (
            <span className="truncate text-[#0B1E33] font-medium">
              {selectedOption.label}
            </span>
          ) : (
            <span className="truncate text-slate-400 font-normal">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-1">
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
            size={isSmall ? 14 : 16}
            className={`text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#2F9FE3]' : ''
            }`}
          />
        </div>
      </button>

      {/* Floating Apple Liquid Glass Dropdown Popover */}
      {isOpen && (
        <ul
          ref={listboxRef}
          role="listbox"
          tabIndex={-1}
          className="absolute z-50 left-0 right-0 mt-1.5 max-h-64 overflow-y-auto rounded-2xl bg-white/95 backdrop-blur-2xl border border-slate-200/80 shadow-xl shadow-slate-900/10 p-1.5 space-y-1 focus:outline-none animate-in fade-in zoom-in-95 duration-150"
          style={{
            boxShadow:
              '0 12px 36px -4px rgba(11, 30, 51, 0.16), 0 4px 12px rgba(11, 30, 51, 0.08), inset 0 1px 1.5px rgba(255, 255, 255, 0.95)',
          }}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isHighlighted = index === highlightedIndex;

            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl cursor-pointer text-xs sm:text-sm font-semibold transition-all duration-150 select-none ${
                  isSelected
                    ? 'bg-[#2F9FE3]/12 text-[#1878B8]'
                    : isHighlighted
                    ? 'bg-slate-100/90 text-[#0B1E33]'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate min-w-0">
                  {option.icon && (
                    <span
                      className={`shrink-0 ${
                        isSelected ? 'text-[#1878B8]' : 'text-slate-400'
                      }`}
                    >
                      {option.icon}
                    </span>
                  )}
                  <div className="truncate">
                    <div className="truncate">{option.label}</div>
                    {option.description && (
                      <div className="text-[10px] text-slate-400 font-normal truncate">
                        {option.description}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {option.badge && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border ${
                        BADGE_COLOR_MAP[option.badgeColor || 'slate']
                      }`}
                    >
                      {option.badge}
                    </span>
                  )}
                  {isSelected && (
                    <Check size={14} className="text-[#1878B8] stroke-[2.5]" />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
