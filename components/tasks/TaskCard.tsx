'use client';

import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn, taskStatusColor, taskStatusLabel, taskPriorityColor, taskPriorityLabel, formatDate } from '@/lib/utils/formatters';
import type { Task, TaskStatus } from '@/types/models';
import { MOCK_SURVEYS } from '@/lib/api/mockData';
import { CalendarBlank, User, ClipboardText, PencilSimple, Trash, ArrowRight, ArrowsClockwise, Users, CheckCircle, Check, X, Eye, VideoCamera, Clock } from '@phosphor-icons/react';
import UpdateTaskStatusModal from './UpdateTaskStatusModal';
import StakeholderResponsesPreviewModal from '@/components/surveys/StakeholderResponsesPreviewModal';
import { useAuth } from '@/lib/auth/context';
import { surveysApi } from '@/lib/api/surveys';
import { toast } from 'sonner';

interface TaskCardProps {
  task: Task;
  onStatusUpdate?: (taskId: string, status: Task['status'], comment?: string) => Promise<void> | void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  showAssignedByPc?: boolean;
  compact?: boolean;
}

function formatMeetingTime(scheduledAt: string, duration?: number) {
  const start = new Date(scheduledAt);
  const timeStr = start.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  if (duration) {
    const end = new Date(start.getTime() + duration * 60000);
    const endTimeStr = end.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `${timeStr} – ${endTimeStr}`;
  }
  return timeStr;
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
  const pathname = usePathname() || '';

  // Resolve survey details if it's a survey task
  const surveyId = task.surveyId || (task.isSurveyTask ? 'survey-01' : undefined);
  const matchedSurvey = useMemo(() => {
    if (!task.isSurveyTask || !surveyId) return null;
    return (
      MOCK_SURVEYS.find(
        (s) =>
          s.id === surveyId ||
          s.id === surveyId.replace(/^surv-/, 'survey-') ||
          s.id.replace(/^survey-/, 'surv-') === surveyId
      ) || MOCK_SURVEYS[0]
    );
  }, [task.isSurveyTask, surveyId]);

  // Automatic status calculation for survey tasks based on participants surveyed
  const computedStatus: TaskStatus = useMemo(() => {
    if (!task.isSurveyTask) return task.status;
    if (matchedSurvey) {
      const resp = matchedSurvey.responsesCount ?? 0;
      const req = matchedSurvey.participantsRequired ?? 50;
      if (resp >= req) {
        return 'completed';
      }
      if (resp > 0) {
        return 'in_progress';
      }
      return 'pending';
    }
    return task.status;
  }, [task.isSurveyTask, task.status, matchedSurvey]);

  // Determine correct role survey URL (interns, fellows, or pc)
  const surveyUrl = useMemo(() => {
    const id = surveyId || 'survey-01';
    if (pathname.startsWith('/fellow')) {
      return `/fellow/surveys/${id}`;
    }
    if (pathname.startsWith('/pc')) {
      return `/pc/surveys/${id}`;
    }
    return `/intern/surveys/${id}`;
  }, [pathname, surveyId]);

  const { user } = useAuth();
  const currentRole = (user?.role as 'intern' | 'fellow' | 'pc') || 'intern';

  const [mounted, setMounted] = useState(false);
  const [isHierarchySubmitModalOpen, setIsHierarchySubmitModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll while submission modal is open
  useEffect(() => {
    if (isHierarchySubmitModalOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isHierarchySubmitModalOpen]);

  const interviewedCount = matchedSurvey?.responsesCount ?? 0;
  const quota = matchedSurvey?.participantsRequired ?? 50;
  const quotaPercent = quota > 0 ? Math.min(100, Math.round((interviewedCount / quota) * 100)) : 0;
  const isSurveyStarted = interviewedCount > 0 || computedStatus === 'in_progress' || computedStatus === 'completed';

  const handleConfirmTaskSurveySubmit = async () => {
    setIsSubmittingFeedback(true);

    try {
      const activeSurveyId = surveyId || matchedSurvey?.id || 'survey-01';
      const currentUserRef = user
        ? { id: user.id, name: user.name, role: user.role }
        : { id: 'u-curr-01', name: 'Field Officer', role: currentRole };

      await surveysApi.submitHierarchySurvey(activeSurveyId, {
        submittedBy: currentUserRef,
        role: currentRole,
        feedbackText: feedbackText.trim() || 'Survey batch verified and submitted.',
      });

      if (onStatusUpdate) {
        await onStatusUpdate(task.id, 'completed');
      }

      setIsHierarchySubmitModalOpen(false);
      toast.success('Survey batch submitted successfully!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit survey');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

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

          {/* Action icons (Preview, Edit, Delete) - Top Right */}
          <div className="flex items-center gap-1 shrink-0 -mt-0.5">
            {task.isSurveyTask && (
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                title="Preview All Stakeholder Survey Responses"
              >
                <Eye size={15} />
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(task)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                title="Edit Task"
              >
                <PencilSimple size={15} />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(task.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
            statusChipColor(computedStatus)
          )}>
            {taskStatusLabel(computedStatus)}
          </span>
          {task.isSurveyTask && (
            <Link
              href={surveyUrl}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 hover:text-slate-900 transition-colors"
              title="Start Survey"
            >
              <ClipboardText size={10} weight="fill" className="text-slate-600" />
              <span>Survey</span>
              {matchedSurvey && (
                <span className="text-[9px] font-bold text-slate-500 ml-0.5">
                  ({interviewedCount}/{quota})
                </span>
              )}
            </Link>
          )}
          {task.isMeetingTask && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-slate-100 text-slate-700 border-slate-200">
              <VideoCamera size={10} weight="fill" className="text-slate-600" />
              <span>Online Meeting</span>
            </span>
          )}
        </div>

        {/* Stakeholders Interviewed KPI Banner */}
        {task.isSurveyTask && !compact && (
          <div className="mt-3 p-3 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-2">
            {/* Top row: Clean title and non-breaking numbers */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 shrink-0">
                <Users size={15} weight="bold" className="text-indigo-600 shrink-0" />
                <span className="whitespace-nowrap">Stakeholders Interviewed</span>
              </div>
              <div className="flex items-baseline gap-1 shrink-0 whitespace-nowrap">
                <span className="text-xs sm:text-sm font-black text-slate-900">{interviewedCount}</span>
                <span className="text-[11px] font-medium text-slate-400">/ {quota}</span>
                <span className="text-[11px] font-bold text-indigo-600 ml-1">({quotaPercent}%)</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  quotaPercent >= 100 ? 'bg-emerald-600' : 'bg-indigo-600'
                )}
                style={{ width: `${quotaPercent}%` }}
              />
            </div>

            {/* Bottom Row: Remaining count & Preview button */}
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[10.5px] font-medium text-slate-400">
                {quota > interviewedCount ? `${quota - interviewedCount} remaining` : 'Target reached'}
              </span>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(true)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer active:scale-95 transition-all"
                title="Preview All Stakeholder Responses"
              >
                <Eye size={13} weight="bold" />
                <span>Preview</span>
              </button>
            </div>
          </div>
        )}

        {/* Members Assigned & Date */}
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 text-xs text-slate-400">
          <span className="flex items-center gap-1 text-[11px]">
            {task.isMeetingTask ? (
              <>
                <Clock size={12} weight="bold" className="text-slate-500" />
                <span>
                  {formatDate(task.startDate)}
                  {task.meetingData?.scheduledAt && (
                    <strong className="text-slate-600 font-semibold ml-1">
                      ({formatMeetingTime(task.meetingData.scheduledAt, task.meetingData.duration)})
                    </strong>
                  )}
                </span>
              </>
            ) : (
              <>
                <CalendarBlank size={12} />
                <span>
                  {formatDate(task.startDate)}
                  {task.endDate && ` → ${formatDate(task.endDate)}`}
                </span>
              </>
            )}
          </span>

          {task.assignedTo && task.assignedTo.length > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-slate-600">
              {task.assignedTo.length === 1 ? (
                <>
                  <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[9px] font-bold">
                    {task.assignedTo[0].name.charAt(0)}
                  </span>
                  <span>{task.assignedTo[0].name}</span>
                </>
              ) : (
                <>
                  <div className="flex -space-x-1.5">
                    {task.assignedTo.slice(0, 3).map((a, i) => (
                      <span
                        key={i}
                        className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 border border-white flex items-center justify-center text-[9px] font-bold"
                        title={a.name}
                      >
                        {a.name.charAt(0)}
                      </span>
                    ))}
                  </div>
                  <span>{task.assignedTo.length} people</span>
                </>
              )}
            </span>
          )}
        </div>

        {/* Survey actions - Flexible Submission: "Resume/Start Survey" & "Submit Survey" */}
        {task.isSurveyTask && !compact && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              href={surveyUrl}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold bg-[#1e3a8a] hover:bg-[#172554] active:bg-[#1e40af] text-white shadow-2xs hover:shadow-xs transition-all cursor-pointer text-center"
              title={isSurveyStarted ? "Resume Survey Interview" : "Start Survey Interview"}
            >
              <ClipboardText size={14} weight="bold" />
              <span>{isSurveyStarted ? 'Resume Survey' : 'Start Survey'}</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsHierarchySubmitModalOpen(true)}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 active:bg-emerald-200 shadow-2xs transition-all cursor-pointer text-center"
              title="Submit survey batch"
            >
              <CheckCircle size={14} weight="bold" />
              <span>Submit Survey</span>
            </button>
          </div>
        )}

        {/* Meeting actions - Join Meeting button using standard navy styling */}
        {task.isMeetingTask && task.meetingData && !compact && (
          <a
            href={task.meetingData.zoomJoinUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold bg-[#1e3a8a] hover:bg-[#172554] active:bg-[#1e40af] text-white shadow-2xs hover:shadow-xs transition-all cursor-pointer text-center"
          >
            <VideoCamera size={14} weight="bold" />
            <span>Join Meeting</span>
          </a>
        )}

        {/* Non-survey, non-meeting action - Update Status button appears where Start Survey appears */}
        {!task.isSurveyTask && !task.isMeetingTask && onStatusUpdate && !compact && (
          <button
            type="button"
            onClick={() => setIsStatusModalOpen(true)}
            className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 active:bg-indigo-200 shadow-2xs transition-all cursor-pointer"
            title="Update Task Status"
          >
            <ArrowsClockwise size={14} weight="bold" />
            <span>Update Status</span>
          </button>
        )}
      </div>

      {/* Status Update Popup Modal for Non-Survey Tasks */}
      {isStatusModalOpen && onStatusUpdate && !task.isSurveyTask && (
        <UpdateTaskStatusModal
          task={task}
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          onUpdateStatus={onStatusUpdate}
        />
      )}

      {/* Stable Portaled Survey Submission Confirmation Modal */}
      {mounted && isHierarchySubmitModalOpen && task.isSurveyTask && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="card p-5 sm:p-6 max-w-md w-full max-h-[90dvh] overflow-y-auto space-y-4 shadow-2xl bg-white rounded-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                  <CheckCircle size={20} weight="bold" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    Submit Survey Batch
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {task.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHierarchySubmitModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                aria-label="Close"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Quota & Stakeholders Interviewed Info */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Stakeholders Interviewed</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-black text-indigo-900">{interviewedCount}</span>
                  <span className="text-xs font-medium text-slate-400">/ {quota}</span>
                  <span className="text-xs font-bold text-indigo-600 ml-1">({quotaPercent}%)</span>
                </div>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all"
                  style={{ width: `${quotaPercent}%` }}
                />
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to finalize and submit this survey batch? All recorded participant responses will be submitted to leadership.
            </p>

            {/* Optional Field Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Field Notes / Observations (optional)
              </label>
              <textarea
                rows={2}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Add any overall field observations or notes..."
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsHierarchySubmitModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTaskSurveySubmit}
                disabled={isSubmittingFeedback}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer btn-press disabled:opacity-60"
              >
                {isSubmittingFeedback ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Submit Survey</span>
                    <Check size={15} weight="bold" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Stakeholder Responses Preview Modal */}
      <StakeholderResponsesPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        surveyTitle={task.name}
        questions={matchedSurvey?.questions || []}
        totalInterviewedCount={interviewedCount}
      />
    </div>
  );
}
