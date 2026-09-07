export interface EstimatorPricingRule {
  pricePerSqftLow: number;
  pricePerSqftHigh: number;
  baseFeeLow: number;
  baseFeeHigh: number;
  minSqft: number;
  maxSqft: number;
  aprAvailable: boolean;
  financingApr: number;
  financingTermMonths: number;
}

export interface EstimatorSizePreset {
  id: number;
  serviceId?: number | null;
  label: string;
  sqftValue: number;
  sortOrder: number;
}

export interface EstimatorService {
  id: number;
  slug: string;
  name: string;
  shortLabel: string;
  iconKey: string;
  badgeLabel: string | null;
  sortOrder: number;
  isActive: boolean;
  pricing: EstimatorPricingRule;
  presets: EstimatorSizePreset[];
}

export interface CalculationResult {
  low: number;
  high: number;
  monthlyEstimate: number;
  aprAvailable: boolean;
  formattedRange: string;
  formattedMonthly: string;
  clampedSqft: number;
}

/**
 * Pure calculation function used on both server and client
 * Formula:
 * estimate_low = base_fee_low + (sqft * price_per_sqft_low)
 * estimate_high = base_fee_high + (sqft * price_per_sqft_high)
 * Round to nearest 100.
 */
export function calculateEstimate(
  pricing: EstimatorPricingRule,
  rawSqft: number
): CalculationResult {
  // Clamping guardrails: between service min/max or safe global bounds [500, 15000]
  const min = Math.max(500, pricing.minSqft || 500);
  const max = Math.min(25000, pricing.maxSqft || 15000);
  const sqft = Math.min(Math.max(rawSqft || min, min), max);

  const lowRaw = Number(pricing.baseFeeLow) + sqft * Number(pricing.pricePerSqftLow);
  const highRaw = Number(pricing.baseFeeHigh) + sqft * Number(pricing.pricePerSqftHigh);

  const low = Math.round(lowRaw / 100) * 100;
  const high = Math.round(highRaw / 100) * 100;

  const term = pricing.financingTermMonths || 60;
  const apr = pricing.financingApr || 0;

  let monthlyEstimate: number;
  if (apr === 0 || !apr) {
    monthlyEstimate = Math.round(low / term);
  } else {
    // Standard amortization formula: P * (r(1+r)^n) / ((1+r)^n - 1)
    const monthlyRate = apr / 100 / 12;
    const factor = Math.pow(1 + monthlyRate, term);
    monthlyEstimate = Math.round(low * (monthlyRate * factor) / (factor - 1));
  }

  return {
    low,
    high,
    monthlyEstimate,
    aprAvailable: pricing.aprAvailable,
    formattedRange: `$${low.toLocaleString()} – $${high.toLocaleString()}`,
    formattedMonthly: `$${monthlyEstimate}/mo`,
    clampedSqft: sqft,
  };
}
