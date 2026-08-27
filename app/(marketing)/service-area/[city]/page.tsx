import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, ShieldCheck, Phone, ClipboardCheck } from 'lucide-react';
import { getServiceAreaBySlug, getAllServiceAreaSlugs } from '@/lib/data/serviceAreas';
import { services } from '@/lib/data/services';
import { buildMetadata } from '@/lib/seo/metadata';
import { Section } from '@/components/shared/Container';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { COMPANY_NAME, PHONE_NUMBER, PHONE_HREF, LICENSE_NUMBER } from '@/lib/utils';

export async function generateStaticParams() {
  return getAllServiceAreaSlugs().map((city) => ({ city }));
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city } = await params;
  const area = getServiceAreaBySlug(city);
  if (!area) return {};
  return buildMetadata({
    title: `Roofing & Construction in ${area.name}, CA | Rise Up Roofing`,
    description: `${COMPANY_NAME} provides expert roofing, tile underlayment, repairs, solar, and construction services in ${area.name}, California. Licensed, bonded & insured. Free estimates.`,
    path: `/service-area/${area.slug}`,
  });
}

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const area = getServiceAreaBySlug(city);
  if (!area) notFound();

  return (
    <Section dark={true} alternate={false} className="pt-32 sm:pt-36">
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

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 tracking-tight">
          Roofing &amp; Construction in {area.name}, CA
        </h1>

        <p className="text-sm sm:text-base text-white/80 mb-10 leading-relaxed">
          {COMPANY_NAME} is proud to serve homeowners and commercial property managers in {area.name}, {area.county} County. 
          Whether you need a complete roof replacement, tile relay with 2-ply underlayment, emergency leak detection, or general construction repairs, our licensed team delivers master craftsmanship backed by 50-year manufacturer warranties.
        </p>

        {/* Local Services Grid */}
        <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-6">
          Our Roofing Services in {area.name}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {services.map((service) => (
            <Link
              key={service.slug}
              href={`/services/${service.slug}`}
              className="glass-card-interactive rounded-2xl p-5 flex items-center gap-3.5 border-white/15 hover:border-white/30 transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-brand-blue/20 text-brand-blue flex items-center justify-center flex-shrink-0 group-hover:bg-brand-blue group-hover:text-white transition-colors">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-white group-hover:text-brand-blue transition-colors">
                  {service.name}
                </h3>
                <p className="text-xs text-white/60 line-clamp-1 mt-0.5">
                  {service.shortDescription}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-brand-blue group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
        </div>

        {/* Why Choose Rise Up in This City */}
        <div className="glass-card-interactive rounded-3xl p-6 sm:p-8 mb-12 border-white/15">
          <h2 className="text-xl font-extrabold text-white mb-4">
            Why {area.name} Homeowners Choose Rise Up Roofing
          </h2>
          <div className="space-y-4 text-xs sm:text-sm text-white/80 leading-relaxed">
            <p>
              As a local San Diego County contractor with over 25 years of experience, we understand the specific environmental factors affecting {area.name} properties — including coastal salt fog, morning moisture, UV exposure, and Santa Ana winds.
            </p>
            <p>
              With California Contractor&apos;s License #{LICENSE_NUMBER}, we are fully licensed, bonded, and insured. As an Owens Corning Preferred Contractor, we install roofing systems to exact manufacturer specifications, ensuring full warranty protection.
            </p>
          </div>
        </div>

        {/* City CTA Banner */}
        <div className="glass-card-hero rounded-3xl p-8 sm:p-10 text-center border-white/20 shadow-2xl">
          <h3 className="text-2xl font-extrabold text-white mb-2">
            Get a Free Estimate in {area.name}
          </h3>
          <p className="text-xs sm:text-sm text-white/75 mb-6 leading-relaxed">
            Contact our licensed specialists today for an itemized, no-obligation roof proposal.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/contact">
              <span className="inline-flex items-center gap-2 bg-[#2E9BF0] hover:bg-[#1C88DD] text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-lg shadow-brand-blue/30 transition-all hover:brightness-110">
                <ClipboardCheck className="w-4 h-4" />
                <span>Request Free Estimate</span>
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
      </div>
    </Section>
  );
}
