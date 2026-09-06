import type { Metadata } from 'next';
import { Star, Quote, CheckCircle2 } from 'lucide-react';
import { buildMetadata, buildReviewJsonLd } from '@/lib/seo/metadata';
import { getAverageRating, getReviewCount } from '@/lib/data/reviews';
import { getPublicReviews, getReviewStats } from '@/lib/reviews-server';
import { Section } from '@/components/shared/Container';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { YELP_REVIEWS_URL, GOOGLE_REVIEWS_URL } from '@/lib/utils';

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: 'Customer Reviews | 5-Star San Diego Roofing',
  description:
    '5-star rated roofing and construction company in San Diego County. Read authentic reviews from homeowners across Oceanside, Carlsbad, Escondido, and surrounding areas.',
  path: '/reviews',
});

function GoogleLogo({ className = 'w-3.5 h-3.5' }: { className?: string }) {
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

function YelpLogo({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#D32323">
      <path d="M20.16 12.74c-.11-.53-.44-.92-.93-1.07l-4.88-1.52c-.52-.16-1.05.15-1.21.67-.16.52.15 1.05.67 1.21l4.47 1.39-2.77 3.96c-.32.45-.21 1.07.24 1.38.45.32 1.07.21 1.38-.24l3.03-4.33c.27-.38.31-.87.08-1.45zm-7.79-1.92l1.52-4.88c.16-.52-.15-1.05-.67-1.21-.52-.16-1.05.15-1.21.67l-1.39 4.47-3.96-2.77c-.45-.32-1.07-.21-1.38.24-.32.45-.21 1.07.24 1.38l4.33 3.03c.38.27.87.31 1.45.08.53-.11.92-.44 1.07-.93zm-1.89 3.53l-4.88 1.52c-.52.16-.83.69-.67 1.21.16.52.69.83 1.21.67l4.47-1.39 2.77 3.96c.32.45.93.56 1.38.24.45-.32.56-.93.24-1.38l-3.03-4.33c-.27-.38-.76-.62-1.49-.5zm-4.73-3.41l4.88-1.52c.52-.16.83-.69.67-1.21-.16-.52-.69-.83-1.21-.67l-4.47 1.39-2.77-3.96c-.32-.45-.93-.56-1.38-.24-.45.32-.56.93-.24 1.38l3.03 4.33c.27.38.76.62 1.49.5z" />
    </svg>
  );
}

export default async function ReviewsPage() {
  const [reviewList, stats] = await Promise.all([getPublicReviews(), getReviewStats()]);
  const avgRating = stats.averageRating ? stats.averageRating.toFixed(1) : getAverageRating(reviewList);
  const count = stats.totalCount || getReviewCount(reviewList);
  const reviewJsonLd = buildReviewJsonLd(reviewList);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewJsonLd) }}
      />
      <Section alternate={false} className="pt-32 sm:pt-36">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Reviews' }]} />

        <SectionHeading
          as="h1"
          label="Verified Ratings"
          title="Customer Reviews"
          subtitle="Real reviews from real homeowners across North County and San Diego. See why Rise Up is the trusted choice for roofing replacements, tile relays, and storm repairs."
        />

        {/* Aggregate Hero Dock */}
        <div className="flex items-center justify-center mb-12">
          <div className="glass-card-hero rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 border border-slate-200/80 shadow-md">
            <div className="text-5xl font-extrabold text-[var(--text-primary)] tracking-tight">
              {avgRating}
            </div>
            <div className="sm:border-l sm:border-slate-200 sm:pl-6 text-center sm:text-left">
              <div className="flex gap-1.5 justify-center sm:justify-start mb-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-5 h-5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-semibold">
                Based on{' '}
                <span className="text-[var(--text-primary)] font-bold">
                  {count} Verified Homeowner Reviews
                </span>
              </p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Top rated across Google Local, Yelp &amp; BBB
              </p>
            </div>
          </div>
        </div>

        {/* All reviews */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {reviewList.map((review, index) => {
            const isGoogle = review.source === 'google';
            const initials = review.author
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('');

            return (
              <div
                key={`${review.author}-${index}`}
                className="glass-card-interactive rounded-2xl p-6 flex flex-col justify-between border border-slate-200/80 hover:border-brand-blue/30 shadow-xs transition-all duration-300 relative group"
              >
                <Quote className="absolute top-5 right-5 w-8 h-8 text-slate-200 group-hover:text-brand-blue/20 transition-colors pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-0.5 text-amber-400 text-sm select-none" aria-label={`${review.rating} out of 5 stars`}>
                      {'★'.repeat(review.rating)}
                    </div>
                    {review.reviewUrl ? (
                      <a
                        href={review.reviewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-[var(--text-secondary)] bg-slate-50 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-slate-200/60 uppercase tracking-wider transition-all"
                        title="View verified review on Yelp"
                      >
                        {isGoogle ? <GoogleLogo className="w-3 h-3" /> : <YelpLogo className="w-3 h-3" />}
                        <span>via {isGoogle ? 'Google' : 'Yelp'}</span>
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-[var(--text-secondary)] bg-slate-50 border border-slate-200/60 uppercase tracking-wider">
                        {isGoogle ? <GoogleLogo className="w-3 h-3" /> : <YelpLogo className="w-3 h-3" />}
                        <span>via {isGoogle ? 'Google' : 'Yelp'}</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed mb-4 italic">
                    &ldquo;{review.text}&rdquo;
                  </p>

                  {review.ownerReply && (
                    <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-[var(--text-secondary)]">
                      <p className="font-bold text-[10px] uppercase tracking-wider text-brand-blue mb-1">
                        Response from Rise Up Roofing:
                      </p>
                      <p className="italic leading-relaxed">&ldquo;{review.ownerReply}&rdquo;</p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {review.authorPhoto ? (
                      <img
                        src={review.authorPhoto}
                        alt={review.author}
                        className="w-8 h-8 rounded-full object-cover border border-blue-100 shadow-2xs"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[10px] font-bold text-brand-blue shadow-2xs">
                        {initials}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-[var(--text-primary)]">{review.author}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {review.location} • {review.serviceCategory}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Review Assurance & Verification Section */}
        <div className="mt-16 border-t border-slate-200/80 pt-12 mb-12">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center sm:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">
                Verified Customer Feedback
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] mt-1.5 tracking-tight">
                San Diego County&apos;s Highest-Rated Roofing &amp; Construction Specialists
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-[var(--text-secondary)] leading-relaxed">
              <div className="space-y-4">
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Unbiased Reviews on Google Local &amp; Yelp
                </h3>
                <p>
                  At Rise Up Roofing &amp; Construction, every review represents an authentic homeowner or commercial property manager who trusted us with their building envelope. We maintain a top-tier rating across Google Business and Yelp because we prioritize crystal-clear communication, proactive jobsite cleanliness, and engineered precision from start to finish.
                </p>
                <p>
                  Our customers frequently highlight our dedicated project managers, daily photographic progress logs, and strict adherence to agreed project timelines. Whether replacing aging asphalt shingles in Oceanside or completing complex tile underlayment relayments in Carlsbad, our focus remains on providing a stress-free contractor experience.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Master Workmanship &amp; Ironclad Warranties
                </h3>
                <p>
                  A great roofing review is earned on the roof, not in an advertising campaign. As an Owens Corning Preferred Contractor and licensed dual-trade specialist (C-39 Roofing and B General Building), our installations are executed to strict manufacturer specifications that qualify for extended 50-year non-prorated system warranties.
                </p>
                <p>
                  We also eliminate finger-pointing during solar detach-and-reset procedures by managing both the photovoltaic array and roofing underlayment in-house. When North County homeowners invest in their roofs, they know Rise Up stands behind every nail, bracket, and valley metal installation with our comprehensive workmanship guarantee.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={stats.googleUrl || GOOGLE_REVIEWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-[var(--text-primary)] font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl transition-all shadow-xs"
          >
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>Read Google Reviews ({stats.googleRating ? stats.googleRating.toFixed(1) : '5.0'} ★)</span>
          </a>
          <a
            href={stats.yelpUrl || YELP_REVIEWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-[var(--text-primary)] font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl transition-all shadow-xs"
          >
            <YelpLogo className="w-4 h-4" />
            <span>See all {stats.yelpTotalCount} on Yelp</span>
          </a>
        </div>
      </Section>
    </>
  );
}
