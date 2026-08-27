import type { ComponentType } from 'react';
import {
  Home,
  Building2,
  Sun,
  Wrench,
  Hammer,
} from 'lucide-react';

/* ─── Service Navigation Items ─── */
export interface ServiceNavItem {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  desc: string;
}

export const SERVICES_NAV: ServiceNavItem[] = [
  { label: 'Residential Roofing', href: '/services/residential', icon: Home, desc: 'Tile relays & shingle replacements' },
  { label: 'Roof Repairs & Inspections', href: '/services/repairs', icon: Wrench, desc: 'Emergency leaks & broken tiles' },
  { label: 'Commercial Roofing', href: '/services/commercial', icon: Building2, desc: 'TPO single-ply & roof coatings' },
  { label: 'Solar Roofing', href: '/services/solar', icon: Sun, desc: 'Solar integration & roofing' },
  { label: 'General Construction', href: '/services/construction', icon: Hammer, desc: 'Dry rot repair & wood deck rebuilding' },
];

/* ─── Mega-Menu Columns (desktop header only) ─── */
export interface MegaMenuColumn {
  category: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  href: string;
  description: string;
  items: { label: string; href: string }[];
}

export const SERVICES_MEGA_MENU: MegaMenuColumn[] = [
  {
    category: 'Residential Roofing',
    icon: Home,
    color: 'text-brand-blue bg-blue-500/10',
    href: '/services/residential',
    description: 'Tile relays, shingle replacements & complete home roofing systems.',
    items: [
      { label: 'Tile Roof Underlayment & Relay', href: '/services/residential' },
      { label: 'Architectural Shingle Roofing', href: '/services/residential' },
      { label: 'Emergency Roof Leak Repairs', href: '/services/repairs' },
    ],
  },
  {
    category: 'Commercial Roofing',
    icon: Building2,
    color: 'text-amber-400 bg-amber-500/10',
    href: '/services/commercial',
    description: 'TPO single-ply membranes, elastomeric coatings & maintenance.',
    items: [
      { label: 'TPO Membrane Flat Roofing', href: '/services/commercial' },
      { label: 'Silicone & Elastomeric Coatings', href: '/services/commercial' },
      { label: 'Commercial Maintenance Plans', href: '/services/commercial' },
    ],
  },
  {
    category: 'Solar & Construction',
    icon: Sun,
    color: 'text-emerald-400 bg-emerald-500/10',
    href: '/services/solar',
    description: 'Solar roof integration, wood deck rebuilding & structural repairs.',
    items: [
      { label: 'Solar Roofing Integration', href: '/services/solar' },
      { label: 'General Construction & Dry Rot', href: '/services/construction' },
      { label: 'Fascia & Wood Deck Repair', href: '/services/construction' },
    ],
  },
];

/* ─── Service Area Cities ─── */
export interface CityNavItem {
  name: string;
  slug: string;
}

export const TOP_CITIES: CityNavItem[] = [
  { name: 'Oceanside', slug: 'oceanside' },
  { name: 'Carlsbad', slug: 'carlsbad' },
  { name: 'Encinitas', slug: 'encinitas' },
  { name: 'San Marcos', slug: 'san-marcos' },
  { name: 'Escondido', slug: 'escondido' },
  { name: 'La Jolla', slug: 'la-jolla' },
];
