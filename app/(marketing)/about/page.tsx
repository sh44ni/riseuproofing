import type { Metadata } from 'next';
import { Shield, Users, Award, Heart, CheckCircle2, Phone, ClipboardCheck } from 'lucide-react';
import Link from 'next/link';
import { buildMetadata } from '@/lib/seo/metadata';
import { Section } from '@/components/shared/Container';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { COMPANY_NAME, LICENSE_NUMBER, PHONE_HREF, PHONE_NUMBER } from '@/lib/utils';

export const metadata: Metadata = buildMetadata({
  title: 'About Us | San Diego Roofing & Construction',
  description: `Learn about ${COMPANY_NAME} — San Diego County's trusted roofing company with 25+ years of experience. Licensed, bonded, and insured CA Lic #${LICENSE_NUMBER}.`,
  path: '/about',
});

const VALUES = [
  {
    icon: Shield,
    title: 'Integrity First',
    desc: 'We provide honest assessments and transparent itemized pricing. If a targeted repair will solve the issue, we will never push for an unnecessary replacement.',
    color: 'text-brand-blue bg-blue-500/10 border-blue-400/30',
  },
  {
    icon: Users,
    title: 'Customer Focus',
    desc: 'Every project starts with attentive communication. We tailor solutions to your property structure, timeline, and budget — treating your home with utmost care.',
    color: 'text-amber-400 bg-amber-500/10 border-amber-400/30',
  },
  {
    icon: Award,
    title: 'Quality Craftsmanship',
    desc: 'We use premium Owens Corning materials, follow strict manufacturer specifications, and back our installations with long-term non-prorated warranties.',
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-400/30',
  },
  {
    icon: Heart,
    title: 'Community Roots',
    desc: 'We are proud San Diego neighbors, not an out-of-state franchise. We take personal pride in protecting the families and businesses across our local communities.',
    color: 'text-rose-400 bg-rose-500/10 border-rose-400/30',
  },
];

export default function AboutPage() {
  return (
    <Section dark={true} alternate={false} className="pt-32 sm:pt-36">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'About' }]} />
      
      <SectionHeading
        label="Our Heritage"
        title="San Diego's Trusted Roofing Specialists"
        subtitle={`${COMPANY_NAME} has been protecting homes and commercial properties across San Diego County for over 25 years with master craftsmanship.`}
        dark={true}
      />

      {/* Founder Story Glass Card */}
      <div className="max-w-4xl mx-auto mb-16">
        <div className="glass-card-hero rounded-3xl p-8 sm:p-10 lg:p-12 border-white/20 shadow-2xl">
          <div className="inline-flex items-center gap-2 glass-chip px-3.5 py-1 rounded-full mb-4 text-xs font-bold uppercase tracking-wider text-brand-blue">
            <span>Established 2000 • San Diego County</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] mb-6">
            Built on Honest Relationships &amp; Master Craftsmanship
          </h3>
          <div className="space-y-4 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            <p>
              Rise Up Roofing &amp; Construction was founded with a clear mission: every homeowner deserves honest, professional roofing service at a fair price. What started as a dedicated local crew has grown into one of San Diego County&apos;s most reputable roofing and construction companies.
            </p>
            <p>
              With California Contractor&apos;s License #{LICENSE_NUMBER}, we are fully licensed, bonded, and insured. As an Owens Corning Preferred Contractor, we install industry-leading roofing systems engineered to withstand coastal weather, marine salt mist, and inland heat.
            </p>
            <p>
              Our master craftsmen take personal pride in every project — from emergency leak diagnostics to complete tile relays and commercial flat roofs. We treat every roof as if it were our own home.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>CA License #{LICENSE_NUMBER} • Fully Bonded</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/contact">
                <span className="inline-flex items-center gap-1.5 bg-[#2E9BF0] hover:bg-[#1C88DD] text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-md transition-all hover:brightness-110">
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span>Free Estimate</span>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="mb-16">
        <div className="text-center mb-10">
          <span className="glass-chip px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-brand-blue mb-3 inline-block">
            Our Principles
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
            Core Values That Guide Every Roof We Build
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {VALUES.map((v) => {
            const Icon = v.icon;
            return (
              <div
                key={v.title}
                className="glass-card-interactive rounded-2xl p-6 flex items-start gap-4 border-white/15"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${v.color}`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[var(--text-primary)] mb-1.5">{v.title}</h4>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{v.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Facts Dock */}
      <div className="glass-card-interactive rounded-3xl p-8 lg:p-10 border-white/20 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          {[
            { stat: '25+', label: 'Years Experience' },
            { stat: '1,000+', label: 'Roofs Protected' },
            { stat: '4.9 / 5.0', label: 'Customer Rating' },
            { stat: '100%', label: 'Licensed & Bonded' },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-3xl sm:text-4xl font-extrabold text-brand-blue mb-1">
                {item.stat}
              </p>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
