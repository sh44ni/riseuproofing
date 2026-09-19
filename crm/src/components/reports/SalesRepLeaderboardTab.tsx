import React from 'react';
import {
  Trophy,
  Award,
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle2,
} from 'lucide-react';
import { SALES_REPS_METRICS } from '@/data/reportData';

export function SalesRepLeaderboardTab() {
  return (
    <div className="space-y-4 select-none">
      {/* 1. Top Producers Podium Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {SALES_REPS_METRICS.map((rep, idx) => (
          <div
            key={rep.repId}
            className={`p-4 rounded-3xl border transition-all flex flex-col justify-between space-y-3 relative group ${
              idx === 0
                ? 'bg-gradient-to-b from-amber-50/70 to-white/90 border-amber-300 shadow-md ring-2 ring-amber-400/20'
                : 'bg-white/80 light-glass-panel border-white/90 shadow-2xs hover:border-sky-300'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${rep.avatarColor} text-white font-black text-xs flex items-center justify-center shadow-xs`}
                  >
                    {rep.initials}
                  </div>
                  <div>
                    <h4 className="font-black text-xs text-slate-900 leading-tight">
                      {rep.name}
                    </h4>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {rep.role}
                    </span>
                  </div>
                </div>

                {rep.badge && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[9.5px] font-black shadow-2xs">
                    {rep.badge}
                  </span>
                )}
              </div>

              {/* Metrics */}
              <div className="space-y-2 pt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Closed Volume</span>
                  <strong className="text-slate-900 font-black font-mono">
                    ${rep.closedAmount.toLocaleString()}
                  </strong>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Closing Win Rate</span>
                  <span className="font-black text-emerald-700 font-mono">
                    {rep.winRate}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Deals Won</span>
                  <span className="font-bold text-slate-700 font-mono">
                    {rep.wonJobs} contracts
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Avg Deal Size</span>
                  <span className="font-bold text-slate-700 font-mono">
                    ${rep.avgTicket.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Commission Earned Bar */}
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-medium">Commission YTD</span>
              <strong className="text-[#0284c7] font-black font-mono">
                ${rep.commissionEarned.toLocaleString()}
              </strong>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Detailed Performance Table */}
      <div className="bg-white/80 light-glass-panel rounded-3xl border border-white/90 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Estimator Quota &amp; Pipeline Conversion Breakdown
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Comparison of total dollar volume quoted against signed contracts and commissions
            </p>
          </div>
          <span className="text-xs font-black text-slate-700">
            4 Active Reps
          </span>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 text-[10.5px] font-black text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Estimator</th>
                <th className="py-2.5 px-3 text-right">Quoted Volume</th>
                <th className="py-2.5 px-3 text-right">Closed Volume</th>
                <th className="py-2.5 px-3 text-right">Win Rate</th>
                <th className="py-2.5 px-3 text-right">Avg Ticket</th>
                <th className="py-2.5 px-3 text-right">Commission Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {SALES_REPS_METRICS.map((rep) => (
                <tr
                  key={rep.repId}
                  className="hover:bg-sky-50/50 transition-colors font-medium text-slate-800"
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{rep.name}</span>
                      <span className="text-[10px] text-slate-400">({rep.role})</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-500">
                    ${rep.quotedAmount.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-slate-900">
                    ${rep.closedAmount.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-emerald-700">
                    {rep.winRate}%
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">
                    ${rep.avgTicket.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-[#1878B8]">
                    ${rep.commissionEarned.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
