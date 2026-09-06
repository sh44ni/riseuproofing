export interface GuideSection {
  id: string;
  title: string;
  content: string;
  highlights?: string[];
}

export interface GuideFAQ {
  question: string;
  answer: string;
}

export interface Guide {
  slug: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
  summary: string;
  coverImage: string;
  category: 'Residential Roofing' | 'Commercial Roofing' | 'Energy Efficiency' | 'Home Construction';
  publishedAt: string;
  updatedAt: string;
  readTimeMinutes: number;
  author: {
    name: string;
    role: string;
    license: string;
  };
  tableOfContents: { id: string; title: string }[];
  sections: GuideSection[];
  faqs: GuideFAQ[];
  relatedServices: { name: string; slug: string }[];
  tags: string[];
}

export const GUIDES: Guide[] = [
  {
    slug: 'tile-roof-relay-vs-replacement',
    title: 'Tile Roof Relay vs Replacement: The Complete San Diego Guide',
    seoTitle: 'Tile Roof Relay vs Replacement San Diego | Costs & Process Guide',
    seoDescription: 'Discover why San Diego homeowners choose tile roof relay (lift and reset) over full replacement. Compare costs, underlayment lifespans, and 50% savings.',
    summary:
      'Concrete and Spanish clay roof tiles can last 50 to 100 years, but the asphalt felt underlayment beneath them deteriorates in just 18 to 25 years. Learn how a tile relay restores watertight security at half the cost of replacement.',
    coverImage: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=1200&q=80',
    category: 'Residential Roofing',
    publishedAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
    readTimeMinutes: 8,
    author: {
      name: 'Rise Up Technical Team',
      role: 'Master Roofing Contractors',
      license: 'CSLB #1096492 (Class B & C-39)',
    },
    tableOfContents: [
      { id: 'the-tile-dilemma', title: 'The Underlayment Paradox: Why Tile Roofs Leak' },
      { id: 'what-is-tile-relay', title: 'What is a Tile Lift and Reset (Relay)?' },
      { id: 'cost-comparison', title: 'Relay vs Full Replacement Cost Comparison' },
      { id: 'when-to-relay', title: 'When is a Relay Feasible vs Replacement Required?' },
      { id: 'underlayment-technology', title: 'Modern Dual-Ply Synthetic Underlayments' },
      { id: 'title-24-compliance', title: 'California Title 24 Compliance & Cool Roofs' },
    ],
    sections: [
      {
        id: 'the-tile-dilemma',
        title: 'The Underlayment Paradox: Why Tile Roofs Leak',
        content: `In Southern California communities like Rancho Santa Fe, Carlsbad, La Jolla, and Poway, tile roofing is the architectural gold standard. Concrete tiles and authentic Spanish clay S-tiles are practically indestructible, easily enduring 50 to 100+ years of coastal sun and seasonal rains.

However, many homeowners are shocked when water spots appear on ceilings after just 18 to 22 years while the tiles look completely intact from the street.

The culprit is the organic asphalt felt underlayment beneath the tiles. Tile roofing systems are watershedding barriers, not completely waterproof envelopes. Rainwater naturally channels through tile interlocks into the valley pans and drainage planes. Under San Diego's scorching UV radiation and thermal cycling, traditional 30-lb organic asphalt felt bakes, dries out, and cracks. Once cracked, rainwater drains straight through into the plywood roof deck.`,
        highlights: [
          'Roofing tiles last 50–100 years, but standard builder-grade felt underlayment fails in 18–25 years.',
          'Tiles shed surface water; the underlying membrane provides 100% of the true waterproof seal.',
          'Leaks occur around flashings, valley pans, and chimney crickets even without broken surface tiles.',
        ],
      },
      {
        id: 'what-is-tile-relay',
        title: 'What is a Tile Lift and Reset (Relay)?',
        content: `A Tile Lift and Reset (commonly known as a Tile Relay) is an engineered restoration technique where our master roofers carefully remove your existing tiles, store them safely on the roof or ground, strip the failed paper down to raw wood sheathing, repair any dry-rotted decking, and install dual-layer high-temperature synthetic underlayment.

Once new 26-gauge galvanized or copper flashings, eave bird stops, and elevated battens are fastened, we reinstall your original tiles back into position, replacing only the small percentage of tiles that were cracked over the years. Fresh mortar is then packed along ridges and hips to create a weather-sealed finish.`,
        highlights: [
          'Preserves 85% to 95% of your original, structurally sound tiles.',
          'Upgrades the waterproof membrane from fragile felt to commercial-grade synthetic rubberized asphalt.',
          'Restores roof life expectancy by 30 to 50 years at a fraction of full replacement pricing.',
        ],
      },
      {
        id: 'cost-comparison',
        title: 'Relay vs Full Replacement Cost Comparison',
        content: `Because concrete and Spanish clay tiles represent a massive portion of total project material expenses, reusing your existing tiles delivers dramatic savings.

On an average 2,800-square-foot San Diego residence:
- **Full Tile Replacement:** Involves purchasing thousands of pounds of new concrete or clay tiles, freight charges, disposal fees for heavy old tiles, and complete labor. Total cost typically ranges from **$28,000 to $52,000+**.
- **Tile Relay (Lift & Reset):** Eliminates tile material purchases and landfill weight charges. Total investment typically ranges from **$14,000 to $24,000**.

Homeowners typically save between **40% and 55%** while receiving the exact same 30-year to lifetime waterproof warranty on the underlying system.`,
      },
      {
        id: 'when-to-relay',
        title: 'When is a Relay Feasible vs Replacement Required?',
        content: `A tile relay is viable if your existing tiles are structurally sound and not excessively spalling or brittle. Standard concrete flat and S-tiles from manufacturers like Eagle, Boral, Monier, and Auburn are prime candidates.

However, full replacement is required if:
1. **Severe Clay Deterioration:** Historic 70-year-old unglazed clay tiles have developed severe freeze-thaw or salt-air crumbling.
2. **Discontinued Profiles with Extensive Breakage:** If over 30% of the tiles are broken and matching salvage profiles cannot be acquired.
3. **Weight Limitations:** If structural framing cannot support existing heavy clay tiles and the homeowner wishes to transition to lightweight standing seam metal or Owens Corning architectural shingles.`,
      },
      {
        id: 'underlayment-technology',
        title: 'Modern Dual-Ply Synthetic Underlayments',
        content: `When Rise Up executes a tile relay in San Diego County, we never reinstall obsolete organic paper felt. Instead, we install advanced SBS-modified self-adhering membranes (such as Boral TileSeal or Sharkskin Ultra SA).

These high-temperature membranes feature:
- Thermal resistance up to 250°F (essential under dark sun-baked tiles).
- Self-sealing elastomeric compounds that grip around nail and screw penetrations.
- Tear-resistant cross-laminated polyethylene facers that will not crack during building seismic movement.`,
      },
      {
        id: 'title-24-compliance',
        title: 'California Title 24 Compliance & Cool Roofs',
        content: `Under California Energy Code Title 24 Part 6, re-roofing projects in Climate Zones 7 (Coastal San Diego) and 10 (Inland San Diego) must meet specific solar reflectance and thermal emittance standards.

During a tile relay, we can apply Title 24 compliant reflective coatings or install elevated batten systems. Elevated counter-battens create a continuous 3/4-inch convective airflow cavity beneath the tiles ("Above-Sheathing Ventilation"), reducing heat transfer into your attic by up to 30°F and lowering summer air conditioning costs.`,
      },
    ],
    faqs: [
      {
        question: 'How long does a tile roof relay take on a San Diego home?',
        answer:
          'A typical tile relay takes 3 to 5 working days. Day 1 is detachment, stacking, and tear-off; Day 2 is deck inspection, dry rot repairs, and synthetic underlayment installation; Days 3 through 5 involve flashing installation, tile re-laying, ridge mortar detailing, and magnetic clean-up.',
      },
      {
        question: 'Will broken tiles be replaced during the relay?',
        answer:
          'Yes. We maintain relationships with regional tile yards and carry extensive stock of legacy Boral, Monier, and Lifetile profiles. We replace damaged units with exact dimensional and color matches.',
      },
      {
        question: 'Can solar panels be reinstalled after a tile relay?',
        answer:
          'Yes! Rise Up specializes in solar detach and reset. We safely remove your solar panels before the relay and reinstall them onto new leak-proof tile-replacement flashing mounts once the relay is complete.',
      },
    ],
    relatedServices: [
      { name: 'Tile Roofing Installation & Relay', slug: 'tile-roofing' },
      { name: 'Roof Repair & Leak Detection', slug: 'roof-repair' },
      { name: 'Solar Roofing & Detach/Reset', slug: 'solar-roofing' },
    ],
    tags: ['Tile Roof Relay', 'Tile Lift and Reset', 'Tile Underlayment', 'San Diego Roofing', 'Title 24'],
  },
  {
    slug: 'commercial-flat-roof-solutions',
    title: 'Commercial Flat Roof Solutions: TPO, PVC & Silicone Coatings Compared',
    seoTitle: 'Commercial Flat Roof Solutions San Diego | TPO vs PVC vs Silicone',
    seoDescription: 'Compare commercial flat roofing systems in San Diego: TPO, PVC single-ply membranes, and fluid-applied silicone roof restoration. Costs, warranties & Title 24.',
    summary:
      'Evaluate single-ply TPO, chemical-resistant PVC, and 100% silicone roof coatings. Learn how commercial property owners save 50% on CapEx while securing California Title 24 compliance.',
    coverImage: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
    category: 'Commercial Roofing',
    publishedAt: '2026-01-22T08:00:00Z',
    updatedAt: '2026-09-02T11:00:00Z',
    readTimeMinutes: 10,
    author: {
      name: 'Rise Up Commercial Engineering',
      role: 'Commercial Division Specialist',
      license: 'CSLB #1096492 (Class B & C-39)',
    },
    tableOfContents: [
      { id: 'commercial-landscape', title: 'The Commercial Flat Roof Challenge in San Diego' },
      { id: 'tpo-overview', title: 'TPO Single-Ply: The Energy-Efficient Workhorse' },
      { id: 'pvc-overview', title: 'PVC Membranes: Chemical & Grease Defense' },
      { id: 'silicone-coatings', title: 'Silicone Restoration: The 50% Cost-Saving Alternative' },
      { id: 'tax-advantages', title: 'IRS Section 179 & Depreciation Tax Benefits' },
      { id: 'comparison-table', title: 'Engineering Matrix: TPO vs PVC vs Silicone' },
    ],
    sections: [
      {
        id: 'commercial-landscape',
        title: 'The Commercial Flat Roof Challenge in San Diego',
        content: `Commercial buildings in San Diego County—from retail shopping plazas in Oceanside to industrial distribution warehouses in Otay Mesa and biotech laboratories in Torrey Pines—face intense environmental demands. Flat and low-slope roofs must endure high solar UV radiation, coastal salt air, ponding water from seasonal downpours, and heavy maintenance foot traffic around commercial HVAC units.

Choosing the appropriate flat roof system dictates your facility maintenance budget, energy efficiency, and long-term asset value.`,
      },
      {
        id: 'tpo-overview',
        title: 'TPO Single-Ply: The Energy-Efficient Workhorse',
        content: `Thermoplastic Polyolefin (TPO) is the fastest-growing commercial roofing membrane in North America. Formulated from ethylene propylene rubber and polypropylene, TPO features heat-welded seams that create a continuous monolithic sheet.

Key benefits of TPO in San Diego:
- **Title 24 Cool Roof Performance:** High solar reflectance index (SRI > 100) drops surface temperatures from 160°F to 90°F.
- **Superior Seam Strength:** Hot-air heat-welded laps are up to 4 times stronger than taped or glued EPDM seams.
- **Cost-Effective:** Typically ranges between **$6.50 and $11.00 per square foot installed**.`,
      },
      {
        id: 'pvc-overview',
        title: 'PVC Membranes: Chemical & Grease Defense',
        content: `Polyvinyl Chloride (PVC) is the premier choice for commercial properties with rooftop restaurants, food processing plants, manufacturing facilities, and chemical exhaust vents.

While TPO can soften or blister when exposed to animal fats, greases, and harsh chemicals, PVC’s chemical formulation remains completely impervious. PVC also offers superior puncture resistance and flexibility across thermal cycles. Pricing generally ranges from **$8.50 to $14.00 per square foot installed**.`,
      },
      {
        id: 'silicone-coatings',
        title: 'Silicone Restoration: The 50% Cost-Saving Alternative',
        content: `If your existing commercial flat roof (aged TPO, PVC, modified bitumen, or metal) is structurally sound with dry insulation, a full tear-off is rarely needed.

Rise Up's fluid-applied 100% high-solids silicone roof restoration applies directly over the cleaned and prepped existing membrane. Silicone forms a seamless, joint-free rubber shield that:
- Permanently withstands continuous ponding water without softening.
- Eliminates expensive landfill tear-off fees and loud tenant disruptions.
- Costs between **$3.50 and $7.00 per square foot**—less than half the price of a full re-roof.
- Carries renewable 10 to 20-year manufacturer labor and material warranties.`,
      },
      {
        id: 'tax-advantages',
        title: 'IRS Section 179 & Depreciation Tax Benefits',
        content: `One of the most compelling financial reasons commercial property owners select silicone roof coatings over full replacement is tax treatment.

Under IRS guidelines:
- **Roof Replacement:** Classified as a capital expenditure (CapEx) and must be depreciated over **39 years**.
- **Silicone Restoration:** Classified as building repair and maintenance. Under IRS Section 179 and Tax Cuts and Jobs Act (TCJA) provisions, 100% of the restoration investment can often be deducted in the **very first tax year**, unlocking immediate cash flow advantages.`,
      },
      {
        id: 'comparison-table',
        title: 'Engineering Matrix: TPO vs PVC vs Silicone',
        content: `Here is how the top three commercial options stack up:
- **TPO (60-Mil):** Best for warehouses, offices, retail. High UV reflection, 20–25 year life, moderate cost.
- **PVC (60-Mil):** Best for restaurants, food processing, industrial chemical exposure. Fire-resistant, 25–30 year life, higher cost.
- **Silicone Coating:** Best for existing roofs needing leak encapsulation without tear-off. 15–20 renewable year life, lowest upfront cost, 100% tax deductible.`,
      },
    ],
    faqs: [
      {
        question: 'Does silicone roof coating void my existing roof warranty?',
        answer:
          'No. As certified commercial applicators for leading coating manufacturers (GAF, Carlisle, Henry), our installations provide an independent manufacturer-backed warranty that replaces expired underlying warranties.',
      },
      {
        question: 'How do you detect wet insulation before applying commercial roof coatings?',
        answer:
          'We conduct evening infrared thermal scans and non-destructive core samples. Any wet insulation boards are cut out and replaced with dry polyisocyanurate before coatings are sprayed.',
      },
    ],
    relatedServices: [
      { name: 'Commercial Roofing Solutions', slug: 'commercial-roofing' },
      { name: 'Commercial Roof Inspection', slug: 'commercial-roof-inspection' },
      { name: 'Industrial Roofing Contractors', slug: 'industrial-roofing' },
      { name: 'Roof Coating & Restoration', slug: 'roof-coating' },
    ],
    tags: ['Commercial Roofing', 'TPO Roofing', 'PVC Membrane', 'Silicone Roof Coating', 'Title 24'],
  },
  {
    slug: 'what-is-built-up-roofing-bur',
    title: 'What is Built-Up Roofing (BUR)? Lifespan, Layers & Repair in San Diego',
    seoTitle: 'What is Built Up Roofing (BUR)? San Diego Commercial Guide',
    seoDescription: 'Comprehensive guide to built-up roofing (BUR) and modified bitumen in San Diego. Multi-ply tar and gravel layers, repair procedures, and maintenance.',
    summary:
      'What is built up roofing? Explore the multi-ply architecture of traditional BUR and modern polymer-modified bitumen. Learn how redundant asphalt plies deliver decades of puncture-resistant performance.',
    coverImage: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?auto=format&fit=crop&w=1200&q=80',
    category: 'Commercial Roofing',
    publishedAt: '2026-02-05T08:00:00Z',
    updatedAt: '2026-09-03T09:00:00Z',
    readTimeMinutes: 9,
    author: {
      name: 'Rise Up Roofing Engineering',
      role: 'Commercial Flat Roof Specialist',
      license: 'CSLB #1096492 (Class B & C-39)',
    },
    tableOfContents: [
      { id: 'definition', title: 'What is Built-Up Roofing (BUR)?' },
      { id: 'anatomy-of-bur', title: 'The Anatomy of a Multi-Ply BUR System' },
      { id: 'bur-vs-mod-bit', title: 'BUR vs Modern Modified Bitumen (SBS & APP)' },
      { id: 'common-failure-modes', title: 'Diagnosing BUR Leaks & Failure Modes' },
      { id: 'repair-protocols', title: 'Built Up Roof Repair & Restoration Protocols' },
      { id: 'title-24-granules', title: 'California Cool Roof Cap Sheet Mandates' },
    ],
    sections: [
      {
        id: 'definition',
        title: 'What is Built-Up Roofing (BUR)?',
        content: `What is built up roofing? Built-up roofing, commonly abbreviated as BUR and historically known as "tar and gravel" roofing, has been the reliable cornerstone of North American commercial flat roofing for more than 120 years.

A BUR system is composed of multiple alternating layers of bitumen (asphalt or coal tar pitch) and reinforcing fabric plies (fiberglass felts or polyester mats), topped with a protective surfacing layer such as aggregate gravel or a mineral-granule cap sheet.

Unlike single-ply membranes that rely on a single 45-to-60-mil barrier, a 4-ply BUR system creates a heavy, multi-layered waterproof cushion up to 250 mils thick that provides exceptional resistance to punctures, dropped tools, and mechanical HVAC vibration.`,
      },
      {
        id: 'anatomy-of-bur',
        title: 'The Anatomy of a Multi-Ply BUR System',
        content: `A complete commercial built-up roof system consists of five essential structural components:
1. **Structural Roof Deck:** The foundation substrate (corrugated steel, plywood, or poured concrete).
2. **Thermal Insulation / Coverboard:** Rigid polyisocyanurate insulation fastened or adhered to meet California energy codes.
3. **Base Sheet:** A heavy asphalt-coated fiberglass anchor sheet mechanically attached to the substrate.
4. **Interply Reinforcement Felts:** Two to four plies of fiberglass felts laminated with continuous moppings of hot asphalt or cold low-odor adhesive.
5. **Surfacing Cap Sheet / Ballast:** Flood coat of asphalt embedded with gravel or an SBS mineral-granule cap sheet reflecting sunlight.`,
      },
      {
        id: 'bur-vs-mod-bit',
        title: 'BUR vs Modern Modified Bitumen (SBS & APP)',
        content: `Polymer-modified bitumen is the modern technological evolution of traditional built-up roofing:
- **SBS (Styrene-Butadiene-Styrene):** Infuses synthetic rubber into asphalt, providing extraordinary elasticity and cold-weather elongation that accommodates building thermal movement.
- **APP (Atactic Polypropylene):** Infuses plastic polymers, providing high resistance to Southern California UV degradation.

Modified bitumen can be installed using clean cold-applied adhesives or self-adhering membranes, eliminating the hot tar kettles and heavy fumes of legacy BUR.`,
      },
      {
        id: 'common-failure-modes',
        title: 'Diagnosing BUR Leaks & Failure Modes',
        content: `While built-up roofs are tough, age and sun exposure eventually manifest in recognizable symptoms:
- **Alligatoring:** Deep crazing patterns in the asphalt flood coat caused by loss of volatile oils under UV rays.
- **Blisters & Ridging:** Trapped moisture or air expanding beneath plies during hot summer days.
- **Flashing Splits:** Thermal movement pulling asphalt away from parapet walls, expansion joints, or drain collars.`,
      },
      {
        id: 'repair-protocols',
        title: 'Built Up Roof Repair & Restoration Protocols',
        content: `When executing built up roof repair in San Diego, surgical accuracy prevents full replacement:
1. **Core Moisture Survey:** Non-destructive infrared imaging pinpoints any trapped moisture within insulation.
2. **Surgical Blister Extraction:** Blisters are sliced open, dried, re-laid, and reinforced with woven polyester mesh and elastomeric mastic.
3. **Seamless Silicone Fluid Overlay:** Aged BUR roofs can be thoroughly power-washed, primed, and coated with a 50-mil seamless silicone envelope, restoring complete watertight integrity without tear-off.`,
      },
      {
        id: 'title-24-granules',
        title: 'California Cool Roof Cap Sheet Mandates',
        content: `Traditional black gravel BUR roofs absorb enormous amounts of solar heat, driving rooftop temperatures past 175°F. Modern California Title 24 regulations require commercial low-slope roofs to feature cool reflective surfaces.

By installing high-albedo mineral cap sheets or applying bright white fluid silicone restorations, building owners achieve compliance while substantially lowering indoor cooling overhead.`,
      },
    ],
    faqs: [
      {
        question: 'How long does a built-up roof (BUR) last in San Diego?',
        answer:
          'A properly installed 3-ply or 4-ply BUR or modified bitumen system typically lasts 20 to 30 years in Southern California. Routine bi-annual inspections and prompt flashing maintenance can extend service life beyond 35 years.',
      },
      {
        question: 'Can you walk on a built-up roof without damaging it?',
        answer:
          'Yes. The multiple laminated plies and dense mineral surfacing make BUR far more resistant to maintenance foot traffic than lightweight single-ply membranes.',
      },
    ],
    relatedServices: [
      { name: 'Modified Bitumen & BUR Roofing', slug: 'modified-bitumen' },
      { name: 'Commercial Roofing Solutions', slug: 'commercial-roofing' },
      { name: 'Commercial Roof Inspection', slug: 'commercial-roof-inspection' },
    ],
    tags: ['Built Up Roofing', 'BUR', 'Modified Bitumen', 'Commercial Flat Roofs', 'San Diego'],
  },
  {
    slug: 'california-title-24-cool-roof-guide',
    title: 'California Title 24 Cool Roof Requirements: Compliance Guide for San Diego',
    seoTitle: 'California Title 24 Cool Roof Guide San Diego | Standards & Savings',
    seoDescription: 'Complete homeowner and commercial guide to California Title 24 Cool Roof mandates in San Diego. Climate zones 7 & 10, solar reflectance, and rebates.',
    summary:
      'Understand California Title 24 Part 6 cool roof mandates for San Diego County. Learn required Solar Reflectance Index (SRI) values, compliant materials, and utility bill reductions.',
    coverImage: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
    category: 'Energy Efficiency',
    publishedAt: '2026-02-14T08:00:00Z',
    updatedAt: '2026-09-04T10:00:00Z',
    readTimeMinutes: 7,
    author: {
      name: 'Rise Up Energy & Sustainability Team',
      role: 'Certified Title 24 Building Compliance',
      license: 'CSLB #1096492 (Class B & C-39)',
    },
    tableOfContents: [
      { id: 'what-is-title-24', title: 'What is California Title 24 Part 6?' },
      { id: 'san-diego-climate-zones', title: 'San Diego Climate Zones: Zone 7 vs Zone 10' },
      { id: 'sri-metrics', title: 'Understanding Aged Solar Reflectance & Thermal Emittance' },
      { id: 'compliant-materials', title: 'Compliant Roofing Materials (Shingle, Tile, Metal & Flat)' },
      { id: 'financial-benefits', title: 'Energy Savings & SDG&E Rebate Opportunities' },
    ],
    sections: [
      {
        id: 'what-is-title-24',
        title: 'What is California Title 24 Part 6?',
        content: `California’s Building Energy Efficiency Standards (Title 24, Part 6) are among the most stringent environmental building codes in the nation. Updated every three years by the California Energy Commission (CEC), Title 24 mandates that all residential and commercial re-roofing projects that replace more than 50% of the roof area must incorporate high-reflectivity "Cool Roof" materials.

The goal of cool roofing is twofold: reduce indoor cooling loads for homeowners and mitigate the "Urban Heat Island" effect across Southern California metropolitan regions.`,
      },
      {
        id: 'san-diego-climate-zones',
        title: 'San Diego Climate Zones: Zone 7 vs Zone 10',
        content: `San Diego County spans two primary CEC climate zones with distinct compliance thresholds:
- **Climate Zone 7 (Coastal San Diego):** Includes Oceanside, Carlsbad, Encinitas, Del Mar, La Jolla, and San Diego coastal areas. Due to moderating marine layers, cool roof standards are slightly more flexible for steep-slope shingles.
- **Climate Zone 10 (Inland Valley San Diego):** Includes Escondido, San Marcos, Poway, El Cajon, Rancho Bernardo, and Ramona. In Zone 10, intense summer heat triggers strict mandatory cool roof standards for both low-slope flat roofs and steep-slope residential re-roofs.`,
      },
      {
        id: 'sri-metrics',
        title: 'Understanding Aged Solar Reflectance & Thermal Emittance',
        content: `Title 24 evaluates roofing materials using two physical parameters certified by the Cool Roof Rating Council (CRRC):
1. **Solar Reflectance:** The fraction of solar energy reflected away from the roof surface (measured 0.0 to 1.0).
2. **Thermal Emittance:** The relative ability of the roof to radiate absorbed heat back into the atmosphere (measured 0.0 to 1.0).
3. **Solar Reflectance Index (SRI):** A composite score incorporating both metrics. High-performance cool roofs typically require an aged SRI of **75+ for low-slope** and **16+ to 20+ for steep-slope shingles**.`,
      },
      {
        id: 'compliant-materials',
        title: 'Compliant Roofing Materials (Shingle, Tile, Metal & Flat)',
        content: `Modern cool roofs do not have to look like plain white commercial coatings. Today’s manufacturers produce gorgeous architectural materials certified for Title 24:
- **Asphalt Shingles:** Owens Corning TruDefinition Duration Cool and GAF Timberline HDZ RS shingles utilize specially coated granules that reflect invisible infrared light while offering rich designer colors.
- **Concrete & Clay Tiles:** Boral and Eagle cool roof tiles meet Title 24 without altering authentic Mediterranean silhouettes.
- **Standing Seam Metal:** Kynar 500 solar-reflective pigments exceed Title 24 standards across dozens of architectural color finishes.
- **Low-Slope Flat Roofs:** Bright white Carlisle 60-mil TPO or fluid-applied silicone coatings provide SRI ratings exceeding 100.`,
      },
      {
        id: 'financial-benefits',
        title: 'Energy Savings & SDG&E Rebate Opportunities',
        content: `A Title 24 compliant cool roof can lower roof surface temperatures by 40°F to 60°F during peak summer heat waves. This reduces heat transfer into your attic, decreasing air conditioning power consumption by **15% to 25%**.

Combined with SDG&E time-of-use rate structures, homeowners in inland valleys often save hundreds of dollars annually on electric utility bills.`,
      },
    ],
    faqs: [
      {
        question: 'Do I need a city building permit for a Title 24 cool roof in San Diego?',
        answer:
          'Yes. All municipal building departments in San Diego County require a permit for re-roofing and mandate submission of CF-1R Title 24 energy compliance forms. Rise Up handles all permit filings and compliance documentation.',
      },
      {
        question: 'Are Title 24 cool shingles more expensive than regular shingles?',
        answer:
          'The price difference is minimal—typically only 3% to 5% more for premium cool shingles—an investment that is quickly recovered through lower air conditioning bills.',
      },
    ],
    relatedServices: [
      { name: 'Residential Roofing Services', slug: 'residential' },
      { name: 'Tile Roofing Installation & Relay', slug: 'tile-roofing' },
      { name: 'Metal Roofing Systems', slug: 'metal-roofing' },
      { name: 'Commercial Roofing Solutions', slug: 'commercial-roofing' },
    ],
    tags: ['Title 24', 'Cool Roofs', 'Energy Efficiency', 'San Diego Climate Zones', 'CRRC'],
  },
  {
    slug: 'home-remodeling-costs-san-diego',
    title: 'San Diego Home Remodeling & Addition Costs: 2026 Price & Permitting Guide',
    seoTitle: 'San Diego Home Remodeling Costs 2026 | Additions, Kitchens & Decks',
    seoDescription: 'Comprehensive guide to San Diego home remodeling and addition costs. Room additions ($275-$450/sq ft), ADUs, kitchen remodels, and deck building.',
    summary:
      'Planning a home remodel or addition in San Diego? Get realistic 2026 price benchmarks for room additions, ADU construction, kitchen remodels, and custom Trex decks, plus permitting requirements.',
    coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    category: 'Home Construction',
    publishedAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-09-05T12:00:00Z',
    readTimeMinutes: 11,
    author: {
      name: 'Rise Up General Construction Division',
      role: 'Licensed Class B General Contractor',
      license: 'CSLB #1096492 (Class B & C-39)',
    },
    tableOfContents: [
      { id: 'market-overview', title: 'The San Diego Home Remodeling Market in 2026' },
      { id: 'room-addition-costs', title: 'Room Additions & Second-Story Expansions ($/sq ft)' },
      { id: 'adu-costs', title: 'Accessory Dwelling Units (ADUs) & Garage Conversions' },
      { id: 'kitchen-bath-costs', title: 'Kitchen Remodeling & Luxury Bath Renovation Costs' },
      { id: 'deck-outdoor-costs', title: 'Custom Decks & Outdoor Living Construction Costs' },
      { id: 'permitting-timeline', title: 'San Diego City & County Permitting Timelines' },
    ],
    sections: [
      {
        id: 'market-overview',
        title: 'The San Diego Home Remodeling Market in 2026',
        content: `With San Diego single-family home prices hovering near historic highs and mortgage interest rates remaining elevated, thousands of coastal and inland homeowners are choosing to "remodel in place" rather than selling and upgrading.

Expanding your home’s footprint or renovating tired living spaces creates immediate lifestyle enjoyment while adding substantial appraised market equity. As licensed Class B general contractors and C-39 roofing specialists, Rise Up provides transparent, realistic pricing data to help homeowners plan their investments.`,
      },
      {
        id: 'room-addition-costs',
        title: 'Room Additions & Second-Story Expansions ($/sq ft)',
        content: `In San Diego County, residential room additions typically cost between **$275 and $450+ per square foot**.
- **Ground-Floor Bump-Out (300–500 sq ft):** Total investment ranges from **$85,000 to $180,000**.
- **Second-Story Vertical Addition (600–1,200 sq ft):** Requires foundation reinforcing and structural shear walls, ranging from **$190,000 to $380,000+**.
- **Primary Bedroom Suite Addition:** Includes luxury curbless bath and walk-in closets, typically **$110,000 to $225,000**.

Because Rise Up manages both structural framing and master roofing weatherproofing in-house, we eliminate the costly sub-contractor markups typical of conventional builders.`,
      },
      {
        id: 'adu-costs',
        title: 'Accessory Dwelling Units (ADUs) & Garage Conversions',
        content: `California’s progressive ADU laws make adding a secondary dwelling unit one of the highest-yield real estate investments in San Diego:
- **Garage Conversion ADU (400–500 sq ft):** Ranges between **$115,000 and $175,000**. Uses existing framing and foundation.
- **Detached New-Construction ADU (600–1,000 sq ft):** Ranges between **$210,000 and $365,000**. Includes trenching for water/sewer lateral lines, electrical subpanels, and solar panels.

In San Diego’s rental market, a modern 1-bedroom ADU commands **$2,200 to $3,400 per month**, delivering a strong recurring cash-on-cash return.`,
      },
      {
        id: 'kitchen-bath-costs',
        title: 'Kitchen Remodeling & Luxury Bath Renovation Costs',
        content: `Kitchens and bathrooms yield the highest return on investment in residential construction:
- **Mid-Range Kitchen Remodel:** Semi-custom cabinets, quartz countertops, new appliances, tile backsplash: **$32,000 to $58,000**.
- **High-End Architectural Kitchen Remodel:** Load-bearing wall removal for open-concept floor plan, custom waterfall islands, luxury appliances: **$68,000 to $130,000+**.
- **Primary Luxury Bathroom Remodel:** Curbless zero-threshold walk-in shower, freestanding soaking tub, dual vanity, radiant heated tile flooring: **$24,000 to $55,000**.`,
      },
      {
        id: 'deck-outdoor-costs',
        title: 'Custom Decks & Outdoor Living Construction Costs',
        content: `Southern California’s climate makes outdoor living space an extension of your home:
- **Trex Composite Decking:** Ranges from **$45 to $85 per square foot installed**. Requires zero staining, painting, or splinter remediation.
- **Hillside Cantilevered View Decks:** Requires geotechnical caissons and engineered steel posts, ranging from **$28,000 to $75,000+**.
- **Covered Patio Additions:** Heavy-timber Douglas Fir with tongue-and-groove cedar ceilings and recessed LED lighting: **$16,000 to $42,000**.`,
      },
      {
        id: 'permitting-timeline',
        title: 'San Diego City & County Permitting Timelines',
        content: `Permitting is a critical variable in project scheduling:
- **City of San Diego DSD (Development Services Department):** Typical plan check review takes 6 to 12 weeks for room additions and ADUs. Expedited ADU programs can cut this to 4 to 6 weeks.
- **County of San Diego (Unincorporated):** Plan checks typically run 4 to 8 weeks.
- **Coastal Overlay Zone:** Properties west of Interstate 5 may require Coastal Commission clearance if altering building height or exterior envelope. Rise Up handles all drafting, engineering calculations, and city submittals.`,
      },
    ],
    faqs: [
      {
        question: 'Do I need architectural plans and engineering for a room addition?',
        answer:
          'Yes. All room additions and ADUs require stamped structural engineering calculations, architectural site plans, and California Title 24 energy calculations. Rise Up provides full design-build drafting and engineering services in-house.',
      },
      {
        question: 'Can I finance my home addition or remodel project?',
        answer:
          'Yes. We offer zero-down payment plans and low monthly financing options with terms extending up to 10 to 12 years to keep your remodeling project manageable.',
      },
    ],
    relatedServices: [
      { name: 'General Construction & Decks', slug: 'construction' },
      { name: 'Custom Home & Room Additions', slug: 'home-additions' },
      { name: 'ADU Construction Contractors', slug: 'adu-construction' },
      { name: 'Custom Deck Builder & Balconies', slug: 'deck-builder' },
    ],
    tags: ['Home Remodeling Costs', 'Room Additions', 'ADU Construction', 'Deck Builders', 'San Diego Costs'],
  },
];

export function getGuideBySlug(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

export function getAllGuideSlugs(): string[] {
  return GUIDES.map((g) => g.slug);
}
