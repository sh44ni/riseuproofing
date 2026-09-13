'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  House,
  UsersRound,
  GitMerge,
  UserRound,
  FileText,
  CalendarDays,
  CheckCheck,
  Palette,
  BarChart3,
  Settings,
  ShieldCheck,
  ChevronRight,
  Globe,
} from 'lucide-react';
import { canAccessPath, AuthUser } from '@/lib/rbac';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', Icon: House, fill: true },
  { href: '/admin/leads', label: 'Leads', Icon: UsersRound, fill: true },
  { href: '/admin/pipeline', label: 'Pipeline', Icon: GitMerge, fill: false },
  { href: '/admin/clients', label: 'Clients', Icon: UserRound, fill: true },
  { href: '/admin/estimates', label: 'Estimates', Icon: FileText, fill: true },
  { href: '/admin/calendar', label: 'Calendar', Icon: CalendarDays, fill: true },
  { href: '/admin/tasks', label: 'Tasks', Icon: CheckCheck, fill: true },
  { href: '#', label: 'Content Creation', Icon: Palette, fill: false, future: true },
  { href: '/admin/reports', label: 'Reports', Icon: BarChart3, fill: false },
  { href: '/admin/settings', label: 'Settings', Icon: Settings, fill: true },
  { href: '/admin/users', label: 'Users', Icon: ShieldCheck, fill: true },
];

interface CrmSidebarProps {
  user: AuthUser | null;
  mobileNav: boolean;
  setMobileNav: (open: boolean) => void;
}

export default function CrmSidebar({ user, mobileNav, setMobileNav }: CrmSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {mobileNav && (
        <button
          className="crm-nav-scrim"
          onClick={() => setMobileNav(false)}
          aria-label="Close navigation"
        />
      )}

      <aside className={`crm-sidebar${mobileNav ? ' open' : ''}`} aria-label="Main navigation">
        {/* Brand */}
        <div className="crm-brand-area">
          <div className="crm-brand-logo">
            <Link href="/admin/dashboard" onClick={() => setMobileNav(false)}>
              <Image
                src="/logo.svg"
                alt="Rise Up Roofing"
                width={130}
                height={40}
                priority
                className="object-contain"
                style={{ height: 34, width: 'auto' }}
              />
            </Link>
          </div>
          <span className="crm-tagline">Discipline Builds Freedom.</span>
        </div>

        {/* Nav */}
        <nav className="crm-nav">
          {NAV_ITEMS.map(({ href, label, Icon, fill, future }) => {
            if (future) {
              return (
                <span key={label} className="crm-nav-item crm-nav-future">
                  <Icon fill="none" strokeWidth={2.4} />
                  <span className="crm-nav-label">{label}</span>
                  <span className="crm-nav-soon">Soon</span>
                </span>
              );
            }
            if (!canAccessPath(user, href)) return null;
            const isActive =
              href === '/admin/dashboard'
                ? pathname === href
                : pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={`crm-nav-item${isActive ? ' active' : ''}`}
                onClick={() => setMobileNav(false)}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon fill={fill ? 'currentColor' : 'none'} strokeWidth={2.4} />
                <span className="crm-nav-label">{label}</span>
                <ChevronRight className="crm-nav-chevron" />
              </Link>
            );
          })}
        </nav>

        {/* Coastal Footer Card */}
        <div className="crm-sidebar-footer">
          <div className="crm-sidebar-coastal-wrap">
            <Image
              src="/sidebar-coastal-card.jpg"
              alt="Good Roofs. Better People. Rise Up Roofing Oceanside, CA"
              width={768}
              height={896}
              priority
              className="crm-sidebar-coastal-img"
            />
            {/* Interactive Hotspot Links */}
            <div className="crm-sidebar-hotspots">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                title="Follow Rise Up on Instagram"
                aria-label="Follow Rise Up on Instagram"
                className="crm-hotspot crm-hotspot-ig"
              />
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                title="Follow Rise Up on Facebook"
                aria-label="Follow Rise Up on Facebook"
                className="crm-hotspot crm-hotspot-fb"
              />
              <a
                href="https://www.google.com/search?q=Rise+Up+Roofing+Oceanside+CA"
                target="_blank"
                rel="noreferrer"
                title="View Rise Up Google Reviews"
                aria-label="View Rise Up Google Reviews"
                className="crm-hotspot crm-hotspot-google"
              />
              <a
                href="https://yelp.com"
                target="_blank"
                rel="noreferrer"
                title="View Rise Up on Yelp"
                aria-label="View Rise Up on Yelp"
                className="crm-hotspot crm-hotspot-yelp"
              />
              <a
                href="https://riseuprac.com"
                target="_blank"
                rel="noreferrer"
                title="Visit Rise Up Official Website"
                aria-label="Visit Rise Up Official Website"
                className="crm-hotspot crm-hotspot-web"
              />
              <a
                href="https://maps.google.com/?q=Oceanside,+CA"
                target="_blank"
                rel="noreferrer"
                title="Oceanside, California"
                aria-label="Oceanside, California on Google Maps"
                className="crm-hotspot crm-hotspot-loc"
              />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
