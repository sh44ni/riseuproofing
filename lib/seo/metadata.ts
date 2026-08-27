import type { Metadata } from 'next';
import { COMPANY_NAME } from '@/lib/utils';

interface MetadataOptions {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
}

const BASE_URL = 'https://riseuproofing.com';

export function buildMetadata({ title, description, path, ogImage }: MetadataOptions): Metadata {
  const fullTitle = `${title} | ${COMPANY_NAME} | San Diego County`;
  const url = `${BASE_URL}${path}`;
  const image = ogImage || `${BASE_URL}/og-image.jpg`;

  return {
    title: fullTitle,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: COMPANY_NAME,
      images: [{ url: image, width: 1200, height: 630 }],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
    },
  };
}

export function buildLocalBusinessJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'RoofingContractor',
    name: COMPANY_NAME,
    url: BASE_URL,
    telephone: '+17606221230',
    email: 'info@riseuproofing.com',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'San Diego',
      addressRegion: 'CA',
      postalCode: '92101',
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 32.7157,
      longitude: -117.1611,
    },
    areaServed: {
      '@type': 'County',
      name: 'San Diego County',
    },
    priceRange: '$$',
    openingHours: 'Mo-Fr 07:00-18:00, Sa 08:00-14:00',
    sameAs: [
      'https://www.google.com/maps/place/Rise+Up+Roofing+%26+Construction',
      'https://www.yelp.com/biz/rise-up-roofing-and-construction',
      'https://www.instagram.com/riseuproofingandconstruction/',
      'https://www.facebook.com/profile.php?id=61551393216836',
      'https://business.escondidochamber.org/list/member/rise-up-roofing-and-construction-inc-9925',
      'https://www.owenscorning.com/en-us/roofing/contractors/contractor-profile/247226',
    ],
  };
}

export function buildServiceJsonLd(service: { name: string; shortDescription: string; slug: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.shortDescription,
    url: `${BASE_URL}/services/${service.slug}`,
    provider: {
      '@type': 'RoofingContractor',
      name: COMPANY_NAME,
    },
    areaServed: {
      '@type': 'County',
      name: 'San Diego County',
    },
  };
}

export function buildFAQJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function buildReviewJsonLd(reviews: { author: string; rating: number; text: string }[]) {
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: COMPANY_NAME,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: avgRating.toFixed(1),
      reviewCount: reviews.length,
      bestRating: 5,
      worstRating: 1,
    },
    review: reviews.map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.author },
      reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
      reviewBody: r.text,
    })),
  };
}

export function buildJobPostingJsonLd(job: {
  title: string;
  description: string;
  employmentType: string;
  slug: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    employmentType: job.employmentType.toUpperCase().replace('-', '_'),
    hiringOrganization: {
      '@type': 'Organization',
      name: COMPANY_NAME,
      sameAs: BASE_URL,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'San Diego',
        addressRegion: 'CA',
        addressCountry: 'US',
      },
    },
    url: `${BASE_URL}/careers/${job.slug}`,
    datePosted: new Date().toISOString().split('T')[0],
  };
}
