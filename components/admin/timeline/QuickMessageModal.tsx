'use client';

import React, { useState, useEffect } from 'react';
import BottomSheet from '../shared/BottomSheet';
import { ROOFING_TEMPLATES, renderTemplate } from '@/lib/crm-templates';
import { MessageSquare, Mail, Copy, Check, Send, Sparkles, PhoneCall } from 'lucide-react';

interface QuickMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: number;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  address?: string;
  proposalLink?: string;
  defaultChannel?: 'sms' | 'email';
  onSent?: () => void;
}

export default function QuickMessageModal({
  isOpen,
  onClose,
  leadId,
  customerName,
  customerPhone,
  customerEmail,
  address,
  proposalLink,
  defaultChannel = 'sms',
  onSent,
}: QuickMessageModalProps) {
  const [channel, setChannel] = useState<'sms' | 'email'>(defaultChannel);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('inspection_confirmed');
  const [dateTime, setDateTime] = useState<string>('Tomorrow at 9:00 AM');
  const [repName, setRepName] = useState<string>('Rise Up Team');
  const [customSubject, setCustomSubject] = useState<string>('');
  const [customBody, setCustomBody] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter templates based on chosen channel
  const availableTemplates = ROOFING_TEMPLATES.filter(
    t => t.type === 'both' || t.type === channel
  );

  // Whenever template changes, populate the message text
  useEffect(() => {
    if (selectedTemplateId === 'custom') {
      return;
    }
    const t = ROOFING_TEMPLATES.find(tpl => tpl.id === selectedTemplateId);
    if (t) {
      setCustomSubject(t.subject || '');
      setCustomBody(t.body);
    }
  }, [selectedTemplateId, channel]);

  // Compute rendered body
  const renderedBody = renderTemplate(customBody, {
    customer_name: customerName || 'Homeowner',
    rep_name: repName || 'Rise Up Roofing',
    address: address || 'your residence',
    date_time: dateTime,
    proposal_link: proposalLink || 'https://riseuproofing.com/proposal',
    review_link: 'https://g.page/r/rise-up-roofing/review',
  });

  const renderedSubject = renderTemplate(customSubject, {
    customer_name: customerName || 'Homeowner',
    rep_name: repName,
    address: address || 'your residence',
  });

  const charCount = renderedBody.length;
  const smsSegments = Math.ceil(charCount / 160) || 1;

  async function handleSendAndLog(openApp: boolean = false) {
    setSubmitting(true);
    setError(null);
    try {
      // 1. Log activity to CRM lead timeline
      const res = await fetch(`/api/admin/leads/${leadId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityType: channel === 'sms' ? 'text' : 'email',
          title: channel === 'sms' ? `SMS Sent: ${selectedTemplateId}` : `Email Sent: ${renderedSubject || 'Homeowner Update'}`,
          description: renderedBody,
          performedBy: repName,
          metadata: {
            channel,
            templateId: selectedTemplateId,
            toPhone: customerPhone,
            toEmail: customerEmail,
          },
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to record message in activity timeline');
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSent?.();
        onClose();
      }, 1200);

      // 2. Open native SMS or Mail handler if on mobile/desktop
      if (openApp) {
        if (channel === 'sms' && customerPhone) {
          const cleanPhone = customerPhone.replace(/\D/g, '');
          window.location.href = `sms:${cleanPhone}?body=${encodeURIComponent(renderedBody)}`;
        } else if (channel === 'email' && customerEmail) {
          window.location.href = `mailto:${customerEmail}?subject=${encodeURIComponent(renderedSubject)}&body=${encodeURIComponent(renderedBody)}`;
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSubmitting(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(renderedBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Message Homeowner"
      subtitle={`Instant outreach to ${customerName}`}
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2">
            <Check size={16} />
            Message logged to CRM timeline successfully!
          </div>
        )}

        {/* Channel Switcher */}
        <div className="flex bg-slate-800/80 p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => {
              setChannel('sms');
              setSelectedTemplateId('inspection_confirmed');
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              channel === 'sms'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare size={14} />
            SMS Text Message
          </button>
          <button
            type="button"
            onClick={() => {
              setChannel('email');
              setSelectedTemplateId('proposal_ready');
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              channel === 'email'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail size={14} />
            Email Notification
          </button>
        </div>

        {/* Homeowner Recipient Pill */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-950/40 rounded-xl border border-white/5 text-xs text-slate-300">
          <div>
            <span className="text-slate-500">To:</span> <span className="font-semibold text-white">{customerName}</span>
          </div>
          <div className="text-slate-400 font-mono text-[11px]">
            {channel === 'sms' ? (customerPhone || 'No phone') : (customerEmail || 'No email')}
          </div>
        </div>

        {/* Template Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
            <span>Choose Roofing Template</span>
            <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
              <Sparkles size={11} /> CSLB & Field Ready
            </span>
          </label>
          <select
            value={selectedTemplateId}
            onChange={e => setSelectedTemplateId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-amber-400"
          >
            {availableTemplates.map(tpl => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name}
              </option>
            ))}
            <option value="custom">✏️ Custom Freeform Message</option>
          </select>
        </div>

        {/* Dynamic Context Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Date / Time variable</label>
            <input
              type="text"
              value={dateTime}
              onChange={e => setDateTime(e.target.value)}
              placeholder="e.g. Tomorrow 9:00 AM"
              className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Rep / Sender Name</label>
            <input
              type="text"
              value={repName}
              onChange={e => setRepName(e.target.value)}
              placeholder="Michael (Rise Up)"
              className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Email Subject line */}
        {channel === 'email' && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Subject Line</label>
            <input
              type="text"
              value={customSubject}
              onChange={e => setCustomSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
            />
          </div>
        )}

        {/* Message Content & Preview */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300">Message Body</label>
            <div className="text-[11px] text-slate-400 font-mono">
              {charCount} chars {channel === 'sms' && `• ${smsSegments} SMS`}
            </div>
          </div>
          <textarea
            rows={4}
            value={customBody}
            onChange={e => {
              setCustomBody(e.target.value);
              if (selectedTemplateId !== 'custom') {
                setSelectedTemplateId('custom');
              }
            }}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs leading-relaxed focus:outline-none focus:border-amber-400 resize-none font-sans"
          />
        </div>

        {/* Rendered Preview Card */}
        <div className="p-3.5 bg-slate-950/70 rounded-xl border border-white/5 space-y-1.5">
          <div className="text-[10px] uppercase font-bold tracking-wider text-amber-400/90 flex items-center justify-between">
            <span>What Homeowner Sees:</span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white cursor-pointer transition-colors"
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy Text'}
            </button>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
            {renderedBody}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSendAndLog(false)}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Check size={14} className="text-emerald-400" />
            Log as Sent
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSendAndLog(true)}
            className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Send size={14} />
            Open in App & Log
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
