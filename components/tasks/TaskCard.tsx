'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn, taskStatusColor, taskStatusLabel, taskPriorityColor, taskPriorityLabel, formatDate } from '@/lib/utils/formatters';
import type { Task } from '@/types/models';
import { CalendarBlank, User, ClipboardText, PencilSimple, Trash, ArrowRight, ArrowsClockwise } from '@phosphor-icons/react';
import UpdateTaskStatusModal from './UpdateTaskStatusModal';

interface TaskCardProps {
  task: Task;
  onStatusUpdate?: (taskId: string, status: Task['status'], comment?: string) => Promise<void> | void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  showAssignedByPc?: boolean;
  compact?: boolean;
}

function priorityBarColor(priority: Task['priority']) {
  switch (priority) {
    case 'high':   return 'bg-rose-500';
    case 'medium': return 'bg-amber-400';
    case 'low':    return 'bg-emerald-400';
    default:       return 'bg-slate-300';
  }
}

function priorityTextColor(priority: Task['priority']) {
  switch (priority) {
    case 'high':   return 'text-rose-600 bg-rose-50 border-rose-200';
    case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'low':    return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    default:       return 'text-slate-500 bg-slate-50 border-slate-200';
  }
}

function statusChipColor(status: Task['status']) {
  switch (status) {
    case 'completed':  return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'in_progress':return 'text-indigo-700 bg-indigo-50 border-indigo-200';
    case 'overdue':    return 'text-rose-700 bg-rose-50 border-rose-200';
    default:           return 'text-slate-600 bg-slate-50 border-slate-200';
  }
}

export default function TaskCard({
  task,
  onStatusUpdate,
  onEdit,
  onDelete,
  showAssignedByPc = false,
  compact = false,
}: TaskCardProps) {
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  return (
    <div className={cn(
      'card card-hover flex overflow-hidden transition-all duration-200',
      compact ? 'p-0' : 'p-0'
    )}>
      {/* Left priority accent bar */}
      <div className={cn('w-1 shrink-0 rounded-l-2xl', priorityBarColor(task.priority))} />

      <div className="flex-1 min-w-0 p-4">
        {/* Top row: title + actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              'font-semibold text-slate-900 leading-snug',
              compact ? 'text-xs truncate' : 'text-sm'
            )}>
              {task.name}
            </h3>
            {task.assignedByPc && showAssignedByPc && (
              <span className="inline-block mt-0.5 badge bg-indigo-50 text-indigo-700 border-indigo-100 text-[10px]">
                Assigned by PC
              </span>
            )}
          </div>

          {/* Action icons */}
          <div className="flex items-center gap-1 shrink-0 -mt-0.5">
            {onStatusUpdate && (
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 transition-colors cursor-pointer mr-0.5 shrink-0 shadow-2xs"
                title="Update task status"
              >
                <ArrowsClockwise size={13} weight="bold" />
                <span>Update Status</span>
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(task)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                title="Edit Task"
              >
                <PencilSimple size={15} />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(task.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Delete Task"
              >
                <Trash size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        {task.description && !compact && (
          <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        {/* Chips row */}
        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
          <span className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border',
            priorityTextColor(task.priority)
          )}>
            <span className={cn('w-1.5 h-1.5 rounded-full', priorityBarColor(task.priority))} />
            {taskPriorityLabel(task.priority)}
          </span>
          <span className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border',
            statusChipColor(task.status)
          )}>
            {taskStatusLabel(task.status)}
          </span>
          {task.isSurveyTask && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-purple-50 text-purple-700 border-purple-200">
              <ClipboardText size={9} weight="fill" />
              Survey
            </span>
          )}
        </div>

        {/* Bottom row: date + assignees */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <span className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <CalendarBlank size={12} className="text-slate-400" />
            {formatDate(task.startDate)} → {formatDate(task.endDate)}
          </span>
          {task.assignedTo.length > 0 && !compact && (
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              {task.assignedTo.length === 1 ? (
                <>
                  <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[9px] font-bold shrink-0">
                    {task.assignedTo[0].name.slice(0, 1).toUpperCase()}
                  </div>
                  <span className="truncate max-w-[80px]">{task.assignedTo[0].name}</span>
                </>
              ) : (
                <>
                  <div className="flex -space-x-1.5">
                    {task.assignedTo.slice(0, 3).map((a, i) => (
                      <div key={a.id} className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[9px] font-bold ring-1 ring-white" style={{ zIndex: 3 - i }}>
                        {a.name.slice(0, 1).toUpperCase()}
                      </div>
                    ))}
                  </div>
                  <span>{task.assignedTo.length} people</span>
                </>
              )}
            </span>
          )}
        </div>

        {/* Survey action */}
        {task.isSurveyTask && !compact && (
          <Link
            href={task.surveyId ? `/surveys/${task.surveyId}` : '/surveys'}
            className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 btn-press transition-colors"
          >
            <ClipboardText size={13} weight="bold" />
            Fill Survey
            <ArrowRight size={12} weight="bold" />
          </Link>
        )}
      </div>

      {/* Status Update Popup Modal */}
      {isStatusModalOpen && onStatusUpdate && (
        <UpdateTaskStatusModal
          task={task}
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          onUpdateStatus={onStatusUpdate}
        />
      )}
    </div>
  );
}
