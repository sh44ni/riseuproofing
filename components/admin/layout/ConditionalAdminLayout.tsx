'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  sidebar: ReactNode;
  bottomNav: ReactNode;
  fab: ReactNode;
}

/**
 * Client component that reads the current pathname and conditionally renders
 * the full admin shell (sidebar + main + bottom nav) or a bare full-viewport
 * wrapper for pages like the dashboard that own their own layout.
 *
 * This is the correct Next.js App Router pattern for conditional layouts —
 * a parent Server-Component layout cannot read its own pathname, but it CAN
 * pass pre-rendered Server Component slots into a Client Component that uses
 * usePathname() to decide how to arrange them.
 */
export default function ConditionalAdminLayout({ children, sidebar, bottomNav, fab }: Props) {
  const pathname = usePathname();

  // Routes that manage their own full-viewport shell (no outer sidebar/bottomnav)
  const isFullViewport = pathname === '/admin/dashboard' || pathname === '/admin/leads';

  if (isFullViewport) {
    return (
      <div className="admin-theme bg-[#F4F8FD] text-[#0B1E33]">
        {fab}
        {children}
      </div>
    );
  }

  return (
    <div className="admin-theme min-h-screen bg-[#F4F8FD] text-[#0B1E33] flex flex-col lg:flex-row">
      {sidebar}
      <main className="flex-1 min-h-screen overflow-x-hidden overflow-y-auto pt-[74px] lg:pt-8 px-4 sm:px-6 lg:px-8 pb-28 lg:pb-14">
        {children}
      </main>
      {bottomNav}
      {fab}
    </div>
  );
}
