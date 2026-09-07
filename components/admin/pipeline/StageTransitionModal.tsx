'use client';

import React, { useState } from 'react';
import {
  X,
  Phone,
  MessageSquare,
  Calendar,
  Percent,
  ShieldCheck,
  Star,
  CheckCircle2,
  Send,
  Sparkles,
} from 'lucide-react';
import { PipelineLead } from '@/app/api/admin/pipeline/route';

interface StageTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: PipelineLead | null;
  actionType: string | null;
  users: Array<{ id: number; name: string; email: string; role: string; avatar_url: string | null }>;
  onExecuteAction: (leadId: number, actionType: string, payload: any) => Promise<void>;
}

export default function StageTransitionModal({
  isOpen,
  onClose,
  lead,
  actionType,
  users,
  onExecuteAction,
}: StageTransitionModalProps) {
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [contactMethod, setContactMethod] = useState<'Phone Call' | 'SMS' | 'In-Person'>('Phone Call');
  const [contactNotes, setContactNotes] = useState('');
  const [confirmAddressCheck, setConfirmAddressCheck] = useState(true);

  // Booking visit states
  const [visitDate, setVisitDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  });
  const [inspectorId, setInspectorId] = useState<string>('');

  // Discount states
  const [selectedDiscount, setSelectedDiscount] = useState('Military & First Responder Discount (10%)');
  const [customDiscount, setCustomDiscount] = useState('');
  const [financingInterested, setFinancingInterested] = useState(false);

  // Warranty states
  const [warrantyType, setWarrantyType] = useState('50-Year GAF Golden Pledge Lifetime Warranty');

  if (!isOpen || !lead) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (actionType === 'contact') {
        await onExecuteAction(lead.id, 'log_contact', {
          method: contactMethod,
          notes: contactNotes,
        });
        if (confirmAddressCheck && !lead.address_confirmed) {
          await onExecuteAction(lead.id, 'confirm_address', {
            address: lead.address,
            city: lead.city,
            zip: lead.zip,
          });
        }
      } else if (actionType === 'book_visit') {
        await onExecuteAction(lead.id, 'book_site_visit', {
          scheduled_at: new Date(visitDate).toISOString(),
          inspector_id: inspectorId || lead.assigned_to_user_id,
        });
      } else if (actionType === 'discount') {
        const finalDiscount = selectedDiscount === 'Custom' ? customDiscount : selectedDiscount;
        await onExecuteAction(lead.id, 'apply_discount', {
          discount: finalDiscount,
          financing_interested: financingInterested,
        });
      } else if (actionType === 'warranty') {
        await onExecuteAction(lead.id, 'issue_warranty', {
          warranty_type: warrantyType,
        });
      } else if (actionType === 'review') {
        await onExecuteAction(lead.id, 'request_review', {});
      }
      onClose();
    } catch (err) {
      console.error('Error executing action:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            {actionType === 'contact' && (
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </div>
            )}
            {actionType === 'book_visit' && (
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            )}
            {actionType === 'discount' && (
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Percent className="w-4 h-4" />
              </div>
            )}
            {actionType === 'warranty' && (
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            )}
            {actionType === 'review' && (
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Star className="w-4 h-4" />
              </div>
            )}

            <div>
              <h3 className="text-base font-bold text-slate-900">
                {actionType === 'contact' && 'Log Initial Contact (24–48h SLA)'}
                {actionType === 'book_visit' && 'Book 12-Point Roof Inspection'}
                {actionType === 'discount' && 'Apply Promotion & Financing Terms'}
                {actionType === 'warranty' && 'Issue 50-Year Warranty Certificate'}
                {actionType === 'review' && 'Send Google 5-Star Review Request'}
              </h3>
              <p className="text-xs text-slate-500">
                For {lead.full_name} &bull; {lead.phone || lead.email || 'No contact on file'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* ── ACTION: CONTACT ── */}
          {actionType === 'contact' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Contact Channel
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Phone Call', 'SMS', 'In-Person'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setContactMethod(m)}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                        contactMethod === m
                          ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Call / Message Notes
                </label>
                <textarea
                  value={contactNotes}
                  onChange={(e) => setContactNotes(e.target.value)}
                  placeholder="Homeowner answered, interested in architectural shingles, free estimate requested..."
                  rows={3}
                  className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <input
                  type="checkbox"
                  id="confirm_address_check"
                  checked={confirmAddressCheck}
                  onChange={(e) => setConfirmAddressCheck(e.target.checked)}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4"
                />
                <label htmlFor="confirm_address_check" className="text-xs text-slate-700 cursor-pointer">
                  Confirm property address is verified (
                  <span className="font-semibold text-slate-900">{lead.address || 'Address on file'}</span>)
                </label>
              </div>
            </div>
          )}

          {/* ── ACTION: BOOK VISIT ── */}
          {actionType === 'book_visit' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Inspection Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  required
                  className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Assigned Inspector / Project Manager
                </label>
                <select
                  value={inspectorId}
                  onChange={(e) => setInspectorId(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:border-purple-500 focus:outline-none bg-white"
                >
                  <option value="">Keep current rep ({lead.assigned_to_name || 'Unassigned'})</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} &bull; {u.role?.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-lg bg-purple-50/70 border border-purple-200 text-xs text-purple-900 leading-relaxed">
                ✨ <strong>Rise Up 12-Point Inspection Scope</strong>: Decking inspection, flashing analysis, ridge vents, valley integrity, gutter pitch, attic moisture check, and aerial drone imagery.
              </div>
            </div>
          )}

          {/* ── ACTION: DISCOUNT / FINANCING ── */}
          {actionType === 'discount' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Special Promotion / Incentive
                </label>
                <div className="space-y-1.5">
                  {[
                    'Military & First Responder Discount (10%)',
                    'Seasonal Storm Special ($750 off)',
                    'Referral Reward Credit ($500)',
                    'Senior Citizen Discount (5%)',
                    'None / Standard Price',
                    'Custom',
                  ].map((disc) => (
                    <label
                      key={disc}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                        selectedDiscount === disc
                          ? 'border-amber-500 bg-amber-50/60 text-amber-900 font-semibold'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="discount_radio"
                        checked={selectedDiscount === disc}
                        onChange={() => setSelectedDiscount(disc)}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span>{disc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {selectedDiscount === 'Custom' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Custom Incentive Terms
                  </label>
                  <input
                    type="text"
                    value={customDiscount}
                    onChange={(e) => setCustomDiscount(e.target.value)}
                    placeholder="e.g. Neighborhood Group Bundle ($1,200 discount)"
                    className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>
              )}

              <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <input
                  type="checkbox"
                  id="financing_box"
                  checked={financingInterested}
                  onChange={(e) => setFinancingInterested(e.target.checked)}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <label htmlFor="financing_box" className="text-xs text-slate-700 cursor-pointer">
                  Customer requested <strong>0% APR Financing (12–60 months)</strong>
                </label>
              </div>
            </div>
          )}

          {/* ── ACTION: WARRANTY ── */}
          {actionType === 'warranty' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Warranty Plan
                </label>
                <select
                  value={warrantyType}
                  onChange={(e) => setWarrantyType(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:border-emerald-500 focus:outline-none bg-white font-medium"
                >
                  <option value="50-Year GAF Golden Pledge Lifetime Warranty">
                    50-Year GAF Golden Pledge Lifetime Warranty (Standard)
                  </option>
                  <option value="25-Year Commercial System Armor Warranty">
                    25-Year Commercial System Armor Warranty
                  </option>
                  <option value="10-Year Workmanship Guarantee (Repair)">
                    10-Year Workmanship Guarantee (Repair)
                  </option>
                </select>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
                🛡️ <strong>Certified Rise Up Protection</strong>: This issues an official digital warranty certificate registered under the property address with transferable 50-year non-prorated material protection.
              </div>
            </div>
          )}

          {/* ── ACTION: REVIEW ── */}
          {actionType === 'review' && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                ⭐ <strong>Google & Yelp Review Invite</strong>: Sends an automated high-converting SMS and email to {lead.full_name} inviting them to share their 5-star experience.
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 font-mono">
                &quot;Hi {lead.full_name}, thank you for choosing Rise Up Roofing! If you loved our work, would you take 30 seconds to drop us a quick 5-star Google review? [riseuproofing.com/review]&quot;
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-all shadow-sm"
            >
              {submitting ? 'Saving...' : 'Confirm Action'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
