'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckSquare,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  User,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import BottomSheet from '@/components/admin/shared/BottomSheet';

interface Task {
  id: number;
  title: string;
  description?: string;
  due_at: string;
  completed_at?: string;
  priority: string;
  assigned_to?: string;
  entity_type?: string;
  entity_id?: number;
  lead_name?: string;
  lead_phone?: string;
  lead_service?: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [grouped, setGrouped] = useState<{
    overdue: Task[];
    today: Task[];
    upcoming: Task[];
    completed: Task[];
  }>({
    overdue: [],
    today: [],
    upcoming: [],
    completed: [],
  });
  const [counts, setCounts] = useState({ total: 0, overdue: 0, today: 0, upcoming: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDue, setNewDue] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('normal');
  const [creating, setCreating] = useState(false);

  const router = useRouter();

  const loadTasks = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await fetch('/api/admin/tasks');
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      setTasks(data.tasks ?? []);
      setGrouped(data.grouped ?? { overdue: [], today: [], upcoming: [], completed: [] });
      setCounts(data.counts ?? { total: 0, overdue: 0, today: 0, upcoming: 0, completed: 0 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Listen to FAB "crm:open-add-task" event or ?new=1
  useEffect(() => {
    function handleOpenAdd() {
      setShowAddModal(true);
    }
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('new') === '1' || params.get('action') === 'new') {
        setShowAddModal(true);
      }
    }
    window.addEventListener('crm:open-add-task', handleOpenAdd);
    return () => window.removeEventListener('crm:open-add-task', handleOpenAdd);
  }, []);

  async function handleToggleComplete(id: number, completed: boolean) {
    // Optimistic update
    setGrouped(prev => {
      const all = [...prev.overdue, ...prev.today, ...prev.upcoming, ...prev.completed];
      const target = all.find(t => t.id === id);
      if (!target) return prev;

      const updated = { ...target, completed_at: completed ? new Date().toISOString() : undefined };

      const overdue = prev.overdue.filter(t => t.id !== id);
      const today = prev.today.filter(t => t.id !== id);
      const upcoming = prev.upcoming.filter(t => t.id !== id);
      let completedList = prev.completed.filter(t => t.id !== id);

      if (completed) {
        completedList = [updated, ...completedList];
      } else {
        today.push(updated);
      }

      return { overdue, today, upcoming, completed: completedList };
    });

    await fetch('/api/admin/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, completed }),
    });

    loadTasks(true);
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle || !newDue) return;

    setCreating(true);
    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          dueAt: newDue,
          priority: newPriority,
        }),
      });

      if (res.ok) {
        setNewTitle('');
        setNewDue('');
        setNewDesc('');
        setShowAddModal(false);
        loadTasks(true);
      }
    } finally {
      setCreating(false);
    }
  }

  function formatDue(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B1E33] flex items-center gap-2">
            <CheckSquare size={24} className="text-[#EAA636]" />
            <span>Tasks & Follow-ups</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Never miss a callback, roof estimate review, or site inspection
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadTasks(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin text-[#EAA636]' : ''} />
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#EAA636] to-[#d49428] hover:from-[#f3b344] hover:to-[#d49428] text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-sm cursor-pointer active:scale-95"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/80 shadow-xs rounded-[16px] p-4">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Overdue</p>
          <p className={`text-2xl font-extrabold mt-1 tabular-nums ${counts.overdue > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
            {counts.overdue}
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 shadow-xs rounded-[16px] p-4">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Due Today</p>
          <p className="text-2xl font-extrabold text-[#EAA636] mt-1 tabular-nums">
            {counts.today}
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 shadow-xs rounded-[16px] p-4">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Upcoming</p>
          <p className="text-2xl font-extrabold text-[#1878B8] mt-1 tabular-nums">
            {counts.upcoming}
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 shadow-xs rounded-[16px] p-4">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Completed</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1 tabular-nums">
            {counts.completed}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-3 border-[#2F9FE3] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading tasks...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overdue Tasks */}
          {grouped.overdue.length > 0 && (
            <div className="space-y-3 bg-rose-50/50 border border-rose-200/80 rounded-[20px] p-5 shadow-xs">
              <h2 className="text-sm font-bold text-rose-700 uppercase tracking-wider flex items-center gap-2">
                <AlertCircle size={16} />
                Overdue Tasks ({grouped.overdue.length})
              </h2>
              <div className="space-y-2.5">
                {grouped.overdue.map(t => (
                  <TaskCard key={t.id} task={t} onToggle={handleToggleComplete} formatDue={formatDue} isOverdue />
                ))}
              </div>
            </div>
          )}

          {/* Today's Tasks */}
          <div className="space-y-3 bg-white border border-slate-200/80 rounded-[20px] p-5 shadow-xs">
            <h2 className="text-sm font-bold text-[#0B1E33] uppercase tracking-wider flex items-center gap-2">
              <Clock size={16} className="text-[#EAA636]" />
              Today&apos;s Follow-ups ({grouped.today.length})
            </h2>
            {grouped.today.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 italic">All set for today! No pending follow-ups due.</p>
            ) : (
              <div className="space-y-2.5">
                {grouped.today.map(t => (
                  <TaskCard key={t.id} task={t} onToggle={handleToggleComplete} formatDue={formatDue} />
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Tasks */}
          {grouped.upcoming.length > 0 && (
            <div className="space-y-3 bg-white border border-slate-200/80 rounded-[20px] p-5 shadow-xs">
              <h2 className="text-sm font-bold text-[#0B1E33] uppercase tracking-wider flex items-center gap-2">
                <Calendar size={16} className="text-[#1878B8]" />
                Upcoming Schedule ({grouped.upcoming.length})
              </h2>
              <div className="space-y-2.5">
                {grouped.upcoming.map(t => (
                  <TaskCard key={t.id} task={t} onToggle={handleToggleComplete} formatDue={formatDue} />
                ))}
              </div>
            </div>
          )}

          {/* Completed Tasks */}
          {grouped.completed.length > 0 && (
            <div className="space-y-3 bg-slate-50/70 border border-slate-200/80 rounded-[20px] p-5">
              <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                Completed ({grouped.completed.length})
              </h2>
              <div className="space-y-2.5">
                {grouped.completed.slice(0, 10).map(t => (
                  <TaskCard key={t.id} task={t} onToggle={handleToggleComplete} formatDue={formatDue} isDone />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Task Modal Sheet */}
      <BottomSheet
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Schedule Follow-up Task"
        subtitle="Set reminders for calls, inspections, or estimate follow-ups"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Task Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Call homeowner about roof shingle color choices"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200/80 text-[#0B1E33] placeholder-slate-400 text-sm focus:outline-none focus:border-[#2F9FE3] focus:ring-1 focus:ring-[#2F9FE3]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date & Time *</label>
              <input
                type="datetime-local"
                required
                value={newDue}
                onChange={e => setNewDue(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200/80 text-[#0B1E33] text-xs focus:outline-none focus:border-[#2F9FE3] focus:ring-1 focus:ring-[#2F9FE3]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={newPriority}
                onChange={e => setNewPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200/80 text-[#0B1E33] text-xs focus:outline-none focus:border-[#2F9FE3] focus:ring-1 focus:ring-[#2F9FE3]"
              >
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Details (Optional)</label>
            <textarea
              rows={2}
              placeholder="Additional instructions or notes..."
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200/80 text-[#0B1E33] placeholder-slate-400 text-xs focus:outline-none focus:border-[#2F9FE3] focus:ring-1 focus:ring-[#2F9FE3] resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={creating}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#EAA636] to-[#d49428] text-white font-bold text-sm shadow-sm hover:from-[#f3b344] hover:to-[#d49428] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <CheckSquare size={16} />
            {creating ? 'Saving...' : 'Save Task'}
          </button>
        </form>
      </BottomSheet>
    </div>
  );
}

function TaskCard({
  task,
  onToggle,
  formatDue,
  isOverdue = false,
  isDone = false,
}: {
  task: Task;
  onToggle: (id: number, completed: boolean) => void;
  formatDue: (dateStr: string) => string;
  isOverdue?: boolean;
  isDone?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-3 p-3.5 sm:p-4 rounded-[16px] border transition-all ${
        isDone
          ? 'bg-slate-50 border-slate-200/60 opacity-60'
          : isOverdue
          ? 'bg-rose-50/80 border-rose-200'
          : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
      }`}
    >
      <input
        type="checkbox"
        checked={isDone}
        onChange={e => onToggle(task.id, e.target.checked)}
        className="mt-1 w-4 h-4 rounded border-slate-300 text-[#EAA636] focus:ring-[#EAA636] cursor-pointer flex-shrink-0"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`text-sm font-semibold ${isDone ? 'line-through text-slate-400' : 'text-[#0B1E33]'}`}>
            {task.title}
          </p>
          {task.priority === 'urgent' && (
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
              Urgent
            </span>
          )}
          {task.priority === 'high' && (
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
              High
            </span>
          )}
        </div>

        {task.description && (
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{task.description}</p>
        )}

        <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Clock size={12} className={isOverdue ? 'text-rose-600' : 'text-slate-400'} />
            <span className={isOverdue ? 'text-rose-600 font-semibold' : ''}>
              {formatDue(task.due_at)}
            </span>
          </span>

          {task.lead_name && (
            <Link
              href={`/admin/leads/${task.entity_id}`}
              className="flex items-center gap-1 text-[#1878B8] hover:text-[#0B1E33] transition-colors font-medium"
            >
              <User size={12} />
              <span>{task.lead_name}</span>
              <ExternalLink size={10} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
