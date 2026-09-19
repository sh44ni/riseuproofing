import React, { useState } from 'react';
import {
  X,
  Plus,
  Clock,
  Calendar,
  User,
  FileText,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { CrmTask, TaskCategory, TaskPriority } from '@/types/taskTypes';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: CrmTask) => void;
}

export function CreateTaskModal({
  isOpen,
  onClose,
  onAddTask,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [estimateAmount, setEstimateAmount] = useState<string>('');
  const [category, setCategory] = useState<TaskCategory>('rise_up');
  const [priority, setPriority] = useState<TaskPriority>('normal');
  const [dueDateStr, setDueDateStr] = useState('Sep 20, 2:00 PM');
  const [assignedTo, setAssignedTo] = useState('Unassigned');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const LEAD_PRESETS = [
    { name: 'David Martinez', task: 'Follow-up on $24,850 Duration Shingles Estimate', cat: 'estimate_followup' as TaskCategory, amount: 24850 },
    { name: 'Priya Sanchez', task: 'Review 1-Yr Warranty Audit Sign-off', cat: 'rise_up' as TaskCategory, amount: 0 },
    { name: 'Kenneth Brooks', task: 'Submit Carlsbad City Sheathing Inspection Permit', cat: 'permits_city' as TaskCategory, amount: 0 },
    { name: 'Arthur Pendelton', task: 'Deliver Drone 4K Roof Audit Inspection Report', cat: 'estimate_followup' as TaskCategory, amount: 38200 },
  ];

  const handleSelectPreset = (p: typeof LEAD_PRESETS[0]) => {
    setClientName(p.name);
    setTitle(p.task);
    setCategory(p.cat);
    if (p.amount > 0) setEstimateAmount(String(p.amount));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTask: CrmTask = {
      id: `tsk-${Date.now()}`,
      title: title.trim(),
      clientName: clientName.trim() || undefined,
      estimateAmount: estimateAmount ? Number(estimateAmount) : undefined,
      category,
      priority,
      status: 'active',
      dueDate: new Date().toISOString(),
      dueDateFormatted: dueDateStr || 'Tomorrow, 5:00 PM',
      isUpcoming: true,
      assignedTo: assignedTo || 'Unassigned',
      assignedInitials: assignedTo !== 'Unassigned' ? assignedTo.slice(0, 2).toUpperCase() : undefined,
      description: description.trim() || undefined,
    };

    onAddTask(newTask);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center shadow-xs">
              <Plus size={20} className="stroke-[3]" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Create New Task or Follow-Up
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Operations checklist, client follow-up, or estimate tracking
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200/60 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Quick 1-Click Preset */}
          <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-1.5">
            <label className="font-bold text-amber-900 block">
              Quick Lead / Estimate Preset
            </label>
            <div className="flex flex-wrap gap-1.5">
              {LEAD_PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-[11px] font-bold text-slate-800 hover:border-amber-500 transition-all shadow-2xs"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Task Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Priya Sanchez or Follow-up on Proposal"
              className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Client & Estimate Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Client / Homeowner</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="David Martinez"
                className="w-full p-2 rounded-xl border border-slate-300 text-slate-900 font-semibold focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Linked Estimate $ (Optional)</label>
              <input
                type="number"
                value={estimateAmount}
                onChange={(e) => setEstimateAmount(e.target.value)}
                placeholder="24850"
                className="w-full p-2 rounded-xl border border-slate-300 text-slate-900 font-semibold focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full p-2 rounded-xl border border-slate-300 text-slate-900 font-semibold focus:outline-none focus:border-amber-400"
              >
                <option value="rise_up">Rise Up</option>
                <option value="estimate_followup">Estimate Follow-up</option>
                <option value="permits_city">City Permits</option>
                <option value="content_creation">Content Creation</option>
                <option value="marketing">Marketing</option>
                <option value="general">Operations</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full p-2 rounded-xl border border-slate-300 text-slate-900 font-semibold focus:outline-none focus:border-amber-400"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Due Date & Assignee */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Due Date &amp; Time</label>
              <input
                type="text"
                value={dueDateStr}
                onChange={(e) => setDueDateStr(e.target.value)}
                placeholder="Sep 19, 9:00 PM"
                className="w-full p-2 rounded-xl border border-slate-300 text-slate-900 font-semibold focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Assignee</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-300 text-slate-900 font-semibold focus:outline-none focus:border-amber-400"
              >
                <option value="Unassigned">⚠️ Unassigned</option>
                <option value="Marco Silva">Marco Silva (Field Foreman)</option>
                <option value="Carlos Ramirez">Carlos Ramirez (Project Manager)</option>
                <option value="Jessica Hayes">Jessica Hayes (Sales Rep)</option>
                <option value="Sarah Jenkins">Sarah Jenkins (Field Inspector)</option>
                <option value="Sam Martinez">Sam Martinez (Owner)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Notes &amp; Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Sample text entry for exploratory testing..."
              className="w-full p-2 rounded-xl border border-slate-300 text-slate-900 font-semibold focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 font-black shadow-md shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
