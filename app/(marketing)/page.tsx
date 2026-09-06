import type { Metadata } from 'next';
import { Hero } from '@/components/home/Hero';
import { TrustBar } from '@/components/home/TrustBar';
import { ServicesOverview } from '@/components/home/ServicesOverview';
import { WhyRiseUp } from '@/components/home/WhyRiseUp';
import { FeaturedProjects } from '@/components/home/FeaturedProjects';
import { ProjectsMap } from '@/components/home/ProjectsMap';
import { ReviewsStrip } from '@/components/home/ReviewsStrip';
import { Certifications } from '@/components/home/Certifications';
import { FinalCTA } from '@/components/home/FinalCTA';
import { buildMetadata, buildReviewJsonLd } from '@/lib/seo/metadata';
import { getPublicReviews, getReviewStats } from '@/lib/reviews-server';

export const metadata: Metadata = buildMetadata({
  title: 'San Diego Roofing & Construction Experts | Free Estimates',
  description:
    'San Diego County\'s trusted roofing contractor. Residential & commercial roof replacement, tile relay, leak repair, solar roofing & construction. Licensed #1096492. Free estimates.',
  path: '/',
});

export const revalidate = 3600;

export default async function HomePage() {
  const [reviews, stats] = await Promise.all([getPublicReviews(), getReviewStats()]);
  const reviewJsonLd = buildReviewJsonLd(reviews);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewJsonLd) }}
      />
      <Hero initialReviews={reviews} stats={stats} />
      <TrustBar />
      <ServicesOverview />
      <WhyRiseUp stats={stats} />
      <FeaturedProjects />
      <ProjectsMap />
      <ReviewsStrip initialReviews={reviews} stats={stats} />
      <Certifications />
      <FinalCTA />
    </>
  );
}
