import React from 'react';
import { DollarSign, Download, CheckCircle2, AlertCircle, Plus, FileText, CreditCard } from 'lucide-react';
import { BillingSummary } from '@/types/client360Types';

interface ClientBillingTabProps {
  billing: BillingSummary;
  onNewInvoice?: () => void;
}

export function ClientBillingTab({ billing, onNewInvoice }: ClientBillingTabProps) {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/90 p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Billed</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            ${billing.totalBilled.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Contract Total Scope</div>
        </div>

        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/90 p-5 shadow-sm">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Collected Cash</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            ${billing.collectedCash.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-700/70 mt-1">Cleared in Bank Account</div>
        </div>

        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/90 p-5 shadow-sm">
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Pending / Deposit Due</div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">
            ${billing.pendingDeposit.toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-700/70 mt-1">Awaiting Milestone Payment</div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-[#0284C7]" />
            <h3 className="font-bold text-sm text-slate-900">Invoices & Payment Records</h3>
          </div>

          <button
            onClick={onNewInvoice}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0284C7] hover:bg-[#0369a1] text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Plus size={14} />
            <span>Generate Invoice</span>
          </button>
        </div>

        {billing.invoices.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No invoices have been billed to this client yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {billing.invoices.map((inv) => (
              <div key={inv.id} className="py-3.5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs">{inv.invoiceNumber}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        inv.status === 'paid'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{inv.description} • {inv.date}</div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-slate-900">${inv.amount.toLocaleString()}</span>
                  <button className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all">
                    <Download size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
