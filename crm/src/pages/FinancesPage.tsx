import React, { useState } from 'react';
import { DollarSign, ArrowDownRight, ArrowUpRight, FileCheck, CheckCircle2, Clock } from 'lucide-react';
import { DevelopmentInProgressBanner } from '@/components/common/DevelopmentInProgressBanner';
import { CrmPageHero } from '@/components/common/CrmPageHero';
import { UniversalStatCard } from '@/components/common/UniversalStatCard';

export function FinancesPage() {
  const [search, setSearch] = useState('');
  const INVOICES = [
    { id: 'INV-309', client: 'Patricia Gomez', amount: 15500, type: '50% Initial Deposit', status: 'Paid', date: 'Mar 12, 2026' },
    { id: 'INV-308', client: 'Carlos Morales', amount: 9800, type: 'Progress Milestone', status: 'Pending', date: 'Mar 13, 2026' },
    { id: 'INV-307', client: 'Gregory Stone', amount: 19500, type: 'Final Completion', status: 'Paid', date: 'Mar 08, 2026' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none pb-16">
      <CrmPageHero
        pageId="finances"
        defaultEyebrow="Accounting & Capital Control"
        defaultTitle="Finances & Invoicing"
        defaultSubtitle="Deposits, progress billing, accounts receivable, and job margin profitability across Oceanside jobs"
        searchValue={search}
        onSearchChange={setSearch}
        onSearchClear={() => setSearch('')}
        searchPlaceholder="Search invoices, progress draws, clients..."
        bottomRightBadges={
          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>MTD Revenue: $112,400</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200 shadow-2xs">
              <span>Avg Margin: 41.8%</span>
            </span>
          </div>
        }
      />

      <DevelopmentInProgressBanner
        moduleName="Finances, Progress Draws & Material Invoicing"
        expectedVersion="v3.2 Accounting Sprint"
        description="This financial module is currently undergoing active engineering. Stripe ACH payments, QuickBooks general ledger sync, and supplier PO tracking are arriving shortly."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <UniversalStatCard
          label="Total Revenue (MTD)"
          value="$112,400"
          delta={14.8}
          deltaLabel="+14.8% MTD"
          icon={DollarSign}
          iconGradient="from-emerald-600 to-teal-400"
          color="#10b981"
          hoverBorderColor="hover:border-emerald-400"
          blurColor="bg-emerald-400/15 group-hover:bg-emerald-400/25"
          footnoteLeft="Across 8 completed roofs"
          footnoteRight="Deposits Cleared"
          sharePct={82}
          shareLabel="Monthly target"
          stageLabel="Collections"
          miniSvgPath="M 2 24 Q 18 18, 36 14 T 54 8 T 73 2"
        />

        <UniversalStatCard
          label="Outstanding Receivables"
          value="$24,600"
          delta={-8.2}
          deltaLabel="2 Invoices"
          icon={Clock}
          iconGradient="from-amber-600 to-amber-400"
          color="#f59e0b"
          hoverBorderColor="hover:border-amber-400"
          blurColor="bg-amber-400/15 group-hover:bg-amber-400/25"
          footnoteLeft="2 invoices awaiting payment"
          footnoteRight="Net 15 Days"
          sharePct={18}
          shareLabel="Receivables share"
          stageLabel="Pending Draw"
          miniSvgPath="M 2 18 Q 18 12, 36 14 T 73 8"
        />

        <UniversalStatCard
          label="Average Gross Margin"
          value="41.8%"
          delta={3.8}
          deltaLabel="Above Target"
          icon={FileCheck}
          iconGradient="from-[#1878B8] to-[#55C4F5]"
          color="#0284c7"
          hoverBorderColor="hover:border-sky-400"
          blurColor="bg-sky-400/15 group-hover:bg-sky-400/25"
          footnoteLeft="Above target 38% threshold"
          footnoteRight="Materials & Labor"
          sharePct={42}
          shareLabel="Blended margin"
          stageLabel="Job Profitability"
          miniSvgPath="M 2 22 Q 18 16, 36 12 T 56 6 T 73 2"
        />
      </div>

      <div className="bg-[#0B1E33] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-semibold">
            <tr>
              <th className="px-6 py-3.5">Invoice #</th>
              <th className="px-6 py-3.5">Client</th>
              <th className="px-6 py-3.5">Payment Stage</th>
              <th className="px-6 py-3.5">Amount</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {INVOICES.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4 font-bold text-[#2F9FE3]">{inv.id}</td>
                <td className="px-6 py-4 font-semibold text-white">{inv.client}</td>
                <td className="px-6 py-4 text-slate-300">{inv.type}</td>
                <td className="px-6 py-4 font-bold text-white text-sm">
                  ${inv.amount.toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      inv.status === 'Paid'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-amber-500/15 text-amber-400'
                    }`}
                  >
                    {inv.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-slate-400 text-[11px]">{inv.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
