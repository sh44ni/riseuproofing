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
  // Strip redundant tags or existing suffixes to construct clean, high-impact titles
  const baseTitle = title
    .replace(/\s*\|\s*San Diego Roofing Case Study.*$/i, '')
    .replace(/\s*\|\s*San Diego Roofing Experts.*$/i, '')
    .replace(/\s*\|\s*San Diego Roofing & Construction.*$/i, '')
    .replace(/\s*\|\s*5-Star San Diego Roofing.*$/i, '')
    .replace(/\s*\|\s*Join Rise Up Roofing San Diego.*$/i, '')
    .replace(/\s*\|\s*San Diego Roofing.*$/i, '')
    .replace(/\s*[—|-]\s*Careers\s*\|\s*Rise Up Roofing.*$/i, '')
    .replace(/\s*\|\s*Rise Up Roofing & Construction.*$/i, '')
    .replace(/\s*\|\s*Rise Up Roofing.*$/i, '')
    .replace(/\s*\|\s*San Diego County.*$/i, '')
    .trim();

  let fullTitle: string;
  if (title.includes('Rise Up')) {
    // If title already has custom brand suffix
    fullTitle = title.replace(/\s*\|\s*San Diego County/i, '').trim();
  } else {
    // If appending full brand name keeps it under 60 chars, use full brand name; otherwise use short brand name
    const candidate = `${baseTitle} | ${COMPANY_NAME}`;
    if (candidate.length <= 60) {
      fullTitle = candidate;
    } else {
      fullTitle = `${baseTitle} | Rise Up Roofing`;
    }
  }

  // Strict safety cap at 65 characters without cutting mid-word
  if (fullTitle.length > 65) {
    const cutLimit = 65 - ' | Rise Up Roofing'.length;
    let safeBase = baseTitle;
    if (safeBase.length > cutLimit) {
      const lastSpace = safeBase.lastIndexOf(' ', cutLimit);
      safeBase = lastSpace > 0 ? safeBase.slice(0, lastSpace) : safeBase.slice(0, cutLimit);
    }
    fullTitle = `${safeBase} | Rise Up Roofing`;
  }

  const url = `${BASE_URL}${path}`;
  const image = ogImage || `${BASE_URL}/og-image.jpg`;

  return {
    title: {
      absolute: fullTitle,
    },
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

export const BUSINESS_ADDRESS = {
  '@type': 'PostalAddress',
  streetAddress: '2182 S El Camino Real',
  addressLocality: 'Oceanside',
  addressRegion: 'CA',
  postalCode: '92054',
  addressCountry: 'US',
};

export function buildLocalBusinessJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'RoofingContractor',
    name: COMPANY_NAME,
    url: BASE_URL,
    telephone: '+17606221230',
    email: 'info@riseuproofing.com',
    address: BUSINESS_ADDRESS,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 33.1812,
      longitude: -117.3395,
    },
    areaServed: {
      '@type': 'County',
      name: 'San Diego County',
    },
    priceRange: '$$',
    openingHours: 'Mo-Su 00:00-24:00',
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
      url: BASE_URL,
      telephone: '+17606221230',
      address: BUSINESS_ADDRESS,
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
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / (reviews.length || 1);
  return {
    '@context': 'https://schema.org',
    '@type': 'RoofingContractor',
    name: COMPANY_NAME,
    url: BASE_URL,
    telephone: '+17606221230',
    priceRange: '$$',
    address: BUSINESS_ADDRESS,
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
      address: BUSINESS_ADDRESS,
    },
    url: `${BASE_URL}/careers/${job.slug}`,
    datePosted: new Date().toISOString().split('T')[0],
  };
}
