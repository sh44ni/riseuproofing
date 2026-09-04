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

  function triggerAction(action: () => void | undefined, fallbackEvent: string) {
    setOpen(false);
    if (action) {
      action();
    } else {
      window.dispatchEvent(new CustomEvent(fallbackEvent));
    }
  }

  return (
    <div className="fixed right-4 bottom-20 lg:bottom-6 z-40 flex flex-col items-end gap-3">
      {/* Dim overlay when open */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Speed Dial Menu Items */}
      {open && (
        <div className="flex flex-col items-end gap-2.5 z-40 transition-all duration-200">
          {/* New Estimate */}
          <div className="flex items-center gap-2">
            <span className="bg-slate-800 text-white text-xs font-semibold px-2.5 py-1 rounded-lg border border-white/10 shadow-lg">
              New Estimate
            </span>
            <button
              onClick={() => {
                setOpen(false);
                router.push('/admin/estimates/new');
              }}
              className="w-11 h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer font-bold"
              title="New Estimate"
            >
              <FileText size={18} />
            </button>
          </div>

          {/* Add Task */}
          <div className="flex items-center gap-2">
            <span className="bg-slate-800 text-white text-xs font-semibold px-2.5 py-1 rounded-lg border border-white/10 shadow-lg">
              Add Task
            </span>
            <button
              onClick={() => triggerAction(onAddTask!, 'crm:open-add-task')}
              className="w-11 h-11 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              title="Add Task"
            >
              <CheckSquare size={18} />
            </button>
          </div>

          {/* Log Call */}
          <div className="flex items-center gap-2">
            <span className="bg-slate-800 text-white text-xs font-semibold px-2.5 py-1 rounded-lg border border-white/10 shadow-lg">
              Log Call
            </span>
            <button
              onClick={() => triggerAction(onLogCall!, 'crm:open-log-call')}
              className="w-11 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              title="Log Call"
            >
              <PhoneCall size={18} />
            </button>
          </div>

          {/* Add Lead */}
          <div className="flex items-center gap-2">
            <span className="bg-slate-800 text-white text-xs font-semibold px-2.5 py-1 rounded-lg border border-white/10 shadow-lg">
              New Lead
            </span>
            <button
              onClick={() => triggerAction(onAddLead!, 'crm:open-add-lead')}
              className="w-11 h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              title="New Lead"
            >
              <UserPlus size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Main FAB Toggle */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 font-bold shadow-xl flex items-center justify-center transition-all duration-300 z-40 hover:scale-105 active:scale-95 cursor-pointer border border-amber-300/30 ${
          open ? 'rotate-45 shadow-amber-500/30' : ''
        }`}
        aria-label="Quick actions"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>
    </div>
  );
}
