'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Search,
  RefreshCw,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Award,
  Clock,
  Phone,
  MessageSquare,
  ChevronRight,
  Check,
  User,
} from 'lucide-react';
import QuickMessageModal from '@/components/admin/timeline/QuickMessageModal';
import { WarrantiesSkeleton } from '@/components/admin/shared/AdminSkeletons';

interface WarrantyItem {
  id: number;
  job_id: number;
  lead_id?: number;
  warranty_number: string;
  warranty_type: string;
  start_date: string;
  expiration_date: string;
  coverage_details: string;
  status: 'active' | 'transferred' | 'claimed' | 'expired';
  checkin_6mo_due: string;
  checkin_1yr_due: string;
  checkin_6mo_completed: boolean;
  checkin_1yr_completed: boolean;
  job_number?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  address?: string;
  city?: string;
  service_type?: string;
  material_type?: string;
}

interface WarrantySummary {
  totalWarranties: number;
  activeCount: number;
  checkin6moDue: number;
  checkin1yrDue: number;
}

export default function WarrantiesPage() {
  const [warranties, setWarranties] = useState<WarrantyItem[]>([]);
  const [summary, setSummary] = useState<WarrantySummary>({
    totalWarranties: 0,
    activeCount: 0,
    checkin6moDue: 0,
    checkin1yrDue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Quick Message Modal State
  const [messageTarget, setMessageTarget] = useState<WarrantyItem | null>(null);

  const fetchWarranties = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/warranties?status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setWarranties(data.warranties || []);
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to load warranties', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchWarranties();
  }, [fetchWarranties]);

  async function handleToggleCheckin(
    warrantyId: number,
    field: 'checkin_6mo_completed' | 'checkin_1yr_completed',
    currentVal: boolean
  ) {
    const newVal = !currentVal;
    // Optimistic UI update
    setWarranties(prev =>
      prev.map(w =>
        w.id === warrantyId ? { ...w, [field]: newVal } : w
      )
    );

    const body: any = { id: warrantyId };
    if (field === 'checkin_6mo_completed') body.checkin6moCompleted = newVal;
    if (field === 'checkin_1yr_completed') body.checkin1yrCompleted = newVal;

    await fetch('/api/admin/warranties', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    fetchWarranties();
  }

  const filtered = warranties.filter(w => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      w.warranty_number.toLowerCase().includes(q) ||
      (w.customer_name && w.customer_name.toLowerCase().includes(q)) ||
      (w.city && w.city.toLowerCase().includes(q)) ||
      (w.address && w.address.toLowerCase().includes(q)) ||
      (w.job_number && w.job_number.toLowerCase().includes(q))
    );
  });

  if (loading && warranties.length === 0) {
    return <WarrantiesSkeleton />;
  }

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-7xl mx-auto admin-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-[16px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#f0f2f5]">
              Warranties &amp; Post-Job Lifecycle
            </h1>
            <p className="text-xs sm:text-sm text-[#8a95a5]">
              Stage 8: Owens Corning Preferred Protection certificates &amp; automated customer check-ins
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setRefreshing(true);
            fetchWarranties();
          }}
          disabled={refreshing}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/[0.06] bg-[#141b24] hover:bg-[#1a2332] text-xs font-semibold text-[#a0aab8] transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin text-emerald-400' : ''} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 admin-fade-in-1">
        <div className="p-4 rounded-[16px] admin-card">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#8a95a5] mb-1 flex items-center justify-between">
            <span>Active Warranties</span>
            <ShieldCheck size={15} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-[#f0f2f5]">{summary.activeCount}</div>
          <div className="text-xs text-emerald-400 font-semibold mt-1">Roofs under active coverage</div>
        </div>

        <div className="p-4 rounded-[16px] admin-card">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#8a95a5] mb-1 flex items-center justify-between">
            <span>6-Month Follow-ups</span>
            <Clock size={15} className="text-[#d4a447]" />
          </div>
          <div className="text-2xl font-black text-[#f0f2f5]">{summary.checkin6moDue}</div>
          <div className="text-xs text-[#d4a447] font-semibold mt-1">Inspection due soon</div>
        </div>

        <div className="p-4 rounded-[16px] admin-card">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#8a95a5] mb-1 flex items-center justify-between">
            <span>1-Year Anniversaries</span>
            <Award size={15} className="text-blue-400" />
          </div>
          <div className="text-2xl font-black text-[#f0f2f5]">{summary.checkin1yrDue}</div>
          <div className="text-xs text-blue-400 font-semibold mt-1">Review &amp; referral drivers</div>
        </div>

        <div className="p-4 rounded-[16px] admin-card">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#8a95a5] mb-1 flex items-center justify-between">
            <span>Preferred Contractor</span>
            <CheckCircle2 size={15} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-[#f0f2f5]">50 Years</div>
          <div className="text-xs text-cyan-400 font-semibold mt-1">Owens Corning System Warranty</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 sm:p-4 rounded-[16px] bg-[#141b24] border border-white/[0.06] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 admin-fade-in-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All Certificates' },
            { id: 'checkin_due', label: 'Check-ins Due Now' },
            { id: 'active', label: 'Active Coverage' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-emerald-500 text-[#0c1117] shadow-[0_1px_4px_rgba(0,0,0,0.15)]'
                  : 'bg-[#1a2332] text-[#8a95a5] hover:text-[#f0f2f5] border border-white/[0.04]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a95a5]" />
          <input
            type="text"
            placeholder="Search certificate #, homeowner, city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl admin-input text-[#f0f2f5] placeholder-[#8a95a5] text-xs focus:outline-none"
          />
        </div>
      </div>

      {/* Warranties List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-[#5e6a7a] gap-3 admin-fade-in-3">
          <RefreshCw size={24} className="animate-spin text-emerald-400" />
          <span className="text-xs font-semibold">Loading warranty certificates...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-[16px] border border-white/[0.04] bg-[#141b24] admin-fade-in-3">
          <ShieldCheck size={36} className="mx-auto text-[#4a5568] mb-3" />
          <h3 className="text-sm font-bold text-[#f0f2f5] mb-1">No Warranties Found</h3>
          <p className="text-xs text-[#8a95a5] max-w-sm mx-auto">
            {search
              ? 'No certificates match your search query.'
              : 'Issue official 50-year warranty certificates directly from any completed roofing job.'}
          </p>
          <div className="mt-4">
            <Link
              href="/admin/jobs"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-colors"
            >
              Go to Jobs Pipeline
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3 admin-fade-in-3">
          {filtered.map(war => {
            const is6moDue =
              !war.checkin_6mo_completed &&
              new Date(war.checkin_6mo_due) <= new Date(Date.now() + 14 * 86400000);
            const is1yrDue =
              !war.checkin_1yr_completed &&
              new Date(war.checkin_1yr_due) <= new Date(Date.now() + 14 * 86400000);

            return (
              <div
                key={war.id}
                className="p-5 rounded-[20px] admin-card admin-card-gold space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.2)]"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-[#d4a447]">
                        {war.warranty_number}
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full admin-badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        ACTIVE CERTIFICATE
                      </span>
                      {war.material_type && (
                        <span className="text-[10px] text-[#8a95a5]">
                          {war.material_type}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-[#f0f2f5] mt-1">
                      {war.customer_name || 'Homeowner'}
                    </h3>
                    <p className="text-xs text-[#8a95a5]">
                      {war.address ? `${war.address}, ${war.city || 'CA'}` : 'San Diego County'}
                      {war.job_number && ` • ${war.job_number}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {war.lead_id && (
                      <button
                        type="button"
                        onClick={() => setMessageTarget(war)}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <MessageSquare size={13} />
                        Quick Check-in
                      </button>
                    )}

                    <Link
                      href={`/warranty/${war.warranty_number}`}
                      target="_blank"
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      View Certificate <ExternalLink size={12} />
                    </Link>
                  </div>
                </div>

                {/* Scope & Terms */}
                <div className="p-3 rounded-[16px] bg-[#0a0f14] border border-white/[0.04] text-xs space-y-1">
                  <div className="font-semibold text-[#c8cfd8]">{war.warranty_type}</div>
                  <p className="text-[#8a95a5] text-[11px] line-clamp-2">
                    {war.coverage_details}
                  </p>
                </div>

                {/* Bottom Timeline: Coverage Dates & Automated Check-in Checkboxes */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/[0.04] text-xs">
                  {/* Coverage Period */}
                  <div>
                    <span className="text-[10px] text-[#8a95a5] admin-section-label font-semibold">
                      Coverage Span
                    </span>
                    <div className="text-[#c8cfd8] font-semibold mt-0.5">
                      {war.start_date} → {war.expiration_date}
                    </div>
                  </div>

                  {/* 6-Month Check-in */}
                  <div className="flex items-center justify-between sm:justify-start gap-2 bg-[#0a0f14] p-2.5 rounded-xl border border-white/[0.04]">
                    <div>
                      <div className="text-[10px] text-[#8a95a5] admin-section-label font-semibold flex items-center gap-1">
                        <span>6-Mo Inspection</span>
                        {is6moDue && (
                          <span className="w-2 h-2 rounded-full bg-[#d4a447] admin-pulse-gold" />
                        )}
                      </div>
                      <div className="text-[#a0aab8] text-[11px] font-mono">
                        {war.checkin_6mo_due}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleToggleCheckin(
                          war.id,
                          'checkin_6mo_completed',
                          war.checkin_6mo_completed
                        )
                      }
                      className={`ml-auto px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                        war.checkin_6mo_completed
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40'
                          : is6moDue
                          ? 'bg-[#d4a447]/10 text-[#d4a447] border-[#d4a447]/30'
                          : 'bg-[#1a2332] text-[#8a95a5] border-white/[0.06] hover:text-[#f0f2f5]'
                      }`}
                    >
                      {war.checkin_6mo_completed ? (
                        <>
                          <Check size={12} /> Done
                        </>
                      ) : (
                        'Mark Done'
                      )}
                    </button>
                  </div>

                  {/* 1-Year Check-in */}
                  <div className="flex items-center justify-between sm:justify-start gap-2 bg-[#0a0f14] p-2.5 rounded-xl border border-white/[0.04]">
                    <div>
                      <div className="text-[10px] text-[#8a95a5] admin-section-label font-semibold flex items-center gap-1">
                        <span>1-Yr Anniversary</span>
                        {is1yrDue && (
                          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                        )}
                      </div>
                      <div className="text-[#a0aab8] text-[11px] font-mono">
                        {war.checkin_1yr_due}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleToggleCheckin(
                          war.id,
                          'checkin_1yr_completed',
                          war.checkin_1yr_completed
                        )
                      }
                      className={`ml-auto px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                        war.checkin_1yr_completed
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40'
                          : is1yrDue
                          ? 'bg-blue-500/10 text-blue-300 border-blue-500/40'
                          : 'bg-[#1a2332] text-[#8a95a5] border-white/[0.06] hover:text-[#f0f2f5]'
                      }`}
                    >
                      {war.checkin_1yr_completed ? (
                        <>
                          <Check size={12} /> Done
                        </>
                      ) : (
                        'Mark Done'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Message Modal for Warranty Check-ins */}
      {messageTarget && messageTarget.lead_id && (
        <QuickMessageModal
          isOpen={Boolean(messageTarget)}
          onClose={() => setMessageTarget(null)}
          leadId={messageTarget.lead_id}
          customerName={messageTarget.customer_name || 'Homeowner'}
          customerPhone={messageTarget.customer_phone}
          customerEmail={messageTarget.customer_email}
          address={messageTarget.address}
          defaultChannel="sms"
          onSent={fetchWarranties}
        />
      )}
    </div>
  );
}
