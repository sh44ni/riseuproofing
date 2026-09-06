import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, ShieldCheck, Phone, ClipboardCheck, MapPin, Star } from 'lucide-react';
import { getServiceAreaBySlug, getAllServiceAreaSlugs } from '@/lib/data/serviceAreas';
import { services } from '@/lib/data/services';
import { buildMetadata, buildFAQJsonLd } from '@/lib/seo/metadata';
import { Section } from '@/components/shared/Container';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { FAQAccordion } from '@/components/shared/FAQAccordion';
import { COMPANY_NAME, PHONE_NUMBER, PHONE_HREF, LICENSE_NUMBER } from '@/lib/utils';

export async function generateStaticParams() {
  return getAllServiceAreaSlugs().map((city) => ({ city }));
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city } = await params;
  const area = getServiceAreaBySlug(city);
  if (!area) return {};

  return buildMetadata({
    title: area.seoTitle || `Roofing & Construction in ${area.name}, CA | Rise Up Roofing`,
    description:
      area.seoDescription ||
      `${COMPANY_NAME} provides expert roofing, tile underlayment, repairs, solar, and construction services in ${area.name}, California. Licensed, bonded & insured. Free estimates.`,
    path: `/service-area/${area.slug}`,
  });
}

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const area = getServiceAreaBySlug(city);
  if (!area) notFound();

  const faqs = area.faqs || [];
  const faqJsonLd = faqs.length > 0 ? buildFAQJsonLd(faqs) : null;

  return (
    <>
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      <Section alternate={false} className="pt-32 sm:pt-36">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Service Areas', href: '/service-area' },
            { label: area.name }
          ]}
        />

        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 glass-chip px-3.5 py-1 rounded-full mb-4 text-xs font-bold uppercase tracking-wider text-brand-blue">
            <span>Serving {area.name}, California</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[var(--text-primary)] mb-4 tracking-tight">
            {area.h1 || `Roofing & Construction in ${area.name}, CA`}
          </h1>

          <p className="text-sm sm:text-base text-[var(--text-secondary)] mb-8 leading-relaxed">
            {area.intro || (
              <>
                {COMPANY_NAME} is proud to serve homeowners and commercial property managers in {area.name}, {area.county} County. 
                Whether you need a complete roof replacement, tile relay with 2-ply underlayment, emergency leak detection, or general construction repairs, our licensed team delivers master craftsmanship backed by 50-year manufacturer warranties.
              </>
            )}
          </p>

          {/* Local Neighborhood Badges (Authority Signals) */}
          {area.neighborhoods && area.neighborhoods.length > 0 && (
            <div className="glass-card-interactive rounded-2xl p-5 mb-10 border border-slate-200/80 shadow-xs">
              <h2 className="text-sm font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-blue" />
                <span>{area.name} Communities &amp; Neighborhoods Served</span>
              </h2>
              <div className="flex flex-wrap gap-2 text-xs text-[var(--text-secondary)]">
                {area.neighborhoods.map((n) => (
                  <span key={n} className="glass-chip px-2.5 py-1 rounded-lg">
                    {n}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Local Services Grid */}
          <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] mb-6">
            Our Roofing &amp; Construction Services in {area.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            {services.map((service) => (
              <Link
                key={service.slug}
                href={`/services/${service.slug}`}
                className="glass-card-interactive rounded-2xl p-5 flex items-center gap-3.5 border border-slate-200/80 hover:border-brand-blue/30 shadow-xs transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 group-hover:bg-brand-blue group-hover:text-white transition-colors">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-brand-blue transition-colors">
                    {service.name}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] line-clamp-1 mt-0.5">
                    {service.shortDescription}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-blue group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>

          {/* Why Choose Rise Up in This City */}
          <div className="glass-card-interactive rounded-3xl p-6 sm:p-8 mb-12 border border-slate-200/80 shadow-xs">
            <h2 className="text-xl font-extrabold text-[var(--text-primary)] mb-4">
              Why {area.name} Property Owners Choose Rise Up Roofing
            </h2>
            <div className="space-y-4 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              <p>
                As a local San Diego County contractor with over 25 years of combined experience, we understand the specific environmental factors affecting {area.name} properties — including coastal salt fog, morning moisture, UV exposure, and Santa Ana winds.
              </p>
              <p>
                With California Contractor&apos;s License #{LICENSE_NUMBER}, we are fully licensed, bonded, and insured for both roofing (C-39) and general construction (B). As an Owens Corning Preferred Contractor, we install roofing systems to exact manufacturer specifications, ensuring full warranty protection and peerless build quality.
              </p>
            </div>
          </div>

          {/* Local FAQs */}
          {faqs.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] mb-4">
                Frequently Asked Questions About Roofing in {area.name}
              </h2>
              <FAQAccordion items={faqs} />
            </div>
          )}

          {/* City CTA Banner */}
          <div className="glass-card-hero rounded-3xl p-8 sm:p-10 text-center border border-slate-200/80 shadow-md">
            <h3 className="text-2xl font-extrabold text-[var(--text-primary)] mb-2">
              Get a Free Roofing Estimate in {area.name}
            </h3>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
              Contact our licensed San Diego specialists today for an itemized, no-obligation roof proposal.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/contact">
                <span className="inline-flex items-center gap-2 bg-[#2E9BF0] hover:bg-[#1C88DD] text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-lg shadow-brand-blue/30 transition-all hover:brightness-110">
                  <ClipboardCheck className="w-4 h-4" />
                  <span>Request Free Estimate</span>
                </span>
              </Link>
              <a href={PHONE_HREF}>
                <span className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-[var(--text-primary)] font-bold text-xs uppercase tracking-wider px-5 py-3.5 rounded-xl transition-all shadow-xs">
                  <Phone className="w-4 h-4 text-brand-blue" />
                  <span>Call {PHONE_NUMBER}</span>
                </span>
              </a>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
