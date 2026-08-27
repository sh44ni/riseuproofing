'use client';

import Image from 'next/image';
import { ShieldCheck, CheckCircle2, ExternalLink, ArrowRight, Award } from 'lucide-react';
import { Section } from '@/components/shared/Container';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { LICENSE_NUMBER } from '@/lib/utils';

const CERTS = [
  {
    name: 'Owens Corning Preferred Contractor',
    subtitle: 'Factory Certified Master Installer',
    badgeText: 'Factory Certified',
    badgeColor: 'text-rose-700 dark:text-[#F43F5E] bg-rose-50 dark:bg-[#F43F5E]/15 border-rose-200 dark:border-[#F43F5E]/30',
    iconBg: 'bg-rose-50 border-rose-100 text-rose-600',
    accentColor: '#F43F5E',
    imageSrc: '/badges/owens_corning_icon_org.png',
    bullets: ['Up to 50-Year Non-Prorated Warranty', 'SureNail® Technology Certified'],
    url: 'https://www.owenscorning.com/en-us/roofing/contractors/contractor-profile/247226',
  },
  {
    name: 'California CSLB Licensed & Bonded',
    subtitle: `CA License #${LICENSE_NUMBER}`,
    badgeText: 'Active & Verified',
    badgeColor: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-400/30',
    iconBg: 'bg-emerald-50 border-emerald-100 text-emerald-600',
    accentColor: '#10B981',
    imageSrc: '/badges/cslb.webp',
    bullets: ['Class B General & C-39 Roofing', '$2M General Liability & Workers Comp'],
    url: 'https://www.cslb.ca.gov/',
  },
  {
    name: 'Tile Roofing Industry Alliance',
    subtitle: 'Concrete & Clay Tile Relay Specialists',
    badgeText: 'Master Specialist',
    badgeColor: 'text-amber-700 dark:text-[#EAA636] bg-amber-50 dark:bg-[#EAA636]/15 border-amber-200 dark:border-[#EAA636]/30',
    iconBg: 'bg-amber-50 border-amber-100 text-amber-600',
    accentColor: '#EAA636',
    imageSrc: '/badges/satisfaction.webp',
    bullets: ['Tile Underlayment Specialists', 'Engineered for Coastal Weather'],
    url: 'https://tileroofing.org/',
  },
  {
    name: '25+ Years San Diego Chamber Member',
    subtitle: 'Serving San Diego County Since 2000',
    badgeText: 'Community Trust',
    badgeColor: 'text-blue-700 dark:text-brand-blue bg-blue-50 dark:bg-brand-blue/15 border-blue-200 dark:border-brand-blue/30',
    iconBg: 'bg-blue-50 border-blue-100 text-brand-blue',
    accentColor: '#2F9FE3',
    imageSrc: '/badges/escondido-chamber.png',
    bullets: ['A+ Reliability Rating', 'Over 1,000+ Roofs Completed'],
    url: 'https://business.escondidochamber.org/list/member/rise-up-roofing-and-construction-inc-9925',
  },
];

export function Certifications() {
  return (
    <Section dark={true} alternate={false} id="certifications">
      <SectionHeading
        label="Trusted &amp; Certified"
        title="Manufacturer Certifications &amp; Warranties"
        subtitle="As an Owens Corning Preferred Contractor and fully licensed California specialist, we provide manufacturer-backed non-prorated warranties up to 50 years."
        dark={true}
      />

      {/* Certifications 4-Column Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mb-10">
        {CERTS.map((cert, i) => {
          const accentGradients: Record<number, string> = {
            0: 'via-rose-400/50',
            1: 'via-emerald-400/50',
            2: 'via-amber-400/50',
            3: 'via-brand-blue/40',
          };
          const hoverBorders: Record<number, string> = {
            0: 'hover:border-rose-300/40',
            1: 'hover:border-emerald-400/40',
            2: 'hover:border-amber-400/40',
            3: 'hover:border-brand-blue/30',
          };
          const hoverShadows: Record<number, string> = {
            0: 'hover:shadow-[0_8px_24px_-4px_rgba(244,63,94,0.12),0_1px_3px_rgba(11,30,51,0.04)]',
            1: 'hover:shadow-[0_8px_24px_-4px_rgba(16,185,129,0.12),0_1px_3px_rgba(11,30,51,0.04)]',
            2: 'hover:shadow-[0_8px_24px_-4px_rgba(234,166,54,0.12),0_1px_3px_rgba(11,30,51,0.04)]',
            3: 'hover:shadow-[0_8px_24px_-4px_rgba(47,159,227,0.12),0_1px_3px_rgba(11,30,51,0.04)]',
          };
          return (
          <a
            key={cert.name}
            href={cert.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`bg-white dark:bg-[#0B1B2B] rounded-3xl p-6 flex flex-col justify-between border border-slate-200/70 dark:border-white/10 ${hoverBorders[i]} transition-all duration-300 group relative overflow-hidden shadow-[0_1px_3px_rgba(11,30,51,0.04),0_8px_24px_-4px_rgba(11,30,51,0.07),0_24px_48px_-8px_rgba(11,30,51,0.04)] dark:shadow-lg ${hoverShadows[i]} hover:-translate-y-0.5`}
          >
            {/* Accent top edge on hover */}
            <div className={`absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent ${accentGradients[i]} to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 dark:hidden`} />
            <div>
              {/* Top Row: Logo Badge + Status Pill */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="w-13 h-13 rounded-2xl bg-white p-2 shadow-xs flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200 border border-slate-100 dark:border-white/20">
                  <Image
                    src={cert.imageSrc}
                    alt={cert.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-contain"
                  />
                </div>

                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${cert.badgeColor}`}
                >
                  {cert.badgeText}
                </span>
              </div>

              {/* Title & Subtitle */}
              <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1 tracking-tight group-hover:text-brand-blue transition-colors text-left leading-snug">
                {cert.name}
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] leading-snug text-left mb-4 font-medium">
                {cert.subtitle}
              </p>

              {/* Bullet Highlights */}
              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-white/10 mb-4">
                {cert.bullets.map((b) => (
                  <div key={b} className="flex items-center gap-2 text-xs text-[var(--text-secondary)] text-left">
                    <CheckCircle2
                      className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400"
                    />
                    <span className="leading-tight font-medium">{b}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Link with External Link Icon */}
            <div className="pt-3.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs font-bold text-brand-blue transition-colors w-full">
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="text-[11px]">Verified Partner</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </a>
          );
        })}
      </div>

      {/* Rich Sapphire & Gold 50-Year Warranty Showpiece Banner */}
      <div className="w-full rounded-3xl p-7 sm:p-9 lg:p-10 bg-gradient-to-r from-[#081B2E] via-[#0E2845] to-[#12365C] text-white border border-[#1E456E] shadow-xl relative overflow-hidden group">
        {/* Luminous Brand Accent Glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-blue/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-7 text-center md:text-left">
          {/* Seal + Text */}
          <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6 flex-1">
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md p-2.5 shadow-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
              <Image
                src="/badges/owens-corning-seal.webp"
                alt="Owens Corning 50-Year Warranty Seal"
                width={76}
                height={76}
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 shadow-xs">
                  50-Year Non-Prorated
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-200">
                  Direct Registration
                </span>
              </div>
              <h4 className="text-xl sm:text-2xl font-black text-white mb-1.5 tracking-tight">
                100% Transferable Manufacturer Warranties
              </h4>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed max-w-3xl font-medium">
                Every full roof replacement includes official manufacturer warranty registration certificates protecting materials, labor, and workmanship for up to 50 years.
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <a
            href="/contact"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-7 py-3.5 rounded-xl bg-brand-blue hover:bg-[#1C88DD] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-brand-blue/30 hover:scale-105 active:scale-95 flex-shrink-0 cursor-pointer"
          >
            <span>Ask About Warranty</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </Section>
  );
}
