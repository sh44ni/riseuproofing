'use client';

import React, { useState } from 'react';
import { CheckSquare, Plus, Clock, CheckCircle2, User, AlertCircle } from 'lucide-react';

interface TaskItem {
  id: number;
  title: string;
  description?: string;
  due_at: string;
  completed_at?: string;
  priority?: string;
  assigned_to?: string;
}

interface ClientTasksTabProps {
  clientId: number;
  tasks: TaskItem[];
  onTaskUpdated: () => void;
}

export default function ClientTasksTab({
  clientId,
  tasks,
  onTaskUpdated,
}: ClientTasksTabProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [priority, setPriority] = useState('normal');
  const [submitting, setSubmitting] = useState(false);

  async function handleToggleTask(task: TaskItem) {
    try {
      const isComplete = Boolean(task.completed_at);
      await fetch('/api/admin/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: task.id,
          completed: !isComplete,
        }),
      });
      onTaskUpdated();
    } catch (err) {
      console.error('Failed to update task', err);
    }
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !dueAt) return;

    setSubmitting(true);
    try {
      await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'client',
          entityId: clientId,
          clientId,
          title,
          description,
          dueAt,
          priority,
        }),
      });

      setTitle('');
      setDescription('');
      setDueAt('');
      setShowAdd(false);
      onTaskUpdated();
    } catch (err) {
      console.error('Failed to create task', err);
    } finally {
      setSubmitting(false);
    }
  }

  const pendingTasks = tasks.filter(t => !t.completed_at);
  const completedTasks = tasks.filter(t => Boolean(t.completed_at));

  return (
    <div className="space-y-6">
      {/* Header & "+ Add Task" button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-[#0B1E33] text-sm sm:text-base">
            Client Tasks & Follow-up Reminders
          </h3>
          <p className="text-xs text-slate-500">Scheduled calls, inspections, and material checks</p>
        </div>

        <button
          onClick={() => setShowAdd(!showAdd)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
        >
          <Plus size={13} />
          <span>{showAdd ? 'Close' : 'Add Task'}</span>
        </button>
      </div>

      {/* Add Task Form */}
      {showAdd && (
        <form
          onSubmit={handleCreateTask}
          className="admin-card p-4 sm:p-5 bg-purple-50/50 border border-purple-200/80 rounded-2xl shadow-xs space-y-3"
        >
          <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wider">
            Schedule Follow-up Task
          </h4>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Call homeowner regarding tile color selection"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-sm focus:border-purple-600 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Due Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={dueAt}
                onChange={e => setDueAt(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-sm focus:border-purple-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-sm focus:border-purple-600 outline-none"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent ⚡</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notes</label>
            <textarea
              rows={2}
              placeholder="Optional background info..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-sm focus:border-purple-600 outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Scheduling...' : 'Save Task'}
            </button>
          </div>
        </form>
      )}

      {/* Pending Tasks */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
          Pending Tasks ({pendingTasks.length})
        </h4>

        {pendingTasks.map(t => {
          const isOverdue = new Date(t.due_at).getTime() < Date.now();

          return (
            <div
              key={t.id}
              className="admin-card p-3.5 sm:p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex items-start gap-3 hover:border-slate-300 transition-colors"
            >
              <button
                onClick={() => handleToggleTask(t)}
                className="mt-0.5 w-5 h-5 rounded-md border-2 border-slate-300 hover:border-purple-600 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
                title="Mark Completed"
              />

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="font-bold text-slate-800 text-sm">{t.title}</span>
                  <span
                    className={`text-[11px] font-semibold flex items-center gap-1 ${
                      isOverdue ? 'text-red-600 font-bold' : 'text-slate-500'
                    }`}
                  >
                    <Clock size={12} />
                    {new Date(t.due_at).toLocaleDateString()} at{' '}
                    {new Date(t.due_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {t.description && (
                  <p className="text-xs text-slate-600 mt-1 whitespace-pre-line">{t.description}</p>
                )}
              </div>
            </div>
          );
        })}

        {pendingTasks.length === 0 && (
          <div className="p-6 text-center bg-white border border-slate-200/80 rounded-2xl text-xs text-slate-400 italic">
            No pending tasks. Everything is completed!
          </div>
        )}
      </div>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="space-y-2.5 pt-2">
          <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
            Completed ({completedTasks.length})
          </h4>

          {completedTasks.map(t => (
            <div
              key={t.id}
              className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center gap-3 opacity-70 hover:opacity-100 transition-opacity"
            >
              <button
                onClick={() => handleToggleTask(t)}
                className="w-5 h-5 rounded-md bg-emerald-500 border border-emerald-600 text-white flex items-center justify-center cursor-pointer flex-shrink-0"
                title="Mark Incomplete"
              >
                <CheckCircle2 size={13} />
              </button>
              <span className="text-xs font-medium line-through text-slate-500 flex-1">
                {t.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
