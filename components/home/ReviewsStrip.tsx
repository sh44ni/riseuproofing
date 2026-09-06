'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Star, CheckCircle2, MapPin, ExternalLink, ArrowRight } from 'lucide-react';
import { Section } from '@/components/shared/Container';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { reviews, getAverageRating, type EnrichedReview } from '@/lib/data/reviews';
import type { ReviewStats } from '@/lib/reviews-server';
import { cn, YELP_REVIEWS_URL, GOOGLE_REVIEWS_URL } from '@/lib/utils';
import { Tooltip } from '@/components/shared/Tooltip';

function GoogleLogo({ className = 'w-4 h-4' }: { className?: string }) {
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

function YelpLogo({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#D32323">
      <path d="M20.16 12.74c-.11-.53-.44-.92-.93-1.07l-4.88-1.52c-.52-.16-1.05.15-1.21.67-.16.52.15 1.05.67 1.21l4.47 1.39-2.77 3.96c-.32.45-.21 1.07.24 1.38.45.32 1.07.21 1.38-.24l3.03-4.33c.27-.38.31-.87.08-1.45zm-7.79-1.92l1.52-4.88c.16-.52-.15-1.05-.67-1.21-.52-.16-1.05.15-1.21.67l-1.39 4.47-3.96-2.77c-.45-.32-1.07-.21-1.38.24-.32.45-.21 1.07.24 1.38l4.33 3.03c.38.27.87.31 1.45.08.53-.11.92-.44 1.07-.93zm-1.89 3.53l-4.88 1.52c-.52.16-.83.69-.67 1.21.16.52.69.83 1.21.67l4.47-1.39 2.77 3.96c.32.45.93.56 1.38.24.45-.32.56-.93.24-1.38l-3.03-4.33c-.27-.38-.76-.62-1.49-.5zm-4.73-3.41l4.88-1.52c.52-.16.83-.69.67-1.21-.16-.52-.69-.83-1.21-.67l-4.47 1.39-2.77-3.96c-.32-.45-.93-.56-1.38-.24-.45.32-.56.93-.24 1.38l3.03 4.33c.27.38.76.62 1.49.5z" />
    </svg>
  );
}

export function ReviewsStrip({
  initialReviews,
  stats,
}: {
  initialReviews?: EnrichedReview[];
  stats?: ReviewStats;
}) {
  const reviewList = initialReviews && initialReviews.length > 0 ? initialReviews : reviews;
  const [platformFilter, setPlatformFilter] = useState<'all' | 'google' | 'yelp'>('all');
  const avgRating = stats?.averageRating ? stats.averageRating.toFixed(1) : getAverageRating(reviewList);
  const googleCount = stats?.googleCount ?? reviewList.filter((r) => r.source === 'google').length;
  const yelpCount = stats?.yelpCount ?? reviewList.filter((r) => r.source === 'yelp').length;
  const yelpTotalCount = stats?.yelpTotalCount ?? (yelpCount > 0 ? yelpCount : 1);
  const googleRating = stats?.googleRating ? stats.googleRating.toFixed(1) : '5.0';
  const yelpRating = stats?.yelpRating ? stats.yelpRating.toFixed(1) : '5.0';
  const totalCount = stats?.totalCount ?? reviewList.length;

  const filteredReviews =
    platformFilter === 'all'
      ? reviewList
      : reviewList.filter((r) => r.source === platformFilter);

  // Strictly display only 3 reviews on the homepage as requested
  const displayedReviews = filteredReviews.slice(0, 3);

  return (
    <Section alternate={true} id="reviews">
      <SectionHeading
        label="Verified Feedback"
        title="What San Diego Homeowners Say"
        subtitle="Real reviews from verified property owners across North County & Greater San Diego on Google Maps and Yelp."
      />

      {/* Interactive Platform Trust Header Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-10">
        {/* Google Score Box */}
        <Tooltip content={`Read verified customer reviews on Google`} className="w-full">
          <div className="bg-white rounded-2xl p-4 flex items-center justify-between border border-slate-100/80 hover:border-brand-blue/30 transition-all duration-300 w-full cursor-help shadow-[0_1px_3px_rgba(11,30,51,0.04),0_6px_18px_-4px_rgba(11,30,51,0.07)] hover:-translate-y-0.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 p-2 border border-slate-100 flex items-center justify-center flex-shrink-0 shadow-2xs">
                <GoogleLogo className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-[var(--text-primary)] text-base">{googleRating}</span>
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3 h-3 fill-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] font-medium">{googleCount} Google Reviews</p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Verified
            </span>
          </div>
        </Tooltip>

        {/* Yelp Score Box */}
        <Tooltip content="Read verified residential & commercial reviews on Yelp" className="w-full">
          <div className="bg-white rounded-2xl p-4 flex items-center justify-between border border-slate-100/80 hover:border-red-300/40 transition-all duration-300 w-full cursor-help shadow-[0_1px_3px_rgba(11,30,51,0.04),0_6px_18px_-4px_rgba(11,30,51,0.07)] hover:-translate-y-0.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 p-2 flex items-center justify-center flex-shrink-0 shadow-2xs">
                <YelpLogo className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-[var(--text-primary)] text-base">{yelpRating}</span>
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3 h-3 fill-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] font-medium">{yelpTotalCount} Yelp Reviews</p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              Top Rated
            </span>
          </div>
        </Tooltip>

        {/* Combined Score Box */}
        <Tooltip content={`Combined average rating based on ${totalCount} verified reviews`} className="w-full">
          <div className="bg-white rounded-2xl p-4 flex items-center justify-between border border-slate-100/80 hover:border-brand-blue/30 transition-all duration-300 w-full cursor-help shadow-[0_1px_3px_rgba(11,30,51,0.04),0_6px_18px_-4px_rgba(11,30,51,0.07)] hover:-translate-y-0.5">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-extrabold text-[var(--text-primary)] text-xl tracking-tight">{avgRating}</span>
                <span className="text-xs text-[var(--text-muted)] font-medium">/ 5.0</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] font-medium">Overall Rating</p>
            </div>
            <span className="text-[10px] uppercase font-bold text-brand-blue bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
              100% Recommended
            </span>
          </div>
        </Tooltip>
      </div>

      {/* Filter Tabs */}
      <div className="flex justify-center gap-2 mb-8">
        <button
          type="button"
          onClick={() => setPlatformFilter('all')}
          className={cn(
            'px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border',
            platformFilter === 'all'
              ? 'bg-brand-blue text-white border-brand-blue shadow-xs'
              : 'bg-white text-[#475569] border-slate-200/80 hover:border-brand-blue/30 shadow-2xs'
          )}
        >
          All Reviews ({totalCount})
        </button>

        <button
          type="button"
          onClick={() => setPlatformFilter('google')}
          className={cn(
            'inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border',
            platformFilter === 'google'
              ? 'bg-brand-blue text-white border-brand-blue shadow-xs'
              : 'bg-white text-[#475569] border-slate-200/80 hover:border-brand-blue/30 shadow-2xs'
          )}
        >
          <GoogleLogo className="w-3.5 h-3.5" />
          <span>Google ({googleCount > 0 ? googleCount : `${googleRating}★`})</span>
        </button>

        <button
          type="button"
          onClick={() => setPlatformFilter('yelp')}
          className={cn(
            'inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border',
            platformFilter === 'yelp'
              ? 'bg-brand-blue text-white border-brand-blue shadow-xs'
              : 'bg-white text-[#475569] border-slate-200/80 hover:border-brand-blue/30 shadow-2xs'
          )}
        >
          <YelpLogo className="w-3.5 h-3.5" />
          <span>Yelp ({yelpTotalCount > 0 ? yelpTotalCount : `${yelpRating}★`})</span>
        </button>
      </div>

      {/* Reviews Grid (Limited to 3) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {displayedReviews.map((review, idx) => {
          const isGoogle = review.source === 'google';
          const initials = (review.author || 'Customer')
            .split(' ')
            .map((n: string) => n[0])
            .slice(0, 2)
            .join('');

          return (
            <div
              key={`${review.author}-${idx}`}
              className="bg-white rounded-3xl p-6 sm:p-7 flex flex-col justify-between border border-slate-100/80 hover:border-brand-blue/30 transition-all duration-300 relative group shadow-[0_1px_3px_rgba(11,30,51,0.04),0_8px_24px_-4px_rgba(11,30,51,0.07),0_24px_48px_-8px_rgba(11,30,51,0.04)] hover:shadow-[0_8px_24px_-4px_rgba(47,159,227,0.11),0_1px_3px_rgba(11,30,51,0.04)] hover:-translate-y-0.5 overflow-hidden"
            >
              {/* Accent top on hover */}
              <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-brand-blue/35 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div>
                {/* Header: Author Avatar + Name + Platform Badge */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    {review.authorPhoto ? (
                      <img
                        src={review.authorPhoto}
                        alt={review.author}
                        className="w-10 h-10 rounded-full object-cover border border-blue-100 shadow-2xs flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-xs font-bold text-brand-blue shadow-2xs flex-shrink-0">
                        {initials}
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-brand-blue transition-colors">
                        {review.author}
                      </h4>
                      <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5 font-medium">
                        <MapPin className="w-3 h-3 text-brand-blue flex-shrink-0" />
                        <span>{review.neighborhood || review.location}</span>
                      </p>
                    </div>
                  </div>

                  {/* Platform pill with official logo */}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] bg-slate-50 border border-slate-200/60 flex-shrink-0">
                    {isGoogle ? <GoogleLogo className="w-3 h-3" /> : <YelpLogo className="w-3 h-3" />}
                    <span>{isGoogle ? 'Google' : 'Yelp'}</span>
                  </span>
                </div>

                {/* Project Tag */}
                {review.projectType && (
                  <div className="mb-3">
                    <span className="text-[10px] font-bold text-brand-blue bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full inline-block">
                      Project: {review.projectType}
                    </span>
                  </div>
                )}

                {/* Rating Stars & Date */}
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex gap-0.5 text-amber-400">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)] font-medium">{review.date}</span>
                </div>

                {/* Review Quote */}
                <p className="text-xs sm:text-[13px] text-[var(--text-secondary)] leading-relaxed italic mb-4">
                  &ldquo;{review.text}&rdquo;
                </p>

                {/* Owner Reply if present */}
                {review.ownerReply && (
                  <div className="mb-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] text-[var(--text-secondary)]">
                    <p className="font-bold text-[10px] uppercase tracking-wider text-brand-blue mb-1">
                      Response from Rise Up Roofing:
                    </p>
                    <p className="italic leading-relaxed">&ldquo;{review.ownerReply}&rdquo;</p>
                  </div>
                )}
              </div>

              {/* Bottom Verification Footer */}
              <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified Customer</span>
                </div>
                {review.reviewUrl ? (
                  <a
                    href={review.reviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--text-muted)] hover:text-brand-blue text-[10px] font-medium flex items-center gap-1 transition-colors"
                  >
                    <span>via {isGoogle ? 'Google Maps' : 'Yelp Profile'}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                ) : (
                  <span className="text-[var(--text-muted)] text-[10px] font-medium">
                    via {isGoogle ? 'Google Maps' : 'Yelp Profile'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* View All Reviews Primary Navigation CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
        <Link
          href="/reviews"
          className="inline-flex items-center justify-center gap-2.5 bg-brand-blue hover:bg-[#1C88DD] text-white font-bold text-xs sm:text-sm uppercase tracking-wider px-8 py-3.5 rounded-2xl transition-all shadow-md hover:shadow-lg hover:brightness-105 active:scale-[0.98] group"
        >
          <span>View All {totalCount} Verified Reviews</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* External Review Links */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a
          href={stats?.googleUrl || GOOGLE_REVIEWS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white hover:bg-brand-blue text-[#0B1E33] hover:text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-2xl border border-slate-200/80 hover:border-brand-blue transition-all shadow-xs hover:shadow-md group"
        >
          <GoogleLogo className="w-4 h-4" />
          <span>Read All Google Reviews ({googleRating} ★)</span>
          <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </a>

        <a
          href={stats?.yelpUrl || YELP_REVIEWS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white hover:bg-brand-blue text-[#0B1E33] hover:text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-2xl border border-slate-200/80 hover:border-brand-blue transition-all shadow-xs hover:shadow-md group"
        >
          <YelpLogo className="w-4 h-4" />
          <span>See all {yelpTotalCount} on Yelp ({yelpRating} ★)</span>
          <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </a>
      </div>
    </Section>
  );
}
