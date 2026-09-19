import Link from 'next/link';
import Image from 'next/image';
import { Icon } from '@/components/shared/Icon';
import { Container } from '@/components/shared/Container';
import { PHONE_HREF, PHONE_NUMBER, LICENSE_NUMBER } from '@/lib/utils';

export function FinalCTA() {
  return (
    <section className="always-dark relative py-20 lg:py-28 bg-[#07131F] overflow-hidden" id="estimate">
      {/* Subtle Background Lighting & Top Divider */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(47,159,227,0.12),transparent_70%)] pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <Container className="relative z-10">
        {/* Integrated 2-Card Bento Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-7">
          {/* Card 1: Homeowner / Client Hero Banner (8 Columns) */}
          <div className="lg:col-span-8 group relative rounded-3xl overflow-hidden min-h-[440px] sm:min-h-[460px] flex flex-col justify-between p-7 sm:p-9 lg:p-10 border border-white/15 hover:border-brand-blue/50 transition-all duration-300 shadow-2xl shadow-black/80 hover:-translate-y-1">
            {/* Full Bleed Background Image */}
            <Image
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80"
              alt="Protect Your Home with Master Craftsmanship"
              fill
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 66vw"
            />

            {/* Multi-stop Deep Gradient Overlay for crisp text contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1B2B] via-[#0B1B2B]/90 via-50% to-black/30 lg:bg-gradient-to-r lg:from-[#0B1B2B] lg:via-[#0B1B2B]/95 lg:via-65% lg:to-black/40 transition-opacity duration-300 group-hover:via-[#0B1B2B]/90" />

            {/* Top Badge */}
            <div className="relative z-10 mb-6">
              <span className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-brand-blue bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-md">
                <span className="w-2 h-2 rounded-full bg-brand-blue animate-pulse" />
                <span>24/7 San Diego Emergency &amp; Estimates</span>
              </span>
            </div>

            {/* Content Area */}
            <div className="relative z-10 max-w-xl">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-3 tracking-tight leading-tight">
                Ready to Protect Your Home With Master Craftsmanship?
              </h2>

              <p className="text-xs sm:text-sm text-white/80 leading-relaxed mb-6 font-normal">
                Whether you need a free 21-point roof inspection, emergency leak repair, tile relay, or commercial flat system, our licensed crews are ready.
              </p>

              {/* Trust Specs Strip */}
              <div className="flex flex-wrap items-center gap-3.5 text-xs text-white/75 mb-6">
                <span className="inline-flex items-center gap-1.5 font-medium text-white/90">
                  <Icon name="shield-check" className="w-3.5 h-3.5 text-[#EAA636]" />
                  <span>CA Lic #{LICENSE_NUMBER}</span>
                </span>
                <span className="text-white/30">•</span>
                <span className="inline-flex items-center gap-1.5 font-medium text-white/90">
                  <Icon name="check-circle" className="w-3.5 h-3.5 text-brand-blue" />
                  <span>100% Itemized Quotes</span>
                </span>
                <span className="text-white/30">•</span>
                <span className="inline-flex items-center gap-1.5 font-medium text-white/90">
                  <Icon name="check-circle" className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>0% Down Financing</span>
                </span>
              </div>

              {/* CTA Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link href="/contact" className="flex-1 sm:flex-initial">
                  <span className="inline-flex items-center justify-center gap-2 bg-brand-blue hover:bg-[#1C88DD] text-white font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl shadow-lg shadow-brand-blue/30 transition-all w-full cursor-pointer">
                    <Icon name="clipboard-check" className="w-4 h-4" />
                    <span>Request Free Estimate</span>
                    <Icon name="arrow-right" className="w-4 h-4" />
                  </span>
                </Link>

                <a
                  href={PHONE_HREF}
                  className="inline-flex items-center justify-center gap-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs uppercase tracking-wider py-3.5 px-5 rounded-xl backdrop-blur-md transition-all group/phone cursor-pointer"
                >
                  <Icon name="phone" className="w-4 h-4 text-brand-blue group-hover/phone:scale-110 transition-transform" />
                  <span>{PHONE_NUMBER}</span>
                </a>
              </div>
            </div>
          </div>

          {/* Card 2: Careers & Team Culture (4 Columns) */}
          <div className="lg:col-span-4 group relative rounded-3xl overflow-hidden min-h-[440px] sm:min-h-[460px] flex flex-col justify-between p-7 sm:p-8 border border-white/15 hover:border-[#EAA636]/50 transition-all duration-300 shadow-2xl shadow-black/80 hover:-translate-y-1">
            {/* Full Bleed Background Image */}
            <Image
              src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80"
              alt="Join Rise Up Roofing Careers"
              fill
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 33vw"
            />

            {/* Multi-stop Deep Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1B2B] via-[#0B1B2B]/90 via-50% to-black/30 transition-opacity duration-300 group-hover:via-[#0B1B2B]/85" />

            {/* Top Badge */}
            <div className="relative z-10 mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#EAA636] bg-black/60 backdrop-blur-md border border-white/15 shadow-md">
                <Icon name="sparkles" className="w-3.5 h-3.5" />
                <span>Now Hiring In SoCal</span>
              </span>
            </div>

            {/* Content Area */}
            <div className="relative z-10">
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug mb-2 group-hover:text-[#EAA636] transition-colors">
                Build Your Career With Rise Up
              </h3>

              <p className="text-xs sm:text-[13px] text-white/75 leading-relaxed mb-5 font-normal">
                Join a top-tier crew that values safety, respect, premium compensation, and steady year-round work across San Diego.
              </p>

              {/* 2 Bullet Points */}
              <div className="space-y-2 py-3 border-y border-white/10 mb-6">
                <div className="flex items-center gap-2 text-xs text-white/85">
                  <Icon name="check-circle" className="w-3.5 h-3.5 text-[#EAA636] flex-shrink-0" />
                  <span>Top Industry Compensation &amp; 401(k)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/85">
                  <Icon name="check-circle" className="w-3.5 h-3.5 text-[#EAA636] flex-shrink-0" />
                  <span>Year-Round Steady Projects &amp; Gear</span>
                </div>
              </div>

              {/* Action Button */}
              <Link href="/careers" className="w-full block">
                <span className="inline-flex items-center justify-center gap-2 w-full py-3 px-5 rounded-xl bg-white/10 hover:bg-[#EAA636] hover:text-[#0B1E33] text-white border border-white/20 hover:border-[#EAA636] font-bold text-xs uppercase tracking-wider transition-all shadow-md group/btn cursor-pointer">
                  <Icon name="users" className="w-4 h-4 text-[#EAA636] group-hover/btn:text-[#0B1E33] transition-colors" />
                  <span>View Open Positions</span>
                  <Icon name="arrow-right" className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
