import type { ComponentType } from 'react';
import {
  Home,
  Building2,
  Sun,
  Wrench,
  Hammer,
  Shield,
  Layers,
  Search,
} from 'lucide-react';

/* ─── Service Navigation Items ─── */
export interface ServiceNavItem {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  desc: string;
}

export const SERVICES_NAV: ServiceNavItem[] = [
  { label: 'Roof Inspection & Diagnostics', href: '/services/roof-inspection', icon: Search, desc: '12-point drone & thermal surveys' },
  { label: 'Residential Roofing', href: '/services/residential', icon: Home, desc: 'Tile relays & shingle replacements' },
  { label: 'Roof Leak Repair', href: '/services/repairs', icon: Wrench, desc: 'Emergency leaks & storm diagnostics' },
  { label: 'Tile Roofing & Relay', href: '/services/tile-roofing', icon: Shield, desc: 'Spanish clay & concrete tile relays' },
  { label: 'Standing Seam Metal', href: '/services/metal-roofing', icon: Shield, desc: 'Class-A fire rated 50-yr metal' },
  { label: 'Siding Installation', href: '/services/siding', icon: Layers, desc: 'James Hardie fiber cement & repairs' },
  { label: 'Home & Room Additions', href: '/services/home-additions', icon: Hammer, desc: 'Custom second-story & suite expansions' },
  { label: 'ADU Construction', href: '/services/adu-construction', icon: Building2, desc: 'Detached ADUs & garage conversions' },
  { label: 'Commercial Roofing', href: '/services/commercial', icon: Building2, desc: 'TPO single-ply & roof coatings' },
  { label: 'Modified Bitumen Roofing', href: '/services/modified-bitumen', icon: Layers, desc: 'SBS/APP multi-ply commercial systems' },
  { label: 'Roof Coating & Restoration', href: '/services/roof-coating', icon: Shield, desc: 'Seamless 100% silicone fluid coatings' },
  { label: 'Solar Roofing', href: '/services/solar', icon: Sun, desc: 'Solar integration & detach-reset' },
  { label: 'General Construction', href: '/services/construction', icon: Hammer, desc: 'Patio covers, framing & exterior builds' },
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
    category: 'Roofing Solutions',
    icon: Home,
    color: 'text-brand-blue bg-blue-500/10',
    href: '/services/residential',
    description: 'Tile relays, standing seam metal, shingle replacements & rapid leak repairs.',
    items: [
      { label: 'Roof Inspection & Diagnostics', href: '/services/roof-inspection' },
      { label: 'Tile Roof Installation & Relay', href: '/services/tile-roofing' },
      { label: 'Emergency Roof Leak Repair', href: '/services/repairs' },
      { label: 'Standing Seam Metal Roofing', href: '/services/metal-roofing' },
      { label: 'Architectural Shingle Roofing', href: '/services/residential' },
    ],
  },
  {
    category: 'Commercial & Coatings',
    icon: Building2,
    color: 'text-amber-400 bg-amber-500/10',
    href: '/services/commercial',
    description: 'TPO single-ply, SBS modified bitumen, silicone coatings & solar.',
    items: [
      { label: 'TPO Single-Ply Membrane', href: '/services/commercial' },
      { label: 'Modified Bitumen & Built-Up', href: '/services/modified-bitumen' },
      { label: 'Silicone & Elastomeric Coatings', href: '/services/roof-coating' },
      { label: 'Solar Roofing & Panel Detach', href: '/services/solar' },
    ],
  },
  {
    category: 'General Construction & ADUs',
    icon: Hammer,
    color: 'text-emerald-400 bg-emerald-500/10',
    href: '/services/construction',
    description: 'Custom home additions, detached ADUs, fiber cement siding & framing.',
    items: [
      { label: 'Home & Room Additions', href: '/services/home-additions' },
      { label: 'ADU Construction Contractors', href: '/services/adu-construction' },
      { label: 'James Hardie Siding Replacement', href: '/services/siding' },
      { label: 'Patio Covers & General Framing', href: '/services/construction' },
    ],
  },
];

/* ─── Service Area Cities ─── */
export interface CityNavItem {
  name: string;
  slug: string;
}

export const TOP_CITIES: CityNavItem[] = [
  { name: 'San Diego', slug: 'san-diego' },
  { name: 'Oceanside', slug: 'oceanside' },
  { name: 'Carlsbad', slug: 'carlsbad' },
  { name: 'Encinitas', slug: 'encinitas' },
  { name: 'Vista', slug: 'vista' },
  { name: 'San Marcos', slug: 'san-marcos' },
  { name: 'Escondido', slug: 'escondido' },
  { name: 'La Jolla', slug: 'la-jolla' },
];
