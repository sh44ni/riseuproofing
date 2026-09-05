'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Share2,
  Copy,
  Check,
  CheckCircle2,
  Hammer,
  Eye,
  Send,
  Home,
  Clock,
  Printer,
  Calendar,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

interface EstimateDetail {
  id: number;
  estimate_number: string;
  version: number;
  status: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  customer_city?: string;
  customer_zip?: string;
  service_type: string;
  roof_squares: number;
  roof_pitch: string;
  stories: number;
  tearoff_layers: number;
  material_type: string;
  material_cost: number;
  labor_cost: number;
  addons: { id: string; name: string; unitPrice: number; quantity: number }[];
  subtotal: number;
  margin_pct: number;
  total: number;
  financing_months: number;
  monthly_payment: number;
  valid_until: string;
  notes?: string;
  sent_at?: string;
  viewed_at?: string;
  accepted_at?: string;
  signature_name?: string;
  created_at: string;
  lead_id?: number;
}

export default function EstimateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const estimateId = resolvedParams.id;
  const router = useRouter();

  const [estimate, setEstimate] = useState<EstimateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [converting, setConverting] = useState(false);

  const loadEstimate = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/estimates/${estimateId}`);
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (!res.ok) {
        router.push('/admin/estimates');
        return;
      }
      const data = await res.json();
      setEstimate(data.estimate);
    } finally {
      setLoading(false);
    }
  }, [estimateId, router]);

  useEffect(() => {
    loadEstimate();
  }, [loadEstimate]);

  function getShareUrl() {
    if (typeof window === 'undefined' || !estimate) return '';
    const tokenParam = (estimate as any).access_token ? `?token=${(estimate as any).access_token}` : '';
    return `${window.location.origin}/proposal/${estimate.estimate_number}${tokenParam}`;
  }

  function handleCopyShareLink() {
    navigator.clipboard.writeText(getShareUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleMarkSent() {
    if (!estimate) return;
    await fetch(`/api/admin/estimates/${estimateId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'sent' }),
    });
    loadEstimate();
  }

  async function handleConvertToJob() {
    if (!confirm('Convert this estimate into an active project on the Jobs Kanban Board?')) return;

    setConverting(true);
    try {
      const res = await fetch(`/api/admin/estimates/${estimateId}/convert`, {
        method: 'POST',
      });
      const d = await res.json();
      if (d.ok) {
        router.push(`/admin/jobs/${d.job.id}`);
      }
    } finally {
      setConverting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-3 border-[#d4a447] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!estimate) return null;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Top Breadcrumbs & Actions — Sticky on mobile */}
      <div className="sticky top-14 lg:static z-20 -mx-4 px-4 py-2.5 lg:mx-0 lg:px-0 lg:py-0 bg-[#0c1117]/95 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-none border-b border-white/[0.04] lg:border-none flex items-center justify-between gap-4">
        <Link
          href="/admin/estimates"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#8a95a5] hover:text-[#f0f2f5] transition-all duration-300 ease-out"
        >
          <ArrowLeft size={16} />
          Back to Estimates
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] text-[#a0aab8] transition-all duration-300 ease-out cursor-pointer"
            title="Print Proposal"
          >
            <Printer size={16} />
          </button>
        </div>
      </div>

      {/* Hero Card */}
      <div className="admin-card rounded-[20px] p-5 sm:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-full bg-[#d4a447]/15 text-[#d4a447] border border-[#d4a447]/25">
                {estimate.estimate_number}
              </span>
              <span className="text-xs font-semibold text-[#8a95a5] capitalize">
                Status: <strong className="text-[#f0f2f5]">{estimate.status}</strong>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#f0f2f5] mt-1">
              {estimate.customer_name}
            </h1>
            <p className="text-xs sm:text-sm text-[#8a95a5]">
              {estimate.customer_address ? `${estimate.customer_address}, ${estimate.customer_city || ''} ${estimate.customer_zip || ''}` : 'No address'}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs font-bold text-[#8a95a5] uppercase tracking-wider">Total Contract Price</p>
            <p className="text-3xl sm:text-4xl font-black text-[#f0f2f5] tabular-nums">
              ${Number(estimate.total).toLocaleString()}
            </p>
            <p className="text-xs text-[#d4a447] font-semibold">
              ${estimate.monthly_payment}/mo (0% APR financing)
            </p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-2.5 pt-4 border-t border-white/[0.06]">
          <button
            onClick={handleCopyShareLink}
            className="flex items-center gap-2 py-2 px-3.5 rounded-xl bg-[#d4a447]/12 hover:bg-[#d4a447]/20 border border-[#d4a447]/25 text-[#d4a447] font-bold text-xs sm:text-sm transition-all duration-300 ease-out cursor-pointer active:scale-95"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? 'Link Copied!' : 'Copy Customer Link'}</span>
          </button>

          <a
            href={getShareUrl() || `/proposal/${estimate.estimate_number}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 py-2 px-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-[#a0aab8] font-semibold text-xs sm:text-sm transition-all duration-300 ease-out"
          >
            <Eye size={16} />
            <span>Open Customer Portal</span>
          </a>

          {estimate.status === 'draft' && (
            <button
              onClick={handleMarkSent}
              className="flex items-center gap-2 py-2 px-3.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/25 border border-blue-500/30 text-blue-400 font-semibold text-xs sm:text-sm transition-all duration-300 ease-out cursor-pointer"
            >
              <Send size={15} />
              <span>Mark as Sent</span>
            </button>
          )}

          <button
            onClick={handleConvertToJob}
            disabled={converting}
            className="ml-auto flex items-center gap-2 py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-[#0c1117] font-bold text-xs sm:text-sm shadow-[0_2px_12px_rgba(0,0,0,0.2)] transition-all duration-300 ease-out active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Hammer size={16} />
            <span>{converting ? 'Converting...' : 'Convert to Active Job'}</span>
          </button>
        </div>
      </div>

      {/* Customer Status Milestone Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className={`p-4 rounded-[16px] border ${estimate.sent_at ? 'bg-blue-500/10 border-blue-500/20' : 'bg-[#141b24]/50 border-white/[0.04] opacity-50'}`}>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
            <Send size={14} /> Sent to Client
          </div>
          <p className="text-xs text-[#8a95a5] mt-1">
            {estimate.sent_at ? new Date(estimate.sent_at).toLocaleDateString() : 'Not sent yet'}
          </p>
        </div>

        <div className={`p-4 rounded-[16px] border ${estimate.viewed_at ? 'bg-[#d4a447]/10 border-[#d4a447]/20' : 'bg-[#141b24]/50 border-white/[0.04] opacity-50'}`}>
          <div className="flex items-center gap-2 text-xs font-bold text-[#d4a447]">
            <Eye size={14} /> Viewed by Homeowner
          </div>
          <p className="text-xs text-[#8a95a5] mt-1">
            {estimate.viewed_at ? new Date(estimate.viewed_at).toLocaleString() : 'Not viewed yet'}
          </p>
        </div>

        <div className={`p-4 rounded-[16px] border ${estimate.accepted_at ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-[#141b24]/50 border-white/[0.04] opacity-50'}`}>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <CheckCircle2 size={14} /> Digitally Signed & Accepted
          </div>
          <p className="text-xs text-[#8a95a5] mt-1">
            {estimate.accepted_at ? `Signed by ${estimate.signature_name || 'Homeowner'}` : 'Pending acceptance'}
          </p>
        </div>
      </div>

      {/* Itemized Scope & Cost Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Specifications */}
        <div className="admin-card rounded-[20px] p-5 space-y-4">
          <h3 className="text-sm font-bold text-[#f0f2f5] uppercase tracking-wider flex items-center gap-2">
            <Home size={16} className="text-[#d4a447]" />
            Roof Specifications
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
              <span className="text-[#8a95a5]">Roof Surface Area</span>
              <span className="text-[#f0f2f5] font-bold">{estimate.roof_squares} Squares ({(Number(estimate.roof_squares) * 100).toLocaleString()} sq ft)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
              <span className="text-[#8a95a5]">Material Specification</span>
              <span className="text-[#f0f2f5] font-bold">{estimate.material_type}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
              <span className="text-[#8a95a5]">Pitch / Slope</span>
              <span className="text-[#f0f2f5] font-bold">{estimate.roof_pitch}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
              <span className="text-[#8a95a5]">Building Height</span>
              <span className="text-[#f0f2f5] font-bold">{estimate.stories} Story</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-[#8a95a5]">Tear-Off Layers</span>
              <span className="text-[#f0f2f5] font-bold">{estimate.tearoff_layers} Layer(s)</span>
            </div>
          </div>

          {/* Add-ons list */}
          {estimate.addons && estimate.addons.length > 0 && (
            <div className="pt-3 border-t border-white/[0.04] space-y-2">
              <p className="text-xs uppercase font-bold text-[#8a95a5] tracking-wider">Inclusions & Add-ons</p>
              <div className="space-y-1.5">
                {estimate.addons.map((add, idx) => (
                  <div key={idx} className="flex justify-between text-xs py-1 px-2.5 bg-[#1a2332]/50 rounded-xl">
                    <span className="text-[#a0aab8]">{add.name} (Qty: {add.quantity})</span>
                    <span className="text-[#f0f2f5] font-semibold tabular-nums">
                      ${(add.unitPrice * add.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Financial & Costing Breakdown (Internal View) */}
        <div className="admin-card rounded-[20px] p-5 space-y-4">
          <h3 className="text-sm font-bold text-[#f0f2f5] uppercase tracking-wider flex items-center gap-2">
            <DollarSign size={16} className="text-[#d4a447]" />
            Internal Margin & Costing
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
              <span className="text-[#8a95a5]">Estimated Materials Cost</span>
              <span className="text-[#f0f2f5] font-bold tabular-nums">${Number(estimate.material_cost).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
              <span className="text-[#8a95a5]">Estimated Labor Cost</span>
              <span className="text-[#f0f2f5] font-bold tabular-nums">${Number(estimate.labor_cost).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
              <span className="text-[#8a95a5]">Cost Subtotal</span>
              <span className="text-[#f0f2f5] font-bold tabular-nums">${Number(estimate.subtotal).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/[0.04] text-[#d4a447]">
              <span>Target Gross Profit Margin</span>
              <span className="font-bold">{estimate.margin_pct}%</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/[0.04] text-sm">
              <span className="text-[#f0f2f5] font-bold">Total Job Contract</span>
              <span className="text-[#f0f2f5] font-black tabular-nums">${Number(estimate.total).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1.5 text-emerald-400">
              <span>Gross Profit Dollar</span>
              <span className="font-bold tabular-nums">
                ${(Number(estimate.total) - Number(estimate.subtotal)).toLocaleString()}
              </span>
            </div>
          </div>

          {estimate.notes && (
            <div className="pt-3 border-t border-white/[0.04]">
              <p className="text-[#5e6a7a] text-xs font-semibold mb-1">Proposal Scope Notes</p>
              <p className="text-[#a0aab8] text-xs leading-relaxed bg-white/2 p-3 rounded-xl">
                {estimate.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
