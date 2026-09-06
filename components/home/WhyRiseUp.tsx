'use client';

import Link from 'next/link';
import {
  ShieldCheck,
  Star,
  CheckCircle2,
  Hammer,
  ArrowRight,
  Sparkles,
  Building2,
} from 'lucide-react';
import { Section } from '@/components/shared/Container';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { LICENSE_NUMBER } from '@/lib/utils';
import type { ReviewStats } from '@/lib/reviews-server';

export function WhyRiseUp({ stats }: { stats?: ReviewStats }) {
  const ratingText = stats?.averageRating ? stats.averageRating.toFixed(1) : '5.0';
  const reviewsLabel = stats?.totalCount ? `${stats.totalCount} Verified Reviews` : 'Verified Reviews';
  return (
    <Section id="why-us" alternate={true}>
      <SectionHeading
        label="Why Rise Up"
        title="Built on Trust, Proven by Results"
        subtitle="We combine master craftsmanship, premium Owens Corning materials, and transparent pricing to deliver roofing systems that endure Southern California weather for decades."
      />

      {/* Modern Bento Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Large Featured Card (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-7 sm:p-9 flex flex-col justify-between relative overflow-hidden border border-slate-100/80 hover:border-brand-blue/30 transition-all duration-300 group shadow-[0_1px_3px_rgba(11,30,51,0.04),0_8px_24px_-4px_rgba(11,30,51,0.08),0_24px_48px_-8px_rgba(11,30,51,0.05)] hover:shadow-[0_8px_24px_-4px_rgba(47,159,227,0.12),0_1px_3px_rgba(11,30,51,0.04)] hover:-translate-y-0.5">
          {/* Accent top edge line */}
          <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-brand-blue/40 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div>
            {/* Top Tag & License */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Master Craftsmanship</span>
              </span>
              <span className="text-xs font-medium text-[var(--text-muted)] bg-slate-50 px-3 py-1 rounded-full border border-slate-200/80">
                CA Lic #{LICENSE_NUMBER}
              </span>
            </div>

            {/* Stat Title */}
            <div className="flex flex-wrap items-baseline gap-3 mb-3">
              <span className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[var(--text-primary)] tracking-tight">
                25+ Years
              </span>
              <span className="text-brand-blue font-bold text-sm sm:text-base uppercase tracking-wider">
                San Diego Experience
              </span>
            </div>

            {/* Core Description */}
            <p className="text-xs sm:text-sm lg:text-[15px] text-[var(--text-secondary)] leading-relaxed max-w-xl mb-6">
              Serving San Diego County homeowners and businesses with continuous master craftsmanship. Every roof is engineered strictly to manufacturer specifications for maximum wind, heat, and coastal protection.
            </p>

            {/* 4 Pillars Checklist with soft icon chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {[
                'Owens Corning Preferred Contractor',
                'Zero Subcontractor Policy',
                'Up to 50-Year Manufacturer Warranties',
                'Permits & Final Inspection Guaranteed',
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-200/60 hover:border-brand-blue/30 transition-colors"
                >
                  <div className="w-7 h-7 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-[var(--text-primary)] leading-tight">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Bar */}
          <div className="pt-5 border-t border-slate-100 flex items-center justify-between gap-4 mt-auto">
            <span className="text-xs font-medium text-[var(--text-muted)]">
              Trusted by 1,000+ SoCal families
            </span>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 text-xs font-bold text-brand-blue hover:text-[#1C88DD] uppercase tracking-wider transition-colors group/link bg-blue-50 hover:bg-blue-100 px-3.5 py-1.5 rounded-xl border border-blue-100"
            >
              <span>Our Standards</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Right Column (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Card 2: 1,000+ Roofs Installed */}
          <div className="bg-white rounded-3xl p-7 flex flex-col justify-between border border-slate-100/80 hover:border-brand-blue/30 transition-all duration-300 group flex-1 shadow-[0_1px_3px_rgba(11,30,51,0.04),0_8px_24px_-4px_rgba(11,30,51,0.07),0_24px_48px_-8px_rgba(11,30,51,0.04)] hover:shadow-[0_8px_24px_-4px_rgba(47,159,227,0.12),0_1px_3px_rgba(11,30,51,0.04)] hover:-translate-y-0.5 relative overflow-hidden">
            {/* Accent top edge */}
            <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-brand-blue/40 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight block">
                    1,000+
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-blue mt-1 block">
                    Roofs Successfully Installed
                  </span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-brand-blue flex-shrink-0 group-hover:scale-105 transition-all shadow-[0_2px_8px_rgba(47,159,227,0.12)]">
                  <Hammer className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs sm:text-[13px] text-[var(--text-secondary)] leading-relaxed">
                Premier residential tile, architectural shingle, and commercial flat systems successfully completed across San Diego &amp; Orange County.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
              <span>100% Passed Final City Inspections</span>
            </div>
          </div>

          {/* Sub-grid with 2 Proof Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* 4.9 Rating Card */}
            <div className="bg-white rounded-3xl p-6 flex flex-col justify-between border border-slate-100/80 hover:border-amber-400/40 transition-all duration-300 group shadow-[0_1px_3px_rgba(11,30,51,0.04),0_8px_20px_-4px_rgba(11,30,51,0.07)] hover:shadow-[0_8px_24px_-4px_rgba(234,166,54,0.14)] hover:-translate-y-0.5 relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center gap-1 text-amber-400 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight block">
                  {ratingText} / 5.0
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mt-1 block">
                  {reviewsLabel}
                </span>
              </div>
            </div>

            {/* $2M Bonded Card */}
            <div className="bg-white rounded-3xl p-6 flex flex-col justify-between border border-slate-100/80 hover:border-emerald-500/40 transition-all duration-300 group shadow-[0_1px_3px_rgba(11,30,51,0.04),0_8px_20px_-4px_rgba(11,30,51,0.07)] hover:shadow-[0_8px_24px_-4px_rgba(16,185,129,0.14)] hover:-translate-y-0.5 relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Verified Bonded
                </span>
                <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight block">
                  $2M+
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mt-1 block">
                  Liability &amp; Workers Comp
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
