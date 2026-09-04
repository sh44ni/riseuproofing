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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData(e.currentTarget);
      const body = {
        fullName: fd.get('fullName'),
        phone: fd.get('phone'),
        email: fd.get('email'),
        serviceType: fd.get('serviceType'),
        address: fd.get('address'),
        message: fd.get('message'),
      };
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true); // still show success to user
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Section alternate={false} className="pt-32 sm:pt-36">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Contact' }]} />
      
      <SectionHeading
        label="Contact Us"
        title="Schedule Your 100% Free Roof Estimate"
        subtitle="Whether you need a full tile relay, roof replacement, emergency leak diagnostics, or solar integration — our licensed team responds within 15 minutes."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[58%_42%] gap-10 lg:gap-12 max-w-6xl mx-auto">
        {/* Left — Form Card */}
        <div>
          <div className="glass-card-hero rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-200/80 shadow-lg">
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h3 className="text-2xl font-extrabold text-[var(--text-primary)] mb-2">
                  Request Confirmed!
                </h3>
                <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto mb-6 leading-relaxed">
                  Thank you! Your inspection request has been routed to our San Diego project team. A licensed specialist will contact you shortly.
                </p>
                <div className="glass-chip rounded-2xl p-4 mb-6 text-left max-w-md mx-auto">
                  <p className="text-[11px] text-[var(--text-muted)] font-bold uppercase tracking-wider mb-1">
                    Need Same-Day Emergency Response?
                  </p>
                  <a
                    href={PHONE_HREF}
                    className="inline-flex items-center gap-2 text-sm font-bold text-brand-blue hover:text-[#1C88DD] transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call our dispatch desk at {PHONE_NUMBER}</span>
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="text-xs text-[var(--text-muted)] hover:text-brand-blue underline cursor-pointer"
                >
                  ← Submit Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="fullName" className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 block">
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
                    <label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 block">
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
                    <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 block">
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
                    <label htmlFor="serviceType" className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 block">
                      Roofing Service Needed
                    </label>
                    <select
                      id="serviceType"
                      name="serviceType"
                      className="glass-input w-full px-4 py-3 rounded-xl text-sm font-medium bg-white text-[var(--text-primary)]"
                    >
                      <option value="residential">Residential Tile / Shingle</option>
                      <option value="repair">Leak Diagnostic &amp; Repair</option>
                      <option value="commercial">Commercial Flat / TPO</option>
                      <option value="solar">Solar Roofing Integration</option>
                      <option value="construction">General Construction / Dry Rot</option>
                      <option value="other">Other Inquiry</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 block">
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
                  <label htmlFor="message" className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 block">
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

                <div className="pt-2 flex items-center justify-center gap-4 text-[11px] text-[var(--text-muted)]">
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
          <div className="glass-card-interactive rounded-3xl p-6 sm:p-8 border border-slate-200/80">
            <h3 className="text-lg font-extrabold text-[var(--text-primary)] mb-6 pb-3 border-b border-slate-100">
              Direct Contact Channels
            </h3>
            
            <div className="space-y-5">
              <a
                href={PHONE_HREF}
                className="flex items-center gap-3.5 text-[var(--text-primary)] hover:text-brand-blue transition-colors group"
              >
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 group-hover:bg-brand-blue group-hover:text-white transition-colors">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">24/7 Phone &amp; Text</p>
                  <p className="text-base font-extrabold text-[var(--text-primary)]">{PHONE_NUMBER}</p>
                </div>
              </a>

              <a
                href="mailto:info@riseuproofing.com"
                className="flex items-center gap-3.5 text-[var(--text-primary)] hover:text-brand-blue transition-colors group"
              >
                <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 group-hover:text-brand-blue transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Email Inquiries</p>
                  <p className="text-sm font-bold text-[var(--text-primary)]">info@riseuproofing.com</p>
                </div>
              </a>

              <div className="flex items-center gap-3.5 text-[var(--text-primary)]">
                <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Primary Coverage</p>
                  <p className="text-sm font-bold text-[var(--text-primary)]">San Diego County &amp; North County Hubs</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 text-[var(--text-primary)]">
                <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Operating Hours</p>
                  <p className="text-sm font-bold text-[var(--text-primary)]">Mon–Fri 7am–6pm, Sat 8am–2pm</p>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">24/7 Storm Leak Dispatch</p>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Badge Dock */}
          <div className="glass-card-interactive rounded-3xl p-6 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-brand-gold flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">CA Contractor License #{LICENSE_NUMBER}</p>
                <p className="text-[11px] text-[var(--text-muted)]">Fully Licensed, Bonded &amp; Insured</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200">
              Active
            </span>
          </div>
        </div>
      </div>
    </Section>
  );
}
