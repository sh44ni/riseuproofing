export interface Service {
  slug: string;
  name: string;
  shortDescription: string;
  heroImage: string;
  icon: string;
  includes: string[];
  processSteps: { title: string; description: string }[];
  faqs: { question: string; answer: string }[];
  relatedProjectSlugs: string[];
  highlightBadge?: string;
  warranty?: string;
  keyMaterials?: string[];
  accentColor?: string;
  category?: 'residential' | 'repairs' | 'commercial' | 'solar' | 'construction';
}
