import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/components/shared/Icon';
import {
  buildMetadata,
  buildFAQJsonLd,
  buildLocalBusinessJsonLd,
} from '@/lib/seo/metadata';
import { Section, Container } from '@/components/shared/Container';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { FAQAccordion } from '@/components/shared/FAQAccordion';
import { FinancingCalculator } from '@/components/marketing/FinancingCalculator';
import { ContactForm } from '@/components/marketing/ContactForm';
import { COMPANY_NAME, LICENSE_NUMBER, PHONE_HREF, PHONE_NUMBER } from '@/lib/utils';

export const metadata: Metadata = buildMetadata({
  title: 'Roof Financing San Diego | 0% APR & $0 Down Payment Plans',
  description:
    'Affordable roof financing in San Diego County. 0% APR for 12 months, $0 down payment plans, low monthly rates, and PACE clean energy financing. Instant approvals.',
  path: '/roof-financing-san-diego',
});

const FINANCING_FAQS = [
  {
    question: 'How does roof financing in San Diego work with Rise Up?',
    answer:
      'Rise Up Roofing & Construction partners with top-rated home improvement lenders to provide zero-down, flexible roof financing for San Diego homeowners. You submit a quick 60-second online pre-qualification that performs a soft credit pull—meaning zero impact to your credit score. Once approved, you select the repayment term that fits your monthly budget (including 12 months 0% APR Same-As-Cash or fixed terms up to 120 months), and we schedule your roof installation immediately.',
  },
  {
    question: 'Can I get roof financing in San Diego with zero down payment?',
    answer:
      'Yes! 100% of our residential roofing and solar projects qualify for $0 down payment financing upon approved credit. You do not have to pay anything out of pocket upfront before your roof replacement begins.',
  },
  {
    question: 'Will applying for roof financing hurt my credit score?',
    answer:
      'No. The initial pre-qualification step utilizes a soft credit inquiry that allows you to review terms, monthly payments, and interest rates without lowering your credit score. A standard hard inquiry only occurs once you officially accept and execute loan documents.',
  },
  {
    question: 'What credit score is needed for roof replacement loans in California?',
    answer:
      'We offer financing programs accommodating a broad spectrum of credit profiles. Prime programs (such as 0% APR for 12 months) typically require a credit score of 640 or higher. However, we also offer secondary lending partnerships and California PACE (Property Assessed Clean Energy) programs that evaluate home equity rather than personal credit scores.',
  },
  {
    question: 'Are there any prepayment penalties if I pay off my loan early?',
    answer:
      'None of our financing programs feature prepayment penalties. If you choose a 5-year or 10-year term and decide to pay it off in full after 6 months or 2 years, you only pay interest accrued to that date, saving thousands in future finance charges.',
  },
  {
    question: 'Can I finance both my new roof and solar panels or battery storage together?',
    answer:
      'Yes. As a licensed Class B general contractor and C-39 roofing company, Rise Up can package your complete roofing system, solar photovoltaic array, and battery backup storage into a single unified financing plan. In many cases, your monthly solar electrical bill savings offset a substantial portion of the financing payment.',
  },
];

const FINANCING_OPTIONS = [
  {
    badge: 'Zero Interest',
    title: '0% APR Same-As-Cash',
    term: '12 to 18 Months',
    apr: '0% Interest',
    description:
      'Ideal for homeowners who want to keep cash in their investment accounts or are awaiting home equity proceeds, insurance claim checks, or annual bonuses. Pay zero interest if paid in full within the promo term.',
    features: [
      '$0 down payment required at signing',
      'No interest charges if balance is cleared within term',
      'Manageable monthly payments during promo period',
      'Instant electronic pre-qualification in under 60 seconds',
    ],
  },
  {
    badge: 'Budget Friendly',
    title: 'Low Fixed Monthly Payments',
    term: '5 to 12 Years (60–144 Mo)',
    apr: 'Rates from 6.99% Fixed',
    description:
      'Spread your roof investment over predictable fixed monthly payments designed to seamlessly fit into your regular household budget. Enjoy low fixed APRs that never increase.',
    features: [
      'Low monthly payments starting from under $149/mo',
      'Fixed interest rates and fixed equal monthly payments',
      'Zero prepayment penalties — pay down early anytime',
      'Loans available up to $75,000 for large tile or solar projects',
    ],
  },
  {
    badge: 'Equity-Based',
    title: 'California PACE Financing',
    term: '10 to 25 Years',
    apr: 'Fixed Assessment',
    description:
      'California Property Assessed Clean Energy (PACE) financing allows homeowners to finance Title 24 cool roofs and solar arrays through their annual San Diego County property tax bill based on home equity.',
    features: [
      'Approval based on home equity and tax history, not FICO',
      'Repaid conveniently alongside your regular property taxes',
      'Interest may qualify for federal tax deductions (consult CPA)',
      'Financing stays with the property if you sell in the future',
    ],
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Free On-Site Inspection & Estimate',
    desc: 'Our certified roofing specialist conducts a comprehensive physical inspection and provides an exact, transparent project proposal.',
  },
  {
    step: '02',
    title: '60-Second Soft Credit Check',
    desc: 'Apply online or via smartphone. A soft credit inquiry displays customized loan offers with zero impact on your credit score.',
  },
  {
    step: '03',
    title: 'Choose Your Payment Schedule',
    desc: 'Select the program that suits you best: 0% interest same-as-cash or low monthly payments tailored to your financial goals.',
  },
  {
    step: '04',
    title: 'Flawless Installation & Warranty',
    desc: 'Our master craftsmen install your new roof system to California Title 24 standards, backed by our lifetime warranty.',
  },
];

export default function RoofFinancingSanDiegoPage() {
  const faqJsonLd = buildFAQJsonLd(FINANCING_FAQS);
  const localBusinessJsonLd = buildLocalBusinessJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a192f]/90 via-[#0d213a]/80 to-slate-900/95 pointer-events-none" />
        <div
          className="absolute inset-0 opacity-15 mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, #0099FF 0%, transparent 60%), radial-gradient(circle at 80% 70%, #F59E0B 0%, transparent 50%)',
          }}
        />

        <Container className="relative z-10">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Services', href: '/services' },
              { label: 'Roof Financing San Diego', href: '/roof-financing-san-diego' },
            ]}
          />

          <div className="max-w-4xl mt-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-brand-gold/20 text-brand-gold border border-brand-gold/30 mb-6">
              <Icon name="badge-percent" className="w-4 h-4" />
              <span>0% APR & $0 Down Payment Financing Available</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              Affordable <span className="text-brand-blue">Roof Financing</span> in San Diego
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-300 leading-relaxed max-w-3xl">
              Don’t let upfront replacement costs delay essential home protection. Protect your family, enhance energy efficiency, and replace your roof today with custom zero-down financing plans designed for San Diego homeowners.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#calculator"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-brand-blue hover:bg-[#1C88DD] text-white font-bold text-base shadow-lg transition-all"
              >
                <span>Calculate Monthly Payment</span>
                <Icon name="calculator" className="w-5 h-5" />
              </a>
              <a
                href={PHONE_HREF}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 font-bold text-base transition-all"
              >
                <Icon name="phone" className="w-4 h-4 text-brand-gold" />
                <span>Call {PHONE_NUMBER}</span>
              </a>
            </div>

            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-800 text-xs text-slate-300 font-medium">
              <div className="flex items-center gap-2">
                <Icon name="check-circle" className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>$0 Down Available</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="check-circle" className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>12 Mo 0% APR Same-As-Cash</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="check-circle" className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>No Credit Score Impact Check</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="check-circle" className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>CSLB #{LICENSE_NUMBER}</span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Interactive Calculator Section */}
      <Section id="calculator" className="bg-slate-50 py-16 md:py-24">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-12">
            <span className="text-xs font-extrabold uppercase tracking-widest text-brand-blue">
              Plan Your Investment
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">
              Calculate Your Estimated Monthly Roof Payment
            </h2>
            <p className="text-slate-600 mt-3 text-base">
              Use our interactive estimator to test different loan sizes and terms. We offer transparent pricing with zero prepayment penalties across all programs.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <FinancingCalculator />
          </div>
        </Container>
      </Section>

      {/* Available Loan Options Section */}
      <Section className="py-16 md:py-24 bg-white">
        <Container>
          <SectionHeading
            label="Tailored Solutions"
            title="San Diego Roof Financing Programs"
            subtitle="Whether you need short-term interest-free flexibility or multi-year budget stability, we offer programs for every situation."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {FINANCING_OPTIONS.map((opt) => (
              <div
                key={opt.title}
                className="bg-slate-50 rounded-3xl p-8 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-blue-100 text-brand-blue">
                      {opt.badge}
                    </span>
                    <span className="text-xs font-bold text-slate-500">{opt.term}</span>
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 mb-1">{opt.title}</h3>
                  <div className="text-lg font-bold text-brand-blue mb-4">{opt.apr}</div>

                  <p className="text-sm text-slate-600 leading-relaxed mb-6">
                    {opt.description}
                  </p>

                  <ul className="space-y-3 mb-8">
                    {opt.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs font-medium text-slate-700">
                        <Icon name="check-circle" className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <a
                  href="#pre-qualify"
                  className="w-full text-center py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-colors"
                >
                  Apply For This Plan
                </a>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* 4-Step How It Works Section */}
      <Section className="py-16 md:py-24 bg-slate-900 text-white">
        <Container>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-extrabold uppercase tracking-widest text-brand-gold">
              Streamlined Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-2">
              How Roof Financing Works With Rise Up
            </h2>
            <p className="text-slate-300 mt-3 text-base">
              From free inspection to loan approval and clean installation in 4 straightforward steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s) => (
              <div
                key={s.step}
                className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 relative overflow-hidden"
              >
                <div className="text-3xl font-black text-brand-blue/30 font-mono mb-3">
                  {s.step}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* FAQs Section */}
      <Section className="py-16 md:py-24 bg-slate-50">
        <Container>
          <SectionHeading
            label="Frequently Asked Questions"
            title="Everything You Need to Know About San Diego Roof Financing"
            subtitle="Transparent answers to the most common questions regarding credit checks, rates, and approval."
          />

          <div className="max-w-3xl mx-auto mt-12">
            <FAQAccordion items={FINANCING_FAQS} />
          </div>
        </Container>
      </Section>

      {/* Pre-Qualify Contact Form Section */}
      <Section id="pre-qualify" className="py-16 md:py-24 bg-white">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-black uppercase tracking-widest text-brand-blue">
                Instant Pre-Approval
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Request Your Free Roof Inspection & Financing Pre-Approval
              </h2>
              <p className="text-slate-600 text-base leading-relaxed">
                Connect with our local San Diego project team. We provide a comprehensive, complimentary roof health assessment and assist you in securing the best low-rate financing program for your property.
              </p>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-50 text-brand-blue">
                    <Icon name="shield-check" className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Zero Obligation & Zero Pressure</h4>
                    <p className="text-xs text-slate-500">Quotes are 100% free and valid for 30 days.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-50 text-brand-blue">
                    <Icon name="clock" className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Rapid 24-Hour Scheduling</h4>
                    <p className="text-xs text-slate-500">Same-day and next-day inspection slots across San Diego County.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <p className="text-xs text-slate-400">
                  Prefer speaking with a financing coordinator? Call us directly at{' '}
                  <a href={PHONE_HREF} className="font-bold text-brand-blue hover:underline">
                    {PHONE_NUMBER}
                  </a>
                  .
                </p>
              </div>
            </div>

            <div className="lg:col-span-6">
              <ContactForm />
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
