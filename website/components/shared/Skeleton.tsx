import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-slate-800/50 border border-white/[0.06] relative overflow-hidden',
        'after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_2.2s_infinite]',
        'after:bg-gradient-to-r after:from-transparent after:via-amber-400/[0.07] after:to-transparent',
        className
      )}
    />
  );
}

export function WebsiteNavSkeleton() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/5 py-3.5 px-4 sm:px-6 lg:px-12">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between">
        {/* Logo Brand */}
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl bg-amber-500/20 border-amber-500/30" />
          <div className="space-y-1">
            <Skeleton className="w-28 h-4" />
            <Skeleton className="w-20 h-2.5" />
          </div>
        </div>

        {/* Center Nav Links (Desktop) */}
        <div className="hidden md:flex items-center gap-6">
          <Skeleton className="w-16 h-3.5" />
          <Skeleton className="w-16 h-3.5" />
          <Skeleton className="w-20 h-3.5" />
          <Skeleton className="w-14 h-3.5" />
          <Skeleton className="w-24 h-3.5" />
        </div>

        {/* Right CTA */}
        <div className="flex items-center gap-3">
          <Skeleton className="hidden sm:block w-32 h-9 rounded-xl" />
          <Skeleton className="w-36 h-10 rounded-xl bg-amber-500/20 border-amber-500/30" />
        </div>
      </div>
    </header>
  );
}

export function WebsiteHeroSkeleton() {
  return (
    <div className="pt-32 pb-16 px-4 sm:px-6 lg:px-12 max-w-[1400px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Headline Copy */}
        <div className="lg:col-span-7 space-y-6">
          {/* Trust Badge Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/5">
            <Skeleton className="w-4 h-4 rounded-full bg-amber-400/30" />
            <Skeleton className="w-56 h-3 rounded-full" />
          </div>

          {/* Massive Display Heading */}
          <div className="space-y-3">
            <Skeleton className="w-full h-12 sm:h-16 rounded-2xl" />
            <Skeleton className="w-4/5 h-12 sm:h-16 rounded-2xl" />
          </div>

          {/* Subtext Paragraph */}
          <div className="space-y-2 max-w-xl">
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-11/12 h-4" />
            <Skeleton className="w-3/4 h-4" />
          </div>

          {/* Dual Action Buttons */}
          <div className="flex flex-wrap gap-4 pt-2">
            <Skeleton className="w-48 h-12 rounded-xl bg-amber-500/25 border-amber-500/40" />
            <Skeleton className="w-44 h-12 rounded-xl" />
          </div>

          {/* 4 Stat KPI Metric Boxes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-white/5">
            {[
              { val: '50-Year', sub: 'Non-Prorated' },
              { val: '#1096492', sub: 'Licensed & Insured' },
              { val: '15+ Yrs', sub: 'San Diego Trade' },
              { val: '5.0 ★', sub: 'Google Reviews' },
            ].map((_, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1.5">
                <Skeleton className="w-16 h-5" />
                <Skeleton className="w-20 h-3" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Hero Visual Card */}
        <div className="lg:col-span-5">
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-3 shadow-2xl relative">
            <Skeleton className="w-full h-[440px] rounded-2xl" />
            <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-slate-950/80 backdrop-blur-md border border-white/10 flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="w-32 h-4" />
                <Skeleton className="w-24 h-3" />
              </div>
              <Skeleton className="w-20 h-7 rounded-lg bg-amber-500/20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ServiceCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 p-6 bg-slate-900/60 min-h-[440px] flex flex-col justify-between relative overflow-hidden">
      {/* Top Tag & Icon */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="w-24 h-6 rounded-full" />
          <Skeleton className="w-9 h-9 rounded-xl bg-amber-500/15" />
        </div>
        <Skeleton className="h-7 w-3/4 mb-3" />
        <div className="space-y-2 mb-6">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-5/6" />
          <Skeleton className="h-3.5 w-4/6" />
        </div>
      </div>

      {/* Feature Checklist Placeholders */}
      <div className="space-y-2 py-4 border-y border-white/5 my-2">
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded-full bg-amber-400/20" />
          <Skeleton className="h-3.5 w-4/5" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded-full bg-amber-400/20" />
          <Skeleton className="h-3.5 w-3/4" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded-full bg-amber-400/20" />
          <Skeleton className="h-3.5 w-2/3" />
        </div>
      </div>

      {/* Bottom Action CTA */}
      <Skeleton className="h-11 w-full rounded-xl bg-slate-800/80" />
    </div>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden bg-slate-900/60 flex flex-col">
      {/* Image Aspect Ratio Placeholder */}
      <div className="relative aspect-[16/10] w-full bg-slate-800/60">
        <Skeleton className="w-full h-full rounded-none" />
        <div className="absolute top-4 left-4 flex gap-2">
          <Skeleton className="w-24 h-6 rounded-full bg-slate-950/70" />
          <Skeleton className="w-20 h-6 rounded-full bg-amber-500/20" />
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <Skeleton className="h-6 w-3/4 mb-2" />
          <div className="space-y-1.5 mb-3">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-4/5" />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Skeleton className="w-4 h-4 rounded-full" />
            <Skeleton className="w-28 h-3" />
          </div>
        </div>

        {/* Specs footer */}
        <div className="pt-3 border-t border-white/5 flex items-center justify-between">
          <Skeleton className="w-32 h-3" />
          <Skeleton className="w-20 h-8 rounded-lg bg-amber-500/15" />
        </div>
      </div>
    </div>
  );
}

export function ReviewCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 p-6 bg-slate-900/60 flex flex-col justify-between space-y-4">
      <div>
        {/* Customer Avatar & Stars Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-11 h-11 rounded-full bg-amber-500/20" />
            <div className="space-y-1.5">
              <Skeleton className="w-28 h-4" />
              <Skeleton className="w-20 h-3" />
            </div>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Skeleton key={s} className="w-4 h-4 rounded-sm bg-amber-400/30" />
            ))}
          </div>
        </div>

        {/* Review Feedback Text */}
        <div className="space-y-2">
          <Skeleton className="w-full h-3.5" />
          <Skeleton className="w-11/12 h-3.5" />
          <Skeleton className="w-4/5 h-3.5" />
        </div>
      </div>

      {/* Verified homeowner stamp */}
      <div className="pt-3 border-t border-white/5 flex items-center justify-between">
        <Skeleton className="w-28 h-3 rounded-full" />
        <Skeleton className="w-16 h-3 rounded-full" />
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Authentic Navbar Silhouette */}
      <WebsiteNavSkeleton />

      {/* Authentic Hero Section */}
      <WebsiteHeroSkeleton />

      {/* Services Grid Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-12 max-w-[1400px] mx-auto space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <Skeleton className="w-28 h-4 mx-auto rounded-full bg-amber-400/20" />
          <Skeleton className="w-80 h-9 mx-auto" />
          <Skeleton className="w-96 h-4 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ServiceCardSkeleton />
          <ServiceCardSkeleton />
          <ServiceCardSkeleton />
        </div>
      </section>
    </div>
  );
}
