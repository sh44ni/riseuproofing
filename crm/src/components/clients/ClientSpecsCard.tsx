import React from 'react';
import { Home, Edit3, ShieldAlert, Sparkles, MapPin } from 'lucide-react';
import { RoofSpecs } from '@/types/client360Types';

interface ClientSpecsCardProps {
  specs: RoofSpecs;
  onEdit?: () => void;
}

export function ClientSpecsCard({ specs, onEdit }: ClientSpecsCardProps) {
  return (
    <div className="light-glass-card rounded-2xl p-5 flex flex-col justify-between">
      <div>
        {/* Header matching mockup */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#2F9FE3]">
              <Home size={16} />
            </div>
            <h3 className="font-bold text-sm text-slate-900 tracking-tight">Property & Roof Specs</h3>
          </div>

          <button
            onClick={onEdit}
            className="text-xs font-semibold text-[#0284C7] hover:text-[#0369a1] transition-colors flex items-center gap-1"
          >
            <Edit3 size={12} />
            <span>Edit</span>
          </button>
        </div>

        {/* Spec Data Rows (Exact Mockup Layout) */}
        <div className="divide-y divide-slate-100 text-xs mt-1">
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Address</span>
            <span className="font-semibold text-slate-900 text-right">{specs.address}</span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-500 font-medium">City & ZIP</span>
            <span className="font-semibold text-slate-900 text-right">{specs.cityZip}</span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Roof Material</span>
            <span className="font-bold text-[#0284C7] text-right">{specs.roofMaterial}</span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Roof Area</span>
            <span className="font-semibold text-slate-900 text-right">
              {specs.roofAreaSqFt.toLocaleString()} sq ft
              {specs.roofSquares ? ` (${specs.roofSquares} sq)` : ''}
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Stories / Age</span>
            <span className="font-semibold text-slate-900 text-right">
              {specs.stories} • {specs.roofAgeYears} yrs old
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-500 font-medium">HOA Community</span>
            <span className="font-semibold text-slate-900 text-right">{specs.hoaCommunity}</span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Origin / Source</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {specs.originRepName}
            </span>
          </div>
        </div>
      </div>

      {/* Optional footer info on roof condition */}
      {specs.pitch && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Pitch: <strong className="text-slate-700">{specs.pitch}</strong></span>
          <span>Valleys: <strong className="text-slate-700">{specs.valleysCount || 0}</strong></span>
          <span>Solar: <strong className="text-slate-700">{specs.solarPresent ? 'Yes' : 'None'}</strong></span>
        </div>
      )}
    </div>
  );
}
