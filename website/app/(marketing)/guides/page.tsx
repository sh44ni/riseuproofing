import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Icon } from '@/components/shared/Icon';
import { buildMetadata, buildLocalBusinessJsonLd } from '@/lib/seo/metadata';
import { GUIDES } from '@/lib/data/guides';
import { Section, Container } from '@/components/shared/Container';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { PHONE_HREF, PHONE_NUMBER } from '@/lib/utils';

export const metadata: Metadata = buildMetadata({
  title: 'San Diego Roofing & Construction Guides | Technical Knowledge Hub',
  description:
    'Authoritative homeowner and commercial guides to tile roof relays, flat roof coatings, built-up roofing, California Title 24 cool roofs, and remodeling costs.',
  path: '/guides',
});

export default function GuidesIndexPage() {
  const localBusinessJsonLd = buildLocalBusinessJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />

      <Section className="pt-32 sm:pt-36 pb-20">
        <Container>
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Technical Guides', href: '/guides' },
            ]}
          />

          <SectionHeading
            as="h1"
            label="Technical Knowledge Hub"
            title="San Diego Roofing & Construction Guides"
            subtitle="Authoritative engineering guides, California building code insights, material comparisons, and real cost benchmarks from our licensed master builders."
          />

          {/* Quick Category Badges */}
          <div className="flex flex-wrap justify-center gap-2 mb-14">
            {['All Guides', 'Residential Roofing', 'Commercial Roofing', 'Energy Efficiency', 'Home Construction'].map(
              (cat, idx) => (
                <span
                  key={cat}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all inline-block border ${
                    idx === 0
                      ? 'bg-brand-blue text-white border-brand-blue shadow-md'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </span>
              )
            )}
          </div>

          {/* Guides Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {GUIDES.map((guide) => (
              <article
                key={guide.slug}
                className="group flex flex-col bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Image Cover */}
                <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                  <Image
                    src={guide.coverImage}
                    alt={guide.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
                  <span className="absolute top-4 left-4 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-slate-900 shadow-sm">
                    {guide.category}
                  </span>
                  <span className="absolute bottom-3 right-4 text-xs font-semibold text-white/90 flex items-center gap-1.5">
                    <Icon name="clock" className="w-3.5 h-3.5" />
                    {guide.readTimeMinutes} min read
                  </span>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                      <span>Updated September 2026</span>
                      <span>•</span>
                      <span>{guide.author.license}</span>
                    </div>

                    <h2 className="text-xl font-black text-slate-900 group-hover:text-brand-blue transition-colors leading-snug mb-3">
                      <Link href={`/guides/${guide.slug}`} className="hover:underline">
                        {guide.title}
                      </Link>
                    </h2>

                    <p className="text-sm text-slate-600 leading-relaxed mb-6 line-clamp-3">
                      {guide.summary}
                    </p>
                  </div>

                  <div>
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {guide.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <Link
                      href={`/guides/${guide.slug}`}
                      className="inline-flex items-center gap-2 text-sm font-bold text-brand-blue group-hover:text-[#1C88DD] transition-colors"
                    >
                      <span>Read Technical Guide</span>
                      <Icon name="arrow-right" className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Need Consultation Banner */}
          <div className="mt-20 rounded-3xl bg-gradient-to-r from-slate-900 via-brand-navy to-[#0a2540] p-8 md:p-12 text-white border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="max-w-2xl relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-gold/20 text-brand-gold border border-brand-gold/30 mb-4">
                <Icon name="shield-check" className="w-4 h-4" />
                Expert Contractor Guidance
              </span>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white mb-4">
                Need Specific Technical Advice For Your Property?
              </h3>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
                Our master roofers and licensed general contractors conduct complimentary on-site diagnostic inspections across San Diego County.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/contact"
                  className="px-6 py-3.5 rounded-xl bg-brand-blue hover:bg-[#1C88DD] text-white font-bold text-sm shadow-md transition-all"
                >
                  Schedule Free On-Site Inspection
                </Link>
                <a
                  href={PHONE_HREF}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-white/20 hover:bg-white/10 text-white font-bold text-sm transition-all"
                >
                  <Icon name="phone" className="w-4 h-4 text-brand-gold" />
                  <span>Call {PHONE_NUMBER}</span>
                </a>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
