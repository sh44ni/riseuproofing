export interface Project {
  slug: string;
  title: string;
  category: 'residential' | 'commercial' | 'solar' | 'repairs' | 'construction';
  city: string;
  coordinates: { lat: number; lng: number };
  beforeImage: string;
  afterImage: string;
  gallery: string[];
  scopeOfWork: string;
  materialsUsed: string[];
  clientQuote?: { text: string; author: string };
}
