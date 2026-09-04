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
    return `${window.location.origin}/proposal/${estimate.estimate_number}`;
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
        <div className="w-10 h-10 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!estimate) return null;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Top Breadcrumbs & Actions */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/admin/estimates"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Estimates
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
            title="Print Proposal"
          >
            <Printer size={16} />
          </button>
        </div>
      </div>

      {/* Hero Card */}
      <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {estimate.estimate_number}
              </span>
              <span className="text-xs font-semibold text-slate-400 capitalize">
                Status: <strong className="text-white">{estimate.status}</strong>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
              {estimate.customer_name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              {estimate.customer_address ? `${estimate.customer_address}, ${estimate.customer_city || ''} ${estimate.customer_zip || ''}` : 'No address'}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Contract Price</p>
            <p className="text-3xl sm:text-4xl font-black text-white tabular-nums">
              ${Number(estimate.total).toLocaleString()}
            </p>
            <p className="text-xs text-amber-400 font-semibold">
              ${estimate.monthly_payment}/mo (0% APR financing)
            </p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-2.5 pt-4 border-t border-white/10">
          <button
            onClick={handleCopyShareLink}
            className="flex items-center gap-2 py-2 px-3.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 font-bold text-xs sm:text-sm transition-all cursor-pointer active:scale-95"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? 'Link Copied!' : 'Copy Customer Link'}</span>
          </button>

          <a
            href={`/proposal/${estimate.estimate_number}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 py-2 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold text-xs sm:text-sm transition-all"
          >
            <Eye size={16} />
            <span>Open Customer Portal</span>
          </a>

          {estimate.status === 'draft' && (
            <button
              onClick={handleMarkSent}
              className="flex items-center gap-2 py-2 px-3.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-400 font-semibold text-xs sm:text-sm transition-all cursor-pointer"
            >
              <Send size={15} />
              <span>Mark as Sent</span>
            </button>
          )}

          <button
            onClick={handleConvertToJob}
            disabled={converting}
            className="ml-auto flex items-center gap-2 py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Hammer size={16} />
            <span>{converting ? 'Converting...' : 'Convert to Active Job'}</span>
          </button>
        </div>
      </div>

      {/* Customer Status Milestone Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className={`p-4 rounded-2xl border ${estimate.sent_at ? 'bg-blue-500/10 border-blue-500/20' : 'bg-slate-900/50 border-white/5 opacity-50'}`}>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
            <Send size={14} /> Sent to Client
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {estimate.sent_at ? new Date(estimate.sent_at).toLocaleDateString() : 'Not sent yet'}
          </p>
        </div>

        <div className={`p-4 rounded-2xl border ${estimate.viewed_at ? 'bg-amber-500/10 border-amber-500/20' : 'bg-slate-900/50 border-white/5 opacity-50'}`}>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <Eye size={14} /> Viewed by Homeowner
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {estimate.viewed_at ? new Date(estimate.viewed_at).toLocaleString() : 'Not viewed yet'}
          </p>
        </div>

        <div className={`p-4 rounded-2xl border ${estimate.accepted_at ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-900/50 border-white/5 opacity-50'}`}>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <CheckCircle2 size={14} /> Digitally Signed & Accepted
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {estimate.accepted_at ? `Signed by ${estimate.signature_name || 'Homeowner'}` : 'Pending acceptance'}
          </p>
        </div>
      </div>

      {/* Itemized Scope & Cost Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Specifications */}
        <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Home size={16} className="text-amber-400" />
            Roof Specifications
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-slate-400">Roof Surface Area</span>
              <span className="text-white font-bold">{estimate.roof_squares} Squares ({(Number(estimate.roof_squares) * 100).toLocaleString()} sq ft)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-slate-400">Material Specification</span>
              <span className="text-white font-bold">{estimate.material_type}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-slate-400">Pitch / Slope</span>
              <span className="text-white font-bold">{estimate.roof_pitch}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-slate-400">Building Height</span>
              <span className="text-white font-bold">{estimate.stories} Story</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Tear-Off Layers</span>
              <span className="text-white font-bold">{estimate.tearoff_layers} Layer(s)</span>
            </div>
          </div>

          {/* Add-ons list */}
          {estimate.addons && estimate.addons.length > 0 && (
            <div className="pt-3 border-t border-white/5 space-y-2">
              <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Inclusions & Add-ons</p>
              <div className="space-y-1.5">
                {estimate.addons.map((add, idx) => (
                  <div key={idx} className="flex justify-between text-xs py-1 px-2.5 bg-slate-800/50 rounded-xl">
                    <span className="text-slate-300">{add.name} (Qty: {add.quantity})</span>
                    <span className="text-white font-semibold tabular-nums">
                      ${(add.unitPrice * add.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Financial & Costing Breakdown (Internal View) */}
        <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <DollarSign size={16} className="text-amber-400" />
            Internal Margin & Costing
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-slate-400">Estimated Materials Cost</span>
              <span className="text-white font-bold tabular-nums">${Number(estimate.material_cost).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-slate-400">Estimated Labor Cost</span>
              <span className="text-white font-bold tabular-nums">${Number(estimate.labor_cost).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-slate-400">Cost Subtotal</span>
              <span className="text-white font-bold tabular-nums">${Number(estimate.subtotal).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5 text-amber-400">
              <span>Target Gross Profit Margin</span>
              <span className="font-bold">{estimate.margin_pct}%</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5 text-sm">
              <span className="text-white font-bold">Total Job Contract</span>
              <span className="text-white font-black tabular-nums">${Number(estimate.total).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1.5 text-emerald-400">
              <span>Gross Profit Dollar</span>
              <span className="font-bold tabular-nums">
                ${(Number(estimate.total) - Number(estimate.subtotal)).toLocaleString()}
              </span>
            </div>
          </div>

          {estimate.notes && (
            <div className="pt-3 border-t border-white/5">
              <p className="text-slate-500 text-xs font-semibold mb-1">Proposal Scope Notes</p>
              <p className="text-slate-300 text-xs leading-relaxed bg-white/2 p-3 rounded-xl">
                {estimate.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
