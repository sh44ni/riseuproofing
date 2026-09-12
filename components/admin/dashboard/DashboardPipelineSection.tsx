'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Kanban,
  List,
  Calendar,
  Search,
  Plus,
  Filter,
  DollarSign,
  MapPin,
  Clock,
  User,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Phone,
  AlertCircle,
} from 'lucide-react';
import QuickAddLeadModal from '@/components/admin/pipeline/QuickAddLeadModal';
import LeadQuickDrawer from '@/components/admin/leads/LeadQuickDrawer';
import { Lead } from '@/components/admin/LeadsTable';

export interface DashboardPipelineLead {
  id: number;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  service_type?: string | null;
  lead_source?: string | null;
  pipeline_stage?: string;
  status?: string;
  estimated_value?: number | null;
  created_at?: string;
  initial_contacted_at?: string | null;
  proposal_sent_at?: string | null;
  assigned_to_name?: string | null;
  assigned_to_avatar?: string | null;
  lead_score?: number;
  priority?: string;
}

const KANBAN_STAGES = [
  { id: 'new_leads', label: 'New Leads', color: 'border-t-sky-500', pill: 'bg-sky-50 text-sky-700' },
  { id: 'attempted', label: 'Attempted Contact', color: 'border-t-amber-500', pill: 'bg-amber-50 text-amber-700' },
  { id: 'connected', label: 'Connected', color: 'border-t-blue-500', pill: 'bg-blue-50 text-blue-700' },
  { id: 'site_visit', label: 'Site Visit / Est.', color: 'border-t-indigo-500', pill: 'bg-indigo-50 text-indigo-700' },
  { id: 'proposal_sent', label: 'Proposal Sent', color: 'border-t-purple-500', pill: 'bg-purple-50 text-purple-700' },
  { id: 'under_review', label: 'Under Review', color: 'border-t-orange-500', pill: 'bg-orange-50 text-orange-700' },
  { id: 'won', label: 'Won (Closed)', color: 'border-t-emerald-500', pill: 'bg-emerald-50 text-emerald-700' },
  { id: 'lost', label: 'Lost / On Hold', color: 'border-t-rose-500', pill: 'bg-rose-50 text-rose-700' },
];

export default function DashboardPipelineSection() {
  const [leads, setLeads] = useState<DashboardPipelineLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [repFilter, setRepFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');

  // Modals & Drawers
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [selectedLeadForDrawer, setSelectedLeadForDrawer] = useState<Lead | null>(null);

  const fetchPipelineLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pipeline');
      if (res.ok) {
        const data = await res.json();
        // API returns { stages: { stage_1_lead_gen: [...], stage_2_initial_contact: [...], ... } }
        // Flatten all stages into a single list for the kanban board
        if (data.stages && typeof data.stages === 'object') {
          const allLeads = Object.values(data.stages).flat() as DashboardPipelineLead[];
          setLeads(allLeads);
        } else if (Array.isArray(data)) {
          setLeads(data);
        } else if (data.leads) {
          setLeads(data.leads);
        } else {
          setLeads([]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch pipeline leads', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipelineLeads();
  }, []);

  // Compute distinct sources, reps, and services for dynamic filter dropdowns
  const availableSources = useMemo(() => {
    const s = new Set<string>();
    leads.forEach((l) => {
      if (l.lead_source) s.add(l.lead_source);
    });
    return Array.from(s);
  }, [leads]);

  const availableReps = useMemo(() => {
    const s = new Set<string>();
    leads.forEach((l) => {
      if (l.assigned_to_name) s.add(l.assigned_to_name);
    });
    return Array.from(s);
  }, [leads]);

  const availableServices = useMemo(() => {
    const s = new Set<string>();
    leads.forEach((l) => {
      if (l.service_type) s.add(l.service_type);
    });
    return Array.from(s);
  }, [leads]);

  // Map each lead into one of the 8 visual Kanban stages
  // The API already placed leads in correct stages — we just re-map to our visual columns
  const categorizedLeads = useMemo(() => {
    const map: Record<string, DashboardPipelineLead[]> = {
      new_leads: [], attempted: [], connected: [],
      site_visit: [], proposal_sent: [], under_review: [],
      won: [], lost: [],
    };

    const filtered = leads.filter((lead) => {
      if (sourceFilter !== 'all' && lead.lead_source !== sourceFilter) return false;
      if (repFilter !== 'all' && lead.assigned_to_name !== repFilter) return false;
      if (serviceFilter !== 'all' && lead.service_type !== serviceFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!lead.full_name?.toLowerCase().includes(q)
          && !lead.phone?.toLowerCase().includes(q)
          && !lead.address?.toLowerCase().includes(q)
          && !lead.city?.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    filtered.forEach((lead) => {
      const status = lead.status?.toLowerCase() || '';
      const stage = lead.pipeline_stage || 'stage_1_lead_gen';

      if (status === 'lost') {
        map.lost.push(lead);
      } else if (status === 'won' || stage === 'stage_5_completion_followup') {
        map.won.push(lead);
      } else if (stage === 'stage_4_closing') {
        map.under_review.push(lead);
      } else if (stage === 'stage_3_site_visit_estimate' || lead.proposal_sent_at) {
        // proposal_sent_at means estimate was sent from site visit
        map.proposal_sent.push(lead);
      } else if (stage === 'stage_2_initial_contact' && lead.initial_contacted_at) {
        map.connected.push(lead);
      } else if (stage === 'stage_2_initial_contact' || status === 'contacted') {
        map.attempted.push(lead);
      } else {
        // stage_1_lead_gen and anything else → New Leads
        map.new_leads.push(lead);
      }
    });

    return map;
  }, [leads, sourceFilter, repFilter, serviceFilter, searchQuery]);


  const handleCardClick = (lead: DashboardPipelineLead) => {
    // Transform to Lead object for LeadQuickDrawer
    const fullLead: Lead = {
      id: lead.id,
      form_type: 'quote',
      full_name: lead.full_name,
      phone: lead.phone || '',
      email: lead.email || '',
      address: lead.address || '',
      city: lead.city || 'Oceanside',
      service_type: lead.service_type || 'Tile Roof',
      status: lead.status || 'new',
      estimated_value: lead.estimated_value || 0,
      pipeline_stage: lead.pipeline_stage || 'stage_1_lead_gen',
      priority: (['urgent', 'high', 'medium', 'low'].includes(String(lead.priority))
        ? lead.priority
        : 'medium') as any,
      created_at: lead.created_at || new Date().toISOString(),
      lead_score: lead.lead_score || 75,
      assigned_to_name: lead.assigned_to_name || undefined,
    };
    setSelectedLeadForDrawer(fullLead);
  };

  return (
    <div className="rounded-2xl admin-card bg-white border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
      {/* Header Row: Title, Filters & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-[#0B1E33] tracking-tight">
              Sales Pipeline
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {leads.length} Total Leads
            </span>
          </div>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="all">All Sources</option>
            {availableSources.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ').toUpperCase()}
              </option>
            ))}
          </select>

          {/* Rep Filter */}
          <select
            value={repFilter}
            onChange={(e) => setRepFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="all">All Reps</option>
            {availableReps.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {/* Services Filter */}
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="all">All Services</option>
            {availableServices.map((sv) => (
              <option key={sv} value={sv}>
                {sv}
              </option>
            ))}
          </select>

          {/* Search Input */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 w-36 sm:w-44"
            />
          </div>

          {/* View Toggles (Kanban, List, Calendar) */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
            <button
              type="button"
              className="px-2.5 py-1 rounded-md text-xs font-bold bg-white text-slate-900 shadow-xs flex items-center gap-1 cursor-default"
            >
              <Kanban size={12} />
              <span>Kanban</span>
            </button>
            <Link
              href="/admin/pipeline"
              className="px-2.5 py-1 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors"
            >
              <List size={12} />
              <span>Full Pipeline</span>
            </Link>
          </div>

          {/* + New Lead Primary Button */}
          <button
            type="button"
            onClick={() => setIsAddLeadOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0B1E33] hover:bg-[#122b49] text-white shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={14} />
            <span>New Lead</span>
          </button>
        </div>
      </div>

      {/* 8-Stage Kanban Grid — fills container, no horizontal scroll */}
      <div className="crm-kanban-board">
        <div className="crm-kanban-grid">
          {KANBAN_STAGES.map((stage) => {
            const stageLeads = categorizedLeads[stage.id] || [];

            return (
              <div
                key={stage.id}
                className={`crm-kanban-col bg-slate-50/80 rounded-xl p-2.5 border-t-4 ${stage.color} border border-slate-200/80 flex flex-col justify-between min-h-[240px]`}
              >
                <div>
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60">
                    <span className="text-[11px] font-bold text-slate-800 tracking-tight truncate pr-1">
                      {stage.label}
                    </span>
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0 ${stage.pill}`}>
                      {stageLeads.length}
                    </span>
                  </div>

                  {/* Cards List */}
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-0.5 scrollbar-thin">
                    {stageLeads.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs italic">
                        No leads in this stage
                      </div>
                    ) : (
                      stageLeads.map((lead) => (
                        <div
                          key={lead.id}
                          onClick={() => handleCardClick(lead)}
                          className="p-2 bg-white rounded-lg border border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group space-y-1.5"
                        >
                          {/* Name & Priority */}
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-[11px] font-bold text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-1 leading-tight">
                              {lead.full_name}
                            </span>
                            {lead.priority === 'urgent' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0 mt-1" title="Urgent" />
                            )}
                          </div>

                          {/* Service Tag & Value */}
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="px-1 py-0.5 rounded bg-slate-100 text-slate-600 font-medium truncate max-w-[90px]">
                              {lead.service_type || 'Roof'}
                            </span>
                            <span className="font-mono font-bold text-emerald-700">
                              {lead.estimated_value
                                ? `$${Number(lead.estimated_value).toLocaleString()}`
                                : 'TBD'}
                            </span>
                          </div>

                          {/* Footer: rep & date */}
                          <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-slate-100">
                            <div className="flex items-center gap-1">
                              <div className="w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[7px] uppercase">
                                {lead.assigned_to_name ? lead.assigned_to_name.slice(0, 2) : 'RU'}
                              </div>
                              <span className="truncate max-w-[55px] text-slate-500 font-medium">
                                {lead.assigned_to_name || 'Unassigned'}
                              </span>
                            </div>
                            <span>
                              {lead.created_at
                                ? new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                : 'Recent'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Column Footer: + Add Lead */}
                <button
                  type="button"
                  onClick={() => setIsAddLeadOpen(true)}
                  className="mt-2 w-full py-1 rounded-lg border border-dashed border-slate-300 text-slate-500 hover:text-slate-800 hover:border-slate-400 hover:bg-white text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <Plus size={11} />
                  <span>Add Lead</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Add Lead Centered Modal */}
      <QuickAddLeadModal
        isOpen={isAddLeadOpen}
        onClose={() => setIsAddLeadOpen(false)}
        onSuccess={() => {
          setIsAddLeadOpen(false);
          fetchPipelineLeads();
        }}
      />

      {/* Lead Quick Inspector Drawer */}
      <LeadQuickDrawer
        lead={selectedLeadForDrawer}
        isOpen={Boolean(selectedLeadForDrawer)}
        onClose={() => setSelectedLeadForDrawer(null)}
        onStatusChange={() => {
          setSelectedLeadForDrawer(null);
          fetchPipelineLeads();
        }}
      />
    </div>
  );
}
