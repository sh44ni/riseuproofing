import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-white/[0.07] border border-white/[0.08] relative overflow-hidden',
        'after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_2s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/[0.06] after:to-transparent',
        className
      )}
    />
  );
}

export function ServiceCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/15 p-6 bg-[#0B1B2B]/60 min-h-[460px] flex flex-col justify-end relative overflow-hidden">
      <Skeleton className="absolute top-5 left-5 w-24 h-6 rounded-lg" />
      <div className="space-y-3 z-10">
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="grid grid-cols-2 gap-3 py-3 border-y border-white/10 my-3">
          <Skeleton className="h-8 rounded-lg" />
          <Skeleton className="h-8 rounded-lg" />
        </div>
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/15 p-6 bg-[#0B1B2B]/60 min-h-[420px] flex flex-col justify-end relative overflow-hidden">
      <div className="absolute top-5 left-5 flex gap-2">
        <Skeleton className="w-20 h-6 rounded-lg" />
        <Skeleton className="w-16 h-6 rounded-lg" />
      </div>
      <div className="space-y-3 z-10">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="grid grid-cols-2 gap-3 py-3 border-t border-white/10 my-2">
          <Skeleton className="h-6 rounded-lg" />
          <Skeleton className="h-6 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function ReviewCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/15 p-6 bg-[#0B1B2B]/60 min-h-[220px] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="w-28 h-4" />
              <Skeleton className="w-20 h-3" />
            </div>
          </div>
          <Skeleton className="w-16 h-5 rounded-md" />
        </div>
        <div className="space-y-2">
          <Skeleton className="w-full h-3.5" />
          <Skeleton className="w-5/6 h-3.5" />
          <Skeleton className="w-4/6 h-3.5" />
        </div>
      </div>
      <div className="pt-3 border-t border-white/10 flex justify-between mt-4">
        <Skeleton className="w-24 h-3" />
        <Skeleton className="w-16 h-3" />
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-[#07131F] text-white pt-28 pb-20 px-4 sm:px-6 lg:px-12 max-w-[1400px] mx-auto space-y-16">
      {/* Hero Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-6">
          <Skeleton className="w-36 h-7 rounded-full" />
          <Skeleton className="w-full h-14 sm:h-18 rounded-2xl" />
          <Skeleton className="w-5/6 h-6" />
          <div className="flex gap-4 pt-2">
            <Skeleton className="w-40 h-12 rounded-xl" />
            <Skeleton className="w-36 h-12 rounded-xl" />
          </div>
          <div className="grid grid-cols-4 gap-2 pt-4">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        </div>
        <div className="lg:col-span-5">
          <Skeleton className="w-full h-[460px] rounded-3xl" />
        </div>
      </div>

      {/* Services Grid Skeleton */}
      <div className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <Skeleton className="w-24 h-4 mx-auto" />
          <Skeleton className="w-72 h-8 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ServiceCardSkeleton />
          <ServiceCardSkeleton />
          <ServiceCardSkeleton />
        </div>
      </div>
    </div>
  );
}
