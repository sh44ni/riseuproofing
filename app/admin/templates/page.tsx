'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  MessageSquareCode,
  Plus,
  Search,
  Copy,
  Check,
  Edit2,
  Trash2,
  Mail,
  Smartphone,
  Sparkles,
  Layers,
  X,
  Eye,
  CheckCircle2,
  AlertCircle,
  Tag,
  ArrowRight,
} from 'lucide-react';

interface TemplateItem {
  id: number;
  name: string;
  category: string;
  type: 'sms' | 'email' | 'both';
  subject?: string;
  body: string;
  description?: string;
  created_at?: string;
}

const CATEGORIES = [
  { id: 'all', label: 'All Templates' },
  { id: 'lead_followup', label: 'Lead Follow-up' },
  { id: 'proposal', label: 'Estimates & Proposals' },
  { id: 'scheduling', label: 'Crew & Scheduling' },
  { id: 'review', label: 'Google Reviews' },
  { id: 'warranty', label: 'Warranties & Handover' },
  { id: 'custom', label: 'Custom' },
];

const MERGE_TAGS = [
  { tag: '{customer_name}', label: 'Customer Name', sample: 'Sarah Jenkins' },
  { tag: '{customer_phone}', label: 'Customer Phone', sample: '(619) 555-0192' },
  { tag: '{address}', label: 'Street Address', sample: '1428 Elm St' },
  { tag: '{city}', label: 'City', sample: 'San Diego' },
  { tag: '{service_type}', label: 'Service Type', sample: 'Roof Replacement' },
  { tag: '{date_time}', label: 'Appointment Time', sample: 'Tomorrow at 10:00 AM' },
  { tag: '{proposal_link}', label: 'Proposal Link', sample: 'https://riseuproofing.com/proposal/EST-2026-0042' },
  { tag: '{inspection_link}', label: 'Inspection Link', sample: 'https://riseuproofing.com/inspection/INSP-2026-0018' },
  { tag: '{warranty_link}', label: 'Warranty Link', sample: 'https://riseuproofing.com/warranty/WAR-2026-0005' },
  { tag: '{review_link}', label: 'Google Review Link', sample: 'https://g.page/r/riseuproofing/review' },
  { tag: '{company_phone}', label: 'Company Phone', sample: '(619) 432-7663' },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeChannel, setActiveChannel] = useState<'all' | 'sms' | 'email'>('all');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'lead_followup',
    type: 'sms' as 'sms' | 'email' | 'both',
    subject: '',
    body: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/admin/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.error('Failed to load templates', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCopy = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenNew = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      category: activeCategory !== 'all' ? activeCategory : 'lead_followup',
      type: 'sms',
      subject: '',
      body: '',
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: TemplateItem) => {
    setEditingTemplate(t);
    setFormData({
      name: t.name,
      category: t.category,
      type: t.type,
      subject: t.subject || '',
      body: t.body,
      description: t.description || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      const res = await fetch(`/api/admin/templates?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTemplates(prev => prev.filter(t => t.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete template', err);
    }
  };

  const handleInsertTag = (tag: string) => {
    const el = bodyTextareaRef.current;
    if (!el) {
      setFormData(prev => ({ ...prev, body: prev.body + ' ' + tag }));
      return;
    }
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const text = el.value;
    const newText = text.substring(0, start) + tag + text.substring(end);
    setFormData(prev => ({ ...prev, body: newText }));
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.body.trim()) {
      alert('Template name and body are required.');
      return;
    }
    setSaving(true);
    try {
      if (editingTemplate) {
        const res = await fetch('/api/admin/templates', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingTemplate.id,
            ...formData,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setTemplates(prev =>
            prev.map(t => (t.id === editingTemplate.id ? data.template : t))
          );
          setIsModalOpen(false);
        }
      } else {
        const res = await fetch('/api/admin/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          const data = await res.json();
          setTemplates(prev => [data.template, ...prev]);
          setIsModalOpen(false);
        }
      }
    } catch (err) {
      console.error('Failed to save template', err);
    } finally {
      setSaving(false);
    }
  };

  const samplePreviewBody = useMemo(() => {
    let text = formData.body;
    MERGE_TAGS.forEach(({ tag, sample }) => {
      text = text.replaceAll(tag, sample);
    });
    return text;
  }, [formData.body]);

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      if (activeCategory !== 'all' && t.category !== activeCategory) return false;
      if (activeChannel !== 'all') {
        if (activeChannel === 'sms' && t.type === 'email') return false;
        if (activeChannel === 'email' && t.type === 'sms') return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = t.name.toLowerCase().includes(q);
        const matchesBody = t.body.toLowerCase().includes(q);
        const matchesSubject = (t.subject || '').toLowerCase().includes(q);
        if (!matchesName && !matchesBody && !matchesSubject) return false;
      }
      return true;
    });
  }, [templates, activeCategory, activeChannel, search]);

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-[16px] bg-sky-50 border border-sky-200/80 text-[#1878B8]">
            <MessageSquareCode size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#0B1E33]">
              Template Studio &amp; Quick Messaging
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Standardized SMS &amp; Email communication flows with 1-click merge tags for California homeowners.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#EAA636] hover:bg-[#d49428] text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
        >
          <Plus size={16} /> New Template
        </button>
      </div>

      {/* Category Pills & Channel Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map(cat => {
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-[#EAA636] text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-[#0B1E33] border border-slate-200/80 shadow-2xs'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Channel Filter & Search */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/80 text-xs shadow-2xs">
            <button
              onClick={() => setActiveChannel('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeChannel === 'all' ? 'bg-white text-[#0B1E33] shadow-2xs' : 'text-slate-600 hover:text-[#0B1E33]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveChannel('sms')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeChannel === 'sms' ? 'bg-[#EAA636] text-white shadow-2xs' : 'text-slate-600 hover:text-[#0B1E33]'
              }`}
            >
              <Smartphone size={12} /> SMS
            </button>
            <button
              onClick={() => setActiveChannel('email')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeChannel === 'email' ? 'bg-[#2F9FE3] text-white shadow-2xs' : 'text-slate-600 hover:text-[#0B1E33]'
              }`}
            >
              <Mail size={12} /> Email
            </button>
          </div>

          <div className="relative flex-1 md:w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200/80 text-[#0B1E33] placeholder-slate-400 text-xs focus:outline-none focus:border-[#2F9FE3] shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
          <Sparkles size={16} className="text-[#1878B8] animate-spin" /> Loading message templates...
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="p-12 text-center rounded-[20px] bg-white border border-slate-200/80 shadow-xs">
          <MessageSquareCode size={36} className="text-slate-300 mx-auto mb-3" />
          <h3 className="text-[#0B1E33] font-bold text-base">No Templates Found</h3>
          <p className="text-slate-500 text-xs mt-1">Try another category or create a custom template.</p>
          <button
            onClick={handleOpenNew}
            className="mt-4 px-4 py-2 rounded-xl bg-[#EAA636] hover:bg-[#d49428] text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            Create First Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(t => {
            const isSms = t.type === 'sms' || t.type === 'both';
            const isEmail = t.type === 'email' || t.type === 'both';

            return (
              <div
                key={t.id}
                className="p-5 rounded-[20px] bg-white border border-slate-200/80 hover:border-sky-300 transition-all flex flex-col justify-between group shadow-xs"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-black text-[#0B1E33] group-hover:text-[#1878B8] transition-colors">
                      {t.name}
                    </h3>

                    {/* Badge */}
                    <div className="flex items-center gap-1">
                      {isSms && (
                        <span className="p-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold" title="SMS Compatible">
                          <Smartphone size={12} />
                        </span>
                      )}
                      {isEmail && (
                        <span className="p-1 rounded-md bg-sky-50 text-[#1878B8] border border-sky-200 text-[10px] font-bold" title="Email Compatible">
                          <Mail size={12} />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Category Pill */}
                  <div className="mb-3">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200/60 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
                      {CATEGORIES.find(c => c.id === t.category)?.label || t.category}
                    </span>
                  </div>

                  {/* Subject if email */}
                  {t.subject && (
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 mb-2 font-mono">
                      <span className="text-slate-500 font-sans font-bold text-[10px] uppercase block">Subject:</span>
                      {t.subject}
                    </div>
                  )}

                  {/* Body Preview with Highlighted Tokens */}
                  <div className="p-3 rounded-[16px] bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-line max-h-48 overflow-y-auto">
                    {t.body.split(/(\{.*?\})/).map((part, i) =>
                      part.startsWith('{') && part.endsWith('}') ? (
                        <span key={i} className="text-[#1878B8] bg-sky-50 border border-sky-200/60 px-1 py-0.5 rounded font-mono font-bold text-[11px]">
                          {part}
                        </span>
                      ) : (
                        part
                      )
                    )}
                  </div>

                  {t.description && (
                    <p className="text-[11px] text-slate-500 mt-2 italic">
                      {t.description}
                    </p>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleCopy(t.body, t.id)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200/60"
                  >
                    {copiedId === t.id ? (
                      <>
                        <Check size={13} className="text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} className="text-slate-500" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(t)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-[#0B1E33] border border-slate-200/60 transition-colors cursor-pointer"
                    title="Edit Template"
                  >
                    <Edit2 size={13} />
                  </button>

                  <button
                    onClick={() => handleDelete(t.id)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer"
                    title="Delete Template"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create or Edit Template */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />

          <div className="relative w-full max-w-2xl bg-white border border-slate-200/80 rounded-[20px] p-6 sm:p-8 shadow-2xl z-10 max-h-[90vh] overflow-y-auto space-y-5 text-[#0B1E33]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-[#EAA636] border border-amber-200/80">
                  <MessageSquareCode size={20} />
                </div>
                <h2 className="text-lg font-black text-[#0B1E33]">
                  {editingTemplate ? 'Edit Message Template' : 'Create New Message Template'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Template Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Post-Storm Free Inspection Notice"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[#0B1E33] placeholder-slate-400 focus:outline-none focus:border-[#2F9FE3] focus:bg-white shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[#0B1E33] focus:outline-none focus:border-[#2F9FE3] focus:bg-white shadow-2xs"
                  >
                    {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Channel Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Communication Channel</label>
                <div className="flex items-center gap-3 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/80">
                    <input
                      type="radio"
                      name="type"
                      value="sms"
                      checked={formData.type === 'sms'}
                      onChange={() => setFormData({ ...formData, type: 'sms' })}
                      className="accent-[#EAA636]"
                    />
                    <Smartphone size={14} className="text-amber-600" /> SMS Only
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/80">
                    <input
                      type="radio"
                      name="type"
                      value="email"
                      checked={formData.type === 'email'}
                      onChange={() => setFormData({ ...formData, type: 'email' })}
                      className="accent-[#2F9FE3]"
                    />
                    <Mail size={14} className="text-[#1878B8]" /> Email Only
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/80">
                    <input
                      type="radio"
                      name="type"
                      value="both"
                      checked={formData.type === 'both'}
                      onChange={() => setFormData({ ...formData, type: 'both' })}
                      className="accent-[#EAA636]"
                    />
                    Both (SMS &amp; Email)
                  </label>
                </div>
              </div>

              {/* Email Subject */}
              {(formData.type === 'email' || formData.type === 'both') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Subject Line</label>
                  <input
                    type="text"
                    placeholder="e.g. Your Rise Up Roofing Estimate for {address}"
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[#0B1E33] placeholder-slate-400 text-xs focus:outline-none focus:border-[#2F9FE3] focus:bg-white shadow-2xs"
                  />
                </div>
              )}

              {/* 1-Click Merge Tag Chips */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>1-Click Merge Tags (Tap to insert at cursor)</span>
                  <span className="text-[11px] text-[#1878B8] font-mono">Dynamic Values</span>
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 rounded-[16px] bg-slate-50 border border-slate-200/80">
                  {MERGE_TAGS.map(m => (
                    <button
                      key={m.tag}
                      type="button"
                      onClick={() => handleInsertTag(m.tag)}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-sky-50 text-[#1878B8] hover:border-sky-300 font-mono text-[11px] font-bold border border-slate-200/80 transition-colors cursor-pointer shadow-2xs"
                      title={m.label}
                    >
                      {m.tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Body */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Message Content</label>
                <textarea
                  ref={bodyTextareaRef}
                  rows={5}
                  placeholder="Hi {customer_name}, this is Michael from Rise Up Roofing..."
                  value={formData.body}
                  onChange={e => setFormData({ ...formData, body: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[#0B1E33] placeholder-slate-400 text-xs focus:outline-none focus:border-[#2F9FE3] focus:bg-white shadow-2xs leading-relaxed font-sans"
                />
              </div>

              {/* Live Preview Box */}
              <div className="p-4 rounded-[16px] bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="text-[10px] uppercase font-bold text-[#1878B8] tracking-wider flex items-center gap-1">
                  <Eye size={12} /> Live Preview (Homeowner View with Sample Data)
                </span>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-white p-3 rounded-xl border border-slate-200/80">
                  {samplePreviewBody || 'Type your message above to see how it renders with customer tokens replaced.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description / When to Send</label>
                <input
                  type="text"
                  placeholder="e.g. Sent automatically within 5 minutes of emergency tarp request."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-[#0B1E33] placeholder-slate-400 text-xs focus:outline-none focus:border-[#2F9FE3] focus:bg-white shadow-2xs"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-[#EAA636] hover:bg-[#d49428] text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingTemplate ? 'Update Template' : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
