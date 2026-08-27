'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, ArrowUpRight, ShieldCheck, Sparkles } from 'lucide-react';
import { PHONE_HREF, PHONE_NUMBER, COMPANY_NAME, LICENSE_NUMBER } from '@/lib/utils';
import { Container } from '@/components/shared/Container';
import { TOP_CITIES } from '@/lib/data/navigation';
import { Tooltip } from '@/components/shared/Tooltip';

const SERVICES = [
  { label: 'Residential Roofing', href: '/services/residential' },
  { label: 'Roof Repairs & Leaks', href: '/services/repairs' },
  { label: 'Commercial Flat Roofing', href: '/services/commercial' },
  { label: 'Solar Roofing Integration', href: '/services/solar' },
  { label: 'General Construction & Siding', href: '/services/construction' },
];

const COMPANY_LINKS = [
  { label: 'About Us', href: '/about' },
  { label: 'Featured Projects', href: '/projects' },
  { label: 'Customer Reviews', href: '/reviews' },
  { label: 'Warranties & Certifications', href: '/#certifications' },
  { label: 'Careers', href: '/careers' },
  { label: 'Contact Us', href: '/contact' },
];

const ESCONDIDO_CHAMBER_URL =
  'https://business.escondidochamber.org/list/member/rise-up-roofing-and-construction-inc-9925';

export function Footer() {
  return (
    <footer className="always-dark relative bg-[#03080E] text-white border-t border-white/10 overflow-hidden select-none">
      {/* Subtle Ambient Radial Lighting */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-blue/10 rounded-full blur-3xl pointer-events-none" />

      {/* Background Watermark Signature */}
      <div className="absolute bottom-12 right-0 left-0 text-center pointer-events-none opacity-[0.025] select-none font-black text-[10vw] tracking-tighter leading-none whitespace-nowrap overflow-hidden">
        RISE UP ROOFING
      </div>

      <div className="py-14 lg:py-16 relative z-10">
        <Container>
          {/* Top Quick Status & Contact Header Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-8 mb-10 border-b border-white/10">
            {/* Live Dispatch Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>24/7 San Diego Storm &amp; Leak Dispatch Active</span>
            </div>

            {/* Quick Contact Buttons */}
            <div className="flex items-center gap-3">
              <Tooltip content="Direct phone hotline">
                <a
                  href={PHONE_HREF}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-brand-blue hover:border-brand-blue text-white font-bold text-xs border border-white/15 transition-all"
                >
                  <Phone className="w-3.5 h-3.5 text-brand-blue group-hover:text-white" />
                  <span>{PHONE_NUMBER}</span>
                </a>
              </Tooltip>

              <Tooltip content="Direct customer email">
                <a
                  href="mailto:info@riseuproofing.com"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white/80 hover:text-white text-xs border border-white/15 transition-all"
                >
                  <Mail className="w-3.5 h-3.5 text-brand-blue" />
                  <span>info@riseuproofing.com</span>
                </a>
              </Tooltip>
            </div>
          </div>

          {/* Main Grid: 5-col Brand & Dock + 7-col 3-Column Navigation */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 pb-12 border-b border-white/10">
            {/* Left: Brand Bio & Platform Dock (5 cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div>
                <Link href="/" className="inline-block mb-4">
                  <Image
                    src="/logo-white.svg"
                    alt={COMPANY_NAME}
                    width={180}
                    height={50}
                    className="h-9 w-auto object-contain"
                  />
                </Link>

                <p className="text-xs sm:text-[13px] text-white/65 leading-relaxed max-w-sm mb-6">
                  Master roofing and architectural construction contractor serving San Diego County. Owens Corning non-prorated warranties up to 50 years.
                </p>

                {/* Frosted Floating Platform Dock */}
                <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/10 shadow-lg">
                  {/* Google */}
                  <Tooltip content="Google Business Profile & 4.9★ Reviews">
                    <a
                      href="https://www.google.com/maps"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Google Business Profile"
                      className="w-8 h-8 rounded-xl bg-white/[0.06] hover:bg-white/20 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all hover:scale-105"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 13.88c-.68.62-1.74 1.12-3.08 1.12-2.67 0-4.83-2.07-4.83-4.73 0-2.66 2.16-4.73 4.83-4.73 1.34 0 2.29.51 2.87 1.05l-1.16 1.12c-.32-.3-.87-.65-1.71-.65-1.47 0-2.67 1.21-2.67 2.71s1.2 2.71 2.67 2.71c1.39 0 1.95-.87 2.08-1.42h-2.08v-1.47h3.6c.04.2.06.41.06.66 0 1.28-.43 2.51-1.58 3.58z" />
                      </svg>
                    </a>
                  </Tooltip>

                  {/* Yelp */}
                  <Tooltip content="5.0★ Verified Reviews on Yelp">
                    <a
                      href="https://www.yelp.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Yelp Reviews"
                      className="w-8 h-8 rounded-xl bg-white/[0.06] hover:bg-white/20 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all hover:scale-105"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.17 12.87l2.85 4.38c.3.46.16 1.07-.3 1.37-.46.3-1.07.16-1.37-.3l-2.47-3.8-1.5 4.28c-.16.46-.66.7-1.12.54-.46-.16-.7-.66-.54-1.12l1.5-4.28-4.28-1.5c-.46-.16-.7-.66-.54-1.12.16-.46.66-.7 1.12-.54l4.28 1.5 1.5-4.28c.16-.46.66-.7 1.12-.54.46.16.7.66.54 1.12l-1.5 4.28 3.8-2.47c.46-.3 1.07-.16 1.37.3.3.46.16 1.07-.3 1.37l-4.38 2.85z" />
                      </svg>
                    </a>
                  </Tooltip>

                  {/* Instagram */}
                  <Tooltip content="Follow Rise Up on Instagram">
                    <a
                      href="https://www.instagram.com/riseuproofingandconstruction/"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                      className="w-8 h-8 rounded-xl bg-white/[0.06] hover:bg-white/20 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all hover:scale-105"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                      </svg>
                    </a>
                  </Tooltip>

                  {/* Facebook */}
                  <Tooltip content="Connect on Facebook">
                    <a
                      href="https://www.facebook.com/profile.php?id=61551393216836"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Facebook"
                      className="w-8 h-8 rounded-xl bg-white/[0.06] hover:bg-white/20 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all hover:scale-105"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
                      </svg>
                    </a>
                  </Tooltip>

                  {/* Owens Corning Official Contractor Profile */}
                  <Tooltip content="Owens Corning Preferred Contractor (#247226)">
                    <a
                      href="https://www.owenscorning.com/en-us/roofing/contractors/contractor-profile/247226"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Owens Corning Preferred Contractor Profile"
                      className="w-8 h-8 rounded-xl bg-white/[0.06] hover:bg-white/20 border border-white/10 flex items-center justify-center p-1 transition-all hover:scale-105"
                    >
                      <Image
                        src="/badges/owens_corning_icon_org.png"
                        alt="Owens Corning"
                        width={22}
                        height={22}
                        className="w-full h-full object-contain rounded-sm"
                      />
                    </a>
                  </Tooltip>

                  {/* Escondido Chamber of Commerce */}
                  <Tooltip content="Escondido Chamber of Commerce Member">
                    <a
                      href={ESCONDIDO_CHAMBER_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Escondido Chamber of Commerce Verified Member"
                      className="w-8 h-8 rounded-xl bg-white/[0.06] hover:bg-white/20 border border-white/10 flex items-center justify-center p-1 transition-all hover:scale-105"
                    >
                      <Image
                        src="/badges/escondido-chamber.png"
                        alt="Escondido Chamber of Commerce"
                        width={22}
                        height={22}
                        className="w-full h-full object-contain"
                      />
                    </a>
                  </Tooltip>
                </div>
              </div>

              {/* License & Credential Pill */}
              <div className="mt-8 flex items-center gap-2 text-xs text-white/50">
                <Tooltip content="Verified active with California Contractors State License Board">
                  <span className="inline-flex items-center gap-2 cursor-help">
                    <ShieldCheck className="w-4 h-4 text-brand-gold flex-shrink-0" />
                    <span>CA Lic #{LICENSE_NUMBER} • Class B &amp; C-39 Bonded &amp; Insured</span>
                  </span>
                </Tooltip>
              </div>
            </div>

            {/* Col 2: Services (3 cols) */}
            <div className="lg:col-span-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
                Capabilities
              </h4>
              <ul className="space-y-2.5">
                {SERVICES.map((s) => (
                  <li key={s.label}>
                    <Link
                      href={s.href}
                      className="text-xs text-white/60 hover:text-white transition-colors inline-block"
                    >
                      {s.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3: Service Areas (2 cols) */}
            <div className="lg:col-span-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
                Service Areas
              </h4>
              <ul className="space-y-2.5">
                {TOP_CITIES.slice(0, 5).map((city) => (
                  <li key={city.slug}>
                    <Link
                      href={`/service-area/${city.slug}`}
                      className="text-xs text-white/60 hover:text-white transition-colors inline-block"
                    >
                      {city.name}, CA
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/service-area"
                    className="text-xs font-bold text-brand-blue hover:text-white transition-colors inline-flex items-center gap-1"
                  >
                    <span>All 30+ Cities</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Company (2 cols) */}
            <div className="lg:col-span-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
                Company
              </h4>
              <ul className="space-y-2.5">
                {COMPANY_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-xs text-white/60 hover:text-white transition-colors inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/45">
            <p>
              &copy; {new Date().getFullYear()} {COMPANY_NAME} Inc. All rights reserved.
            </p>

            {/* Powered By projekts.pk */}
            <div className="flex items-center gap-1.5 text-xs text-white/60">
              <span>Powered by</span>
              <a
                href="https://projekts.pk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-brand-blue font-bold transition-colors underline decoration-white/20 underline-offset-4 hover:decoration-brand-blue"
              >
                projekts.pk
              </a>
            </div>

            {/* Legal Links */}
            <div className="flex items-center gap-5">
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/contact" className="hover:text-white transition-colors">
                Support
              </Link>
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
}




