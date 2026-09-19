import React from 'react';
import {
  Target,
  DollarSign,
  TrendingUp,
  Zap,
  Award,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { LEAD_SOURCES_METRICS } from '@/data/reportData';

export function LeadSourcesRoiTab() {
  const SPEED_TO_LEAD_DATA = [
    { window: '< 5 Minutes', rate: 74, color: 'bg-emerald-500', note: 'Optimal closing window' },
    { window: '5 – 15 Minutes', rate: 62, color: 'bg-sky-500', note: 'Standard daytime response' },
    { window: '15 – 30 Minutes', rate: 48, color: 'bg-amber-500', note: 'Moderate lead cooling' },
    { window: '30 – 60 Minutes', rate: 36, color: 'bg-orange-500', note: 'Homeowner searching others' },
    { window: '2+ Hours / Overnight', rate: 24, color: 'bg-rose-500', note: '82% hired another contractor' },
  ];

  return (
    <div className="space-y-4 select-none">
      {/* 1. Marketing Attribution & Channel ROI Matrix Table */}
      <div className="bg-white/80 light-glass-panel rounded-3xl border border-white/90 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/70">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Channel Attribution &amp; Marketing ROI Performance
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-black uppercase">
                10.8x Blended ROI
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Cost per customer acquisition (CAC), closed contracts, and revenue generated per acquisition channel
            </p>
          </div>

          <div className="text-xs font-bold text-slate-500">
            Total Ad Spend YTD: <strong className="text-slate-900">$21,800</strong>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto no-scrollbar pt-1">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 text-[10.5px] font-black text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Acquisition Channel</th>
                <th className="py-2.5 px-3 text-right">Inbound Leads</th>
                <th className="py-2.5 px-3 text-right">Won Contracts</th>
                <th className="py-2.5 px-3 text-right">Win Rate</th>
                <th className="py-2.5 px-3 text-right">CAC ($/Deal)</th>
                <th className="py-2.5 px-3 text-right">Booked Revenue</th>
                <th className="py-2.5 px-3 text-right">ROI Multiple</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {LEAD_SOURCES_METRICS.map((s) => (
                <tr
                  key={s.source}
                  className="hover:bg-sky-50/50 transition-colors font-medium text-slate-800"
                >
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span>{s.channelName}</span>
                      {s.roiMultiple >= 12 && (
                        <span className="px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 text-[9.5px] font-black border border-emerald-200">
                          Top ROI
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">
                    {s.leadsCount}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                    {s.wonCount}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-slate-900">
                    {s.winRate}%
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-600">
                    ${s.cac}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-slate-900">
                    ${s.totalRevenue.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="px-2 py-0.5 rounded-lg bg-gradient-to-r from-[#1878B8] to-[#0284c7] text-white text-[10px] font-black shadow-2xs">
                      {s.roiMultiple === 99 ? 'Organic' : `${s.roiMultiple}x`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Speed-to-Lead Response Closing Curve */}
      <div className="bg-white/80 light-glass-panel rounded-3xl border border-white/90 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/70">
          <div>
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-amber-500 stroke-[2.5]" />
              <h4 className="font-black text-sm sm:text-base text-slate-900">
                Speed-to-Lead Closing Rate Correlation
              </h4>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Empirical data analyzing deal close rate based on time to first phone contact
            </p>
          </div>
          <span className="text-xs font-black text-emerald-700">
            Average Speed: 4.2 Min (94% under 15m SLA)
          </span>
        </div>

        <div className="space-y-3 pt-1">
          {SPEED_TO_LEAD_DATA.map((item) => (
            <div key={item.window} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span>{item.window}</span>
                  <span className="text-slate-400 font-normal">({item.note})</span>
                </div>
                <div className="font-mono font-black text-slate-900">
                  {item.rate}% Close Rate
                </div>
              </div>

              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                  style={{ width: `${item.rate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
