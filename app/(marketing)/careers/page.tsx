import type { Metadata } from 'next';
import Link from 'next/link';
import { Briefcase, MapPin, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { buildMetadata } from '@/lib/seo/metadata';
import { jobs } from '@/lib/data/careers';
import { Section } from '@/components/shared/Container';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';

export const metadata: Metadata = buildMetadata({
  title: 'Careers | Join Rise Up Roofing San Diego',
  description: 'Join the Rise Up team. We are hiring roofers, foremen, sales representatives, and project managers across San Diego County. Top pay and career growth.',
  path: '/careers',
});

export default function CareersPage() {
  return (
    <Section alternate={false} className="pt-32 sm:pt-36">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Careers' }]} />
      
      <SectionHeading
        label="Join Our Crew"
        title="Build Your Career With Rise Up Roofing"
        subtitle="We are growing fast across San Diego County and looking for master craftsmen and project leaders who take pride in their work. Top industry compensation, growth, and a team that feels like family."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {jobs.map((job) => (
          <Link key={job.slug} href={`/careers/${job.slug}`} className="group flex">
            <div className="glass-card-interactive rounded-2xl p-6 sm:p-7 flex flex-col justify-between w-full border border-slate-200/80 hover:border-brand-blue/40 transition-all duration-300">
              <div>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-brand-blue transition-colors">
                    {job.title}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200">
                    {job.employmentType.replace('-', ' ')}
                  </span>
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-[var(--text-secondary)] mb-4">
                  <span className="flex items-center gap-1.5 glass-chip px-2.5 py-1 rounded-lg">
                    <Briefcase className="w-3.5 h-3.5 text-brand-blue" />
                    {job.department}
                  </span>
                  <span className="flex items-center gap-1.5 glass-chip px-2.5 py-1 rounded-lg">
                    <MapPin className="w-3.5 h-3.5 text-brand-blue" />
                    San Diego County, CA
                  </span>
                  <span className="flex items-center gap-1.5 glass-chip px-2.5 py-1 rounded-lg">
                    <Clock className="w-3.5 h-3.5 text-brand-blue" />
                    {job.employmentType}
                  </span>
                </div>

                <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-6 leading-relaxed">
                  {job.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-brand-blue group-hover:text-[#1C88DD] transition-colors">
                <span>View Responsibilities &amp; Apply</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}
