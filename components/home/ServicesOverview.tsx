'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Section } from '@/components/shared/Container';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { services } from '@/lib/data/services';

const SERVICE_SPECS: Record<
  string,
  {
    category: string;
    spec1Label: string;
    spec1Value: string;
    spec2Label: string;
    spec2Value: string;
  }
> = {
  residential: {
    category: 'Residential',
    spec1Label: 'Warranty',
    spec1Value: 'Up to 50 Years',
    spec2Label: 'Turnaround',
    spec2Value: '1–3 Days Typical',
  },
  repairs: {
    category: 'Emergency & Maintenance',
    spec1Label: 'Dispatch',
    spec1Value: 'Same-Day Service',
    spec2Label: 'Guarantee',
    spec2Value: '100% Workmanship',
  },
  commercial: {
    category: 'Commercial Flat',
    spec1Label: 'Systems',
    spec1Value: 'TPO & Coatings',
    spec2Label: 'Warranty',
    spec2Value: '30-Yr NDL Available',
  },
  solar: {
    category: 'Solar & Storage',
    spec1Label: 'Federal Incentive',
    spec1Value: 'Save 30% Tax Credit',
    spec2Label: 'Storage',
    spec2Value: 'Tesla & Enphase',
  },
  construction: {
    category: 'General Contractor',
    spec1Label: 'Licensing',
    spec1Value: 'Class B General Builder',
    spec2Label: 'Specialty',
    spec2Value: 'Siding & Framing',
  },
};

export function ServicesOverview() {
  return (
    <Section id="services" dark={true} alternate={false}>
      <SectionHeading
        label="Our Capabilities"
        title="Complete Roofing &amp; Construction Solutions"
        subtitle="Engineered for Southern California's coastal climate. Master craftsmanship backed by manufacturer warranties up to 50 years."
        dark={true}
      />

      {/* Balanced 3x2 Grid using Global Card Radius (rounded-3xl) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7">
        {services.map((service) => {
          const specs = SERVICE_SPECS[service.slug] || {
            category: 'Roofing Division',
            spec1Label: 'Warranty',
            spec1Value: service.warranty || 'Manufacturer',
            spec2Label: 'Financing',
            spec2Value: 'Available',
          };

          return (
            <Link
              key={service.slug}
              href={`/services/${service.slug}`}
              className="group relative rounded-3xl overflow-hidden flex flex-col justify-end min-h-[450px] sm:min-h-[480px] border border-slate-200/60 dark:border-white/15 hover:border-brand-blue/70 transition-all duration-300 shadow-[0_16px_40px_-10px_rgba(11,30,51,0.10)] dark:shadow-2xl hover:-translate-y-1.5 hover:shadow-[0_24px_50px_-10px_rgba(47,159,227,0.25)] cursor-pointer"
            >
              {/* Full Bleed Background Image */}
              <Image
                src={service.heroImage}
                alt={service.name}
                fill
                className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />

              {/* Multi-stop Deep Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1B2B] via-[#0B1B2B]/85 via-55% to-black/35 transition-opacity duration-300 group-hover:via-[#0B1B2B]/75" />

              {/* Top Category Badge */}
              <div className="absolute top-4 left-5 z-10">
                <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-brand-blue bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl border border-white/15 shadow-sm">
                  {specs.category}
                </span>
              </div>

              {/* Card Bottom Content Area */}
              <div className="relative z-10 p-5 sm:p-6 flex flex-col justify-end">
                {/* Title */}
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug mb-2 group-hover:text-brand-blue transition-colors duration-200">
                  {service.name}
                </h3>

                {/* Description */}
                <p className="text-xs sm:text-[13px] text-white/80 leading-relaxed line-clamp-2 sm:line-clamp-3 mb-4">
                  {service.shortDescription}
                </p>

                {/* Clean Architectural Spec Row */}
                <div className="grid grid-cols-2 gap-3 py-3 border-y border-white/15 mb-5">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-white/50 font-medium block">
                      {specs.spec1Label}
                    </span>
                    <span className="text-xs font-bold text-white truncate block mt-0.5">
                      {specs.spec1Value}
                    </span>
                  </div>
                  <div className="border-l border-white/15 pl-3">
                    <span className="text-[10px] uppercase tracking-wider text-white/50 font-medium block">
                      {specs.spec2Label}
                    </span>
                    <span className="text-xs font-bold text-brand-blue truncate block mt-0.5">
                      {specs.spec2Value}
                    </span>
                  </div>
                </div>

                {/* Global Website Button Style */}
                <div className="w-full py-3 px-5 rounded-xl bg-brand-blue text-white group-hover:brightness-110 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 shadow-md group-hover:shadow-brand-blue/30">
                  <span>Explore Service</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          );
        })}

        {/* 6th Card: Free 21-Point Inspection */}
        <Link
          href="/contact"
          className="group relative rounded-3xl overflow-hidden flex flex-col justify-end min-h-[450px] sm:min-h-[480px] border border-amber-400/40 hover:border-amber-400 transition-all duration-300 shadow-[0_16px_40px_-10px_rgba(11,30,51,0.10)] dark:shadow-2xl hover:-translate-y-1.5 hover:shadow-amber-400/25 cursor-pointer"
        >
          {/* Full Bleed Background Image for 6th Card */}
          <Image
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"
            alt="Free 21-Point Roof Inspection"
            fill
            className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />

          {/* Multi-stop Deep Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1B2B] via-[#0B1B2B]/85 via-55% to-black/35 transition-opacity duration-300 group-hover:via-[#0B1B2B]/75" />

          {/* Top Category Badge */}
          <div className="absolute top-4 left-5 z-10">
            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-[#EAA636] bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl border border-white/15 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Complimentary</span>
            </span>
          </div>

          {/* Card Bottom Content Area */}
          <div className="relative z-10 p-5 sm:p-6 flex flex-col justify-end">
            {/* Title */}
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug mb-2 group-hover:text-amber-400 transition-colors duration-200">
              Free 21-Point Roof Inspection
            </h3>

            {/* Description */}
            <p className="text-xs sm:text-[13px] text-white/80 leading-relaxed line-clamp-2 sm:line-clamp-3 mb-4">
              Not sure what your roof needs? Get a complete on-site drone and physical assessment with photo reports and honest pricing.
            </p>

            {/* Clean Architectural Spec Row */}
            <div className="grid grid-cols-2 gap-3 py-3 border-y border-white/15 mb-5">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-white/50 font-medium block">
                  Assessment
                </span>
                <span className="text-xs font-bold text-white truncate block mt-0.5">
                  Drone &amp; Physical
                </span>
              </div>
              <div className="border-l border-white/15 pl-3">
                <span className="text-[10px] uppercase tracking-wider text-white/50 font-medium block">
                  Commitment
                </span>
                <span className="text-xs font-bold text-[#10B981] truncate block mt-0.5">
                  100% Free / Zero Obligation
                </span>
              </div>
            </div>

            {/* Global Website Button Style */}
            <div className="w-full py-3 px-5 rounded-xl bg-brand-blue text-white group-hover:brightness-110 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 shadow-md group-hover:shadow-brand-blue/30">
              <span>Book Free Inspection</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </div>
          </div>
        </Link>
      </div>

      {/* View All Services Bottom Banner */}
      <div className="text-center mt-10 sm:mt-12">
        <Link href="/services">
          <span className="inline-flex items-center gap-2 bg-white dark:bg-[#0B1B2B] hover:bg-brand-blue hover:text-white border border-slate-200/80 dark:border-white/15 hover:border-brand-blue text-[#0B1E33] dark:text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-2xl transition-all shadow-xs hover:shadow-md cursor-pointer">
            <span>Explore All Roofing &amp; Construction Divisions</span>
            <ArrowRight className="w-4 h-4" />
          </span>
        </Link>
      </div>
    </Section>
  );
}
