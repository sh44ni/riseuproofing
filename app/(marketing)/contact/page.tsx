import type { Metadata } from 'next';
import { Icon } from '@/components/shared/Icon';
import { Section } from '@/components/shared/Container';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { ContactForm } from '@/components/marketing/ContactForm';
import { buildMetadata } from '@/lib/seo/metadata';
import { PHONE_HREF, PHONE_NUMBER, LICENSE_NUMBER } from '@/lib/utils';

export const metadata: Metadata = buildMetadata({
  title: 'Contact Us | Free Roofing Estimate',
  description: 'Request a free roofing estimate from Rise Up Roofing & Construction. Serving San Diego County. Call (760) 622-1230 or fill out our online form.',
  path: '/contact',
});

export default function ContactPage() {
  return (
    <Section alternate={false} className="pt-32 sm:pt-36">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Contact' }]} />
      
      <SectionHeading
        as="h1"
        label="Contact Us"
        title="Get a Free Roofing Estimate"
        subtitle="Whether you need a full tile relay, roof replacement, emergency leak diagnostics, or solar integration — our licensed team responds within 15 minutes."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[58%_42%] gap-10 lg:gap-12 max-w-6xl mx-auto">
        {/* Left — Client Form Card */}
        <div>
          <ContactForm />
        </div>

        {/* Right — Contact Cards */}
        <div className="space-y-6">
          <div className="glass-card-interactive rounded-3xl p-6 sm:p-8 border border-slate-200/80">
            <h2 className="text-lg font-extrabold text-[var(--text-primary)] mb-6 pb-3 border-b border-slate-100">
              Direct Contact Channels
            </h2>
            
            <div className="space-y-5">
              <a
                href={PHONE_HREF}
                className="flex items-center gap-3.5 text-[var(--text-primary)] hover:text-brand-blue transition-colors group"
              >
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 group-hover:bg-brand-blue group-hover:text-white transition-colors">
                  <Icon name="phone" className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">24/7 Phone &amp; Text</p>
                  <p className="text-base font-extrabold text-[var(--text-primary)]">{PHONE_NUMBER}</p>
                </div>
              </a>

              <a
                href="mailto:info@riseuproofing.com"
                className="flex items-center gap-3.5 text-[var(--text-primary)] hover:text-brand-blue transition-colors group"
              >
                <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 group-hover:text-brand-blue transition-colors">
                  <Icon name="mail" className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Email Inquiries</p>
                  <p className="text-sm font-bold text-[var(--text-primary)]">info@riseuproofing.com</p>
                </div>
              </a>

              <div className="flex items-center gap-3.5 text-[var(--text-primary)]">
                <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
                  <Icon name="map-pin" className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Primary Coverage</p>
                  <p className="text-sm font-bold text-[var(--text-primary)]">San Diego County &amp; North County Hubs</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 text-[var(--text-primary)]">
                <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
                  <Icon name="clock" className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Operating Hours</p>
                  <p className="text-sm font-bold text-[var(--text-primary)]">Mon–Fri 7am–6pm, Sat 8am–2pm</p>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">24/7 Storm Leak Dispatch</p>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Badge Dock */}
          <div className="glass-card-interactive rounded-3xl p-6 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon name="shield-check" className="w-8 h-8 text-brand-gold flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">CA Contractor License #{LICENSE_NUMBER}</p>
                <p className="text-[11px] text-[var(--text-muted)]">Fully Licensed, Bonded &amp; Insured</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200">
              Active
            </span>
          </div>
        </div>
      </div>

      {/* 4-Step Inspection & Free Estimate Guide */}
      <div className="mt-16 sm:mt-20 border-t border-slate-200/80 pt-12 max-w-6xl mx-auto">
        <div className="text-center sm:text-left mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">
            Transparent Contractor Process
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] mt-1.5 tracking-tight">
            What to Expect During Your Free Roofing Estimate
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card-interactive rounded-2xl p-5 border border-slate-200/80 space-y-3">
            <span className="w-7 h-7 rounded-lg bg-blue-50 text-brand-blue font-extrabold text-xs flex items-center justify-center border border-blue-100">
              01
            </span>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Digital Satellite Pre-Scan
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Before our field tech arrives, we pull high-precision satellite roof pitch and square footage measurements to prepare preliminary structural calculations.
            </p>
          </div>

          <div className="glass-card-interactive rounded-2xl p-5 border border-slate-200/80 space-y-3">
            <span className="w-7 h-7 rounded-lg bg-blue-50 text-brand-blue font-extrabold text-xs flex items-center justify-center border border-blue-100">
              02
            </span>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Aerial Drone &amp; Attic Audit
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              We conduct a 4K aerial drone scan and physical walk-through to inspect flashing, tile underlayment elasticity, ventilation gaps, and deck moisture.
            </p>
          </div>

          <div className="glass-card-interactive rounded-2xl p-5 border border-slate-200/80 space-y-3">
            <span className="w-7 h-7 rounded-lg bg-blue-50 text-brand-blue font-extrabold text-xs flex items-center justify-center border border-blue-100">
              03
            </span>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Itemized Line-Item Bid
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              You receive a transparent proposal detailing labor, underlayment specs, flashing replacements, and Title 24 compliance options with zero hidden costs.
            </p>
          </div>

          <div className="glass-card-interactive rounded-2xl p-5 border border-slate-200/80 space-y-3">
            <span className="w-7 h-7 rounded-lg bg-blue-50 text-brand-blue font-extrabold text-xs flex items-center justify-center border border-blue-100">
              04
            </span>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Rapid Permitting &amp; Execution
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Upon agreement, we pull all municipal permits, schedule material staging, and assign a dedicated project manager to ensure clean, on-time completion.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
