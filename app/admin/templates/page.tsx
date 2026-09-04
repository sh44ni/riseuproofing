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
        // PATCH
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
        // POST
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

  // Live preview message replaced with sample tokens
  const samplePreviewBody = useMemo(() => {
    let text = formData.body;
    MERGE_TAGS.forEach(({ tag, sample }) => {
      text = text.replaceAll(tag, sample);
    });
    return text;
  }, [formData.body]);

  // Filtering
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
          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <MessageSquareCode size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Template Studio &amp; Quick Messaging
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Standardized SMS &amp; Email communication flows with 1-click merge tags for California homeowners.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-lg active:scale-95 transition-all cursor-pointer"
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
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Channel Filter & Search */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-white/10 text-xs">
            <button
              onClick={() => setActiveChannel('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeChannel === 'all' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveChannel('sms')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeChannel === 'sms' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone size={12} /> SMS
            </button>
            <button
              onClick={() => setActiveChannel('email')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeChannel === 'email' ? 'bg-cyan-400 text-slate-950' : 'text-slate-400 hover:text-slate-200'
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
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
          <Sparkles size={16} className="text-amber-400 animate-spin" /> Loading message templates...
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-white/10">
          <MessageSquareCode size={36} className="text-slate-600 mx-auto mb-3" />
          <h3 className="text-white font-bold text-base">No Templates Found</h3>
          <p className="text-slate-400 text-xs mt-1">Try another category or create a custom template.</p>
          <button
            onClick={handleOpenNew}
            className="mt-4 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold shadow-md cursor-pointer"
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
                className="p-5 rounded-3xl bg-slate-900 border border-white/10 hover:border-amber-400/30 transition-all flex flex-col justify-between group shadow-sm"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-black text-white group-hover:text-amber-300 transition-colors">
                      {t.name}
                    </h3>

                    {/* Badge */}
                    <div className="flex items-center gap-1">
                      {isSms && (
                        <span className="p-1 rounded-md bg-amber-500/15 text-amber-400 text-[10px] font-bold" title="SMS Compatible">
                          <Smartphone size={12} />
                        </span>
                      )}
                      {isEmail && (
                        <span className="p-1 rounded-md bg-cyan-500/15 text-cyan-400 text-[10px] font-bold" title="Email Compatible">
                          <Mail size={12} />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Category Pill */}
                  <div className="mb-3">
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      {CATEGORIES.find(c => c.id === t.category)?.label || t.category}
                    </span>
                  </div>

                  {/* Subject if email */}
                  {t.subject && (
                    <div className="p-2 rounded-xl bg-slate-950/70 border border-white/5 text-xs text-slate-300 mb-2 font-mono">
                      <span className="text-slate-500 font-sans font-bold text-[10px] uppercase block">Subject:</span>
                      {t.subject}
                    </div>
                  )}

                  {/* Body Preview with Highlighted Tokens */}
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line max-h-48 overflow-y-auto">
                    {t.body.split(/(\{.*?\})/).map((part, i) =>
                      part.startsWith('{') && part.endsWith('}') ? (
                        <span key={i} className="text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded font-mono font-bold text-[11px]">
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
                <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleCopy(t.body, t.id)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedId === t.id ? (
                      <>
                        <Check size={13} className="text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} className="text-slate-400" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(t)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Edit Template"
                  >
                    <Edit2 size={13} />
                  </button>

                  <button
                    onClick={() => handleDelete(t.id)}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
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
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />

          <div className="relative w-full max-w-2xl bg-slate-900 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400">
                  <MessageSquareCode size={20} />
                </div>
                <h2 className="text-lg font-black text-white">
                  {editingTemplate ? 'Edit Message Template' : 'Create New Message Template'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Template Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Post-Storm Free Inspection Notice"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-amber-400"
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
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Communication Channel</label>
                <div className="flex items-center gap-3 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-800 px-3 py-2 rounded-xl border border-white/5">
                    <input
                      type="radio"
                      name="type"
                      value="sms"
                      checked={formData.type === 'sms'}
                      onChange={() => setFormData({ ...formData, type: 'sms' })}
                      className="accent-amber-400"
                    />
                    <Smartphone size={14} className="text-amber-400" /> SMS Only
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-800 px-3 py-2 rounded-xl border border-white/5">
                    <input
                      type="radio"
                      name="type"
                      value="email"
                      checked={formData.type === 'email'}
                      onChange={() => setFormData({ ...formData, type: 'email' })}
                      className="accent-cyan-400"
                    />
                    <Mail size={14} className="text-cyan-400" /> Email Only
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-800 px-3 py-2 rounded-xl border border-white/5">
                    <input
                      type="radio"
                      name="type"
                      value="both"
                      checked={formData.type === 'both'}
                      onChange={() => setFormData({ ...formData, type: 'both' })}
                      className="accent-amber-400"
                    />
                    Both (SMS &amp; Email)
                  </label>
                </div>
              </div>

              {/* Email Subject */}
              {(formData.type === 'email' || formData.type === 'both') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Subject Line</label>
                  <input
                    type="text"
                    placeholder="e.g. Your Rise Up Roofing Estimate for {address}"
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}

              {/* 1-Click Merge Tag Chips */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>1-Click Merge Tags (Tap to insert at cursor)</span>
                  <span className="text-[11px] text-amber-400 font-mono">Dynamic Values</span>
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 rounded-2xl bg-slate-950 border border-white/5">
                  {MERGE_TAGS.map(m => (
                    <button
                      key={m.tag}
                      type="button"
                      onClick={() => handleInsertTag(m.tag)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-amber-300 font-mono text-[11px] font-bold border border-white/5 transition-colors cursor-pointer"
                      title={m.label}
                    >
                      {m.tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Body */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Message Content</label>
                <textarea
                  ref={bodyTextareaRef}
                  rows={5}
                  placeholder="Hi {customer_name}, this is Michael from Rise Up Roofing..."
                  value={formData.body}
                  onChange={e => setFormData({ ...formData, body: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400 leading-relaxed font-sans"
                />
              </div>

              {/* Live Preview Box */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-amber-400/20 space-y-2">
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1">
                  <Eye size={12} /> Live Preview (Homeowner View with Sample Data)
                </span>
                <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line bg-slate-900/80 p-3 rounded-xl border border-white/5">
                  {samplePreviewBody || 'Type your message above to see how it renders with customer tokens replaced.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description / When to Send</label>
                <input
                  type="text"
                  placeholder="e.g. Sent automatically within 5 minutes of emergency tarp request."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 text-xs font-bold shadow-lg transition-all cursor-pointer disabled:opacity-50"
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
