'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Home,
  Wrench,
  Building2,
  Sun,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Phone,
  Calculator,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { cn, PHONE_HREF, PHONE_NUMBER } from '@/lib/utils';
import { useTheme } from '@/lib/theme';

type ServiceId = 'residential' | 'repair' | 'commercial' | 'solar';
type SizeId = 'small' | 'medium' | 'large';

interface PricingTier {
  range: string;
  monthly: string;
}

const SERVICE_OPTIONS: {
  id: ServiceId;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  iconBgLight: string;
  iconBgDark: string;
  pricing: Record<SizeId, PricingTier>;
}[] = [
  {
    id: 'residential',
    label: 'Tile / Shingle Roof',
    shortLabel: 'Tile / Shingle',
    icon: Home,
    badge: 'Popular',
    iconBgLight: 'bg-sky-50 text-sky-600 border border-sky-100',
    iconBgDark: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
    pricing: {
      small: { range: '$7,500 – $11,000', monthly: '$189/mo' },
      medium: { range: '$11,500 – $18,000', monthly: '$299/mo' },
      large: { range: '$18,500 – $28,000+', monthly: '$449/mo' },
    },
  },
  {
    id: 'repair',
    label: 'Leak & Tile Repair',
    shortLabel: 'Leak & Repair',
    icon: Wrench,
    badge: 'Same-Day',
    iconBgLight: 'bg-amber-50 text-amber-600 border border-amber-100',
    iconBgDark: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    pricing: {
      small: { range: '$650 – $1,400', monthly: '$79/mo' },
      medium: { range: '$1,200 – $2,800', monthly: '$149/mo' },
      large: { range: '$2,500 – $4,800', monthly: '$219/mo' },
    },
  },
  {
    id: 'commercial',
    label: 'Commercial Flat Roof',
    shortLabel: 'Commercial Flat',
    icon: Building2,
    badge: 'TPO / BUR',
    iconBgLight: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    iconBgDark: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    pricing: {
      small: { range: '$9,000 – $15,000', monthly: '$349/mo' },
      medium: { range: '$16,000 – $26,000', monthly: '$499/mo' },
      large: { range: '$28,000 – $45,000+', monthly: '$799/mo' },
    },
  },
  {
    id: 'solar',
    label: 'Solar + Roofing',
    shortLabel: 'Solar + Roof',
    icon: Sun,
    badge: 'Save 30%',
    iconBgLight: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
    iconBgDark: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
    pricing: {
      small: { range: '$14,000 – $21,000', monthly: '$149/mo' },
      medium: { range: '$22,000 – $32,000', monthly: '$199/mo' },
      large: { range: '$34,000 – $48,000', monthly: '$299/mo' },
    },
  },
];

const ROOF_SIZES: { id: SizeId; label: string; sqft: string }[] = [
  { id: 'small', label: '< 2,000 sq ft', sqft: 'Small Home' },
  { id: 'medium', label: '2,000 – 3,500 sq ft', sqft: 'Avg Home' },
  { id: 'large', label: '3,500+ sq ft', sqft: 'Large Estate' },
];

const TRUST_BADGES = [
  {
    title: 'Licensed & Insured',
    subtitle: 'CA Lic #1096492',
    iconSrc: '/badges/cslb.webp',
  },
  {
    title: 'Owens Corning',
    subtitle: 'Preferred Contractor',
    iconSrc: '/badges/owens-corning.webp',
  },
  {
    title: 'A+ Rated Reliability',
    subtitle: '100% Itemized Pricing',
    iconSrc: '/badges/satisfaction.webp',
  },
  {
    title: 'San Diego Chamber',
    subtitle: '25+ Years Verified',
    iconSrc: '/badges/escondido-chamber.png',
  },
];

export function InteractiveHeroEstimator() {
  const [step, setStep] = useState<1 | 2>(1);
  const [service, setService] = useState<ServiceId>('residential');
  const [size, setSize] = useState<SizeId>('medium');
  const [contactData, setContactData] = useState({
    name: '',
    phone: '',
    address: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const selectedServiceObj = SERVICE_OPTIONS.find((s) => s.id === service) || SERVICE_OPTIONS[0];
  const currentPricing = selectedServiceObj.pricing[size];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactData.name || !contactData.phone) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  if (submitted) {
    return (
      <div
        className={cn(
          'rounded-3xl p-6 sm:p-8 w-full max-w-[920px] text-center animate-in fade-in zoom-in-95 duration-200 transition-all border backdrop-blur-xl',
          isLight
            ? 'bg-white/98 text-[#0B1E33] border-slate-100 shadow-[0_20px_50px_-12px_rgba(11,30,51,0.12)]'
            : 'bg-[#0B1B2B]/95 text-white border-white/15 shadow-2xl'
        )}
      >
        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-3 shadow-xs">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-0.5 rounded-full border border-emerald-200 inline-block mb-2">
          Estimate Confirmed
        </span>
        <h3 className={cn('text-xl sm:text-2xl font-bold mb-1.5', isLight ? 'text-[#0B1E33]' : 'text-white')}>
          Thank you, {contactData.name}!
        </h3>
        <p className={cn('text-xs sm:text-sm leading-relaxed mb-5 max-w-[540px] mx-auto', isLight ? 'text-[#5D7287]' : 'text-white/80')}>
          Your estimate request for <span className="font-bold text-brand-blue">{selectedServiceObj.label}</span> has been received. A licensed San Diego specialist will review your property satellite data and reach out within 15 minutes.
        </p>

        <div
          className={cn(
            'rounded-2xl p-4 mb-4 max-w-[500px] mx-auto text-left flex items-center justify-between border',
            isLight
              ? 'bg-slate-50/80 border-slate-200 text-[#0B1E33]'
              : 'bg-white/10 border-white/20 text-white'
          )}
        >
          <div>
            <p className={cn('text-[10px] uppercase font-bold tracking-wider', isLight ? 'text-[#64748B]' : 'text-white/60')}>
              Need Instant Assistance?
            </p>
            <a
              href={PHONE_HREF}
              className="inline-flex items-center gap-1.5 text-sm sm:text-base font-bold text-brand-blue hover:underline transition-all mt-0.5"
            >
              <Phone className="w-4 h-4" />
              <span>Call {PHONE_NUMBER}</span>
            </a>
          </div>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setStep(1);
            }}
            className="text-xs font-semibold text-brand-blue hover:underline cursor-pointer"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-3xl overflow-hidden w-full max-w-[920px] transition-all duration-300 backdrop-blur-xl border animate-hero-5 relative',
        isLight
          ? 'bg-white text-[#0B1E33] border-slate-100 shadow-[0_20px_50px_-12px_rgba(11,30,51,0.12)]'
          : 'bg-[#0B1B2B] text-white border-white/15 shadow-2xl'
      )}
    >
      {/* Main Interactive Container */}
      <div className="p-5 sm:p-7">
        {/* Header Bar */}
        <div
          className={cn(
            'flex items-center justify-between gap-3 mb-5 pb-4 border-b',
            isLight ? 'border-slate-100' : 'border-white/10'
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs flex-shrink-0',
                isLight
                  ? 'bg-blue-50 text-brand-blue border border-blue-100'
                  : 'bg-white/10 text-brand-blue border border-white/15'
              )}
            >
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className={cn('text-base sm:text-lg font-bold tracking-tight leading-tight', isLight ? 'text-[#0B1E33]' : 'text-white')}>
                Fast Project Estimate
              </h3>
              <p className={cn('text-xs mt-0.5 font-normal', isLight ? 'text-[#64748B]' : 'text-white/65')}>
                100% Free • Interactive Ballpark &amp; Itemized Proposal
              </p>
            </div>
          </div>

          {/* Step Pill */}
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold shadow-2xs',
              isLight
                ? 'bg-slate-50 text-[#475569] border-slate-200/80'
                : 'bg-white/10 text-white/90 border-white/15'
            )}
          >
            <span>Step {step} of 2</span>
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  'w-1.5 h-1.5 rounded-full transition-colors',
                  step >= 1 ? 'bg-brand-blue' : isLight ? 'bg-slate-300' : 'bg-white/30'
                )}
              />
              <div
                className={cn(
                  'w-1.5 h-1.5 rounded-full transition-colors',
                  step >= 2 ? 'bg-brand-blue' : isLight ? 'bg-slate-300' : 'bg-white/30'
                )}
              />
            </div>
          </div>
        </div>

        {/* STEP 1: SERVICE & SIZE WITH SOFT ESTIMATE */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* 1. Service Selector */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span
                  className={cn(
                    'text-xs font-bold uppercase tracking-wider',
                    isLight ? 'text-[#475569]' : 'text-white/70'
                  )}
                >
                  1. Select Roofing Service
                </span>
                <span className="text-xs text-brand-blue font-bold">
                  {selectedServiceObj.label}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                {SERVICE_OPTIONS.map((item) => {
                  const Icon = item.icon;
                  const isSelected = service === item.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setService(item.id)}
                      className={cn(
                        'flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-2xl cursor-pointer text-center group transition-all relative border',
                        isSelected
                          ? isLight
                            ? 'bg-sky-50/70 border-2 border-brand-blue text-[#0B1E33] shadow-xs'
                            : 'bg-brand-blue/20 border-2 border-brand-blue text-white shadow-sm'
                          : isLight
                          ? 'bg-white hover:bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 text-[#1E293B] shadow-2xs'
                          : 'bg-white/10 hover:bg-white/15 border-white/15 text-white'
                      )}
                    >
                      {/* Top Badge */}
                      <span
                        className={cn(
                          'absolute top-2 right-2 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md transition-colors',
                          isSelected
                            ? 'bg-brand-blue text-white'
                            : isLight
                            ? 'bg-slate-100 text-[#64748B]'
                            : 'bg-white/10 text-white/60'
                        )}
                      >
                        {item.badge}
                      </span>

                      {/* Icon Container */}
                      <div
                        className={cn(
                          'w-9 h-9 rounded-xl flex items-center justify-center transition-all mb-2 shadow-2xs',
                          isSelected
                            ? 'bg-brand-blue text-white'
                            : isLight
                            ? item.iconBgLight
                            : item.iconBgDark
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      <span className={cn('text-xs sm:text-[13px] font-bold leading-snug', isLight ? 'text-[#0B1E33]' : 'text-white')}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Property Size Selector */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span
                  className={cn(
                    'text-xs font-bold uppercase tracking-wider',
                    isLight ? 'text-[#475569]' : 'text-white/70'
                  )}
                >
                  2. Estimated Property Size
                </span>
                <span className={cn('text-xs font-medium', isLight ? 'text-[#64748B]' : 'text-white/65')}>
                  {selectedServiceObj.shortLabel}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {ROOF_SIZES.map((sz) => {
                  const isSelected = size === sz.id;
                  return (
                    <button
                      type="button"
                      key={sz.id}
                      onClick={() => setSize(sz.id)}
                      className={cn(
                        'py-2.5 px-3 rounded-xl text-center cursor-pointer transition-all border text-xs sm:text-sm',
                        isSelected
                          ? isLight
                            ? 'bg-brand-blue text-white border-brand-blue font-bold shadow-xs'
                            : 'bg-brand-blue text-white border-brand-blue font-bold shadow-xs'
                          : isLight
                          ? 'bg-white hover:bg-slate-50/80 border border-slate-200/80 text-[#334155] hover:text-[#0B1E33] shadow-2xs font-semibold'
                          : 'bg-white/10 hover:bg-white/15 border-white/15 text-white font-semibold'
                      )}
                    >
                      <span className="block leading-tight">{sz.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Soft, Seamless Architectural Estimate Console */}
            <div
              className={cn(
                'rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border transition-all',
                isLight
                  ? 'bg-slate-50/90 border-slate-200/80 text-[#0B1E33]'
                  : 'bg-white/5 border-white/15 text-white'
              )}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={cn(
                      'text-xs font-bold uppercase tracking-wider',
                      isLight ? 'text-[#64748B]' : 'text-white/70'
                    )}
                  >
                    Estimated Ballpark Range
                  </span>
                  <span
                    className={cn(
                      'text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border',
                      isLight
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                    )}
                  >
                    0% APR Available
                  </span>
                </div>

                <div className="flex items-baseline gap-2.5 mt-0.5">
                  <span className={cn('text-2xl sm:text-3xl font-extrabold tracking-tight', isLight ? 'text-[#0B1E33]' : 'text-white')}>
                    {currentPricing.range}
                  </span>
                  <span className={cn('text-xs sm:text-sm font-medium', isLight ? 'text-[#64748B]' : 'text-white/75')}>
                    (or as low as{' '}
                    <strong className={cn('font-bold', isLight ? 'text-amber-700' : 'text-amber-300')}>
                      {currentPricing.monthly}
                    </strong>
                    )
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="bg-brand-blue hover:bg-[#1C88DD] text-white font-bold text-xs sm:text-sm uppercase tracking-wider py-3.5 px-6 rounded-xl shadow-md shadow-brand-blue/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
              >
                <span>Get Itemized Quote</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: CONTACT & PROPOSAL DELIVERY */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-150">
            <div
              className={cn(
                'rounded-xl px-4 py-2.5 flex items-center justify-between border',
                isLight
                  ? 'bg-slate-50 border-slate-200 text-[#0B1E33]'
                  : 'bg-white/10 border-white/20 text-white'
              )}
            >
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <span className={cn('font-bold', isLight ? 'text-[#0B1E33]' : 'text-white')}>{selectedServiceObj.label}</span>
                <span className="opacity-40">•</span>
                <span className="text-brand-blue font-bold">{currentPricing.range}</span>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-bold text-brand-blue hover:underline transition-all cursor-pointer"
              >
                Edit Options
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  className={cn(
                    'text-xs font-bold uppercase tracking-wider mb-1.5 block',
                    isLight ? 'text-[#475569]' : 'text-white/70'
                  )}
                >
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Smith"
                  value={contactData.name}
                  onChange={(e) => setContactData({ ...contactData, name: e.target.value })}
                  className={cn(
                    'w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-brand-blue/20',
                    isLight
                      ? 'bg-slate-50/70 border-slate-200 text-[#0B1E33] placeholder:text-slate-400 focus:bg-white focus:border-brand-blue'
                      : 'bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-brand-blue'
                  )}
                />
              </div>

              <div>
                <label
                  className={cn(
                    'text-xs font-bold uppercase tracking-wider mb-1.5 block',
                    isLight ? 'text-[#475569]' : 'text-white/70'
                  )}
                >
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. (760) 000-0000"
                  value={contactData.phone}
                  onChange={(e) => setContactData({ ...contactData, phone: e.target.value })}
                  className={cn(
                    'w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-brand-blue/20',
                    isLight
                      ? 'bg-slate-50/70 border-slate-200 text-[#0B1E33] placeholder:text-slate-400 focus:bg-white focus:border-brand-blue'
                      : 'bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-brand-blue'
                  )}
                />
              </div>
            </div>

            <div>
              <label
                className={cn(
                  'text-xs font-bold uppercase tracking-wider mb-1.5 block',
                  isLight ? 'text-[#475569]' : 'text-white/70'
                )}
              >
                Property City / Address (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Carlsbad, Oceanside, or San Diego"
                value={contactData.address}
                onChange={(e) => setContactData({ ...contactData, address: e.target.value })}
                className={cn(
                  'w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-brand-blue/20',
                  isLight
                    ? 'bg-slate-50/70 border-slate-200 text-[#0B1E33] placeholder:text-slate-400 focus:bg-white focus:border-brand-blue'
                    : 'bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-brand-blue'
                )}
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={cn(
                  'p-3 rounded-xl border transition-colors flex items-center justify-center cursor-pointer',
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-[#0B1E33]'
                    : 'bg-white/10 hover:bg-white/20 border-white/15 text-white/80 hover:text-white'
                )}
                aria-label="Back to step 1"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-brand-blue hover:bg-[#1C88DD] text-white font-bold text-xs sm:text-sm uppercase tracking-wider py-3.5 px-6 rounded-xl shadow-md shadow-brand-blue/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              >
                <ShieldCheck className="w-4 h-4 text-white" />
                <span>{submitting ? 'Generating Proposal...' : 'Calculate My Proposal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Connected Trust Shelf at bottom */}
      <div
        className={cn(
          'border-t px-4 sm:px-7 py-3.5',
          isLight
            ? 'border-slate-100 bg-slate-50/60'
            : 'border-white/10 bg-white/[0.03]'
        )}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {TRUST_BADGES.map((item, idx) => (
            <div
              key={idx}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all',
                isLight
                  ? 'bg-white border-slate-200/70 shadow-2xs hover:border-slate-300'
                  : 'bg-white/[0.04] border-white/10 hover:border-white/20'
              )}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center p-0.5 bg-white border border-slate-100 shadow-2xs flex-shrink-0">
                <Image
                  src={item.iconSrc}
                  alt={item.title}
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4
                  className={cn(
                    'font-bold text-[11px] sm:text-xs leading-tight truncate',
                    isLight ? 'text-[#0B1E33]' : 'text-white'
                  )}
                >
                  {item.title}
                </h4>
                <p
                  className={cn(
                    'text-[9.5px] sm:text-[10px] font-medium leading-tight mt-0.5 truncate',
                    isLight ? 'text-[#64748B]' : 'text-white/65'
                  )}
                >
                  {item.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
