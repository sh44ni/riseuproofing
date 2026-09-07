'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Receipt,
  ExternalLink,
  CreditCard,
  Building2,
  Calendar,
  Check,
} from 'lucide-react';
import BottomSheet from '@/components/admin/shared/BottomSheet';
import { FinancesSkeleton } from '@/components/admin/shared/AdminSkeletons';

interface FinancialSummary {
  totalBilled: number;
  collectedCash: number;
  pendingAmount: number;
  overdueAmount: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  totalExpenses: number;
  totalProfit: number;
  realizedMarginPct: number;
}

interface Invoice {
  id: number;
  job_id: number;
  estimate_id?: number;
  invoice_number: string;
  milestone_name: string;
  amount: number | string;
  status: 'pending' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  paid_at?: string;
  payment_method?: string;
  transaction_id?: string;
  notes?: string;
  job_number?: string;
  customer_name?: string;
  customer_phone?: string;
  address?: string;
  city?: string;
  client_id?: number;
  created_at: string;
}

export default function FinancesPage() {
  const [summary, setSummary] = useState<FinancialSummary>({
    totalBilled: 0,
    collectedCash: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    paidCount: 0,
    pendingCount: 0,
    overdueCount: 0,
    totalExpenses: 0,
    totalProfit: 0,
    realizedMarginPct: 35.0,
  });

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Record Payment Modal State
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('check');
  const [transactionId, setTransactionId] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const fetchFinances = useCallback(async () => {
    try {
      const [finRes, invRes] = await Promise.all([
        fetch('/api/admin/finances'),
        fetch(`/api/admin/invoices?status=${statusFilter}`),
      ]);

      if (finRes.ok) {
        const finData = await finRes.json();
        setSummary(finData.summary);
      }

      if (invRes.ok) {
        const invData = await invRes.json();
        setInvoices(invData.invoices || []);
      }
    } catch (err) {
      console.error('Failed to load finances', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchFinances();
  }, [fetchFinances]);

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!activeInvoice) return;
    setSavingPayment(true);

    try {
      const res = await fetch('/api/admin/invoices', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeInvoice.id,
          status: 'paid',
          paymentMethod,
          transactionId,
          notes: paymentNotes,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update invoice');
      }

      setPaymentSuccess(true);
      setTimeout(() => {
        setPaymentSuccess(false);
        setActiveInvoice(null);
        setTransactionId('');
        setPaymentNotes('');
        fetchFinances();
      }, 1000);
    } catch (err) {
      console.error(err);
      alert('Error recording payment');
    } finally {
      setSavingPayment(false);
    }
  }

  // Filtered invoices by search term
  const filteredInvoices = invoices.filter(inv => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      inv.invoice_number.toLowerCase().includes(q) ||
      (inv.customer_name && inv.customer_name.toLowerCase().includes(q)) ||
      (inv.milestone_name && inv.milestone_name.toLowerCase().includes(q)) ||
      (inv.job_number && inv.job_number.toLowerCase().includes(q)) ||
      (inv.city && inv.city.toLowerCase().includes(q))
    );
  });

  if (loading && invoices.length === 0) {
    return <FinancesSkeleton />;
  }

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[#d49428]">
              <DollarSign size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#0B1E33]">
                Financials & Milestone Invoices
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                CSLB-compliant 4-stage billing, collections, and gross profit margins
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setRefreshing(true);
              fetchFinances();
            }}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-[#EAA636]' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Collected Cash */}
        <div className="p-4 rounded-[16px] bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Collected Cash</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#0B1E33] tracking-tight">
            ${summary.collectedCash.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-emerald-700 font-medium">
            {summary.paidCount} milestone payments settled
          </div>
        </div>

        {/* 2. Pending Receivables */}
        <div className="p-4 rounded-[16px] bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-amber-800 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Receivables</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-[#d49428]">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#0B1E33] tracking-tight">
            ${summary.pendingAmount.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-amber-800 font-medium">
            {summary.pendingCount} milestones in progress
          </div>
        </div>

        {/* 3. Overdue Invoices */}
        <div className="p-4 rounded-[16px] bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Overdue Invoices</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <AlertCircle size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#0B1E33] tracking-tight">
            ${summary.overdueAmount.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-rose-700 font-medium">
            {summary.overdueCount} past due milestone{summary.overdueCount !== 1 ? 's' : ''}
          </div>
        </div>

        {/* 4. Realized Gross Margin */}
        <div className="p-4 rounded-[16px] bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-sky-700 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Realized Margin</span>
            <div className="p-1.5 rounded-lg bg-sky-50 text-[#1878B8]">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#0B1E33] tracking-tight">
            {summary.realizedMarginPct}%
          </div>
          <div className="mt-1 text-xs text-sky-700 font-medium">
            ${summary.totalProfit.toLocaleString()} net profit
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 sm:p-4 rounded-[16px] bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All Invoices' },
            { id: 'pending', label: 'Pending' },
            { id: 'overdue', label: 'Overdue' },
            { id: 'paid', label: 'Paid' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-[#EAA636] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-[#0B1E33] border border-slate-200/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice, customer, city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[#0B1E33] placeholder-slate-400 text-xs focus:outline-none focus:border-[#2F9FE3] focus:bg-white focus:ring-1 focus:ring-[#2F9FE3]"
          />
        </div>
      </div>

      {/* Invoices List / Table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
          <RefreshCw size={24} className="animate-spin text-[#EAA636]" />
          <span className="text-xs font-semibold text-slate-500">Loading invoices...</span>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="py-16 text-center rounded-[16px] border border-slate-200/80 bg-white shadow-xs">
          <Receipt size={36} className="mx-auto text-slate-400 mb-3" />
          <h3 className="text-sm font-bold text-[#0B1E33] mb-1">No Invoices Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search
              ? 'No invoices match your current search query.'
              : 'Generate milestone invoices directly from any active roofing job.'}
          </p>
          <div className="mt-4">
            <Link
              href="/admin/jobs"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#1878B8] text-xs font-bold border border-slate-200"
            >
              Go to Jobs Pipeline
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-hidden rounded-[16px] border border-slate-200/80 bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Milestone</th>
                  <th className="py-3 px-4">Customer & Project</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {filteredInvoices.map(inv => {
                  const isPaid = inv.status === 'paid';
                  const isOverdue =
                    inv.status === 'overdue' ||
                    (inv.status === 'pending' && new Date(inv.due_date) < new Date());

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#1878B8]">
                        {inv.invoice_number}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#0B1E33]">{inv.milestone_name}</div>
                        {inv.payment_method && (
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                            via {inv.payment_method}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {inv.client_id ? (
                          <Link
                            href={`/admin/clients/${inv.client_id}`}
                            className="font-bold text-[#0B1E33] hover:text-[#0284C7] transition-colors underline-offset-2 hover:underline"
                          >
                            {inv.customer_name || 'Homeowner'}
                          </Link>
                        ) : (
                          <div className="font-bold text-[#0B1E33]">
                            {inv.customer_name || 'Homeowner'}
                          </div>
                        )}
                        <div className="text-[11px] text-slate-500">
                          {inv.city ? `${inv.city}, CA` : 'San Diego County'}
                          {inv.job_number && ` • ${inv.job_number}`}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-[#0B1E33] text-sm">
                        ${Number(inv.amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{inv.due_date}</span>
                        </div>
                        {isOverdue && !isPaid && (
                          <span className="text-[10px] font-bold text-rose-600">Past Due</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : isOverdue
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isPaid && (
                            <button
                              type="button"
                              onClick={() => setActiveInvoice(inv)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer"
                            >
                              Record Payment
                            </button>
                          )}
                          {inv.job_id && (
                            <Link
                              href={`/admin/jobs/${inv.job_id}`}
                              className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-[#0B1E33] border border-slate-200 transition-colors"
                              title="View Job"
                            >
                              <ExternalLink size={14} />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden space-y-3">
            {filteredInvoices.map(inv => {
              const isPaid = inv.status === 'paid';
              const isOverdue =
                inv.status === 'overdue' ||
                (inv.status === 'pending' && new Date(inv.due_date) < new Date());

              return (
                <div
                  key={inv.id}
                  className="p-4 rounded-[16px] bg-white border border-slate-200/80 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[11px] font-mono font-bold text-[#1878B8]">
                        {inv.invoice_number}
                      </div>
                      <div className="text-sm font-bold text-[#0B1E33] mt-0.5">
                        {inv.milestone_name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {inv.client_id ? (
                          <Link
                            href={`/admin/clients/${inv.client_id}`}
                            className="font-semibold text-[#0B1E33] hover:text-[#0284C7] underline-offset-2 hover:underline"
                          >
                            {inv.customer_name}
                          </Link>
                        ) : (
                          <span>{inv.customer_name}</span>
                        )}
                        {' • '}{inv.city || 'San Diego'}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        isPaid
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : isOverdue
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Pending'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400">Amount Due</div>
                      <div className="text-base font-black text-[#0B1E33]">
                        ${Number(inv.amount).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">Due Date</div>
                      <div className="text-xs font-semibold text-slate-600">{inv.due_date}</div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-2">
                    {inv.job_id && (
                      <Link
                        href={`/admin/jobs/${inv.job_id}`}
                        className="text-xs text-[#1878B8] hover:underline flex items-center gap-1 font-semibold"
                      >
                        View Job Details <ExternalLink size={12} />
                      </Link>
                    )}

                    {!isPaid && (
                      <button
                        type="button"
                        onClick={() => setActiveInvoice(inv)}
                        className="ml-auto px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all cursor-pointer"
                      >
                        Record Payment
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Record Payment BottomSheet / Modal */}
      {activeInvoice && (
        <BottomSheet
          isOpen={Boolean(activeInvoice)}
          onClose={() => setActiveInvoice(null)}
          title="Record Milestone Payment"
          subtitle={`${activeInvoice.milestone_name} (${activeInvoice.invoice_number})`}
        >
          <form onSubmit={handleRecordPayment} className="space-y-4">
            {paymentSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                <Check size={16} />
                Payment recorded and added to timeline!
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500">Invoice Amount:</span>
                <div className="text-lg font-black text-emerald-700">
                  ${Number(activeInvoice.amount).toLocaleString()}
                </div>
              </div>
              <div className="text-right text-xs text-slate-600">
                <div className="font-semibold text-[#0B1E33]">{activeInvoice.customer_name}</div>
                <div className="text-slate-500">{activeInvoice.city || 'CA'}</div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'check', label: 'Check' },
                  { id: 'credit_card', label: 'Credit Card' },
                  { id: 'ach', label: 'ACH / Wire' },
                  { id: 'financing', label: 'Financing' },
                  { id: 'cash', label: 'Cash' },
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      paymentMethod === m.id
                        ? 'bg-[#EAA636] text-white border-[#EAA636]'
                        : 'border-slate-200/80 text-slate-700 hover:text-[#0B1E33] bg-slate-50'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Transaction ID / Check Number
              </label>
              <input
                type="text"
                placeholder="e.g. Check #1042 or Auth #98234"
                value={transactionId}
                onChange={e => setTransactionId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200/80 text-[#0B1E33] placeholder-slate-400 text-xs focus:outline-none focus:border-[#2F9FE3] focus:ring-1 focus:ring-[#2F9FE3]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
              <textarea
                rows={2}
                placeholder="e.g. Handed check to crew lead at morning delivery..."
                value={paymentNotes}
                onChange={e => setPaymentNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200/80 text-[#0B1E33] placeholder-slate-400 text-xs focus:outline-none focus:border-[#2F9FE3] focus:ring-1 focus:ring-[#2F9FE3] resize-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingPayment}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-sm hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {savingPayment ? 'Recording...' : 'Confirm & Settle Payment'}
              </button>
            </div>
          </form>
        </BottomSheet>
      )}
    </div>
  );
}
