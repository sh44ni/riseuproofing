import type { Metadata } from 'next';
import { Section } from '@/components/shared/Container';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { buildMetadata } from '@/lib/seo/metadata';
import { COMPANY_NAME, LICENSE_NUMBER, PHONE_NUMBER, PHONE_HREF } from '@/lib/utils';
import Link from 'next/link';
import { Icon } from '@/components/shared/Icon';

export const metadata: Metadata = buildMetadata({
  title: 'Terms of Service | Rise Up Roofing & Construction',
  description: `Terms of Service and contractor agreements for ${COMPANY_NAME}. Serving San Diego County under California State License Board License #${LICENSE_NUMBER}.`,
  path: '/terms',
});

export default function TermsPage() {
  return (
    <Section alternate={false} className="pt-32 sm:pt-36 pb-20">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Terms of Service' }]} />

      <SectionHeading
        as="h1"
        label="Legal Agreement"
        title="Terms of Service"
        subtitle={`Effective Date: January 1, 2025 • Last Updated: September 2026. These Terms govern your use of the ${COMPANY_NAME} website, digital estimate tools, and contracted services.`}
      />

      <div className="max-w-4xl mx-auto space-y-8 text-slate-700">
        {/* Intro Highlight Box */}
        <div className="glass-card-hero rounded-2xl p-6 sm:p-8 border border-slate-200/80 bg-blue-50/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-brand-blue flex items-center justify-center flex-shrink-0">
              <Icon name="scale" className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Contractor Licensing &amp; Legal Entity</h2>
              <p className="text-xs text-slate-500">California State License Board (CSLB) #{LICENSE_NUMBER} • Class B &amp; C-39</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-slate-600">
            {COMPANY_NAME} (&ldquo;Company,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates this website and provides roofing, solar integration, exterior repair, and general construction contracting services across San Diego County, California. By accessing this website or requesting estimates, you agree to these Terms of Service.
          </p>
        </div>

        {/* Section 1 */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-200/80 space-y-3">
          <h2 className="text-xl font-bold text-slate-900">1. Acceptance of Terms</h2>
          <p className="text-sm leading-relaxed">
            By visiting our website, submitting an inquiry through our digital estimate forms, scheduling an on-site property inspection, or signing a proposal, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our website or digital services.
          </p>
        </div>

        {/* Section 2 */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-200/80 space-y-3">
          <h2 className="text-xl font-bold text-slate-900">2. Scope of Contracting Services</h2>
          <p className="text-sm leading-relaxed">
            {COMPANY_NAME} provides residential roofing replacements, tile roof underlayment relayment, leak diagnostics and repairs, commercial flat roofing (TPO, PVC, modified bitumen), seamless solar roofing integration, dry rot structural repair, siding, and general construction improvements throughout San Diego County. All work performed under contract complies with applicable California building codes and local municipal permitting standards.
          </p>
        </div>

        {/* Section 3 */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-200/80 space-y-3">
          <h2 className="text-xl font-bold text-slate-900">3. Estimates, Proposals &amp; Pricing Disclaimers</h2>
          <p className="text-sm leading-relaxed">
            Preliminary online estimates generated via website tools or calculators are strictly non-binding approximations based on homeowner-provided inputs and satellite property assessments. Formal, binding contracts are executed only after an in-person physical roof inspection by an authorized representative of {COMPANY_NAME}.
          </p>
          <p className="text-sm leading-relaxed">
            Written proposals detail the exact scope of work, specified materials, itemized pricing, payment schedules, and projected timelines. Proposals remain valid for thirty (30) calendar days from issuance unless otherwise noted in writing. Unforeseen structural damage, including concealed dry rot, termite damage, or deteriorated structural decking discovered upon removal of existing roofing materials, will be documented with photographs and addressed via written change order prior to additional work being performed.
          </p>
        </div>

        {/* Section 4 */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-200/80 space-y-3">
          <h2 className="text-xl font-bold text-slate-900">4. Warranties &amp; Manufacturer Guarantees</h2>
          <p className="text-sm leading-relaxed">
            As an Owens Corning Preferred Contractor, {COMPANY_NAME} offers non-prorated manufacturer warranty protection on qualifying complete roofing systems, covering material defects up to 50 years. In addition, {COMPANY_NAME} provides a dedicated contractor workmanship guarantee covering installation integrity as specified in individual client contracts.
          </p>
          <p className="text-sm leading-relaxed">
            Warranties do not cover damage resulting from catastrophic weather events (exceeding specified design wind speeds), acts of God, unauthorized roof alterations or third-party foot traffic, improper attic ventilation modifications made by others, or failure by the property owner to conduct routine drainage maintenance.
          </p>
        </div>

        {/* Section 5 */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-200/80 space-y-3">
          <h2 className="text-xl font-bold text-slate-900">5. Property Access, Safety &amp; Utilities</h2>
          <p className="text-sm leading-relaxed">
            The property owner agrees to grant our crews and project managers safe access to the premises, driveway, and perimeter work areas during agreed working hours. Homeowners are advised to secure pets, clear driveways of personal vehicles, and remove fragile interior wall hangings that may be affected by roof vibration during tear-off and loading operations.
          </p>
        </div>

        {/* Section 6 */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-200/80 space-y-3">
          <h2 className="text-xl font-bold text-slate-900">6. Limitation of Liability</h2>
          <p className="text-sm leading-relaxed">
            To the fullest extent permitted by applicable California law, {COMPANY_NAME} shall not be liable for indirect, incidental, special, consequential, or punitive damages arising out of website usage or reliance on digital content. Our total liability for any claims arising from contracted construction or roofing work is governed strictly by the written agreement executed between the parties and our active commercial general liability and workers&rsquo; compensation policies.
          </p>
        </div>

        {/* Section 7 */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-200/80 space-y-3">
          <h2 className="text-xl font-bold text-slate-900">7. Governing Law &amp; Dispute Resolution</h2>
          <p className="text-sm leading-relaxed">
            These Terms of Service, along with all contractor agreements, shall be construed in accordance with and governed by the laws of the State of California. Any disputes, claims, or controversies arising from these Terms or our services that cannot be resolved through good-faith negotiation shall be submitted to mediation or arbitration within San Diego County, California, in accordance with California Contractors State License Board arbitration procedures.
          </p>
        </div>

        {/* Section 8 */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-200/80 space-y-3">
          <h2 className="text-xl font-bold text-slate-900">8. Contact Information &amp; Official Inquiries</h2>
          <p className="text-sm leading-relaxed">
            For questions regarding these Terms of Service, contractor licensing verification, or written contract notices, please contact us:
          </p>
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <p className="font-bold text-slate-900">{COMPANY_NAME}</p>
              <p className="text-slate-600">2182 S El Camino Real</p>
              <p className="text-slate-600">Oceanside, CA 92054</p>
              <p className="text-slate-500 mt-1">CSLB Lic #{LICENSE_NUMBER}</p>
            </div>
            <div className="space-y-1">
              <p className="flex items-center gap-2">
                <Icon name="phone" className="w-3.5 h-3.5 text-brand-blue" />
                <a href={PHONE_HREF} className="font-bold text-brand-blue hover:underline">{PHONE_NUMBER}</a>
              </p>
              <p className="flex items-center gap-2">
                <Icon name="mail" className="w-3.5 h-3.5 text-brand-blue" />
                <a href="mailto:info@riseuproofing.com" className="font-bold text-brand-blue hover:underline">info@riseuproofing.com</a>
              </p>
              <p className="pt-1 text-slate-500">
                <Link href="/privacy" className="text-brand-blue hover:underline">View Privacy Policy</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
