import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Pin,
  Trash2,
  FileText,
  Check,
  Clock,
  CheckSquare,
  Sparkles,
  ExternalLink,
  Edit3,
  Search,
} from 'lucide-react';
import {
  PersonalTask,
  TaskPriority,
  WorkCategory,
  PRIORITY_OPTIONS,
  WORK_CATEGORIES,
} from '@/lib/personalTasksStore';
import { CreatePersonalTaskModal } from '@/components/common/CreatePersonalTaskModal';
import { PersonalTaskDetailModal } from '@/components/common/PersonalTaskDetailModal';

interface PersonalStickyBoardProps {
  tasks: PersonalTask[];
  onAddTask: (task: Omit<PersonalTask, 'id' | 'createdAt'>) => Promise<any>;
  onUpdateTask: (id: string, updates: Partial<PersonalTask>) => Promise<void>;
  onToggleTask: (id: string) => Promise<void>;
  onTogglePin: (id: string) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  completedCount: number;
  progressPercent: number;
}

const CATEGORY_STYLES: Record<WorkCategory, { bg: string; border: string; header: string; accent: string }> = {
  'Rise Up': {
    bg: 'bg-sky-50/95',
    border: 'border-sky-200/90',
    header: 'text-sky-950',
    accent: '#0284c7',
  },
  'Content Creation': {
    bg: 'bg-purple-50/95',
    border: 'border-purple-200/90',
    header: 'text-purple-950',
    accent: '#7c3aed',
  },
  'Marketing': {
    bg: 'bg-emerald-50/95',
    border: 'border-emerald-200/90',
    header: 'text-emerald-950',
    accent: '#059669',
  },
};

export function PersonalStickyBoard({
  tasks,
  onAddTask,
  onUpdateTask,
  onToggleTask,
  onTogglePin,
  onDeleteTask,
  completedCount,
  progressPercent,
}: PersonalStickyBoardProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | WorkCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<PersonalTask | null>(null);

  // Local draft notes map for responsive debounce typing
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    const draftMap: Record<string, string> = {};
    tasks.forEach((t) => {
      draftMap[t.id] = t.notes || '';
    });
    setDraftNotes(draftMap);
  }, [tasks]);

  const handleNoteChange = (taskId: string, text: string) => {
    setDraftNotes((prev) => ({ ...prev, [taskId]: text }));
  };

  const handleNoteBlur = (taskId: string) => {
    const currentTask = tasks.find((t) => t.id === taskId);
    const newNotes = (draftNotes[taskId] || '').trim();
    if (currentTask && (currentTask.notes || '') !== newNotes) {
      onUpdateTask(taskId, { notes: newNotes });
    }
  };

  // Filtered & Sorted Tasks (Pinned first, then active, then completed)
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        if (selectedCategory !== 'all' && t.workCategory !== selectedCategory) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = t.title.toLowerCase().includes(q);
          const matchNotes = (t.notes || '').toLowerCase().includes(q);
          const matchCategory = t.workCategory.toLowerCase().includes(q);
          if (!matchTitle && !matchNotes && !matchCategory) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const isAPinned = a.isPinned || (a.sortOrder !== undefined && a.sortOrder < 0);
        const isBPinned = b.isPinned || (b.sortOrder !== undefined && b.sortOrder < 0);
        if (isAPinned && !isBPinned) return -1;
        if (!isAPinned && isBPinned) return 1;

        if (a.completed && !b.completed) return 1;
        if (!a.completed && b.completed) return -1;

        return 0;
      });
  }, [tasks, selectedCategory, searchQuery]);

  return (
    <div className="space-y-4 select-none">
      {/* 1. Header Card with Live Progress & Quick Add */}
      <div className="p-4 rounded-3xl bg-white/90 light-glass-panel border border-white/90 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 shadow-2xs">
                <CheckSquare size={15} className="stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <span>Dashboard Sticky Notes &amp; Personal To-Dos</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-[#0284c7]">
                    Live Synced
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Synchronized live in real-time with your Executive Dashboard right-hand dock.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Action button */}
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#1878B8] via-[#0284c7] to-[#38bdf8] text-white font-black text-xs shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer border border-sky-300/60"
            >
              <Plus size={14} className="stroke-[3]" />
              <span>New Sticky Note</span>
            </button>
          </div>
        </div>

        {/* Dynamic Progress Bar & Filter Strip */}
        <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Progress Summary */}
          <div className="flex items-center gap-3 min-w-[240px]">
            <div className="flex-1 max-w-[200px] bg-slate-100 border border-slate-200/80 rounded-full h-2 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-[#1878B8] to-emerald-500 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-bold text-slate-700">
              <span className="text-emerald-600 font-black">{completedCount}</span> of {tasks.length} done ({progressPercent}%)
            </span>
          </div>

          {/* Work Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              All ({tasks.length})
            </button>
            {WORK_CATEGORIES.map((cat) => {
              const count = tasks.filter((t) => t.workCategory === cat.id).length;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${cat.dotClass}`} />
                  <span>{cat.label}</span>
                  {count > 0 && <span className="opacity-75 text-[10px]">({count})</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Sticky Notes Grid */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-white/60 light-glass-panel border border-dashed border-slate-300">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#0284c7] flex items-center justify-center mx-auto mb-3 border border-sky-200/80 shadow-2xs">
            <FileText size={22} />
          </div>
          <h4 className="font-bold text-sm text-slate-800">No Sticky Notes Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {searchQuery
              ? 'No notes match your current search query. Try clearing the filter.'
              : 'Add your first personal reminder or to-do. It will instantly sync with your dashboard dock.'}
          </p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1878B8] hover:bg-sky-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Plus size={14} className="stroke-[3]" />
            <span>Create New Note</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredTasks.map((task) => {
            const currentPriority =
              PRIORITY_OPTIONS.find((p) => p.id === task.priority) || PRIORITY_OPTIONS[2];
            const currentCategory =
              WORK_CATEGORIES.find((c) => c.id === task.workCategory) || WORK_CATEGORIES[0];
            const cStyle = CATEGORY_STYLES[task.workCategory] || CATEGORY_STYLES['Rise Up'];
            const isPinned = task.isPinned || (task.sortOrder !== undefined && task.sortOrder < 0);

            return (
              <div
                key={task.id}
                className={`p-4 rounded-3xl border transition-all flex flex-col justify-between space-y-3 relative group ${
                  task.completed
                    ? 'bg-slate-50/80 border-slate-200/70 opacity-70 hover:opacity-100 shadow-2xs'
                    : `${cStyle.bg} ${cStyle.border} shadow-2xs hover:shadow-md hover:scale-[1.01]`
                }`}
              >
                <div className="space-y-2.5">
                  {/* Card Header: Checkbox + Title + Badges + Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleTask(task.id);
                        }}
                        aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all shrink-0 mt-0.5 cursor-pointer ${
                          task.completed
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs scale-105'
                            : 'border-slate-300 group-hover:border-[#1878B8] bg-white text-transparent hover:bg-sky-50'
                        }`}
                      >
                        <Check size={12} className="stroke-[3]" />
                      </button>

                      {/* Title */}
                      <div className="min-w-0 flex-1">
                        <h4
                          onClick={() => setSelectedTaskForDetail(task)}
                          className={`font-black text-xs leading-snug cursor-pointer transition-colors ${
                            task.completed
                              ? 'line-through text-slate-400'
                              : `${cStyle.header} hover:text-[#0284c7]`
                          }`}
                          title="Click to view full details"
                        >
                          {task.title}
                        </h4>

                        {/* Badges Strip */}
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {/* Work Category Badge */}
                          <span
                            className={`inline-flex items-center gap-1 text-[8.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border shadow-2xs ${currentCategory.badgeClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${currentCategory.dotClass}`} />
                            {currentCategory.label}
                          </span>

                          {/* Priority Badge */}
                          <span
                            className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-md border shadow-2xs shrink-0 inline-flex items-center gap-1 ${currentPriority.badgeClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${currentPriority.dotClass}`} />
                            {currentPriority.label}
                          </span>

                          {/* Due Date */}
                          {task.dueDate && (
                            <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded-md bg-white/80 border border-slate-200/80 text-slate-600 shadow-2xs">
                              📅 {task.dueDate}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Pin and Delete icons */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Pin button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePin(task.id);
                        }}
                        title={isPinned ? 'Unpin Note' : 'Pin to Top'}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isPinned
                            ? 'text-amber-700 bg-amber-200/70 shadow-2xs'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-black/5'
                        }`}
                      >
                        <Pin size={12} className={isPinned ? 'fill-current' : ''} />
                      </button>

                      {/* Edit Details button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTaskForDetail(task);
                        }}
                        title="Edit Details"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-black/5 transition-colors cursor-pointer"
                      >
                        <Edit3 size={12} />
                      </button>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete sticky note "${task.title}"?`)) {
                            onDeleteTask(task.id);
                          }
                        }}
                        title="Delete Note"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Notes content editable textarea */}
                  <div className="pt-1">
                    <textarea
                      rows={3}
                      value={draftNotes[task.id] !== undefined ? draftNotes[task.id] : task.notes || ''}
                      onChange={(e) => handleNoteChange(task.id, e.target.value)}
                      onBlur={() => handleNoteBlur(task.id)}
                      placeholder="Add personal notes, phone numbers, or talk tracks..."
                      className={`w-full text-xs bg-transparent resize-none border border-transparent hover:border-black/10 focus:border-sky-400/50 focus:bg-white/60 p-1.5 rounded-xl transition-all focus:outline-none font-medium leading-relaxed placeholder:text-slate-400 ${
                        task.completed ? 'text-slate-400 line-through' : 'text-slate-800'
                      }`}
                    />
                  </div>
                </div>

                {/* Card Footer: Timestamp + Pin indicator */}
                <div className="pt-2 border-t border-black/5 flex items-center justify-between text-[9.5px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock size={10} className="text-slate-400" />
                    <span>
                      {task.updatedAt
                        ? new Date(task.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Today'}
                    </span>
                  </span>

                  <div className="flex items-center gap-2">
                    {isPinned && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded-full border border-amber-200">
                        📌 Pinned
                      </span>
                    )}
                    {task.completed && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded-full border border-emerald-200">
                        ✓ Done
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Create Note Modal */}
      <CreatePersonalTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onAddTask={onAddTask}
      />

      {/* 4. Task Detail Inspector Modal */}
      <PersonalTaskDetailModal
        task={selectedTaskForDetail}
        isOpen={!!selectedTaskForDetail}
        onClose={() => setSelectedTaskForDetail(null)}
        onUpdate={onUpdateTask}
        onDelete={onDeleteTask}
        onToggle={onToggleTask}
      />
    </div>
  );
}
