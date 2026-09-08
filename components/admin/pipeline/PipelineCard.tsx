'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Clock,
  Calendar,
  Zap,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  ShieldCheck,
  Star,
  Camera,
  ChevronRight,
  MoreVertical,
  User,
  ArrowRight,
  Sparkles,
  CheckSquare,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { PipelineLead, PipelineStage } from '@/app/api/admin/pipeline/route';
import UserAvatar from '@/components/admin/shared/UserAvatar';
import RoleBadge from '@/components/admin/shared/RoleBadge';

interface PipelineCardProps {
  lead: PipelineLead;
  users: Array<{ id: number; name: string; email: string; role: string; avatar_url: string | null }>;
  currentUserId?: number;
  onClaim: (leadId: number) => Promise<void>;
  onAssign: (leadId: number, targetUserId: number | null) => Promise<void>;
  onStageChange: (leadId: number, newStage: PipelineStage, metadata?: any) => Promise<void>;
  onOpenActionModal: (lead: PipelineLead, actionType: string) => void;
  onOpenChecklist?: (lead: PipelineLead) => void;
  onOpenEstimatePicker?: (lead: PipelineLead) => void;
  isDragging?: boolean;
}

export default function PipelineCard({
  lead,
  users,
  currentUserId,
  onClaim,
  onAssign,
  onStageChange,
  onOpenActionModal,
  onOpenChecklist,
  onOpenEstimatePicker,
}: PipelineCardProps) {
  const [claiming, setClaiming] = useState(false);
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const isUnassigned = !lead.assigned_to_user_id;

  const handleClaim = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setClaiming(true);
    try {
      await onClaim(lead.id);
    } finally {
      setClaiming(false);
    }
  };

  const handleAssignSelect = async (userId: number | null) => {
    setShowAssignDropdown(false);
    await onAssign(lead.id, userId);
  };

  // Format currency
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Stage 3 Gate check
  const stage3MissingDocs =
    lead.pipeline_stage === 'stage_3_site_visit_estimate' &&
    !lead.estimate_id &&
    !lead.inspection_id;

  return (
    <div
      draggable
      onDragStart={(e) => {
        // Enforce Stage 4 drag rule: cannot drag directly to Stage 5 without signed contract
        e.dataTransfer.setData(
          'application/json',
          JSON.stringify({ leadId: lead.id, currentStage: lead.pipeline_stage })
        );
        e.dataTransfer.effectAllowed = 'move';
      }}
      className={`group relative rounded-xl border bg-white p-3.5 shadow-sm transition-all duration-200 hover:shadow-md cursor-grab active:cursor-grabbing ${
        isUnassigned && lead.pipeline_stage === 'stage_1_lead_gen'
          ? 'border-dashed border-amber-400/90 bg-amber-50/20 hover:border-amber-500'
          : 'border-slate-200/90 hover:border-slate-300'
      }`}
    >
      {/* ── TOP BAR: Lead Name, Service & Value ── */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              href={`/admin/leads/${lead.id}`}
              className="text-sm font-semibold text-slate-900 hover:text-amber-600 truncate transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {lead.full_name}
            </Link>
            {lead.lead_score > 0 && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  lead.lead_score >= 80
                    ? 'bg-red-100 text-red-700'
                    : lead.lead_score >= 50
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {lead.lead_score} pts
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 truncate mt-0.5">
            {lead.service_type || 'Roof Replacement'}
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            {formatMoney(lead.contract_value || lead.estimate_total || lead.estimated_value || 12500)}
          </div>
        </div>
      </div>

      {/* ── ADDRESS & CONTACT INFO ── */}
      <div className="space-y-1 mb-2.5 text-xs text-slate-600">
        {(lead.address || lead.city) && (
          <div className="flex items-center gap-1.5 text-slate-500 truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              {lead.address ? `${lead.address}, ` : ''}{lead.city || 'Bay Area'}
            </span>
            {lead.address_confirmed && (
              <span className="shrink-0 text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1 rounded">
                Verified
              </span>
            )}
          </div>
        )}

        {lead.phone && (
          <div className="flex items-center justify-between gap-1 pt-0.5">
            <div className="flex items-center gap-1.5 text-slate-500 truncate">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{lead.phone}</span>
            </div>

            {/* One-Tap Contact Actions (Spec §2 Stage 2) */}
            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              <a
                href={`tel:${lead.phone}`}
                title="Direct Phone Call"
                className="p-1 rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 transition-colors"
              >
                <Phone className="w-3 h-3" />
              </a>
              <a
                href={`sms:${lead.phone}`}
                title="Send SMS"
                className="p-1 rounded-md bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-600 transition-colors"
              >
                <MessageSquare className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* ── SOURCE ATTRIBUTION CHIP ── */}
      <div className="flex items-center justify-between gap-1 mb-2.5 pt-2 border-t border-slate-100 text-[11px]">
        <div className="flex items-center gap-1 text-slate-500 truncate">
          {lead.source_type === 'team_member' ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium border border-blue-100 truncate">
              🚪 {lead.created_by_name ? `Knocker: ${lead.created_by_name}` : 'Field Canvassing'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium truncate">
              🌐 {lead.lead_source_detail || 'Website Inbound'}
            </span>
          )}
        </div>

        {/* Sales Chart Checklist Trigger Badge */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenChecklist) onOpenChecklist(lead);
          }}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-200 text-slate-600 hover:text-amber-800 text-[10px] font-semibold transition-colors cursor-pointer"
        >
          <CheckSquare className="w-3 h-3 text-amber-500" />
          <span>
            {lead.checklist_completed_count || 0}/{lead.checklist_total_count || 4}
          </span>
        </button>
      </div>

      {/* ── STAGE 2 SPECIFIC: 24–48h SLA BADGE & BOOK ESTIMATE ── */}
      {lead.pipeline_stage === 'stage_2_initial_contact' && (
        <div className="space-y-1.5 mb-2.5">
          {lead.initial_contacted_at ? (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Contacted within SLA window</span>
            </div>
          ) : lead.sla_status === 'breached' ? (
            <div className="flex items-center justify-between px-2 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold animate-pulse">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>{lead.sla_badge_label || 'Overdue (Past 48h SLA)'}</span>
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenActionModal(lead, 'contact');
                }}
                className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded hover:bg-rose-700 transition-colors"
              >
                Log Contact
              </button>
            </div>
          ) : lead.sla_status === 'warning' ? (
            <div className="flex items-center justify-between px-2 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>{lead.sla_badge_label || `Action Due: ${lead.sla_hours_remaining}h left`}</span>
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenActionModal(lead, 'contact');
                }}
                className="text-[10px] bg-amber-600 text-white px-2 py-0.5 rounded hover:bg-amber-700 transition-colors"
              >
                Log Contact
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between px-2 py-1 rounded-md bg-sky-50 border border-sky-200 text-sky-800 text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-600" />
                <span>{lead.sla_badge_label || `48h SLA: ${lead.sla_hours_remaining}h left`}</span>
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenActionModal(lead, 'contact');
                }}
                className="text-[10px] text-sky-700 hover:underline font-semibold"
              >
                Log Call
              </button>
            </div>
          )}

          {/* Book Estimate Action (Auto advances to Stage 3 on save) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenActionModal(lead, 'book_visit');
            }}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-cyan-600 text-white text-xs font-bold shadow-xs hover:bg-cyan-700 transition-all cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Book Estimate (Auto-Advance to Stage 3)</span>
          </button>
        </div>
      )}

      {/* ── STAGE 3 SPECIFIC: VISIT, INSPECTION & TEMPLATE PICKER ── */}
      {lead.pipeline_stage === 'stage_3_site_visit_estimate' && (
        <div className="space-y-1.5 mb-2.5">
          {/* Soft Gate Warning if no Inspection and no Estimate */}
          {stage3MissingDocs && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Gate: Requires Estimate or Inspection to advance</span>
            </div>
          )}

          {lead.site_visit_scheduled_at ? (
            <div className="flex items-center justify-between gap-1 text-xs text-purple-900 bg-purple-50 px-2 py-1 rounded border border-purple-200">
              <span className="flex items-center gap-1.5 truncate">
                <Calendar className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span className="truncate">
                  Visit: {new Date(lead.site_visit_scheduled_at).toLocaleDateString()}
                </span>
              </span>
              <span className="text-[10px] text-purple-700 font-bold bg-purple-100 px-1 rounded">
                Calendar Synced
              </span>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenActionModal(lead, 'book_visit');
              }}
              className="w-full flex items-center justify-center gap-1 text-xs py-1 rounded bg-purple-100 text-purple-900 font-semibold hover:bg-purple-200 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" /> Schedule 12-Pt Visit
            </button>
          )}

          {/* Inspection and Estimate status chips */}
          <div className="flex items-center gap-1.5 text-[11px]">
            {lead.inspection_id ? (
              <span className="flex-1 px-1.5 py-1 rounded bg-slate-100 text-slate-800 font-medium truncate border border-slate-200">
                📋 Insp #{lead.inspection_number} ({lead.roof_health_score}/100)
              </span>
            ) : (
              <Link
                href={`/admin/inspections/new?lead_id=${lead.id}`}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 text-center py-1 rounded border border-purple-200 bg-purple-50/50 text-purple-700 font-semibold hover:bg-purple-100 transition-colors truncate"
              >
                + Start Inspection
              </Link>
            )}

            {lead.estimate_id ? (
              <span className="px-1.5 py-1 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 truncate">
                {lead.estimate_status === 'sent' ? 'Sent' : 'Draft'} ${lead.estimate_total?.toLocaleString()}
              </span>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenEstimatePicker) onOpenEstimatePicker(lead);
                  else onOpenActionModal(lead, 'create_estimate');
                }}
                className="flex-1 text-center py-1 rounded border border-emerald-300 bg-emerald-50 text-emerald-800 font-bold hover:bg-emerald-100 transition-colors cursor-pointer truncate"
              >
                + Create Estimate
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── STAGE 4 SPECIFIC: CLOSING, CONTRACTS & FINANCING ── */}
      {lead.pipeline_stage === 'stage_4_closing' && (
        <div className="space-y-1.5 mb-2.5">
          {/* Live Contract Status Badge (Spec §2 Stage 4) */}
          <div className="flex items-center justify-between p-1.5 rounded-lg border text-xs font-semibold bg-slate-50 border-slate-200">
            <div className="flex items-center gap-1.5 truncate">
              <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">
                {lead.contract_status === 'fully_executed'
                  ? 'Agreement Fully Executed'
                  : lead.contract_status === 'client_signed'
                  ? 'Client Signed Agreement'
                  : 'Action Required (Signature)'}
              </span>
            </div>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                lead.contract_status === 'fully_executed'
                  ? 'bg-emerald-100 text-emerald-800'
                  : lead.contract_status === 'client_signed'
                  ? 'bg-sky-100 text-sky-800'
                  : 'bg-amber-100 text-amber-800 animate-pulse'
              }`}
            >
              {lead.contract_status === 'fully_executed'
                ? 'Executed'
                : lead.contract_status === 'client_signed'
                ? 'Signed'
                : 'Pending'}
            </span>
          </div>

          {/* Financing Offered Badge */}
          {lead.financing_offered && (
            <div className="flex items-center justify-between text-[11px] bg-purple-50 px-2 py-1 rounded border border-purple-200 text-purple-900 font-semibold">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-600" />
                <span>HEARTH Financing Offered</span>
              </span>
              <span className="text-[10px] text-purple-700 bg-purple-100 px-1 rounded">0% APR</span>
            </div>
          )}

          {/* 48h Follow-up SLA Timer */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{lead.sla_badge_label || '48h Follow-up window'}</span>
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenActionModal(lead, 'discount');
              }}
              className="text-[10px] text-amber-700 hover:underline font-semibold"
            >
              Adjust Terms
            </button>
          </div>

          {/* Move to Production Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStageChange(lead.id, 'stage_5_completion_followup', { confirm_signed: true });
            }}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold shadow-xs hover:from-amber-600 hover:to-amber-700 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" /> Sign &amp; Move to Production
          </button>
        </div>
      )}

      {/* ── STAGE 5 SPECIFIC: PRODUCTION, PHOTOS, WARRANTY & REVIEW ── */}
      {lead.pipeline_stage === 'stage_5_completion_followup' && (
        <div className="space-y-1.5 mb-2.5">
          <div className="flex items-center justify-between text-xs bg-emerald-50 px-2 py-1 rounded border border-emerald-200 text-emerald-900 font-medium">
            <span>🔨 {lead.job_number || 'Production Active'}</span>
            <span className="capitalize text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
              {lead.job_status?.replace('_', ' ') || 'in progress'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1 text-[10px]">
            {/* Live photo count from canonical job_photos */}
            <Link
              href="/admin/jobs"
              onClick={(e) => e.stopPropagation()}
              className="flex flex-col items-center justify-center p-1 rounded border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 text-center"
            >
              <Camera className="w-3 h-3 text-slate-500 mb-0.5" />
              <span>{lead.photo_count} Photos</span>
            </Link>

            {/* Canonical Warranties Link */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenActionModal(lead, 'warranty');
              }}
              className={`flex flex-col items-center justify-center p-1 rounded border text-center cursor-pointer ${
                lead.has_warranty
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-3 h-3 text-emerald-600 mb-0.5" />
              <span>{lead.has_warranty ? '50-Yr Issued' : 'Warranty'}</span>
            </button>

            {/* Canonical Reviews Link */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenActionModal(lead, 'review');
              }}
              className={`flex flex-col items-center justify-center p-1 rounded border text-center cursor-pointer ${
                lead.has_review
                  ? 'border-amber-200 bg-amber-50 text-amber-800 font-semibold'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Star className="w-3 h-3 text-amber-500 mb-0.5" />
              <span>{lead.has_review ? '5★ Logged' : 'Ask Review'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── BOTTOM ASSIGNMENT BAR & CLAIM BUTTON ── */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
        {isUnassigned ? (
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Unassigned Pool
            </span>
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 active:scale-95 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Zap className="w-3 h-3 fill-white" />
              {claiming ? 'Claiming...' : 'Claim Lead'}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5 min-w-0">
              <UserAvatar
                name={lead.assigned_to_name}
                avatarUrl={lead.assigned_to_avatar}
                role={lead.assigned_to_role}
                size="xs"
              />
              <div className="min-w-0">
                <div className="text-xs font-medium text-slate-800 truncate">
                  {lead.assigned_to_name}
                </div>
                <div className="text-[10px] text-slate-400 capitalize truncate">
                  {lead.assigned_to_role?.replace('_', ' ') || 'Sales Rep'}
                </div>
              </div>
            </div>

            {/* Reassign Picker Trigger */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAssignDropdown(!showAssignDropdown);
                }}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Reassign Lead"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {showAssignDropdown && (
                <div
                  className="absolute right-0 bottom-full mb-1 w-48 rounded-lg bg-white border border-slate-200 shadow-lg py-1 z-30 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-2.5 py-1 font-bold text-slate-400 uppercase text-[9px] border-b border-slate-100">
                    Assign To
                  </div>
                  <button
                    onClick={() => handleAssignSelect(null)}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 text-slate-600 flex items-center gap-1.5"
                  >
                    <span>⚠️ Unassigned Pool</span>
                  </button>
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleAssignSelect(u.id)}
                      className={`w-full text-left px-2.5 py-1.5 hover:bg-slate-50 flex items-center justify-between ${
                        lead.assigned_to_user_id === u.id ? 'font-bold text-amber-600 bg-amber-50/50' : 'text-slate-700'
                      }`}
                    >
                      <span className="truncate">{u.name}</span>
                      <span className="text-[10px] text-slate-400 capitalize">{u.role?.replace('_', ' ')}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
