'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Sparkles,
  Home,
  Building2,
  Sun,
  Hammer,
  ShieldCheck,
  Phone,
  CheckCircle2,
  Camera,
  FileText,
  BadgePercent,
} from 'lucide-react';
import { Section } from '@/components/shared/Container';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { services } from '@/lib/data/services';
import { PHONE_HREF, PHONE_NUMBER, LICENSE_NUMBER } from '@/lib/utils';

// Premium high-res exterior roofing image for residential flagship (replaces interior room photo)
const RESIDENTIAL_EXTERIOR_HERO =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80';

export function ServicesOverview() {
  const residential = services.find((s) => s.slug === 'residential') || services[0];
  const repairs = services.find((s) => s.slug === 'repairs') || services[1];
  const commercial = services.find((s) => s.slug === 'commercial') || services[2];
  const solar = services.find((s) => s.slug === 'solar') || services[3];
  const construction = services.find((s) => s.slug === 'construction') || services[4];

  return (
    <Section id="services" alternate={false}>
      <SectionHeading
        label="Our Capabilities"
        title="Complete Roofing &amp; Construction Solutions"
        subtitle="Engineered for Southern California's coastal climate. Master craftsmanship backed by manufacturer warranties up to 50 years."
      />

      {/* Bento Grid Layout with Elevated White Shells */}
      <div className="space-y-6 lg:space-y-7">
        {/* Row 1: Asymmetric Flagship + Emergency Dispatch (7 cols + 5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-7">
          {/* Card 1: Flagship Residential Roofing (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 lg:p-7 flex flex-col justify-between border border-slate-200/80 hover:border-brand-blue/50 transition-all duration-300 shadow-[0_4px_20px_-4px_rgba(11,30,51,0.06),0_1px_3px_rgba(11,30,51,0.04)] hover:shadow-[0_12px_32px_-6px_rgba(47,159,227,0.16)] hover:-translate-y-1 group">
            <div>
              {/* Inset Framed Media Window */}
              <div className="relative h-60 sm:h-72 w-full rounded-2xl overflow-hidden mb-6 border border-slate-100 shadow-inner">
                <Image
                  src={RESIDENTIAL_EXTERIOR_HERO}
                  alt={residential.name}
                  fill
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  priority
                />
                {/* Subtle Image Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-black/35" />

                {/* Floating Badges inside Media Window */}
                <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-1.5 bg-black/65 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-brand-blue text-xs font-bold uppercase tracking-wider shadow-sm">
                    <Home className="w-3.5 h-3.5 text-brand-blue" />
                    <span>Residential Flagship</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 bg-brand-blue/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-brand-blue/40 text-white text-xs font-semibold shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5 text-white" />
                    <span>Up to 50-Year Warranty</span>
                  </div>
                </div>

                {/* Bottom Image Tag */}
                <div className="absolute bottom-3 left-4 z-10">
                  <span className="text-[11px] font-semibold text-white/90 bg-black/50 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-white/15">
                    Premium Coastal Relayments &amp; Shingles
                  </span>
                </div>
              </div>

              {/* Overline & Heading */}
              <div className="mb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-brand-blue block mb-1">
                  Owens Corning Preferred Contractor
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0B1E33] tracking-tight leading-snug group-hover:text-brand-blue transition-colors duration-200">
                  {residential.name}
                </h3>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-[#4E6478] leading-relaxed mb-5">
                {residential.shortDescription}
              </p>

              {/* Material Chips */}
              <div className="flex flex-wrap gap-2 mb-6">
                {[
                  'SureNail® Shingles',
                  'Spanish S-Tile Relay',
                  'High-Temp Underlayment',
                  'Boral & Eagle Tile',
                ].map((material) => (
                  <span
                    key={material}
                    className="text-[11px] font-semibold text-[#0B1E33] bg-slate-50 px-3 py-1 rounded-lg border border-slate-200/80"
                  >
                    {material}
                  </span>
                ))}
              </div>

              {/* Specs & Turnaround Row */}
              <div className="grid grid-cols-2 gap-4 py-3.5 border-y border-slate-100 mb-6">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#64748B] font-bold block">
                    Installation Turnaround
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-[#0B1E33] truncate block mt-0.5">
                    1–3 Days Typical
                  </span>
                </div>
                <div className="border-l border-slate-100 pl-4">
                  <span className="text-[10px] uppercase tracking-wider text-[#64748B] font-bold block">
                    City Permits &amp; Inspection
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-emerald-600 truncate block mt-0.5">
                    100% Handled by Rise Up
                  </span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <Link
              href="/services/residential"
              className="w-full py-3.5 px-6 rounded-xl bg-brand-blue hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-brand-blue/30 cursor-pointer"
            >
              <span>Explore Residential Systems</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Card 2: Emergency Repairs & Leak Diagnostics (5 Cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 lg:p-7 flex flex-col justify-between border border-emerald-500/30 hover:border-emerald-500 transition-all duration-300 shadow-[0_4px_20px_-4px_rgba(11,30,51,0.06),0_1px_3px_rgba(11,30,51,0.04)] hover:shadow-[0_12px_32px_-6px_rgba(16,185,129,0.18)] hover:-translate-y-1 group">
            <div>
              {/* Inset Framed Media Window */}
              <div className="relative h-60 sm:h-72 w-full rounded-2xl overflow-hidden mb-6 border border-emerald-50 shadow-inner">
                <Image
                  src={repairs.heroImage}
                  alt={repairs.name}
                  fill
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 42vw"
                />
                {/* Subtle Image Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-black/35" />

                {/* Floating Badges with Live Animated Radar Beacon */}
                <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2 bg-[#051F19]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-500/50 shadow-sm">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                      Live Dispatch Desk • Active
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-white bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/15">
                    Same-Day Available
                  </span>
                </div>

                {/* Bottom Image Tag */}
                <div className="absolute bottom-3 left-4 z-10">
                  <span className="text-[11px] font-semibold text-white/90 bg-black/50 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-white/15">
                    Rapid Wind &amp; Leak Isolation
                  </span>
                </div>
              </div>

              {/* Overline & Heading */}
              <div className="mb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 block mb-1">
                  Urgent Response Division
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0B1E33] tracking-tight leading-snug group-hover:text-emerald-600 transition-colors duration-200">
                  {repairs.name}
                </h3>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-[#4E6478] leading-relaxed mb-5">
                {repairs.shortDescription}
              </p>

              {/* Diagnostic Checklist */}
              <ul className="space-y-2.5 mb-6">
                {[
                  'HD Drone & Attic Thermal Moisture Scan',
                  'Exact Tile Matching Guarantee (Concrete & Clay)',
                  '26-Gauge Valley Metals & Flashing Replacement',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs font-medium text-[#1E293B]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {/* Diagnostic Spec Strip */}
              <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 mb-6">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#64748B] font-bold block">
                    Response Speed
                  </span>
                  <span className="text-xs font-extrabold text-[#0B1E33] truncate block mt-0.5">
                    Same-Day Priority Dispatch
                  </span>
                </div>
                <div className="border-l border-slate-100 pl-3">
                  <span className="text-[10px] uppercase tracking-wider text-[#64748B] font-bold block">
                    Workmanship
                  </span>
                  <span className="text-xs font-extrabold text-emerald-600 truncate block mt-0.5">
                    100% Guaranteed Repair
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Schedule & Instant Call */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Link
                href="/services/repairs"
                className="py-3 px-4 rounded-xl bg-brand-blue hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 shadow-md cursor-pointer"
              >
                <span>Book Diagnostic</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <a
                href={PHONE_HREF}
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 shadow-md cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Dispatch</span>
              </a>
            </div>
          </div>
        </div>

        {/* Row 2: Specialized Trio (3x 4 cols: Commercial, Solar, Construction) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7">
          {/* Card 3: Commercial Flat & Low-Slope (4 cols) */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 flex flex-col justify-between border border-slate-200/80 hover:border-purple-500/50 transition-all duration-300 shadow-[0_4px_20px_-4px_rgba(11,30,51,0.06),0_1px_3px_rgba(11,30,51,0.04)] hover:shadow-[0_12px_32px_-6px_rgba(139,92,246,0.16)] hover:-translate-y-1 group">
            <div>
              {/* Inset Framed Media Window */}
              <div className="relative h-48 sm:h-52 w-full rounded-2xl overflow-hidden mb-5 border border-slate-100 shadow-inner">
                <Image
                  src={commercial.heroImage}
                  alt={commercial.name}
                  fill
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-black/35" />

                {/* Top Badge inside Image */}
                <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase text-purple-300 bg-black/65 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/20 shadow-sm">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Commercial Flat</span>
                  </span>
                  <span className="text-[10px] font-bold text-white bg-purple-600/90 backdrop-blur-md px-2 py-0.5 rounded-lg border border-purple-400/40">
                    Title 24
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <h3 className="text-xl sm:text-2xl font-bold text-[#0B1E33] tracking-tight leading-snug mb-2 group-hover:text-purple-600 transition-colors duration-200">
                {commercial.name}
              </h3>

              <p className="text-xs sm:text-[13px] text-[#4E6478] leading-relaxed mb-4 line-clamp-2">
                {commercial.shortDescription}
              </p>

              {/* Spec Row */}
              <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 mb-5">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#64748B] font-bold block">
                    Membrane Systems
                  </span>
                  <span className="text-xs font-extrabold text-[#0B1E33] truncate block mt-0.5">
                    Carlisle TPO &amp; BUR
                  </span>
                </div>
                <div className="border-l border-slate-100 pl-3">
                  <span className="text-[10px] uppercase tracking-wider text-[#64748B] font-bold block">
                    Manufacturer Term
                  </span>
                  <span className="text-xs font-extrabold text-purple-700 truncate block mt-0.5">
                    30-Yr NDL Available
                  </span>
                </div>
              </div>
            </div>

            {/* Button */}
            <Link
              href="/services/commercial"
              className="w-full py-3 px-5 rounded-xl bg-brand-blue group-hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 shadow-md cursor-pointer"
            >
              <span>Explore Commercial</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Card 4: Solar Roofing & Energy Storage (4 cols) */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 flex flex-col justify-between border border-slate-200/80 hover:border-amber-400/50 transition-all duration-300 shadow-[0_4px_20px_-4px_rgba(11,30,51,0.06),0_1px_3px_rgba(11,30,51,0.04)] hover:shadow-[0_12px_32px_-6px_rgba(234,166,54,0.16)] hover:-translate-y-1 group">
            <div>
              {/* Inset Framed Media Window */}
              <div className="relative h-48 sm:h-52 w-full rounded-2xl overflow-hidden mb-5 border border-slate-100 shadow-inner">
                <Image
                  src={solar.heroImage}
                  alt={solar.name}
                  fill
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-black/35" />

                {/* Top Badge inside Image */}
                <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase text-amber-300 bg-black/65 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/20 shadow-sm">
                    <Sun className="w-3.5 h-3.5" />
                    <span>Solar &amp; Storage</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-300 px-2 py-0.5 rounded-lg shadow-xs">
                    <BadgePercent className="w-3 h-3 text-amber-900" />
                    <span>Save 30%</span>
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <h3 className="text-xl sm:text-2xl font-bold text-[#0B1E33] tracking-tight leading-snug mb-2 group-hover:text-amber-600 transition-colors duration-200">
                {solar.name}
              </h3>

              <p className="text-xs sm:text-[13px] text-[#4E6478] leading-relaxed mb-4 line-clamp-2">
                {solar.shortDescription}
              </p>

              {/* Spec Row */}
              <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 mb-5">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#64748B] font-bold block">
                    Battery Storage
                  </span>
                  <span className="text-xs font-extrabold text-[#0B1E33] truncate block mt-0.5">
                    Tesla &amp; Enphase
                  </span>
                </div>
                <div className="border-l border-slate-100 pl-3">
                  <span className="text-[10px] uppercase tracking-wider text-[#64748B] font-bold block">
                    Roof Warranty
                  </span>
                  <span className="text-xs font-extrabold text-amber-600 truncate block mt-0.5">
                    100% Preserved
                  </span>
                </div>
              </div>
            </div>

            {/* Button */}
            <Link
              href="/services/solar"
              className="w-full py-3 px-5 rounded-xl bg-brand-blue group-hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 shadow-md cursor-pointer"
            >
              <span>Explore Solar</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Card 5: General Construction & Builder Division (4 cols) */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 flex flex-col justify-between border border-slate-200/80 hover:border-[#C85A2A]/50 transition-all duration-300 shadow-[0_4px_20px_-4px_rgba(11,30,51,0.06),0_1px_3px_rgba(11,30,51,0.04)] hover:shadow-[0_12px_32px_-6px_rgba(200,90,42,0.16)] hover:-translate-y-1 group">
            <div>
              {/* Inset Framed Media Window */}
              <div className="relative h-48 sm:h-52 w-full rounded-2xl overflow-hidden mb-5 border border-slate-100 shadow-inner">
                <Image
                  src={construction.heroImage}
                  alt={construction.name}
                  fill
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-black/35" />

                {/* Top Badge inside Image */}
                <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase text-[#FB923C] bg-black/65 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/20 shadow-sm">
                    <Hammer className="w-3.5 h-3.5" />
                    <span>General Contractor</span>
                  </span>
                  <span className="text-[10px] font-bold text-white bg-[#C85A2A]/90 backdrop-blur-md px-2 py-0.5 rounded-lg border border-orange-400/40">
                    CA #{LICENSE_NUMBER}
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <h3 className="text-xl sm:text-2xl font-bold text-[#0B1E33] tracking-tight leading-snug mb-2 group-hover:text-[#C85A2A] transition-colors duration-200">
                {construction.name}
              </h3>

              <p className="text-xs sm:text-[13px] text-[#4E6478] leading-relaxed mb-4 line-clamp-2">
                {construction.shortDescription}
              </p>

              {/* Spec Row */}
              <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 mb-5">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#64748B] font-bold block">
                    Restoration
                  </span>
                  <span className="text-xs font-extrabold text-[#0B1E33] truncate block mt-0.5">
                    Fascia, Soffit &amp; Dry Rot
                  </span>
                </div>
                <div className="border-l border-slate-100 pl-3">
                  <span className="text-[10px] uppercase tracking-wider text-[#64748B] font-bold block">
                    Exterior Upgrades
                  </span>
                  <span className="text-xs font-extrabold text-[#C85A2A] truncate block mt-0.5">
                    James Hardie &amp; Patios
                  </span>
                </div>
              </div>
            </div>

            {/* Button */}
            <Link
              href="/services/construction"
              className="w-full py-3 px-5 rounded-xl bg-brand-blue group-hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 shadow-md cursor-pointer"
            >
              <span>Explore Construction</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Section 3: The 21-Point Digital Health Audit Showpiece (Full-Width High-Converting Ribbon) */}
        <div className="relative rounded-3xl overflow-hidden border border-amber-400/35 bg-gradient-to-br from-[#0B1E33] via-[#0E2745] to-[#071524] p-6 sm:p-8 lg:p-10 shadow-[0_20px_50px_-10px_rgba(11,30,51,0.20)]">
          {/* Ambient Lighting Accents */}
          <div className="absolute -right-24 -top-24 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-24 -bottom-24 w-96 h-96 bg-brand-blue/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            {/* Ribbon Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-white/10">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-wider uppercase text-amber-400 bg-amber-400/10 px-3.5 py-1.5 rounded-xl border border-amber-400/25 mb-3.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Complimentary Homeowner Service</span>
                </div>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight mb-2.5">
                  Free 21-Point Digital Roof &amp; Attic Health Audit
                </h3>
                <p className="text-sm sm:text-base text-white/80 leading-relaxed">
                  Not sure what your roof needs? We combine high-resolution aerial drone scans with attic moisture inspections, giving you photographic evidence and honest pricing with zero sales pressure.
                </p>
              </div>

              {/* High-Converting CTA */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 shrink-0">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2.5 bg-amber-400 hover:bg-amber-300 text-[#0B1E33] font-extrabold text-sm uppercase tracking-wider px-8 py-4 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-amber-400/30 hover:scale-[1.02] cursor-pointer"
                >
                  <span>Claim Free 21-Point Inspection</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>100% Free • Zero Obligation • Licensed &amp; Insured</span>
                </div>
              </div>
            </div>

            {/* 3-Step Audit Process Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-8">
              {/* Step 1 */}
              <div className="rounded-2xl bg-white/[0.04] backdrop-blur-xs border border-white/10 p-5 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="w-9 h-9 rounded-xl bg-brand-blue/20 border border-brand-blue/40 flex items-center justify-center text-brand-blue font-extrabold text-xs">
                    01
                  </span>
                  <Camera className="w-5 h-5 text-brand-blue" />
                </div>
                <h4 className="text-base font-bold text-white mb-1.5">
                  Aerial Drone Scan
                </h4>
                <p className="text-xs sm:text-[13px] text-white/70 leading-relaxed">
                  4K high-resolution imaging of all roof pitches, valleys, ridge caps, and perimeter drip edges without cracking fragile tiles.
                </p>
              </div>

              {/* Step 2 */}
              <div className="rounded-2xl bg-white/[0.04] backdrop-blur-xs border border-white/10 p-5 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-extrabold text-xs">
                    02
                  </span>
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <h4 className="text-base font-bold text-white mb-1.5">
                  Attic &amp; Flashing Check
                </h4>
                <p className="text-xs sm:text-[13px] text-white/70 leading-relaxed">
                  Direct inspection of underlayment, attic moisture, chimney flashings, skylights, and pipe boot seals where 90% of leaks begin.
                </p>
              </div>

              {/* Step 3 */}
              <div className="rounded-2xl bg-white/[0.04] backdrop-blur-xs border border-white/10 p-5 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 font-extrabold text-xs">
                    03
                  </span>
                  <FileText className="w-5 h-5 text-amber-400" />
                </div>
                <h4 className="text-base font-bold text-white mb-1.5">
                  Itemized Digital Report
                </h4>
                <p className="text-xs sm:text-[13px] text-white/70 leading-relaxed">
                  Complete photographic condition report delivered to your inbox with clear repair vs. replace guidance and transparent fixed pricing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View All Services Bottom Banner */}
      <div className="text-center mt-10 sm:mt-12">
        <Link href="/services">
          <span className="inline-flex items-center gap-2 bg-white hover:bg-brand-blue hover:text-white border border-slate-200/80 hover:border-brand-blue text-[#0B1E33] font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-2xl transition-all shadow-xs hover:shadow-md cursor-pointer">
            <span>Explore All Roofing &amp; Construction Divisions</span>
            <ArrowRight className="w-4 h-4" />
          </span>
        </Link>
      </div>
    </Section>
  );
}
