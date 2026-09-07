'use client';

import React, { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  RefreshCw,
  Clock,
  Hammer,
  DollarSign,
  ShieldCheck,
  Calendar,
  CheckSquare,
  FileText,
  ClipboardCheck,
} from 'lucide-react';
import ClientProfileHeader from '@/components/admin/clients/ClientProfileHeader';
import ClientOverviewTab from '@/components/admin/clients/ClientTabs/ClientOverviewTab';
import ClientTimelineTab from '@/components/admin/clients/ClientTabs/ClientTimelineTab';
import ClientQuotesJobsTab from '@/components/admin/clients/ClientTabs/ClientQuotesJobsTab';
import ClientBillingTab from '@/components/admin/clients/ClientTabs/ClientBillingTab';
import ClientWarrantiesInspectionsTab from '@/components/admin/clients/ClientTabs/ClientWarrantiesInspectionsTab';
import ClientTasksTab from '@/components/admin/clients/ClientTabs/ClientTasksTab';
import BottomSheet from '@/components/admin/shared/BottomSheet';

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolved = use(params);
  const clientId = resolved.id;
  const router = useRouter();

  const [client, setClient] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [estimates, setEstimates] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [warranties, setWarranties] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab navigation: 'overview' | 'timeline' | 'quotes' | 'billing' | 'warranties' | 'tasks'
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Edit Specs Modal state
  const [showEditSpecs, setShowEditSpecs] = useState(false);
  const [specsForm, setSpecsForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    zip: '',
    roof_type: '',
    roof_sqf: '',
    roof_age: '',
    stories: '1',
    hoa: false,
    notes: '',
  });
  const [savingSpecs, setSavingSpecs] = useState(false);

  // Log Activity Modal state
  const [showLogActivity, setShowLogActivity] = useState(false);
  const [logType, setLogType] = useState('call');
  const [logTitle, setLogTitle] = useState('');
  const [logDesc, setLogDesc] = useState('');
  const [savingLog, setSavingLog] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`);
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (!res.ok) {
        router.push('/admin/clients');
        return;
      }

      const data = await res.json();
      setClient(data.client);
      setLeads(data.leads || []);
      setInspections(data.inspections || []);
      setEstimates(data.estimates || []);
      setJobs(data.jobs || []);
      setInvoices(data.invoices || []);
      setWarranties(data.warranties || []);
      setReviews(data.reviews || []);
      setActivities(data.activities || []);
      setTasks(data.tasks || []);

      setSpecsForm({
        full_name: data.client.full_name || '',
        phone: data.client.phone || '',
        email: data.client.email || '',
        address: data.client.address || '',
        city: data.client.city || '',
        zip: data.client.zip || '',
        roof_type: data.client.roof_type || 'Concrete Tile',
        roof_sqf: data.client.roof_sqf ? String(data.client.roof_sqf) : '',
        roof_age: data.client.roof_age ? String(data.client.roof_age) : '',
        stories: data.client.stories ? String(data.client.stories) : '1',
        hoa: Boolean(data.client.hoa),
        notes: data.client.notes || '',
      });
    } catch (err) {
      console.error('Failed to load client 360 data', err);
    } finally {
      setLoading(false);
    }
  }, [clientId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSaveSpecs(e: React.FormEvent) {
    e.preventDefault();
    setSavingSpecs(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: specsForm.full_name,
          phone: specsForm.phone,
          email: specsForm.email,
          address: specsForm.address,
          city: specsForm.city,
          zip: specsForm.zip,
          roof_type: specsForm.roof_type,
          roof_sqf: specsForm.roof_sqf ? parseInt(specsForm.roof_sqf, 10) : null,
          roof_age: specsForm.roof_age ? parseInt(specsForm.roof_age, 10) : null,
          stories: specsForm.stories ? parseInt(specsForm.stories, 10) : 1,
          hoa: Boolean(specsForm.hoa),
          notes: specsForm.notes,
        }),
      });

      if (res.ok) {
        setShowEditSpecs(false);
        loadData();
      }
    } catch (err) {
      console.error('Failed to update client', err);
    } finally {
      setSavingSpecs(false);
    }
  }

  async function handleSaveLog(e: React.FormEvent) {
    e.preventDefault();
    if (!logTitle.trim()) return;

    setSavingLog(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityType: logType,
          title: logTitle,
          description: logDesc,
        }),
      });

      if (res.ok) {
        setLogTitle('');
        setLogDesc('');
        setShowLogActivity(false);
        loadData();
      }
    } catch (err) {
      console.error('Failed to log activity', err);
    } finally {
      setSavingLog(false);
    }
  }

  if (loading || !client) {
    return (
      <div className="p-16 text-center">
        <RefreshCw size={28} className="mx-auto text-slate-400 animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-500">Loading Client 360 Profile...</p>
      </div>
    );
  }

  const TABS = [
    { id: 'overview', label: '360° Overview' },
    { id: 'timeline', label: 'Timeline', count: activities.length },
    { id: 'quotes', label: 'Quotes & Jobs', count: estimates.length + jobs.length },
    { id: 'billing', label: 'Billing & Invoices', count: invoices.length },
    {
      id: 'warranties',
      label: 'Warranties & Inspections',
      count: warranties.length + inspections.length,
    },
    { id: 'tasks', label: 'Tasks', count: tasks.filter(t => !t.completed_at).length },
  ];

  return (
    <div className="space-y-5">
      {/* Sticky Action Header */}
      <ClientProfileHeader
        client={client}
        onEditSpecs={() => setShowEditSpecs(true)}
        onLogActivity={() => setShowLogActivity(true)}
      />

      {/* Swipeable / Scrollable Segmented Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar border-b border-slate-200/80">
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer select-none ${
                active
                  ? 'bg-[#0B1E33] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    active ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'overview' && (
          <ClientOverviewTab
            client={client}
            jobs={jobs}
            estimates={estimates}
            invoices={invoices}
            warranties={warranties}
            inspections={inspections}
            tasks={tasks}
            onSelectTab={setActiveTab}
            onEditSpecs={() => setShowEditSpecs(true)}
          />
        )}

        {activeTab === 'timeline' && (
          <ClientTimelineTab
            clientId={Number(clientId)}
            activities={activities}
            onActivityAdded={loadData}
          />
        )}

        {activeTab === 'quotes' && (
          <ClientQuotesJobsTab
            client={client}
            estimates={estimates}
            jobs={jobs}
            leads={leads}
          />
        )}

        {activeTab === 'billing' && (
          <ClientBillingTab client={client} invoices={invoices} jobs={jobs} />
        )}

        {activeTab === 'warranties' && (
          <ClientWarrantiesInspectionsTab
            client={client}
            warranties={warranties}
            inspections={inspections}
          />
        )}

        {activeTab === 'tasks' && (
          <ClientTasksTab
            clientId={Number(clientId)}
            tasks={tasks}
            onTaskUpdated={loadData}
          />
        )}
      </div>

      {/* Edit Specs Bottom Sheet */}
      <BottomSheet
        isOpen={showEditSpecs}
        onClose={() => setShowEditSpecs(false)}
        title="Edit Client & Property Specifications"
      >
        <form onSubmit={handleSaveSpecs} className="space-y-4 max-w-xl mx-auto pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={specsForm.full_name}
                onChange={e => setSpecsForm({ ...specsForm, full_name: e.target.value })}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-sm focus:border-[#2F9FE3] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
              <input
                type="tel"
                value={specsForm.phone}
                onChange={e => setSpecsForm({ ...specsForm, phone: e.target.value })}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-sm focus:border-[#2F9FE3] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={specsForm.email}
                onChange={e => setSpecsForm({ ...specsForm, email: e.target.value })}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-sm focus:border-[#2F9FE3] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Street Address</label>
              <input
                type="text"
                value={specsForm.address}
                onChange={e => setSpecsForm({ ...specsForm, address: e.target.value })}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-sm focus:border-[#2F9FE3] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={specsForm.city}
                onChange={e => setSpecsForm({ ...specsForm, city: e.target.value })}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-sm focus:border-[#2F9FE3] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ZIP</label>
              <input
                type="text"
                value={specsForm.zip}
                onChange={e => setSpecsForm({ ...specsForm, zip: e.target.value })}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-sm focus:border-[#2F9FE3] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Roof Material</label>
              <input
                type="text"
                value={specsForm.roof_type}
                onChange={e => setSpecsForm({ ...specsForm, roof_type: e.target.value })}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-sm focus:border-[#2F9FE3] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Roof Area (Sq Ft)</label>
              <input
                type="number"
                value={specsForm.roof_sqf}
                onChange={e => setSpecsForm({ ...specsForm, roof_sqf: e.target.value })}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-sm focus:border-[#2F9FE3] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Roof Age (Yrs)</label>
              <input
                type="number"
                value={specsForm.roof_age}
                onChange={e => setSpecsForm({ ...specsForm, roof_age: e.target.value })}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-sm focus:border-[#2F9FE3] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Client Notes</label>
            <textarea
              rows={3}
              value={specsForm.notes}
              onChange={e => setSpecsForm({ ...specsForm, notes: e.target.value })}
              className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-sm focus:border-[#2F9FE3] outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowEditSpecs(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingSpecs}
              className="px-5 py-2 text-xs font-bold text-white bg-[#0B1E33] hover:bg-[#1878B8] rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              {savingSpecs ? 'Saving...' : 'Save Updates'}
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Log Activity Modal Sheet */}
      <BottomSheet
        isOpen={showLogActivity}
        onClose={() => setShowLogActivity(false)}
        title="Log Activity to Timeline"
      >
        <form onSubmit={handleSaveLog} className="space-y-4 max-w-xl mx-auto pb-4">
          <div className="flex rounded-xl p-1 bg-slate-100 text-xs font-semibold">
            {(['call', 'note', 'text', 'email'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setLogType(type)}
                className={`flex-1 py-1.5 rounded-lg capitalize transition-colors cursor-pointer ${
                  logType === type
                    ? 'bg-white text-[#0B1E33] shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {type === 'call'
                  ? '📞 Call'
                  : type === 'note'
                  ? '📝 Note'
                  : type === 'text'
                  ? '💬 SMS'
                  : '📧 Email'}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Title / Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Outbound call to confirm Thursday inspection"
              value={logTitle}
              onChange={e => setLogTitle(e.target.value)}
              className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-sm focus:border-[#2F9FE3] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Details of conversation or notes..."
              value={logDesc}
              onChange={e => setLogDesc(e.target.value)}
              className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-sm focus:border-[#2F9FE3] outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowLogActivity(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingLog || !logTitle.trim()}
              className="px-5 py-2 text-xs font-bold text-white bg-[#0B1E33] hover:bg-[#1878B8] rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              {savingLog ? 'Saving...' : 'Save to Timeline'}
            </button>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}
