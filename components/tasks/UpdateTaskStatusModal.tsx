'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Task, TaskStatus } from '@/types/models';
import { X, CheckCircle, HourglassSimple, Play, CalendarBlank, ChatText, ArrowRight } from '@phosphor-icons/react';
import { cn, formatDate } from '@/lib/utils/formatters';

interface UpdateTaskStatusModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (taskId: string, status: Task['status'], comment?: string) => Promise<void> | void;
}

export default function UpdateTaskStatusModal({
  task,
  isOpen,
  onClose,
  onUpdateStatus,
}: UpdateTaskStatusModalProps) {
  const [mounted, setMounted] = useState(false);
  const [remark, setRemark] = useState('');
  const [submittingStatus, setSubmittingStatus] = useState<TaskStatus | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setRemark('');
      setSubmittingStatus(null);
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleStatusSubmit = async (status: TaskStatus) => {
    try {
      setSubmittingStatus(status);
      await onUpdateStatus(task.id, status, remark.trim() || undefined);
      onClose();
    } finally {
      setSubmittingStatus(null);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
              <ChatText size={18} weight="duotone" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Update Task Status</h3>
              <p className="text-[11px] text-slate-500">Record remarks and update progress</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Task Info Summary */}
        <div className="p-5 space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Task Details
              </span>
              <span className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                task.status === 'completed' && 'bg-emerald-100 text-emerald-700',
                task.status === 'in_progress' && 'bg-indigo-100 text-indigo-700',
                task.status === 'pending' && 'bg-amber-100 text-amber-700',
                task.status === 'overdue' && 'bg-rose-100 text-rose-700'
              )}>
                Current: {task.status.replace('_', ' ')}
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 leading-snug">
              {task.name}
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <CalendarBlank size={13} className="text-slate-400" />
              <span>{formatDate(task.startDate)} → {formatDate(task.endDate)}</span>
            </div>
          </div>

          {/* Remark Input Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="task-remark" className="text-xs font-semibold text-slate-700">
                Enter Remark / Progress Notes
              </label>
              <span className="text-[10px] text-slate-400">Optional</span>
            </div>
            <textarea
              id="task-remark"
              rows={3}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="e.g. Conducted survey in block, completed 15 interviews, awaiting approvals..."
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-all"
            />
          </div>

          {/* Status Buttons Section */}
          <div className="space-y-2 pt-1">
            <span className="block text-xs font-semibold text-slate-700">
              Select Status to Update:
            </span>

            <div className="grid grid-cols-3 gap-2">
              {/* In Progress Button */}
              <button
                type="button"
                disabled={submittingStatus !== null}
                onClick={() => handleStatusSubmit('in_progress')}
                className={cn(
                  'flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none',
                  task.status === 'in_progress'
                    ? 'border-indigo-500 bg-indigo-50/80 text-indigo-700 shadow-2xs ring-1 ring-indigo-400'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-600',
                  submittingStatus === 'in_progress' && 'opacity-60 cursor-wait'
                )}
              >
                <Play size={18} weight="fill" className="text-indigo-600 mb-1" />
                <span>In Progress</span>
                {task.status === 'in_progress' && (
                  <span className="text-[9px] font-medium text-indigo-500 mt-0.5">(Current)</span>
                )}
              </button>

              {/* Done Button */}
              <button
                type="button"
                disabled={submittingStatus !== null}
                onClick={() => handleStatusSubmit('completed')}
                className={cn(
                  'flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none',
                  task.status === 'completed'
                    ? 'border-emerald-500 bg-emerald-50/80 text-emerald-700 shadow-2xs ring-1 ring-emerald-400'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-600',
                  submittingStatus === 'completed' && 'opacity-60 cursor-wait'
                )}
              >
                <CheckCircle size={18} weight="fill" className="text-emerald-600 mb-1" />
                <span>Done</span>
                {task.status === 'completed' && (
                  <span className="text-[9px] font-medium text-emerald-500 mt-0.5">(Current)</span>
                )}
              </button>

              {/* Pending Button */}
              <button
                type="button"
                disabled={submittingStatus !== null}
                onClick={() => handleStatusSubmit('pending')}
                className={cn(
                  'flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none',
                  task.status === 'pending'
                    ? 'border-amber-500 bg-amber-50/80 text-amber-700 shadow-2xs ring-1 ring-amber-400'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50/50 hover:text-amber-600',
                  submittingStatus === 'pending' && 'opacity-60 cursor-wait'
                )}
              >
                <HourglassSimple size={18} weight="fill" className="text-amber-600 mb-1" />
                <span>Pending</span>
                {task.status === 'pending' && (
                  <span className="text-[9px] font-medium text-amber-500 mt-0.5">(Current)</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-5 py-3.5 bg-slate-50/80 border-t border-slate-100">
          <button
            type="button"
            disabled={submittingStatus !== null}
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
