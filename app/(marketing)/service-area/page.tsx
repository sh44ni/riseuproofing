import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, ArrowRight, ShieldCheck, Phone } from 'lucide-react';
import { buildMetadata } from '@/lib/seo/metadata';
import { serviceAreas } from '@/lib/data/serviceAreas';
import { Section } from '@/components/shared/Container';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { COMPANY_NAME, PHONE_HREF, PHONE_NUMBER } from '@/lib/utils';

export const metadata: Metadata = buildMetadata({
  title: 'San Diego County Service Areas | Rise Up Roofing',
  description: `${COMPANY_NAME} proudly serves all 30+ communities across San Diego County with premium roofing replacements, tile relays, and storm repairs.`,
  path: '/service-area',
});

export default function ServiceAreaPage() {
  return (
    <Section dark={true} alternate={false} className="pt-32 sm:pt-36">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Service Areas' }]} />
      
      <SectionHeading
        label="Local Coverage"
        title="San Diego County Service Areas"
        subtitle="We provide expert roofing and construction services across all North County coastal, inland, and greater San Diego communities."
        dark={true}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 mb-16">
        {serviceAreas.map((area) => (
          <Link
            key={area.slug}
            href={`/service-area/${area.slug}`}
            className="glass-card-interactive rounded-xl p-4 flex items-center gap-2.5 border-white/15 hover:border-white/30 transition-all group"
          >
            <MapPin className="w-4 h-4 text-brand-blue flex-shrink-0 group-hover:scale-110 transition-transform" />
            <span className="text-xs sm:text-sm font-semibold text-white group-hover:text-brand-blue transition-colors">
              {area.name}
            </span>
          </Link>
        ))}
      </div>

      {/* Local Consultation Glass Banner */}
      <div className="glass-card-hero rounded-3xl p-8 sm:p-10 text-center max-w-3xl mx-auto border-white/20 shadow-2xl">
        <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-2">
          Don&apos;t See Your Community Listed?
        </h3>
        <p className="text-xs sm:text-sm text-white/75 mb-6 max-w-md mx-auto leading-relaxed">
          We likely service your neighborhood too. Reach out to our 24/7 dispatch for rapid scheduling.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/contact">
            <span className="inline-flex items-center gap-2 bg-[#2E9BF0] hover:bg-[#1C88DD] text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-lg shadow-brand-blue/30 transition-all hover:brightness-110">
              <span>Book Free Inspection</span>
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
          <a href={PHONE_HREF}>
            <span className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs uppercase tracking-wider px-5 py-3.5 rounded-xl backdrop-blur-md transition-all">
              <Phone className="w-4 h-4 text-brand-blue" />
              <span>Call {PHONE_NUMBER}</span>
            </span>
          </a>
        </div>
      </div>
    </Section>
  );
}
