import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@/components/shared/Icon';
import { services, getServiceBySlug, getAllServiceSlugs } from '@/lib/data/services';
import { projects } from '@/lib/data/projects';
import { buildMetadata, buildServiceJsonLd, buildFAQJsonLd } from '@/lib/seo/metadata';
import { Section } from '@/components/shared/Container';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { FAQAccordion } from '@/components/shared/FAQAccordion';
import { PHONE_HREF, PHONE_NUMBER } from '@/lib/utils';

export async function generateStaticParams() {
  return getAllServiceSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return {};
  return buildMetadata({
    title: service.seoTitle || `${service.name} | San Diego Roofing Experts`,
    description: service.seoDescription || service.shortDescription,
    path: `/services/${service.slug}`,
    ogImage: service.heroImage,
  });
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  const relatedProjects = projects.filter((p) => p.category.toLowerCase().includes(slug.toLowerCase()) || slug.includes(p.category.toLowerCase())).slice(0, 3);
  const serviceJsonLd = buildServiceJsonLd(service);
  const faqJsonLd = service.faqs.length > 0 ? buildFAQJsonLd(service.faqs) : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}

      {/* Hero Banner */}
      <section className="relative min-h-[460px] flex items-end overflow-hidden bg-[#0B1B2B]">
        <Image
          src={service.heroImage}
          alt={service.name}
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07131F] via-[#0B1B2B]/75 to-[#0B1B2B]/40" />
        
        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 pb-12 pt-36">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Services', href: '/services' },
              { label: service.name }
            ]}
          />
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 tracking-tight">
            {service.name}
          </h1>
          <p className="text-sm sm:text-base text-white/80 max-w-2xl leading-relaxed mb-6">
            {service.shortDescription}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/contact">
              <span className="inline-flex items-center gap-2 bg-[#2E9BF0] hover:bg-[#1C88DD] text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl shadow-lg shadow-brand-blue/30 transition-all hover:brightness-110">
                <Icon name="clipboard-check" className="w-4 h-4" />
                <span>Get a Free Estimate</span>
              </span>
            </Link>
            <a href={PHONE_HREF}>
              <span className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-xl backdrop-blur-md transition-all">
                <Icon name="phone" className="w-4 h-4 text-brand-blue" />
                <span>{PHONE_NUMBER}</span>
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* Detailed Overview & Deep Dive Section (SEO & Educational Value) */}
      {service.detailedOverview && (
        <Section alternate={false} className="py-12 sm:py-16">
          <div className="max-w-4xl mx-auto">
            <SectionHeading
              label="Expert Overview"
              title={service.detailedOverview.heading}
              subtitle={service.detailedOverview.subheading}
              centered={false}
            />
            <div className="space-y-4 text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed mb-8">
              {service.detailedOverview.paragraphs.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            {service.detailedOverview.highlights && service.detailedOverview.highlights.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                {service.detailedOverview.highlights.map((item, i) => (
                  <div key={i} className="glass-card-interactive rounded-2xl p-5 border border-slate-200/80 shadow-xs">
                    <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1 flex items-center gap-2">
                      <Icon name="shield-check" className="w-4 h-4 text-brand-blue flex-shrink-0" />
                      <span>{item.title}</span>
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* What's Included */}
      <Section alternate={service.detailedOverview ? true : false}>
        <SectionHeading
          label="What's Included"
          title={`Our ${service.name} Scope of Work`}
          subtitle="Every project includes comprehensive property protection, premium materials, and certified installation."
          centered={false}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {service.includes.map((item) => (
            <div
              key={item}
              className="glass-card-interactive rounded-2xl p-5 flex items-start gap-3.5 border border-slate-200/80 shadow-xs"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-100">
                <Icon name="check-circle" className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--text-primary)] mb-1">{item}</h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Engineered and inspected according to manufacturer specifications and San Diego coastal building codes.
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Process */}
      <Section alternate={true}>
        <SectionHeading
          label="Our Process"
          title="How We Deliver Lasting Results"
          subtitle="A seamless 5-step workflow designed for complete transparency, safety, and guaranteed quality."
          centered={false}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
          {service.processSteps.map((step, index) => (
            <div
              key={index}
              className="glass-card-interactive rounded-2xl p-5 flex flex-col justify-between border border-slate-200/80 shadow-xs"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-brand-blue text-white flex items-center justify-center font-extrabold text-sm mb-4 shadow-md shadow-brand-blue/30">
                  0{index + 1}
                </div>
                <h4 className="text-sm font-bold text-[var(--text-primary)] mb-2">{step.title}</h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Related Projects */}
      {relatedProjects.length > 0 && (
        <Section alternate={false}>
          <SectionHeading
            label="Real Craftsmanship"
            title={`Recent ${service.name} Projects`}
            subtitle="Explore our completed work in San Diego County."
            centered={false}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedProjects.map((project) => (
              <Link key={project.slug} href={`/projects/${project.slug}`} className="group flex">
                <div className="image-overlay-card glass-card-interactive rounded-2xl overflow-hidden flex flex-col w-full border border-slate-200/80 shadow-xs">
                  <div className="relative h-52 overflow-hidden">
                    <Image
                      src={project.afterImage}
                      alt={project.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B1B2B] via-transparent to-transparent" />
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text-primary)] mb-1 group-hover:text-brand-blue transition-colors">
                        {project.title}
                      </h4>
                      <p className="text-xs text-[var(--text-muted)] mb-3">{project.city}, CA</p>
                    </div>
                    <span className="text-xs font-bold text-brand-blue flex items-center gap-1 group-hover:text-[#1C88DD] transition-colors">
                      View Project <Icon name="arrow-right" className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* FAQ */}
      {service.faqs.length > 0 && (
        <Section alternate={true}>
          <SectionHeading
            label="Common Questions"
            title={`${service.name} FAQ`}
            subtitle="Answers to the most frequently asked questions about this roofing service."
            centered={true}
          />
          <FAQAccordion items={service.faqs} />
        </Section>
      )}

      {/* Related Services Internal Linking */}
      <Section>
        <SectionHeading
          label="Explore More Capabilities"
          title="Related Roofing & Construction Services"
          subtitle="Explore complementary services designed to protect and enhance your Southern California property."
          centered={true}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {services
            .filter((s) => s.slug !== slug)
            .slice(0, 4)
            .map((s) => (
              <Link
                key={s.slug}
                href={`/services/${s.slug}`}
                className="group p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-brand-blue/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-brand-blue transition-colors mb-2">
                    {s.name}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                    {s.shortDescription}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-brand-blue">
                  <span>Learn More</span>
                  <Icon name="arrow-right" className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
        </div>
      </Section>

      <section className="py-16 bg-[#F4F8FD] border-t border-slate-200/80 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="glass-card-hero rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-md">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] mb-3">
              Ready for a Free {service.name} Proposal?
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-6 max-w-md mx-auto leading-relaxed">
              Schedule your 100% free inspection with our licensed San Diego specialists today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/contact">
                <span className="inline-flex items-center gap-2 bg-[#2E9BF0] hover:bg-[#1C88DD] text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-lg shadow-brand-blue/30 transition-all hover:brightness-110">
                  <Icon name="clipboard-check" className="w-4 h-4" />
                  <span>Request Free Estimate</span>
                </span>
              </Link>
              <a href={PHONE_HREF}>
                <span className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-[var(--text-primary)] font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl transition-all shadow-xs">
                  <Icon name="phone" className="w-4 h-4 text-brand-blue" />
                  <span>Call {PHONE_NUMBER}</span>
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
