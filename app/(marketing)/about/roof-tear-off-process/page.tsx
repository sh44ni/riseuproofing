import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/components/shared/Icon';
import {
  buildMetadata,
  buildFAQJsonLd,
  buildTechArticleJsonLd,
  buildLocalBusinessJsonLd,
} from '@/lib/seo/metadata';
import { Section, Container } from '@/components/shared/Container';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { FAQAccordion } from '@/components/shared/FAQAccordion';
import { COMPANY_NAME, LICENSE_NUMBER, PHONE_HREF, PHONE_NUMBER } from '@/lib/utils';

export const metadata: Metadata = buildMetadata({
  title: 'Roof Tear-Off & Removal Guide | San Diego | Rise Up',
  description:
    'Complete guide to the roof tear-off and removal process in San Diego. California Building Code CRC R908 rules, 5-phase protocol, rot repair, and costs.',
  path: '/about/roof-tear-off-process',
});

const FAQS = [
  {
    question: 'What is the California code limit on roofing layers before a mandatory tear-off?',
    answer:
      'Under California Residential Code (CRC) Section R908.3.1.1, a building cannot support more than two applications of any roof covering. If your roof already has two layers of shingles, a complete tear-off down to the roof deck is legally required before a new roof can be installed. Additionally, the CRC prohibits installing any overlay over existing wood shakes, slate, or clay and concrete tile roofs, regardless of the number of existing layers.',
  },
  {
    question: 'How long does a complete residential roof tear-off take in San Diego?',
    answer:
      'For an average single-family home in San Diego County (1,800 to 2,800 square feet), the tear-off and deck prep phase is typically completed in 1 to 2 business days. Our crews arrive early, set up full property and landscaping protection, systematically strip the old shingles and underlayment, inspect and repair the decking, and secure the home with watertight synthetic underlayment before the end of day one.',
  },
  {
    question: 'How do you protect my landscaping, pool, and property during roof removal?',
    answer:
      'Rise Up uses a comprehensive property protection protocol. We hang heavy-duty Catch-All canvas wall chutes from the eaves to shield exterior stucco, siding, and windows. Plywood shields and tarps are placed over HVAC condensers, swimming pool surfaces, hot tubs, and delicate landscaping. After tear-off is complete, our crew conducts multiple passes with high-powered magnetic rolling sweeps to collect 100% of discarded roofing nails and metal debris.',
  },
  {
    question: 'What happens if you discover dry rot or termite damage beneath the old roof?',
    answer:
      'Once the old roofing materials are removed down to raw wood sheathing, our licensed crew conducts a meticulous framing and deck inspection. If water intrusion or termites have compromised the plywood or rafters, we document the damage with photos, present an itemized per-sheet repair plan at our predetermined rate, and sister or replace the damaged structural members with code-compliant lumber before new underlayment is applied.',
  },
  {
    question: 'Where does the torn-off roofing debris go? Can asphalt shingles be recycled in California?',
    answer:
      'Yes. Rather than filling local San Diego landfills like Miramar or Otay, Rise Up hauls asphalt shingle tear-off to certified Southern California recycling processors. The asphalt shingles are processed, ground, and filtered for use in Recycled Asphalt Pavement (RAP), which Caltrans utilizes to repave highways and municipal roads across California.',
  },
];

const TEAR_OFF_PHASES = [
  {
    number: '01',
    title: 'Property Perimeter & Landscape Armor',
    tagline: 'Zero Property Impact Protocol',
    description:
      'Before a single nail is pulled, our crew establishes a reinforced safety perimeter around your home. We hang heavy-duty reinforced tarps from gutter lines to catch falling debris and protect stucco and windows. Specially constructed plywood barrier boxes are erected over HVAC condensing units, pool pumps, and outdoor kitchen equipment, while sensitive garden beds and shrubbery are shielded with breathable ground tarps.',
    points: [
      'Heavy-duty catch tarps pinned along exterior walls',
      'Plywood boxes shielding HVAC condensers and pool equipment',
      'Roll-off dump trailers positioned to catch chutes directly',
      'Dedicated safety zones for pedestrian pathways',
    ],
  },
  {
    number: '02',
    title: 'Systematic Shingle & Underlayment Stripping',
    tagline: 'Stripping Down to Bare Sheathing',
    description:
      'Using specialized fulcrum-action shingle rippers and tear-off pitchforks, our crew strips the roof systematically from ridge to eaves. We remove all existing courses of asphalt shingles, aged asphalt-saturated felt paper, corroded valley metal, rusted step flashings, and deteriorated plumbing boots. We never scrape over old felt — every square inch of the wood substrate is exposed for structural review.',
    points: [
      'High-leverage pneumatic and manual shingle-ripping tools',
      'Complete extraction of valley metal, drip edges, and pipe jacks',
      'Old tar paper and felt stripped to bare structural wood',
      'Immediate debris deposit into chutes to minimize roof dead weight',
    ],
  },
  {
    number: '03',
    title: 'Sub-Decking Dry Rot & Deflection Inspection',
    tagline: 'Ensuring Structural Framing Integrity',
    description:
      'With the roof deck fully bare, our master technicians walk every square foot of plywood, OSB, or skip-sheeting. In coastal San Diego climates where marine humidity quietly feeds fungal decay, we check for wood rot, delamination, termite tunneling, and rafter sag. Any compromised wood is marked, photographed, and replaced with CDX exterior plywood nailed to California high-wind seismic spacing.',
    points: [
      '100% tactile and visual inspection of decking sheathing',
      'Deflection testing across rafters and ceiling joists',
      'Removal and replacement of rotted or termite-hollowed wood',
      'Deck re-nailing with 8d ring-shank nails at 6" edge / 12" field',
    ],
  },
  {
    number: '04',
    title: 'Caltrans-Approved Shingle Recycling & Magnetic Sweeps',
    tagline: 'Diverting Landfill Waste & 100% Nail Pickup',
    description:
      'Rise Up is committed to sustainable construction. Asphalt shingles removed from your roof are transported to certified recycling facilities where they are processed into Recycled Asphalt Pavement (RAP) used by Caltrans on California highways. Meanwhile, on your grounds, we execute multiple overlapping passes with commercial-grade neodymium magnetic sweeps across lawns, driveways, and flowerbeds.',
    points: [
      'Asphalt shingles diverted from San Diego Miramar landfill',
      'Recycled into Caltrans highway aggregate and road base',
      'Dual-pass magnetic rolling sweeps across all exterior grounds',
      'Complete blower cleanup of patios, decks, and walkways',
    ],
  },
  {
    number: '05',
    title: 'Water-Tight Secondary Barrier & Synthetic Underlayment',
    tagline: 'Immediate Storm & Marine Layer Defense',
    description:
      'Before our crew departs for the day, your roof deck is completely sealed against rain and coastal fog. We install self-adhering modified bitumen Ice & Water Shield leak barriers in critical vulnerability zones — valleys, rakes, eaves, and chimney saddles. The entire deck is then clad with high-traction, Class A fire-rated synthetic underlayment fastened with plastic-capped ring nails.',
    points: [
      'Self-sealing Ice & Water Shield in valleys and around flashings',
      'Class A fire-rated breathable synthetic underlayment installation',
      'Heavy-gauge 26-gauge galvanized pre-painted drip edge applied',
      '100% watertight seal ready for primary roofing installation',
    ],
  },
];

const COMPARISON_ROWS = [
  {
    feature: 'Sub-Decking Dry Rot Inspection',
    tearOff: '100% visible; all dry rot and termite damage identified and repaired',
    overlay: 'Completely blind; existing rot continues decaying beneath new roof',
    tearOffAdvantage: true,
  },
  {
    feature: 'California Building Code Compliance',
    tearOff: 'Fully compliant with CRC R908.3.1.1 across all roof types',
    overlay: 'Illegal if 2 layers exist or over wood shake/tile roofs',
    tearOffAdvantage: true,
  },
  {
    feature: 'Expected Shingle Lifespan',
    tearOff: 'Full 30 to 50 years per manufacturer engineering specs',
    overlay: 'Shortened by 25% to 40% due to trapped heat baking shingles',
    tearOffAdvantage: true,
  },
  {
    feature: 'Manufacturer System Warranty',
    tearOff: 'Full coverage (e.g., Owens Corning 50-Year Non-Prorated Warranty)',
    overlay: 'Severely limited or voided by major shingle manufacturers',
    tearOffAdvantage: true,
  },
  {
    feature: 'Dead Load Weight on Framing',
    tearOff: 'Normal engineered dead load (~240–280 lbs / 100 sq ft)',
    overlay: 'Doubled dead load (~500–600 lbs); puts strain on rafters and trusses',
    tearOffAdvantage: true,
  },
  {
    feature: 'Aesthetic Appearance & Flatness',
    tearOff: 'Flat, uniform, crisp lines with perfect shadow detailing',
    overlay: 'Telegraphs bumps, curls, and imperfections of the old layer',
    tearOffAdvantage: true,
  },
  {
    feature: 'San Diego Home Resale Value',
    tearOff: 'Clean pass on buyer home inspection; top disclosure confidence',
    overlay: 'Frequently flagged by inspectors as deferred future expense',
    tearOffAdvantage: true,
  },
];

export default function RoofTearOffProcessPage() {
  const techArticleJsonLd = buildTechArticleJsonLd({
    headline: 'Roof Tear-Off & Removal Process in San Diego: The Complete Technical Guide',
    description:
      'Complete guide to the roof tear-off and removal process in San Diego. California Building Code CRC R908 rules, 5-phase protocol, rot repair, and costs.',
    url: 'https://riseuproofing.com/about/roof-tear-off-process',
    keywords: [
      'roof tear off process',
      'roof removal',
      'roof tear off san diego',
      'California Residential Code R908',
      'roof dry rot repair',
      'shingle recycling san diego',
    ],
  });

  const faqJsonLd = buildFAQJsonLd(FAQS);
  const localBusinessJsonLd = buildLocalBusinessJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(techArticleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />

      <Section alternate={false} className="pt-32 sm:pt-36">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'About', href: '/about' },
            { label: 'Roof Tear-Off & Removal Guide' },
          ]}
        />

        <div className="max-w-4xl mx-auto mb-12">
          {/* Header Badge */}
          <div className="inline-flex items-center gap-2 glass-chip px-3.5 py-1 rounded-full mb-4 text-xs font-bold uppercase tracking-wider text-brand-blue">
            <Icon name="scale" className="w-3.5 h-3.5" />
            <span>Engineering Standard • California Residential Code</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[var(--text-primary)] mb-6 tracking-tight leading-[1.15]">
            Roof Tear-Off &amp; Removal Guide: The Complete San Diego Protocol
          </h1>

          <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed mb-8">
            When replacing a roof in San Diego County, one of the most critical decisions is whether to perform a complete tear-off down to the bare wooden decking or install an overlay. Understanding California Building Code mandates, structural weight limitations, and coastal dry rot risks will ensure your investment lasts for decades to come.
          </p>

          {/* Quick Authority Highlights Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs mb-10">
            <div className="flex items-center gap-2.5">
              <Icon name="check-circle" className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="text-xs font-semibold text-[var(--text-primary)]">CRC R908 Compliant</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Icon name="check-circle" className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="text-xs font-semibold text-[var(--text-primary)]">100% Magnetic Sweep</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Icon name="check-circle" className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="text-xs font-semibold text-[var(--text-primary)]">Caltrans Recycling</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Icon name="check-circle" className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="text-xs font-semibold text-[var(--text-primary)]">Sub-Deck Certified</span>
            </div>
          </div>
        </div>

        {/* Section 1: California Building Code CRC R908 Deep Dive */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="glass-card-hero rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-sm mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <Icon name="file-text" className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-500 block">
                  California Building Code Mandate
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)]">
                  California Residential Code Section CRC R908.3.1.1
                </h2>
              </div>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              <p>
                In the State of California, reroofing projects are strictly regulated by the <strong>California Residential Code (CRC), Section R908</strong>. While some uncertified handymen might propose simply nailing new shingles directly over your existing roof (an &quot;overlay&quot; or &quot;roof-over&quot;), California law places strict statutory limitations on when this is permitted:
              </p>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-slate-800 font-mono text-xs">
                <p className="font-semibold text-slate-900">
                  CRC R908.3.1.1 Not Allowed (Summary of California Statutory Code):
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-700 font-sans">
                  <li>
                    <strong>Maximum Two Roof Layers:</strong> A roof recover shall not be applied where the existing roof has two or more applications of any type of roof covering. If your home has two layers, a 100% complete tear-off down to structural sheathing is legally mandated by building code.
                  </li>
                  <li>
                    <strong>Wood Shake &amp; Shingle Prohibition:</strong> A new roof covering shall not be applied over an existing roof covering of wood shingles, shakes, slate, clay, or concrete tile.
                  </li>
                  <li>
                    <strong>Water-Damaged Substrate:</strong> Where the existing roof or roof covering is water soaked or has deteriorated to the point that the existing roof covering is not adequate as a base for additional roofing, all existing coverings must be removed.
                  </li>
                </ul>
              </div>

              <p>
                Beyond legal building codes, installing a second layer adds between <strong>250 to 350 pounds of dead load weight per 100 square feet</strong>. In Southern California&apos;s active seismic zones, placing double roof weight on 1960s–1980s roof trusses significantly increases deflection strain during ground tremors. Furthermore, premium manufacturers like Owens Corning and GAF explicitly stipulate that their non-prorated 50-year system warranties require direct installation on sound, clean structural sheathing.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Overlay vs. Full Tear-Off Comparative Matrix */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="text-center mb-8">
            <span className="glass-chip px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-brand-blue mb-3 inline-block">
              Engineering Comparison
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
              Complete Tear-Off vs. Reroof Overlay
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-2 max-w-2xl mx-auto">
              Why 98% of San Diego structural engineers and master roofers recommend a full tear-off over an overlay.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 shadow-xs bg-white">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[var(--text-primary)] font-bold">
                  <th className="py-3.5 px-4">Evaluation Factor</th>
                  <th className="py-3.5 px-4 text-emerald-600">Complete Tear-Off (Rise Up Standard)</th>
                  <th className="py-3.5 px-4 text-slate-500">Reroof Overlay (Shingle-Over)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[var(--text-secondary)]">
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.feature} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-[var(--text-primary)]">
                      {row.feature}
                    </td>
                    <td className="py-3 px-4 text-emerald-700 bg-emerald-50/20 font-medium">
                      <div className="flex items-start gap-1.5">
                        <Icon name="check-circle" className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{row.tearOff}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      <div className="flex items-start gap-1.5">
                        <Icon name="alert-triangle" className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span>{row.overlay}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: The 5-Phase Technical Roof Tear-Off Protocol */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="text-center mb-10">
            <span className="glass-chip px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-brand-blue mb-3 inline-block">
              Master Execution
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
              Rise Up&apos;s 5-Phase Technical Tear-Off Protocol
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-2 max-w-2xl mx-auto">
              Every roof removal project follows a rigorous, engineered sequence designed to safeguard your home, landscape, and structural frame.
            </p>
          </div>

          <div className="space-y-6">
            {TEAR_OFF_PHASES.map((phase) => (
              <div
                key={phase.number}
                className="glass-card-interactive rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs"
              >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 font-extrabold text-base border border-blue-100">
                        {phase.number}
                      </div>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">
                          {phase.tagline}
                        </span>
                        <h3 className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)]">
                          {phase.title}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed mb-5">
                    {phase.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {phase.points.map((pt) => (
                      <div key={pt} className="flex items-start gap-2 text-xs text-[var(--text-primary)]">
                        <Icon name="check-circle" className="w-3.5 h-3.5 text-brand-blue flex-shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Section 4: Sub-Decking Dry Rot & Coastal Weather Factors */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="glass-card-interactive rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center">
                <Icon name="wrench" className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-blue block">
                  Structural Diagnosis
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)]">
                  Sub-Decking Dry Rot Detection in San Diego County
                </h2>
              </div>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              <p>
                San Diego&apos;s climate presents unique challenges for roof sub-decking. Coastal communities such as Oceanside, Carlsbad, Encinitas, and La Jolla experience persistent early-morning marine moisture and &quot;June Gloom&quot;. When old roof underlayment deteriorates after 20+ years, vapor penetrates beneath the shingles, condensing on the wooden deck without adequate ventilation.
              </p>
              <p>
                During our Phase 3 inspection, we evaluate the substrate across three key structural parameters:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-1.5 text-xs sm:text-sm flex items-center gap-1.5">
                    <Icon name="alert-triangle" className="w-3.5 h-3.5 text-amber-500" />
                    <span>Fungal Dry Rot</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Serpula lacrymans and wood-decay fungi consume cellulose in plywood, leaving wood brittle and sponge-like. We remove compromised sheets down to sound framing.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-1.5 text-xs sm:text-sm flex items-center gap-1.5">
                    <Icon name="layers" className="w-3.5 h-3.5 text-brand-blue" />
                    <span>Skip-Sheeting Conversion</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Many 1960s–1980s homes have 1x4 or 1x6 spaced skip boards originally installed for cedar shakes. We install solid 1/2&quot; CDX plywood to meet modern asphalt and tile codes.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-1.5 text-xs sm:text-sm flex items-center gap-1.5">
                    <Icon name="shield" className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Rafter Sistering</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    When rafters suffer surface rot or deflection along eaves, our licensed framing carpenters sister structural 2x6 or 2x8 lumber directly to the damaged joist.
                  </p>
                </div>
              </div>

              <p>
                At Rise Up, we provide upfront, transparent per-sheet pricing for any required plywood replacement. We photograph every sheet of damaged decking before removal so you have complete documentation for your records and insurance files.
              </p>
            </div>
          </div>
        </div>

        {/* Section 5: Cost Factors of a Roof Tear-Off in San Diego */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="glass-card-interactive rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Icon name="dollar-sign" className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block">
                  Cost Transparency
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)]">
                  Key Factors That Determine Roof Tear-Off Pricing
                </h2>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
              Roof tear-off pricing in San Diego County is typically calculated per &quot;square&quot; (a 100-square-foot section of roof area). The exact cost depends on several physical and logistical variables:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-1">Number of Existing Layers</h4>
                <p className="text-slate-600 text-xs leading-relaxed">
                  A single layer of composition shingles requires less labor and dump tonnage than a roof with two layers or heavy cedar shakes underneath.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-1">Roof Pitch &amp; Steepness</h4>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Roofs steeper than 6:12 require OSHA fall-arrest harness rigging, roof jacks, and slower manual handling compared to low-pitch walkable roofs.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-1">Material Being Removed</h4>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Removing concrete tile (900+ lbs/sq) or cedar shake requires specialized handling compared to lightweight three-tab or architectural asphalt shingles.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-1">Access &amp; Disposal Logistics</h4>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Direct driveway access for high-sided dump trailers allows faster chute disposal than properties requiring hand-carrying across steep hillside terrain.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Frequently Asked Questions */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="text-center mb-8">
            <span className="glass-chip px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-brand-blue mb-3 inline-block">
              Expert Answers
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
              Frequently Asked Questions About Roof Tear-Off
            </h2>
          </div>

          <FAQAccordion items={FAQS} />
        </div>

        {/* Section 7: Related Roofing Services Links */}
        <div className="max-w-4xl mx-auto mb-16">
          <h3 className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)] mb-4">
            Explore Related Roofing &amp; Exterior Services
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              href="/services/repairs"
              className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-brand-blue/40 shadow-xs transition-all group"
            >
              <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] group-hover:text-brand-blue transition-colors">
                Roof Leak Repair
              </h4>
              <p className="text-[11px] text-[var(--text-muted)] mt-1 line-clamp-2">
                24/7 leak diagnostics and emergency water intrusion repairs.
              </p>
            </Link>

            <Link
              href="/services/residential"
              className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-brand-blue/40 shadow-xs transition-all group"
            >
              <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] group-hover:text-brand-blue transition-colors">
                Residential Reroofing
              </h4>
              <p className="text-[11px] text-[var(--text-muted)] mt-1 line-clamp-2">
                Owens Corning architectural shingle systems with 50-year warranties.
              </p>
            </Link>

            <Link
              href="/services/tile-roofing"
              className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-brand-blue/40 shadow-xs transition-all group"
            >
              <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] group-hover:text-brand-blue transition-colors">
                Tile Roofing &amp; Relays
              </h4>
              <p className="text-[11px] text-[var(--text-muted)] mt-1 line-clamp-2">
                Save up to 50% by preserving tiles and replacing underlayment.
              </p>
            </Link>

            <Link
              href="/services/metal-roofing"
              className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-brand-blue/40 shadow-xs transition-all group"
            >
              <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] group-hover:text-brand-blue transition-colors">
                Standing Seam Metal
              </h4>
              <p className="text-[11px] text-[var(--text-muted)] mt-1 line-clamp-2">
                Class A wildfire rated, non-combustible lifetime metal roofs.
              </p>
            </Link>
          </div>
        </div>

        {/* Section 8: Final Call to Action Glass Hero */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="glass-card-hero rounded-3xl p-8 sm:p-10 lg:p-12 border border-slate-200/80 shadow-md text-center">
            <span className="glass-chip px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-brand-blue mb-4 inline-block">
              Complimentary Roof &amp; Decking Inspection
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--text-primary)] mb-4">
              Schedule Your Free Roof Inspection Today
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-2xl mx-auto mb-8 leading-relaxed">
              Wondering if your roof needs a complete tear-off or if underlying decking has dry rot? Contact Rise Up Roofing &amp; Construction for an honest, comprehensive evaluation and itemized proposal.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/contact">
                <span className="inline-flex items-center gap-2 bg-[#2E9BF0] hover:bg-[#1C88DD] text-white font-bold text-xs sm:text-sm uppercase tracking-wider px-6 py-3 rounded-xl shadow-md transition-all hover:brightness-110">
                  <Icon name="clipboard-check" className="w-4 h-4" />
                  <span>Request Free Estimate</span>
                </span>
              </Link>
              <a
                href={PHONE_HREF}
                className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs sm:text-sm uppercase tracking-wider px-6 py-3 rounded-xl border border-slate-200 shadow-sm transition-all"
              >
                <Icon name="phone" className="w-4 h-4 text-brand-blue" />
                <span>Call {PHONE_NUMBER}</span>
              </a>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-center gap-6 text-xs text-[var(--text-muted)]">
              <span>California Contractor Lic #{LICENSE_NUMBER}</span>
              <span>•</span>
              <span>Fully Bonded &amp; Insured</span>
              <span>•</span>
              <span>Owens Corning Preferred Contractor</span>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
