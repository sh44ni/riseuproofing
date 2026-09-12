'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  CheckSquare,
  Square,
  Plus,
  ChevronRight,
  Loader2,
  CheckCircle2,
  StickyNote,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import CustomSelect, { SelectOption } from '@/components/admin/shared/CustomSelect';

export interface TaskItem {
  id: number;
  title: string;
  description?: string | null;
  priority?: string | null;
  work_category?: string | null;
  due_at?: string | null;
  completed_at?: string | null;
  entity_type?: string | null;
  entity_id?: number | null;
  related_name?: string | null;
  lead_name?: string | null;
}

interface DashboardTasksWidgetProps {
  tasks: TaskItem[];
  userId: number;
  userName?: string;
  onRefresh?: () => void;
}

import {
  TASK_PRIORITY_OPTIONS,
  WORK_CATEGORY_OPTIONS,
  PRIORITY_BADGE_MAP,
  CATEGORY_BADGE_MAP,
} from '@/components/admin/shared/taskConstants';

export default function DashboardTasksWidget({
  tasks: initialTasks,
  userId,
  userName = 'Staff',
  onRefresh,
}: DashboardTasksWidgetProps) {
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState('normal');
  const [newWorkCategory, setNewWorkCategory] = useState('Rise Up');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [adding, setAdding] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  // Sync state if prop changes
  React.useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // Compute category counts for open tasks
  const openCount = useMemo(() => tasks.filter((t) => !t.completed_at).length, [tasks]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: 0,
      'Rise Up': 0,
      'Content Creation': 0,
      'Marketing': 0,
    };
    tasks.forEach((t) => {
      if (!t.completed_at) {
        counts.all++;
        const cat = t.work_category || 'Rise Up';
        if (counts[cat] !== undefined) {
          counts[cat]++;
        } else {
          counts[cat] = 1;
        }
      }
    });
    return counts;
  }, [tasks]);

  // Filter tasks by category
  const filteredTasks = useMemo(() => {
    if (selectedCategory === 'all') return tasks;
    return tasks.filter((t) => (t.work_category || 'Rise Up') === selectedCategory);
  }, [tasks, selectedCategory]);

  // Separate and sort active vs completed
  const { activeList, completedList } = useMemo(() => {
    const active: TaskItem[] = [];
    const completed: TaskItem[] = [];

    filteredTasks.forEach((t) => {
      if (t.completed_at) {
        completed.push(t);
      } else {
        active.push(t);
      }
    });

    // Sort active by priority rank first, then ID desc
    active.sort((a, b) => {
      const rankA = PRIORITY_BADGE_MAP[a.priority || 'normal']?.rank ?? 5;
      const rankB = PRIORITY_BADGE_MAP[b.priority || 'normal']?.rank ?? 5;
      if (rankA !== rankB) return rankA - rankB;
      return b.id - a.id;
    });

    return { activeList: active, completedList: completed };
  }, [filteredTasks]);

  async function handleToggleComplete(task: TaskItem) {
    const isCompleted = !task.completed_at;
    setUpdatingId(task.id);

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, completed_at: isCompleted ? new Date().toISOString() : null }
          : t
      )
    );

    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: task.id,
          completed: isCompleted,
        }),
      });
      if (!res.ok) {
        throw new Error('Failed to update task');
      }
      onRefresh?.();
    } catch (err) {
      console.error('Error toggling task completion:', err);
      // Revert optimistic update
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, completed_at: task.completed_at } : t
        )
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDeleteTask(taskId: number) {
    setDeletingId(taskId);
    // Optimistic remove
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    try {
      const res = await fetch(`/api/admin/tasks?id=${taskId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Failed to delete note');
      }
      onRefresh?.();
    } catch (err) {
      console.error('Error deleting task:', err);
      onRefresh?.();
    } finally {
      setDeletingId(null);
    }
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) return;

    setAdding(true);

    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trimmed,
          assignedToUserId: userId,
          assignedTo: userName,
          priority: newPriority,
          workCategory: newWorkCategory,
          eventType: 'todo',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.task) {
          setTasks((prev) => [data.task, ...prev]);
        }
        setNewTitle('');
        onRefresh?.();
      }
    } catch (err) {
      console.error('Error creating sticky note:', err);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="p-5 sm:p-6 rounded-2xl admin-card bg-white border border-slate-200/80 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <StickyNote size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-[#0B1E33]">My Sticky Notes &amp; Reminders</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                {openCount} Active
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Personal sticky notes &amp; to-dos (private to you, decoupled from calendar)</p>
          </div>
        </div>

        <Link
          href="/admin/tasks?tab=personal"
          className="text-xs text-[#1878B8] hover:text-[#0B1E33] font-semibold flex items-center gap-1 transition-colors"
        >
          <span>View All</span>
          <ChevronRight size={13} />
        </Link>
      </div>

      {/* Work Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-[#0B1E33] text-white shadow-2xs'
              : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80'
          }`}
        >
          <span>All</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {categoryCounts.all}
          </span>
        </button>

        {(['Rise Up', 'Content Creation', 'Marketing'] as const).map((cat) => {
          const isSelected = selectedCategory === cat;
          const count = categoryCounts[cat] || 0;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-[#0B1E33] text-white shadow-2xs'
                  : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              <span>{cat}</span>
              {count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Task List */}
      <div className="space-y-2 min-h-[120px]">
        {activeList.length === 0 && completedList.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-1.5">
            <CheckCircle2 size={24} className="text-emerald-500" />
            <p className="font-semibold text-slate-700">All caught up!</p>
            <p className="text-[11px] text-slate-400">
              {selectedCategory === 'all'
                ? 'You have no sticky notes or reminders pending.'
                : `No open notes in "${selectedCategory}". Add one below!`}
            </p>
          </div>
        ) : (
          <>
            {/* Active Notes List */}
            {activeList.length > 0 ? (
              <div className="space-y-2">
                {activeList.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    isUpdating={updatingId === task.id}
                    isDeleting={deletingId === task.id}
                    onToggle={() => handleToggleComplete(task)}
                    onDelete={() => handleDeleteTask(task.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-slate-400 text-xs">
                No active notes in this category.
              </div>
            )}

            {/* Completed Section (Collapsible) */}
            {completedList.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCompleted((prev) => !prev)}
                  className="w-full flex items-center justify-between text-[11px] text-slate-500 font-semibold hover:text-slate-700 py-1 transition-colors cursor-pointer"
                >
                  <span>Completed Notes ({completedList.length})</span>
                  {showCompleted ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>

                {showCompleted && (
                  <div className="space-y-1.5 pt-1 opacity-70">
                    {completedList.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        isUpdating={updatingId === task.id}
                        isDeleting={deletingId === task.id}
                        onToggle={() => handleToggleComplete(task)}
                        onDelete={() => handleDeleteTask(task.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick Add Sticky Note Field at Bottom */}
      <form onSubmit={handleCreateTask} className="pt-3 border-t border-slate-100 space-y-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Write a sticky note or reminder... (e.g. Follow up with homeowner on roof estimate)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            disabled={adding}
            className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 focus:bg-white focus:border-[#1878B8] focus:outline-none transition-colors text-[#0B1E33] placeholder:text-slate-400 shadow-2xs"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Priority Drop Down Menu: Urgent, High, Normal, Low */}
          <div className="w-full sm:w-[125px] shrink-0">
            <CustomSelect
              value={newPriority}
              onChange={setNewPriority}
              options={TASK_PRIORITY_OPTIONS}
              placeholder="Priority..."
              size="sm"
              title="Priority"
            />
          </div>

          {/* Work Category Drop Down Menu: Rise Up, Content Creation, Marketing */}
          <div className="w-full sm:flex-1 min-w-0">
            <CustomSelect
              value={newWorkCategory}
              onChange={setNewWorkCategory}
              options={WORK_CATEGORY_OPTIONS}
              placeholder="Work Category..."
              size="sm"
              title="Work Category"
            />
          </div>

          {/* Add Note Button */}
          <div className="w-full sm:w-auto shrink-0">
            <button
              type="submit"
              disabled={adding || !newTitle.trim()}
              className="w-full sm:w-auto h-[36px] px-3.5 rounded-xl bg-[#1878B8] hover:bg-sky-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-xs active:scale-95 whitespace-nowrap"
            >
              {adding ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <>
                  <Plus size={14} strokeWidth={2.5} />
                  <span>Add Note</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function TaskRow({
  task,
  isUpdating,
  isDeleting,
  onToggle,
  onDelete,
}: {
  task: TaskItem;
  isUpdating: boolean;
  isDeleting: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const isDone = Boolean(task.completed_at);
  const related = task.related_name || task.lead_name;

  const priorityMeta = PRIORITY_BADGE_MAP[task.priority || 'normal'] || PRIORITY_BADGE_MAP.normal;
  const categoryMeta = CATEGORY_BADGE_MAP[task.work_category || 'Rise Up'] || CATEGORY_BADGE_MAP['Rise Up'];

  return (
    <div
      className={`group p-2.5 rounded-xl border transition-all flex items-start gap-2.5 ${
        isDone
          ? 'bg-slate-50/60 border-slate-200/60 text-slate-400'
          : 'bg-white border-slate-200/80 hover:border-slate-300 text-[#0B1E33] shadow-2xs'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={isUpdating || isDeleting}
        className="mt-0.5 text-slate-400 hover:text-[#1878B8] transition-colors flex-shrink-0 cursor-pointer disabled:opacity-50"
        title={isDone ? 'Mark active' : 'Mark complete'}
      >
        {isUpdating ? (
          <Loader2 size={16} className="animate-spin text-slate-400" />
        ) : isDone ? (
          <CheckSquare size={16} className="text-emerald-600" />
        ) : (
          <Square size={16} />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`text-xs font-semibold leading-snug break-words ${
              isDone ? 'line-through text-slate-400' : 'text-[#0B1E33]'
            }`}
          >
            {task.title}
          </span>
        </div>

        {/* Badges row: Priority & Work Category */}
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${priorityMeta.badgeClass}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${priorityMeta.dot}`} />
            <span>{priorityMeta.label}</span>
          </span>

          <span
            className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${categoryMeta.badgeClass}`}
          >
            {categoryMeta.label}
          </span>

          {task.due_at && !isDone && (
            <span className="text-[10px] font-mono text-slate-400">
              {new Date(task.due_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
        </div>

        {/* Linked Customer / Job Reference */}
        {related && (
          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Linked to:</span>
            {task.entity_type === 'lead' && task.entity_id ? (
              <Link
                href={`/admin/leads/${task.entity_id}`}
                className="font-medium text-[#1878B8] hover:underline truncate"
              >
                {related}
              </Link>
            ) : task.entity_type === 'job' && task.entity_id ? (
              <Link
                href={`/admin/jobs?id=${task.entity_id}`}
                className="font-medium text-[#1878B8] hover:underline truncate"
              >
                {related}
              </Link>
            ) : (
              <span className="font-medium text-slate-600 truncate">{related}</span>
            )}
          </div>
        )}
      </div>

      {/* Delete button (hover on desktop, always visible subtly) */}
      <button
        type="button"
        onClick={onDelete}
        disabled={isDeleting || isUpdating}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 cursor-pointer flex-shrink-0"
        title="Delete sticky note"
      >
        {isDeleting ? (
          <Loader2 size={13} className="animate-spin text-rose-500" />
        ) : (
          <Trash2 size={13} />
        )}
      </button>
    </div>
  );
}
