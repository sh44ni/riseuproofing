'use client';

import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface DurationStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  unit?: string;
  label?: string;
  className?: string;
}

export default function DurationStepper({
  value,
  onChange,
  min = 1,
  max = 60,
  unit = 'Days',
  label,
  className = '',
}: DurationStepperProps) {
  function handleDecrement() {
    if (value > min) {
      onChange(value - 1);
    }
  }

  function handleIncrement() {
    if (value < max) {
      onChange(value + 1);
    }
  }

  const singularUnit = unit.endsWith('s') ? unit.slice(0, -1) : unit;
  const displayUnit = value === 1 ? singularUnit : unit;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-slate-500 mb-1 tracking-wide">
          {label}
        </label>
      )}

      <div
        className="flex items-center justify-between min-h-[44px] p-1 rounded-xl bg-white/90 border border-slate-200/90 shadow-2xs"
        style={{
          boxShadow:
            'inset 0 1px 1.5px rgba(255, 255, 255, 0.95), 0 1px 2px rgba(11, 30, 51, 0.04)',
        }}
      >
        {/* Decrement Button */}
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          aria-label="Decrease duration"
          className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 hover:text-[#0B1E33] bg-slate-100/80 hover:bg-slate-200/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all apple-spring-press cursor-pointer shrink-0"
        >
          <Minus size={14} className="stroke-[2.5]" />
        </button>

        {/* Center Pill Display */}
        <div className="flex-1 text-center font-black text-sm text-[#0B1E33] tabular-nums px-2">
          {value} <span className="text-xs font-semibold text-slate-500">{displayUnit}</span>
        </div>

        {/* Increment Button */}
        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          aria-label="Increase duration"
          className="w-9 h-9 rounded-lg flex items-center justify-center text-white bg-[#2F9FE3] hover:bg-[#1878B8] disabled:opacity-30 disabled:cursor-not-allowed transition-all apple-spring-press shadow-xs cursor-pointer shrink-0"
          style={{
            boxShadow: '0 2px 8px rgba(47, 159, 227, 0.3)',
          }}
        >
          <Plus size={14} className="stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}
