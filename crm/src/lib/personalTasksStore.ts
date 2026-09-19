import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  PersonalTaskPayload,
  TaskPriority,
  WorkCategory,
  fetchPersonalTasksFromBackend,
  createPersonalTaskOnBackend,
  updatePersonalTaskOnBackend,
  deletePersonalTaskOnBackend,
} from '@/api/personalTasksApi';

export type { TaskPriority, WorkCategory, PersonalTaskPayload as PersonalTask };

export interface PriorityConfig {
  id: TaskPriority;
  label: string;
  colorName: string;
  badgeClass: string;
  dotClass: string;
}

export const PRIORITY_OPTIONS: PriorityConfig[] = [
  {
    id: 'urgent',
    label: 'Urgent',
    colorName: 'Red',
    badgeClass: 'bg-rose-50/95 text-rose-700 border-rose-300',
    dotClass: 'bg-rose-500',
  },
  {
    id: 'high',
    label: 'High',
    colorName: 'Yellow',
    badgeClass: 'bg-amber-50/95 text-amber-800 border-amber-300',
    dotClass: 'bg-amber-500',
  },
  {
    id: 'normal',
    label: 'Normal',
    colorName: 'Blue',
    badgeClass: 'bg-sky-50/95 text-sky-700 border-sky-300',
    dotClass: 'bg-sky-500',
  },
  {
    id: 'low',
    label: 'Low',
    colorName: 'Gray',
    badgeClass: 'bg-slate-100/90 text-slate-600 border-slate-300',
    dotClass: 'bg-slate-400',
  },
];

export interface CategoryConfig {
  id: WorkCategory;
  label: string;
  badgeClass: string;
  dotClass: string;
}

export const WORK_CATEGORIES: CategoryConfig[] = [
  {
    id: 'Rise Up',
    label: 'Rise Up',
    badgeClass: 'bg-sky-50/90 text-[#0284c7] border-sky-200/80',
    dotClass: 'bg-[#0284c7]',
  },
  {
    id: 'Content Creation',
    label: 'Content Creation',
    badgeClass: 'bg-purple-50/90 text-purple-700 border-purple-200/80',
    dotClass: 'bg-purple-500',
  },
  {
    id: 'Marketing',
    label: 'Marketing',
    badgeClass: 'bg-emerald-50/90 text-emerald-700 border-emerald-200/80',
    dotClass: 'bg-emerald-500',
  },
];

export const INITIAL_PERSONAL_TASKS: PersonalTaskPayload[] = [];

const STORAGE_KEY = 'crm_personal_sticky_notes';
const SYNC_EVENT_NAME = 'crm_personal_tasks_change';

/**
 * Load personal tasks from local storage with fallback
 */
export function loadPersonalTasks(): PersonalTaskPayload[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to parse personal tasks from storage:', err);
    return [];
  }
}

/**
 * Save personal tasks to local storage and trigger sync event
 */
export function savePersonalTasks(tasks: PersonalTaskPayload[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    window.dispatchEvent(new CustomEvent(SYNC_EVENT_NAME, { detail: tasks }));
  } catch (err) {
    console.error('Failed to save personal tasks to storage:', err);
  }
}

/**
 * React hook for managing individual to-dos and reminders
 */
export function usePersonalTasks() {
  const [tasks, setTasks] = useState<PersonalTaskPayload[]>(loadPersonalTasks);

  // Cross-tab synchronization
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setTasks(JSON.parse(e.newValue));
        } catch {
          // Ignore parse errors
        }
      }
    };

    const handleCustomEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && Array.isArray(detail)) {
        setTasks(detail);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(SYNC_EVENT_NAME, handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(SYNC_EVENT_NAME, handleCustomEvent);
    };
  }, []);

  // Backend background revalidation on mount
  useEffect(() => {
    let isMounted = true;
    fetchPersonalTasksFromBackend().then((backendTasks) => {
      if (backendTasks !== null && isMounted) {
        setTasks(backendTasks);
        savePersonalTasks(backendTasks);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Metrics
  const completedCount = useMemo(() => tasks.filter((t) => t.completed).length, [tasks]);
  const activeCount = useMemo(() => tasks.filter((t) => !t.completed).length, [tasks]);
  const progressPercent = useMemo(
    () => (tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0),
    [tasks.length, completedCount]
  );

  const refreshTasks = useCallback(async () => {
    const backendTasks = await fetchPersonalTasksFromBackend();
    if (backendTasks !== null) {
      setTasks(backendTasks);
      savePersonalTasks(backendTasks);
    }
  }, []);

  // Add task
  const addTask = useCallback(
    async (taskData: Omit<PersonalTaskPayload, 'id' | 'createdAt'>) => {
      const newTask: PersonalTaskPayload = {
        ...taskData,
        id: `task-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };

      setTasks((prev) => {
        const updated = [newTask, ...prev];
        savePersonalTasks(updated);
        return updated;
      });

      await createPersonalTaskOnBackend(newTask);
      return newTask;
    },
    []
  );

  // Update task
  const updateTask = useCallback(
    async (id: string, updates: Partial<PersonalTaskPayload>) => {
      setTasks((prev) => {
        const updated = prev.map((t) =>
          t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
        );
        savePersonalTasks(updated);
        return updated;
      });

      await updatePersonalTaskOnBackend(id, updates);
    },
    []
  );

  // Toggle completion
  const toggleTask = useCallback(
    async (id: string) => {
      let nextStatus = false;
      setTasks((prev) => {
        const updated = prev.map((t) => {
          if (t.id === id) {
            nextStatus = !t.completed;
            return {
              ...t,
              completed: nextStatus,
              updatedAt: new Date().toISOString(),
            };
          }
          return t;
        });
        savePersonalTasks(updated);
        return updated;
      });

      await updatePersonalTaskOnBackend(id, { completed: nextStatus });
    },
    []
  );

  // Toggle pin
  const togglePinTask = useCallback(
    async (id: string) => {
      let nextPinned = false;
      let nextSortOrder = 0;
      setTasks((prev) => {
        const updated = prev.map((t) => {
          if (t.id === id) {
            nextPinned = !t.isPinned && (t.sortOrder === undefined || t.sortOrder >= 0);
            nextSortOrder = nextPinned ? -100 : 0;
            return {
              ...t,
              isPinned: nextPinned,
              sortOrder: nextSortOrder,
              updatedAt: new Date().toISOString(),
            };
          }
          return t;
        });
        savePersonalTasks(updated);
        return updated;
      });

      await updatePersonalTaskOnBackend(id, { sortOrder: nextSortOrder });
    },
    []
  );

  // Change priority directly
  const setTaskPriority = useCallback(
    async (id: string, priority: TaskPriority) => {
      await updateTask(id, { priority });
    },
    [updateTask]
  );

  // Change work category directly
  const setTaskWorkCategory = useCallback(
    async (id: string, workCategory: WorkCategory) => {
      await updateTask(id, { workCategory });
    },
    [updateTask]
  );

  // Delete task
  const deleteTask = useCallback(
    async (id: string) => {
      setTasks((prev) => {
        const updated = prev.filter((t) => t.id !== id);
        savePersonalTasks(updated);
        return updated;
      });

      await deletePersonalTaskOnBackend(id);
    },
    []
  );

  return {
    tasks,
    completedCount,
    activeCount,
    progressPercent,
    refreshTasks,
    addTask,
    updateTask,
    toggleTask,
    togglePinTask,
    setTaskPriority,
    setTaskWorkCategory,
    deleteTask,
  };
}
