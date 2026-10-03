'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Printer,
  Phone,
  Calendar,
  User,
  MapPin,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  Layers,
  Clock,
  ExternalLink,
  ChevronDown,
  Info,
} from 'lucide-react';
import { PHONE_NUMBER, PHONE_HREF } from '@/lib/utils';
import { InspectionReportSkeleton } from '@/components/shared/PortalSkeletons';

interface InspectionPoint {
  id: string;
  name: string;
  category: string;
  status: 'good' | 'fair' | 'critical';
  notes?: string;
}

interface InspectionReport {
  id: number;
  inspection_number: string;
  inspector_name: string;
  inspection_date: string;
  roof_health_score: number;
  findings: InspectionPoint[];
  urgent_action_required: boolean;
  estimated_remaining_years: number;
  notes?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  address?: string;
  city?: string;
  zip?: string;
  service_type?: string;
  roof_type?: string;
  roof_sqf?: number;
  stories?: number;
  job_number?: string;
  lead_id?: number;
}

export default function PublicInspectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [report, setReport] = useState<InspectionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReport() {
      try {
        const res = await fetch(`/api/inspection/${id}`);
        if (!res.ok) {
          throw new Error('Roof inspection report not found or invalid link.');
        }
        const data = await res.json();
        setReport(data.inspection);
      } catch (err: any) {
        setError(err.message || 'Failed to load inspection report.');
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [id]);

  if (loading) {
    return <InspectionReportSkeleton />;
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
          <XCircle size={32} />
        </div>
        <h1 className="text-white font-black text-xl">Report Not Found</h1>
        <p className="text-slate-400 text-sm mt-1 max-w-sm">
          {error || 'Unable to locate this roof inspection report. Please check the URL or contact Rise Up Roofing.'}
        </p>
        <a
          href={PHONE_HREF}
          className="mt-6 px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm shadow-lg inline-flex items-center gap-2"
        >
          <Phone size={15} /> Call {PHONE_NUMBER}
        </a>
      </div>
    );
  }

  const score = report.roof_health_score;
  const isGood = score >= 80;
  const isFair = score >= 60 && score < 80;
  const isCritical = score < 60;

  // Group findings by category
  const categories: { [cat: string]: InspectionPoint[] } = {};
  (report.findings || []).forEach(f => {
    const cat = f.category || 'Roof Surface & Covering';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(f);
  });

  // Calculate gauge dashoffset for circular SVG: radius = 58, circumference = 2 * PI * 58 = 364.42
  const circumference = 364.42;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 print:bg-white print:text-black print:p-0">
      {/* Top Bar (Hidden on print) */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center text-slate-950 font-black text-sm">
            <Zap size={18} />
          </div>
          <div>
            <span className="text-white font-black text-sm block leading-none">Rise Up Roofing &amp; Construction</span>
            <span className="text-amber-400 text-[10px] font-semibold tracking-wider uppercase">CSLB License #1096492</span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => window.print()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Printer size={14} /> Print / Save PDF
          </button>
          <a
            href={PHONE_HREF}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <Phone size={14} /> Call {PHONE_NUMBER}
          </a>
        </div>
      </div>

      {/* Main Report Container */}
      <div className="max-w-4xl mx-auto bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-6 py-4 text-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2 print:bg-amber-400">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-slate-950" />
            <span className="font-black text-xs sm:text-sm uppercase tracking-wider">
              Official Diagnostic Roof Health &amp; Damage Report
            </span>
          </div>
          <span className="font-mono text-xs font-extrabold bg-slate-950/20 px-3 py-1 rounded-full self-start sm:self-auto">
            Report ID: {report.inspection_number}
          </span>
        </div>

        <div className="p-6 sm:p-10 space-y-8">
          {/* Company & Homeowner Meta Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-white/10 print:border-slate-300">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                Inspected Property
              </span>
              <h2 className="text-xl font-black text-white print:text-black">
                {report.customer_name || 'Homeowner Residence'}
              </h2>
              <p className="text-xs text-slate-300 print:text-slate-700 flex items-center gap-1.5 mt-1">
                <MapPin size={13} className="text-amber-400 flex-shrink-0" />
                {report.address ? `${report.address}, ${report.city || ''} ${report.zip || ''}` : 'Southern California'}
              </p>
              {report.roof_type && (
                <p className="text-xs text-slate-400 print:text-slate-600 mt-1">
                  Roof System: <span className="text-slate-200 print:text-black font-semibold">{report.roof_type}</span>
                </p>
              )}
            </div>

            <div className="md:text-right space-y-1 text-xs">
              <div>
                <span className="text-slate-400">Certified Inspector: </span>
                <span className="font-bold text-white print:text-black">{report.inspector_name}</span>
              </div>
              <div>
                <span className="text-slate-400">Inspection Date: </span>
                <span className="font-bold text-white print:text-black">{report.inspection_date}</span>
              </div>
              <div>
                <span className="text-slate-400">Accreditation: </span>
                <span className="text-amber-400 font-bold">Owens Corning Preferred Contractor</span>
              </div>
            </div>
          </div>

          {/* Urgent Hazard Alert Banner */}
          {report.urgent_action_required && (
            <div className="p-4 rounded-2xl bg-rose-500/15 border-2 border-rose-500/40 text-rose-200 flex items-start gap-3.5 print:bg-rose-50 print:border-rose-400 print:text-rose-900">
              <div className="p-2 rounded-xl bg-rose-500 text-white flex-shrink-0 mt-0.5">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-black text-sm text-white print:text-rose-950 uppercase tracking-wide">
                  ⚠️ Critical Action Required — Active Leak Hazard or Structural Decay
                </h3>
                <p className="text-xs text-rose-300 print:text-rose-800 mt-1 leading-relaxed">
                  Our inspector flagged severe vulnerabilities (such as compromised pipe boots, rusted valleys, or decking rot) that can permit water penetration into attic insulation, ceilings, and drywall. Prompt repair or re-roofing is strongly advised.
                </p>
              </div>
            </div>
          )}

          {/* Big Circular Roof Health Score Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/60 border border-white/10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center print:bg-slate-50 print:border-slate-300">
            {/* SVG Circular Progress Gauge */}
            <div className="md:col-span-5 flex flex-col items-center justify-center">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 130 130">
                  {/* Track */}
                  <circle
                    cx="65"
                    cy="65"
                    r="58"
                    className="stroke-slate-800 print:stroke-slate-200"
                    strokeWidth="12"
                    fill="transparent"
                  />
                  {/* Colored Arc */}
                  <circle
                    cx="65"
                    cy="65"
                    r="58"
                    className={`transition-all duration-1000 ease-out ${
                      isGood
                        ? 'stroke-emerald-400'
                        : isFair
                        ? 'stroke-amber-400'
                        : 'stroke-rose-500'
                    }`}
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>

                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-black text-white print:text-black tracking-tight leading-none">
                    {score}%
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 print:text-slate-600 mt-1">
                    Roof Health
                  </span>
                </div>
              </div>

              <div className={`mt-3 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                isGood
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : isFair
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {isGood ? 'Good / Passing' : isFair ? 'Maintenance Advised' : 'Critical Hazard'}
              </div>
            </div>

            {/* Diagnostic Score Breakdown */}
            <div className="md:col-span-7 space-y-4">
              <div>
                <span className="text-[11px] uppercase font-bold text-slate-400 print:text-slate-600 tracking-wider">
                  Diagnostic Lifespan Forecast
                </span>
                <h3 className="text-2xl font-black text-white print:text-black mt-0.5">
                  ~{report.estimated_remaining_years} Years Estimated Remaining
                </h3>
                <p className="text-xs text-slate-300 print:text-slate-700 mt-1 leading-relaxed">
                  Based on shingle granule retention, underlayment brittleness, valley drainage, and sun exposure across Southern California weather conditions.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                <div className="p-3 rounded-2xl bg-slate-900 border border-white/5 print:bg-white print:border-slate-300">
                  <span className="text-slate-400 print:text-slate-600 block text-[11px]">Inspection Method</span>
                  <span className="font-bold text-white print:text-black">12-Point Multi-Vector</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900 border border-white/5 print:bg-white print:border-slate-300">
                  <span className="text-slate-400 print:text-slate-600 block text-[11px]">Warranty Eligibility</span>
                  <span className="font-bold text-amber-400">Up to 50-Yr Owens Corning</span>
                </div>
              </div>
            </div>
          </div>

          {/* Itemized 12-Point Findings Section */}
          <div className="space-y-6">
            <div className="border-b border-white/10 pb-2 print:border-slate-300">
              <h3 className="text-lg font-black text-white print:text-black flex items-center gap-2">
                <ClipboardCheck size={20} className="text-amber-400" />
                Detailed 12-Point Inspection Findings
              </h3>
              <p className="text-xs text-slate-400 print:text-slate-600">
                Itemized assessment of critical protective zones across the roof envelope.
              </p>
            </div>

            <div className="space-y-6">
              {Object.entries(categories).map(([catName, points]) => (
                <div
                  key={catName}
                  className="rounded-2xl bg-slate-950/40 border border-white/5 p-4 sm:p-5 space-y-3 print:bg-white print:border-slate-300"
                >
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers size={14} /> {catName}
                  </h4>

                  <div className="divide-y divide-white/5 print:divide-slate-200">
                    {points.map(pt => {
                      const isPtGood = pt.status === 'good';
                      const isPtFair = pt.status === 'fair';
                      const isPtCrit = pt.status === 'critical';

                      return (
                        <div key={pt.id} className="py-3 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1">
                            <span className="text-sm font-bold text-white print:text-black block">
                              {pt.name}
                            </span>
                            {pt.notes ? (
                              <p className="text-xs text-slate-300 print:text-slate-700 bg-slate-900/60 print:bg-slate-100 p-2 rounded-lg border border-white/5 print:border-slate-200">
                                <span className="font-semibold text-slate-400 print:text-slate-600">Note: </span>
                                {pt.notes}
                              </p>
                            ) : (
                              <span className="text-[11px] text-slate-500 italic">No defects noted; functioning normally.</span>
                            )}
                          </div>

                          <div className="flex-shrink-0 self-start">
                            {isPtGood && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 print:bg-emerald-50 print:text-emerald-800">
                                <CheckCircle2 size={13} /> Good / Pass
                              </span>
                            )}
                            {isPtFair && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 print:bg-amber-50 print:text-amber-800">
                                <AlertTriangle size={13} /> Attention Needed
                              </span>
                            )}
                            {isPtCrit && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 print:bg-rose-50 print:text-rose-800">
                                <XCircle size={13} /> Critical Leak Hazard
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inspector Recommendations & Notes */}
          {report.notes && (
            <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 print:bg-amber-50 print:border-amber-300 print:text-black space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 print:text-amber-900 flex items-center gap-1.5">
                <Info size={14} /> Inspector’s Official Recommendation
              </h4>
              <p className="text-xs sm:text-sm text-slate-200 print:text-slate-900 leading-relaxed whitespace-pre-line">
                {report.notes}
              </p>
            </div>
          )}

          {/* Bottom Homeowner CTA (Hidden on print) */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-amber-400/30 text-center space-y-4 shadow-xl print:hidden">
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Need a Roof Tune-up or Full 50-Year Replacement?
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
              Rise Up Roofing provides lifetime warranties, Owens Corning Preferred installation, and flexible monthly financing starting as low as $149/mo.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href={PHONE_HREF}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Phone size={16} /> Call {PHONE_NUMBER} For Free Estimate
              </a>

              <Link
                href="/#contact"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/15 transition-all flex items-center justify-center gap-2"
              >
                Request Proposal Online <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Legal Footer & Verification Notice */}
          <div className="text-center pt-4 border-t border-white/10 print:border-slate-300 text-[11px] text-slate-500 print:text-slate-600 space-y-1">
            <p>
              Rise Up Roofing &amp; Construction • California State License Board CSLB #1096492 • Bonded &amp; Insured
            </p>
            <p>
              Serving San Diego County &amp; Riverside County with 50-Year Non-Prorated Owens Corning Roofing Systems.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
