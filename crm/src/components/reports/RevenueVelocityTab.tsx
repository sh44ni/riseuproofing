import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Layers,
  Sparkles,
  BarChart,
  ArrowUpRight,
} from 'lucide-react';
import { MONTHLY_REVENUE_DATA, MATERIAL_REVENUE_SPLITS } from '@/data/reportData';

export function RevenueVelocityTab() {
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  const maxRevenue = Math.max(...MONTHLY_REVENUE_DATA.map((d) => d.revenue));

  return (
    <div className="space-y-4 select-none">
      {/* 1. Monthly Revenue Velocity vs Targets Chart */}
      <div className="bg-white/80 light-glass-panel rounded-3xl border border-white/90 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/70">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Monthly Booked Revenue vs Target (2026)
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black uppercase">
                112% to Plan
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Cumulative actual closed contract revenue compared against monthly sales quota
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold self-start sm:self-auto">
            <div className="flex items-center gap-1.5 text-slate-700">
              <div className="w-3 h-3 rounded-md bg-gradient-to-tr from-[#1878B8] to-[#0284c7]" />
              <span>Actual Revenue</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <div className="w-3 h-3 rounded-md bg-slate-300" />
              <span>Target Quota</span>
            </div>
          </div>
        </div>

        {/* SVG / Bar Chart Representation */}
        <div className="pt-4 pb-2">
          <div className="grid grid-cols-9 gap-2 sm:gap-3 items-end h-56 px-2">
            {MONTHLY_REVENUE_DATA.map((d, idx) => {
              const actualHeightPct = Math.round((d.revenue / maxRevenue) * 100);
              const targetHeightPct = Math.round((d.target / maxRevenue) * 100);
              const isHovered = hoveredMonth === idx;

              return (
                <div
                  key={d.month}
                  onMouseEnter={() => setHoveredMonth(idx)}
                  onMouseLeave={() => setHoveredMonth(null)}
                  className="flex flex-col items-center h-full justify-end group cursor-pointer relative"
                >
                  {/* Floating Tooltip */}
                  {isHovered && (
                    <div className="absolute -top-16 z-30 p-2 rounded-xl bg-slate-900 text-white text-[10px] shadow-xl border border-slate-700 pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                      <div className="font-black">{d.month}</div>
                      <div className="text-emerald-400 font-bold">Revenue: ${d.revenue.toLocaleString()}</div>
                      <div className="text-slate-400">Quota: ${d.target.toLocaleString()} • {d.bookedJobs} jobs</div>
                    </div>
                  )}

                  {/* Dual Bars: Actual (Front) & Target (Behind) */}
                  <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-full relative">
                    {/* Target Bar */}
                    <div
                      style={{ height: `${targetHeightPct}%` }}
                      className="w-1/2 rounded-t-lg bg-slate-200/80 transition-all group-hover:bg-slate-300"
                    />
                    {/* Actual Bar */}
                    <div
                      style={{ height: `${actualHeightPct}%` }}
                      className="w-1/2 rounded-t-lg bg-gradient-to-t from-[#1878B8] via-[#0284c7] to-[#38bdf8] transition-all group-hover:brightness-110 shadow-xs"
                    />
                  </div>

                  {/* Month Label */}
                  <div className="text-[11px] font-black text-slate-600 mt-2 font-mono">
                    {d.shortMonth}
                  </div>
                  <div className="text-[9px] font-bold text-slate-400">
                    ${Math.round(d.revenue / 1000)}k
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Material Revenue Split & Unit Economics (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left (7 Cols): Material Category Revenue Distribution */}
        <div className="lg:col-span-7 bg-white/80 light-glass-panel rounded-3xl border border-white/90 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
            <div>
              <h4 className="font-black text-sm text-slate-900">
                Revenue by Roofing System &amp; Material
              </h4>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Breakdown of YTD contract value across shingle, tile, metal, and commercial TPO
              </p>
            </div>
            <span className="text-xs font-black text-slate-800">
              2,910 SQ Total
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {MATERIAL_REVENUE_SPLITS.map((mat) => (
              <div key={mat.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: mat.color }}
                    />
                    <span>{mat.name}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-slate-500 font-medium">{mat.squaresCount} SQ</span>
                    <strong className="text-slate-900 font-black">${mat.revenue.toLocaleString()}</strong>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-700">
                      {mat.percentage}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${mat.percentage}%`,
                      backgroundColor: mat.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right (5 Cols): Unit Economics & Contract Metrics */}
        <div className="lg:col-span-5 bg-white/80 light-glass-panel rounded-3xl border border-white/90 shadow-sm p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div>
            <h4 className="font-black text-sm text-slate-900 pb-2 border-b border-slate-200/70">
              Unit Economics &amp; Pricing Velocity
            </h4>

            <div className="space-y-3 pt-3">
              <div className="p-3 rounded-2xl bg-sky-50/70 border border-sky-200/80 flex items-center justify-between">
                <div>
                  <div className="text-[10.5px] font-bold text-sky-800 uppercase tracking-wider">
                    Average Blended Rev / SQ
                  </div>
                  <div className="text-xl font-black text-slate-900 mt-0.5">
                    $540 <span className="text-xs font-semibold text-slate-500">/ Square</span>
                  </div>
                </div>
                <div className="text-right text-[10px] font-bold text-emerald-700">
                  +$35/SQ vs 2025
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
                <div>
                  <div className="text-[10.5px] font-bold text-amber-800 uppercase tracking-wider">
                    Average Ticket Size
                  </div>
                  <div className="text-xl font-black text-slate-900 mt-0.5">
                    $24,850
                  </div>
                </div>
                <div className="text-right text-[10px] font-bold text-emerald-700">
                  +8.4% Expansion
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
                <div>
                  <div className="text-[10.5px] font-bold text-emerald-800 uppercase tracking-wider">
                    Financing Adoption Rate
                  </div>
                  <div className="text-xl font-black text-slate-900 mt-0.5">
                    38.2% <span className="text-xs font-semibold text-slate-500">(120-Mo Plans)</span>
                  </div>
                </div>
                <div className="text-right text-[10px] font-bold text-emerald-700">
                  Avg $164/mo
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 flex items-center justify-between font-medium">
            <span>Gross Margins Tracked via Accu-Estimate™</span>
            <span className="text-emerald-700 font-bold">Audited Weekly</span>
          </div>
        </div>
      </div>
    </div>
  );
}
