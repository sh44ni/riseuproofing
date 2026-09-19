export interface FinancingPlan {
  id: number;
  name: string;
  apr: number;
  termMonths: number;
  minDownPaymentPct: number;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  badgeLabel?: string | null;
  description?: string | null;
}

export interface FinancingSettings {
  minProjectCost: number;
  maxProjectCost: number;
  defaultProjectCost: number;
  creditCheckCopyFlag: boolean;
}

export interface FinancingCalculationResult {
  monthlyPayment: number;
  principal: number;
  planName: string;
  apr: number;
  termMonths: number;
  totalInterest: number;
  totalCost: number;
  formattedMonthly: string;
  formattedPrincipal: string;
  formattedInterest: string;
  formattedTotalCost: string;
}

/**
 * Standard Loan Amortization Formula
 * principal = projectCost - downPayment
 * if apr == 0: monthly = principal / termMonths
 * else: r = (apr / 100) / 12
 *       monthly = principal * (r * (1+r)^n) / ((1+r)^n - 1)
 * Round to nearest dollar.
 */
export function calculateFinancing(
  plan: Pick<FinancingPlan, 'name' | 'apr' | 'termMonths'>,
  projectCost: number,
  downPayment = 0
): FinancingCalculationResult {
  const safeCost = Math.max(0, projectCost);
  const safeDown = Math.min(safeCost, Math.max(0, downPayment));
  const principal = Math.max(0, safeCost - safeDown);

  const n = Math.max(1, plan.termMonths);
  const apr = Math.max(0, plan.apr);

  let monthlyPayment: number;
  let totalInterest: number;
  let totalCost: number;

  if (principal === 0) {
    monthlyPayment = 0;
    totalInterest = 0;
    totalCost = safeDown;
  } else if (apr === 0) {
    monthlyPayment = Math.round(principal / n);
    totalInterest = 0;
    totalCost = principal + safeDown;
  } else {
    const r = apr / 100 / 12;
    const factor = Math.pow(1 + r, n);
    monthlyPayment = Math.round((principal * (r * factor)) / (factor - 1));
    totalCost = monthlyPayment * n + safeDown;
    totalInterest = Math.max(0, totalCost - safeCost);
  }

  return {
    monthlyPayment,
    principal,
    planName: plan.name,
    apr,
    termMonths: n,
    totalInterest,
    totalCost,
    formattedMonthly: `$${monthlyPayment.toLocaleString()}/mo`,
    formattedPrincipal: `$${principal.toLocaleString()}`,
    formattedInterest: `$${totalInterest.toLocaleString()}`,
    formattedTotalCost: `$${totalCost.toLocaleString()}`,
  };
}
