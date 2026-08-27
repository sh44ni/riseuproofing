export interface ServiceArea {
  slug: string;
  name: string;
  county: string;
  description?: string;
}

export const serviceAreas: ServiceArea[] = [
  { slug: 'san-diego', name: 'San Diego', county: 'San Diego' },
  { slug: 'oceanside', name: 'Oceanside', county: 'San Diego' },
  { slug: 'carlsbad', name: 'Carlsbad', county: 'San Diego' },
  { slug: 'encinitas', name: 'Encinitas', county: 'San Diego' },
  { slug: 'escondido', name: 'Escondido', county: 'San Diego' },
  { slug: 'vista', name: 'Vista', county: 'San Diego' },
  { slug: 'san-marcos', name: 'San Marcos', county: 'San Diego' },
  { slug: 'la-jolla', name: 'La Jolla', county: 'San Diego' },
  { slug: 'del-mar', name: 'Del Mar', county: 'San Diego' },
  { slug: 'solana-beach', name: 'Solana Beach', county: 'San Diego' },
  { slug: 'rancho-bernardo', name: 'Rancho Bernardo', county: 'San Diego' },
  { slug: 'poway', name: 'Poway', county: 'San Diego' },
  { slug: 'ramona', name: 'Ramona', county: 'San Diego' },
  { slug: 'fallbrook', name: 'Fallbrook', county: 'San Diego' },
  { slug: 'valley-center', name: 'Valley Center', county: 'San Diego' },
  { slug: 'bonsall', name: 'Bonsall', county: 'San Diego' },
  { slug: 'el-cajon', name: 'El Cajon', county: 'San Diego' },
  { slug: 'la-mesa', name: 'La Mesa', county: 'San Diego' },
  { slug: 'chula-vista', name: 'Chula Vista', county: 'San Diego' },
  { slug: 'national-city', name: 'National City', county: 'San Diego' },
  { slug: 'coronado', name: 'Coronado', county: 'San Diego' },
  { slug: 'imperial-beach', name: 'Imperial Beach', county: 'San Diego' },
  { slug: 'santee', name: 'Santee', county: 'San Diego' },
  { slug: 'lakeside', name: 'Lakeside', county: 'San Diego' },
  { slug: 'alpine', name: 'Alpine', county: 'San Diego' },
  { slug: 'spring-valley', name: 'Spring Valley', county: 'San Diego' },
  { slug: 'lemon-grove', name: 'Lemon Grove', county: 'San Diego' },
  { slug: 'rancho-santa-fe', name: 'Rancho Santa Fe', county: 'San Diego' },
  { slug: 'camp-pendleton', name: 'Camp Pendleton', county: 'San Diego' },
  { slug: 'temecula', name: 'Temecula', county: 'Riverside' },
  { slug: 'murrieta', name: 'Murrieta', county: 'Riverside' },
];

export function getServiceAreaBySlug(slug: string): ServiceArea | undefined {
  return serviceAreas.find((sa) => sa.slug === slug);
}

export function getAllServiceAreaSlugs(): string[] {
  return serviceAreas.map((sa) => sa.slug);
}
