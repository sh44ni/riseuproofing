export interface DashboardConfig {
  hero: {
    tagline: string;
    headline: string;
    subquote: string;
    imageUrl: string;
    pillars: string[];
  };
  quoteCard: {
    quote: string;
    imageUrl: string;
  };
  weather: {
    location: string;
    temp: number;
    condition: string;
    high: number;
    low: number;
    backgroundImage: string;
  };
}

export const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
  hero: {
    tagline: 'DISCIPLINE BUILDS FREEDOM',
    headline: 'MORE ROOFS. A STRONGER TOMORROW.',
    subquote: 'GOOD ROOFS. BETTER PEOPLE. - RISE UP',
    imageUrl: '/hero-bg.jpg',
    pillars: ['PEOPLE', 'PROCESS', 'PROFIT', 'FREEDOM'],
  },
  quoteCard: {
    quote: 'PROGRESS BUILDS FREEDOM.',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop',
  },
  weather: {
    location: 'Oceanside, CA',
    temp: 72,
    condition: 'Sunny',
    high: 76,
    low: 62,
    backgroundImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop',
  },
};
