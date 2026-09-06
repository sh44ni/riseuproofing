import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, ArrowRight, ShieldCheck, Sun, CheckCircle2 } from 'lucide-react';
import { buildMetadata } from '@/lib/seo/metadata';
import { projects, projectCategories } from '@/lib/data/projects';
import { Section } from '@/components/shared/Container';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';

export const metadata: Metadata = buildMetadata({
  title: 'Our Projects Portfolio | San Diego Roofing',
  description: 'Browse our portfolio of completed roofing and construction projects across San Diego County. Before and after photos, scope of work, and client testimonials.',
  path: '/projects',
});

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const filtered = category && category !== 'all'
    ? projects.filter((p) => p.category.toLowerCase() === category.toLowerCase())
    : projects;

  const currentCategory = projectCategories.find((c) => c.value === category);
  const h1Title = !category || category === 'all'
    ? 'Our Roofing & Construction Projects'
    : category === 'repairs'
    ? 'Roof Repair Projects'
    : `${currentCategory?.label || category} Roofing Projects`;

  return (
    <Section alternate={false} className="pt-32 sm:pt-36">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Projects' }]} />
      
      <SectionHeading
        as="h1"
        label="Our Portfolio"
        title={h1Title}
        subtitle="Explore our completed roofing, tile relay, commercial flat roofing, and general construction projects. Every home is protected with master craftsmanship."
      />

      {/* Filter pills */}
      <div className="flex flex-wrap justify-center gap-2 mb-12">
        {projectCategories.map((cat) => {
          const isActive = (!category && cat.value === 'all') || category === cat.value;
          return (
            <Link
              key={cat.value}
              href={cat.value === 'all' ? '/projects' : `/projects?category=${cat.value}`}
            >
              <span
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all inline-block border ${
                  isActive
                    ? 'bg-brand-blue text-white border-brand-blue shadow-lg shadow-brand-blue/30 scale-105'
                    : 'bg-white text-[#475569] hover:text-brand-blue hover:bg-slate-50 border-slate-200/80 shadow-2xs'
                }`}
              >
                {cat.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Solar Category Educational Overview Banner */}
      {category === 'solar' && (
        <div className="max-w-4xl mx-auto mb-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-blue-50/90 via-sky-50/60 to-white border border-blue-100/90 shadow-sm">
          <div className="flex items-center gap-2.5 mb-3 text-brand-blue font-bold text-xs uppercase tracking-wider">
            <Sun className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>Solar Roofing Specialists • San Diego County</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-brand-navy mb-3">
            Solar Panel Detach, Roof Replacement &amp; Waterproof Reset
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            When replacing your roof or restoring deteriorated tile underlayment, existing solar photovoltaic systems require certified handling. Rise Up Roofing provides specialized solar detach and reset services, coordinating safe electrical decoupling, careful panel storage, comprehensive roof deck replacement, and watertight reinstallation. Every penetration is flashed with engineered stanchion boots to protect your home against water intrusion while safeguarding your solar equipment warranties.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold text-slate-700">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-brand-blue flex-shrink-0" />
              <span>Safe Electrical Decoupling</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-brand-blue flex-shrink-0" />
              <span>Watertight Boot Flashing</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Warranties Fully Protected</span>
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {filtered.map((project) => (
          <Link key={project.slug} href={`/projects/${project.slug}`} className="group flex">
            <div className="glass-card-interactive rounded-2xl overflow-hidden flex flex-col w-full border border-slate-200/80 hover:border-brand-blue/30 shadow-sm transition-all duration-300">
              <div className="image-overlay-card relative h-60 overflow-hidden">
                <Image
                  src={project.afterImage}
                  alt={project.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1B2B] via-transparent to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="glass-chip px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white backdrop-blur-md border-white/20">
                    {project.category}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                  <span className="glass-chip px-2.5 py-1 rounded-lg flex items-center gap-1.5 backdrop-blur-md text-[11px] font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-brand-blue" />
                    {project.city}, CA
                  </span>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)] mb-1.5 group-hover:text-brand-blue transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-4 leading-relaxed">
                    {project.scopeOfWork}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-brand-blue group-hover:text-[#1C88DD] transition-colors">
                  <span>View Project Case Study</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}
