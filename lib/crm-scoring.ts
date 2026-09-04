/**
 * Rise Up Roofing & Construction — Lead Scoring Engine
 * 
 * Auto-scores inbound leads from 0 to 100 based on intent, project scope,
 * service category, and geographic fit in San Diego & Riverside Counties.
 */

export interface LeadScoreInput {
  serviceType?: string | null;
  phone?: string | null;
  email?: string | null;
  roofSqf?: number | null;
  address?: string | null;
  zip?: string | null;
  leadSource?: string | null;
  formType?: string | null;
}

export interface LeadScoreResult {
  score: number;
  priority: 'hot' | 'warm' | 'cool';
  factors: string[];
}

const PRIMARY_CITIES = [
  'escondido', 'oceanside', 'carlsbad', 'san marcos', 'vista',
  'encinitas', 'poway', 'rancho bernardo', 'temecula', 'murrieta'
];

export function calculateLeadScore(input: LeadScoreInput): LeadScoreResult {
  let score = 0;
  const factors: string[] = [];

  // Service urgency / value
  const sType = (input.serviceType ?? '').toLowerCase();
  if (sType.includes('repair') || sType.includes('leak') || sType.includes('emergency')) {
    score += 45;
    factors.push('Emergency or active leak repair (+45)');
  } else if (sType.includes('residential') || sType.includes('tile') || sType.includes('shingle')) {
    score += 35;
    factors.push('High-ticket full roof replacement (+35)');
  } else if (sType.includes('commercial') || sType.includes('tpo')) {
    score += 40;
    factors.push('Commercial project (+40)');
  } else if (sType.includes('solar')) {
    score += 30;
    factors.push('Solar + roofing combination (+30)');
  } else if (sType) {
    score += 15;
    factors.push('Service requested (+15)');
  }

  // High Intent: Form Type
  if (input.formType === 'estimate') {
    score += 20;
    factors.push('Interactive estimate submitted (+20)');
  }

  // Reachability: Valid Phone Number
  if (input.phone && input.phone.replace(/\D/g, '').length >= 10) {
    score += 20;
    factors.push('Direct phone number provided (+20)');
  }

  // Property Size
  if (input.roofSqf && input.roofSqf >= 2500) {
    score += 15;
    factors.push(`Large roof area (${input.roofSqf.toLocaleString()} sq ft) (+15)`);
  } else if (input.roofSqf && input.roofSqf > 0) {
    score += 10;
    factors.push(`Roof area specified (+10)`);
  }

  // Geographic fit
  const addr = `${input.address ?? ''} ${input.zip ?? ''}`.toLowerCase();
  if (PRIMARY_CITIES.some(city => addr.includes(city))) {
    score += 10;
    factors.push('Primary North County / Local service area (+10)');
  }

  // Lead Source
  const source = (input.leadSource ?? '').toLowerCase();
  if (source.includes('referral') || source.includes('repeat')) {
    score += 25;
    factors.push('Referral or repeat client (+25)');
  } else if (source.includes('phone') || source.includes('call')) {
    score += 15;
    factors.push('Direct telephone inbound (+15)');
  }

  // Cap score at 100
  score = Math.min(100, Math.max(0, score));

  // Determine priority bucket
  let priority: 'hot' | 'warm' | 'cool' = 'cool';
  if (score >= 70) {
    priority = 'hot';
  } else if (score >= 35) {
    priority = 'warm';
  }

  return { score, priority, factors };
}
