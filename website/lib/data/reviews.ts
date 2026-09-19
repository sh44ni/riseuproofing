import type { Review } from '@/types/review';

export interface EnrichedReview extends Review {
  neighborhood?: string;
  projectType?: string;
}

export const reviews: EnrichedReview[] = [
  {
    author: 'Michael & Sarah Chen',
    location: 'Oceanside, CA',
    neighborhood: 'Fire Mountain, Oceanside',
    projectType: 'Owens Corning Shingle Replacement',
    rating: 5,
    text: 'Rise Up replaced our entire roof in two days. The crew was professional, clean, and the Owens Corning shingles look incredible. Best contractor experience we have ever had.',
    source: 'google',
    serviceCategory: 'residential',
    date: 'November 2024',
  },
  {
    author: 'David Martinez',
    location: 'Carlsbad, CA',
    neighborhood: 'Aviara, Carlsbad',
    projectType: 'Tile Relayment & Solar Integration',
    rating: 5,
    text: 'Our solar system is producing more than promised. The team handled everything from permits to installation flawlessly. Our electric bill dropped to almost zero.',
    source: 'google',
    serviceCategory: 'solar',
    date: 'October 2024',
  },
  {
    author: 'Jennifer Walsh',
    location: 'Encinitas, CA',
    neighborhood: 'Moonlight Beach, Encinitas',
    projectType: 'Emergency Leak & Flashing Repair',
    rating: 5,
    text: 'After a bad storm, Rise Up was at our house within hours. They worked with our insurance and had everything repaired in a week. Above and beyond service.',
    source: 'google',
    serviceCategory: 'repairs',
    date: 'September 2024',
  },
  {
    author: 'Robert & Maria Torres',
    location: 'Escondido, CA',
    neighborhood: 'Old Escondido Historic District',
    projectType: 'Tile Restoration & Exterior Framing',
    rating: 5,
    text: 'They repaired our historic tile roof and built our second-story patio cover. Quality craftsmanship and constant communication throughout the whole process.',
    source: 'yelp',
    serviceCategory: 'construction',
    date: 'August 2024',
  },
  {
    author: 'Lisa Thompson',
    location: 'San Marcos, CA',
    neighborhood: 'Twin Oaks Valley, San Marcos',
    projectType: 'Complete Residential Reroof',
    rating: 5,
    text: 'From the free drone estimate to the final city inspection, everything was seamless. Fair pricing, no surprises, and a beautiful new roof. Highly recommend.',
    source: 'google',
    serviceCategory: 'residential',
    date: 'July 2024',
  },
  {
    author: 'James Park',
    location: 'Vista, CA',
    neighborhood: 'Shadowridge Center, Vista',
    projectType: 'Commercial TPO Flat System',
    rating: 5,
    text: 'As a commercial property manager, I need reliable contractors. Rise Up re-roofed our commercial building with zero disruption. Professional and ahead of schedule.',
    source: 'yelp',
    serviceCategory: 'commercial',
    date: 'June 2024',
  },
];

export function getAverageRating(reviewList: Review[] = reviews): number {
  if (!reviewList.length) return 5.0;
  const total = reviewList.reduce((sum, r) => sum + r.rating, 0);
  return Math.round((total / reviewList.length) * 10) / 10;
}

export function getReviewCount(reviewList: Review[] = reviews): number {
  return reviewList.length;
}
