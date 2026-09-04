'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Phone,
  Mail,
  ShieldCheck,
  ChevronDown,
  Star,
  ArrowRight,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { cn, PHONE_HREF, PHONE_NUMBER, LICENSE_NUMBER } from '@/lib/utils';
import { SERVICES_MEGA_MENU, TOP_CITIES } from '@/lib/data/navigation';
import { MobileNav } from './MobileNav';

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [areasOpen, setAreasOpen] = useState(false);
  const pathname = usePathname();

  const servicesTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const areasTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let ticking = false;
    let lastScrolled = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const isScrolled = window.scrollY > 30;
          if (isScrolled !== lastScrolled) {
            setScrolled(isScrolled);
            lastScrolled = isScrolled;
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdowns on route change
  useEffect(() => {
    setServicesOpen(false);
    setAreasOpen(false);
  }, [pathname]);

  const handleServicesEnter = () => {
    if (servicesTimeoutRef.current) clearTimeout(servicesTimeoutRef.current);
    setServicesOpen(true);
    setAreasOpen(false);
  };

  const handleServicesLeave = () => {
    servicesTimeoutRef.current = setTimeout(() => {
      setServicesOpen(false);
    }, 150);
  };

  const handleAreasEnter = () => {
    if (areasTimeoutRef.current) clearTimeout(areasTimeoutRef.current);
    setAreasOpen(true);
    setServicesOpen(false);
  };

  const handleAreasLeave = () => {
    areasTimeoutRef.current = setTimeout(() => {
      setAreasOpen(false);
    }, 150);
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 animate-hero-1">
      {/* UTILITY TIER — collapses on scroll */}
      <div
        className={cn(
          'w-full bg-[#07131F]/95 text-white/90 border-b border-white/10 transition-all duration-300 overflow-hidden backdrop-blur-md',
          scrolled ? 'max-h-0 opacity-0 py-0 border-b-0' : 'max-h-12 opacity-100 py-1.5'
        )}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between text-[11px]">
          {/* Left: Live Dispatch + License */}
          <div className="flex items-center gap-5">
            <div className="inline-flex items-center gap-1.5 font-medium text-white">
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>24/7 Emergency Storm Dispatch</span>
            </div>

            <div className="hidden md:flex items-center gap-1.5 text-white/70">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-gold" />
              <span>CA License #{LICENSE_NUMBER} • Fully Bonded</span>
            </div>
          </div>

          {/* Right: Reviews + Direct Email */}
          <div className="flex items-center gap-5">
            <Link
              href="/reviews"
              className="inline-flex items-center gap-1.5 text-white hover:text-brand-gold transition-colors font-medium"
            >
              <div className="flex text-amber-400">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
              </div>
              <span className="font-bold text-white">4.9 / 5.0</span>
              <span className="text-white/70 hidden sm:inline">(120+ Reviews)</span>
            </Link>

            <span className="hidden sm:inline-block text-white/30">|</span>

            <a
              href="mailto:info@riseuproofing.com"
              className="hidden sm:flex items-center gap-1.5 text-white/80 hover:text-white transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-brand-blue" />
              <span>info@riseuproofing.com</span>
            </a>
          </div>
        </div>
      </div>

      {/* MAIN NAVIGATION — Frosted Glass Bar with Clear Hierarchy */}
      <div
        className={cn(
          'w-full glass-nav-surface transition-all duration-300 backdrop-blur-2xl'
        )}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-2 sm:py-2.5 flex items-center justify-between gap-4 xl:gap-8">
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex-shrink-0 flex items-center group"
            aria-label="Rise Up Roofing & Construction - Home"
          >
            <Image
              src="/logo.svg"
              alt="Rise Up Roofing & Construction"
              width={165}
              height={46}
              priority
              className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-[1.02]"
            />
          </Link>

          {/* Desktop Navigation Links — Refined Interactive Pills */}
          <nav className="hidden lg:flex items-center gap-1.5 xl:gap-2">
            <Link
              href="/"
              className={cn(
                'text-xs xl:text-sm font-bold tracking-tight px-3 py-1.5 rounded-xl transition-all',
                pathname === '/'
                  ? 'text-brand-blue bg-blue-50/80 border border-blue-200/60 shadow-2xs'
                  : 'text-theme-secondary hover:text-theme-primary hover:bg-slate-100/80'
              )}
            >
              Home
            </Link>

            {/* SERVICES MEGA-MENU TRIGGER */}
            <div
              className="relative"
              onMouseEnter={handleServicesEnter}
              onMouseLeave={handleServicesLeave}
            >
              <Link
                href="/services"
                className={cn(
                  'inline-flex items-center gap-1 text-xs xl:text-sm font-bold tracking-tight px-3 py-1.5 rounded-xl transition-all',
                  pathname.startsWith('/services')
                    ? 'text-brand-blue bg-blue-50/80 border border-blue-200/60 shadow-2xs'
                    : 'text-theme-secondary hover:text-theme-primary hover:bg-slate-100/80'
                )}
                aria-expanded={servicesOpen}
              >
                <span>Services</span>
                <ChevronDown
                  className={cn(
                    'w-3.5 h-3.5 transition-transform duration-200 text-theme-muted',
                    servicesOpen && 'rotate-180 text-brand-blue'
                  )}
                />
              </Link>

              {/* MEGA-MENU DROPDOWN PANEL */}
              {servicesOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 w-[760px] z-50">
                  <div className="bg-white/98 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-200/80 p-6 grid grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-150">
                    {SERVICES_MEGA_MENU.map((col) => {
                      const Icon = col.icon;
                      return (
                        <div key={col.category} className="flex flex-col">
                          <Link
                            href={col.href}
                            className="group/cat flex items-start gap-3 p-2.5 -mx-2 rounded-xl hover:bg-slate-50 transition-colors"
                          >
                            <div
                              className={cn(
                                'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border border-slate-200/60',
                                col.color
                              )}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-[#0B1E33] group-hover/cat:text-brand-blue transition-colors">
                                {col.category}
                              </h4>
                              <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                                {col.description}
                              </p>
                            </div>
                          </Link>

                          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2 pl-2">
                            {col.items.map((item) => (
                              <Link
                                key={item.label}
                                href={item.href}
                                className="text-xs font-medium text-slate-600 hover:text-brand-blue transition-colors py-0.5"
                              >
                                {item.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {/* Mega Menu Footer Banner */}
                    <div className="col-span-3 bg-gradient-to-r from-brand-navy to-brand-dark border border-slate-700/40 text-white rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-blue/20 flex items-center justify-center text-brand-blue border border-brand-blue/30">
                          <Sparkles className="w-4 h-4 text-brand-blue" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white">
                            Need an Emergency Roof Inspection or Repair?
                          </p>
                          <p className="text-[11px] text-white/70">
                            Rapid storm diagnostics &amp; free itemized estimates.
                          </p>
                        </div>
                      </div>
                      <Link
                        href="/contact"
                        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-navy bg-white px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors shadow-sm"
                      >
                        Book Now <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* PROJECTS */}
            <Link
              href="/projects"
              className={cn(
                'text-xs xl:text-sm font-bold tracking-tight px-3 py-1.5 rounded-xl transition-all',
                pathname.startsWith('/projects')
                  ? 'text-brand-blue bg-blue-50/80 border border-blue-200/60 shadow-2xs'
                  : 'text-theme-secondary hover:text-theme-primary hover:bg-slate-100/80'
              )}
            >
              Projects
            </Link>

            {/* SERVICE AREAS DROPDOWN */}
            <div
              className="relative"
              onMouseEnter={handleAreasEnter}
              onMouseLeave={handleAreasLeave}
            >
              <Link
                href="/service-area"
                className={cn(
                  'inline-flex items-center gap-1 text-xs xl:text-sm font-bold tracking-tight px-3 py-1.5 rounded-xl transition-all',
                  pathname.startsWith('/service-area')
                    ? 'text-brand-blue bg-blue-50/80 border border-blue-200/60 shadow-2xs'
                    : 'text-theme-secondary hover:text-theme-primary hover:bg-slate-100/80'
                )}
                aria-expanded={areasOpen}
              >
                <MapPin className="w-3.5 h-3.5 text-theme-muted" />
                <span>Service Areas</span>
                <ChevronDown
                  className={cn(
                    'w-3.5 h-3.5 transition-transform duration-200 text-theme-muted',
                    areasOpen && 'rotate-180 text-brand-blue'
                  )}
                />
              </Link>

              {/* Areas dropdown */}
              {areasOpen && (
                <div className="absolute top-full left-0 pt-3 w-64 z-50">
                  <div className="bg-white/98 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-200/80 p-3 animate-in fade-in zoom-in-95 duration-150">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                      San Diego County Hubs
                    </div>
                    <div className="grid grid-cols-2 gap-1 mt-1">
                      {TOP_CITIES.map((city) => (
                        <Link
                          key={city.slug}
                          href={`/service-area/${city.slug}`}
                          className="px-3 py-2 text-xs text-slate-700 hover:text-brand-blue hover:bg-slate-50 rounded-lg font-medium transition-colors"
                        >
                          {city.name}
                        </Link>
                      ))}
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <Link
                        href="/service-area"
                        className="flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-brand-blue hover:bg-blue-50/60 rounded-lg transition-colors"
                      >
                        <span>All 30+ Service Areas</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* REVIEWS */}
            <Link
              href="/reviews"
              className={cn(
                'text-xs xl:text-sm font-bold tracking-tight px-3 py-1.5 rounded-xl transition-all',
                pathname === '/reviews'
                  ? 'text-brand-blue bg-blue-50/80 border border-blue-200/60 shadow-2xs'
                  : 'text-theme-secondary hover:text-theme-primary hover:bg-slate-100/80'
              )}
            >
              Reviews
            </Link>

            {/* ABOUT */}
            <Link
              href="/about"
              className={cn(
                'text-xs xl:text-sm font-bold tracking-tight px-3 py-1.5 rounded-xl transition-all',
                pathname === '/about'
                  ? 'text-brand-blue bg-blue-50/80 border border-blue-200/60 shadow-2xs'
                  : 'text-theme-secondary hover:text-theme-primary hover:bg-slate-100/80'
              )}
            >
              About
            </Link>

            {/* CONTACT */}
            <Link
              href="/contact"
              className={cn(
                'text-xs xl:text-sm font-bold tracking-tight px-3 py-1.5 rounded-xl transition-all',
                pathname === '/contact'
                  ? 'text-brand-blue bg-blue-50/80 border border-blue-200/60 shadow-2xs'
                  : 'text-theme-secondary hover:text-theme-primary hover:bg-slate-100/80'
              )}
            >
              Contact
            </Link>
          </nav>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-3 xl:gap-4 flex-shrink-0">
            {/* Direct Call Capsule */}
            <a
              href={PHONE_HREF}
              className="hidden xl:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border border-[var(--border-default)] bg-[var(--surface-raised)] hover:border-brand-blue/50 transition-all group cursor-pointer shadow-xs"
              aria-label={`Call ${PHONE_NUMBER}`}
            >
              <div className="w-7 h-7 rounded-lg bg-brand-blue/15 text-brand-blue flex items-center justify-center group-hover:bg-brand-blue group-hover:text-white transition-colors flex-shrink-0">
                <Phone className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col whitespace-nowrap text-left">
                <span className="text-[9px] font-bold uppercase tracking-wider text-theme-muted leading-tight">
                  Direct Call / Text
                </span>
                <span className="text-xs font-extrabold text-theme-primary group-hover:text-brand-blue transition-colors">
                  {PHONE_NUMBER}
                </span>
              </div>
            </a>

            {/* Mobile / Tablet Phone Quick Action */}
            <a
              href={PHONE_HREF}
              className="xl:hidden flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[var(--surface-raised)] hover:border-brand-blue/50 text-theme-primary border border-[var(--border-default)] transition-all shadow-xs"
              aria-label="Call Rise Up Roofing"
            >
              <Phone className="w-4 h-4 text-brand-blue" />
            </a>

            {/* Free Estimate CTA Button */}
            <Link href="/contact" className="hidden sm:inline-block">
              <span className="inline-flex items-center gap-1.5 bg-brand-blue hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider rounded-xl px-4 py-2.5 transition-all shadow-md shadow-brand-blue/20 hover:shadow-brand-blue/35 hover:scale-[1.02] active:scale-[0.98]">
                <span>Free Estimate</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            {/* Mobile Hamburger Trigger */}
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}
