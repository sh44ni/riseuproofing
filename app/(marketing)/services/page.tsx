import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Home, Search, Building2, Sun, Hammer, ArrowRight, ShieldCheck, CheckCircle2, Shield, Layers, Wrench } from 'lucide-react';
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

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Home, Search, Building2, Sun, Hammer, Shield, Layers, Wrench,
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
          const Icon = ICON_MAP[service.icon] || Home;
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
                    <Icon className="w-5 h-5" />
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
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-blue flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-brand-blue group-hover:text-[#1C88DD] transition-colors">
                  <span>View Specifications &amp; Pricing</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </Section>
  );
}
