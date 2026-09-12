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
  topPerformersSeed: Array<{
    id: number;
    name: string;
    initials: string;
    jobs: number;
    rank: number;
  }>;
}

export const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
  hero: {
    tagline: 'DISCIPLINE BUILDS FREEDOM',
    headline: 'MORE ROOFS. A STRONGER TOMORROW.',
    subquote: 'GOOD ROOFS. BETTER PEOPLE. — RISE UP',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop',
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
  topPerformersSeed: [
    { id: 1, name: 'Marc Sarellano', initials: 'MS', jobs: 8, rank: 1 },
    { id: 2, name: 'Daniel', initials: 'DA', jobs: 5, rank: 2 },
    { id: 3, name: 'Silvester', initials: 'SI', jobs: 4, rank: 3 },
    { id: 4, name: 'Chris', initials: 'CH', jobs: 3, rank: 4 },
  ],
};
