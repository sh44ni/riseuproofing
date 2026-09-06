import type { Metadata } from 'next';
import { Star, Quote, CheckCircle2 } from 'lucide-react';
import { buildMetadata, buildReviewJsonLd } from '@/lib/seo/metadata';
import { getAverageRating, getReviewCount } from '@/lib/data/reviews';
import { getPublicReviews } from '@/lib/reviews-server';
import { Section } from '@/components/shared/Container';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';

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

export default async function ReviewsPage() {
  const reviewList = await getPublicReviews();
  const avgRating = getAverageRating(reviewList);
  const count = getReviewCount(reviewList);
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
                  {count}+ Verified Homeowner Reviews
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
                    <div className="flex gap-1">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-[var(--text-secondary)] bg-slate-50 border border-slate-200/60 uppercase tracking-wider">
                      {isGoogle ? <GoogleLogo className="w-3 h-3" /> : null}
                      <span>via {isGoogle ? 'Google' : 'Yelp'}</span>
                    </span>
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

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="https://www.google.com/maps/place/Rise+Up+Roofing+%26+Construction"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-[var(--text-primary)] font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl transition-all shadow-xs"
          >
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>Read All Google Reviews</span>
          </a>
          <a
            href="https://www.yelp.com/biz/rise-up-roofing-and-construction"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-[var(--text-primary)] font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl transition-all shadow-xs"
          >
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>Read All Yelp Reviews</span>
          </a>
        </div>
      </Section>
    </>
  );
}
