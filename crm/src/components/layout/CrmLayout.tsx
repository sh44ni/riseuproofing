import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { CrmSidebar } from './CrmSidebar';
import { CrmTopBar } from './CrmTopBar';
import { CrmRightPanel } from './CrmRightPanel';
import { QuickAddLeadModal } from '@/components/pipeline/QuickAddLeadModal';

export function CrmLayout() {
  const { user, isLoading } = useAuth();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const location = useLocation();
  const centerViewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (centerViewportRef.current) {
      centerViewportRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const isDashboard = location.pathname === '/';
  const isLightGlass =
    location.pathname === '/' ||
    location.pathname.startsWith('/leads') ||
    location.pathname.startsWith('/pipeline') ||
    location.pathname.startsWith('/clients') ||
    location.pathname.startsWith('/estimates') ||
    location.pathname.startsWith('/calendar') ||
    location.pathname.startsWith('/tasks') ||
    location.pathname.startsWith('/reports') ||
    location.pathname.startsWith('/settings') ||
    location.pathname.startsWith('/jobs') ||
    location.pathname.startsWith('/inspections') ||
    location.pathname.startsWith('/finances') ||
    location.pathname.startsWith('/warranties') ||
    location.pathname.startsWith('/marketing');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070B12] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-[#1878B8] border-t-transparent animate-spin" />
          <div className="text-xs font-semibold text-slate-400">Loading Rise Up CRM...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-screen w-full flex bg-[#070B12] text-slate-100 antialiased overflow-hidden">
      {/* Column 1: Left Navigation Sidebar */}
      <CrmSidebar />

      {/* Column 2: Center Viewport */}
      <div
        ref={centerViewportRef}
        className={`flex-1 flex flex-col min-w-0 h-screen ${isDashboard ? 'overflow-hidden' : 'overflow-y-auto'} overflow-x-hidden no-scrollbar relative ${isLightGlass ? 'light-glass-canvas text-slate-800' : 'bg-[#070B12] text-slate-100'}`}
      >
        {isLightGlass && (
          <>
            {/* Architectural Micro-Dot Lattice Pattern for physical glass depth */}
            <div
              className="absolute inset-0 pointer-events-none opacity-30 [background-image:radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px]"
              aria-hidden="true"
            />
            {/* Ambient Coastal Luminous Orbs for physical glass refraction */}
            <div className="absolute -top-24 left-[10%] w-[520px] h-[520px] bg-gradient-to-br from-sky-400/30 via-blue-400/20 to-transparent rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute top-[22%] -right-12 w-[420px] h-[420px] bg-gradient-to-bl from-amber-300/25 via-yellow-200/20 to-transparent rounded-full blur-[90px] pointer-events-none" />
            <div className="absolute top-[48%] left-[5%] w-[480px] h-[480px] bg-gradient-to-tr from-purple-400/20 via-indigo-300/15 to-transparent rounded-full blur-[95px] pointer-events-none" />
            <div className="absolute top-[65%] right-[15%] w-[380px] h-[380px] bg-gradient-to-tl from-emerald-300/20 via-teal-300/15 to-transparent rounded-full blur-[85px] pointer-events-none" />
            <div className="absolute -bottom-16 right-[5%] w-[500px] h-[500px] bg-gradient-to-tr from-cyan-400/25 via-sky-300/20 to-transparent rounded-full blur-[100px] pointer-events-none" />
          </>
        )}
        {!isLightGlass && <CrmTopBar />}
        <main className={`flex-1 min-w-0 min-h-0 relative z-10 ${isDashboard ? 'flex flex-col px-4 py-2' : isLightGlass ? 'px-4 py-2.5' : 'p-6'}`}>
          <Outlet />
        </main>
      </div>

      {/* Column 3: Right Intelligence Cockpit (Skipped on /leads as requested) */}
      {isDashboard && <CrmRightPanel onQuickAdd={() => setShowQuickAdd(true)} />}

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <QuickAddLeadModal isOpen={showQuickAdd} onClose={() => setShowQuickAdd(false)} />
      )}
    </div>
  );
}
