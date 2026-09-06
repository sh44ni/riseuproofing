import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Icon, type IconName } from '@/components/shared/Icon';
import { buildMetadata } from '@/lib/seo/metadata';
import { services } from '@/lib/data/services';
import { Section } from '@/components/shared/Container';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';

export const metadata: Metadata = buildMetadata({
  title: 'Our Roofing & Construction Services',
  description: 'Residential roofing, commercial roofing, roof repairs, tile underlayment relays, solar integration, and general construction across San Diego County.',
  path: '/services',
});

const ICON_NAME_MAP: Record<string, IconName> = {
  Home: 'home',
  Search: 'search',
  Building2: 'building',
  Sun: 'sun',
  Hammer: 'hammer',
  Shield: 'shield',
  Layers: 'layers',
  Wrench: 'wrench',
};

export default function ServicesPage() {
  return (
    <Section alternate={false} className="pt-32 sm:pt-36">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Services' }]} />
      
      <SectionHeading
        as="h1"
        label="Our Capabilities"
        title="Our Roofing &amp; Construction Services"
        subtitle="From complete roof replacements and tile relays to commercial flat roofing and emergency leak detection, our licensed team delivers professional results built for coastal longevity."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {services.map((service) => {
          const iconName = ICON_NAME_MAP[service.icon] || 'home';
          const topIncludes = service.includes.slice(0, 3);

          return (
            <Link key={service.slug} href={`/services/${service.slug}`} className="group flex">
              <div className="glass-card-interactive rounded-2xl overflow-hidden p-5 sm:p-6 flex flex-col w-full h-full border border-slate-200/80 hover:border-brand-blue/30 shadow-xs transition-all duration-300">
                {/* Image */}
                <div className="relative h-52 -mx-5 -mt-5 sm:-mx-6 sm:-mt-6 mb-5 overflow-hidden rounded-t-xl">
                  <Image
                    src={service.heroImage}
                    alt={service.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B1B2B] via-[#0B1B2B]/20 to-transparent" />
                  
                  <div className="absolute top-3 left-3">
                    <span className="glass-chip px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white backdrop-blur-md border-white/20">
                      {service.name.split(' ')[0]}
                    </span>
                  </div>
                </div>

                {/* Icon & Title */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-blue border border-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-blue group-hover:text-white transition-colors">
                    <Icon name={iconName} className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-brand-blue transition-colors">
                    {service.name}
                  </h3>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed flex-1 mb-4 line-clamp-2">
                  {service.shortDescription}
                </p>

                {/* Includes chips */}
                <ul className="space-y-1.5 mb-5">
                  {topIncludes.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                      <Icon name="check-circle" className="w-3.5 h-3.5 text-brand-blue flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-brand-blue group-hover:text-[#1C88DD] transition-colors">
                  <span>View Specifications &amp; Pricing</span>
                  <Icon name="arrow-right" className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Educational Guide Section */}
      <div className="mt-16 sm:mt-20 border-t border-slate-200/80 pt-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center sm:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">
              Expert Craftsmanship &amp; Engineering
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] mt-1.5 tracking-tight">
              Full-Service Roofing &amp; Exterior Construction in San Diego County
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-[var(--text-secondary)] leading-relaxed">
            <div className="space-y-4">
              <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Icon name="shield-check" className="w-5 h-5 text-brand-blue flex-shrink-0" />
                Dual-Trade Synergy: Roofing &amp; Solar Under One Roof
              </h3>
              <p>
                Property owners searching for reliable roofing and solar companies near me frequently face coordination challenges when hiring separate contractors for photovoltaic arrays and roofing assemblies. When solar panels must be temporarily removed for reroofing or leak mitigation, improper handling can void panel warranties or puncture newly laid underlayment.
              </p>
              <p>
                Rise Up Roofing &amp; Construction bridges this gap with in-house C-39 roofing and certified electrical expertise. From turnkey solar detach-reset workflows during concrete tile relayments to unified roof-solar installations, our synchronized crews safeguard your building envelope and clean-energy production under a single, accountable warranty.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Icon name="check-circle" className="w-5 h-5 text-brand-blue flex-shrink-0" />
                Transparent Pricing &amp; Free Comprehensive Estimates
              </h3>
              <p>
                We believe premium craftsmanship should always remain accessible. Homeowners and facility managers seeking affordable roofing san diego county can count on Rise Up for transparent, itemized bids without hidden contingencies or high-pressure sales tactics.
              </p>
              <p>
                We provide free roofing estimates san diego county utilizing high-resolution aerial drone diagnostic imagery and moisture-meter assessments. As trusted local roofers san diego county, our team evaluates decking soundness, flashing integrity, ridge vent airflow, and underlayment elasticity to recommend engineered solutions—whether targeted repairs, preventative maintenance, or complete multi-ply replacements.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
