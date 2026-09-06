'use client';

import React from 'react';
import { Check, Circle } from 'lucide-react';

export interface Stage {
  id: string;
  label: string;
  color?: string;
}

interface LifecycleStageStepperProps {
  stages: Stage[];
  currentStage: string;
  onChange: (stageId: string) => void;
  className?: string;
}

export default function LifecycleStageStepper({
  stages,
  currentStage,
  onChange,
  className = '',
}: LifecycleStageStepperProps) {
  const currentIndex = stages.findIndex(s => s.id === currentStage);
  const activeIdx = currentIndex >= 0 ? currentIndex : 0;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Mobile & Tablet: Horizontal Smooth-Scroll Tactile Pill Rail */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none snap-x snap-mandatory">
        {stages.map((stage, idx) => {
          const isActive = stage.id === currentStage;
          const isPassed = idx < activeIdx;

          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => onChange(stage.id)}
              className={`shrink-0 snap-center flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-bold transition-all duration-200 apple-spring-press cursor-pointer ${
                isActive
                  ? 'admin-btn-gold text-white shadow-md shadow-amber-500/20 ring-2 ring-amber-400/40'
                  : isPassed
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100/60'
                  : 'bg-white/80 hover:bg-white text-slate-600 hover:text-[#0B1E33] border border-slate-200/80 shadow-2xs'
              }`}
              style={
                isActive
                  ? {
                      boxShadow:
                        '0 4px 14px rgba(234, 166, 54, 0.35), inset 0 1px 1.5px rgba(255, 255, 255, 0.45)',
                    }
                  : {
                      boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.8)',
                    }
              }
            >
              {isPassed ? (
                <Check size={12} className="text-emerald-700 stroke-[3]" />
              ) : (
                <span
                  className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-black ${
                    isActive
                      ? 'bg-white/30 text-white'
                      : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {idx + 1}
                </span>
              )}
              <span className="whitespace-nowrap">{stage.label}</span>
            </button>
          );
        })}
      </div>

      {/* Desktop: Apple Liquid Glass Connected Pipeline Stepper */}
      <div className="hidden lg:grid grid-cols-7 gap-2">
        {stages.map((stage, idx) => {
          const isActive = stage.id === currentStage;
          const isPassed = idx < activeIdx;

          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => onChange(stage.id)}
              className={`group relative flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all duration-200 apple-spring-press cursor-pointer select-none ${
                isActive
                  ? 'admin-btn-gold text-white border-amber-400/80 shadow-lg shadow-amber-500/20'
                  : isPassed
                  ? 'bg-emerald-50/70 text-emerald-900 border-emerald-200/90 hover:bg-emerald-100/80'
                  : 'bg-white/80 hover:bg-white text-slate-600 hover:text-[#0B1E33] border-slate-200/80 hover:border-slate-300 shadow-2xs'
              }`}
              style={
                isActive
                  ? {
                      boxShadow:
                        '0 6px 20px -2px rgba(234, 166, 54, 0.38), inset 0 1px 1.5px rgba(255, 255, 255, 0.5)',
                    }
                  : {
                      boxShadow:
                        'inset 0 1px 1.5px rgba(255, 255, 255, 0.95), 0 1px 2px rgba(11, 30, 51, 0.03)',
                    }
              }
            >
              {/* Step indicator */}
              <div className="flex items-center gap-1.5 mb-1">
                {isPassed ? (
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <Check size={11} className="stroke-[3]" />
                  </span>
                ) : (
                  <span
                    className={`w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-white/30 text-white'
                        : 'bg-slate-200/80 text-slate-600 group-hover:bg-[#2F9FE3]/20 group-hover:text-[#1878B8]'
                    }`}
                  >
                    {idx + 1}
                  </span>
                )}
              </div>

              {/* Label */}
              <span className="text-[11px] font-bold leading-snug line-clamp-2">
                {stage.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
