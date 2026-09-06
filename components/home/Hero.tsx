'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Icon, GoogleIcon, YelpIcon } from '@/components/shared/Icon';
import {
  PHONE_HREF,
  PHONE_NUMBER,
  LICENSE_NUMBER,
  GOOGLE_REVIEWS_URL,
  YELP_REVIEWS_URL,
} from '@/lib/utils';
import type { EnrichedReview } from '@/lib/data/reviews';
import type { ReviewStats } from '@/lib/reviews-server';
import { InteractiveHeroEstimator } from './InteractiveHeroEstimator';

export function Hero({
  initialReviews,
  stats,
}: {
  initialReviews?: EnrichedReview[];
  stats?: ReviewStats;
}) {
  const [proofIndex, setProofIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [randomReview, setRandomReview] = useState<EnrichedReview | null>(
    initialReviews && initialReviews.length > 0 ? initialReviews[0] : null
  );
  const videoRef = useRef<HTMLVideoElement>(null);

  // Pick a random review on client mount to avoid hydration mismatch
  useEffect(() => {
    if (initialReviews && initialReviews.length > 0) {
      const idx = Math.floor(Math.random() * initialReviews.length);
      setRandomReview(initialReviews[idx]);
    }
  }, [initialReviews]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      const timer = setTimeout(() => {
        setProofIndex((prev) => {
          const next = prev === 0 ? 1 : 0;
          if (next === 1 && initialReviews && initialReviews.length > 0) {
            setRandomReview((current) => {
              if (initialReviews.length === 1) return initialReviews[0];
              const others = initialReviews.filter((r) => r.text !== current?.text);
              const pool = others.length > 0 ? others : initialReviews;
              return pool[Math.floor(Math.random() * pool.length)];
            });
          }
          return next;
        });
        setIsFading(false);
      }, 400); // 400ms crossfade
      return () => clearTimeout(timer);
    }, 5000); // Rotate every 5 seconds

    return () => clearInterval(interval);
  }, [initialReviews]);

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
              className="min-h-[22px] flex items-center justify-center min-w-[210px] sm:min-w-[240px] max-w-[320px] sm:max-w-[460px] overflow-hidden"
            >
              <div
                className={`transition-opacity duration-400 ease-in-out flex items-center gap-1.5 text-xs sm:text-[13px] ${
                  isFading ? 'opacity-0' : 'opacity-100'
                }`}
              >
                {proofIndex === 0 ? (
                  <div className="flex items-center gap-1.5 font-bold text-white whitespace-nowrap">
                    <div className="flex items-center text-amber-400 gap-0.5" aria-hidden="true">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Icon key={s} name="star" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                      ))}
                    </div>
                    <span className="font-extrabold text-white">
                      {stats?.averageRating ? stats.averageRating.toFixed(1) : '5.0'}/5
                    </span>
                    <span className="text-white/40">•</span>
                    <span className="text-white/85 font-medium">
                      {stats?.totalCount ? `${stats.totalCount} verified reviews` : 'Verified Reviews'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 font-medium text-white/90 min-w-0">
                    <span className="italic truncate max-w-[140px] sm:max-w-[260px]">
                      &ldquo;{randomReview?.text || 'Prompt, clean, and reliable service.'}&rdquo;
                    </span>
                    <span className="text-white/40 flex-shrink-0">&mdash;</span>
                    <span className="text-white/75 text-[11px] sm:text-xs whitespace-nowrap flex-shrink-0">
                      {randomReview?.author ? `${randomReview.author.split(' ')[0]} (` : 'Verified ('}
                      {randomReview?.source === 'yelp' ? 'Yelp' : 'Google'})
                    </span>
                  </div>
                )}
              </div>
            </div>

            <span className="hidden sm:inline-block w-[1px] h-3.5 bg-white/25" aria-hidden="true" />

            <div className="hidden sm:flex items-center gap-2">
              <a
                href={stats?.googleUrl || GOOGLE_REVIEWS_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Read our reviews on Google"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] sm:text-xs font-semibold text-white transition-colors cursor-pointer group"
              >
                <GoogleIcon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="group-hover:text-blue-200 transition-colors">Google</span>
              </a>

              <a
                href={stats?.yelpUrl || YELP_REVIEWS_URL}
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
                <Icon name="clipboard-check" className="w-4 h-4 text-white flex-shrink-0" />
                <span className="truncate">
                  <span className="sm:hidden">Estimate</span>
                  <span className="hidden sm:inline">Get a Free Estimate</span>
                </span>
                <Icon name="arrow-right" className="w-4 h-4 transition-transform group-hover:translate-x-0.5 hidden sm:inline-block flex-shrink-0" />
              </span>
            </Link>

            <a
              href={PHONE_HREF}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-white/[0.08] hover:bg-white/15 border border-white/20 hover:border-white/35 text-white font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl px-3.5 sm:px-5 py-3 backdrop-blur-md transition-all active:scale-[0.98] cursor-pointer group shadow-sm"
            >
              <Icon name="phone" className="w-4 h-4 text-brand-blue group-hover:scale-110 transition-transform flex-shrink-0" />
              <span className="truncate">
                <span className="sm:hidden">Call Now</span>
                <span className="hidden sm:inline">Call {PHONE_NUMBER}</span>
              </span>
            </a>
          </div>

          {/* Trust Row */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs sm:text-[12.5px] text-white/70 font-medium mb-4 sm:mb-6 animate-hero-6">
            <span className="inline-flex items-center gap-1.5 text-white/85 font-semibold">
              <Icon name="shield" className="w-3.5 h-3.5 text-brand-blue flex-shrink-0" aria-hidden="true" />
              <span>CA Lic #{LICENSE_NUMBER}</span>
            </span>
            <span className="text-white/30 hidden sm:inline" aria-hidden="true">•</span>
            <span className="inline-flex items-center gap-1.5 text-white/80">
              <Icon name="check-circle" className="w-3.5 h-3.5 text-brand-blue flex-shrink-0" aria-hidden="true" />
              <span>100% Free Inspection</span>
            </span>
            <span className="text-white/30 hidden sm:inline" aria-hidden="true">•</span>
            <span className="inline-flex items-center gap-1.5 text-white/80">
              <Icon name="lock" className="w-3.5 h-3.5 text-brand-blue flex-shrink-0" aria-hidden="true" />
              <span>No Spam</span>
            </span>
            <span className="text-white/30 hidden sm:inline" aria-hidden="true">•</span>
            <span className="inline-flex items-center gap-1.5 text-white/80">
              <Icon name="award" className="w-3.5 h-3.5 text-brand-blue flex-shrink-0" aria-hidden="true" />
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
