'use client';

import { useState } from 'react';
import { Phone, Mail, MapPin, Clock, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { Section } from '@/components/shared/Container';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { PHONE_HREF, PHONE_NUMBER, LICENSE_NUMBER } from '@/lib/utils';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <Section dark={true} alternate={false} className="pt-32 sm:pt-36">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Contact' }]} />
      
      <SectionHeading
        label="Contact Us"
        title="Schedule Your 100% Free Roof Estimate"
        subtitle="Whether you need a full tile relay, roof replacement, emergency leak diagnostics, or solar integration — our licensed team responds within 15 minutes."
        dark={true}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[58%_42%] gap-10 lg:gap-12 max-w-6xl mx-auto">
        {/* Left — Glass Form */}
        <div>
          <div className="glass-card-hero rounded-3xl p-6 sm:p-8 md:p-10 border-white/20 shadow-2xl">
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h3 className="text-2xl font-extrabold text-white mb-2">
                  Request Confirmed!
                </h3>
                <p className="text-sm text-white/80 max-w-md mx-auto mb-6 leading-relaxed">
                  Thank you! Your inspection request has been routed to our San Diego project team. A licensed specialist will contact you shortly.
                </p>
                <div className="glass-chip rounded-2xl p-4 mb-6 text-left max-w-md mx-auto">
                  <p className="text-[11px] text-white/60 font-bold uppercase tracking-wider mb-1">
                    Need Same-Day Emergency Response?
                  </p>
                  <a
                    href={PHONE_HREF}
                    className="inline-flex items-center gap-2 text-sm font-bold text-brand-blue hover:text-white transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call our dispatch desk at {PHONE_NUMBER}</span>
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="text-xs text-white/60 hover:text-white underline cursor-pointer"
                >
                  ← Submit Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="fullName" className="text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5 block">
                      Full Name *
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      placeholder="e.g. Sarah Jenkins"
                      className="glass-input w-full px-4 py-3 rounded-xl text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5 block">
                      Phone Number *
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      placeholder="(760) 000-0000"
                      className="glass-input w-full px-4 py-3 rounded-xl text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5 block">
                      Email Address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@domain.com"
                      className="glass-input w-full px-4 py-3 rounded-xl text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label htmlFor="serviceType" className="text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5 block">
                      Roofing Service Needed
                    </label>
                    <select
                      id="serviceType"
                      name="serviceType"
                      className="glass-input w-full px-4 py-3 rounded-xl text-sm font-medium bg-[#0B1B2B]"
                    >
                      <option value="residential" className="bg-[#0B1B2B] text-white">Residential Tile / Shingle</option>
                      <option value="repair" className="bg-[#0B1B2B] text-white">Leak Diagnostic &amp; Repair</option>
                      <option value="commercial" className="bg-[#0B1B2B] text-white">Commercial Flat / TPO</option>
                      <option value="solar" className="bg-[#0B1B2B] text-white">Solar Roofing Integration</option>
                      <option value="construction" className="bg-[#0B1B2B] text-white">General Construction / Dry Rot</option>
                      <option value="other" className="bg-[#0B1B2B] text-white">Other Inquiry</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className="text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5 block">
                    Property Address or City
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    placeholder="e.g. 1234 Coast Hwy, Oceanside, CA"
                    className="glass-input w-full px-4 py-3 rounded-xl text-sm font-medium"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5 block">
                    Project Details or Specific Concerns
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={3}
                    placeholder="Describe leak location, roof age, or project goals..."
                    className="glass-input w-full px-4 py-3 rounded-xl text-sm font-medium resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#2E9BF0] hover:bg-[#1C88DD] text-white font-bold text-xs uppercase tracking-wider py-4 px-8 rounded-xl shadow-xl shadow-brand-blue/30 transition-all flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 disabled:opacity-75"
                >
                  <span>{submitting ? 'Submitting Request...' : 'Send Free Estimate Request'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="pt-2 flex items-center justify-center gap-4 text-[11px] text-white/60">
                  <span>✓ 100% Itemized Proposal</span>
                  <span>•</span>
                  <span>✓ No Obligation</span>
                  <span>•</span>
                  <span>✓ Licensed &amp; Bonded</span>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right — Contact Cards */}
        <div className="space-y-6">
          <div className="glass-card-interactive rounded-3xl p-6 sm:p-8 border-white/15">
            <h3 className="text-lg font-extrabold text-white mb-6 pb-3 border-b border-white/10">
              Direct Contact Channels
            </h3>
            
            <div className="space-y-5">
              <a
                href={PHONE_HREF}
                className="flex items-center gap-3.5 text-white hover:text-brand-blue transition-colors group"
              >
                <div className="w-11 h-11 rounded-xl bg-brand-blue/20 text-brand-blue flex items-center justify-center flex-shrink-0 group-hover:bg-brand-blue group-hover:text-white transition-colors">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">24/7 Phone &amp; Text</p>
                  <p className="text-base font-extrabold text-white">{PHONE_NUMBER}</p>
                </div>
              </a>

              <a
                href="mailto:info@riseuproofing.com"
                className="flex items-center gap-3.5 text-white hover:text-brand-blue transition-colors group"
              >
                <div className="w-11 h-11 rounded-xl bg-white/10 text-white/80 flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">Email Inquiries</p>
                  <p className="text-sm font-bold text-white">info@riseuproofing.com</p>
                </div>
              </a>

              <div className="flex items-center gap-3.5 text-white">
                <div className="w-11 h-11 rounded-xl bg-white/10 text-white/80 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">Primary Coverage</p>
                  <p className="text-sm font-bold text-white">San Diego County &amp; North County Hubs</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 text-white">
                <div className="w-11 h-11 rounded-xl bg-white/10 text-white/80 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">Operating Hours</p>
                  <p className="text-sm font-bold text-white">Mon–Fri 7am–6pm, Sat 8am–2pm</p>
                  <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">24/7 Storm Leak Dispatch</p>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Badge Dock */}
          <div className="glass-card-interactive rounded-3xl p-6 border-white/15 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-brand-gold flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">CA Contractor License #{LICENSE_NUMBER}</p>
                <p className="text-[11px] text-white/60">Fully Licensed, Bonded &amp; Insured</p>
              </div>
            </div>
            <span className="glass-chip px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">
              Active
            </span>
          </div>
        </div>
      </div>
    </Section>
  );
}
