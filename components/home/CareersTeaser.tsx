import Link from 'next/link';
import { ArrowRight, Users, Sparkles } from 'lucide-react';
import { Section } from '@/components/shared/Container';

export function CareersTeaser() {
  return (
    <Section alternate={true}>
      <div className="w-full glass-card-interactive rounded-2xl p-7 sm:p-9 border border-[var(--border-default)] hover:border-brand-blue/40 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 transition-all duration-300">
        <div className="max-w-xl text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg mb-3 text-[11px] font-bold uppercase tracking-wider text-[#EAA636] bg-[#EAA636]/15 border border-[#EAA636]/30 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>We&apos;re Hiring In San Diego County</span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[var(--text-primary)] mb-2.5 tracking-tight">
            Build Your Career With Rise Up Roofing
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            Join a crew that values safety, respect, top industry compensation, and year-round steady projects. We are hiring experienced roofing installers, foremen, and project estimators.
          </p>
        </div>

        <Link href="/careers" className="flex-shrink-0 w-full sm:w-auto">
          <span className="inline-flex items-center justify-center gap-2 bg-[var(--surface-overlay)] hover:bg-brand-blue border border-[var(--border-default)] hover:border-brand-blue text-[var(--text-primary)] hover:text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl backdrop-blur-md transition-all shadow-md w-full text-center group cursor-pointer">
            <Users className="w-4 h-4 text-brand-blue group-hover:text-white transition-colors" />
            <span>View Open Positions</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </div>
    </Section>
  );
}
