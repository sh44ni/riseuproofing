'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Clock,
  DollarSign,
  CheckCircle2,
  TrendingUp,
  ExternalLink,
  Filter,
  Eye,
  RefreshCw,
  Home,
  User,
} from 'lucide-react';
import { EstimatesSkeleton } from '@/components/admin/shared/AdminSkeletons';

interface Estimate {
  id: number;
  estimate_number: string;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  customer_city?: string;
  service_type: string;
  material_type: string;
  roof_squares: number;
  total: number;
  monthly_payment?: number;
  status: string;
  sent_at?: string;
  viewed_at?: string;
  accepted_at?: string;
  created_at: string;
  lead_id?: number;
  client_id?: number;
}

interface Summary {
  totalCount: number;
  pipelineValue: number;
  acceptedCount: number;
  acceptedValue: number;
}

const STATUS_FILTERS = ['all', 'draft', 'sent', 'viewed', 'accepted', 'declined'];

const STATUS_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  draft: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  sent: { bg: 'bg-sky-50', text: 'text-[#1878B8]', border: 'border-sky-200' },
  viewed: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  accepted: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  declined: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  expired: { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200' },
};

export default function EstimatesPage() {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalCount: 0,
    pipelineValue: 0,
    acceptedCount: 0,
    acceptedValue: 0,
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadEstimates = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/estimates?${params}`);
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      setEstimates(data.estimates ?? []);
      setSummary(data.summary ?? { totalCount: 0, pipelineValue: 0, acceptedCount: 0, acceptedValue: 0 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, router]);

  useEffect(() => {
    loadEstimates();
  }, [loadEstimates]);

  if (loading && estimates.length === 0) {
    return <EstimatesSkeleton />;
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B1E33] flex items-center gap-2">
            <FileText size={24} className="text-[#EAA636]" />
            <span>Estimates & Proposals</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Create itemized roofing proposals with digital signatures & 0% APR financing
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadEstimates(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-all duration-300 ease-out cursor-pointer disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin text-[#EAA636]' : ''} />
          </button>

          <Link
            href="/admin/estimates/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#EAA636] to-[#d49428] hover:from-[#f3b344] hover:to-[#d49428] text-white font-bold rounded-xl text-xs sm:text-sm transition-all duration-300 ease-out shadow-sm cursor-pointer active:scale-95"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>New Estimate</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/80 shadow-xs rounded-[16px] p-4">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Proposals</p>
          <p className="text-2xl font-extrabold text-[#0B1E33] mt-1 tabular-nums">
            {summary.totalCount}
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 shadow-xs rounded-[16px] p-4">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Pipeline Value</p>
          <p className="text-2xl font-extrabold text-[#EAA636] mt-1 tabular-nums">
            ${Math.round(summary.pipelineValue).toLocaleString()}
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 shadow-xs rounded-[16px] p-4">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Accepted Deals</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1 tabular-nums">
            {summary.acceptedCount}
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 shadow-xs rounded-[16px] p-4">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Signed Contract Value</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1 tabular-nums">
            ${Math.round(summary.acceptedValue).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none bg-white p-3 rounded-[16px] border border-slate-200/80 shadow-xs">
        <Filter size={14} className="text-slate-400 ml-1 mr-1 flex-shrink-0" />
        {STATUS_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all duration-300 ease-out cursor-pointer ${
              statusFilter === f
                ? 'bg-[#EAA636] text-white shadow-xs'
                : 'text-slate-600 border border-slate-200/80 hover:border-slate-300 hover:text-[#0B1E33] bg-slate-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Estimates List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-10 h-10 border-3 border-[#2F9FE3] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading estimates...</p>
        </div>
      ) : estimates.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-[20px] border border-slate-200/80 shadow-xs space-y-3">
          <FileText size={32} className="mx-auto text-slate-400" />
          <h3 className="text-lg font-bold text-[#0B1E33]">No estimates found</h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto">
            Build your first roofing quote using the 4-step calculator wizard.
          </p>
          <Link
            href="/admin/estimates/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#EAA636] to-[#d49428] hover:from-[#f3b344] hover:to-[#d49428] text-white font-bold text-xs rounded-xl shadow-sm transition-all duration-300 ease-out"
          >
            <Plus size={14} /> Create Estimate
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {estimates.map(est => {
              const badge = STATUS_BADGES[est.status] || STATUS_BADGES.draft;

              return (
                <div
                  key={est.id}
                  className="bg-white border border-slate-200/80 rounded-[16px] p-4 space-y-3 shadow-xs hover:border-slate-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold text-[#1878B8] uppercase tracking-wider font-mono">
                        {est.estimate_number}
                      </span>
                      {est.client_id ? (
                        <Link href={`/admin/clients/${est.client_id}`} className="text-[#0B1E33] font-bold text-base mt-0.5 hover:text-[#1878B8] transition-colors block">
                          {est.customer_name}
                        </Link>
                      ) : (
                        <h3 className="text-[#0B1E33] font-bold text-base mt-0.5">{est.customer_name}</h3>
                      )}
                      <p className="text-xs text-slate-500">
                        {est.customer_address ? `${est.customer_address}${est.customer_city ? `, ${est.customer_city}` : ''}` : 'No address'}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border} capitalize`}
                    >
                      {est.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-y border-slate-100 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <Home size={12} className="text-slate-400" />
                      {est.roof_squares} Squares
                    </span>
                    <span className="truncate max-w-[140px] text-slate-500">{est.material_type}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <p className="text-lg font-black text-[#0B1E33] tabular-nums">
                        ${Number(est.total).toLocaleString()}
                      </p>
                      {est.monthly_payment && (
                        <p className="text-[11px] text-[#1878B8] font-medium">
                          as low as ${est.monthly_payment}/mo
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/estimates/${est.id}`}
                        className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#1878B8] font-semibold text-xs border border-sky-200 transition-all duration-300 ease-out"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-card-blue transition-all">
            <table className="w-full text-sm min-w-[850px]">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/90 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  {['Estimate #', 'Customer', 'Specs', 'Material', 'Contract Total', 'Financing', 'Status', 'Actions'].map((h, i) => (
                    <th
                      key={h}
                      className={`text-left px-4 py-3 text-slate-500 font-bold text-[11px] uppercase tracking-wider whitespace-nowrap ${
                        i === 0
                          ? 'sticky left-0 bg-slate-50/95 backdrop-blur-xs z-20 shadow-[2px_0_6px_-2px_rgba(11,30,51,0.06)]'
                          : ''
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {estimates.map(est => {
                  const badge = STATUS_BADGES[est.status] || STATUS_BADGES.draft;

                  return (
                    <tr key={est.id} className="hover:bg-sky-50/40 transition-colors group">
                      <td className="px-4 py-3 font-mono font-bold text-[#1878B8] text-xs sticky left-0 bg-white group-hover:bg-slate-50/90 z-10 transition-colors shadow-[2px_0_6px_-2px_rgba(11,30,51,0.06)]">
                        {est.estimate_number}
                      </td>
                      <td className="px-4 py-3">
                        {est.client_id ? (
                          <Link href={`/admin/clients/${est.client_id}`} className="text-[#0B1E33] font-semibold hover:text-[#1878B8] transition-all duration-300 ease-out">
                            {est.customer_name}
                          </Link>
                        ) : (
                          <Link href={`/admin/estimates/${est.id}`} className="text-[#0B1E33] font-semibold hover:text-[#1878B8] transition-all duration-300 ease-out">
                            {est.customer_name}
                          </Link>
                        )}
                        {est.customer_city && (
                          <p className="text-slate-400 text-xs">{est.customer_city}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {est.roof_squares} sq ({Number(est.roof_squares) * 100} sq ft)
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs truncate max-w-[160px]">
                        {est.material_type}
                      </td>
                      <td className="px-4 py-3 font-bold text-[#0B1E33] tabular-nums">
                        ${Number(est.total).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs font-semibold tabular-nums">
                        {est.monthly_payment ? `$${est.monthly_payment}/mo` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${badge.bg} ${badge.text} ${badge.border} capitalize`}
                        >
                          {est.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/estimates/${est.id}`}
                          className="px-3 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#1878B8] text-xs font-semibold border border-sky-200 transition-all duration-300 ease-out"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
