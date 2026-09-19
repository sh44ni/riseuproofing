import React from 'react';
import {
  Calculator,
  TrendingUp,
  Percent,
  Layers,
  Home,
  AlertTriangle,
  Sparkles,
  Info,
  DollarSign,
  MapPin,
} from 'lucide-react';
import { PricingConfig } from '@/types/settingsTypes';

interface PricingFormulasTabProps {
  pricing: PricingConfig;
  onChange: (updated: PricingConfig) => void;
}

export function PricingFormulasTab({ pricing, onChange }: PricingFormulasTabProps) {
  const updatePitch = (key: keyof PricingConfig['pitchMultipliers'], val: number) => {
    onChange({
      ...pricing,
      pitchMultipliers: {
        ...pricing.pitchMultipliers,
        [key]: val,
      },
    });
  };

  const updateStory = (key: keyof PricingConfig['storyMultipliers'], val: number) => {
    onChange({
      ...pricing,
      storyMultipliers: {
        ...pricing.storyMultipliers,
        [key]: val,
      },
    });
  };

  const updateTearOff = (key: keyof PricingConfig['tearOffRates'], val: number) => {
    onChange({
      ...pricing,
      tearOffRates: {
        ...pricing.tearOffRates,
        [key]: val,
      },
    });
  };

  const updateMargin = (key: keyof PricingConfig['marginGuardrails'], val: number) => {
    onChange({
      ...pricing,
      marginGuardrails: {
        ...pricing.marginGuardrails,
        [key]: val,
      },
    });
  };

  const updateWaste = (key: keyof PricingConfig['wasteFactors'], val: number) => {
    onChange({
      ...pricing,
      wasteFactors: {
        ...pricing.wasteFactors,
        [key]: val,
      },
    });
  };

  const updatePermit = (key: keyof PricingConfig['permitFees'], val: number) => {
    onChange({
      ...pricing,
      permitFees: {
        ...pricing.permitFees,
        [key]: val,
      },
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* ================================================================
          SECTION 1: PROFIT MARGIN GUARDRAILS
          ================================================================ */}
      <div className="light-glass-card rounded-3xl p-6 border border-slate-200/80 bg-white/70 backdrop-blur-md shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/20 text-emerald-700 flex items-center justify-center border border-emerald-300/40">
              <TrendingUp size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Gross Profit Margin Guardrails & Commissions
              </h2>
              <p className="text-xs text-slate-500">
                Automated threshold enforcement for all residential & commercial estimates.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              Target: {pricing.marginGuardrails.targetGrossMargin}% Gross Margin
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          {/* Target Margin */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Target Gross Margin
              </span>
              <span className="text-base font-black text-emerald-600">
                {pricing.marginGuardrails.targetGrossMargin}%
              </span>
            </div>
            <input
              type="range"
              min="25"
              max="55"
              step="0.5"
              value={pricing.marginGuardrails.targetGrossMargin}
              onChange={(e) =>
                updateMargin('targetGrossMargin', parseFloat(e.target.value))
              }
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              Default margin applied to automated EagleView take-offs.
            </p>
          </div>

          {/* Hard Floor Margin */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Hard Floor Minimum Margin
              </span>
              <span className="text-base font-black text-amber-600">
                {pricing.marginGuardrails.hardFloorMargin}%
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="40"
              step="0.5"
              value={pricing.marginGuardrails.hardFloorMargin}
              onChange={(e) =>
                updateMargin('hardFloorMargin', parseFloat(e.target.value))
              }
              className="w-full accent-amber-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              Quotes below this rate require Owner executive sign-off.
            </p>
          </div>

          {/* Sales Rep Commission */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Sales Commission Rate
              </span>
              <span className="text-base font-black text-sky-600">
                {pricing.marginGuardrails.salesCommissionRate}%
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="20"
              step="0.5"
              value={pricing.marginGuardrails.salesCommissionRate}
              onChange={(e) =>
                updateMargin('salesCommissionRate', parseFloat(e.target.value))
              }
              className="w-full accent-sky-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              Calculated on net realized gross profit per signed contract.
            </p>
          </div>
        </div>
      </div>

      {/* ================================================================
          SECTION 2: ROOF PITCH & STORY MULTIPLIERS
          ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pitch Multipliers */}
        <div className="light-glass-card rounded-3xl p-6 border border-slate-200/80 bg-white/70 backdrop-blur-md shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-[#1878B8] flex items-center justify-center border border-sky-300/40">
              <Layers size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Roof Pitch Labor Multipliers
              </h3>
              <p className="text-[11px] text-slate-500">
                Multiplies base installation labor based on slope steepness.
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {[
              {
                key: 'flatTo3_12' as const,
                label: '0/12 to 3/12 (Flat / Low Slope)',
                desc: 'TPO, torch-down, self-adhering roll roofing',
              },
              {
                key: 'fourTo6_12' as const,
                label: '4/12 to 6/12 (Standard Walkable)',
                desc: 'Standard residential pitch, normal footing',
              },
              {
                key: 'sevenTo9_12' as const,
                label: '7/12 to 9/12 (Moderate Steep)',
                desc: 'Roof jacks and toe boards required',
              },
              {
                key: 'tenPlus_12' as const,
                label: '10/12+ (Extreme Steep Slope)',
                desc: 'Full OSHA fall harness & rope arrest systems',
              },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 shadow-2xs"
              >
                <div>
                  <span className="font-bold text-slate-800">{item.label}</span>
                  <p className="text-[11px] text-slate-400">{item.desc}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.05"
                    value={pricing.pitchMultipliers[item.key]}
                    onChange={(e) =>
                      updatePitch(item.key, parseFloat(e.target.value) || 1.0)
                    }
                    className="w-20 px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-bold text-right text-slate-900 outline-none"
                  />
                  <span className="font-bold text-slate-500">x</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Story Height Multipliers */}
        <div className="light-glass-card rounded-3xl p-6 border border-slate-200/80 bg-white/70 backdrop-blur-md shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center border border-amber-300/40">
              <Home size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Story Height & Staging Multipliers
              </h3>
              <p className="text-[11px] text-slate-500">
                Compensates for crane lifts, scaffolding, and ladder loading.
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {[
              {
                key: 'oneStory' as const,
                label: 'Single Story (Ground Walkup)',
                desc: 'Standard material drop and dumpster staging',
              },
              {
                key: 'twoStory' as const,
                label: 'Two-Story Structure',
                desc: 'Extended ladder runs and boom conveyor truck',
              },
              {
                key: 'threeStoryCoastal' as const,
                label: '3-Story / Coastal Hillside Staging',
                desc: 'Steep hill drops in Encinitas/Carlsbad cliff properties',
              },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 shadow-2xs"
              >
                <div>
                  <span className="font-bold text-slate-800">{item.label}</span>
                  <p className="text-[11px] text-slate-400">{item.desc}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.02"
                    value={pricing.storyMultipliers[item.key]}
                    onChange={(e) =>
                      updateStory(item.key, parseFloat(e.target.value) || 1.0)
                    }
                    className="w-20 px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-bold text-right text-slate-900 outline-none"
                  />
                  <span className="font-bold text-slate-500">x</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================================================================
          SECTION 3: TEAR-OFF COSTS & CITY PERMITS
          ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tear-off Rates */}
        <div className="light-glass-card rounded-3xl p-6 border border-slate-200/80 bg-white/70 backdrop-blur-md shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-700 flex items-center justify-center border border-rose-300/40">
              <DollarSign size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Tear-Off & Dumpster Rates ($ / SQ)
              </h3>
              <p className="text-[11px] text-slate-500">
                Direct disposal cost per roofing square (100 sq ft).
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {[
              {
                key: 'shingle1Layer' as const,
                label: '1-Layer Asphalt Shingles',
                desc: 'Single layer removal to bare OSB decking',
              },
              {
                key: 'shingle2Layer' as const,
                label: '2-Layer Asphalt Shingles',
                desc: 'Heavy double tear-off + additional dumpster weight',
              },
              {
                key: 'tileConcrete' as const,
                label: 'Concrete or Clay Spanish Tile',
                desc: 'High tonnage disposal + batten strip strip-down',
              },
              {
                key: 'woodShake' as const,
                label: 'Cedar Wood Shake',
                desc: 'Includes 1/2" CDX re-sheathing labor allocation',
              },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 shadow-2xs"
              >
                <div>
                  <span className="font-bold text-slate-800">{item.label}</span>
                  <p className="text-[11px] text-slate-400">{item.desc}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-500">$</span>
                  <input
                    type="number"
                    step="5"
                    value={pricing.tearOffRates[item.key]}
                    onChange={(e) =>
                      updateTearOff(item.key, parseFloat(e.target.value) || 0)
                    }
                    className="w-20 px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-bold text-right text-slate-900 outline-none"
                  />
                  <span className="font-bold text-slate-400">/ SQ</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* City Permits Allowances */}
        <div className="light-glass-card rounded-3xl p-6 border border-slate-200/80 bg-white/70 backdrop-blur-md shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-700 flex items-center justify-center border border-indigo-300/40">
              <MapPin size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                North County City Permit Fees
              </h3>
              <p className="text-[11px] text-slate-500">
                Flat building department permit allowance added to contracts.
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {[
              {
                key: 'oceanside' as const,
                label: 'City of Oceanside Building Dept',
                desc: 'Online e-Permit portal filing fee',
              },
              {
                key: 'carlsbad' as const,
                label: 'City of Carlsbad Community Development',
                desc: 'Permit fee + smoke detector affidavit',
              },
              {
                key: 'encinitas' as const,
                label: 'City of Encinitas Planning Dept',
                desc: 'Includes coastal review checklist',
              },
              {
                key: 'vista' as const,
                label: 'City of Vista Building Division',
                desc: 'Standard residential reroof permit',
              },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 shadow-2xs"
              >
                <div>
                  <span className="font-bold text-slate-800">{item.label}</span>
                  <p className="text-[11px] text-slate-400">{item.desc}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-500">$</span>
                  <input
                    type="number"
                    step="10"
                    value={pricing.permitFees[item.key]}
                    onChange={(e) =>
                      updatePermit(item.key, parseFloat(e.target.value) || 0)
                    }
                    className="w-20 px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-bold text-right text-slate-900 outline-none"
                  />
                  <span className="font-bold text-slate-400">USD</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
