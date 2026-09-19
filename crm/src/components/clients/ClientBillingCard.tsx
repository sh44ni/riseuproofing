import React from 'react';
import { DollarSign, CheckCircle2, AlertCircle, ExternalLink, ChevronRight } from 'lucide-react';
import { BillingSummary } from '@/types/client360Types';

interface ClientBillingCardProps {
  billing: BillingSummary;
  onViewAll?: () => void;
  onOpenHub?: () => void;
}

export function ClientBillingCard({ billing, onViewAll, onOpenHub }: ClientBillingCardProps) {
  return (
    <div className="light-glass-card rounded-2xl p-5 flex flex-col justify-between">
      <div>
        {/* Header matching mockup */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
              $
            </div>
            <h3 className="font-bold text-sm text-slate-900 tracking-tight">Billing & Cash Flow</h3>
          </div>

          <button
            onClick={onViewAll}
            className="text-xs font-semibold text-[#0284C7] hover:text-[#0369a1] transition-colors flex items-center gap-0.5"
          >
            <span>View All</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* 2 KPI Stat Boxes (Exact Mockup Layout) */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Total Billed</div>
            <div className="text-xl font-extrabold text-slate-900 mt-1">
              ${billing.totalBilled.toLocaleString()}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100/80">
            <div className="text-[11px] font-medium text-emerald-700 uppercase tracking-wide">Collected Cash</div>
            <div className="text-xl font-extrabold text-emerald-600 mt-1">
              ${billing.collectedCash.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Payment Health Status Banner (Exact Mockup) */}
        <div className="mt-4">
          {billing.paymentHealthStatus === 'current_and_paid' && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-xs font-semibold text-emerald-800">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{billing.paymentHealthMessage || 'All invoices current & paid in full'}</span>
            </div>
          )}

          {billing.paymentHealthStatus === 'deposit_pending' && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800">
              <AlertCircle size={16} className="text-amber-600 shrink-0" />
              <span>{billing.paymentHealthMessage || `$${billing.pendingDeposit.toLocaleString()} Deposit Invoice Due`}</span>
            </div>
          )}

          {billing.paymentHealthStatus === 'no_billing_archived' && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-100/90 border border-slate-200 text-xs font-semibold text-slate-700">
              <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
              <span>{billing.paymentHealthMessage || 'No active billings • Deal archived'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer matching mockup */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span>Invoices on file: {billing.invoicesOnFileCount || billing.invoices?.length || 0}</span>
        <button
          onClick={onOpenHub}
          className="text-[#0284C7] hover:underline font-semibold flex items-center gap-1"
        >
          <span>Open Invoices Hub</span>
          <ExternalLink size={12} />
        </button>
      </div>
    </div>
  );
}
