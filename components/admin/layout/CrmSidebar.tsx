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
                width={110}
                height={34}
                priority
                className="object-contain"
                style={{ height: 32, width: 'auto' }}
              />
            </Link>
            <span className="crm-brand-badge">CRM</span>
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

        {/* Footer */}
        <div className="crm-sidebar-footer">
          <div className="crm-sidebar-footer-brand">
            GOOD ROOFS.
            <br />
            BETTER PEOPLE.
          </div>
          <div className="crm-sidebar-social">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" title="Instagram">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" title="Facebook">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
            <a href="https://riseuprac.com" target="_blank" rel="noreferrer" title="Website">
              <Globe size={14} />
            </a>
            <a href="https://yelp.com" target="_blank" rel="noreferrer" title="Yelp">
              <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M12.076 19.003l-1.935.42c-1.538.336-1.805-.742-1.539-1.668l.92-3.274c.266-.928 1.044-1.258 1.82-.514l1.544 1.462c.776.736.667 3.232-.81 3.574zm.81-12.35L11.342 5.19c-.776-.736-1.554-.413-1.82.514l-.92 3.274c-.267.928 0 2.005 1.538 1.67l1.935-.42c1.477-.343 1.587-2.838.81-3.575zm7.18 8.516l-1.77-1.168c-.804-.53-1.63-.196-1.704.74l-.24 3.075c-.075.937.938 1.373 1.673.742l1.524-1.316c.766-.66.32-1.573-.483-2.073zm-3.267-9.022c.804-.53.858-1.505.053-2.036l-1.77-1.168c-.804-.53-1.688-.099-1.762.838l-.24 3.075c-.075.937.702 1.571 1.773.876l1.946-1.585zm1.33 4.753l-3.01-.36c-.938-.113-1.552.645-1.226 1.644l.97 2.974c.326.998 1.302 1.098 1.943.183l1.643-2.292c.642-.913.619-2.036-.32-2.149z" />
              </svg>
            </a>
          </div>
          <div className="crm-sidebar-footer-meta">
            RISEUPRAC.COM
            <br />
            Oceanside, CA
          </div>
        </div>
      </aside>
    </>
  );
}
