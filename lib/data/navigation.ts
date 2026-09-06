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
  { label: 'Roof Leak Repair', href: '/services/repairs', icon: Wrench, desc: 'Emergency leaks & storm diagnostics' },
  { label: 'Home & Room Additions', href: '/services/home-additions', icon: Hammer, desc: 'Custom second-story & suite expansions' },
  { label: 'ADU Construction', href: '/services/adu-construction', icon: Building2, desc: 'Detached ADUs & garage conversions' },
  { label: 'Commercial Roofing', href: '/services/commercial', icon: Building2, desc: 'TPO single-ply & roof coatings' },
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
    description: 'Tile relays, shingle replacements & rapid emergency leak repairs.',
    items: [
      { label: 'Tile Roof Underlayment & Relay', href: '/services/residential' },
      { label: 'Emergency Roof Leak Repair', href: '/services/repairs' },
      { label: 'Architectural Shingle Roofing', href: '/services/residential' },
    ],
  },
  {
    category: 'Commercial & Solar',
    icon: Building2,
    color: 'text-amber-400 bg-amber-500/10',
    href: '/services/commercial',
    description: 'TPO single-ply membranes, elastomeric coatings & solar detach/reset.',
    items: [
      { label: 'TPO Membrane Flat Roofing', href: '/services/commercial' },
      { label: 'Silicone & Elastomeric Coatings', href: '/services/commercial' },
      { label: 'Solar Panel Detach & Reset', href: '/services/solar' },
    ],
  },
  {
    category: 'General Construction & ADUs',
    icon: Hammer,
    color: 'text-emerald-400 bg-emerald-500/10',
    href: '/services/construction',
    description: 'Custom home additions, detached ADUs, garage conversions & framing.',
    items: [
      { label: 'Home & Room Additions', href: '/services/home-additions' },
      { label: 'ADU Construction Contractors', href: '/services/adu-construction' },
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
  { name: 'San Marcos', slug: 'san-marcos' },
  { name: 'Escondido', slug: 'escondido' },
  { name: 'La Jolla', slug: 'la-jolla' },
];
