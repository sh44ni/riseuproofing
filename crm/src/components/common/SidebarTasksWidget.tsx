import React, { useState } from 'react';
import {
  CheckSquare,
  Check,
  Plus,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import {
  usePersonalTasks,
  TaskPriority,
  WorkCategory,
  PRIORITY_OPTIONS,
  WORK_CATEGORIES,
  PersonalTask,
} from '@/lib/personalTasksStore';
import { CreatePersonalTaskModal } from './CreatePersonalTaskModal';
import { PersonalTaskDetailModal } from './PersonalTaskDetailModal';

export function SidebarTasksWidget() {
  const {
    tasks,
    completedCount,
    progressPercent,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
  } = usePersonalTasks();

  const [showAllTasks, setShowAllTasks] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<PersonalTask | null>(null);

  const visibleTasks = showAllTasks ? tasks : tasks.slice(0, 2);

  return (
    <>
      <div className="relative z-10 rounded-2xl light-glass-panel glossy-sheen border border-white/85 shadow-xs p-3 space-y-2.5 select-none group/tasks hover:border-sky-300 transition-all">
        {/* ========================================================
            1. HEADER: Title, Count, Progress Summary, [+] and View All
            ======================================================== */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-sky-50/90 text-[#0284c7] flex items-center justify-center border border-sky-200/80 shrink-0 shadow-2xs backdrop-blur-xs">
              <CheckSquare size={13} className="text-[#0284c7]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <h3 className="text-xs font-bold text-[#1F1F1F]">Tasks</h3>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-white/70 text-slate-600 border border-white/80 shadow-2xs">
                  {tasks.length}
                </span>
              </div>
              <span className="text-[9.5px] text-slate-400 font-medium mt-0.5 block">
                {completedCount} of {tasks.length} done ({progressPercent}%)
              </span>
            </div>
          </div>

          {/* Actions: [+] Button paired with View All -> (29% pill removed) */}
          <div className="flex items-center gap-1.5">
            {/* [+] Button (Opens Nice Popup for Sticky Note) */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              aria-label="Add Sticky Note"
              title="Add New Sticky Note / To-Do"
              className="w-5 h-5 rounded-md bg-[#1878B8] hover:bg-sky-500 text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-110 active:scale-95 shrink-0"
            >
              <Plus size={11} className="stroke-[3]" />
            </button>

            {/* View All Link */}
            <a
              href="/tasks"
              className="text-[9.5px] font-bold text-[#0284c7] hover:text-[#0369a1] flex items-center gap-0.5 group transition-colors"
            >
              <span>View All</span>
              <ArrowRight size={9} className="group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>

        {/* ========================================================
            2. DYNAMIC PROGRESS BAR
            ======================================================== */}
        <div className="w-full bg-white/50 border border-white/70 rounded-full h-1.5 overflow-hidden shadow-inner">
          <div
            className="bg-gradient-to-r from-[#1878B8] to-emerald-500 h-full rounded-full transition-all duration-500 ease-out shadow-xs"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* ========================================================
            3. INTERACTIVE TASK CARDS (Priority & Work Category Dropdowns)
            ======================================================== */}
        <div className="space-y-1.5 pt-0.5">
          {tasks.length === 0 ? (
            <div className="text-center py-2.5 px-2 rounded-xl bg-white/40 border border-white/60">
              <p className="text-[10px] text-slate-500 font-medium">No sticky notes yet</p>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="mt-1 text-[9.5px] font-bold text-[#0284c7] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus size={10} /> Add sticky note
              </button>
            </div>
          ) : (
            visibleTasks.map((task) => {
            const currentPriority =
              PRIORITY_OPTIONS.find((p) => p.id === task.priority) || PRIORITY_OPTIONS[2];
            const currentCategory =
              WORK_CATEGORIES.find((c) => c.id === task.workCategory) || WORK_CATEGORIES[0];

            return (
              <div
                key={task.id}
                onClick={() => setSelectedTaskForDetail(task)}
                className={`group relative flex items-center gap-2 p-2 rounded-xl transition-all border cursor-pointer ${
                  task.completed
                    ? 'bg-white/40 border-white/60 opacity-75 backdrop-blur-xs hover:border-slate-300'
                    : 'liquid-glass-tile border-white/80 hover:border-sky-300 hover:shadow-2xs'
                }`}
              >
                {/* Checkbox */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTask(task.id);
                  }}
                  aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
                  className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                    task.completed
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs scale-105'
                      : 'border-slate-300 group-hover:border-[#1878B8] bg-white/80 group-hover:bg-sky-50/70'
                  }`}
                >
                  {task.completed && <Check size={11} className="stroke-[3]" />}
                </button>

                {/* Title + Static badges row */}
                <div className="min-w-0 flex-1 flex items-center justify-between gap-1.5">
                  <div className="min-w-0 flex-1">
                    <div
                      className={`truncate text-[10.5px] font-semibold leading-tight ${
                        task.completed
                          ? 'line-through text-slate-400'
                          : 'text-slate-800 group-hover:text-slate-950'
                      }`}
                    >
                      {task.title}
                    </div>
                    {/* Static category badge */}
                    <span className={`inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider px-1.5 py-px rounded border shadow-2xs mt-0.5 ${currentCategory.badgeClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${currentCategory.dotClass}`} />
                      {currentCategory.label}
                    </span>
                  </div>

                  {/* Static priority badge */}
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md border shadow-2xs shrink-0 inline-flex items-center gap-1 ${currentPriority.badgeClass}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${currentPriority.dotClass}`} />
                    {currentPriority.label}
                  </span>
                </div>
              </div>
            );
          }))
}
        </div>

        {/* ========================================================
            4. EXPAND / COLLAPSE BUTTON
            ======================================================== */}
        {tasks.length > 2 && (
          <button
            type="button"
            onClick={() => setShowAllTasks((prev) => !prev)}
            className="w-full py-1.5 px-3 rounded-xl liquid-glass-btn text-[10px] font-bold text-slate-600 hover:text-[#0284c7] flex items-center justify-center gap-1.5 transition-all cursor-pointer group shadow-2xs"
          >
            <span>{showAllTasks ? 'Show Less' : `View All (${tasks.length})`}</span>
            <ChevronDown
              size={12}
              className={`text-slate-400 group-hover:text-[#0284c7] transition-transform duration-200 ${
                showAllTasks ? 'rotate-180' : ''
              }`}
            />
          </button>
        )}
      </div>

      {/* ========================================================
          5. NEW STICKY NOTE MODAL POPUP
          ======================================================== */}
      <CreatePersonalTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddTask={addTask}
      />

      {/* ========================================================
          6. STICKY NOTE DETAIL / INSPECTOR MODAL POPUP
          ======================================================== */}
      <PersonalTaskDetailModal
        task={selectedTaskForDetail}
        isOpen={!!selectedTaskForDetail}
        onClose={() => setSelectedTaskForDetail(null)}
        onUpdate={updateTask}
        onDelete={deleteTask}
        onToggle={toggleTask}
      />
    </>
  );
}
