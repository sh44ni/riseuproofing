'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, UserPlus, PhoneCall, CheckSquare, FileText } from 'lucide-react';

interface FABProps {
  onAddLead?: () => void;
  onAddTask?: () => void;
  onLogCall?: () => void;
}

export default function FAB({ onAddLead, onAddTask, onLogCall }: FABProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

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

      {/* FAB Floating Container: sits above BottomNav on mobile (calc(4.75rem + safe-area)) */}
      <div className="fixed right-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] lg:bottom-6 z-50 flex flex-col items-end gap-3 pointer-events-auto select-none">
        {/* Speed Dial Menu Items */}
        {open && (
          <div className="flex flex-col items-end gap-2.5 z-50 transition-all duration-200">
            {/* New Estimate */}
            <button
              type="button"
              onClick={handleNewEstimate}
              className="flex items-center gap-2 group cursor-pointer"
            >
              <span className="bg-white text-[#0B1E33] text-xs font-bold px-3 py-1.5 rounded-[10px] border border-slate-200 shadow-md group-hover:bg-slate-50 transition-colors">
                New Estimate
              </span>
              <div className="w-11 h-11 rounded-[14px] bg-[#EAA636] hover:bg-[#D97706] text-white shadow-[0_4px_16px_rgba(234,166,54,0.3)] flex items-center justify-center transition-transform group-hover:scale-105 active:scale-95 font-bold">
                <FileText size={18} />
              </div>
            </button>

            {/* Add Task */}
            <button
              type="button"
              onClick={handleAddTask}
              className="flex items-center gap-2 group cursor-pointer"
            >
              <span className="bg-white text-[#0B1E33] text-xs font-bold px-3 py-1.5 rounded-[10px] border border-slate-200 shadow-md group-hover:bg-slate-50 transition-colors">
                Add Task
              </span>
              <div className="w-11 h-11 rounded-[14px] bg-purple-600 hover:bg-purple-500 text-white shadow-[0_4px_16px_rgba(168,85,247,0.3)] flex items-center justify-center transition-transform group-hover:scale-105 active:scale-95">
                <CheckSquare size={18} />
              </div>
            </button>

            {/* Log Call */}
            <button
              type="button"
              onClick={handleLogCall}
              className="flex items-center gap-2 group cursor-pointer"
            >
              <span className="bg-white text-[#0B1E33] text-xs font-bold px-3 py-1.5 rounded-[10px] border border-slate-200 shadow-md group-hover:bg-slate-50 transition-colors">
                Log Call
              </span>
              <div className="w-11 h-11 rounded-[14px] bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_4px_16px_rgba(16,185,129,0.3)] flex items-center justify-center transition-transform group-hover:scale-105 active:scale-95">
                <PhoneCall size={18} />
              </div>
            </button>

            {/* Add Lead */}
            <button
              type="button"
              onClick={handleAddLead}
              className="flex items-center gap-2 group cursor-pointer"
            >
              <span className="bg-white text-[#0B1E33] text-xs font-bold px-3 py-1.5 rounded-[10px] border border-slate-200 shadow-md group-hover:bg-slate-50 transition-colors">
                New Lead
              </span>
              <div className="w-11 h-11 rounded-[14px] bg-[#2F9FE3] hover:bg-[#1878B8] text-white shadow-[0_4px_16px_rgba(47,159,227,0.3)] flex items-center justify-center transition-transform group-hover:scale-105 active:scale-95">
                <UserPlus size={18} />
              </div>
            </button>
          </div>
        )}

        {/* Main FAB Toggle */}
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={`w-14 h-14 rounded-[18px] bg-gradient-to-br from-[#2F9FE3] to-[#1878B8] text-white font-bold shadow-[0_4px_20px_rgba(47,159,227,0.35)] flex items-center justify-center transition-all duration-300 ease-out z-50 hover:scale-105 active:scale-95 cursor-pointer border border-[#2F9FE3]/40 ${
            open ? 'rotate-45 shadow-[0_8px_30px_rgba(47,159,227,0.5)]' : ''
          }`}
          aria-label="Quick actions"
          aria-expanded={open}
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>
      </div>
    </>
  );
}
