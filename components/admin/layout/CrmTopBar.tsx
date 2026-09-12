'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  RefreshCw,
  Plus,
  Bell,
  Menu,
  CalendarDays,
  ShieldCheck,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import type { AuthUser } from '@/lib/rbac';

interface CrmTopBarProps {
  search: string;
  setSearch: (value: string) => void;
  searchPlaceholder?: string;
  onSearchSubmit?: (e: React.FormEvent) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  extraActions?: React.ReactNode;
  onNewLeadClick?: () => void;
  user: AuthUser | null;
  mobileNav: boolean;
  setMobileNav: (open: boolean) => void;
}

export default function CrmTopBar({
  search,
  setSearch,
  searchPlaceholder = 'Search leads, customers, jobs, addresses...',
  onSearchSubmit,
  refreshing = false,
  onRefresh,
  extraActions,
  onNewLeadClick,
  user,
  mobileNav,
  setMobileNav,
}: CrmTopBarProps) {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // ⌘K shortcut
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setShowNotif(false);
        setShowProfile(false);
        setMobileNav(false);
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [setMobileNav]);

  async function handleLogout() {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchSubmit) onSearchSubmit(e);
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="crm-hamburger"
        onClick={() => setMobileNav(!mobileNav)}
        aria-label="Toggle navigation"
      >
        <Menu size={17} />
      </button>

      {/* Top Bar */}
      <div className="crm-top-bar">
        <form onSubmit={handleSubmit} className="crm-search">
          <Search size={17} />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label="Search"
          />
          {search ? (
            <button
              type="button"
              className="crm-search-clear"
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          ) : (
            <kbd>⌘ K</kbd>
          )}
        </form>

        <div className="crm-top-actions">
          {onRefresh && (
            <button
              type="button"
              className="crm-btn"
              onClick={onRefresh}
              disabled={refreshing}
              title="Refresh"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          )}

          {extraActions}

          {onNewLeadClick && (
            <button
              type="button"
              onClick={onNewLeadClick}
              className="crm-btn crm-btn-primary"
            >
              <Plus size={15} />
              <span>New Lead</span>
            </button>
          )}

          {/* Notification Bell */}
          <div className="crm-floating-wrap">
            <button
              type="button"
              className="crm-notif-btn"
              onClick={() => {
                setShowNotif(!showNotif);
                setShowProfile(false);
              }}
              aria-label="Notifications"
              aria-expanded={showNotif}
            >
              <Bell fill="currentColor" size={17} />
            </button>
            {showNotif && (
              <div className="crm-floating-panel crm-notif-panel">
                <strong>Notifications</strong>
                <p
                  style={{
                    fontSize: 11,
                    color: '#94a3b8',
                    padding: '12px 4px',
                    textAlign: 'center',
                    margin: 0,
                  }}
                >
                  No new notifications
                </p>
                <button
                  type="button"
                  style={{ justifyContent: 'center', fontSize: 11 }}
                  onClick={() => {
                    setShowNotif(false);
                    router.push('/admin/tasks');
                  }}
                >
                  <CalendarDays size={13} />
                  <span>View All Tasks</span>
                </button>
              </div>
            )}
          </div>

          {/* User Profile Pill */}
          <div className="crm-floating-wrap">
            <button
              type="button"
              className="crm-profile-pill"
              onClick={() => {
                setShowProfile(!showProfile);
                setShowNotif(false);
              }}
              aria-expanded={showProfile}
            >
              <div className="crm-profile-pill-avatar">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'RU'}
              </div>
              <div className="crm-profile-pill-info">
                <span className="crm-profile-pill-name">{user?.name || 'Staff'}</span>
                <span className="crm-profile-pill-role">{user?.role ? user.role.replace('_', ' ') : 'Estimator'}</span>
              </div>
              <ChevronDown size={13} className="crm-profile-pill-chevron" />
            </button>
            {showProfile && (
              <div className="crm-floating-panel crm-profile-menu">
                <div className="crm-profile-menu-header">
                  <strong>{user?.name || 'Staff User'}</strong>
                  <small>{user?.email || 'team@riseuprac.com'}</small>
                  <span className="crm-profile-menu-role">{user?.role || 'team'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfile(false);
                    router.push('/admin/users');
                  }}
                >
                  <ShieldCheck size={14} />
                  <span>User Directory &amp; RBAC</span>
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={handleLogout}
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
