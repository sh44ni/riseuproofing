'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Icon } from '@/components/shared/Icon';
import { PHONE_HREF, PHONE_NUMBER } from '@/lib/utils';
import { calculateFinancing, type FinancingPlan, type FinancingSettings } from '@/lib/financing';

// Fallback initial values matching seed verbatim for zero-flicker SSR
const INITIAL_PLANS: FinancingPlan[] = [
  {
    id: 1,
    name: '0% APR Same-As-Cash',
    termMonths: 12,
    apr: 0,
    minDownPaymentPct: 0,
    isDefault: true,
    isActive: true,
    sortOrder: 1,
    badgeLabel: 'Most Popular',
    description: '12 Months zero interest with regular monthly payments. Pay off in 1 year with $0 interest.',
  },
  {
    id: 2,
    name: 'Standard Fixed 5-Year',
    termMonths: 60,
    apr: 7.99,
    minDownPaymentPct: 0,
    isDefault: false,
    isActive: true,
    sortOrder: 2,
    badgeLabel: 'Balanced Rate',
    description: 'Budget-friendly predictable fixed payments over 5 years. No early payoff penalty.',
  },
  {
    id: 3,
    name: 'Lowest Payment 10-Year',
    termMonths: 120,
    apr: 9.99,
    minDownPaymentPct: 0,
    isDefault: false,
    isActive: true,
    sortOrder: 3,
    badgeLabel: 'Lowest Monthly',
    description: 'Long-term financing to keep your monthly overhead as low as possible.',
  },
];

const INITIAL_SETTINGS: FinancingSettings = {
  minProjectCost: 5000,
  maxProjectCost: 50000,
  defaultProjectCost: 16500,
  creditCheckCopyFlag: true,
};

/**
 * High-performance smooth numeric tween hook for scroll-stopping live prices
 */
function useAnimatedNumber(target: number, duration = 280): number {
  const [current, setCurrent] = useState(target);
  const targetRef = useRef(target);
  targetRef.current = target;

  useEffect(() => {
    let start = current;
    let startTime: number | null = null;
    let animFrame: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease-out
      const ease = 1 - Math.pow(1 - progress, 3);
      const nextVal = Math.round(start + (targetRef.current - start) * ease);
      setCurrent(nextVal);

      if (progress < 1) {
        animFrame = requestAnimationFrame(step);
      }
    };

    animFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animFrame);
  }, [target, duration]);

  return current;
}

export function FinancingCalculator() {
  const [plans, setPlans] = useState<FinancingPlan[]>(INITIAL_PLANS);
  const [settings, setSettings] = useState<FinancingSettings>(INITIAL_SETTINGS);
  const [amount, setAmount] = useState<number>(16500);
  const [downPayment, setDownPayment] = useState<number>(0);
  const [selectedPlanId, setSelectedPlanId] = useState<number>(1);
  const [isHighlightPulsing, setIsHighlightPulsing] = useState<boolean>(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Hydrate with latest dynamic config from DB (cached with ISR)
  useEffect(() => {
    fetch('/api/financing/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.plans) && data.plans.length > 0) {
          setPlans(data.plans);
          if (data.settings) setSettings(data.settings);
          if (data.defaultPlan) {
            setSelectedPlanId(data.defaultPlan.id);
          }
          if (data.settings?.defaultProjectCost) {
            setAmount(data.settings.defaultProjectCost);
          }
        }
      })
      .catch(() => {
        // Fallback already pre-hydrated
      });
  }, []);

  const selectedPlan = useMemo(() => {
    return plans.find((p) => p.id === selectedPlanId) || plans[0] || INITIAL_PLANS[0];
  }, [plans, selectedPlanId]);

  // Instant zero-lag calculation
  const calculationResult = useMemo(() => {
    return calculateFinancing(
      {
        name: selectedPlan.name,
        apr: selectedPlan.apr,
        termMonths: selectedPlan.termMonths,
      },
      amount,
      downPayment
    );
  }, [selectedPlan, amount, downPayment]);

  // Animated numbers for scroll-stopping UX
  const animatedMonthly = useAnimatedNumber(calculationResult.monthlyPayment);
  const animatedInterest = useAnimatedNumber(calculationResult.totalInterest);

  // Trigger pulse on change
  const triggerPulse = useCallback(() => {
    setIsHighlightPulsing(true);
    const t = setTimeout(() => setIsHighlightPulsing(false), 300);
    return () => clearTimeout(t);
  }, []);

  // Debounced server sync & telemetry
  const syncWithServer = useCallback((pId: number, currentAmount: number, currentDown: number) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      fetch('/api/financing/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: pId,
          projectCost: currentAmount,
          downPayment: currentDown,
        }),
      }).catch(() => {});
    }, 250);
  }, []);

  const handleAmountChange = (newAmount: number) => {
    const clamped = Math.min(Math.max(newAmount, settings.minProjectCost), settings.maxProjectCost);
    setAmount(clamped);
    if (downPayment > clamped) setDownPayment(clamped);
    triggerPulse();
    syncWithServer(selectedPlan.id, clamped, Math.min(downPayment, clamped));
  };

  const handleDownPaymentChange = (newDown: number) => {
    const clamped = Math.min(Math.max(newDown, 0), amount);
    setDownPayment(clamped);
    triggerPulse();
    syncWithServer(selectedPlan.id, amount, clamped);
  };

  const handlePlanSelect = (pId: number) => {
    setSelectedPlanId(pId);
    triggerPulse();
    syncWithServer(pId, amount, downPayment);
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden transition-all">
      {/* Header Bar — Preserved styling & copy */}
      <div className="bg-gradient-to-r from-slate-900 via-[#122b44] to-brand-navy p-6 md:p-8 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-gold/20 text-brand-gold border border-brand-gold/30 mb-2">
              <Icon name="calculator" className="w-3.5 h-3.5" />
              Interactive Estimator
            </span>
            <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              San Diego Roof Financing Calculator
            </h3>
            <p className="text-slate-300 text-sm mt-1">
              Estimate your monthly investment with $0 down payment options.
            </p>
          </div>
          <div
            className={`text-right transition-all duration-300 p-2 rounded-2xl ${
              isHighlightPulsing ? 'scale-105 bg-white/10' : ''
            }`}
          >
            <span className="text-xs text-slate-400 block">Estimated Starting Payment</span>
            <span className="text-3xl md:text-4xl font-black text-brand-gold font-mono">
              ${animatedMonthly.toLocaleString()}
              <span className="text-sm font-medium text-slate-300">/mo</span>
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-8">
        {/* Loan Amount Slider + Direct Numeric Input */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label htmlFor="roof-loan-slider" className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Estimated Project Budget
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-400">$</span>
              <input
                type="number"
                inputMode="numeric"
                step="250"
                min={settings.minProjectCost}
                max={settings.maxProjectCost}
                value={amount}
                onChange={(e) => handleAmountChange(parseInt(e.target.value, 10) || settings.minProjectCost)}
                className="w-32 text-right font-mono font-black text-xl text-brand-blue border-b-2 border-brand-blue/40 focus:border-brand-blue focus:outline-none bg-transparent"
                aria-label="Direct project cost input"
              />
            </div>
          </div>
          <input
            id="roof-loan-slider"
            type="range"
            min={settings.minProjectCost}
            max={settings.maxProjectCost}
            step={500}
            value={amount}
            onChange={(e) => handleAmountChange(Number(e.target.value))}
            className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-blue focus:outline-none touch-pan-y"
            style={{ minHeight: '44px' }}
            aria-label="Roof financing budget slider"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-2 font-mono">
            <span>${settings.minProjectCost.toLocaleString()} (Small Repair)</span>
            <span>${Math.round((settings.minProjectCost + settings.maxProjectCost) / 2).toLocaleString()} (Avg Re-Roof)</span>
            <span>${settings.maxProjectCost.toLocaleString()} (Large Tile / Solar)</span>
          </div>
        </div>

        {/* Plan Selector — Rendered if 2+ plans exist; skipped if only 1 active plan exists */}
        {plans.length > 1 && (
          <div>
            <label className="text-sm font-bold text-slate-800 uppercase tracking-wide block mb-3">
              Select Financing Program
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {plans.map((plan) => {
                const isSelected = selectedPlan.id === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => handlePlanSelect(plan.id)}
                    className={`relative text-left p-4 rounded-2xl border-2 transition-all cursor-pointer active:scale-95 duration-150 ${
                      isSelected
                        ? 'border-brand-blue bg-blue-50/50 shadow-md ring-2 ring-brand-blue/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    {plan.badgeLabel && (
                      <span
                        className={`inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md mb-2 ${
                          isSelected ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {plan.badgeLabel}
                      </span>
                    )}
                    <div className="font-bold text-slate-900 text-sm leading-snug">{plan.name}</div>
                    <div className="text-xs text-slate-500 mt-1 font-medium">
                      {plan.apr === 0 ? '0% APR Fixed' : `${plan.apr}% APR Fixed`} • {plan.termMonths} Mo
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Optional Down Payment Input */}
        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Optional Down Payment
            </span>
            <span className="text-[11px] text-slate-500">
              $0 Down available on approved credit for all residential projects.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleDownPaymentChange(0)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                downPayment === 0
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              $0 Down (Default)
            </button>
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-400">$</span>
              <input
                type="number"
                inputMode="numeric"
                step="500"
                min="0"
                max={amount}
                value={downPayment}
                onChange={(e) => handleDownPaymentChange(parseInt(e.target.value, 10) || 0)}
                className="w-20 text-right font-mono font-bold text-xs text-slate-800 focus:outline-none"
                aria-label="Custom down payment amount"
              />
            </div>
          </div>
        </div>

        {/* Financial Breakdown Summary Cards — Preserved layout with animated values */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 uppercase font-bold block">Down Payment</span>
            <span className="text-base font-bold text-emerald-600 font-mono">
              {downPayment === 0 ? '$0 Down' : `$${downPayment.toLocaleString()}`}
            </span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 uppercase font-bold block">Term Length</span>
            <span className="text-base font-bold text-slate-800 font-mono">{selectedPlan.termMonths} Months</span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 uppercase font-bold block">Est. Total Interest</span>
            <span className="text-base font-bold text-slate-800 font-mono">
              ${animatedInterest.toLocaleString()}
            </span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 uppercase font-bold block">Prepayment Penalty</span>
            <span className="text-base font-bold text-emerald-600 font-mono">$0 Penalty</span>
          </div>
        </div>

        {/* Call to Action & Trust Indicators — 100% untouched non-negotiable copy */}
        <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 text-brand-blue rounded-xl shrink-0 mt-0.5">
              <Icon name="shield-check" className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                {settings.creditCheckCopyFlag ? 'Soft Credit Pre-Qualification' : 'Instant Pre-Qualification'}
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                {settings.creditCheckCopyFlag
                  ? 'Checking your eligibility does not impact your credit score. Approvals in under 60 seconds.'
                  : 'Fast and secure application with transparent terms. Approvals in under 60 seconds.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <a
              href="#pre-qualify"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-blue hover:bg-[#1C88DD] text-white font-bold text-sm shadow-md transition-all text-center active:scale-95 cursor-pointer"
            >
              <span>Apply in 60s</span>
              <Icon name="arrow-right" className="w-4 h-4" />
            </a>
            <a
              href={PHONE_HREF}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-white text-sm font-bold transition-all active:scale-95 cursor-pointer"
            >
              <Icon name="phone" className="w-4 h-4 text-brand-blue" />
              <span>{PHONE_NUMBER}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
