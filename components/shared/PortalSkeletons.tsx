import React from 'react';
import { Skeleton } from '@/components/shared/Skeleton';
import { ShieldCheck, FileText, ClipboardCheck, Sparkles, CheckCircle2 } from 'lucide-react';

export function ProposalDocumentSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Document Header & Trust Badges */}
        <div className="p-6 rounded-3xl bg-slate-900/70 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <FileText size={28} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="w-40 h-5" />
                <Skeleton className="w-24 h-5 rounded-full bg-emerald-500/20" />
              </div>
              <Skeleton className="w-64 h-3.5" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="w-32 h-9 rounded-xl" />
            <Skeleton className="w-28 h-9 rounded-xl bg-amber-500/20" />
          </div>
        </div>

        {/* Customer & Scope of Work Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-white/10 space-y-6">
          <div className="border-b border-white/5 pb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Skeleton className="w-24 h-3 rounded-full" />
              <Skeleton className="w-48 h-6" />
              <Skeleton className="w-60 h-4" />
              <Skeleton className="w-36 h-4" />
            </div>
            <div className="space-y-2 md:text-right flex flex-col md:items-end">
              <Skeleton className="w-28 h-3 rounded-full" />
              <Skeleton className="w-36 h-6" />
              <Skeleton className="w-44 h-4" />
            </div>
          </div>

          {/* Roof Specifications Metric Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-3.5 rounded-2xl bg-slate-800/40 border border-white/5 space-y-1.5">
                <Skeleton className="w-16 h-3" />
                <Skeleton className="w-24 h-5" />
              </div>
            ))}
          </div>

          {/* Line Items List */}
          <div className="space-y-3 pt-2">
            <Skeleton className="w-36 h-4" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-950/40 border border-white/5 flex items-center justify-between">
                <div className="space-y-1.5 w-3/4">
                  <Skeleton className="w-48 h-4" />
                  <Skeleton className="w-full h-3" />
                </div>
                <Skeleton className="w-20 h-5" />
              </div>
            ))}
          </div>
        </div>

        {/* 3 Tier Pricing Cards (Good / Better / Best) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((tier) => (
            <div
              key={tier}
              className={`p-6 rounded-3xl border bg-slate-900/60 flex flex-col justify-between space-y-6 ${
                tier === 2 ? 'border-amber-500/40 shadow-xl shadow-amber-500/5' : 'border-white/10'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="w-24 h-5 rounded-full" />
                  {tier === 2 && <Skeleton className="w-20 h-4 rounded-full bg-amber-500/20" />}
                </div>
                <Skeleton className="w-36 h-8" />
                <Skeleton className="w-full h-3.5" />
                <div className="space-y-2 pt-4 border-t border-white/5">
                  <Skeleton className="w-5/6 h-3" />
                  <Skeleton className="w-4/6 h-3" />
                  <Skeleton className="w-full h-3" />
                </div>
              </div>
              <Skeleton className="w-full h-11 rounded-xl bg-slate-800/70" />
            </div>
          ))}
        </div>

        {/* Digital Signature Box Skeleton */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-white/10 space-y-5">
          <Skeleton className="w-48 h-6" />
          <Skeleton className="w-full h-12 rounded-xl" />
          <div className="flex items-center justify-between pt-2">
            <Skeleton className="w-64 h-4" />
            <Skeleton className="w-44 h-12 rounded-xl bg-amber-500/20" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function InspectionReportSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Inspection Header */}
        <div className="p-6 rounded-3xl bg-slate-900/70 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ClipboardCheck size={28} />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="w-48 h-5" />
              <Skeleton className="w-64 h-3.5" />
            </div>
          </div>
          <Skeleton className="w-32 h-8 rounded-full" />
        </div>

        {/* Roof Health Score & Inspection Overview */}
        <div className="p-8 rounded-3xl bg-slate-900/60 border border-white/10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Circular Gauge Skeleton */}
          <div className="md:col-span-4 flex flex-col items-center justify-center text-center">
            <div className="w-36 h-36 rounded-full border-8 border-slate-800 flex items-center justify-center relative">
              <Skeleton className="w-16 h-10" />
            </div>
            <Skeleton className="w-28 h-4 mt-3" />
          </div>

          {/* Details Breakdown */}
          <div className="md:col-span-8 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-white/5 space-y-1.5">
                <Skeleton className="w-20 h-3" />
                <Skeleton className="w-32 h-5" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-white/5 space-y-1.5">
                <Skeleton className="w-24 h-3" />
                <Skeleton className="w-28 h-5" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="w-full h-3.5" />
              <Skeleton className="w-5/6 h-3.5" />
            </div>
          </div>
        </div>

        {/* 12-Point Checklist Findings Grid */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-white/10 space-y-4">
          <Skeleton className="w-48 h-5 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-950/40 border border-white/5 flex items-center justify-between">
                <div className="space-y-1 w-3/4">
                  <Skeleton className="w-36 h-4" />
                  <Skeleton className="w-48 h-3" />
                </div>
                <Skeleton className="w-16 h-6 rounded-full bg-emerald-500/20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function WarrantyCertificateSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Certificate Frame */}
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/80 border-2 border-amber-500/30 relative shadow-2xl space-y-8">
          {/* Header Seal */}
          <div className="text-center space-y-3 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck size={36} />
            </div>
            <Skeleton className="w-64 h-7 mx-auto" />
            <Skeleton className="w-44 h-4 mx-auto" />
          </div>

          {/* Certificate Body */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/10">
            <div className="p-4 rounded-2xl bg-slate-950/50 border border-white/5 space-y-1.5">
              <Skeleton className="w-20 h-3" />
              <Skeleton className="w-36 h-5" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/50 border border-white/5 space-y-1.5">
              <Skeleton className="w-24 h-3" />
              <Skeleton className="w-40 h-5" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/50 border border-white/5 space-y-1.5">
              <Skeleton className="w-28 h-3" />
              <Skeleton className="w-32 h-5" />
            </div>
          </div>

          {/* Coverage Summary */}
          <div className="p-6 rounded-2xl bg-slate-950/60 border border-white/5 space-y-3">
            <Skeleton className="w-48 h-5" />
            <div className="space-y-2">
              <Skeleton className="w-full h-3.5" />
              <Skeleton className="w-5/6 h-3.5" />
              <Skeleton className="w-4/6 h-3.5" />
            </div>
          </div>

          {/* Certificate Footer Stamp */}
          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Skeleton className="w-44 h-5" />
            <Skeleton className="w-36 h-10 rounded-xl bg-amber-500/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
