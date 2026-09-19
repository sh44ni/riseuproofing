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
  seoTitle?: string;
  seoDescription?: string;
  detailedOverview?: {
    heading: string;
    subheading?: string;
    paragraphs: string[];
    highlights?: { title: string; description: string }[];
  };
  /** Investment range displayed in the Financing Preview widget */
  investmentRange?: { low: string; high: string; note?: string };
  /** Typical project duration shown in the Financing Preview widget */
  typicalDuration?: string;
  /** Manufacturer / system specifications shown in the Material Specs grid */
  materialSpecs?: { name: string; spec: string; highlight?: string }[];
}
