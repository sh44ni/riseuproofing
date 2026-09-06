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
      {/* Floating Apple Liquid Glass Dock on Mobile */}
      <nav className="lg:hidden fixed bottom-2.5 left-3 right-3 max-w-md mx-auto z-40 admin-dock-glass rounded-[22px] px-2 py-1.5 transition-all duration-300">
        <div className="flex items-center justify-around h-14">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href ||
              (href !== '/admin/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center justify-center h-full py-1 rounded-[16px] transition-all duration-200 relative group apple-spring-press ${
                  active
                    ? 'bg-gradient-to-b from-sky-500/15 via-sky-500/10 to-blue-500/5 text-[#0284C7] font-bold shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_2px_8px_rgba(47,159,227,0.15)]'
                    : 'text-slate-500 hover:text-[#0B1E33] hover:bg-slate-100/50'
                }`}
              >
                <Icon
                  size={19}
                  className={`transition-transform duration-200 group-active:scale-90 ${
                    active
                      ? 'text-[#0284C7] stroke-[2.4] drop-shadow-[0_1px_2px_rgba(47,159,227,0.3)]'
                      : 'text-slate-500 stroke-[1.8]'
                  }`}
                />
                <span className="text-[10px] mt-0.5 tracking-tight font-semibold">{label}</span>
                {active && (
                  <span className="absolute bottom-0.5 w-1 h-1 bg-[#2F9FE3] rounded-full shadow-[0_0_8px_rgba(47,159,227,0.8)]" />
                )}
              </Link>
            );
          })}

          {/* 5th Tab: More */}
          <button
            onClick={() => setMoreOpen(true)}
            className="flex-1 flex flex-col items-center justify-center h-full py-1 rounded-[16px] text-slate-500 hover:text-[#0B1E33] hover:bg-slate-100/50 transition-all duration-200 cursor-pointer apple-spring-press"
          >
            <MoreHorizontal size={19} className="stroke-[1.8]" />
            <span className="text-[10px] mt-0.5 tracking-tight font-semibold">More</span>
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
