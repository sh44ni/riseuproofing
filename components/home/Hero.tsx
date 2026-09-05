'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Phone,
  Shield,
  Star,
  CheckCircle2,
  Lock,
  Award,
  ArrowRight,
  ClipboardCheck,
} from 'lucide-react';
import {
  PHONE_HREF,
  PHONE_NUMBER,
  LICENSE_NUMBER,
  GOOGLE_REVIEWS_URL,
  YELP_REVIEWS_URL,
} from '@/lib/utils';
import { InteractiveHeroEstimator } from './InteractiveHeroEstimator';

function GoogleIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

function YelpIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#D32323">
      <path d="M20.16 12.74c-.11-.53-.44-.92-.93-1.07l-4.88-1.52c-.52-.16-1.05.15-1.21.67-.16.52.15 1.05.67 1.21l4.47 1.39-2.77 3.96c-.32.45-.21 1.07.24 1.38.45.32 1.07.21 1.38-.24l3.03-4.33c.27-.38.31-.87.08-1.45zm-7.79-1.92l1.52-4.88c.16-.52-.15-1.05-.67-1.21-.52-.16-1.05.15-1.21.67l-1.39 4.47-3.96-2.77c-.45-.32-1.07-.21-1.38.24-.32.45-.21 1.07.24 1.38l4.33 3.03c.38.27.87.31 1.45.08.53-.11.92-.44 1.07-.93zm-1.89 3.53l-4.88 1.52c-.52.16-.83.69-.67 1.21.16.52.69.83 1.21.67l4.47-1.39 2.77 3.96c.32.45.93.56 1.38.24.45-.32.56-.93.24-1.38l-3.03-4.33c-.27-.38-.76-.62-1.49-.5zm-4.73-3.41l4.88-1.52c.52-.16.83-.69.67-1.21-.16-.52-.69-.83-1.21-.67l-4.47 1.39-2.77-3.96c-.32-.45-.93-.56-1.38-.24-.45.32-.56.93-.24 1.38l3.03 4.33c.27.38.76.62 1.49.5z" />
    </svg>
  );
}

export function Hero() {
  const [proofIndex, setProofIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      const timer = setTimeout(() => {
        setProofIndex((prev) => (prev === 0 ? 1 : 0));
        setIsFading(false);
      }, 400); // 400ms crossfade
      return () => clearTimeout(timer);
    }, 5000); // Rotate every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="always-dark relative w-full overflow-hidden bg-[#0B1B2B] min-h-[100dvh] flex flex-col justify-center">
      {/* Optimized Video Background with Poster Fallback & Darkened Gradient Overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          poster="/videos/hero-poster.webp"
          preload="auto"
          onLoadedMetadata={() => {
            if (videoRef.current) videoRef.current.playbackRate = 0.45;
          }}
          onPlay={() => {
            if (videoRef.current) videoRef.current.playbackRate = 0.45;
          }}
          className="w-full h-full object-cover object-center"
          style={{ filter: 'brightness(0.75) contrast(1.1) saturate(1.05)' }}
        >
          <source src="/videos/hero-video.mp4" type="video/mp4" />
        </video>

        {/* Radial Depth Vignette Behind Center Pitch */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_35%,rgba(7,19,31,0.55)_0%,transparent_100%)]" />

        {/* Theme-Aware Vertical Gradient Overlay */}
        <div className="hero-video-overlay absolute inset-0" />
      </div>

      {/* Hero Main Viewport Content */}
      <div className="relative z-10 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-12 pt-24 sm:pt-28 lg:pt-32 pb-10 sm:pb-14 flex-1 flex flex-col items-center justify-center">
        
        {/* Centered Hero Pitch Stack */}
        <div className="max-w-[780px] w-full mx-auto flex flex-col items-center text-center">
          
          {/* Owens Corning Preferred Contractor Credential — Self-contained Dark Glass */}
          <a
            href="https://www.owenscorning.com/en-us/roofing/contractors"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Verified Owens Corning Preferred Contractor"
            title="Verified Owens Corning Preferred Contractor"
            className="inline-flex items-center gap-2.5 px-3.5 py-1.5 sm:px-4 sm:py-1.5 rounded-full mb-3.5 sm:mb-4 border border-white/20 hover:border-white/40 bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all duration-300 group cursor-pointer shadow-lg hover:shadow-xl animate-hero-1 text-white"
          >
            <div className="relative w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0 group-hover:scale-110 transition-transform">
              <Image
                src="/badges/owens-corning.webp"
                alt="Owens Corning Logo"
                fill
                className="object-contain"
                priority
                sizes="28px"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs sm:text-[13px]">
              <span className="font-bold text-white tracking-wide">Owens Corning</span>
              <span className="text-white/40 text-xs">•</span>
              <span className="font-extrabold uppercase tracking-wider text-[11px] sm:text-xs text-[#d4a94e] group-hover:text-[#e4b95e] transition-colors">
                Preferred Contractor
              </span>
            </div>
          </a>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[clamp(2.35rem,3.4vw,3.75rem)] font-extrabold text-white leading-[1.12] tracking-tight mb-3 sm:mb-4 animate-hero-2 drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]">
            San Diego Roofing &amp; Construction
            <br />
            <span className="text-brand-blue drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">Experts</span>
          </h1>

          {/* Subheading */}
          <p className="text-sm sm:text-base lg:text-lg text-white/95 leading-relaxed mb-4 sm:mb-5 max-w-[620px] mx-auto animate-hero-3 font-normal drop-shadow-[0_1px_8px_rgba(0,0,0,0.6)]">
            Southern California&apos;s trusted roofing specialists &mdash; premium replacements, tile &amp; underlayment, built for coastal weather.
          </p>

          {/* Rotating Proof Line — Self-contained Dark Glass */}
          <div className="rounded-full px-4 py-1.5 sm:px-5 sm:py-2 mb-4 sm:mb-5 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 border border-white/20 bg-white/10 shadow-lg backdrop-blur-md animate-hero-4 text-white">
            
            <div
              aria-live="polite"
              className="min-h-[22px] flex items-center justify-center min-w-[210px] sm:min-w-[230px]"
            >
              <div
                className={`transition-opacity duration-400 ease-in-out flex items-center gap-1.5 text-xs sm:text-[13px] ${
                  isFading ? 'opacity-0' : 'opacity-100'
                }`}
              >
                {proofIndex === 0 ? (
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <div className="flex items-center text-amber-400 gap-0.5" aria-hidden="true">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="font-extrabold text-white">4.9/5</span>
                    <span className="text-white/40">•</span>
                    <span className="text-white/85 font-medium">120+ reviews</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 font-medium text-white/90">
                    <span className="italic">&ldquo;Fast, professional, no pressure.&rdquo;</span>
                    <span className="text-white/40">&mdash;</span>
                    <span className="text-white/75 text-[11px] sm:text-xs">Verified Google Review</span>
                  </div>
                )}
              </div>
            </div>

            <span className="hidden sm:inline-block w-[1px] h-3.5 bg-white/25" aria-hidden="true" />

            <div className="hidden sm:flex items-center gap-2">
              <a
                href={GOOGLE_REVIEWS_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Read our reviews on Google"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] sm:text-xs font-semibold text-white transition-colors cursor-pointer group"
              >
                <GoogleIcon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="group-hover:text-blue-200 transition-colors">Google</span>
              </a>

              <a
                href={YELP_REVIEWS_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Read our reviews on Yelp"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] sm:text-xs font-semibold text-white transition-colors cursor-pointer group"
              >
                <YelpIcon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="group-hover:text-red-200 transition-colors">Yelp</span>
              </a>
            </div>
          </div>

          {/* Hero CTA Button Pair — Sleek, side-by-side on mobile, expanded on desktop */}
          <div className="flex flex-row items-center justify-center gap-2.5 sm:gap-4 w-full max-w-[390px] sm:max-w-none sm:w-auto mb-3.5 sm:mb-4 animate-hero-5 px-2 sm:px-0">
            <Link href="/contact" className="flex-1 sm:flex-initial">
              <span
                className="w-full inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-[#2E9BF0] hover:bg-[#1C88DD] text-white font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl px-3.5 sm:px-7 py-3 cursor-pointer hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 ease-out group shadow-[0_4px_16px_rgba(46,155,240,0.4)]"
              >
                <ClipboardCheck className="w-4 h-4 text-white flex-shrink-0" />
                <span className="truncate">
                  <span className="sm:hidden">Estimate</span>
                  <span className="hidden sm:inline">Get a Free Estimate</span>
                </span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 hidden sm:inline-block flex-shrink-0" />
              </span>
            </Link>

            <a
              href={PHONE_HREF}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-white/[0.08] hover:bg-white/15 border border-white/20 hover:border-white/35 text-white font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl px-3.5 sm:px-5 py-3 backdrop-blur-md transition-all active:scale-[0.98] cursor-pointer group shadow-sm"
            >
              <Phone className="w-4 h-4 text-brand-blue group-hover:scale-110 transition-transform flex-shrink-0" />
              <span className="truncate">
                <span className="sm:hidden">Call Now</span>
                <span className="hidden sm:inline">Call {PHONE_NUMBER}</span>
              </span>
            </a>
          </div>

          {/* Trust Row */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs sm:text-[12.5px] text-white/70 font-medium mb-4 sm:mb-6 animate-hero-6">
            <span className="inline-flex items-center gap-1.5 text-white/85 font-semibold">
              <Shield className="w-3.5 h-3.5 text-brand-blue flex-shrink-0" aria-hidden="true" />
              <span>CA Lic #{LICENSE_NUMBER}</span>
            </span>
            <span className="text-white/30 hidden sm:inline" aria-hidden="true">•</span>
            <span className="inline-flex items-center gap-1.5 text-white/80">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-blue flex-shrink-0" aria-hidden="true" />
              <span>100% Free Inspection</span>
            </span>
            <span className="text-white/30 hidden sm:inline" aria-hidden="true">•</span>
            <span className="inline-flex items-center gap-1.5 text-white/80">
              <Lock className="w-3.5 h-3.5 text-brand-blue flex-shrink-0" aria-hidden="true" />
              <span>No Spam</span>
            </span>
            <span className="text-white/30 hidden sm:inline" aria-hidden="true">•</span>
            <span className="inline-flex items-center gap-1.5 text-white/80">
              <Award className="w-3.5 h-3.5 text-brand-blue flex-shrink-0" aria-hidden="true" />
              <span>Certified Experts</span>
            </span>
          </div>

        </div>

        {/* Wide Integrated Estimator Card with Built-in Trust Badges */}
        <div id="hero-estimator" className="w-full max-w-[920px] flex justify-center animate-hero-7 relative z-10 scroll-mt-24">
          <InteractiveHeroEstimator />
        </div>

      </div>
    </section>
  );
}
