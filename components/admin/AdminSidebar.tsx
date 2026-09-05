'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  LogOut,
  X,
  Zap,
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
} from 'lucide-react';
import { AuthUser, ROLE_CONFIG, canAccessPath } from '@/lib/rbac';
import UserAvatar from '@/components/admin/shared/UserAvatar';
import RoleBadge, { RoleIcon } from '@/components/admin/shared/RoleBadge';

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/leads', label: 'Leads', icon: Users },
  { href: '/admin/calendar', label: 'Calendar', icon: Calendar },
  { href: '/admin/inspections', label: 'Inspections', icon: ClipboardCheck },
  { href: '/admin/estimates', label: 'Estimates', icon: FileText },
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

  const roleConfig = user?.role ? ROLE_CONFIG[user.role] : ROLE_CONFIG.owner;

  async function handleLogout() {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
    router.refresh();
  }

  // Filter navigation items by role
  const visibleNav = NAV.filter((item) => canAccessPath(user?.role, item.href));

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div
        className={`flex items-center gap-3 px-5 py-5 border-b border-white/[0.06] ${
          collapsed ? 'justify-center' : ''
        }`}
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d4a447] to-[#c4923a] flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.25)] flex-shrink-0">
          <Zap size={16} className="text-[#f0f2f5]" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-[#f0f2f5] font-bold text-sm leading-none">Rise Up</p>
            <p className="text-[#d4a447]/70 text-[10px] font-medium uppercase tracking-widest mt-0.5">
              Admin
            </p>
          </div>
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
                    ? 'bg-[#d4a447]/[0.12] text-[#d4a447] shadow-inner'
                    : 'text-[#8a95a5] hover:bg-white/[0.03] hover:text-[#f0f2f5]'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
              title={collapsed ? label : undefined}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#d4a447] rounded-r-full shadow-[0_0_8px_rgba(212,164,71,0.3)]" />
              )}
              <Icon
                size={18}
                className={`flex-shrink-0 ${active ? 'text-[#d4a447]' : ''}`}
              />
              {!collapsed && <span>{label}</span>}
              {!collapsed && active && (
                <ChevronRight size={14} className="ml-auto text-[#d4a447]/60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile & Logout Bottom Section */}
      <div className="px-3 pb-4 space-y-2 border-t border-white/[0.06] pt-3">
        {user && !collapsed && (
          <Link
            href="/admin/settings"
            title="Edit My Profile & Avatar"
            className="px-2 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] hover:border-[#d4a447]/30 flex items-center gap-2.5 mb-1 transition-all group block"
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
                <p className="text-xs font-bold text-[#f0f2f5] group-hover:text-[#d4a447] truncate leading-tight transition-colors">
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
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-medium text-[#8a95a5] hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 cursor-pointer ${
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
        className={`hidden lg:flex flex-col h-screen sticky top-0 admin-sidebar-glass border-r border-white/[0.06] transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-56'
        }`}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-7 z-10 w-6 h-6 bg-[#1a2332] border border-white/[0.12] rounded-full flex items-center justify-center text-[#8a95a5] hover:text-[#f0f2f5] transition-colors cursor-pointer"
        >
          {collapsed ? <ChevronRight size={12} /> : <X size={12} />}
        </button>
        <SidebarContent />
      </aside>

      {/* Sleek Native Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 admin-bar-glass border-b border-white/[0.06] flex items-center justify-between px-3.5 h-[52px]">
        <Link href="/admin/dashboard" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#d4a447] to-[#c4923a] flex items-center justify-center shadow-[0_2px_10px_rgba(212,164,71,0.25)] flex-shrink-0 group-active:scale-95 transition-transform">
            <Zap size={14} className="text-[#0c1117] font-black" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#f0f2f5] font-black text-sm tracking-tight">
              Rise Up
            </span>
            <span className="px-1.5 py-0.5 rounded bg-[#d4a447]/15 border border-[#d4a447]/30 text-[#d4a447] text-[10px] font-bold uppercase tracking-wider">
              CRM
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {user && (
            <Link
              href="/admin/settings"
              className="flex items-center gap-2 py-1 pl-1.5 pr-2.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] active:scale-95 transition-all"
            >
              <UserAvatar
                name={user.name}
                avatarUrl={user.avatar_url}
                role={user.role}
                size="sm"
                showStatus
              />
              <span className="text-xs font-semibold text-[#f0f2f5] max-w-[90px] truncate">
                {user.name.split(' ')[0]}
              </span>
              <RoleIcon role={user.role} size={13} className="text-[#d4a447]" />
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
