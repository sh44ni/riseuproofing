'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  AlertCircle,
  Trash2,
  CheckCircle2,
  Tag,
  FileText,
  Sparkles,
} from 'lucide-react';
import { CalendarEvent, CalendarEventType } from '@/app/api/admin/calendar/route';
import UserAvatar from '@/components/admin/shared/UserAvatar';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: any) => Promise<void>;
  onDelete?: (taskId: number) => Promise<void>;
  initialTask?: CalendarEvent | null;
  initialDate?: string;
  initialTime?: string;
  initialPersonId?: number;
  team: Array<{ id: number; name: string; role: string; avatar_url: string | null }>;
}

const EVENT_TYPE_OPTIONS: Array<{ id: CalendarEventType; label: string; icon: string }> = [
  { id: 'task', label: 'Manual Task', icon: '✓' },
  { id: 'roof_install', label: 'Roof Install', icon: '🔨' },
  { id: 'boom_delivery', label: 'Boom Delivery', icon: '📦' },
  { id: 'city_permit', label: 'City Permit', icon: '🏛️' },
  { id: 'roof_inspection', label: 'Roof Inspection', icon: '🔍' },
  { id: 'warranty_checkin', label: 'Warranty Check-in', icon: '🛡️' },
];

export default function TaskModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialTask,
  initialDate,
  initialTime,
  initialPersonId,
  team,
}: TaskModalProps) {
  const isEdit = Boolean(initialTask && initialTask.source_type === 'manual_task');

  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<CalendarEventType>('task');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [assignedUserId, setAssignedUserId] = useState<string>('');
  const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [description, setDescription] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (initialTask && initialTask.source_type === 'manual_task') {
      setTitle(initialTask.title || '');
      setEventType(initialTask.event_type || 'task');
      setDate(initialTask.date || new Date().toISOString().slice(0, 10));
      setIsAllDay(Boolean(initialTask.is_all_day));

      if (initialTask.start_at && initialTask.start_at.includes('T')) {
        const d = new Date(initialTask.start_at);
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        setTime(`${hours}:${minutes}`);
      } else {
        setTime('09:00');
      }

      if (initialTask.assignee_ids && initialTask.assignee_ids.length > 0) {
        setAssignedUserId(String(initialTask.assignee_ids[0]));
      } else {
        setAssignedUserId('');
      }

      setPriority((initialTask.priority as any) || 'normal');
      setDescription(initialTask.notes || '');
      setIsCompleted(Boolean(initialTask.completed));
    } else {
      setTitle('');
      setEventType('task');
      setDate(initialDate || new Date().toISOString().slice(0, 10));
      setTime(initialTime || '09:00');
      setIsAllDay(!initialTime);
      setAssignedUserId(initialPersonId ? String(initialPersonId) : '');
      setPriority('normal');
      setDescription('');
      setIsCompleted(false);
    }
  }, [initialTask, initialDate, initialTime, initialPersonId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      let dueAtStr: string;
      if (isAllDay) {
        dueAtStr = `${date}T00:00:00Z`;
      } else {
        const fullTime = time || '09:00';
        dueAtStr = new Date(`${date}T${fullTime}:00`).toISOString();
      }

      const payload = {
        id: isEdit && initialTask ? initialTask.source_id : undefined,
        title: title.trim(),
        description: description.trim() || undefined,
        dueAt: dueAtStr,
        eventType,
        priority,
        assignedToUserId: assignedUserId ? parseInt(assignedUserId, 10) : null,
        completed: isCompleted,
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit || !initialTask || !onDelete) return;
    if (!confirm('Are you sure you want to delete this task?')) return;

    setDeleting(true);
    try {
      await onDelete(initialTask.source_id);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold">
              {isEdit ? '✏️' : '✓'}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isEdit ? 'Edit Manual Task' : 'Create Field Task'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEdit ? 'Direct calendar entry' : 'Standalone operation or CRM reminder'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Roof load inspection, pick up valley flashing, customer call..."
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:border-cyan-500 focus:outline-none font-medium"
            />
          </div>

          {/* Event Type & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Event Category
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as CalendarEventType)}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:border-cyan-500 focus:outline-none bg-white font-medium"
              >
                {EVENT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.icon} {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:border-cyan-500 focus:outline-none bg-white font-medium"
              >
                <option value="normal">Normal</option>
                <option value="high">High Priority</option>
                <option value="urgent">🔴 Urgent / Critical</option>
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Time
                </label>
                <label className="text-[11px] text-slate-500 flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAllDay}
                    onChange={(e) => setIsAllDay(e.target.checked)}
                    className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  <span>All-day</span>
                </label>
              </div>
              <input
                type="time"
                disabled={isAllDay}
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:border-cyan-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>
          </div>

          {/* Assignee Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Assignee (Team Member)
            </label>
            <select
              value={assignedUserId}
              onChange={(e) => setAssignedUserId(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:border-cyan-500 focus:outline-none bg-white font-medium"
            >
              <option value="">Unassigned Operations Pool</option>
              {team.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>

          {/* Description / Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Notes & Instructions
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add scope details, material requirements, gate codes, or reminders..."
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:border-cyan-500 focus:outline-none font-normal"
            />
          </div>

          {/* Status toggle if in edit mode */}
          {isEdit && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <input
                type="checkbox"
                id="task_completed_toggle"
                checked={isCompleted}
                onChange={(e) => setIsCompleted(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <label htmlFor="task_completed_toggle" className="text-xs text-slate-700 font-semibold cursor-pointer">
                Mark task as completed
              </label>
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {isEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleting ? 'Deleting...' : 'Delete'}</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-all shadow-sm"
              >
                {submitting ? 'Saving...' : isEdit ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
