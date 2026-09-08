'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  LogOut,
  X,
  ChevronRight,
  CheckSquare,
  FileText,
  Hammer,
  DollarSign,
  PieChart,
  HardHat,
  ShieldCheck,
  Calendar,
  ClipboardCheck,
  MessageSquareCode,
  Star,
  UserCheck,
  Calculator,
  GitFork,
} from 'lucide-react';
import { AuthUser, ROLE_CONFIG, canAccessPath } from '@/lib/rbac';
import UserAvatar from '@/components/admin/shared/UserAvatar';
import RoleBadge, { RoleIcon } from '@/components/admin/shared/RoleBadge';

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/pipeline', label: 'Sales Pipeline', icon: GitFork },
  { href: '/admin/leads', label: 'Leads', icon: Users },
  { href: '/admin/clients', label: 'Clients 360', icon: UserCheck },
  { href: '/admin/calendar', label: 'Calendar', icon: Calendar },
  { href: '/admin/inspections', label: 'Inspections', icon: ClipboardCheck },
  { href: '/admin/estimates', label: 'Estimates', icon: FileText },
  { href: '/admin/estimator', label: 'Estimator Settings', icon: Calculator },
  { href: '/admin/jobs', label: 'Jobs', icon: Hammer },
  { href: '/admin/crew', label: 'Crew', icon: HardHat },
  { href: '/admin/warranties', label: 'Warranties', icon: ShieldCheck },
  { href: '/admin/finances', label: 'Finances', icon: DollarSign },
  { href: '/admin/reports', label: 'Reports', icon: PieChart },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/templates', label: 'Templates', icon: MessageSquareCode },
  { href: '/admin/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/admin/users', label: 'Team & Roles', icon: ShieldCheck },
  { href: '/admin/analytics', label: 'Web & Marketing', icon: BarChart3 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

interface AdminSidebarProps {
  user?: AuthUser | null;
}

export default function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const roleConfig = (user?.role && (ROLE_CONFIG as Record<string, any>)[user.role]) || ROLE_CONFIG.owner;

  async function handleLogout() {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    window.location.href = '/admin/login';
  }

  // Filter navigation items by dynamic user permissions (§10)
  const visibleNav = NAV.filter((item) => canAccessPath(user, item.href));

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div
        className={`flex items-center px-4 py-4.5 border-b border-slate-200/80 ${
          collapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        {collapsed ? (
          <Link href="/admin/dashboard" title="Rise Up Roofing CRM" className="flex items-center justify-center">
            <Image
              src="/favicon.svg"
              alt="Rise Up"
              width={32}
              height={32}
              priority
              className="h-8 w-8 object-contain drop-shadow-xs"
            />
          </Link>
        ) : (
          <Link href="/admin/dashboard" className="flex items-center justify-between w-full group">
            <Image
              src="/logo.svg"
              alt="Rise Up Roofing & Construction"
              width={130}
              height={40}
              priority
              className="h-8 w-auto object-contain transition-transform group-hover:scale-[1.02]"
            />
            <span className="px-1.5 py-0.5 rounded-md bg-sky-50 border border-sky-200/90 text-[#0284C7] text-[10px] font-extrabold tracking-wider uppercase shadow-2xs">
              CRM
            </span>
          </Link>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleNav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative cursor-pointer
                ${
                  active
                    ? 'bg-gradient-to-r from-sky-50 via-sky-50/70 to-blue-50/30 text-[#0284C7] font-bold shadow-2xs border-l-[3px] border-[#2F9FE3]'
                    : 'text-slate-600 hover:bg-slate-100/70 hover:text-[#0B1E33] hover:translate-x-0.5'
                }
                ${collapsed ? 'justify-center !border-l-0' : ''}
              `}
              title={collapsed ? label : undefined}
            >
              {active && collapsed && (
                <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#2F9FE3] rounded-full shadow-[0_0_8px_rgba(47,159,227,0.5)]" />
              )}
              <Icon
                size={18}
                className={`flex-shrink-0 transition-colors ${active ? 'text-[#0284C7]' : 'text-slate-500 group-hover:text-[#0B1E33]'}`}
              />
              {!collapsed && <span>{label}</span>}
              {!collapsed && active && (
                <ChevronRight size={14} className="ml-auto text-[#0284C7]/80" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile & Logout Bottom Section */}
      <div className="px-3 pb-4 space-y-2 border-t border-slate-200/80 pt-3">
        {user && !collapsed && (
          <Link
            href="/admin/settings"
            title="Edit My Profile & Avatar"
            className="px-2 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-[#2F9FE3]/40 flex items-center gap-2.5 mb-1 transition-all group block"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <UserAvatar
                name={user.name}
                avatarUrl={user.avatar_url}
                role={user.role}
                size="sm"
                showStatus
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[#0B1E33] group-hover:text-[#1878B8] truncate leading-tight transition-colors">
                  {user.name}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <RoleBadge role={user.role} size="xs" />
                </div>
              </div>
            </div>
          </Link>
        )}

        {user && collapsed && (
          <div className="flex justify-center mb-1">
            <Link href="/admin/settings" title={`${user.name} (Edit Profile)`}>
              <UserAvatar
                name={user.name}
                avatarUrl={user.avatar_url}
                role={user.role}
                size="sm"
                showStatus
              />
            </Link>
          </div>
        )}

        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 cursor-pointer ${
            collapsed ? 'justify-center' : ''
          }`}
          title="Sign Out"
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && <span className="text-xs">Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col h-screen sticky top-0 admin-sidebar-glass border-r border-slate-200/80 transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-56'
        }`}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-7 z-10 w-6 h-6 bg-white border border-slate-200 shadow-xs rounded-full flex items-center justify-center text-slate-500 hover:text-[#0B1E33] transition-colors cursor-pointer"
        >
          {collapsed ? <ChevronRight size={12} /> : <X size={12} />}
        </button>
        <SidebarContent />
      </aside>

      {/* Sleek Apple Liquid Glass Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 admin-bar-glass border-b border-white/70 flex items-center justify-between px-4 h-[56px] shadow-[0_2px_12px_rgba(11,30,51,0.03)]">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5 group apple-spring-press">
          <Image
            src="/favicon.svg"
            alt="Rise Up Roofing"
            width={28}
            height={28}
            priority
            className="h-7 w-7 object-contain drop-shadow-xs group-hover:scale-105 transition-transform"
          />
          <div className="flex items-center gap-1.5">
            <span className="text-[#0B1E33] font-black text-sm tracking-tight">
              Rise Up
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200/90 text-[#0284C7] text-[10px] font-extrabold uppercase tracking-wider shadow-2xs">
              CRM
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {user && (
            <Link
              href="/admin/settings"
              className="flex items-center gap-2 py-1 pl-1.5 pr-2.5 rounded-full bg-white/85 backdrop-blur-md hover:bg-white border border-white/90 shadow-[0_2px_8px_rgba(11,30,51,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] apple-spring-press"
            >
              <UserAvatar
                name={user.name}
                avatarUrl={user.avatar_url}
                role={user.role}
                size="sm"
                showStatus
              />
              <span className="text-xs font-bold text-[#0B1E33] max-w-[95px] truncate">
                {user.name.split(' ')[0]}
              </span>
              <RoleIcon role={user.role} size={13} className="text-[#2F9FE3]" />
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
