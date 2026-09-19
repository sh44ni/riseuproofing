import React, { useState } from 'react';
import { Calendar, CheckSquare, Plus, ChevronRight, Check, Flame, Clock } from 'lucide-react';
import { ClientTask } from '@/types/client360Types';

interface ClientRemindersCardProps {
  tasks: ClientTask[];
  onToggleTask?: (taskId: string) => void;
  onAddTask?: () => void;
  onViewAllTasks?: () => void;
}

export function ClientRemindersCard({
  tasks,
  onToggleTask,
  onAddTask,
  onViewAllTasks,
}: ClientRemindersCardProps) {
  const pendingCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="light-glass-card rounded-2xl p-5">
      {/* Header matching mockup */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <Calendar size={16} />
          </div>
          <h3 className="font-bold text-sm text-slate-900 tracking-tight">
            Next Follow-ups & Reminders
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onAddTask}
            className="text-xs font-semibold text-[#0284C7] hover:text-[#0369a1] transition-colors flex items-center gap-1"
          >
            <Plus size={13} />
            <span>Add Task</span>
          </button>

          <button
            onClick={onViewAllTasks}
            className="text-xs font-semibold text-[#0284C7] hover:text-[#0369a1] transition-colors flex items-center gap-0.5"
          >
            <span>All Tasks ({pendingCount})</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Task List or Empty State (Exact Mockup) */}
      <div className="mt-3">
        {tasks.length === 0 ? (
          <div className="py-4 text-xs italic text-slate-400">
            No pending tasks for this client. You're all caught up!
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                  task.completed
                    ? 'bg-slate-50/50 border-slate-200 text-slate-400 line-through'
                    : 'bg-white border-slate-200/80 hover:border-slate-300 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onToggleTask?.(task.id)}
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                      task.completed
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 hover:border-[#0284C7] bg-white'
                    }`}
                  >
                    {task.completed && <Check size={12} />}
                  </button>

                  <div>
                    <div className="text-xs font-semibold text-slate-900 flex items-center gap-2">
                      <span>{task.title}</span>
                      {task.isWinBackTask && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <Flame size={10} className="text-amber-600" />
                          Win-Back Touchpoint
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        Due: <strong className="text-slate-600">{task.dueDate}</strong>
                      </span>
                      <span>•</span>
                      <span>Assigned to: {task.assignedTo}</span>
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                    task.priority === 'high'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
