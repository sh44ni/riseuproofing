'use client';

import React, { useState, useMemo } from 'react';
import { Icon } from '@/components/shared/Icon';
import { PHONE_HREF, PHONE_NUMBER } from '@/lib/utils';

interface FinancingPlan {
  id: string;
  name: string;
  termMonths: number;
  apr: number;
  badge: string;
  description: string;
}

const FINANCING_PLANS: FinancingPlan[] = [
  {
    id: 'same-as-cash-12',
    name: '0% APR Same-As-Cash',
    termMonths: 12,
    apr: 0,
    badge: 'Most Popular',
    description: '12 Months zero interest with regular monthly payments. Pay off in 1 year with $0 interest.',
  },
  {
    id: 'fixed-60',
    name: 'Standard Fixed 5-Year',
    termMonths: 60,
    apr: 7.99,
    badge: 'Balanced Rate',
    description: 'Budget-friendly predictable fixed payments over 5 years. No early payoff penalty.',
  },
  {
    id: 'fixed-120',
    name: 'Lowest Payment 10-Year',
    termMonths: 120,
    apr: 9.99,
    badge: 'Lowest Monthly',
    description: 'Long-term financing to keep your monthly overhead as low as possible.',
  },
];

export function FinancingCalculator() {
  const [amount, setAmount] = useState<number>(16500);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('same-as-cash-12');

  const selectedPlan = useMemo(
    () => FINANCING_PLANS.find((p) => p.id === selectedPlanId) || FINANCING_PLANS[0],
    [selectedPlanId]
  );

  const { monthlyPayment, totalInterest, totalCost } = useMemo(() => {
    const P = amount;
    const n = selectedPlan.termMonths;
    const r = selectedPlan.apr / 100 / 12;

    if (r === 0) {
      const monthly = Math.round(P / n);
      return {
        monthlyPayment: monthly,
        totalInterest: 0,
        totalCost: P,
      };
    }

    const monthly = Math.round((P * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1));
    const total = monthly * n;
    const interest = total - P;

    return {
      monthlyPayment: monthly,
      totalInterest: Math.max(0, interest),
      totalCost: total,
    };
  }, [amount, selectedPlan]);

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
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
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Estimated Starting Payment</span>
            <span className="text-3xl md:text-4xl font-black text-brand-gold font-mono">
              ${monthlyPayment.toLocaleString()}
              <span className="text-sm font-medium text-slate-300">/mo</span>
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-8">
        {/* Loan Amount Slider */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label htmlFor="roof-loan-slider" className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Estimated Project Budget
            </label>
            <span className="text-2xl font-black text-brand-blue font-mono">
              ${amount.toLocaleString()}
            </span>
          </div>
          <input
            id="roof-loan-slider"
            type="range"
            min={5000}
            max={45000}
            step={500}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-blue focus:outline-none"
            aria-label="Roof financing budget slider"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-2 font-mono">
            <span>$5,000 (Small Repair)</span>
            <span>$20,000 (Standard Re-Roof)</span>
            <span>$45,000 (Large Tile / Solar)</span>
          </div>
        </div>

        {/* Plan Selector */}
        <div>
          <label className="text-sm font-bold text-slate-800 uppercase tracking-wide block mb-3">
            Select Financing Program
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {FINANCING_PLANS.map((plan) => {
              const isSelected = selectedPlan.id === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`relative text-left p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-brand-blue bg-blue-50/50 shadow-md ring-2 ring-brand-blue/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span
                    className={`inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md mb-2 ${
                      isSelected ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {plan.badge}
                  </span>
                  <div className="font-bold text-slate-900 text-sm">{plan.name}</div>
                  <div className="text-xs text-slate-500 mt-1">{plan.apr === 0 ? '0% APR Fixed' : `${plan.apr}% APR Fixed`}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Financial Breakdown Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 uppercase font-bold block">Down Payment</span>
            <span className="text-base font-bold text-emerald-600 font-mono">$0 Down</span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 uppercase font-bold block">Term Length</span>
            <span className="text-base font-bold text-slate-800 font-mono">{selectedPlan.termMonths} Months</span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 uppercase font-bold block">Est. Total Interest</span>
            <span className="text-base font-bold text-slate-800 font-mono">
              ${totalInterest.toLocaleString()}
            </span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 uppercase font-bold block">Prepayment Penalty</span>
            <span className="text-base font-bold text-emerald-600 font-mono">$0 Penalty</span>
          </div>
        </div>

        {/* Call to Action & Trust Indicators */}
        <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 text-brand-blue rounded-xl shrink-0 mt-0.5">
              <Icon name="shield-check" className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Soft Credit Pre-Qualification</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Checking your eligibility does not impact your credit score. Approvals in under 60 seconds.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <a
              href="#pre-qualify"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-blue hover:bg-[#1C88DD] text-white font-bold text-sm shadow-md transition-all text-center"
            >
              <span>Apply in 60s</span>
              <Icon name="arrow-right" className="w-4 h-4" />
            </a>
            <a
              href={PHONE_HREF}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-white text-sm font-bold transition-all"
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
