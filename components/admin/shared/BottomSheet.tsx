'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxHeight?: string;
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxHeight = 'max-h-[88vh]',
}: BottomSheetProps) {
  // Lock body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Sheet Container */}
      <div
        className={`relative w-full max-w-xl bg-[#141b24] border-t border-x border-white/[0.06] rounded-t-[20px] shadow-[0_8px_40px_rgba(0,0,0,0.4)] flex flex-col z-10 ${maxHeight} transition-transform duration-300 ease-out`}
        onClick={e => e.stopPropagation()}
      >
        {/* Top Handle */}
        <div className="w-full flex justify-center pt-3 pb-1 cursor-grab" onClick={onClose}>
          <div className="w-10 h-1 rounded-full bg-[#d4a447]/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.04] flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-[#f0f2f5] leading-tight">{title}</h2>
            {subtitle && <p className="text-xs text-[#8a95a5] mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.03] hover:bg-white/[0.06] flex items-center justify-center text-[#8a95a5] hover:text-[#f0f2f5] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}
