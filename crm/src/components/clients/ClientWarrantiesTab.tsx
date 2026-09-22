import React, { useState } from 'react';
import { Shield, ShieldCheck, Award, Camera, CheckCircle2, AlertTriangle, ExternalLink, Printer, X } from 'lucide-react';
import { WarrantySummary, RoofSpecs, WarrantyCertificate } from '@/types/client360Types';

interface ClientWarrantiesTabProps {
  warranty: WarrantySummary;
  specs: RoofSpecs;
}

export function ClientWarrantiesTab({ warranty, specs }: ClientWarrantiesTabProps) {
  const [selectedCert, setSelectedCert] = useState<WarrantyCertificate | null>(null);
  const photos = warranty.inspectionPhotos || [];

  const handlePrintCertificate = (cert: WarrantyCertificate) => {
    setSelectedCert(cert);
  };

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
                  <button
                    type="button"
                    onClick={() => handlePrintCertificate(cert)}
                    className="text-[#0284C7] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Certificate</span>
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
          <span className="text-xs font-semibold text-slate-500">
            {photos.length} Photo{photos.length === 1 ? '' : 's'} on Record
          </span>
        </div>

        {photos.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500 space-y-1">
            <Camera size={28} className="text-slate-300 mx-auto mb-1" />
            <div className="font-semibold text-slate-700">No Inspection Photos Uploaded Yet</div>
            <p className="text-slate-400 max-w-md mx-auto">
              Drone inspection imagery and roof health documentation will appear here once conducted by field estimators.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photos.map((photo) => (
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
        )}
      </div>

      {/* Certificate Print / View Modal */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-lg shadow-2xl overflow-hidden p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-teal-600" />
                <h3 className="font-bold text-base text-slate-900">Warranty Certificate</h3>
              </div>
              <button
                onClick={() => setSelectedCert(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div className="text-center pb-2 border-b border-slate-200">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Official Warranty Certificate</div>
                <div className="text-base font-black text-slate-900 mt-1">{selectedCert.type}</div>
                <div className="text-xs text-teal-700 font-semibold">{selectedCert.issuer}</div>
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between"><span className="text-slate-500">Certificate Number:</span><span className="font-mono font-bold text-slate-900">{selectedCert.certNumber}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Property Address:</span><span className="font-semibold text-slate-900">{specs.address}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Coverage Term:</span><span className="font-semibold text-slate-900">{selectedCert.termYears} Years ({selectedCert.coverage})</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Expiration Date:</span><span className="font-bold text-emerald-700">{selectedCert.validUntil}</span></div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5"
              >
                <Printer size={14} />
                <span>Print</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCert(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
