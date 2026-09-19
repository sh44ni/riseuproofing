import React from 'react';
import { Shield, ShieldCheck, AlertOctagon, ExternalLink, ChevronRight, Award } from 'lucide-react';
import { WarrantySummary } from '@/types/client360Types';

interface ClientWarrantyCardProps {
  warranty: WarrantySummary;
  onViewAll?: () => void;
  onOpenHub?: () => void;
}

export function ClientWarrantyCard({ warranty, onViewAll, onOpenHub }: ClientWarrantyCardProps) {
  return (
    <div className="light-glass-card rounded-2xl p-5 flex flex-col justify-between">
      <div>
        {/* Header matching mockup */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
              <Shield size={16} />
            </div>
            <h3 className="font-bold text-sm text-slate-900 tracking-tight">Warranties & Health</h3>
          </div>

          <button
            onClick={onViewAll}
            className="text-xs font-semibold text-[#0284C7] hover:text-[#0369a1] transition-colors flex items-center gap-0.5"
          >
            <span>View All</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Certificate Display or Empty State (Exact Mockup Layout) */}
        <div className="mt-4">
          {warranty.hasCertificate && warranty.certificates.length > 0 ? (
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50/60 border border-emerald-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  <ShieldCheck size={13} className="text-emerald-700" />
                  Active Certificate
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  {warranty.certificates[0].termYears} Years
                </span>
              </div>
              <div className="font-bold text-xs text-slate-900">
                {warranty.certificates[0].type}
              </div>
              <div className="text-[11px] text-slate-600">
                Cert #{warranty.certificates[0].certNumber} • {warranty.certificates[0].issuer}
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-slate-50/80 border border-dashed border-slate-200 text-center flex flex-col items-center justify-center">
              <Shield size={22} className="text-slate-300 mb-1.5" />
              <div className="text-xs font-medium text-slate-500">
                {warranty.statusText || 'No warranty certificate issued yet'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer matching mockup */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span>Warranties: {warranty.warrantiesCount || warranty.certificates?.length || 0}</span>
        <button
          onClick={onOpenHub}
          className="text-[#0284C7] hover:underline font-semibold flex items-center gap-1"
        >
          <span>Open Warranties Hub</span>
          <ExternalLink size={12} />
        </button>
      </div>
    </div>
  );
}
