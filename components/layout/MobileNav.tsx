'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Phone,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Star,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { cn, PHONE_HREF, PHONE_NUMBER, LICENSE_NUMBER } from '@/lib/utils';
import { SERVICES_NAV, TOP_CITIES } from '@/lib/data/navigation';
import { Button } from '@/components/shared/Button';



export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [servicesExpanded, setServicesExpanded] = useState(false);
  const [areasExpanded, setAreasExpanded] = useState(false);
  const pathname = usePathname();

  // Close drawer on path change
  useEffect(() => {
    setOpen(false);
    setServicesExpanded(false);
    setAreasExpanded(false);
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        className="lg:hidden p-1.5 sm:p-2 rounded-xl text-theme-primary hover:text-theme-primary bg-[var(--surface-overlay)] hover:border-[var(--border-emphasis)] border border-[var(--border-default)] transition-all focus-visible:outline-brand-blue"
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
      >
        {open ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
      </button>

      {/* Backdrop overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 lg:hidden animate-in fade-in duration-200"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-out Drawer Panel */}
      <div
        className={cn(
          'fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl z-50 lg:hidden flex flex-col transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <Link href="/" onClick={() => setOpen(false)} className="flex items-center">
            <Image
              src="/logo.svg"
              alt="Rise Up Roofing"
              width={160}
              height={48}
              className="h-8 w-auto object-contain"
            />
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOpen(false)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close navigation"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-1">
          {/* Home */}
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className={cn(
              'flex items-center justify-between py-3 px-3 rounded-xl text-sm font-bold transition-colors',
              pathname === '/'
                ? 'bg-blue-50 text-brand-blue'
                : 'text-brand-navy hover:bg-slate-50'
            )}
          >
            <span>Home</span>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </Link>

          {/* Services Accordion */}
          <div className="rounded-xl overflow-hidden">
            <button
              onClick={() => setServicesExpanded(!servicesExpanded)}
              className={cn(
                'w-full flex items-center justify-between py-3 px-3 rounded-xl text-sm font-bold transition-colors',
                pathname.startsWith('/services') || servicesExpanded
                  ? 'bg-slate-50 text-brand-blue'
                  : 'text-brand-navy hover:bg-slate-50'
              )}
            >
              <span>Services</span>
              <ChevronDown
                className={cn(
                  'w-4 h-4 transition-transform duration-200',
                  servicesExpanded && 'rotate-180 text-brand-blue'
                )}
              />
            </button>

            {servicesExpanded && (
              <div className="pl-3 pr-2 py-2 space-y-1 bg-slate-50/50 rounded-b-xl animate-in slide-in-from-top-1 duration-150">
                <Link
                  href="/services"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 p-2 rounded-lg text-xs font-bold text-brand-blue hover:bg-blue-50/60 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Overview: All Roofing Services</span>
                </Link>
                {SERVICES_NAV.map((s) => {
                  const Icon = s.icon;
                  return (
                    <Link
                      key={s.href}
                      href={s.href}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-2.5 p-2 rounded-lg text-xs text-brand-navy hover:bg-slate-100 transition-colors"
                    >
                      <Icon className="w-4 h-4 text-brand-blue flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold">{s.label}</div>
                        <div className="text-[11px] text-slate-400">{s.desc}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Projects */}
          <Link
            href="/projects"
            onClick={() => setOpen(false)}
            className={cn(
              'flex items-center justify-between py-3 px-3 rounded-xl text-sm font-bold transition-colors',
              pathname.startsWith('/projects')
                ? 'bg-blue-50 text-brand-blue'
                : 'text-brand-navy hover:bg-slate-50'
            )}
          >
            <div className="flex items-center gap-2">
              <span>Projects &amp; Case Studies</span>
              <span className="text-[10px] font-extrabold uppercase bg-brand-gold/20 text-amber-700 px-1.5 py-0.5 rounded">
                Photos
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </Link>

          {/* Service Areas Accordion */}
          <div className="rounded-xl overflow-hidden">
            <button
              onClick={() => setAreasExpanded(!areasExpanded)}
              className={cn(
                'w-full flex items-center justify-between py-3 px-3 rounded-xl text-sm font-bold transition-colors',
                pathname.startsWith('/service-area') || areasExpanded
                  ? 'bg-slate-50 text-brand-blue'
                  : 'text-brand-navy hover:bg-slate-50'
              )}
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>Service Areas</span>
              </div>
              <ChevronDown
                className={cn(
                  'w-4 h-4 transition-transform duration-200',
                  areasExpanded && 'rotate-180 text-brand-blue'
                )}
              />
            </button>

            {areasExpanded && (
              <div className="pl-4 pr-2 py-2 grid grid-cols-2 gap-1.5 bg-slate-50/50 rounded-b-xl">
                {TOP_CITIES.map((city) => (
                  <Link
                    key={city.slug}
                    href={`/service-area/${city.slug}`}
                    onClick={() => setOpen(false)}
                    className="p-2 text-xs font-medium text-brand-navy hover:text-brand-blue hover:bg-blue-50/60 rounded-lg transition-colors"
                  >
                    {city.name}
                  </Link>
                ))}
                <Link
                  href="/service-area"
                  onClick={() => setOpen(false)}
                  className="col-span-2 p-2 text-xs font-bold text-brand-blue hover:underline"
                >
                  View All 30+ San Diego Cities →
                </Link>
              </div>
            )}
          </div>

          {/* Reviews */}
          <Link
            href="/reviews"
            onClick={() => setOpen(false)}
            className={cn(
              'flex items-center justify-between py-3 px-3 rounded-xl text-sm font-bold transition-colors',
              pathname === '/reviews'
                ? 'bg-blue-50 text-brand-blue'
                : 'text-brand-navy hover:bg-slate-50'
            )}
          >
            <div className="flex items-center gap-2">
              <span>Reviews</span>
              <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> 4.9
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </Link>

          {/* About */}
          <Link
            href="/about"
            onClick={() => setOpen(false)}
            className={cn(
              'flex items-center justify-between py-3 px-3 rounded-xl text-sm font-bold transition-colors',
              pathname === '/about'
                ? 'bg-blue-50 text-brand-blue'
                : 'text-brand-navy hover:bg-slate-50'
            )}
          >
            <span>About Us</span>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </Link>

          {/* Careers */}
          <Link
            href="/careers"
            onClick={() => setOpen(false)}
            className={cn(
              'flex items-center justify-between py-3 px-3 rounded-xl text-sm font-bold transition-colors',
              pathname.startsWith('/careers')
                ? 'bg-blue-50 text-brand-blue'
                : 'text-brand-navy hover:bg-slate-50'
            )}
          >
            <div className="flex items-center gap-2">
              <span>Careers</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                Hiring
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </Link>

          {/* Contact */}
          <Link
            href="/contact"
            onClick={() => setOpen(false)}
            className={cn(
              'flex items-center justify-between py-3 px-3 rounded-xl text-sm font-bold transition-colors',
              pathname === '/contact'
                ? 'bg-blue-50 text-brand-blue'
                : 'text-brand-navy hover:bg-slate-50'
            )}
          >
            <span>Contact &amp; Estimate</span>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </Link>
        </div>

        {/* Drawer Bottom Actions */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-3">
          {/* Quick Call Action */}
          <a
            href={PHONE_HREF}
            className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm text-brand-navy hover:border-brand-blue transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">24/7 Phone</p>
                <p className="text-sm font-bold text-brand-navy">{PHONE_NUMBER}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-brand-blue bg-blue-50 px-2 py-1 rounded">
              Call Now
            </span>
          </a>

          {/* Free Estimate Button */}
          <Link href="/contact" onClick={() => setOpen(false)} className="block">
            <Button size="lg" className="w-full bg-brand-blue text-white shadow-md">
              Get Free Estimate
            </Button>
          </Link>

          {/* License footnote */}
          <div className="text-center pt-2">
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-gold" />
              CA License #{LICENSE_NUMBER} • Licensed &amp; Insured
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
