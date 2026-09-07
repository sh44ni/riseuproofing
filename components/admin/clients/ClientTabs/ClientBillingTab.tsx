'use client';

import React from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  CreditCard,
  Building2,
  Calendar,
} from 'lucide-react';
import SourceAttributionBadge from '../../shared/SourceAttributionBadge';

interface ClientBillingTabProps {
  client: any;
  invoices: any[];
  jobs: any[];
}

export default function ClientBillingTab({ client, invoices, jobs }: ClientBillingTabProps) {
  const totalBilled = Number(client.total_billed || 0);
  const totalPaid = Number(client.total_paid || 0);
  const balanceDue = Number(client.balance_due || 0);

  function getStatusBadge(inv: any) {
    if (inv.status === 'paid') {
      return { label: 'Paid', bg: 'bg-emerald-50 text-emerald-800 border-emerald-300' };
    }
    const isPastDue = new Date(inv.due_date).getTime() < Date.now();
    if (inv.status === 'overdue' || isPastDue) {
      return { label: 'Overdue', bg: 'bg-rose-50 text-rose-800 border-rose-300' };
    }
    return { label: 'Pending', bg: 'bg-amber-50 text-amber-800 border-amber-300' };
  }

  return (
    <div className="space-y-6">
      {/* Account Origin Bar */}
      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between text-xs">
        <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Client Origin</span>
        <SourceAttributionBadge
          sourceType={client.source_type}
          sourceDetail={client.lead_source_detail}
          teamMemberName={client.acquired_by_name}
          teamMemberRole={client.acquired_by_role}
          teamMemberAvatar={client.acquired_by_avatar}
          variant="compact"
        />
      </div>

      {/* Top Financial KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="admin-card p-4 sm:p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Total Invoiced</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            ${totalBilled.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Across {invoices.length} milestone {invoices.length === 1 ? 'invoice' : 'invoices'}
          </span>
        </div>

        <div className="admin-card p-4 sm:p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <span className="text-xs font-semibold text-emerald-700 block">Collected Cash</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            ${totalPaid.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-600 mt-0.5 block">
            {totalBilled > 0 ? `${Math.round((totalPaid / totalBilled) * 100)}% collected` : 'No invoices yet'}
          </span>
        </div>

        <div className="admin-card p-4 sm:p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Outstanding Balance</span>
          <div
            className={`text-2xl font-black mt-1 ${
              balanceDue > 0 ? 'text-amber-600' : 'text-slate-800'
            }`}
          >
            ${balanceDue.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {balanceDue > 0 ? 'Pending customer payment' : 'No balance due'}
          </span>
        </div>
      </div>

      {/* Invoices List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-[#0B1E33] text-sm sm:text-base">Milestone Invoices</h3>
            <p className="text-xs text-slate-500">CSLB-compliant deposit & progress billing</p>
          </div>

          <Link
            href="/admin/finances"
            className="text-xs font-bold text-[#0284C7] hover:underline flex items-center gap-1"
          >
            <span>Finances & Payments Hub</span>
            <ExternalLink size={12} />
          </Link>
        </div>

        {invoices.length > 0 ? (
          <div className="space-y-3">
            {invoices.map(inv => {
              const badge = getStatusBadge(inv);
              const amount = Number(inv.amount || 0);

              return (
                <div
                  key={inv.id}
                  className="admin-card p-4 sm:p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-sm sm:text-base">
                          {inv.invoice_number}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-700 mt-0.5">
                        {inv.milestone_name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block font-semibold">Amount</span>
                        <span className="text-base font-black text-slate-900">
                          ${amount.toLocaleString()}
                        </span>
                      </div>

                      <Link
                        href="/admin/finances"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs transition-colors cursor-pointer"
                      >
                        <span>Receipt</span>
                        <ExternalLink size={12} />
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Due Date</span>
                      <span className="font-semibold text-slate-700">
                        {new Date(inv.due_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Paid At</span>
                      <span className="font-semibold text-slate-700">
                        {inv.paid_at ? new Date(inv.paid_at).toLocaleDateString() : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Payment Method</span>
                      <span className="font-semibold capitalize text-slate-700">
                        {inv.payment_method || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Job Ref</span>
                      <span className="font-semibold text-slate-700">
                        {inv.job_number || 'Direct'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-white border border-slate-200/80 rounded-2xl">
            <Receipt size={24} className="mx-auto text-slate-300 mb-2" />
            <p className="text-xs text-slate-500 font-semibold mb-2">No invoices generated yet.</p>
            <p className="text-xs text-slate-400">
              When a project moves to production or milestone billing is issued in Finances, invoices will appear here automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
