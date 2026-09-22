import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  FileText,
  DollarSign,
  CheckCircle2,
  Filter,
  ChevronRight,
  Download,
} from 'lucide-react';
import { CrmPageHero } from '@/components/common/CrmPageHero';
import { UniversalStatCard } from '@/components/common/UniversalStatCard';
import { WizardShell } from '@/components/estimates/wizard/WizardShell';
import { api } from '@/lib/api';
import { formatEstimatePrice } from '@/data/estimateConstants';

// ─── Types ──────────────────────────────────────────────────────────────────

interface EstimateSummary {
  totalCount: number;
  pipelineValue: number;
  acceptedCount: number;
  acceptedValue: number;
}

interface EstimateRow {
  id: number;
  estimate_number: string;
  status: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  total?: number;
  template_key?: string;
  pdf_url?: string;
  created_at: string;
  sent_at?: string;
  lead_id?: number;
  client_id?: number;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function EstimatesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Determine view mode from URL
  const mode = searchParams.get('mode') || 'registry';
  const editId = searchParams.get('id');

  // Registry state
  const [estimates, setEstimates] = useState<EstimateRow[]>([]);
  const [summary, setSummary] = useState<EstimateSummary>({ totalCount: 0, pipelineValue: 0, acceptedCount: 0, acceptedValue: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  // ── Fetch estimates for registry ──────────────────────────────────────

  const fetchEstimates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const res = await api.request(`/admin/estimates${queryStr}`);
      setEstimates((res as any).estimates || []);
      setSummary((res as any).summary || { totalCount: 0, pipelineValue: 0, acceptedCount: 0, acceptedValue: 0 });
    } catch (err) {
      console.error('Failed to fetch estimates:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (mode === 'registry') {
      fetchEstimates();
    }
  }, [mode, fetchEstimates]);

  // ── Navigation helpers ────────────────────────────────────────────────

  const openNewEstimate = () => {
    // Pre-populate from query params if coming from pipeline/client
    const params = new URLSearchParams({ mode: 'studio' });
    const clientName = searchParams.get('clientName') || searchParams.get('name');
    const leadId = searchParams.get('leadId');
    if (clientName) params.set('clientName', clientName);
    if (leadId) params.set('leadId', leadId);
    ['phone', 'email', 'address', 'city', 'clientId'].forEach(k => {
      const v = searchParams.get(k);
      if (v) params.set(k, v);
    });
    setSearchParams(params);
  };

  const openEditEstimate = (id: number) => {
    setSearchParams({ mode: 'studio', id: String(id) });
  };

  const backToRegistry = () => {
    setSearchParams({});
    fetchEstimates();
  };

  // ── Auto-open studio if navigating with client params ─────────────────

  useEffect(() => {
    const qName = searchParams.get('clientName') || searchParams.get('name');
    const qLeadId = searchParams.get('leadId');
    if ((qName || qLeadId) && mode !== 'studio') {
      openNewEstimate();
    }
  }, []); // only on mount

  // ── Filter estimates ──────────────────────────────────────────────────

  const filtered = estimates.filter(e => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (e.customer_name || '').toLowerCase().includes(q) ||
      (e.estimate_number || '').toLowerCase().includes(q) ||
      (e.customer_email || '').toLowerCase().includes(q) ||
      (e.customer_address || '').toLowerCase().includes(q)
    );
  });

  // ── Render: Studio Mode (Wizard) ──────────────────────────────────────

  if (mode === 'studio') {
    return (
      <WizardShell
        estimateId={editId}
        onBack={backToRegistry}
        prefill={{
          clientName: searchParams.get('clientName') || searchParams.get('name') || undefined,
          leadId: searchParams.get('leadId') || undefined,
          phone: searchParams.get('phone') || undefined,
          email: searchParams.get('email') || undefined,
          address: searchParams.get('address') || undefined,
          city: searchParams.get('city') || undefined,
          clientId: searchParams.get('clientId') || undefined,
        }}
      />
    );
  }

  // ── Render: Registry Mode (List) ──────────────────────────────────────

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-slate-100 text-slate-600 border-slate-200',
      sent: 'bg-blue-50 text-blue-700 border-blue-200',
      accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      declined: 'bg-red-50 text-red-600 border-red-200',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${colors[status] || colors.draft}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Hero */}
      <CrmPageHero
        pageId="estimates"
        defaultEyebrow="Manage"
        defaultTitle="Estimates & Proposals"
        defaultSubtitle="Generate, track, and deliver professional roofing proposals."
        topRightActions={
          <button
            onClick={openNewEstimate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#091b36] text-white text-sm font-bold shadow-lg hover:bg-[#0d2548] transition-all"
          >
            <Plus size={16} />
            New Estimate
          </button>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <UniversalStatCard
          label="Total Estimates"
          value={summary.totalCount}
          icon={FileText}
        />
        <UniversalStatCard
          label="Pipeline Value"
          value={formatEstimatePrice(summary.pipelineValue)}
          icon={DollarSign}
        />
        <UniversalStatCard
          label="Accepted"
          value={summary.acceptedCount}
          icon={CheckCircle2}
        />
        <UniversalStatCard
          label="Accepted Value"
          value={formatEstimatePrice(summary.acceptedValue)}
          icon={DollarSign}
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="light-glass-card rounded-2xl p-4 border border-slate-200/80 bg-white/70 backdrop-blur-md shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search estimates by name, number, email..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 focus:border-[#1878B8] focus:ring-2 focus:ring-[#1878B8]/20 text-sm outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            {['all', 'draft', 'sent', 'accepted'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  statusFilter === s
                    ? 'bg-[#091b36] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Estimates Table */}
      <div className="light-glass-card rounded-2xl border border-slate-200/80 bg-white/70 backdrop-blur-md shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading estimates...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-bold text-slate-600 mb-1">No estimates found</p>
            <p className="text-xs text-slate-400 mb-4">
              {search ? 'Try a different search term.' : 'Create your first estimate to get started.'}
            </p>
            <button
              onClick={openNewEstimate}
              className="px-4 py-2 rounded-xl bg-[#091b36] text-white text-xs font-bold hover:bg-[#0d2548] transition-all"
            >
              <Plus size={14} className="inline mr-1" />
              New Estimate
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase text-slate-500 tracking-wider">Estimate #</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase text-slate-500 tracking-wider">Client</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase text-slate-500 tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-[11px] font-bold uppercase text-slate-500 tracking-wider">Total</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase text-slate-500 tracking-wider">Created</th>
                <th className="text-right px-4 py-3 text-[11px] font-bold uppercase text-slate-500 tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(est => (
                <tr
                  key={est.id}
                  className="border-b border-slate-50 hover:bg-slate-50/80 cursor-pointer transition-colors"
                  onClick={() => openEditEstimate(est.id)}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-[#1878B8] text-xs">{est.estimate_number}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800 text-xs">{est.customer_name || '—'}</div>
                    {est.customer_address && (
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[200px]">{est.customer_address}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">{statusBadge(est.status)}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-800 text-xs">
                    {est.total ? formatEstimatePrice(est.total) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {est.created_at ? new Date(est.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                      {est.pdf_url && (
                        <a
                          href={est.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#1878B8] hover:bg-blue-50 transition-all"
                          title="Download PDF"
                        >
                          <Download size={14} />
                        </a>
                      )}
                      <button
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#1878B8] hover:bg-blue-50 transition-all"
                        title="Edit"
                        onClick={() => openEditEstimate(est.id)}
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
