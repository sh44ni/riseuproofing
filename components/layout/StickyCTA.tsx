'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/shared/Icon';
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

  const handleEstimateClick = (e: React.MouseEvent) => {
    if (isHome) {
      e.preventDefault();
      const estimator = document.getElementById('hero-estimator');
      if (estimator) {
        estimator.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        window.scrollTo({ top: 380, behavior: 'smooth' });
      }
    }
  };

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 inset-x-0 z-50 md:hidden px-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] pt-2 pointer-events-none select-none"
    >
      <div className="pointer-events-auto max-w-[430px] mx-auto bg-slate-900/95 dark:bg-[#07131e]/96 backdrop-blur-3xl border border-white/20 rounded-[24px] shadow-[0_16px_44px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.1),inset_0_1px_1px_rgba(255,255,255,0.2)] px-2.5 py-2 flex items-center justify-between gap-1.5">
        
        {/* Tab 1: Home */}
        <Link
          href="/"
          className="flex-1 flex flex-col items-center justify-center active:scale-90 transition-transform duration-150 group cursor-pointer"
        >
          <div
            className={cn(
              'flex flex-col items-center justify-center w-full min-h-[48px] py-1 px-1 rounded-2xl transition-all duration-200',
              isHome ? 'bg-white/12 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Icon name="home"
              className={cn(
                'w-5 h-5 transition-transform duration-200',
                isHome ? 'scale-110 stroke-[2.3] text-[#38BDF8]' : 'stroke-[1.8] group-hover:scale-105'
              )}
            />
            <span
              className={cn(
                'text-[10.5px] mt-1 tracking-tight leading-none',
                isHome ? 'font-bold text-white' : 'font-medium text-slate-400'
              )}
            >
              Home
            </span>
            {isHome && <span className="w-1 h-1 rounded-full bg-[#38BDF8] mt-1" />}
          </div>
        </Link>

        {/* Tab 2: Services */}
        <Link
          href="/services"
          className="flex-1 flex flex-col items-center justify-center active:scale-90 transition-transform duration-150 group cursor-pointer"
        >
          <div
            className={cn(
              'flex flex-col items-center justify-center w-full min-h-[48px] py-1 px-1 rounded-2xl transition-all duration-200',
              isServices ? 'bg-white/12 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Icon name="wrench"
              className={cn(
                'w-5 h-5 transition-transform duration-200',
                isServices ? 'scale-110 stroke-[2.3] text-[#38BDF8]' : 'stroke-[1.8] group-hover:scale-105'
              )}
            />
            <span
              className={cn(
                'text-[10.5px] mt-1 tracking-tight leading-none',
                isServices ? 'font-bold text-white' : 'font-medium text-slate-400'
              )}
            >
              Services
            </span>
            {isServices && <span className="w-1 h-1 rounded-full bg-[#38BDF8] mt-1" />}
          </div>
        </Link>

        {/* Tab 3: Reviews */}
        <Link
          href="/reviews"
          className="flex-1 flex flex-col items-center justify-center active:scale-90 transition-transform duration-150 group cursor-pointer"
        >
          <div
            className={cn(
              'flex flex-col items-center justify-center w-full min-h-[48px] py-1 px-1 rounded-2xl transition-all duration-200',
              isReviews ? 'bg-white/12 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Icon name="star"
              className={cn(
                'w-5 h-5 transition-transform duration-200',
                isReviews ? 'fill-[#38BDF8] text-[#38BDF8] scale-110' : 'text-slate-400 group-hover:scale-105'
              )}
            />
            <span
              className={cn(
                'text-[10.5px] mt-1 tracking-tight leading-none',
                isReviews ? 'font-bold text-white' : 'font-medium text-slate-400'
              )}
            >
              Reviews
            </span>
            {isReviews && <span className="w-1 h-1 rounded-full bg-[#38BDF8] mt-1" />}
          </div>
        </Link>

        {/* Tab 4: Playful Direct Call Action */}
        <a
          href={PHONE_HREF}
          className="flex-1 flex flex-col items-center justify-center active:scale-90 transition-transform duration-150 group cursor-pointer"
          aria-label="Call Rise Up Roofing"
        >
          <div className="flex flex-col items-center justify-center w-full min-h-[48px] py-1 px-1 rounded-2xl hover:bg-emerald-500/10 transition-all duration-200">
            <Icon name="phone" className="w-5 h-5 text-emerald-400 stroke-[2.3] transition-transform group-hover:rotate-12" />
            <span className="text-[10.5px] mt-1 tracking-tight leading-none font-bold text-emerald-400">
              Call
            </span>
            <span className="w-1 h-1 rounded-full bg-emerald-400/70 mt-1" />
          </div>
        </a>

        {/* Tab 5: Juicy, Chunky Estimate Action Pill */}
        <Link
          href={isHome ? '#hero-estimator' : '/contact'}
          onClick={handleEstimateClick}
          className="flex-shrink-0 active:scale-92 transition-transform duration-150 cursor-pointer pl-0.5"
          aria-label="Get Free Estimate"
        >
          <div
            className={cn(
              'px-4 py-2.5 min-h-[48px] rounded-2xl font-bold flex items-center gap-2 shadow-[0_6px_22px_rgba(46,155,240,0.55),inset_0_1px_1px_rgba(255,255,255,0.45)] border border-white/25 transition-all',
              isContact
                ? 'bg-[#1C88DD] text-white ring-2 ring-white/40'
                : 'bg-gradient-to-r from-[#2E9BF0] via-[#38BDF8] to-[#1C88DD] hover:brightness-110 text-white'
            )}
          >
            <Icon name="sparkles" className="w-4 h-4 text-white animate-pulse flex-shrink-0" />
            <span className="text-[11.5px] font-black tracking-wider uppercase text-white whitespace-nowrap">
              Estimate
            </span>
          </div>
        </Link>

      </div>
    </nav>
  );
}

