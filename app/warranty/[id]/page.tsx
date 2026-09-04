'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Award,
  Calendar,
  CheckCircle2,
  Printer,
  Phone,
  Home,
  MapPin,
  FileText,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react';

interface WarrantyData {
  id: number;
  warranty_number: string;
  warranty_type: string;
  start_date: string;
  expiration_date: string;
  coverage_details: string;
  status: string;
  job_number?: string;
  customer_name?: string;
  address?: string;
  city?: string;
  zip?: string;
  service_type?: string;
  material_type?: string;
  roof_squares?: number;
  roof_pitch?: string;
}

export default function WarrantyCertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [warranty, setWarranty] = useState<WarrantyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/warranty/${id}`);
        if (!res.ok) {
          throw new Error('Warranty certificate not found or invalid.');
        }
        const data = await res.json();
        setWarranty(data.warranty);
      } catch (err: any) {
        setError(err.message || 'Error loading warranty certificate');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-10 h-10 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold">Verifying Warranty Certificate...</span>
      </div>
    );
  }

  if (error || !warranty) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-md p-6 rounded-3xl bg-slate-900 border border-white/10 space-y-4">
          <ShieldCheck size={48} className="mx-auto text-rose-400" />
          <h1 className="text-lg font-black text-white">Certificate Not Found</h1>
          <p className="text-xs text-slate-400">{error || 'This warranty certificate does not exist.'}</p>
          <Link
            href="/"
            className="inline-block px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Top Action Bar (hidden when printing) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <Link
          href="/"
          className="text-xs font-semibold text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
        >
          <Zap size={14} className="text-amber-400" />
          Rise Up Roofing &amp; Construction
        </Link>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-400/30 text-xs font-bold transition-all shadow-md cursor-pointer"
        >
          <Printer size={14} />
          Print / Download Certificate
        </button>
      </div>

      {/* Main Certificate Sheet */}
      <div className="max-w-4xl mx-auto bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 rounded-3xl border-2 border-amber-400/40 p-6 sm:p-12 shadow-2xl relative overflow-hidden print:border-slate-400 print:p-8 print:bg-white print:text-black">
        {/* Decorative Gold Header Stamp */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-b-2 border-amber-400/30 pb-6 gap-6">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 shadow-lg flex-shrink-0">
              <ShieldCheck size={36} />
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold tracking-widest text-amber-400 uppercase">
                Official Certificate of Warranty
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Rise Up Roofing &amp; Construction
              </h1>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 justify-center sm:justify-start flex-wrap">
                <span className="font-semibold text-slate-300">CSLB License #1096492</span>
                <span>•</span>
                <span className="text-amber-400 font-semibold">Owens Corning Preferred Contractor</span>
              </div>
            </div>
          </div>

          <div className="text-center sm:text-right bg-slate-950/70 p-3.5 rounded-2xl border border-white/10 print:bg-slate-100 print:text-black">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Certificate Number
            </span>
            <span className="font-mono text-lg font-black text-amber-400 tracking-wider">
              {warranty.warranty_number}
            </span>
            <span className="text-[10px] text-emerald-400 font-bold block mt-0.5">
              ● VERIFIED ACTIVE
            </span>
          </div>
        </div>

        {/* Certificate Body */}
        <div className="py-8 space-y-8">
          {/* Main Title Banner */}
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {warranty.warranty_type}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
              This certifies that the roofing system at the specified property was professionally installed in strict accordance with California Building Code standards and manufacturer specifications.
            </p>
          </div>

          {/* Property & Homeowner Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-950/60 border border-white/5 print:bg-slate-50 print:border-slate-300">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Registered Homeowner
              </span>
              <div className="text-base font-bold text-white mt-0.5">
                {warranty.customer_name || 'Property Owner'}
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                <MapPin size={13} className="text-amber-400 flex-shrink-0" />
                <span>
                  {warranty.address ? `${warranty.address}, ${warranty.city || 'CA'} ${warranty.zip || ''}` : 'San Diego County, CA'}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Roofing Installation Specs
              </span>
              <div className="text-base font-bold text-white mt-0.5">
                {warranty.material_type || warranty.service_type || 'Full Roof Replacement'}
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                {warranty.roof_squares && (
                  <span>Roof Size: <strong>{warranty.roof_squares} Squares</strong> (~{Number(warranty.roof_squares) * 100} SQF)</span>
                )}
                {warranty.job_number && (
                  <span>• Project: <strong>{warranty.job_number}</strong></span>
                )}
              </div>
            </div>
          </div>

          {/* Coverage Term Dates Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/20 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Effective Date</span>
              <div className="text-base font-black text-white mt-1">{warranty.start_date}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/20 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Warranty Expiration</span>
              <div className="text-base font-black text-amber-400 mt-1">{warranty.expiration_date}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-blue-500/20 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Rise Up Guarantee</span>
              <div className="text-base font-black text-blue-400 mt-1">10-Year Workmanship</div>
            </div>
          </div>

          {/* Warranty Terms & Protection Details */}
          <div className="p-6 rounded-2xl bg-slate-950/60 border border-white/5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles size={14} /> Comprehensive Coverage Inclusions
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>50-Year Non-Prorated Material Protection:</strong> Covers manufacturing defects in shingles, starter strips, and ridge caps.
                </span>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>130 MPH Wind Blow-Off Warranty:</strong> High-performance SureNail fastener technology withstands gale-force coastal winds.
                </span>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>10-Year Rise Up Workmanship Guarantee:</strong> Covers 100% of labor and repairs for flashings, valleys, and underlayment.
                </span>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Transferable Protection:</strong> Transferable to the next homeowner if you sell your home within the warranty term.
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 pt-2 border-t border-white/5 leading-relaxed">
              {warranty.coverage_details}
            </p>
          </div>

          {/* Complimentary Post-Job Inspections */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/30 via-slate-900 to-indigo-950/30 border border-blue-500/20 text-xs text-slate-300 space-y-1">
            <h4 className="font-bold text-white flex items-center gap-2">
              <Calendar size={14} className="text-blue-400" />
              Complimentary 6-Month &amp; 1-Year Follow-up Inspections Included
            </h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Rise Up Roofing provides automated 6-month and 1-year drone and physical valley inspections to ensure your roof performs flawlessly through Southern California rainy seasons.
            </p>
          </div>
        </div>

        {/* Official Footer with Signatures */}
        <div className="pt-8 border-t-2 border-amber-400/20 grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
          <div>
            <div className="w-48 border-b border-white/30 pb-1 mb-1.5 font-serif italic text-amber-400 text-lg">
              Rise Up Roofing &amp; Construction
            </div>
            <p className="text-xs font-bold text-white">Authorized Warranty Officer</p>
            <p className="text-[10px] text-slate-400">California State License Board #1096492</p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <p className="text-xs font-semibold text-slate-300">Warranty Support &amp; Transfer Claims</p>
            <a
              href="tel:7606221230"
              className="text-amber-400 font-black text-base hover:underline flex items-center sm:justify-end gap-1"
            >
              <Phone size={14} /> (760) 622-1230
            </a>
            <p className="text-[10px] text-slate-400 font-mono">
              Escondido, CA • Serving All San Diego &amp; Riverside County
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
