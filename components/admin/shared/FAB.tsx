'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Plus, UserPlus, PhoneCall, CheckSquare, FileText } from 'lucide-react';

interface FABProps {
  onAddLead?: () => void;
  onAddTask?: () => void;
  onLogCall?: () => void;
}

export default function FAB({ onAddLead, onAddTask, onLogCall }: FABProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Smart Context-Aware Visibility:
  // Hide on multi-step wizards, editors, and detailed document builders so mobile inputs, steppers, and save buttons are NEVER obstructed
  const isWizardOrEditor =
    pathname?.startsWith('/admin/estimates/new') ||
    pathname?.startsWith('/admin/estimates/') ||
    pathname?.startsWith('/admin/inspections/new') ||
    pathname?.includes('/jobs/') ||
    pathname === '/admin/login';

  if (isWizardOrEditor) {
    return null;
  }

  function handleNewEstimate() {
    setOpen(false);
    router.push('/admin/estimates/new');
  }

  function handleAddTask() {
    setOpen(false);
    if (onAddTask) {
      onAddTask();
    } else if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin/tasks')) {
      window.dispatchEvent(new CustomEvent('crm:open-add-task'));
    } else {
      router.push('/admin/tasks?new=1');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('crm:open-add-task'));
      }
    }
  }

  function handleLogCall() {
    setOpen(false);
    if (onLogCall) {
      onLogCall();
    } else if (typeof window !== 'undefined' && window.location.pathname.includes('/admin/leads/')) {
      window.dispatchEvent(new CustomEvent('crm:open-log-call'));
    } else {
      router.push('/admin/analytics?tab=calls');
    }
  }

  function handleAddLead() {
    setOpen(false);
    if (onAddLead) {
      onAddLead();
    } else if (
      typeof window !== 'undefined' &&
      window.location.pathname.startsWith('/admin/leads') &&
      !window.location.pathname.includes('/admin/leads/')
    ) {
      window.dispatchEvent(new CustomEvent('crm:open-add-lead'));
    } else {
      router.push('/admin/leads?new=1');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('crm:open-add-lead'));
      }
    }
  }

  return (
    <>
      {/* Dim overlay when open */}
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* FAB Floating Container: sits above BottomNav on mobile */}
      <div className="fixed right-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] lg:bottom-6 z-50 flex flex-col items-end gap-3 pointer-events-auto select-none">
        {/* Speed Dial Menu Items */}
        {open && (
          <div className="flex flex-col items-end gap-2.5 z-50 transition-all duration-200">
            {/* New Estimate */}
            <button
              type="button"
              onClick={handleNewEstimate}
              className="flex items-center gap-2.5 group cursor-pointer apple-spring-press"
            >
              <span className="bg-white/90 backdrop-blur-md text-[#0B1E33] text-xs font-bold px-3 py-1.5 rounded-xl border border-white/80 shadow-[0_4px_14px_rgba(11,30,51,0.08)] group-hover:bg-white transition-colors">
                New Estimate
              </span>
              <div className="w-11 h-11 rounded-[16px] bg-gradient-to-br from-[#FBBF24] via-[#EAA636] to-[#D97706] text-white shadow-[0_6px_20px_rgba(234,166,54,0.4),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-white/30 flex items-center justify-center transition-transform group-hover:scale-105 font-bold">
                <FileText size={18} />
              </div>
            </button>

            {/* Add Task */}
            <button
              type="button"
              onClick={handleAddTask}
              className="flex items-center gap-2.5 group cursor-pointer apple-spring-press"
            >
              <span className="bg-white/90 backdrop-blur-md text-[#0B1E33] text-xs font-bold px-3 py-1.5 rounded-xl border border-white/80 shadow-[0_4px_14px_rgba(11,30,51,0.08)] group-hover:bg-white transition-colors">
                Add Task
              </span>
              <div className="w-11 h-11 rounded-[16px] bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 text-white shadow-[0_6px_20px_rgba(168,85,247,0.4),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-white/30 flex items-center justify-center transition-transform group-hover:scale-105">
                <CheckSquare size={18} />
              </div>
            </button>

            {/* Log Call */}
            <button
              type="button"
              onClick={handleLogCall}
              className="flex items-center gap-2.5 group cursor-pointer apple-spring-press"
            >
              <span className="bg-white/90 backdrop-blur-md text-[#0B1E33] text-xs font-bold px-3 py-1.5 rounded-xl border border-white/80 shadow-[0_4px_14px_rgba(11,30,51,0.08)] group-hover:bg-white transition-colors">
                Log Call
              </span>
              <div className="w-11 h-11 rounded-[16px] bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 text-white shadow-[0_6px_20px_rgba(16,185,129,0.4),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-white/30 flex items-center justify-center transition-transform group-hover:scale-105">
                <PhoneCall size={18} />
              </div>
            </button>

            {/* Add Lead */}
            <button
              type="button"
              onClick={handleAddLead}
              className="flex items-center gap-2.5 group cursor-pointer apple-spring-press"
            >
              <span className="bg-white/90 backdrop-blur-md text-[#0B1E33] text-xs font-bold px-3 py-1.5 rounded-xl border border-white/80 shadow-[0_4px_14px_rgba(11,30,51,0.08)] group-hover:bg-white transition-colors">
                New Lead
              </span>
              <div className="w-11 h-11 rounded-[16px] bg-gradient-to-br from-[#38BDF8] via-[#2F9FE3] to-[#0284C7] text-white shadow-[0_6px_20px_rgba(47,159,227,0.4),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-white/30 flex items-center justify-center transition-transform group-hover:scale-105">
                <UserPlus size={18} />
              </div>
            </button>
          </div>
        )}

        {/* Main Apple Liquid Glass FAB Orb */}
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={`w-13 h-13 rounded-[20px] bg-gradient-to-br from-[#38BDF8] via-[#2F9FE3] to-[#0284C7] text-white font-bold shadow-[0_8px_25px_rgba(47,159,227,0.45),inset_0_1px_1.5px_rgba(255,255,255,0.7)] flex items-center justify-center transition-all duration-300 ease-out z-50 hover:scale-105 active:scale-90 cursor-pointer border border-white/35 ${
            open ? 'rotate-45 shadow-[0_12px_32px_rgba(47,159,227,0.6)]' : ''
          }`}
          aria-label="Quick actions"
          aria-expanded={open}
        >
          <Plus size={24} strokeWidth={2.6} />
        </button>
      </div>
    </>
  );
}
