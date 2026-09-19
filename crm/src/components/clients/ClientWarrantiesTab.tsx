import React from 'react';
import { Shield, ShieldCheck, Award, Camera, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { WarrantySummary, RoofSpecs } from '@/types/client360Types';

interface ClientWarrantiesTabProps {
  warranty: WarrantySummary;
  specs: RoofSpecs;
}

const DEFAULT_INSPECTION_PHOTOS = [
  {
    id: 'p1',
    title: 'Ridge Cap & Flashing Inspection',
    url: 'https://images.unsplash.com/photo-1632759145351-1d592919f522?auto=format&fit=crop&w=600&q=80',
    severity: 'Good Condition',
  },
  {
    id: 'p2',
    title: 'Valley Metal & Underlayment',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
    severity: 'Satisfactory',
  },
  {
    id: 'p3',
    title: 'Chimney Flashing & Counter-Flashing',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
    severity: 'Verified Pass',
  },
  {
    id: 'p4',
    title: 'Eaves & Gutter Drip Edge',
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=600&q=80',
    severity: 'Verified Pass',
  },
];

export function ClientWarrantiesTab({ warranty, specs }: ClientWarrantiesTabProps) {

  return (
    <div className="space-y-6">
      {/* Warranty Certificate Section */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Award size={18} className="text-teal-600" />
            <h3 className="font-bold text-sm text-slate-900">Warranty Certificates & System Guarantee</h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {warranty.certificates.length} Active Certificate{warranty.certificates.length === 1 ? '' : 's'}
          </span>
        </div>

        {warranty.certificates.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500 space-y-1">
            <Shield size={28} className="text-slate-300 mx-auto mb-1" />
            <div className="font-semibold text-slate-700">No Official Warranty Issued Yet</div>
            <p className="text-slate-400 max-w-md mx-auto">
              Warranty certificates are automatically generated upon final job inspection and permit sign-off by the City.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {warranty.certificates.map((cert) => (
              <div
                key={cert.id}
                className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/80 via-teal-50/40 to-sky-50/30 border border-emerald-200/90 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-900">{cert.type}</h4>
                      <p className="text-xs text-teal-700 font-medium">Issuer: {cert.issuer}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {cert.termYears}-Year Term
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/80 border border-slate-200/80 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Certificate #:</span>
                    <span className="font-mono font-bold text-slate-800">{cert.certNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Coverage:</span>
                    <span className="font-medium text-slate-800">{cert.coverage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Valid Through:</span>
                    <span className="font-bold text-emerald-700">{cert.validUntil}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={13} />
                    <span>Manufacturer Registered</span>
                  </span>
                  <button className="text-[#0284C7] font-semibold hover:underline flex items-center gap-1">
                    <span>View PDF</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inspection Evidence & Photos */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-[#0284C7]" />
            <h3 className="font-bold text-sm text-slate-900">Roof Inspection Photographic Evidence</h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">Documented by Estimator</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {DEFAULT_INSPECTION_PHOTOS.map((photo) => (
            <div key={photo.id} className="rounded-xl overflow-hidden border border-slate-200 group bg-slate-50">
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-medium backdrop-blur-sm">
                  {photo.severity}
                </span>
              </div>
              <div className="p-2.5">
                <div className="font-semibold text-xs text-slate-900 truncate">{photo.title}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{specs.address}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
