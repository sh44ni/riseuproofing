import { Hero } from '@/components/home/Hero';
import { TrustBar } from '@/components/home/TrustBar';
import { ServicesOverview } from '@/components/home/ServicesOverview';
import { WhyRiseUp } from '@/components/home/WhyRiseUp';
import { FeaturedProjects } from '@/components/home/FeaturedProjects';
import { ProjectsMap } from '@/components/home/ProjectsMap';
import { ReviewsStrip } from '@/components/home/ReviewsStrip';
import { Certifications } from '@/components/home/Certifications';
import { FinalCTA } from '@/components/home/FinalCTA';
import { buildReviewJsonLd } from '@/lib/seo/metadata';
import { reviews } from '@/lib/data/reviews';

export default function HomePage() {
  const reviewJsonLd = buildReviewJsonLd(reviews);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewJsonLd) }}
      />
      <Hero />
      <TrustBar />
      <ServicesOverview />
      <WhyRiseUp />
      <FeaturedProjects />
      <ProjectsMap />
      <ReviewsStrip />
      <Certifications />
      <FinalCTA />
    </>
  );
}

