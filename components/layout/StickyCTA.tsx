'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Wrench, Star, Phone, ClipboardCheck } from 'lucide-react';
import { PHONE_HREF, cn } from '@/lib/utils';

export function StickyCTA() {
  const pathname = usePathname();

  // Suppress on admin and customer portal routes
  if (
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/proposal') ||
    pathname?.startsWith('/inspection') ||
    pathname?.startsWith('/warranty')
  ) {
    return null;
  }

  const isHome = pathname === '/';
  const isServices = pathname?.startsWith('/services') ?? false;
  const isReviews = pathname === '/reviews';
  const isContact = pathname === '/contact';

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 inset-x-0 z-40 md:hidden glass-nav-surface border-t border-slate-200/80 dark:border-white/10 backdrop-blur-2xl px-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-1 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] select-none"
    >
      <div className="flex items-center justify-around h-14 max-w-md mx-auto">
        {/* Tab 1: Home */}
        <Link
          href="/"
          className={cn(
            'flex-1 flex flex-col items-center justify-center h-full py-0.5 transition-all relative',
            isHome ? 'text-brand-blue font-bold' : 'text-slate-500 hover:text-slate-800'
          )}
        >
          <Home className={cn('w-5 h-5 transition-transform', isHome && 'scale-110 stroke-[2.25]')} />
          <span className="text-[10px] mt-0.5 tracking-tight font-semibold">Home</span>
          {isHome && (
            <span className="w-1 h-1 bg-brand-blue rounded-full shadow-[0_0_8px_rgba(46,155,240,0.8)] mt-0.5" />
          )}
        </Link>

        {/* Tab 2: Services */}
        <Link
          href="/services"
          className={cn(
            'flex-1 flex flex-col items-center justify-center h-full py-0.5 transition-all relative',
            isServices ? 'text-brand-blue font-bold' : 'text-slate-500 hover:text-slate-800'
          )}
        >
          <Wrench className={cn('w-5 h-5 transition-transform', isServices && 'scale-110 stroke-[2.25]')} />
          <span className="text-[10px] mt-0.5 tracking-tight font-semibold">Services</span>
          {isServices && (
            <span className="w-1 h-1 bg-brand-blue rounded-full shadow-[0_0_8px_rgba(46,155,240,0.8)] mt-0.5" />
          )}
        </Link>

        {/* Tab 3: Reviews */}
        <Link
          href="/reviews"
          className={cn(
            'flex-1 flex flex-col items-center justify-center h-full py-0.5 transition-all relative',
            isReviews ? 'text-brand-blue font-bold' : 'text-slate-500 hover:text-slate-800'
          )}
        >
          <Star className={cn('w-5 h-5 transition-transform', isReviews && 'scale-110 fill-brand-blue stroke-[2]')} />
          <span className="text-[10px] mt-0.5 tracking-tight font-semibold">Reviews</span>
          {isReviews && (
            <span className="w-1 h-1 bg-brand-blue rounded-full shadow-[0_0_8px_rgba(46,155,240,0.8)] mt-0.5" />
          )}
        </Link>

        {/* Tab 4: Direct Call Action */}
        <a
          href={PHONE_HREF}
          className="flex-1 flex flex-col items-center justify-center h-full py-0.5 text-emerald-600 hover:text-emerald-700 transition-all active:scale-95"
          aria-label="Direct Phone Call"
        >
          <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200/80 flex items-center justify-center">
            <Phone className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600/20 stroke-[2.2]" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-bold text-emerald-700">Call</span>
        </a>

        {/* Tab 5: Free Estimate CTA */}
        <Link
          href="/contact"
          className="flex-1 flex flex-col items-center justify-center h-full py-0.5 active:scale-95 transition-transform"
        >
          <div
            className={cn(
              'px-3 py-1 rounded-xl flex items-center gap-1 shadow-sm transition-all',
              isContact
                ? 'bg-brand-blue text-white shadow-brand-blue/30'
                : 'bg-brand-blue/10 border border-brand-blue/30 text-brand-blue'
            )}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span className="text-[10px] font-extrabold uppercase tracking-wide">Quote</span>
          </div>
          {isContact && (
            <span className="w-1 h-1 bg-brand-blue rounded-full shadow-[0_0_8px_rgba(46,155,240,0.8)] mt-0.5" />
          )}
        </Link>
      </div>
    </nav>
  );
}
