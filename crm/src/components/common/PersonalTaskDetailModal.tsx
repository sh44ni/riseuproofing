import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Check,
  Trash2,
  Calendar,
  Tag,
  Clock,
  Save,
  AlertCircle,
} from 'lucide-react';
import {
  PersonalTask,
  TaskPriority,
  WorkCategory,
  PRIORITY_OPTIONS,
  WORK_CATEGORIES,
} from '@/lib/personalTasksStore';
import { CrmModal } from './CrmModal';

export interface PersonalTaskDetailModalProps {
  task: PersonalTask | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<PersonalTask>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onToggle: (id: string) => Promise<void>;
}

export function PersonalTaskDetailModal({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onToggle,
}: PersonalTaskDetailModalProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('normal');
  const [workCategory, setWorkCategory] = useState<WorkCategory>('Rise Up');
  const [dueDate, setDueDate] = useState('Today');
  const [notes, setNotes] = useState('');
  const [completed, setCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title || '');
      setPriority(task.priority || 'normal');
      setWorkCategory(task.workCategory || 'Rise Up');
      setDueDate(task.dueDate || 'Today');
      setCompleted(!!task.completed);
      setNotes((task as any).notes || '');
    }
  }, [task, isOpen]);

  if (!isOpen || !task) return null;

  const handleToggleCompleted = async () => {
    const nextCompleted = !completed;
    setCompleted(nextCompleted);
    await onToggle(task.id);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() || isSaving) return;

    setIsSaving(true);
    try {
      await onUpdate(task.id, {
        title: title.trim(),
        priority,
        workCategory,
        dueDate,
        completed,
        notes: notes.trim(),
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Delete this personal sticky note?')) {
      setIsDeleting(true);
      try {
        await onDelete(task.id);
        onClose();
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const footer = (
    <div className="w-full flex items-center justify-between gap-3">
      {/* Delete Action */}
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200/80 transition-all cursor-pointer hover:border-rose-300"
      >
        <Trash2 size={13} />
        <span>{isDeleting ? 'Deleting...' : 'Delete Note'}</span>
      </button>

      {/* Save & Cancel Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-2xs"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={!title.trim() || isSaving}
          className="flex items-center justify-center gap-1.5 px-6 py-2 rounded-xl bg-gradient-to-r from-[#1878B8] via-[#0284c7] to-[#38bdf8] hover:brightness-105 active:scale-[0.98] text-white text-xs font-black shadow-[0_4px_16px_rgba(24,120,184,0.35)] hover:shadow-[0_6px_22px_rgba(24,120,184,0.45)] transition-all disabled:opacity-50 cursor-pointer"
        >
          <Save size={14} className="stroke-[2.5]" />
          <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <CrmModal
      isOpen={isOpen}
      onClose={onClose}
      title="Sticky Note Details"
      subtitle="View, edit priority, work category, or mark status."
      badge={{
        label: completed ? 'Completed' : 'Pending',
        variant: completed ? 'emerald' : 'sky',
      }}
      icon={<CheckSquare size={18} className="stroke-[2.5]" />}
      iconGradient="from-[#1878B8] to-[#0284c7]"
      maxWidth="lg"
      footer={footer}
    >
      <form onSubmit={handleSave} className="space-y-4 text-xs text-slate-800">
        {/* ========================================================
            STATUS TOGGLE HERO BANNER
            ======================================================== */}
        <div
          onClick={handleToggleCompleted}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between shadow-2xs ${
            completed
              ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900 hover:bg-emerald-100/90'
              : 'bg-slate-50/80 border-slate-200/90 text-slate-700 hover:bg-sky-50/80 hover:border-sky-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                completed
                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                  : 'bg-white border-slate-300'
              }`}
            >
              {completed && <Check size={14} className="stroke-[3]" />}
            </div>
            <div>
              <div className="font-bold text-xs">
                {completed ? 'Marked as Completed' : 'Status: In Progress'}
              </div>
              <div className="text-[10.5px] opacity-75">
                {completed ? 'Click to mark as active/pending again' : 'Click to mark as completed'}
              </div>
            </div>
          </div>

          <span
            className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-2xs ${
              completed
                ? 'bg-white text-emerald-800 border-emerald-300'
                : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            {completed ? 'Done' : 'Active'}
          </span>
        </div>

        {/* ========================================================
            SECTION 1: NOTE TITLE / CONTENT
            ======================================================== */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-3.5 rounded-full bg-gradient-to-b from-[#1878B8] to-[#55C4F5]" />
            <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-500">
              Sticky Note Content
            </span>
            <div className="h-px bg-gradient-to-r from-slate-200 via-slate-100 to-transparent flex-1" />
          </div>

          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Call HOA property manager regarding Vista permit"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 focus:border-[#1878B8] focus:ring-3 focus:ring-sky-400/20 text-xs font-bold text-slate-900 placeholder-slate-400 outline-none transition-all shadow-2xs"
          />
        </div>

        {/* ========================================================
            SECTION 2: PRIORITY LEVEL SELECTION
            ======================================================== */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-3.5 rounded-full bg-gradient-to-b from-amber-500 to-rose-500" />
            <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-500">
              Priority Level
            </span>
            <div className="h-px bg-gradient-to-r from-slate-200 via-slate-100 to-transparent flex-1" />
            <span className="text-[10px] text-slate-400 font-medium">Color-coded badge</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRIORITY_OPTIONS.map((opt) => {
              const isSelected = priority === opt.id;

              let selectedClass = '';
              if (opt.id === 'urgent') {
                selectedClass = isSelected
                  ? 'bg-rose-50/90 border-rose-300 text-rose-800 ring-2 ring-rose-400/30 shadow-xs scale-[1.02]'
                  : 'bg-slate-50/80 hover:bg-white border-slate-200/90 text-slate-600 hover:text-slate-900 shadow-2xs';
              } else if (opt.id === 'high') {
                selectedClass = isSelected
                  ? 'bg-amber-50/90 border-amber-300 text-amber-900 ring-2 ring-amber-400/30 shadow-xs scale-[1.02]'
                  : 'bg-slate-50/80 hover:bg-white border-slate-200/90 text-slate-600 hover:text-slate-900 shadow-2xs';
              } else if (opt.id === 'normal') {
                selectedClass = isSelected
                  ? 'bg-sky-50/90 border-sky-300 text-[#0284c7] ring-2 ring-sky-400/30 shadow-xs scale-[1.02]'
                  : 'bg-slate-50/80 hover:bg-white border-slate-200/90 text-slate-600 hover:text-slate-900 shadow-2xs';
              } else {
                selectedClass = isSelected
                  ? 'bg-slate-100 border-slate-300 text-slate-800 ring-2 ring-slate-400/30 shadow-xs scale-[1.02]'
                  : 'bg-slate-50/80 hover:bg-white border-slate-200/90 text-slate-600 hover:text-slate-900 shadow-2xs';
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPriority(opt.id)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer text-left ${selectedClass}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${opt.dotClass}`} />
                    <span className="text-xs font-bold">{opt.label}</span>
                  </div>
                  {isSelected && <Check size={12} className="stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================
            SECTION 3: WORK CATEGORY SELECTION
            ======================================================== */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-3.5 rounded-full bg-gradient-to-b from-[#1878B8] to-purple-500" />
            <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-500">
              Work Category
            </span>
            <div className="h-px bg-gradient-to-r from-slate-200 via-slate-100 to-transparent flex-1" />
            <span className="text-[10px] text-slate-400 font-medium">Project stream</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {WORK_CATEGORIES.map((cat) => {
              const isSelected = workCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setWorkCategory(cat.id)}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-50/90 border-[#1878B8] text-[#0284c7] ring-2 ring-sky-400/25 shadow-xs scale-[1.02] font-black'
                      : 'bg-slate-50/80 hover:bg-white border-slate-200/90 text-slate-600 hover:text-slate-900 shadow-2xs font-semibold'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${cat.dotClass}`} />
                  <span className="text-xs">{cat.label}</span>
                  {isSelected && <Check size={11} className="stroke-[3] ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================
            SECTION 4: DUE DATE / REMINDER SHORTCUTS
            ======================================================== */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-3.5 rounded-full bg-slate-400" />
            <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-500">
              Due Date / Reminder
            </span>
            <div className="h-px bg-gradient-to-r from-slate-200 via-slate-100 to-transparent flex-1" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {['Today', 'Tomorrow', 'This Week', 'Pending'].map((chip) => {
              const isSelected = dueDate === chip;
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setDueDate(chip)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-[#1878B8] text-white border-[#1878B8] shadow-xs font-bold scale-105'
                      : 'bg-slate-50/80 hover:bg-white text-slate-600 hover:text-slate-900 border-slate-200/90 shadow-2xs font-semibold'
                  }`}
                >
                  {chip}
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================
            SECTION 5: OPTIONAL DETAILED NOTES
            ======================================================== */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-3.5 rounded-full bg-slate-400" />
            <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-500">
              Additional Details / Follow-Up Notes
            </span>
            <div className="h-px bg-gradient-to-r from-slate-200 via-slate-100 to-transparent flex-1" />
          </div>

          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any extra phone numbers, reference permit IDs, or instructions..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 focus:border-[#1878B8] focus:ring-3 focus:ring-sky-400/20 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none transition-all resize-none shadow-2xs"
          />
        </div>
      </form>
    </CrmModal>
  );
}
