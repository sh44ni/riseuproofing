'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  Settings,
  LogOut,
  X,
  CheckSquare,
  DollarSign,
  PieChart,
  HardHat,
  ShieldCheck,
  Calendar,
  ClipboardCheck,
  MessageSquareCode,
  Star,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { AuthUser, ROLE_CONFIG, canAccessPath } from '@/lib/rbac';

interface MoreMenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
  user?: AuthUser | null;
}

export default function MoreMenuSheet({ isOpen, onClose, user }: MoreMenuSheetProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
    router.refresh();
  }

  if (!isOpen) return null;

  const roleConfig = user?.role ? ROLE_CONFIG[user.role] : ROLE_CONFIG.owner;

  const ALL_SECTIONS = [
    {
      title: 'Field Operations',
      items: [
        { href: '/admin/calendar', label: 'Operations Calendar', icon: Calendar, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        { href: '/admin/inspections', label: 'Roof Inspections', icon: ClipboardCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { href: '/admin/crew', label: 'Crew & Dispatch', icon: HardHat, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
        { href: '/admin/warranties', label: '50-Yr Warranties', icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
      ],
    },
    {
      title: 'Sales & Cash Flow',
      items: [
        { href: '/admin/finances', label: 'Finances & Invoices', icon: DollarSign, color: 'text-teal-400', bg: 'bg-teal-500/10' },
        { href: '/admin/reports', label: 'Executive Reports', icon: PieChart, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
        { href: '/admin/tasks', label: 'Tasks & Follow-ups', icon: CheckSquare, color: 'text-purple-400', bg: 'bg-purple-500/10' },
      ],
    },
    {
      title: 'Customer & Marketing',
      items: [
        { href: '/admin/reviews', label: 'Customer Reviews', icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        { href: '/admin/templates', label: 'Template Studio', icon: MessageSquareCode, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
        { href: '/admin/analytics', label: 'Web & Marketing', icon: BarChart3, color: 'text-blue-400', bg: 'bg-blue-500/10' },
      ],
    },
    {
      title: 'System & Security',
      items: [
        { href: '/admin/users', label: 'Team & Roles', icon: ShieldCheck, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        { href: '/admin/settings', label: 'CRM Settings & Backup', icon: Settings, color: 'text-slate-300', bg: 'bg-white/5' },
      ],
    },
  ];

  // Filter sections by role
  const filteredSections = ALL_SECTIONS.map((sec) => ({
    ...sec,
    items: sec.items.filter((item) => canAccessPath(user?.role, item.href)),
  })).filter((sec) => sec.items.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-lg bg-slate-900 border-t border-white/15 rounded-t-3xl shadow-2xl z-10 pb-8 px-5 pt-3.5 max-h-[85vh] overflow-y-auto">
        {/* Drag Handle Indicator */}
        <div className="w-12 h-1.5 rounded-full bg-slate-700 mx-auto mb-3" />

        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div>
            <h2 className="text-base font-black text-white">Operations &amp; Management</h2>
            {user ? (
              <p className="text-[11px] text-amber-400 font-semibold flex items-center gap-1.5">
                <span>{roleConfig.icon}</span>
                <span>{user.name}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">{roleConfig.label}</span>
              </p>
            ) : (
              <p className="text-[11px] text-slate-400">Rise Up Roofing &amp; Construction CRM</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Categorized Sections */}
        <div className="space-y-4 mb-5">
          {filteredSections.map((sec) => (
            <div key={sec.title} className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-1 block">
                {sec.title}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {sec.items.map(({ href, label, icon: Icon, color, bg }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-800/70 hover:bg-slate-800 border border-white/5 transition-all group cursor-pointer"
                  >
                    <div className={`w-9 h-9 rounded-xl ${bg} ${color} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                      <Icon size={18} />
                    </div>
                    <span className="text-xs font-semibold text-slate-200 leading-tight">
                      {label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="w-full py-3 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <LogOut size={15} />
          Sign Out ({user?.name || 'Admin'})
        </button>
      </div>
    </div>
  );
}
