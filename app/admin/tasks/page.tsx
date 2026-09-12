'use client';

import React, { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  StickyNote,
  Trash2,
  Users,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import BottomSheet from '@/components/admin/shared/BottomSheet';
import CustomSelect from '@/components/admin/shared/CustomSelect';
import CustomDatePicker from '@/components/admin/shared/CustomDatePicker';
import UserAvatar from '@/components/admin/shared/UserAvatar';
import {
  TASK_PRIORITY_OPTIONS,
  WORK_CATEGORY_OPTIONS,
  PRIORITY_BADGE_MAP,
  CATEGORY_BADGE_MAP,
} from '@/components/admin/shared/taskConstants';

interface Task {
  id: number;
  title: string;
  description?: string;
  due_at?: string | null;
  work_category?: string | null;
  completed_at?: string;
  priority: string;
  assigned_to?: string;
  assigned_to_user_id?: number | null;
  assigned_user_name?: string;
  assigned_user_role?: string;
  assigned_user_avatar?: string | null;
  entity_type?: string;
  entity_id?: number;
  lead_name?: string;
  lead_phone?: string;
  lead_service?: string;
  event_type?: string;
}

interface TeamMember {
  id: number;
  name: string;
  role: string;
  avatar_url: string | null;
}

export default function TasksPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-10 h-10 border-3 border-[#2F9FE3] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading tasks...</p>
        </div>
      }
    >
      <TasksContent />
    </Suspense>
  );
}

function TasksContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active Tab: 'team' (default) vs 'personal'
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'team' | 'personal'>(
    tabParam === 'personal' ? 'personal' : 'team'
  );

  const handleSelectTab = (tab: 'team' | 'personal') => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`/admin/tasks?${params.toString()}`, { scroll: false });
  };
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
  const [tabCounts, setTabCounts] = useState({ team: 0, personal: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Team directory for assigning team operations
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Category filter state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal form state
  const [modalTaskType, setModalTaskType] = useState<'team' | 'personal'>('team');
  const [modalTitle, setModalTitle] = useState('');
  const [modalDue, setModalDue] = useState('');
  const [modalDesc, setModalDesc] = useState('');
  const [modalPriority, setModalPriority] = useState('normal');
  const [modalWorkCategory, setModalWorkCategory] = useState('Rise Up');
  const [modalAssigneeId, setModalAssigneeId] = useState('');
  const [modalCreating, setModalCreating] = useState(false);

  // Inline Quick-Add state for Personal Notes tab
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState('normal');
  const [quickCategory, setQuickCategory] = useState('Rise Up');
  const [quickDue, setQuickDue] = useState('');
  const [quickAdding, setQuickAdding] = useState(false);

  // Personal notes completed archive collapse
  const [showCompletedNotes, setShowCompletedNotes] = useState(false);

  // Deleting item tracker
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Fetch team directory once
  useEffect(() => {
    fetch('/api/admin/users')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.users && Array.isArray(data.users)) {
          setTeamMembers(data.users);
        }
      })
      .catch((err) => console.error('Failed to load team directory', err));
  }, []);

  // Fetch tasks based on activeTab
  const loadTasks = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      try {
        const res = await fetch(`/api/admin/tasks?scope=${activeTab}`);
        if (res.status === 401) {
          router.push('/admin/login');
          return;
        }
        const data = await res.json();
        setTasks(data.tasks ?? []);
        setGrouped(data.grouped ?? { overdue: [], today: [], upcoming: [], completed: [] });
        setCounts(data.counts ?? { total: 0, overdue: 0, today: 0, upcoming: 0, completed: 0 });
        if (data.teamCount !== undefined && data.personalCount !== undefined) {
          setTabCounts({ team: data.teamCount, personal: data.personalCount });
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeTab, router]
  );

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Sync modal default task type when opening modal
  useEffect(() => {
    if (showAddModal) {
      setModalTaskType(activeTab);
    }
  }, [showAddModal, activeTab]);

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
    setGrouped((prev) => {
      const all = [...prev.overdue, ...prev.today, ...prev.upcoming, ...prev.completed];
      const target = all.find((t) => t.id === id);
      if (!target) return prev;

      const updated = { ...target, completed_at: completed ? new Date().toISOString() : undefined };

      const overdue = prev.overdue.filter((t) => t.id !== id);
      const today = prev.today.filter((t) => t.id !== id);
      const upcoming = prev.upcoming.filter((t) => t.id !== id);
      let completedList = prev.completed.filter((t) => t.id !== id);

      if (completed) {
        completedList = [updated, ...completedList];
      } else {
        today.push(updated);
      }

      return { overdue, today, upcoming, completed: completedList };
    });

    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, completed_at: completed ? new Date().toISOString() : undefined } : t
      )
    );

    await fetch('/api/admin/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, completed }),
    });

    loadTasks(true);
  }

  async function handleDeleteTask(taskId: number) {
    setDeletingId(taskId);
    // Optimistic remove
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setGrouped((prev) => ({
      overdue: prev.overdue.filter((t) => t.id !== taskId),
      today: prev.today.filter((t) => t.id !== taskId),
      upcoming: prev.upcoming.filter((t) => t.id !== taskId),
      completed: prev.completed.filter((t) => t.id !== taskId),
    }));

    try {
      await fetch(`/api/admin/tasks?id=${taskId}`, {
        method: 'DELETE',
      });
      loadTasks(true);
    } catch (err) {
      console.error('Failed to delete task', err);
      loadTasks(true);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleCreateModalTask(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = modalTitle.trim();
    if (!trimmed) return;

    setModalCreating(true);
    try {
      const isPersonal = modalTaskType === 'personal';
      const res = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trimmed,
          description: modalDesc.trim() || undefined,
          dueAt: modalDue || undefined,
          priority: modalPriority,
          workCategory: modalWorkCategory,
          eventType: isPersonal ? 'todo' : 'task',
          assignedToUserId: isPersonal
            ? undefined
            : modalAssigneeId
            ? parseInt(modalAssigneeId, 10)
            : null,
          assignedTo: isPersonal ? undefined : modalAssigneeId ? undefined : null,
        }),
      });

      if (res.ok) {
        setModalTitle('');
        setModalDue('');
        setModalDesc('');
        setModalPriority('normal');
        setModalWorkCategory('Rise Up');
        setModalAssigneeId('');
        setShowAddModal(false);
        loadTasks(true);
      }
    } finally {
      setModalCreating(false);
    }
  }

  async function handleQuickAddNote(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = quickTitle.trim();
    if (!trimmed) return;

    setQuickAdding(true);
    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trimmed,
          priority: quickPriority,
          workCategory: quickCategory,
          dueAt: quickDue || undefined,
          eventType: 'todo',
        }),
      });

      if (res.ok) {
        setQuickTitle('');
        setQuickDue('');
        setQuickPriority('normal');
        setQuickCategory('Rise Up');
        loadTasks(true);
      }
    } finally {
      setQuickAdding(false);
    }
  }

  // Work category counts and filtered grouped lists
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: tasks.filter((t) => !t.completed_at).length,
      'Rise Up': 0,
      'Content Creation': 0,
      'Marketing': 0,
    };
    tasks.forEach((t) => {
      if (!t.completed_at) {
        const cat = t.work_category || 'Rise Up';
        if (counts[cat] !== undefined) counts[cat]++;
        else counts[cat] = 1;
      }
    });
    return counts;
  }, [tasks]);

  const filteredGrouped = useMemo(() => {
    if (selectedCategory === 'all') return grouped;
    const matchCat = (t: Task) => (t.work_category || 'Rise Up') === selectedCategory;
    return {
      overdue: grouped.overdue.filter(matchCat),
      today: grouped.today.filter(matchCat),
      upcoming: grouped.upcoming.filter(matchCat),
      completed: grouped.completed.filter(matchCat),
    };
  }, [grouped, selectedCategory]);

  function formatDue(dateStr?: string | null) {
    if (!dateStr) return 'No due date';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'No due date';
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* ── TOP HEADER & ACTIONS ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B1E33] flex items-center gap-2">
            <CheckSquare size={24} className="text-[#EAA636]" />
            <span>Tasks &amp; Operations</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Manage company-wide operations, client follow-ups, and personal sticky notes
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadTasks(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh tasks"
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

      {/* ── PRIMARY VIEW TABS (Team Operations vs Personal Notes) ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => handleSelectTab('team')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'team'
              ? 'bg-[#0B1E33] text-white shadow-xs'
              : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Users size={16} />
          <span>Team Operations &amp; Client Tasks</span>
          {tabCounts.team > 0 && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'team' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {tabCounts.team}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleSelectTab('personal')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'personal'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <StickyNote size={16} />
          <span>My Personal Notes &amp; Reminders</span>
          {tabCounts.personal > 0 && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'personal' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-900'
              }`}
            >
              {tabCounts.personal}
            </span>
          )}
        </button>
      </div>

      {/* ── VIEW 1: TEAM OPERATIONS ── */}
      {activeTab === 'team' && (
        <>
          {/* KPI Counters for Team Operations */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200/80 shadow-xs rounded-[16px] p-4">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Overdue</p>
              <p
                className={`text-2xl font-extrabold mt-1 tabular-nums ${
                  counts.overdue > 0 ? 'text-rose-600' : 'text-slate-400'
                }`}
              >
                {counts.overdue}
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 shadow-xs rounded-[16px] p-4">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Due Today</p>
              <p className="text-2xl font-extrabold text-[#EAA636] mt-1 tabular-nums">{counts.today}</p>
            </div>

            <div className="bg-white border border-slate-200/80 shadow-xs rounded-[16px] p-4">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Upcoming</p>
              <p className="text-2xl font-extrabold text-[#1878B8] mt-1 tabular-nums">{counts.upcoming}</p>
            </div>

            <div className="bg-white border border-slate-200/80 shadow-xs rounded-[16px] p-4">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Completed</p>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1 tabular-nums">
                {counts.completed}
              </p>
            </div>
          </div>

          {/* Work Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#0B1E33] text-white shadow-xs'
                  : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>All Categories</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-[#0B1E33] text-white shadow-xs'
                      : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{cat}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-10 h-10 border-3 border-[#2F9FE3] border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-500 text-sm">Loading team operations...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overdue Tasks */}
              {filteredGrouped.overdue.length > 0 && (
                <div className="space-y-3 bg-rose-50/50 border border-rose-200/80 rounded-[20px] p-5 shadow-xs">
                  <h2 className="text-sm font-bold text-rose-700 uppercase tracking-wider flex items-center gap-2">
                    <AlertCircle size={16} />
                    Overdue Tasks ({filteredGrouped.overdue.length})
                  </h2>
                  <div className="space-y-2.5">
                    {filteredGrouped.overdue.map((t) => (
                      <TaskCard
                        key={t.id}
                        task={t}
                        onToggle={handleToggleComplete}
                        formatDue={formatDue}
                        isOverdue
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Today's Tasks */}
              <div className="space-y-3 bg-white border border-slate-200/80 rounded-[20px] p-5 shadow-xs">
                <h2 className="text-sm font-bold text-[#0B1E33] uppercase tracking-wider flex items-center gap-2">
                  <Clock size={16} className="text-[#EAA636]" />
                  Today&apos;s Follow-ups &amp; Active ({filteredGrouped.today.length})
                </h2>
                {filteredGrouped.today.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 italic">
                    {selectedCategory === 'all'
                      ? 'All set for today! No pending operations due.'
                      : `No pending items in "${selectedCategory}".`}
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {filteredGrouped.today.map((t) => (
                      <TaskCard
                        key={t.id}
                        task={t}
                        onToggle={handleToggleComplete}
                        formatDue={formatDue}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Upcoming Tasks */}
              {filteredGrouped.upcoming.length > 0 && (
                <div className="space-y-3 bg-white border border-slate-200/80 rounded-[20px] p-5 shadow-xs">
                  <h2 className="text-sm font-bold text-[#0B1E33] uppercase tracking-wider flex items-center gap-2">
                    <Calendar size={16} className="text-[#1878B8]" />
                    Upcoming Schedule ({filteredGrouped.upcoming.length})
                  </h2>
                  <div className="space-y-2.5">
                    {filteredGrouped.upcoming.map((t) => (
                      <TaskCard
                        key={t.id}
                        task={t}
                        onToggle={handleToggleComplete}
                        formatDue={formatDue}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Tasks */}
              {filteredGrouped.completed.length > 0 && (
                <div className="space-y-3 bg-slate-50/70 border border-slate-200/80 rounded-[20px] p-5">
                  <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    Completed ({filteredGrouped.completed.length})
                  </h2>
                  <div className="space-y-2.5">
                    {filteredGrouped.completed.slice(0, 10).map((t) => (
                      <TaskCard
                        key={t.id}
                        task={t}
                        onToggle={handleToggleComplete}
                        formatDue={formatDue}
                        isDone
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── VIEW 2: MY PERSONAL NOTES & REMINDERS ── */}
      {activeTab === 'personal' && (
        <div className="space-y-5">
          {/* Header Context Banner */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50/40 border border-amber-200/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
                <StickyNote size={20} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                  <span>My Personal Sticky Notes &amp; Reminders</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                    Private to You
                  </span>
                </h2>
                <p className="text-xs text-amber-800/80 mt-0.5">
                  Synced directly with your Dashboard Sticky Notes widget. These do not clutter company
                  calendars or team dispatch.
                </p>
              </div>
            </div>
          </div>

          {/* Inline Quick-Add Note Bar */}
          <form
            onSubmit={handleQuickAddNote}
            className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                ⚡ Quick Note
              </span>
              <span className="text-[11px] text-slate-400">Press Enter or click Add Note</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                required
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder="Jot down a quick personal to-do or reminder..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-sm text-[#0B1E33] placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />

              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-32">
                  <CustomSelect
                    value={quickPriority}
                    onChange={setQuickPriority}
                    size="sm"
                    options={TASK_PRIORITY_OPTIONS}
                    title="Priority"
                  />
                </div>

                <div className="w-36">
                  <CustomSelect
                    value={quickCategory}
                    onChange={setQuickCategory}
                    size="sm"
                    options={WORK_CATEGORY_OPTIONS}
                    title="Work Category"
                  />
                </div>

                <div className="w-40">
                  <CustomDatePicker
                    mode="datetime"
                    value={quickDue}
                    onChange={setQuickDue}
                    size="sm"
                    placeholder="Due (Optional)..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={quickAdding || !quickTitle.trim()}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Plus size={14} />
                  <span>{quickAdding ? 'Adding...' : 'Add Note'}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Category Filter Chips for Personal Notes */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>All Categories</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{cat}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Notes Grid / List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-500 text-sm">Loading personal notes...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Active Notes */}
              {tasks.filter((t) => !t.completed_at && (selectedCategory === 'all' || (t.work_category || 'Rise Up') === selectedCategory)).length === 0 ? (
                <div className="p-8 text-center bg-white border border-slate-200/80 rounded-2xl text-slate-400 space-y-2">
                  <StickyNote size={28} className="mx-auto text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">No active sticky notes</p>
                  <p className="text-xs text-slate-400">
                    Use the quick note bar above or the dashboard widget to jot down reminders anytime.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {tasks
                    .filter((t) => !t.completed_at && (selectedCategory === 'all' || (t.work_category || 'Rise Up') === selectedCategory))
                    .map((t) => {
                      const pMeta = PRIORITY_BADGE_MAP[t.priority] || PRIORITY_BADGE_MAP.normal;
                      const cMeta = CATEGORY_BADGE_MAP[t.work_category || 'Rise Up'] || CATEGORY_BADGE_MAP['Rise Up'];

                      return (
                        <div
                          key={t.id}
                          className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group relative"
                        >
                          <div>
                            <div className="flex items-start gap-2.5">
                              <input
                                type="checkbox"
                                checked={false}
                                onChange={() => handleToggleComplete(t.id, true)}
                                className="mt-1 w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer flex-shrink-0"
                                title="Mark completed"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-[#0B1E33] leading-snug">{t.title}</p>
                                {t.description && (
                                  <p className="text-xs text-slate-500 mt-1 leading-relaxed whitespace-pre-line">
                                    {t.description}
                                  </p>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDeleteTask(t.id)}
                                disabled={deletingId === t.id}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 cursor-pointer flex-shrink-0"
                                title="Delete note"
                              >
                                {deletingId === t.id ? (
                                  <Loader2 size={13} className="animate-spin text-rose-500" />
                                ) : (
                                  <Trash2 size={13} />
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-1 mt-3 pt-2.5 border-t border-slate-100 flex-wrap text-xs">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${pMeta.badgeClass}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${pMeta.dot}`} />
                                <span>{pMeta.label}</span>
                              </span>

                              <span
                                className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${cMeta.badgeClass}`}
                              >
                                {cMeta.label}
                              </span>
                            </div>

                            {t.due_at && (
                              <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                <Clock size={11} />
                                {formatDue(t.due_at)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Collapsible Completed Notes Drawer */}
              {tasks.filter((t) => t.completed_at).length > 0 && (
                <div className="pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowCompletedNotes(!showCompletedNotes)}
                    className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    <span>
                      Completed Notes ({tasks.filter((t) => t.completed_at).length})
                    </span>
                    {showCompletedNotes ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {showCompletedNotes && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-3">
                      {tasks
                        .filter((t) => t.completed_at)
                        .map((t) => (
                          <div
                            key={t.id}
                            className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/60 opacity-70 hover:opacity-100 transition-opacity flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <input
                                type="checkbox"
                                checked={true}
                                onChange={() => handleToggleComplete(t.id, false)}
                                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer flex-shrink-0"
                                title="Restore note"
                              />
                              <span className="text-xs text-slate-500 line-through truncate">
                                {t.title}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteTask(t.id)}
                              className="text-slate-300 hover:text-rose-600 p-1 cursor-pointer flex-shrink-0"
                              title="Delete permanently"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── UNIFIED ADD TASK / REMINDER MODAL SHEET ── */}
      <BottomSheet
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={modalTaskType === 'personal' ? 'New Personal Sticky Note' : 'Schedule Team Operation'}
        subtitle={
          modalTaskType === 'personal'
            ? 'Private to you, decoupled from calendar dispatches'
            : 'Schedule follow-up, inspection callback, or field task'
        }
      >
        <form onSubmit={handleCreateModalTask} className="space-y-4">
          {/* Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/80">
            <button
              type="button"
              onClick={() => setModalTaskType('team')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                modalTaskType === 'team'
                  ? 'bg-white text-[#0B1E33] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users size={14} />
              <span>Team Operation</span>
            </button>
            <button
              type="button"
              onClick={() => setModalTaskType('personal')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                modalTaskType === 'personal'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <StickyNote size={14} />
              <span>Personal Sticky Note</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Task Title *</label>
            <input
              type="text"
              required
              placeholder={
                modalTaskType === 'personal'
                  ? 'e.g. Review marketing analytics before 3 PM call'
                  : 'e.g. Call homeowner about roof shingle color choices'
              }
              value={modalTitle}
              onChange={(e) => setModalTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200/80 text-[#0B1E33] placeholder-slate-400 text-sm focus:outline-none focus:border-[#2F9FE3] focus:ring-1 focus:ring-[#2F9FE3]"
            />
          </div>

          {/* Team Member Assignee (Only for Team Operations) */}
          {modalTaskType === 'team' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assignee (Team Member)
              </label>
              <CustomSelect
                value={modalAssigneeId}
                onChange={setModalAssigneeId}
                size="sm"
                placeholder="None (Unassigned)"
                options={[
                  { value: '', label: 'None (Unassigned)' },
                  ...teamMembers.map((m) => ({
                    value: String(m.id),
                    label: m.name,
                    description: m.role ? m.role.replace(/_/g, ' ') : 'Staff',
                  })),
                ]}
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <CustomSelect
                value={modalPriority}
                onChange={setModalPriority}
                size="sm"
                options={TASK_PRIORITY_OPTIONS}
                title="Priority"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Work Category</label>
              <CustomSelect
                value={modalWorkCategory}
                onChange={setModalWorkCategory}
                size="sm"
                options={WORK_CATEGORY_OPTIONS}
                title="Work Category"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Due Date &amp; Time (Optional)
            </label>
            <CustomDatePicker
              mode="datetime"
              value={modalDue}
              onChange={setModalDue}
              size="sm"
              placeholder="Pick due date &amp; time (Optional)..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Details (Optional)</label>
            <textarea
              rows={2}
              placeholder="Additional instructions or notes..."
              value={modalDesc}
              onChange={(e) => setModalDesc(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200/80 text-[#0B1E33] placeholder-slate-400 text-xs focus:outline-none focus:border-[#2F9FE3] focus:ring-1 focus:ring-[#2F9FE3] resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={modalCreating || !modalTitle.trim()}
            className={`w-full py-3 px-4 rounded-xl text-white font-bold text-sm shadow-sm active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
              modalTaskType === 'personal'
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600'
                : 'bg-gradient-to-r from-[#EAA636] to-[#d49428] hover:from-[#f3b344] hover:to-[#d49428]'
            }`}
          >
            <CheckSquare size={16} />
            <span>{modalCreating ? 'Saving...' : modalTaskType === 'personal' ? 'Save Personal Note' : 'Save Task'}</span>
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
  const isUnassigned = !task.assigned_to_user_id && (!task.assigned_to || task.assigned_to.toLowerCase().includes('unassigned'));

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
        onChange={(e) => onToggle(task.id, e.target.checked)}
        className="mt-1 w-4 h-4 rounded border-slate-300 text-[#EAA636] focus:ring-[#EAA636] cursor-pointer flex-shrink-0"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`text-sm font-semibold ${isDone ? 'line-through text-slate-400' : 'text-[#0B1E33]'}`}>
            {task.title}
          </p>

          {/* Priority Pill */}
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${
              PRIORITY_BADGE_MAP[task.priority]?.badgeClass || PRIORITY_BADGE_MAP.normal.badgeClass
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                PRIORITY_BADGE_MAP[task.priority]?.dot || PRIORITY_BADGE_MAP.normal.dot
              }`}
            />
            <span>{PRIORITY_BADGE_MAP[task.priority]?.label || 'Normal'}</span>
          </span>

          {/* Work Category Pill */}
          <span
            className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${
              CATEGORY_BADGE_MAP[task.work_category || 'Rise Up']?.badgeClass ||
              CATEGORY_BADGE_MAP['Rise Up'].badgeClass
            }`}
          >
            {task.work_category || 'Rise Up'}
          </span>
        </div>

        {task.description && (
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{task.description}</p>
        )}

        <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-slate-400">
          {/* Due date */}
          {task.due_at && (
            <span className="flex items-center gap-1">
              <Clock size={12} className={isOverdue ? 'text-rose-600' : 'text-slate-400'} />
              <span className={isOverdue ? 'text-rose-600 font-semibold' : ''}>
                {formatDue(task.due_at)}
              </span>
            </span>
          )}

          {/* Assignee display */}
          {isUnassigned ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold">
              <span>⚠️ Unassigned</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-slate-600 text-[11px] font-medium">
              <UserAvatar
                name={task.assigned_user_name || task.assigned_to || 'Staff'}
                avatarUrl={task.assigned_user_avatar}
                role={task.assigned_user_role}
                size="xs"
              />
              <span>{task.assigned_user_name || task.assigned_to}</span>
            </span>
          )}

          {/* Linked Lead */}
          {task.lead_name && (
            <Link
              href={`/admin/leads/${task.entity_id}`}
              className="flex items-center gap-1 text-[#1878B8] hover:text-[#0B1E33] transition-colors font-medium ml-auto"
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
