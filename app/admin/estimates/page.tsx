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
}

interface Summary {
  totalCount: number;
  pipelineValue: number;
  acceptedCount: number;
  acceptedValue: number;
}

const STATUS_FILTERS = ['all', 'draft', 'sent', 'viewed', 'accepted', 'declined'];

const STATUS_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  draft: { bg: 'bg-slate-500/20', text: 'text-[#a0aab8]', border: 'border-slate-500/30' },
  sent: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  viewed: { bg: 'bg-[#d4a447]/15', text: 'text-[#d4a447]', border: 'border-[#d4a447]/25' },
  accepted: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  declined: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  expired: { bg: 'bg-slate-600/20', text: 'text-[#8a95a5]', border: 'border-slate-600/30' },
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
          <h1 className="text-2xl font-extrabold text-[#f0f2f5] flex items-center gap-2">
            <FileText size={24} className="text-[#d4a447]" />
            <span>Estimates & Proposals</span>
          </h1>
          <p className="text-[#8a95a5] text-xs sm:text-sm mt-0.5">
            Create itemized roofing proposals with digital signatures & 0% APR financing
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadEstimates(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] text-[#a0aab8] transition-all duration-300 ease-out cursor-pointer disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin text-[#d4a447]' : ''} />
          </button>

          <Link
            href="/admin/estimates/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#d4a447] to-[#c4923a] hover:from-[#e8c06a] hover:to-[#c4923a] text-[#0c1117] font-bold rounded-xl text-xs sm:text-sm transition-all duration-300 ease-out shadow-[0_2px_12px_rgba(0,0,0,0.2)] cursor-pointer active:scale-95"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>New Estimate</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="admin-card rounded-[16px] p-4">
          <p className="text-[11px] font-semibold text-[#8a95a5] uppercase tracking-wider">Total Proposals</p>
          <p className="text-2xl font-extrabold text-[#f0f2f5] mt-1 tabular-nums">
            {summary.totalCount}
          </p>
        </div>

        <div className="admin-card rounded-[16px] p-4">
          <p className="text-[11px] font-semibold text-[#8a95a5] uppercase tracking-wider">Total Pipeline Value</p>
          <p className="text-2xl font-extrabold text-[#d4a447] mt-1 tabular-nums">
            ${Math.round(summary.pipelineValue).toLocaleString()}
          </p>
        </div>

        <div className="admin-card rounded-[16px] p-4">
          <p className="text-[11px] font-semibold text-[#8a95a5] uppercase tracking-wider">Accepted Deals</p>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1 tabular-nums">
            {summary.acceptedCount}
          </p>
        </div>

        <div className="admin-card rounded-[16px] p-4">
          <p className="text-[11px] font-semibold text-[#8a95a5] uppercase tracking-wider">Signed Contract Value</p>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1 tabular-nums">
            ${Math.round(summary.acceptedValue).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none bg-[#141b24] p-3 rounded-[16px] border border-white/[0.06]">
        <Filter size={14} className="text-[#5e6a7a] ml-1 mr-1 flex-shrink-0" />
        {STATUS_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all duration-300 ease-out cursor-pointer ${
              statusFilter === f
                ? 'bg-[#d4a447]/15 text-[#d4a447] border border-[#d4a447]/30 shadow-inner'
                : 'text-[#8a95a5] border border-white/[0.06] hover:border-white/[0.12] hover:text-[#f0f2f5]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Estimates List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-10 h-10 border-3 border-[#d4a447] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#8a95a5] text-sm">Loading estimates...</p>
        </div>
      ) : estimates.length === 0 ? (
        <div className="text-center py-16 px-4 bg-[#141b24]/40 rounded-[20px] border border-white/[0.04] space-y-3">
          <FileText size={32} className="mx-auto text-slate-600" />
          <h3 className="text-lg font-bold text-[#f0f2f5]">No estimates found</h3>
          <p className="text-[#8a95a5] text-xs max-w-sm mx-auto">
            Build your first roofing quote using the 4-step calculator wizard.
          </p>
          <Link
            href="/admin/estimates/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#d4a447] text-[#0c1117] font-bold text-xs rounded-xl hover:bg-[#d4a447] transition-all duration-300 ease-out"
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
                  className="admin-card rounded-[16px] p-4 space-y-3 shadow-[0_1px_4px_rgba(0,0,0,0.15)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold text-[#d4a447] uppercase tracking-wider font-mono">
                        {est.estimate_number}
                      </span>
                      <h3 className="text-[#f0f2f5] font-bold text-base mt-0.5">{est.customer_name}</h3>
                      <p className="text-xs text-[#8a95a5]">
                        {est.customer_address ? `${est.customer_address}${est.customer_city ? `, ${est.customer_city}` : ''}` : 'No address'}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border} capitalize`}
                    >
                      {est.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-y border-white/[0.04] text-xs text-[#a0aab8]">
                    <span className="flex items-center gap-1">
                      <Home size={12} className="text-[#5e6a7a]" />
                      {est.roof_squares} Squares
                    </span>
                    <span className="truncate max-w-[140px] text-[#8a95a5]">{est.material_type}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <p className="text-lg font-black text-[#f0f2f5] tabular-nums">
                        ${Number(est.total).toLocaleString()}
                      </p>
                      {est.monthly_payment && (
                        <p className="text-[11px] text-[#d4a447]/80 font-medium">
                          as low as ${est.monthly_payment}/mo
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/estimates/${est.id}`}
                        className="px-3 py-1.5 rounded-xl bg-[#d4a447]/10 hover:bg-[#d4a447]/15 text-[#d4a447] font-semibold text-xs border border-[#d4a447]/20 transition-all duration-300 ease-out"
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
          <div className="hidden lg:block overflow-x-auto rounded-[16px] border border-white/[0.06] bg-[#141b24]/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/2">
                  {['Estimate #', 'Customer', 'Specs', 'Material', 'Contract Total', 'Financing', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[#8a95a5] font-semibold text-xs uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {estimates.map(est => {
                  const badge = STATUS_BADGES[est.status] || STATUS_BADGES.draft;

                  return (
                    <tr key={est.id} className="hover:bg-white/3 transition-all duration-300 ease-out">
                      <td className="px-4 py-3 font-mono font-bold text-[#d4a447] text-xs">
                        {est.estimate_number}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/estimates/${est.id}`} className="text-[#f0f2f5] font-semibold hover:text-[#d4a447] transition-all duration-300 ease-out">
                          {est.customer_name}
                        </Link>
                        {est.customer_city && (
                          <p className="text-[#5e6a7a] text-xs">{est.customer_city}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#a0aab8] text-xs">
                        {est.roof_squares} sq ({Number(est.roof_squares) * 100} sq ft)
                      </td>
                      <td className="px-4 py-3 text-[#a0aab8] text-xs truncate max-w-[160px]">
                        {est.material_type}
                      </td>
                      <td className="px-4 py-3 font-bold text-[#f0f2f5] tabular-nums">
                        ${Number(est.total).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-[#d4a447]/90 text-xs font-semibold tabular-nums">
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
                          className="px-3 py-1 rounded-lg bg-[#d4a447]/10 hover:bg-[#d4a447]/15 text-[#d4a447] text-xs font-semibold transition-all duration-300 ease-out"
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
