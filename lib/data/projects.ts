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
    scopeOfWork: 'Carefully detached concrete barrel tiles across the active leak zone to expose deteriorated felt paper. Removed compromised roof decking, repaired damaged structural rafters, and installed two layers of heavy-duty synthetic high-temperature underlayment with self-adhering ice-and-water shield along the valleys. Reinstalled, fastened, and aligned original concrete tiles with stainless steel fasteners, sealed all flashing junctions, and conducted comprehensive 30-minute water pressure testing to ensure 100% moisture-tight seal.',
    materialsUsed: [
      '1/2" CDX Structural Plywood Sheathing',
      'Dual-Layer Synthetic High-Temp Underlayment',
      'Self-Adhering Ice & Water Shield Membrane',
      'Heavy-Gauge Galvanized Valley Metal',
      'Stainless Steel Tile Fasteners & Polyurethane Sealant',
    ],
    clientQuote: {
      text: 'We dealt with persistent leaks after winter storms until Rise Up found the torn underlayment beneath our tile roof. They repaired the decking, replaced the underlayment, and our ceiling has stayed bone-dry ever since.',
      author: 'Arthur Henderson',
    },
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
    scopeOfWork: 'Complete commercial roof restoration on a low-slope industrial facility in Escondido. Performed industrial high-pressure surface decontamination and substrate moisture scanning to eliminate trapped dampness. Repaired all membrane fissures, weathered seams, and ponding-prone sections with polyester fabric reinforcement. Applied high-solids elastomeric silicone coating offering 90%+ solar reflectance and superior ponding water resistance, extending the building roof service life by over 15 years while dramatically decreasing summer cooling energy expenses. Conducted a comprehensive post-cure elastomeric membrane adhesion test and provided facility managers with a documented 10-year renewed roof warranty.',
    materialsUsed: [
      'High-Solids 100% Silicone Roof Coating',
      'Thermoplastic Substrate Primer',
      'Spun-Bonded Polyester Seam Reinforcement Fabric',
      'Industrial-Grade Polyurethane Joint Sealant',
    ],
    clientQuote: {
      text: 'The commercial coating system saved our company over thirty thousand dollars compared to a complete roof replacement. Building temperatures dropped immediately and the team worked seamlessly without interrupting operations.',
      author: 'David Miller, Operations Manager',
    },
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
    scopeOfWork: 'Complete custom covered patio build in San Diego, including structural engineering, city permitting, and excavation. Erected heavy-timber support posts and laminated header beams tied into the primary residence fascia. Framed a tongue-and-groove cedar ceiling with integrated weatherproof electrical conduit, recessed dimmable LED can lights, and outdoor ceiling fan wiring. Finished exterior with Class-A fire-rated architectural shingles matching the existing house roof and installed custom heavy-gauge metal drip edge flashing.',
    materialsUsed: [
      'Pressure-Treated Structural Posts & Header Beams',
      'Select Tongue & Groove Cedar Decking',
      'Class-A Owens Corning Architectural Shingles',
      'Weather-Rated Recessed LED Lighting & Fan Boxes',
      'Heavy-Gauge Powder-Coated Drip Edge Flashing',
    ],
    clientQuote: {
      text: 'Our custom covered patio turned our backyard into an outdoor oasis. Rise Up handled all the city permits and matched the materials and pitch to our house roof flawlessly. The craftsmanship is first-rate.',
      author: 'Greg & Elena Vasquez',
    },
  },
  {
    slug: 'carlsbad-solar-detach-reset',
    title: 'Solar Panel Detach, Roof Replacement & Reset',
    category: 'solar',
    city: 'Carlsbad',
    coordinates: { lat: 33.1650, lng: -117.3400 },
    beforeImage: 'https://media.base44.com/images/public/6a31e780b3e1f7196231adc3/a02ece6dd_is-this-a-huge-issue-sunrun-installed-solar-panels-and-i-v0-8ow9kre8m9dg1.png',
    afterImage: img('photo-1513694203232-719a280e022f'),
    gallery: [
      'https://media.base44.com/images/public/6a31e780b3e1f7196231adc3/a02ece6dd_is-this-a-huge-issue-sunrun-installed-solar-panels-and-i-v0-8ow9kre8m9dg1.png',
      img('photo-1513694203232-719a280e022f'),
      img('photo-1600585154340-be6161a56a0c'),
    ],
    scopeOfWork: 'Comprehensive solar detach and reset combined with complete residential reroofing in Carlsbad. Safely decoupled, labeled, and stored 28 rooftop solar modules, removed existing degraded roofing layers down to bare decking, inspected and replaced damaged plywood sheathing, installed premium synthetic underlayment and new architectural shingles, flashed all mounting stanchions with waterproof boots, and reinstalled, wired, and verified solar system performance to match peak pre-construction output.',
    materialsUsed: [
      'Owens Corning Duration Architectural Shingles',
      'High-Temperature Synthetic Underlayment',
      'Universal Solar Stanchion Flashing Boots',
      'Stainless Steel Solar Mounting Hardware',
      'Dual-Shield Waterproof Conduit Flashing',
    ],
    clientQuote: {
      text: 'Having our solar panels detached and reinstalled during our roof replacement was completely stress-free with Rise Up. They handled the entire process in-house and had our solar generating power again immediately.',
      author: 'Steven Martinez',
    },
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
