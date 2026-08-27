import type { Project } from '@/types/project';

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

export const projects: Project[] = [
  {
    slug: 'oceanside-shingle-replacement',
    title: 'Luxury Shingle Roof Replacement',
    category: 'residential',
    city: 'Oceanside',
    coordinates: { lat: 33.1959, lng: -117.3795 },
    beforeImage: img('photo-1590381105924-c72589b9ef3f'),
    afterImage: img('photo-1513694203232-719a280e022f'),
    gallery: [img('photo-1513694203232-719a280e022f'), img('photo-1518780664697-55e3ad937233'), img('photo-1503387762-592deb58ef4e')],
    scopeOfWork: 'Complete tear-off and replacement of an aging shingle roof on a 2,800 sq ft coastal home. Installed Owens Corning Duration architectural shingles with synthetic underlayment, new flashing at all penetrations, and ridge vent ventilation system.',
    materialsUsed: ['Owens Corning Duration Architectural Shingles', 'Synthetic Underlayment', 'Aluminum Step Flashing', 'Ridge Vent System'],
    clientQuote: { text: 'Rise Up replaced our entire roof in two days. The crew was professional, clean, and the Owens Corning shingles look incredible. Best contractor experience we have ever had.', author: 'Michael & Sarah Chen' },
  },
  {
    slug: 'carlsbad-tile-relayment',
    title: 'Concrete Tile Roof Relayment',
    category: 'residential',
    city: 'Carlsbad',
    coordinates: { lat: 33.1581, lng: -117.3506 },
    beforeImage: img('photo-1568605117036-5fe5e7bab0b7'),
    afterImage: img('photo-1600585154340-be6161a56a0c'),
    gallery: [img('photo-1600585154340-be6161a56a0c'), img('photo-1486718448742-163732cd1544'), img('photo-1564540583246-934409427776')],
    scopeOfWork: 'Full tile relayment on a Mediterranean-style home. Removed all existing tiles, replaced deteriorated underlayment and rotted wood sheathing, installed premium synthetic underlayment with new metal valley flashing, and reinstalled tiles with proper spacing and ridge detail.',
    materialsUsed: ['Concrete Roof Tiles', 'Premium Synthetic Underlayment', 'Galvanized Valley Metal', 'Ridge Vent'],
  },
  {
    slug: 'sd-broken-tile-repair',
    title: 'Broken Tile & Crack Repair',
    category: 'repairs',
    city: 'San Diego',
    coordinates: { lat: 32.7157, lng: -117.1611 },
    beforeImage: 'https://media.base44.com/images/public/6a31e780b3e1f7196231adc3/2f0614f10_Broken-Roofing-Tile.png',
    afterImage: 'https://media.base44.com/images/public/6a31e780b3e1f7196231adc3/799506366_pdf71xg7mv8y.jpg',
    gallery: [
      'https://media.base44.com/images/public/6a31e780b3e1f7196231adc3/2f0614f10_Broken-Roofing-Tile.png',
      'https://media.base44.com/images/public/6a31e780b3e1f7196231adc3/b74eb4347_Screenshot2026-02-11at01-50-10Capsheetisabadideafortileunderlaymentr_Roofing.png',
      'https://media.base44.com/images/public/6a31e780b3e1f7196231adc3/799506366_pdf71xg7mv8y.jpg',
    ],
    scopeOfWork: 'Full roof inspection and targeted repair of cracked and broken terracotta tiles. Removed damaged tiles, inspected underlayment, color-matched replacement tiles, and sealed all repairs for waterproofing.',
    materialsUsed: ['Color-Matched Terracotta Tiles', 'Roofing Sealant', 'Synthetic Underlayment Patches'],
    clientQuote: { text: 'They fixed our tile problem quickly and the new tiles match perfectly. Very honest — they only repaired what needed it.', author: 'Patricia Reyes' },
  },
  {
    slug: 'sd-underlayment-repair',
    title: 'Underlayment Damage & Leak Repair',
    category: 'repairs',
    city: 'San Diego',
    coordinates: { lat: 32.7350, lng: -117.1450 },
    beforeImage: 'https://media.base44.com/images/public/6a31e780b3e1f7196231adc3/a591f0bc5_how-does-this-underlayment-look-replace-it-all-or-does-it-v0-bz6s2mwlw5jd1.png',
    afterImage: 'https://media.base44.com/images/public/6a31e780b3e1f7196231adc3/799506366_pdf71xg7mv8y.jpg',
    gallery: [
      'https://media.base44.com/images/public/6a31e780b3e1f7196231adc3/a591f0bc5_how-does-this-underlayment-look-replace-it-all-or-does-it-v0-bz6s2mwlw5jd1.png',
      'https://media.base44.com/images/public/6a31e780b3e1f7196231adc3/b74eb4347_Screenshot2026-02-11at01-50-10Capsheetisabadideafortileunderlaymentr_Roofing.png',
      'https://media.base44.com/images/public/6a31e780b3e1f7196231adc3/799506366_pdf71xg7mv8y.jpg',
    ],
    scopeOfWork: 'Removed tiles in the affected area, inspected and replaced rotted deck and deteriorated underlayment, installed new synthetic underlayment, reinstalled and realigned tiles, and performed final leak test.',
    materialsUsed: ['Plywood Sheathing', 'Synthetic Underlayment', 'Concrete Tiles', 'Flashing'],
  },
  {
    slug: 'sd-solar-tile-repair',
    title: 'Solar Panel Tile Damage Repair',
    category: 'repairs',
    city: 'San Diego',
    coordinates: { lat: 32.7500, lng: -117.1300 },
    beforeImage: 'https://media.base44.com/images/public/6a31e780b3e1f7196231adc3/a02ece6dd_is-this-a-huge-issue-sunrun-installed-solar-panels-and-i-v0-8ow9kre8m9dg1.png',
    afterImage: 'https://media.base44.com/images/public/6a31e780b3e1f7196231adc3/799506366_pdf71xg7mv8y.jpg',
    gallery: [
      'https://media.base44.com/images/public/6a31e780b3e1f7196231adc3/a02ece6dd_is-this-a-huge-issue-sunrun-installed-solar-panels-and-i-v0-8ow9kre8m9dg1.png',
      'https://media.base44.com/images/public/6a31e780b3e1f7196231adc3/2f0614f10_Broken-Roofing-Tile.png',
    ],
    scopeOfWork: 'Inspected tiles around solar panel mounts, removed cracked tiles near conduits, repaired flashing around brackets, replaced damaged concrete tiles, and sealed all penetrations and conduit paths.',
    materialsUsed: ['Concrete Tiles', 'Flashing', 'Roofing Sealant'],
  },
  {
    slug: 'sd-attic-leak-repair',
    title: 'Attic Water Damage & Leak Repair',
    category: 'repairs',
    city: 'San Diego',
    coordinates: { lat: 32.7200, lng: -117.1700 },
    beforeImage: 'https://media.base44.com/images/public/6a31e780b3e1f7196231adc3/fda047c81_snow-is-melting-roof-starts-leaking-v0-xq366c2qnpig1.png',
    afterImage: 'https://media.base44.com/images/public/6a31e780b3e1f7196231adc3/799506366_pdf71xg7mv8y.jpg',
    gallery: [
      'https://media.base44.com/images/public/6a31e780b3e1f7196231adc3/fda047c81_snow-is-melting-roof-starts-leaking-v0-xq366c2qnpig1.png',
      'https://media.base44.com/images/public/6a31e780b3e1f7196231adc3/a591f0bc5_how-does-this-underlayment-look-replace-it-all-or-does-it-v0-bz6s2mwlw5jd1.png',
    ],
    scopeOfWork: 'Interior attic inspection revealed water intrusion. Removed saturated insulation, replaced rotted rafters and sheathing, repaired roof deck and underlayment, replaced tiles over the repaired area, and installed new insulation.',
    materialsUsed: ['Rafters', 'Plywood Sheathing', 'Synthetic Underlayment', 'Insulation', 'Concrete Tiles'],
  },
  {
    slug: 'sd-commercial-tpo',
    title: 'Commercial Flat Roof Replacement',
    category: 'commercial',
    city: 'San Diego',
    coordinates: { lat: 32.7100, lng: -117.1650 },
    beforeImage: img('photo-1564540583246-934409427776'),
    afterImage: img('photo-1486718448742-163732cd1544'),
    gallery: [img('photo-1486718448742-163732cd1544'), img('photo-1564540583246-934409427776'), img('photo-1503387762-592deb58ef4e')],
    scopeOfWork: 'Complete tear-off of existing flat roof system on a 10,000 sq ft commercial building. Installed tapered insulation for proper drainage, TPO membrane with heat-welded seams, new metal edge flashing, and commercial-grade drains.',
    materialsUsed: ['TPO Membrane', 'Tapered Insulation Board', 'Metal Edge Flashing', 'Commercial Drains'],
    clientQuote: { text: 'As a property manager, I need reliable contractors. Rise Up re-roofed our commercial building with zero disruption. Professional and ahead of schedule.', author: 'James Park' },
  },
  {
    slug: 'escondido-roof-coating',
    title: 'Commercial Roof Maintenance & Coating',
    category: 'commercial',
    city: 'Escondido',
    coordinates: { lat: 33.1192, lng: -117.0864 },
    beforeImage: img('photo-1503387762-592deb58ef4e'),
    afterImage: img('photo-1564540583246-934409427776'),
    gallery: [img('photo-1503387762-592deb58ef4e'), img('photo-1486718448742-163732cd1544'), img('photo-1564540583246-934409427776')],
    scopeOfWork: 'Complete roof surface cleaning, repair of all cracks and blisters, primer application, elastomeric coating application, reinforcement of seams and penetrations, and final inspection with maintenance report.',
    materialsUsed: ['Elastomeric Roof Coating', 'Primer', 'Seam Reinforcement Tape', 'Sealant'],
  },
  {
    slug: 'oceanside-siding',
    title: 'Exterior Renovation & Siding',
    category: 'construction',
    city: 'Oceanside',
    coordinates: { lat: 33.1970, lng: -117.3800 },
    beforeImage: img('photo-1600596542815-ffad4c1539a9'),
    afterImage: img('photo-1518780664697-55e3ad937233'),
    gallery: [img('photo-1518780664697-55e3ad937233'), img('photo-1503387762-592deb58ef4e'), img('photo-1600596542815-ffad4c1539a9')],
    scopeOfWork: 'Removed existing deteriorated siding, installed house wrap weather barrier, James Hardie fiber cement siding installation with trim and fascia boards, exterior painting and caulking throughout.',
    materialsUsed: ['James Hardie Fiber Cement Siding', 'House Wrap', 'PVC Trim Boards', 'Exterior Paint'],
    clientQuote: { text: 'They built our second-story addition and it looks like it was always part of the house. Quality craftsmanship and constant communication throughout.', author: 'Robert & Maria Torres' },
  },
  {
    slug: 'sd-patio-cover',
    title: 'Property Improvement & Patio Cover',
    category: 'construction',
    city: 'San Diego',
    coordinates: { lat: 32.7300, lng: -117.1500 },
    beforeImage: img('photo-1518780664697-55e3ad937233'),
    afterImage: img('photo-1503387762-592deb58ef4e'),
    gallery: [img('photo-1503387762-592deb58ef4e'), img('photo-1518780664697-55e3ad937233'), img('photo-1600596542815-ffad4c1539a9')],
    scopeOfWork: 'Site preparation and permitting, structural post and beam installation, roof deck construction, roofing material installation, electrical and ceiling fan installation, painting and final inspection.',
    materialsUsed: ['Structural Posts & Beams', 'Roof Decking', 'Composition Roofing', 'Electrical', 'Paint'],
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function getAllProjectSlugs(): string[] {
  return projects.map((p) => p.slug);
}

export function getProjectsByCategory(category: Project['category']): Project[] {
  return projects.filter((p) => p.category === category);
}

export const projectCategories = [
  { value: 'all', label: 'All Projects' },
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'repairs', label: 'Repairs' },
  { value: 'construction', label: 'Construction' },
  { value: 'solar', label: 'Solar' },
] as const;
