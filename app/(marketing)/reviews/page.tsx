import type { Metadata } from 'next';
import { Star, Quote, CheckCircle2 } from 'lucide-react';
import { buildMetadata, buildReviewJsonLd } from '@/lib/seo/metadata';
import { reviews, getAverageRating, getReviewCount } from '@/lib/data/reviews';
import { Section } from '@/components/shared/Container';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';

export const metadata: Metadata = buildMetadata({
  title: 'Customer Reviews | 5-Star San Diego Roofing',
  description: '5-star rated roofing and construction company in San Diego County. Read authentic reviews from homeowners across Oceanside, Carlsbad, Escondido, and surrounding areas.',
  path: '/reviews',
});

export default function ReviewsPage() {
  const avgRating = getAverageRating();
  const count = getReviewCount();
  const reviewJsonLd = buildReviewJsonLd(reviews);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewJsonLd) }} />
      <Section dark={true} alternate={false} className="pt-32 sm:pt-36">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Reviews' }]} />
        
        <SectionHeading
          label="Customer Reviews"
          title="San Diego County Homeowner Testimonials"
          subtitle="Real reviews from real homeowners across North County and San Diego. See why Rise Up is the trusted choice for roofing replacements, tile relays, and storm repairs."
          dark={true}
        />

        {/* Aggregate Hero Dock */}
        <div className="flex items-center justify-center mb-12">
          <div className="glass-card-hero rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 border-white/20 shadow-2xl">
            <div className="text-5xl font-extrabold text-[var(--text-primary)] tracking-tight">
              {avgRating}
            </div>
            <div className="sm:border-l sm:border-white/15 sm:pl-6 text-center sm:text-left">
              <div className="flex gap-1.5 justify-center sm:justify-start mb-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-5 h-5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-semibold">
                Based on <span className="text-[var(--text-primary)] font-bold">{count}+ Verified Homeowner Reviews</span>
              </p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Top rated across Google Local, Yelp &amp; BBB
              </p>
            </div>
          </div>
        </div>

        {/* All reviews */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {reviews.map((review, index) => (
            <div
              key={index}
              className="glass-card-interactive rounded-2xl p-6 flex flex-col justify-between border-white/15 hover:border-white/30 transition-all duration-300 relative group"
            >
              <Quote className="absolute top-5 right-5 w-8 h-8 text-white/10 group-hover:text-brand-blue/20 transition-colors pointer-events-none" />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-1">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <span className="glass-chip px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white/80 uppercase tracking-wider">
                    via {review.source === 'google' ? 'Google' : 'Yelp'}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-white/85 leading-relaxed mb-6 italic">
                  &ldquo;{review.text}&rdquo;
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[var(--text-primary)]">{review.author}</p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {review.location} • {review.serviceCategory}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="https://www.google.com/maps/place/Rise+Up+Roofing+%26+Construction"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl backdrop-blur-md transition-all shadow-sm"
          >
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>Read All Google Reviews</span>
          </a>
          <a
            href="https://www.yelp.com/biz/rise-up-roofing-and-construction"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl backdrop-blur-md transition-all shadow-sm"
          >
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>Read All Yelp Reviews</span>
          </a>
        </div>
      </Section>
    </>
  );
}
