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
  Calculator,
} from 'lucide-react';
import { AuthUser, ROLE_CONFIG, canAccessPath } from '@/lib/rbac';
import UserAvatar from '@/components/admin/shared/UserAvatar';
import RoleBadge from '@/components/admin/shared/RoleBadge';

interface MoreMenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
  user?: AuthUser | null;
}

export default function MoreMenuSheet({ isOpen, onClose, user }: MoreMenuSheetProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    window.location.href = '/admin/login';
  }

  if (!isOpen) return null;

  const roleConfig = user?.role ? ROLE_CONFIG[user.role] : ROLE_CONFIG.owner;

  const ALL_SECTIONS = [
    {
      title: 'Field Operations',
      items: [
        { href: '/admin/calendar', label: 'Operations Calendar', icon: Calendar, color: 'text-amber-700', bg: 'bg-amber-100' },
        { href: '/admin/inspections', label: 'Roof Inspections', icon: ClipboardCheck, color: 'text-emerald-700', bg: 'bg-emerald-100' },
        { href: '/admin/crew', label: 'Crew & Dispatch', icon: HardHat, color: 'text-orange-700', bg: 'bg-orange-100' },
        { href: '/admin/warranties', label: '50-Yr Warranties', icon: ShieldCheck, color: 'text-teal-700', bg: 'bg-teal-100' },
      ],
    },
    {
      title: 'Sales & Cash Flow',
      items: [
        { href: '/admin/finances', label: 'Finances & Invoices', icon: DollarSign, color: 'text-emerald-700', bg: 'bg-emerald-100' },
        { href: '/admin/reports', label: 'Executive Reports', icon: PieChart, color: 'text-indigo-700', bg: 'bg-indigo-100' },
        { href: '/admin/tasks', label: 'Tasks & Follow-ups', icon: CheckSquare, color: 'text-purple-700', bg: 'bg-purple-100' },
      ],
    },
    {
      title: 'Customer & Marketing',
      items: [
        { href: '/admin/reviews', label: 'Customer Reviews', icon: Star, color: 'text-amber-700', bg: 'bg-amber-100' },
        { href: '/admin/templates', label: 'Template Studio', icon: MessageSquareCode, color: 'text-cyan-700', bg: 'bg-cyan-100' },
        { href: '/admin/analytics', label: 'Web & Marketing', icon: BarChart3, color: 'text-blue-700', bg: 'bg-blue-100' },
      ],
    },
    {
      title: 'System & Security',
      items: [
        { href: '/admin/estimator', label: 'Estimator Settings', icon: Calculator, color: 'text-blue-700', bg: 'bg-blue-100' },
        { href: '/admin/users', label: 'Team & Roles', icon: ShieldCheck, color: 'text-sky-700', bg: 'bg-sky-100' },
        { href: '/admin/settings', label: 'CRM Settings & Backup', icon: Settings, color: 'text-slate-700', bg: 'bg-slate-100' },
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
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-lg bg-white/92 backdrop-blur-2xl border-t border-white/80 rounded-t-[32px] shadow-[0_-12px_40px_rgba(11,30,51,0.15),inset_0_1px_1px_rgba(255,255,255,0.95)] z-10 pb-8 px-5 pt-3.5 max-h-[85vh] overflow-y-auto">
        {/* Drag Handle Indicator */}
        <div className="w-12 h-1.5 rounded-full bg-slate-300/80 mx-auto mb-3.5" />

        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/60 mb-4">
          {user ? (
            <Link
              href="/admin/settings"
              onClick={onClose}
              className="flex items-center gap-3 min-w-0 group hover:opacity-90 transition-opacity apple-spring-press"
              title="Edit Profile & Avatar"
            >
              <UserAvatar
                name={user.name}
                avatarUrl={user.avatar_url}
                role={user.role}
                size="md"
                showStatus
              />
              <div className="min-w-0">
                <h2 className="text-sm font-black text-[#0B1E33] group-hover:text-[#1878B8] truncate transition-colors">
                  {user.name}
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <RoleBadge role={user.role} size="xs" />
                </div>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-3 min-w-0">
              <div className="min-w-0">
                <h2 className="text-sm font-black text-[#0B1E33] truncate">
                  Operations &amp; Management
                </h2>
                <p className="text-[11px] text-slate-500">Rise Up Roofing &amp; Construction CRM</p>
              </div>
            </div>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200/80 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer transition-colors flex-shrink-0 apple-spring-press"
          >
            <X size={16} />
          </button>
        </div>

        {/* Categorized Sections */}
        <div className="space-y-4 mb-5">
          {filteredSections.map((sec) => (
            <div key={sec.title} className="space-y-1.5">
              <span className="admin-section-label px-1 block text-slate-500">
                {sec.title}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-white/70 hover:bg-white border border-slate-200/70 hover:border-[#2F9FE3]/30 shadow-2xs hover:shadow-xs transition-all duration-200 group apple-spring-press"
                    >
                      <div className={`w-8 h-8 rounded-xl ${item.bg} ${item.color} flex items-center justify-center flex-shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}>
                        <Icon size={16} />
                      </div>
                      <span className="text-xs font-semibold text-slate-700 group-hover:text-[#0B1E33] truncate">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="w-full py-3 px-4 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <LogOut size={15} />
          Sign Out ({user?.name || 'Admin'})
        </button>
      </div>
    </div>
  );
}
