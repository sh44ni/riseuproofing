export interface ServiceArea {
  slug: string;
  name: string;
  county: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  h1?: string;
  intro?: string;
  neighborhoods?: string[];
  faqs?: { question: string; answer: string }[];
}

export const serviceAreas: ServiceArea[] = [
  {
    slug: 'san-diego',
    name: 'San Diego',
    county: 'San Diego',
    seoTitle: 'San Diego Roofing Contractor | Rise Up Roofing',
    seoDescription: 'Trusted San Diego CA roofing company. 5-star tile relay, shingle replacement, leak repairs, and solar roofing. Free roofing estimates throughout San Diego County.',
    h1: 'Premier Roofing Contractor in San Diego, CA',
    intro: 'Looking for trusted, 5-star roofing companies in San Diego, CA? Rise Up Roofing & Construction delivers master-grade residential and commercial roofing, emergency roof leak repair, tile underlayment replacement, solar roofing, and custom home additions throughout San Diego County. Backed by California Contractor\'s License #1096492 and Owens Corning Preferred Contractor status, our work includes up to 50-year manufacturer warranties and free, transparent roofing estimates.',
    neighborhoods: ['Pacific Beach', 'La Jolla', 'North Park', 'Point Loma', 'Ocean Beach', 'Clairemont', 'Mission Hills', 'Downtown San Diego', 'Hillcrest', 'Tierrasanta', 'Del Cerro', 'Mission Valley'],
    faqs: [
      {
        question: 'How much does a roof replacement cost in San Diego, CA?',
        answer: 'In San Diego, a complete residential roof replacement generally ranges from $8,500 to $18,000 for architectural asphalt shingles, and $11,000 to $26,000+ for concrete or clay tile roof relayment with dual-layer synthetic underlayment. Final costs depend on roof square footage, pitch steepness, accessibility, and wood deck condition. Rise Up Roofing provides transparent, itemized free estimates before any work begins.',
      },
      {
        question: 'Do you offer free roofing estimates in San Diego County?',
        answer: 'Yes. We provide 100% free, no-obligation roof inspections and written estimates across all San Diego neighborhoods. Our inspectors examine your roof surface, attic ventilation, flashing points, and underlayment condition, providing a comprehensive photo report.',
      },
      {
        question: 'How does San Diego’s coastal climate impact roof longevity?',
        answer: 'San Diego properties experience intense summer ultraviolet radiation, damp morning coastal marine layers, salt-air exposure, and dry Santa Ana wind gusts. These cycles cause organic roofing felt to dry out and crack beneath tiles. We install high-temperature synthetic underlayments and corrosion-resistant flashings engineered specifically for Southern California microclimates.',
      },
      {
        question: 'Can you handle solar panel detach and reset during a roof replacement?',
        answer: 'Yes. Rise Up coordinates end-to-end solar detach and reset services in-house. We safely decouple your panels, store them during reroofing, install new waterproof stanchion boots, and remount and wire the system so your solar warranties remain completely protected.',
      },
      {
        question: 'Is Rise Up Roofing licensed and insured in San Diego?',
        answer: 'Yes, Rise Up Roofing & Construction holds active California Contractor’s License #1096492, with both C-39 Roofing and B General Building classifications. We carry comprehensive general liability insurance and workers’ compensation for complete homeowner protection.',
      },
    ],
  },
  {
    slug: 'oceanside',
    name: 'Oceanside',
    county: 'San Diego',
    seoTitle: 'Roofing Contractor Oceanside CA | Rise Up Roofing',
    seoDescription: 'Trusted roofing contractor in Oceanside, CA. Headquartered on El Camino Real. Tile relay, shingle replacement, and emergency roof repairs. Free estimates.',
    h1: 'Premier Roofing Contractor in Oceanside, CA',
    intro: 'Headquartered right here in Oceanside on South El Camino Real, Rise Up Roofing & Construction is Oceanside\'s hometown roofing and general contracting expert. From coastal beach bungalows in South O and historic Townsite homes to tile-roofed residences across Rancho Del Oro and Fire Mountain, our licensed craftsmen provide fast emergency leak response, 50-year synthetic tile relays, solar reroofing, and whole-home exterior additions. Licensed, bonded, and fully insured under California License #1096492.',
    neighborhoods: ['Rancho Del Oro', 'Fire Mountain', 'Oceanside Harbor', 'South Oceanside', 'Townsite / Downtown', 'Arrowood', 'Ivey Ranch', 'Ocean Hills', 'MiraCosta', 'Loma Alta'],
    faqs: [
      {
        question: 'Where is Rise Up Roofing located in Oceanside?',
        answer: 'Our corporate office and dispatch center are located at 2182 S El Camino Real, Oceanside, CA 92054. Because we are locally based, our emergency leak triage teams can typically arrive at any Oceanside home or business in under 60 minutes during winter rainstorms.',
      },
      {
        question: 'How does Oceanside\'s coastal marine layer affect roof longevity?',
        answer: 'Oceanside roofs endure dense morning marine fog, heavy dew, and corrosive salt spray blowing off the Pacific Ocean. Standard asphalt felt underlayment absorbs this moisture and degrades prematurely. We install corrosion-resistant copper and galvanized valley flashings, stainless fasteners, and dual-layer breathable synthetic underlayments designed specifically for coastal environments.',
      },
      {
        question: 'Do I need a city permit for roof replacement in Oceanside?',
        answer: 'Yes. The City of Oceanside Building Division requires permits for residential and commercial reroofing to enforce California Title 24 cool-roof energy standards. Rise Up manages all permit paperwork, scheduling, and on-site building inspector walkthroughs from start to final approval.',
      },
      {
        question: 'How much does a roof replacement cost in Oceanside, CA?',
        answer: 'A complete residential roof replacement in Oceanside generally ranges between $8,500 and $17,500 for architectural shingles, and $12,000 to $25,000+ for tile roof relayment with 50-year underlayments. We provide 100% free, itemized drone inspections and written proposals before any work begins.',
      },
      {
        question: 'Can you repair broken tiles or localized leaks without replacing the whole roof?',
        answer: 'Yes. If your roof underlayment is in sound condition and damage is confined to a specific area—such as broken tiles from tree branches or cracked valley flashings—our Oceanside repair mechanics perform surgical repairs with exact color-matched replacement tiles.',
      },
    ],
  },
  {
    slug: 'carlsbad',
    name: 'Carlsbad',
    county: 'San Diego',
    seoTitle: 'Carlsbad Roofing Company | Rise Up Roofing',
    seoDescription: '5-star Carlsbad roofing company. Concrete & clay tile relayment, dual-layer synthetic underlayments, leak repairs, and solar reroofing in Carlsbad, CA.',
    h1: 'Trusted Roofing Contractor in Carlsbad, CA',
    intro: 'Nestled between luxury coastal bluffs and master-planned inland hills, Carlsbad properties demand the highest caliber of architectural roofing and exterior craftsmanship. Rise Up Roofing & Construction provides Carlsbad homeowners and commercial facilities with white-glove roofing services—from custom tile lift-and-resets in Aviara and La Costa to standing seam metal installs and solar integration. We maintain spotless jobsites, respect strict HOA architectural guidelines, and guarantee all workmanship with written multi-decade warranties.',
    neighborhoods: ['Aviara', 'La Costa', 'Calavera Hills', 'Carlsbad Village', 'Batiquitos Lagoon', 'Old Carlsbad', 'Rancho Carrillo', 'Poinsettia Park', 'Terramar', 'Kelly Ranch'],
    faqs: [
      {
        question: 'How does a tile roof relay benefit Carlsbad homeowners?',
        answer: 'Most homes in Aviara, La Costa, and Calavera Hills feature concrete or Spanish clay tiles that are still structurally sound, but the original 20-year felt underlayment beneath has disintegrated. Our tile relay service removes the tiles, replaces the failed underlayment with commercial-grade synthetic membranes, and resets your original tiles—saving you up to 50% compared to purchasing brand-new tile.',
      },
      {
        question: 'Do you comply with Carlsbad HOA architectural review requirements?',
        answer: 'Yes. We routinely assist homeowners in master-planned communities like Aviara, Batiquitos, and Rancho Carrillo with HOA submittal packages, providing manufacturer sample boards, spec sheets, and color chips that ensure immediate architectural committee approval.',
      },
      {
        question: 'What should I do if my solar panels need to be removed for a roof replacement in Carlsbad?',
        answer: 'Rise Up provides seamless in-house solar detach and reset services. Our certified technicians safely de-energize and remove your solar panels, complete the roof replacement with heavy-duty waterproof flashings, and remount the array with full electrical testing so your solar production is quickly restored.',
      },
      {
        question: 'Are your roofing materials compliant with California Title 24 in Carlsbad?',
        answer: 'Yes. All shingle and tile roofing systems we install meet or exceed California Title 24 cool-roof reflectance standards, helping lower summer cooling costs and ensuring full compliance with Carlsbad municipal building codes.',
      },
      {
        question: 'How quickly can you provide a roof estimate in Carlsbad?',
        answer: 'Because our dispatch facility is minutes away in adjacent Oceanside, we can typically schedule a same-day or next-day drone roof inspection in Carlsbad, delivering a detailed photo report and transparent estimate within 24 hours.',
      },
    ],
  },
  {
    slug: 'encinitas',
    name: 'Encinitas',
    county: 'San Diego',
    seoTitle: 'Roofing Contractor Encinitas CA | Rise Up Roofing',
    seoDescription: 'Top-rated roofing contractor in Encinitas, CA. Tile underlayment replacement, architectural shingles, and solar roofing across coastal Encinitas communities.',
    h1: 'Premier Roofing Contractor in Encinitas, CA',
    intro: 'From the artistic coastal enclaves of Leucadia and Cardiff-by-the-Sea to the equestrian estates of Olivenhain, Encinitas showcases some of North County\'s most distinctive architecture. Encinitas homes must endure relentless coastal humidity, morning marine layers, and intense afternoon sun. Rise Up Roofing & Construction delivers specialized coastal roofing solutions—including corrosion-proof copper valley metal, salt-impervious synthetic underlayments, custom solar integrations, and whole-home addition framing.',
    neighborhoods: ['Leucadia', 'Old Encinitas', 'New Encinitas', 'Cardiff-by-the-Sea', 'Olivenhain', 'Moonlight Beach', 'Village Park'],
    faqs: [
      {
        question: 'How does salt air corrosion impact coastal Encinitas roofs?',
        answer: 'Salt aerosol carried by onshore Pacific breezes quickly corrodes standard galvanized steel flashings and nails. In Encinitas, we utilize marine-grade copper, stainless steel fasteners, and aluminum alloy drip edges to prevent premature rust leaks.',
      },
      {
        question: 'What roofing styles are most popular in Encinitas and Cardiff?',
        answer: 'Coastal cottages and modern beach homes frequently feature architectural composition shingles or standing seam metal accents, while Mediterranean and Spanish homes throughout Olivenhain and New Encinitas showcase concrete and clay tile systems.',
      },
      {
        question: 'Do you install solar panels during roof replacement in Encinitas?',
        answer: 'Yes. We offer turnkey combined roofing and solar installations with unified 25-year warranties, as well as solar detach and reset services for existing arrays.',
      },
      {
        question: 'Does Encinitas require cool-roof compliance for reroofing?',
        answer: 'Yes. The City of Encinitas enforces California Title 24 cool-roof standards for residential reroofing. We supply high-reflectance, Title 24-certified materials in dozens of architectural styles and colors.',
      },
      {
        question: 'How do I get a free roofing estimate in Encinitas?',
        answer: 'Call us at (760) 622-1230 or submit an inquiry through our website to schedule a free drone roof inspection and detailed proposal.',
      },
    ],
  },
  {
    slug: 'escondido',
    name: 'Escondido',
    county: 'San Diego',
    seoTitle: 'Roofing Contractor Escondido CA | Rise Up Roofing',
    seoDescription: 'Licensed roofing contractor in Escondido, CA. Member of Escondido Chamber of Commerce. Commercial TPO, roof coatings, residential tile, and shingle repairs.',
    h1: 'Top-Rated Roofing Contractor in Escondido, CA',
    intro: 'As an active member of the Escondido Chamber of Commerce, Rise Up Roofing & Construction is dedicated to protecting homes, agricultural facilities, and commercial buildings throughout inland North County. Inland valley temperatures in Escondido can surge past 100°F during peak summer months, placing intense thermal stress on roof membranes and drying out asphalt shingles twice as fast as coastal properties. We engineer high-albedo cool roofs, commercial TPO systems, silicone coatings, and dual-layer tile systems designed to withstand extreme thermal expansion.',
    neighborhoods: ['Historic Downtown Escondido', 'Felicita', 'Del Lago', 'Midway', 'East Grove', 'Country Club', 'Kit Carson Park', 'Hidden Meadows', 'North Broadway', 'Eureka Springs'],
    faqs: [
      {
        question: 'Is Rise Up Roofing an active member of the Escondido business community?',
        answer: 'Yes. We are proud members of the Escondido Chamber of Commerce and actively serve residential homeowners, agricultural properties, and commercial building managers throughout the greater Escondido valley.',
      },
      {
        question: 'How does Escondido\'s extreme summer heat affect my roof?',
        answer: 'Inland valley heat causes standard asphalt roofing materials to dry out, lose protective granules, and blister. Under tile roofs, scorching radiant heat bakes conventional felt paper into brittle crisps. We install reflective cool-roof shingles and high-temperature synthetic underlayments rated to withstand temperatures up to 250°F.',
      },
      {
        question: 'Do you offer commercial flat roofing and roof coatings in Escondido?',
        answer: 'Yes. We specialize in commercial TPO single-ply membrane roofing, built-up roofing, and seamless elastomeric silicone roof coatings for industrial warehouses, shopping plazas, and office parks throughout Escondido\'s commercial corridors.',
      },
      {
        question: 'How much does residential roof repair or replacement cost in Escondido?',
        answer: 'Minor roof leak repairs in Escondido typically range from $450 to $1,800 depending on the scope of damage. Complete residential roof replacements average $8,000 to $16,500 for asphalt shingles and $11,000 to $24,000+ for tile relays. We offer 100% free inspections with transparent, zero-pressure proposals.',
      },
      {
        question: 'Do you handle City of Escondido building permits and inspections?',
        answer: 'Yes. We manage the entire municipal permitting process with the City of Escondido Building Division, ensuring your new roof meets all seismic, wind, and Title 24 energy mandates.',
      },
    ],
  },
  {
    slug: 'poway',
    name: 'Poway',
    county: 'San Diego',
    seoTitle: 'Roofing Contractor Poway CA | Rise Up Roofing',
    seoDescription: 'Top-rated Poway roofing contractor. Class A wildfire-rated standing seam metal, concrete tile relays, and durable roof replacements across Poway, CA.',
    h1: 'Expert Roofing Contractor in Poway, CA',
    intro: 'Known as "The City in the Country," Poway is celebrated for its sprawling rural estates, scenic foothill vistas, and equestrian lifestyle. However, its inland location and proximity to wildland-urban interface (WUI) brushlands make wildfire protection a paramount concern for Poway homeowners. Rise Up Roofing & Construction specializes in non-combustible Class A fire-rated roofing—including architectural standing seam metal, fire-resistant concrete tile relays, and Class A fiberglass asphalt shingles—engineered to safeguard homes against flying embers and extreme Santa Ana winds.',
    neighborhoods: ['Green Valley', 'Old Poway', 'High Valley', 'Mesa Heights', 'Silver Saddle Ranch', 'Valle Verde', 'Bridlewood Country Estates', 'Lomas Verdes', 'Vineland Hills'],
    faqs: [
      {
        question: 'What roofing materials provide the best wildfire protection in Poway?',
        answer: 'In Poway\'s high fire-severity zones, Class A fire-rated standing seam metal roofing and heavy concrete tile systems provide superior defense. Metal and concrete are completely non-combustible and will not ignite when exposed to blowing embers or intense radiant heat from surrounding brush.',
      },
      {
        question: 'What is a bird stop and why is it mandatory for tile roofs in fire-prone areas like Poway?',
        answer: 'Bird stops are metal or composite eave closures installed beneath the first row of roofing tiles. In addition to preventing birds and rodents from nesting in the roof space, they prevent wind-driven wildfire embers from blowing beneath curved tiles into dry wood framing.',
      },
      {
        question: 'Can I replace an old wood shake roof with modern standing seam metal in Poway?',
        answer: 'Yes. Replacing wood shake or failing asphalt shingles with standing seam metal or stone-coated steel is one of the most effective ways to lower your California FAIR Plan insurance premiums, increase home equity, and dramatically improve wildfire resistance.',
      },
      {
        question: 'Do you offer tile roof leak repairs and underlayment relays in Poway?',
        answer: 'Yes. Many homes in Green Valley and Bridlewood feature original 1980s and 1990s concrete tile roofs where the tiles remain excellent but the underlying felt has failed. Our tile relay service replaces the underlayment with lifetime dual-ply synthetic materials, restoring total weather protection.',
      },
      {
        question: 'How do I schedule a free roof inspection in Poway?',
        answer: 'Contact our dispatch team at (760) 622-1230 or request an inspection online. We provide high-resolution drone photo surveys, attic moisture inspections, and a comprehensive written estimate at zero cost.',
      },
    ],
  },
  { slug: 'vista', name: 'Vista', county: 'San Diego' },
  { slug: 'san-marcos', name: 'San Marcos', county: 'San Diego' },
  { slug: 'la-jolla', name: 'La Jolla', county: 'San Diego' },
  { slug: 'del-mar', name: 'Del Mar', county: 'San Diego' },
  { slug: 'solana-beach', name: 'Solana Beach', county: 'San Diego' },
  { slug: 'rancho-bernardo', name: 'Rancho Bernardo', county: 'San Diego' },
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
