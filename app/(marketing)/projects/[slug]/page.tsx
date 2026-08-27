import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, ArrowRight, CheckCircle2, ShieldCheck, ClipboardCheck } from 'lucide-react';
import { getProjectBySlug, getAllProjectSlugs } from '@/lib/data/projects';
import { buildMetadata } from '@/lib/seo/metadata';
import { Section } from '@/components/shared/Container';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';

export async function generateStaticParams() {
  return getAllProjectSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return {};
  return buildMetadata({
    title: `${project.title} | San Diego Roofing Case Study`,
    description: `${project.title} in ${project.city}, CA. See before and after photos, scope of work, and materials used.`,
    path: `/projects/${project.slug}`,
    ogImage: project.afterImage,
  });
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  return (
    <>
      {/* Hero — full-width case study image */}
      <section className="relative min-h-[460px] flex items-end overflow-hidden bg-[#0B1B2B]">
        <Image
          src={project.afterImage}
          alt={project.title}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07131F] via-[#0B1B2B]/75 to-[#0B1B2B]/35" />
        
        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 pb-12 pt-36">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Projects', href: '/projects' },
              { label: project.title }
            ]}
          />
          <div className="flex items-center gap-2 mb-3">
            <span className="glass-chip px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white">
              {project.category}
            </span>
            <span className="glass-chip px-3 py-1 rounded-full text-xs font-semibold text-white/90 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-brand-blue" />
              {project.city}, California
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-2 tracking-tight">
            {project.title}
          </h1>
        </div>
      </section>

      <Section dark={true} alternate={false}>
        <div className="grid grid-cols-1 lg:grid-cols-[62%_38%] gap-10 lg:gap-12">
          {/* Left — Scope & Gallery */}
          <div>
            <div className="glass-card-interactive rounded-2xl p-6 sm:p-8 mb-8 border-white/15">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-4">
                Scope of Work
              </h2>
              <p className="text-sm text-white/80 leading-relaxed mb-6">
                {project.scopeOfWork}
              </p>

              <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-blue" />
                <span>Materials &amp; Specifications</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {project.materialsUsed.map((mat) => (
                  <div
                    key={mat}
                    className="glass-chip rounded-xl p-3 flex items-center gap-2 text-xs text-white/90"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{mat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Gallery */}
            {project.gallery.length > 1 && (
              <div>
                <h3 className="text-xl font-extrabold text-white mb-4">
                  Project Gallery
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {project.gallery.map((img, i) => (
                    <div key={i} className="relative aspect-[4/3] rounded-2xl overflow-hidden glass-chip border-white/15">
                      <Image
                        src={img}
                        alt={`${project.title} photo ${i + 1}`}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right — Sticky Glass Info Card */}
          <div>
            <div className="lg:sticky lg:top-28 glass-card-hero rounded-3xl p-6 sm:p-8 border-white/20 shadow-2xl">
              <h3 className="text-lg font-extrabold text-white mb-5 pb-3 border-b border-white/15">
                Project Summary
              </h3>
              
              <div className="space-y-3.5 text-xs mb-6">
                <div className="flex justify-between items-center py-1 border-b border-white/10">
                  <span className="text-white/60 font-semibold uppercase tracking-wider">Location</span>
                  <span className="font-bold text-white">{project.city}, CA</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/10">
                  <span className="text-white/60 font-semibold uppercase tracking-wider">Category</span>
                  <span className="font-bold text-white capitalize">{project.category}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/10">
                  <span className="text-white/60 font-semibold uppercase tracking-wider">Warranty</span>
                  <span className="font-bold text-emerald-300">Lifetime Owens Corning</span>
                </div>
              </div>

              {project.clientQuote && (
                <div className="glass-chip rounded-2xl p-4 mb-6 border-white/15">
                  <p className="text-xs text-white/90 italic mb-2 leading-relaxed">
                    &ldquo;{project.clientQuote.text}&rdquo;
                  </p>
                  <p className="text-[11px] text-brand-blue font-bold">
                    — {project.clientQuote.author}
                  </p>
                </div>
              )}

              <Link href="/contact" className="block">
                <span className="w-full inline-flex items-center justify-center gap-2 bg-[#2E9BF0] hover:bg-[#1C88DD] text-white font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl shadow-lg shadow-brand-blue/30 transition-all hover:brightness-110">
                  <ClipboardCheck className="w-4 h-4" />
                  <span>Get a Similar Estimate</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
