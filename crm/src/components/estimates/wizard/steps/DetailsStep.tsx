import React, { useState, useEffect, useRef } from 'react';
import { TwoOptionsEstimate } from '@/types/estimateContractTypes';
import { ESTIMATE_FIELD_CAPS } from '@/data/estimateConstants';
import { FieldWithCap } from '../FieldWithCap';
import { Calendar, Search, Upload, Lock, User, MapPin, Phone, Mail, Image, Check } from 'lucide-react';
import { api, API_ORIGIN } from '@/lib/api';

const getImgSrc = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
};

interface StepProps {
  data: TwoOptionsEstimate;
  onDataChange: (updates: Partial<TwoOptionsEstimate>) => void;
}

export function DetailsStep({ data, onDataChange }: StepProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [leads, setLeads] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Pipeline stages where estimate creation is appropriate
  const ESTIMATE_READY_STAGES = [
    'est_scheduled',
    'inspection_scheduled',
    'inspection_completed',
    'estimate_building',
    'stage_3_site_visit_estimate',
  ].join(',');

  useEffect(() => {
    if (!searchQuery.trim()) {
      setLeads([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.request(
          `/admin/leads?search=${encodeURIComponent(searchQuery)}&limit=15`
        );
        // Filter client-side for estimate-ready pipeline stages
        const all = (res as any).leads || [];
        const filtered = all.filter((l: any) =>
          ESTIMATE_READY_STAGES.split(',').includes(l.pipeline_stage)
        );
        setLeads(filtered);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectLead = (lead: any) => {
    const name = lead.full_name || lead.name || '';
    const address = lead.address || '';
    const city = lead.city || '';
    const zip = lead.zip || '';
    const property = [address, city, zip].filter(Boolean).join(', ');
    
    onDataChange({
      client: {
        leadId: String(lead.id),
        name,
        property,
        phone: lead.phone || '',
        email: lead.email || '',
      }
    });
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    onDataChange({ proposalDate: date.toISOString() });
  };

  const formattedDate = data.proposalDate 
    ? new Date(data.proposalDate).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await api.request('/admin/estimates/upload-photo', {
        method: 'POST',
        body: formData,
      });
      if (res.url) {
        onDataChange({
          photo1: { url: res.url, filename: file.name, focalPoint: { x: 0.5, y: 0.5 } }
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFocalPointClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!data.photo1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    onDataChange({
      photo1: { ...data.photo1, focalPoint: { x, y } }
    });
  };

  return (
    <div className="space-y-8">
      {/* Date */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
          <Calendar size={14} /> Proposal Date
        </label>
        <input 
          type="date"
          value={formattedDate}
          onChange={handleDateChange}
          className="w-full px-4 py-2.5 liquid-glass-input rounded-xl text-sm font-medium text-slate-800"
        />
      </div>

      {/* Client */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Client Details</h3>
        
        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search estimate-ready leads by name, phone, address..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#1a5ba5] transition-colors"
            />
          </div>
          
          {showDropdown && (searchQuery.trim() !== '') && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-60 overflow-auto">
              {isSearching ? (
                <div className="p-3 text-sm text-slate-500 text-center">Searching...</div>
              ) : leads.length > 0 ? (
                leads.map(lead => (
                  <div 
                    key={lead.id} 
                    onClick={() => handleSelectLead(lead)}
                    className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm text-slate-800">{lead.full_name || lead.name}</div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-bold uppercase tracking-wider">
                        {(lead.pipeline_stage || '').replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex gap-3 mt-1">
                      {lead.phone && <span className="flex items-center gap-0.5"><Phone size={10}/> {lead.phone}</span>}
                      {lead.address && <span className="flex items-center gap-0.5"><MapPin size={10}/> {lead.address}</span>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center">
                  <div className="text-sm text-slate-500">No estimate-ready leads found.</div>
                  <div className="text-[10px] text-slate-400 mt-1">Only leads with a scheduled estimate/inspection appear here.</div>
                </div>
              )}
            </div>
          )}
        </div>

        {data.client.leadId && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-between">
                  Name <Lock size={10} />
                </label>
                <div className="text-sm font-medium text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg mt-1 truncate">
                  {data.client.name}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-between">
                  Phone <Lock size={10} />
                </label>
                <div className="text-sm font-medium text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg mt-1 truncate">
                  {data.client.phone}
                </div>
              </div>
            </div>
            
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-between">
                Property <Lock size={10} />
              </label>
              <div className="text-sm font-medium text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg mt-1 truncate">
                {data.client.property}
              </div>
            </div>

            <FieldWithCap 
              label="Email Address"
              value={data.client.email}
              onChange={(val) => onDataChange({ client: { ...data.client, email: val } })}
              maxLength={ESTIMATE_FIELD_CAPS.clientEmail}
            />
          </div>
        )}
      </div>

      {/* Photo 1 */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Cover Photo (Photo 1)</h3>
        
        {!data.photo1?.url ? (
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors relative">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-3 text-slate-400" />
              <p className="mb-2 text-sm text-slate-500 font-medium">
                <span className="font-bold text-[#1a5ba5]">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-slate-400">JPG, PNG, WebP (Max 10MB)</p>
            </div>
            <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,image/heic" onChange={handleFileUpload} disabled={isUploading} />
            {isUploading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-2xl backdrop-blur-sm">
                <div className="text-sm font-bold text-[#1a5ba5] animate-pulse">Uploading...</div>
              </div>
            )}
          </label>
        ) : (
          <div className="space-y-3">
            <div 
              className="relative w-full h-48 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 cursor-crosshair group"
              onClick={handleFocalPointClick}
            >
              <img src={getImgSrc(data.photo1.url)} alt="Cover" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <span className="text-white text-xs font-bold bg-black/50 px-3 py-1 rounded-full">Click to set focal point</span>
              </div>
              
              {data.photo1.focalPoint && (
                <div 
                  className="absolute w-4 h-4 bg-amber-400 rounded-full border-2 border-white shadow-md transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ left: `${data.photo1.focalPoint.x * 100}%`, top: `${data.photo1.focalPoint.y * 100}%` }}
                />
              )}
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium truncate max-w-[200px]">{data.photo1.filename}</span>
              <button 
                onClick={() => onDataChange({ photo1: undefined })}
                className="text-red-500 hover:text-red-600 font-bold"
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
