import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, RotateCcw, CheckCircle2, FileText } from 'lucide-react';
import { CrmPageHero } from '@/components/common/CrmPageHero';
import { TasksKpiCards } from '@/components/tasks/TasksKpiCards';
import { TasksFilterBar } from '@/components/tasks/TasksFilterBar';
import { TasksSectionList } from '@/components/tasks/TasksSectionList';
import { PersonalStickyBoard } from '@/components/tasks/PersonalStickyBoard';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import { CrmTaskDetailModal } from '@/components/tasks/CrmTaskDetailModal';
import { CrmTask, TaskCategory } from '@/types/taskTypes';
import { INITIAL_TASKS } from '@/data/taskData';
import { usePersonalTasks } from '@/lib/personalTasksStore';
import { api } from '@/lib/api';

export function TasksPage() {
  const [tasks, setTasks] = useState<CrmTask[]>(INITIAL_TASKS);
  const [activeTab, setActiveTab] = useState<'operations' | 'personal_notes'>('operations');
  const [selectedCategory, setSelectedCategory] = useState<'all' | TaskCategory>('all');
  const [search, setSearch] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<CrmTask | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Live Personal Tasks Store (synchronized 2-way with Dashboard right-dock widget)
  const {
    tasks: personalTasks,
    completedCount: personalCompletedCount,
    activeCount: personalActiveCount,
    progressPercent: personalProgressPercent,
    refreshTasks: refreshPersonalTasks,
    addTask: addPersonalTask,
    updateTask: updatePersonalTask,
    toggleTask: togglePersonalTask,
    togglePinTask,
    deleteTask: deletePersonalTask,
  } = usePersonalTasks();

  // Global keyboard shortcut: ⌘ / Win + K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const input = document.querySelector('input[placeholder*="Search tasks"]') as HTMLInputElement;
        if (input) input.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter team operations tasks
  const filteredTasks = useMemo(() => {
    let list = tasks;

    // Filter by category
    if (selectedCategory !== 'all') {
      list = list.filter((t) => t.category === selectedCategory);
    }

    // Filter by search query
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.clientName && t.clientName.toLowerCase().includes(q)) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          t.assignedTo.toLowerCase().includes(q)
      );
    }

    return list;
  }, [tasks, selectedCategory, search]);

  // Operational KPI counts
  const opOverdueCount = useMemo(() => tasks.filter((t) => t.status === 'active' && t.isOverdue).length, [tasks]);
  const opDueTodayCount = useMemo(() => tasks.filter((t) => t.status === 'active' && t.isToday).length, [tasks]);
  const opUpcomingCount = useMemo(() => tasks.filter((t) => t.status === 'active' && !t.isToday && !t.isOverdue).length, [tasks]);
  const opCompletedCount = useMemo(() => tasks.filter((t) => t.status === 'completed').length, [tasks]);
  const activeTasksCount = useMemo(() => tasks.filter((t) => t.status === 'active').length, [tasks]);

  // Personal KPI counts
  const persOverdueCount = useMemo(
    () => personalTasks.filter((t) => !t.completed && t.priority === 'urgent').length,
    [personalTasks]
  );
  const persDueTodayCount = useMemo(
    () => personalTasks.filter((t) => !t.completed && (t.dueDate === 'Today' || !t.dueDate)).length,
    [personalTasks]
  );
  const persUpcomingCount = useMemo(
    () => personalTasks.filter((t) => !t.completed && t.dueDate && t.dueDate !== 'Today').length,
    [personalTasks]
  );

  // Active KPI counts (context-aware: switches based on active tab)
  const overdueCount = activeTab === 'personal_notes' ? persOverdueCount : opOverdueCount;
  const dueTodayCount = activeTab === 'personal_notes' ? persDueTodayCount : opDueTodayCount;
  const upcomingCount = activeTab === 'personal_notes' ? persUpcomingCount : opUpcomingCount;
  const completedCount = activeTab === 'personal_notes' ? personalCompletedCount : opCompletedCount;

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: tasks.filter((t) => t.status === 'active').length };
    tasks
      .filter((t) => t.status === 'active')
      .forEach((t) => {
        counts[t.category] = (counts[t.category] || 0) + 1;
      });
    return counts;
  }, [tasks]);

  const loadTasksFromBackend = useCallback(async () => {
    try {
      const json = await api.getTasks();
      if (Array.isArray(json?.tasks) && json.tasks.length > 0) {
        const now = new Date();
        const mapped: CrmTask[] = json.tasks.map((t: any) => {
          const due = t.due_at ? new Date(t.due_at) : new Date();
          const isOverdue = due < now && !t.completed_at;
          const isToday = due.toDateString() === now.toDateString();
          return {
            id: String(t.id),
            title: t.title,
            clientName: t.lead_name || t.assigned_to || undefined,
            description: t.description || undefined,
            category: (t.event_type || 'general') as TaskCategory,
            priority: (t.priority || 'normal') as any,
            status: t.completed_at ? 'completed' : 'active',
            dueDate: t.due_at || new Date().toISOString(),
            dueDateFormatted:
              due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
              ` at ${due.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`,
            isOverdue,
            isToday,
            isUpcoming: !isOverdue && !isToday,
            assignedTo: t.assigned_user_name || t.assigned_to || 'Unassigned',
            completedAt: t.completed_at || undefined,
          };
        });
        setTasks(mapped);
      }
    } catch (err) {
      console.warn('Retaining cached tasks due to offline/fallback status:', err);
    }
  }, []);

  useEffect(() => {
    loadTasksFromBackend();
  }, [loadTasksFromBackend]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([loadTasksFromBackend(), refreshPersonalTasks()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleToggleTask = async (id: string) => {
    let nextStatus: 'active' | 'completed' = 'completed';
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          nextStatus = t.status === 'completed' ? 'active' : 'completed';
          return {
            ...t,
            status: nextStatus,
            completedAt: nextStatus === 'completed' ? 'Just now' : undefined,
          };
        }
        return t;
      })
    );

    try {
      await api.updateTask({ id, completed: nextStatus === 'completed' });
    } catch (err) {
      console.error('Failed to toggle task completion on backend:', err);
    }
  };

  const handleAddTask = async (newTask: CrmTask) => {
    try {
      const res = await api.createTask({
        title: newTask.title,
        description: newTask.description,
        assignedTo: newTask.assignedTo,
        dueAt: newTask.dueDate,
        priority: newTask.priority,
        eventType: newTask.category,
      });
      const createdId = res?.task?.id ? String(res.task.id) : newTask.id;
      setTasks((prev) => [{ ...newTask, id: createdId }, ...prev]);
    } catch {
      setTasks((prev) => [newTask, ...prev]);
    }
  };

  const handleUpdateTask = async (updated: CrmTask) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTask(null);

    try {
      await api.updateTask({
        id: updated.id,
        title: updated.title,
        description: updated.description,
        priority: updated.priority,
        category: updated.category,
        dueDate: updated.dueDate,
        assignedTo: updated.assignedTo,
      });
    } catch (err) {
      console.error('Failed to update task on backend:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setSelectedTask(null);
    try {
      await api.deleteTask(taskId);
    } catch (err) {
      console.error('Failed to delete task on backend:', err);
    }
  };

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto select-none pb-20 relative">
      {/* 1. Unified 220px Hero Banner with Top Search & Actions */}
      <CrmPageHero
        pageId="tasks"
        defaultEyebrow="Action Items & Workflow SLA • Oceanside HQ"
        defaultTitle="DAILY TASKS & EXPEDITED ACTIONS"
        defaultSubtitle="Follow-up reminders, drone inspection dispatches, material order sign-offs, and SLA tracking."
        showSearch={true}
        searchPlaceholder="Search tasks, assignees, leads, addresses..."
        searchValue={search}
        onSearchChange={setSearch}
        onSearchClear={() => setSearch('')}
        topRightActions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="h-9 flex items-center gap-1.5 px-4 rounded-xl bg-gradient-to-r from-[#1878B8] via-sky-500 to-[#55C4F5] text-white font-bold text-xs shadow-xs hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer"
            >
              <Plus size={14} className="stroke-[3]" />
              <span>New Task</span>
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              title="Refresh tasks"
              className="w-9 h-9 rounded-xl liquid-glass-btn flex items-center justify-center text-slate-700 hover:text-slate-900 hover:border-sky-400 transition-all cursor-pointer shadow-2xs"
            >
              <RotateCcw
                size={14}
                className={`transition-transform duration-500 ${isRefreshing ? 'animate-spin text-sky-600' : ''}`}
              />
            </button>
          </div>
        }
        bottomRightBadges={
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 text-[11px] font-semibold text-slate-700">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50/90 border border-emerald-200/90 text-[10px] font-bold text-emerald-800 shadow-2xs shrink-0">
              <CheckCircle2 size={11} className="text-emerald-600" />
              <span>SLA: 100% On-Time Follow-up</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50/90 border border-sky-200/90 text-[10px] font-bold text-sky-800 shadow-2xs shrink-0">
              <FileText size={11} className="text-sky-600" />
              <span>Estimates Auto-Synced</span>
            </span>
          </div>
        }
      />

      {/* 2. 4 Frosted Glass KPI Cards Matching Mockup & Dashboard (Context-Aware) */}
      <TasksKpiCards
        overdueCount={overdueCount}
        dueTodayCount={dueTodayCount}
        upcomingCount={upcomingCount}
        completedCount={completedCount}
      />

      {/* 3. Mode Switcher Tabs & Category Filter Pills */}
      <TasksFilterBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        activeTasksCount={activeTasksCount}
        personalTasksCount={personalActiveCount}
        categoryCounts={categoryCounts}
      />

      {/* 4. Main Body: Sectioned Team Operations List OR Dashboard Sticky Notes Board */}
      {activeTab === 'operations' ? (
        <TasksSectionList
          tasks={filteredTasks}
          onToggleTask={handleToggleTask}
          onSelectTask={(task) => setSelectedTask(task)}
        />
      ) : (
        <PersonalStickyBoard
          tasks={personalTasks}
          onAddTask={addPersonalTask}
          onUpdateTask={updatePersonalTask}
          onToggleTask={togglePersonalTask}
          onTogglePin={togglePinTask}
          onDeleteTask={deletePersonalTask}
          completedCount={personalCompletedCount}
          progressPercent={personalProgressPercent}
        />
      )}

      {/* 5. Floating Action Button (FAB) from User Mockup Bottom-Right */}
      <button
        type="button"
        onClick={() => setShowCreateModal(true)}
        title="Quick Add Task"
        className="fixed bottom-6 right-6 z-40 w-13 h-13 rounded-full bg-gradient-to-tr from-[#1878B8] via-[#0284c7] to-[#38bdf8] text-white flex items-center justify-center shadow-xl shadow-sky-500/35 hover:scale-110 active:scale-95 transition-all cursor-pointer border-2 border-white/60 group"
      >
        <Plus size={24} className="stroke-[3] group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* 6. Quick Task Creation Modal */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onAddTask={handleAddTask}
      />

      {/* 7. Task Detail / Inspector Modal (Opens on Click) */}
      <CrmTaskDetailModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        onToggleStatus={handleToggleTask}
      />
    </div>
  );
}

export default TasksPage;
