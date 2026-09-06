'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  Hammer,
  ClipboardCheck,
  HardHat,
  MoreHorizontal,
} from 'lucide-react';
import MoreMenuSheet from './MoreMenuSheet';
import { AuthUser, hasPermission } from '@/lib/rbac';

interface BottomNavProps {
  user?: AuthUser | null;
}

export default function BottomNav({ user }: BottomNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  // Dynamic tab selection: if user lacks estimating/leads permissions, show field operations tabs
  const canQuote = hasPermission(user, 'estimates:create') || hasPermission(user, 'leads:view');

  const TABS = !canQuote
    ? [
        { href: '/admin/dashboard', label: 'Home', icon: LayoutDashboard },
        { href: '/admin/jobs', label: 'Jobs', icon: Hammer },
        { href: '/admin/inspections', label: 'Inspect', icon: ClipboardCheck },
        { href: '/admin/crew', label: 'Crew', icon: HardHat },
      ]
    : [
        { href: '/admin/dashboard', label: 'Home', icon: LayoutDashboard },
        { href: '/admin/leads', label: 'Leads', icon: Users },
        { href: '/admin/estimates', label: 'Quotes', icon: FileText },
        { href: '/admin/jobs', label: 'Jobs', icon: Hammer },
      ];

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 admin-bar-glass border-t border-slate-200/80 px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href ||
              (href !== '/admin/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center justify-center h-full py-1 transition-colors relative ${
                  active
                    ? 'text-[#2F9FE3] font-bold'
                    : 'text-slate-500 hover:text-[#0B1E33]'
                }`}
              >
                <Icon
                  size={20}
                  className={
                    active
                      ? 'text-[#2F9FE3] stroke-[2.2]'
                      : 'text-slate-500 stroke-[1.75]'
                  }
                />
                <span className="text-[10px] mt-1 tracking-tight">{label}</span>
                {active && (
                  <span className="absolute bottom-1 w-1 h-1 bg-[#2F9FE3] rounded-full shadow-[0_0_8px_rgba(47,159,227,0.6)]" />
                )}
              </Link>
            );
          })}

          {/* 5th Tab: More */}
          <button
            onClick={() => setMoreOpen(true)}
            className="flex-1 flex flex-col items-center justify-center h-full py-1 text-slate-500 hover:text-[#0B1E33] transition-colors cursor-pointer"
          >
            <MoreHorizontal size={20} className="stroke-[1.75]" />
            <span className="text-[10px] mt-1 tracking-tight">More</span>
          </button>
        </div>
      </nav>

      {/* Slide up More menu */}
      <MoreMenuSheet
        user={user}
        isOpen={moreOpen}
        onClose={() => setMoreOpen(false)}
      />
    </>
  );
}
