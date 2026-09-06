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
        <div className="w-10 h-10 border-3 border-[#2F9FE3] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!estimate) return null;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Top Breadcrumbs & Actions — Sleek Apple Liquid Glass Bar */}
      <div className="sticky top-14 lg:static z-20 -mx-4 px-4 py-2 lg:mx-0 lg:px-0 lg:py-0 bg-white/80 lg:bg-transparent backdrop-blur-xl lg:backdrop-blur-none border-b border-white/80 lg:border-none flex items-center justify-between gap-4 shadow-2xs lg:shadow-none">
        <Link
          href="/admin/estimates"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#0B1E33] px-3 py-1.5 rounded-full bg-white/85 hover:bg-white border border-slate-200/80 shadow-2xs apple-spring-press"
        >
          <ArrowLeft size={14} />
          <span>Back to Estimates</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="p-2 rounded-xl border border-slate-200/80 bg-white/85 hover:bg-white text-slate-700 shadow-2xs apple-spring-press cursor-pointer"
            title="Print Proposal"
          >
            <Printer size={16} />
          </button>
        </div>
      </div>

      {/* Hero Card */}
      <div className="admin-card p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                {estimate.estimate_number}
              </span>
              <span className="text-xs font-semibold text-slate-500 capitalize">
                Status: <strong className="text-[#0B1E33]">{estimate.status}</strong>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#0B1E33] mt-1">
              {estimate.customer_name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {estimate.customer_address ? `${estimate.customer_address}, ${estimate.customer_city || ''} ${estimate.customer_zip || ''}` : 'No address'}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Contract Price</p>
            <p className="text-3xl sm:text-4xl font-black text-[#0B1E33] tabular-nums">
              ${Number(estimate.total).toLocaleString()}
            </p>
            <p className="text-xs text-[#1878B8] font-semibold">
              ${estimate.monthly_payment}/mo (0% APR financing)
            </p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-2.5 pt-4 border-t border-slate-100">
          <button
            onClick={handleCopyShareLink}
            className="flex items-center gap-2 py-2 px-3.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold text-xs sm:text-sm transition-all duration-300 ease-out cursor-pointer active:scale-95"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? 'Link Copied!' : 'Copy Customer Link'}</span>
          </button>

          <a
            href={getShareUrl() || `/proposal/${estimate.estimate_number}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 py-2 px-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 font-semibold text-xs sm:text-sm transition-all duration-300 ease-out shadow-2xs"
          >
            <Eye size={16} />
            <span>Open Customer Portal</span>
          </a>

          {estimate.status === 'draft' && (
            <button
              onClick={handleMarkSent}
              className="flex items-center gap-2 py-2 px-3.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-[#1878B8] font-semibold text-xs sm:text-sm transition-all duration-300 ease-out cursor-pointer"
            >
              <Send size={15} />
              <span>Mark as Sent</span>
            </button>
          )}

          <button
            onClick={handleConvertToJob}
            disabled={converting}
            className="ml-auto flex items-center gap-2 py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-sm transition-all duration-300 ease-out active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Hammer size={16} />
            <span>{converting ? 'Converting...' : 'Convert to Active Job'}</span>
          </button>
        </div>
      </div>

      {/* Customer Status Milestone Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className={`p-4 rounded-[16px] border ${estimate.sent_at ? 'bg-sky-50/70 border-sky-200' : 'bg-slate-50 border-slate-200/60 opacity-60'}`}>
          <div className="flex items-center gap-2 text-xs font-bold text-[#1878B8]">
            <Send size={14} /> Sent to Client
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {estimate.sent_at ? new Date(estimate.sent_at).toLocaleDateString() : 'Not sent yet'}
          </p>
        </div>

        <div className={`p-4 rounded-[16px] border ${estimate.viewed_at ? 'bg-amber-50/70 border-amber-200' : 'bg-slate-50 border-slate-200/60 opacity-60'}`}>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
            <Eye size={14} /> Viewed by Homeowner
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {estimate.viewed_at ? new Date(estimate.viewed_at).toLocaleString() : 'Not viewed yet'}
          </p>
        </div>

        <div className={`p-4 rounded-[16px] border ${estimate.accepted_at ? 'bg-emerald-50/70 border-emerald-200' : 'bg-slate-50 border-slate-200/60 opacity-60'}`}>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
            <CheckCircle2 size={14} /> Digitally Signed & Accepted
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {estimate.accepted_at ? `Signed by ${estimate.signature_name || 'Homeowner'}` : 'Pending acceptance'}
          </p>
        </div>
      </div>

      {/* Itemized Scope & Cost Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Specifications */}
        <div className="bg-white border border-slate-200/80 shadow-xs rounded-[20px] p-5 space-y-4">
          <h3 className="text-sm font-bold text-[#0B1E33] uppercase tracking-wider flex items-center gap-2">
            <Home size={16} className="text-[#EAA636]" />
            Roof Specifications
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Roof Surface Area</span>
              <span className="text-[#0B1E33] font-bold">{estimate.roof_squares} Squares ({(Number(estimate.roof_squares) * 100).toLocaleString()} sq ft)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Material Specification</span>
              <span className="text-[#0B1E33] font-bold">{estimate.material_type}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Pitch / Slope</span>
              <span className="text-[#0B1E33] font-bold">{estimate.roof_pitch}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Building Height</span>
              <span className="text-[#0B1E33] font-bold">{estimate.stories} Story</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Tear-Off Layers</span>
              <span className="text-[#0B1E33] font-bold">{estimate.tearoff_layers} Layer(s)</span>
            </div>
          </div>

          {/* Add-ons list */}
          {estimate.addons && estimate.addons.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Inclusions & Add-ons</p>
              <div className="space-y-1.5">
                {estimate.addons.map((add, idx) => (
                  <div key={idx} className="flex justify-between text-xs py-1 px-2.5 bg-slate-50 rounded-xl">
                    <span className="text-slate-700">{add.name} (Qty: {add.quantity})</span>
                    <span className="text-[#0B1E33] font-semibold tabular-nums">
                      ${(add.unitPrice * add.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Financial & Costing Breakdown (Internal View) */}
        <div className="bg-white border border-slate-200/80 shadow-xs rounded-[20px] p-5 space-y-4">
          <h3 className="text-sm font-bold text-[#0B1E33] uppercase tracking-wider flex items-center gap-2">
            <DollarSign size={16} className="text-emerald-600" />
            Internal Margin & Costing
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Estimated Materials Cost</span>
              <span className="text-[#0B1E33] font-bold tabular-nums">${Number(estimate.material_cost).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Estimated Labor Cost</span>
              <span className="text-[#0B1E33] font-bold tabular-nums">${Number(estimate.labor_cost).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Cost Subtotal</span>
              <span className="text-[#0B1E33] font-bold tabular-nums">${Number(estimate.subtotal).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 text-amber-800 font-semibold">
              <span>Target Gross Profit Margin</span>
              <span className="font-bold">{estimate.margin_pct}%</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 text-sm">
              <span className="text-[#0B1E33] font-bold">Total Job Contract</span>
              <span className="text-[#0B1E33] font-black tabular-nums">${Number(estimate.total).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1.5 text-emerald-700 font-semibold">
              <span>Gross Profit Dollar</span>
              <span className="font-bold tabular-nums">
                ${(Number(estimate.total) - Number(estimate.subtotal)).toLocaleString()}
              </span>
            </div>
          </div>

          {estimate.notes && (
            <div className="pt-3 border-t border-slate-100">
              <p className="text-slate-500 text-xs font-semibold mb-1">Proposal Scope Notes</p>
              <p className="text-slate-700 text-xs leading-relaxed bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
                {estimate.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
