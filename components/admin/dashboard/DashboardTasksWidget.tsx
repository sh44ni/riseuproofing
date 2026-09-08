'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckSquare,
  Square,
  Plus,
  Calendar,
  AlertCircle,
  Clock,
  ChevronRight,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import CustomDatePicker from '@/components/admin/shared/CustomDatePicker';

export interface TaskItem {
  id: number;
  title: string;
  description?: string | null;
  priority?: string | null;
  due_at: string;
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

export default function DashboardTasksWidget({
  tasks: initialTasks,
  userId,
  userName = 'Staff',
  onRefresh,
}: DashboardTasksWidgetProps) {
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [adding, setAdding] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Sync state if prop changes
  React.useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // Group tasks
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const overdueList: TaskItem[] = [];
  const todayList: TaskItem[] = [];
  const upcomingList: TaskItem[] = [];
  const completedList: TaskItem[] = [];

  tasks.forEach((t) => {
    if (t.completed_at) {
      completedList.push(t);
      return;
    }
    const dueStr = t.due_at ? t.due_at.slice(0, 10) : todayStr;
    if (dueStr < todayStr) {
      overdueList.push(t);
    } else if (dueStr === todayStr) {
      todayList.push(t);
    } else {
      upcomingList.push(t);
    }
  });

  const openCount = overdueList.length + todayList.length + upcomingList.length;

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

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) return;

    setAdding(true);
    const dueIso = new Date(newDueDate + 'T17:00:00').toISOString();

    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trimmed,
          dueAt: dueIso,
          assignedToUserId: userId,
          assignedTo: userName,
          priority: 'normal',
          eventType: 'task',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.task) {
          setTasks((prev) => [...prev, data.task]);
        }
        setNewTitle('');
        onRefresh?.();
      }
    } catch (err) {
      console.error('Error creating task:', err);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="p-5 sm:p-6 rounded-2xl admin-card bg-white border border-slate-200/80 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <CheckSquare size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-[#0B1E33]">My Tasks</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                {openCount} Open
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Personal priorities and follow-up items</p>
          </div>
        </div>

        <Link
          href="/admin/tasks"
          className="text-xs text-[#1878B8] hover:text-[#0B1E33] font-semibold flex items-center gap-1 transition-colors"
        >
          <span>View Board</span>
          <ChevronRight size={13} />
        </Link>
      </div>

      {/* Task List */}
      <div className="space-y-3 min-h-[120px]">
        {openCount === 0 && completedList.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-1.5">
            <CheckCircle2 size={24} className="text-emerald-500" />
            <p className="font-semibold text-slate-700">All caught up!</p>
            <p className="text-[11px] text-slate-400">You have no pending tasks scheduled.</p>
          </div>
        ) : (
          <>
            {/* Overdue Section */}
            {overdueList.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-600">
                  <AlertCircle size={11} />
                  <span>Overdue ({overdueList.length})</span>
                </div>
                {overdueList.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    isUpdating={updatingId === task.id}
                    onToggle={() => handleToggleComplete(task)}
                  />
                ))}
              </div>
            )}

            {/* Due Today Section */}
            {todayList.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                  <Clock size={11} />
                  <span>Due Today ({todayList.length})</span>
                </div>
                {todayList.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    isUpdating={updatingId === task.id}
                    onToggle={() => handleToggleComplete(task)}
                  />
                ))}
              </div>
            )}

            {/* Upcoming Section */}
            {upcomingList.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <Calendar size={11} />
                  <span>Upcoming ({upcomingList.length})</span>
                </div>
                {upcomingList.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    isUpdating={updatingId === task.id}
                    onToggle={() => handleToggleComplete(task)}
                  />
                ))}
              </div>
            )}

            {/* Completed Section (collapsed summary) */}
            {completedList.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 font-semibold block mb-1">
                  Completed Today ({completedList.length})
                </span>
                <div className="space-y-1 opacity-70">
                  {completedList.slice(0, 3).map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      isUpdating={updatingId === task.id}
                      onToggle={() => handleToggleComplete(task)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick Add Task Field at Bottom */}
      <form onSubmit={handleCreateTask} className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Add new task... (e.g. Call homeowner back)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            disabled={adding}
            className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 focus:bg-white focus:border-[#1878B8] focus:outline-none transition-colors text-[#0B1E33] placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-1.5 w-40">
          <CustomDatePicker
            value={newDueDate}
            onChange={setNewDueDate}
            disabled={adding}
            size="sm"
            placeholder="Due date..."
          />
        </div>

          <button
            type="submit"
            disabled={adding || !newTitle.trim()}
            className="h-8 px-3 rounded-xl bg-[#1878B8] hover:bg-sky-700 text-white text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 shadow-2xs"
          >
            {adding ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <>
                <Plus size={14} strokeWidth={2.5} />
                <span>Add</span>
              </>
            )}
          </button>
      </form>
    </div>
  );
}

function TaskRow({
  task,
  isUpdating,
  onToggle,
}: {
  task: TaskItem;
  isUpdating: boolean;
  onToggle: () => void;
}) {
  const isDone = Boolean(task.completed_at);
  const related = task.related_name || task.lead_name;

  return (
    <div
      className={`p-2.5 rounded-xl border transition-all flex items-start gap-2.5 ${
        isDone
          ? 'bg-slate-50/60 border-slate-200/60 text-slate-400'
          : 'bg-white border-slate-200/80 hover:border-slate-300 text-[#0B1E33] shadow-2xs'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={isUpdating}
        className="mt-0.5 text-slate-400 hover:text-[#1878B8] transition-colors flex-shrink-0 cursor-pointer disabled:opacity-50"
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
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold leading-snug break-words ${
              isDone ? 'line-through text-slate-400' : 'text-[#0B1E33]'
            }`}
          >
            {task.title}
          </span>
          {task.priority === 'urgent' && !isDone && (
            <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-rose-100 text-rose-700">
              Urgent
            </span>
          )}
        </div>

        {related && (
          <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
            <span>Linked to:</span>
            {task.entity_type === 'lead' && task.entity_id ? (
              <Link
                href={`/admin/leads/${task.entity_id}`}
                className="font-medium text-[#1878B8] hover:underline"
              >
                {related}
              </Link>
            ) : task.entity_type === 'job' && task.entity_id ? (
              <Link
                href={`/admin/jobs?id=${task.entity_id}`}
                className="font-medium text-[#1878B8] hover:underline"
              >
                {related}
              </Link>
            ) : (
              <span className="font-medium text-slate-600">{related}</span>
            )}
          </div>
        )}
      </div>

      {task.due_at && !isDone && (
        <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">
          {new Date(task.due_at).toLocaleDateString('en-US', {
            month: 'numeric',
            day: 'numeric',
          })}
        </span>
      )}
    </div>
  );
}
