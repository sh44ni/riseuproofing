import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Award,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { EXECUTIVE_INSIGHTS } from '@/data/reportData';

export function ExecutiveInsightsBar() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-3xl bg-gradient-to-r from-sky-50/90 via-white/95 to-amber-50/90 light-glass-panel border border-white/95 shadow-sm p-4 sm:p-5 select-none space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1878B8] to-[#0284c7] text-white flex items-center justify-center shadow-xs shrink-0">
            <Sparkles size={18} className="stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-slate-900 tracking-tight">
                AI Executive Intelligence &amp; Profit Recommendations
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9.5px] font-black uppercase">
                3 Key Opportunities
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Automated algorithmic analysis of pricing margins, territory economics, and response SLAs
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs border border-slate-200 shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <span>{isExpanded ? 'Hide Details' : 'Review Insights'}</span>
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-200/60 animate-in fade-in slide-in-from-top-1 duration-200">
          {EXECUTIVE_INSIGHTS.map((ins) => (
            <div
              key={ins.id}
              className="p-3.5 rounded-2xl bg-white/90 border border-slate-200/80 shadow-2xs space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {ins.category}
                </span>
                <span className="text-[10.5px] font-bold text-emerald-700 font-mono">
                  {ins.impact}
                </span>
              </div>
              <h5 className="font-black text-xs text-slate-900 leading-snug">
                {ins.title}
              </h5>
              <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                {ins.recommendation}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
