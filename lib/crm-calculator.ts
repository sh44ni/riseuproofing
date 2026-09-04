/**
 * Rise Up Roofing & Construction — Estimating & Cost Engine
 * 
 * Accurately calculates material costs, labor rates (factoring slope/stories),
 * common roofing add-ons, gross margins, and monthly financing installments.
 */

export interface AddonItem {
  id: string;
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
}

export interface MaterialOption {
  id: string;
  name: string;
  category: 'shingle' | 'tile' | 'commercial' | 'metal';
  materialCostPerSq: number;
  laborCostPerSq: number;
  warrantyYears: number;
  description: string;
}

export const ROOFING_MATERIALS: MaterialOption[] = [
  {
    id: 'oc_duration',
    name: 'Owens Corning Duration® Shingles',
    category: 'shingle',
    materialCostPerSq: 175,
    laborCostPerSq: 225,
    warrantyYears: 50,
    description: 'SureNail® technology, 130 MPH wind warranty, Owens Corning Preferred installation',
  },
  {
    id: 'eagle_tile',
    name: 'Eagle Concrete Tile (Tile Relay / New Tile)',
    category: 'tile',
    materialCostPerSq: 260,
    laborCostPerSq: 295,
    warrantyYears: 50,
    description: 'Class A fire-rated, dual-layer synthetic underlayment, custom eave closures',
  },
  {
    id: 'clay_tile',
    name: 'Authentic Spanish Clay Tile',
    category: 'tile',
    materialCostPerSq: 395,
    laborCostPerSq: 345,
    warrantyYears: 75,
    description: 'Timeless Southern California mission aesthetic, superior thermal resistance',
  },
  {
    id: 'tpo_commercial',
    name: 'Commercial TPO Single-Ply Membrane (60-mil)',
    category: 'commercial',
    materialCostPerSq: 210,
    laborCostPerSq: 265,
    warrantyYears: 25,
    description: 'Heat-welded seams, high solar reflectance (Title 24 compliant), leak-proof flat roof',
  },
  {
    id: 'standing_seam',
    name: 'Architectural Standing Seam Metal',
    category: 'metal',
    materialCostPerSq: 430,
    laborCostPerSq: 390,
    warrantyYears: 50,
    description: 'Concealed fasteners, Kynar 500 finish, modern architectural aesthetic',
  },
];

export const PITCH_MULTIPLIERS: Record<string, number> = {
  '4:12': 1.0,
  '5:12': 1.03,
  '6:12': 1.07,
  '7:12': 1.12,
  '8:12': 1.18,
  '9:12': 1.25,
  '10:12+': 1.35,
};

export const STORY_MULTIPLIERS: Record<number, number> = {
  1: 1.0,
  2: 1.1,
  3: 1.25,
};

export const TEAROFF_COSTS_PER_SQ: Record<number, number> = {
  0: 0,   // Overlay
  1: 45,  // 1 layer tear-off
  2: 85,  // 2 layers tear-off
};

export const DEFAULT_ADDONS: Omit<AddonItem, 'quantity'>[] = [
  { id: 'plywood', name: '4x8 CDX Plywood Sheathing', unit: 'sheet', unitPrice: 95 },
  { id: 'dryrot_fascia', name: 'Fascia Board / Dry Rot Repair', unit: 'LF', unitPrice: 28 },
  { id: 'gutters', name: 'Seamless 5" Aluminum Gutters', unit: 'LF', unitPrice: 18 },
  { id: 'skylight', name: 'Velux Deck-Mounted Skylight', unit: 'unit', unitPrice: 1250 },
  { id: 'vents', name: 'O\'Hagin Attic Vents', unit: 'unit', unitPrice: 165 },
  { id: 'solar_detach', name: 'Solar Panel Detach & Reset', unit: 'panel', unitPrice: 185 },
  { id: 'permit', name: 'City Building Permit & Inspection', unit: 'flat', unitPrice: 650 },
  { id: 'dumpster', name: 'Dumpster Haul-Away & Disposal', unit: 'flat', unitPrice: 850 },
];

export interface CalculationInput {
  roofSquares: number;
  materialId: string;
  pitch?: string;
  stories?: number;
  tearoffLayers?: number;
  addons?: { id: string; quantity: number; unitPrice?: number; name?: string }[];
  marginPct?: number;
  financingMonths?: number;
}

export interface CalculationResult {
  squares: number;
  material: MaterialOption;
  materialSubtotal: number;
  laborSubtotal: number;
  tearoffSubtotal: number;
  addonsSubtotal: number;
  costSubtotal: number;
  marginPct: number;
  totalPrice: number;
  monthlyPayment: number;
  addonsDetail: AddonItem[];
}

export function calculateRoofEstimate(input: CalculationInput): CalculationResult {
  const squares = Math.max(1, Number(input.roofSquares) || 20);
  const material = ROOFING_MATERIALS.find(m => m.id === input.materialId) || ROOFING_MATERIALS[0];
  const pitchMult = PITCH_MULTIPLIERS[input.pitch || '4:12'] || 1.0;
  const storyMult = STORY_MULTIPLIERS[input.stories || 1] || 1.0;
  const tearoffRate = TEAROFF_COSTS_PER_SQ[input.tearoffLayers ?? 1] ?? 45;

  // Base materials
  const materialSubtotal = Math.round(squares * material.materialCostPerSq);

  // Labor factoring pitch, stories & base rate
  const adjustedLaborPerSq = material.laborCostPerSq * pitchMult * storyMult;
  const laborSubtotal = Math.round(squares * adjustedLaborPerSq);

  // Tear-off labor
  const tearoffSubtotal = Math.round(squares * tearoffRate);

  // Add-ons
  let addonsSubtotal = 0;
  const addonsDetail: AddonItem[] = [];

  if (input.addons && input.addons.length > 0) {
    for (const add of input.addons) {
      if (!add.quantity || add.quantity <= 0) continue;
      const def = DEFAULT_ADDONS.find(d => d.id === add.id);
      const price = add.unitPrice ?? def?.unitPrice ?? 0;
      const name = add.name ?? def?.name ?? add.id;
      const unit = def?.unit ?? 'item';
      const cost = Math.round(price * add.quantity);
      addonsSubtotal += cost;
      addonsDetail.push({
        id: add.id,
        name,
        unit,
        unitPrice: price,
        quantity: add.quantity,
      });
    }
  }

  const costSubtotal = materialSubtotal + laborSubtotal + tearoffSubtotal + addonsSubtotal;

  // Margin calculation: Price = Cost / (1 - Margin)
  const marginPct = input.marginPct !== undefined ? input.marginPct : 30;
  const marginFraction = Math.max(0.05, Math.min(0.60, marginPct / 100));
  const totalPrice = Math.round(costSubtotal / (1 - marginFraction));

  // Financing calculation: 0% APR promo over X months
  const months = input.financingMonths || 60;
  const monthlyPayment = Math.round(totalPrice / months);

  return {
    squares,
    material,
    materialSubtotal,
    laborSubtotal,
    tearoffSubtotal,
    addonsSubtotal,
    costSubtotal,
    marginPct,
    totalPrice,
    monthlyPayment,
    addonsDetail,
  };
}
