import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/components/shared/Icon';
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
    <Section alternate={false} className="pt-32 sm:pt-36">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Service Areas' }]} />
      
      <SectionHeading
        as="h1"
        label="Local Coverage"
        title="San Diego County Service Areas"
        subtitle="We provide expert roofing and construction services across all North County coastal, inland, and greater San Diego communities."
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 mb-16">
        {serviceAreas.map((area) => (
          <Link
            key={area.slug}
            href={`/service-area/${area.slug}`}
            className="glass-card-interactive rounded-xl p-4 flex items-center gap-2.5 border border-slate-200/80 hover:border-brand-blue/40 shadow-2xs transition-all group"
          >
            <Icon name="map-pin" className="w-4 h-4 text-brand-blue flex-shrink-0 group-hover:scale-110 transition-transform" />
            <span className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] group-hover:text-brand-blue transition-colors">
              {area.name}
            </span>
          </Link>
        ))}
      </div>

      {/* Regional Roofing Guide & Microclimates (SEO & Content Ratio Expansion) */}
      <div className="max-w-4xl mx-auto mb-16 space-y-8">
        <div className="glass-card-interactive rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 mb-3 text-brand-blue font-bold text-xs uppercase tracking-wider">
            <Icon name="shield-check" className="w-4 h-4 text-brand-blue" />
            <span>Regional Microclimates &amp; Engineering</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] mb-4 tracking-tight">
            Southern California Roofing Microclimates: Coastal Fog vs. Inland Heat
          </h2>
          <div className="space-y-4 text-sm text-[var(--text-secondary)] leading-relaxed">
            <p>
              San Diego County features one of the most diverse microclimate environments in the United States. Homes situated along the coastal corridor—including Oceanside, Carlsbad, Encinitas, Solana Beach, and Del Mar—face persistent marine layer fog, high relative humidity, and airborne ocean salts. These coastal factors accelerate nail corrosion, cause premature granular loss on standard asphalt shingles, and promote moss and fungal wicking. For coastal properties, our local roofers in San Diego County install non-corrosive aluminum drip edges, dual-layer high-traction synthetic underlayments, and algae-resistant architectural shingles engineered to withstand 130 MPH winds.
            </p>
            <p>
              Conversely, inland valley communities such as Escondido, Poway, San Marcos, Vista, Ramona, and El Cajon experience extreme thermal cycling, with summer daytime roof surface temperatures routinely exceeding 140°F followed by rapid nighttime cooling. Underneath concrete and clay tile roofs, traditional organic tar paper dries out, cracks, and splits within 15 to 20 years under this intense thermal stress. To protect inland homes, Rise Up specializes in tile roof relayments utilizing SBS-modified, high-temperature synthetic underlayments rated up to 250°F, paired with ridge ventilation systems to exhaust trapped attic heat and lower summer electric cooling costs.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card-interactive rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
            <h3 className="text-lg font-extrabold text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <Icon name="shield-check" className="w-4 h-4 text-emerald-600" />
              <span>Countywide Municipal Permitting</span>
            </h3>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed mb-3">
              Every roof replacement and commercial restoration in San Diego County requires strict municipal compliance. We manage 100% of the permitting process across every jurisdiction—from the City of San Diego Development Services Department and Oceanside Building Division to the County Planning and Development Services (PDS).
            </p>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              Our projects comply with California Building Code CRC R908, statutory two-layer tear-off maximums, and California Title 24 Cool Roof energy-efficiency standards. We schedule all mandatory rough and final city inspections, ensuring your property is fully protected and legally certified.
            </p>
          </div>

          <div className="glass-card-interactive rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
            <h3 className="text-lg font-extrabold text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <Icon name="shield-check" className="w-4 h-4 text-brand-blue" />
              <span>Full-Service Roofing &amp; Solar Solutions</span>
            </h3>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed mb-3">
              Homeowners searching for reputable roofing and solar companies near me often struggle to coordinate separate contractors for reroofing and solar array handling. Rise Up provides a complete in-house solution, safely detaching photovoltaic panels, replacing the roof deck and underlayment, and re-mounting modules with certified flashing boots.
            </p>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              We offer affordable roofing across San Diego County with flexible zero-down financing options and provide free roofing estimates throughout North County and Greater San Diego. Every quote includes detailed digital drone photography, infrared moisture testing, and a transparent itemized scope.
            </p>
          </div>
        </div>
      </div>

      {/* Local Consultation Glass Banner */}
      <div className="glass-card-hero rounded-3xl p-8 sm:p-10 text-center max-w-3xl mx-auto border border-slate-200/80 shadow-md">
        <h3 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] mb-2">
          Don&apos;t See Your Community Listed?
        </h3>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-6 max-w-md mx-auto leading-relaxed">
          We likely service your neighborhood too. Reach out to our 24/7 dispatch for rapid scheduling.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/contact">
            <span className="inline-flex items-center gap-2 bg-[#2E9BF0] hover:bg-[#1C88DD] text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-lg shadow-brand-blue/30 transition-all hover:brightness-110">
              <span>Book Free Inspection</span>
              <Icon name="arrow-right" className="w-4 h-4" />
            </span>
          </Link>
          <a href={PHONE_HREF}>
            <span className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-[var(--text-primary)] font-bold text-xs uppercase tracking-wider px-5 py-3.5 rounded-xl transition-all shadow-xs">
              <Icon name="phone" className="w-4 h-4 text-brand-blue" />
              <span>Call {PHONE_NUMBER}</span>
            </span>
          </a>
        </div>
      </div>
    </Section>
  );
}
