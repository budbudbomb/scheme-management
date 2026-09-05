'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn, taskStatusColor, taskStatusLabel, taskPriorityColor, taskPriorityLabel, formatDate } from '@/lib/utils/formatters';
import type { Task, TaskStatus } from '@/types/models';
import { MOCK_SURVEYS } from '@/lib/api/mockData';
import { CalendarBlank, User, ClipboardText, PencilSimple, Trash, ArrowRight, ArrowsClockwise, Users, CheckCircle, X } from '@phosphor-icons/react';
import UpdateTaskStatusModal from './UpdateTaskStatusModal';
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

  const [isHierarchySubmitModalOpen, setIsHierarchySubmitModalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [challengesFaced, setChallengesFaced] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [feedbackError, setFeedbackError] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const interviewedCount = matchedSurvey?.responsesCount ?? 0;
  const quota = matchedSurvey?.participantsRequired ?? 50;
  const quotaPercent = quota > 0 ? Math.min(100, Math.round((interviewedCount / quota) * 100)) : 0;

  const nextSupervisorInfo = {
    roleName: currentRole === 'intern' ? 'Fellow' : currentRole === 'fellow' ? 'Program Coordinator' : 'Senior & Chief Program Managers',
    personName: currentRole === 'intern' ? 'District Fellow (Vikram Singh)' : currentRole === 'fellow' ? 'Divisional PC (Anjali Verma)' : 'State Leadership (SPM & CPM)',
  };

  const handleConfirmTaskSurveySubmit = async () => {
    if (!feedbackText.trim()) {
      setFeedbackError(`Please share field observations & feedback for the ${nextSupervisorInfo.roleName}.`);
      return;
    }
    setFeedbackError('');
    setIsSubmittingFeedback(true);

    try {
      const activeSurveyId = surveyId || matchedSurvey?.id || 'survey-01';
      const currentUserRef = user
        ? { id: user.id, name: user.name, role: user.role }
        : { id: 'u-curr-01', name: 'Field Officer', role: currentRole };

      await surveysApi.submitHierarchySurvey(activeSurveyId, {
        submittedBy: currentUserRef,
        role: currentRole,
        feedbackText: feedbackText.trim(),
        challengesFaced: challengesFaced.trim() || undefined,
        recommendations: recommendations.trim() || undefined,
      });

      if (onStatusUpdate) {
        await onStatusUpdate(task.id, 'completed');
      }

      setIsHierarchySubmitModalOpen(false);
      toast.success(`Survey batch submitted to ${nextSupervisorInfo.roleName} with feedback!`);
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

          {/* Action icons (Edit, Delete) - Update Status is now at bottom of card */}
          <div className="flex items-center gap-1 shrink-0 -mt-0.5">
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
        </div>

        {/* Stakeholders Interviewed KPI Banner (Requirement 5) */}
        {task.isSurveyTask && !compact && (
          <div className="mt-3 p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Users size={14} weight="bold" className="text-indigo-600 shrink-0" />
                <span>Stakeholders Interviewed</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-black text-slate-900">{interviewedCount}</span>
                <span className="text-[10px] font-medium text-slate-400">/ {quota}</span>
                <span className="text-[10px] font-bold text-indigo-600 ml-1">({quotaPercent}%)</span>
              </div>
            </div>
            <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  quotaPercent >= 100 ? 'bg-emerald-600' : 'bg-indigo-600'
                )}
                style={{ width: `${quotaPercent}%` }}
              />
            </div>
          </div>
        )}

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

        {/* Survey actions - Flexible Submission: "Start Survey" (to add more) & "Submit Survey" (whenever over / completed) */}
        {task.isSurveyTask && !compact && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              href={surveyUrl}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold bg-[#1e3a8a] hover:bg-[#172554] active:bg-[#1e40af] text-white shadow-2xs hover:shadow-xs transition-all cursor-pointer text-center"
              title="Start Survey Interview"
            >
              <ClipboardText size={14} weight="bold" />
              <span>Start Survey</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsHierarchySubmitModalOpen(true)}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 active:bg-emerald-200 shadow-2xs transition-all cursor-pointer text-center"
              title="Submit survey batch and field feedback to supervisor"
            >
              <CheckCircle size={14} weight="bold" />
              <span>Submit Survey</span>
            </button>
          </div>
        )}

        {/* Non-survey action - Update Status button appears where Start Survey appears */}
        {!task.isSurveyTask && onStatusUpdate && !compact && (
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

      {/* Hierarchical Survey Submission & Feedback Modal for Survey Tasks */}
      {isHierarchySubmitModalOpen && task.isSurveyTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="card p-5 sm:p-7 max-w-lg w-full max-h-[88dvh] overflow-y-auto space-y-4 shadow-2xl bg-white rounded-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                  Hierarchy Submission
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                  Submit Survey: {task.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Submitting to: <strong className="text-slate-800">{nextSupervisorInfo.personName}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsHierarchySubmitModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Hierarchy Progress Strip */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-2">
                Approval Hierarchy
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 overflow-x-auto no-scrollbar">
                <span className={cn('px-2 py-0.5 rounded-md', currentRole === 'intern' ? 'bg-indigo-600 text-white' : 'bg-emerald-100 text-emerald-800')}>
                  Intern
                </span>
                <span className="text-slate-400 font-normal">→</span>
                <span className={cn('px-2 py-0.5 rounded-md', currentRole === 'fellow' ? 'bg-indigo-600 text-white' : currentRole === 'pc' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700')}>
                  Fellow
                </span>
                <span className="text-slate-400 font-normal">→</span>
                <span className={cn('px-2 py-0.5 rounded-md', currentRole === 'pc' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700')}>
                  Program Coordinator
                </span>
                <span className="text-slate-400 font-normal">→</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                  SPM / CPM
                </span>
              </div>
            </div>

            {/* Quota & Stakeholders Interviewed KPI */}
            <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-700">Stakeholders Interviewed</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Flexible submission: You can submit whenever fieldwork concludes
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-indigo-900">{interviewedCount}</span>
                <span className="text-xs text-slate-400 font-medium"> / {quota}</span>
              </div>
            </div>

            {/* Field Feedback Inputs */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Field Observations &amp; Feedback for {nextSupervisorInfo.roleName} <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={feedbackText}
                  onChange={(e) => {
                    setFeedbackText(e.target.value);
                    if (feedbackError) setFeedbackError('');
                  }}
                  placeholder="Summarize key takeaways, community sentiment, scheme reach, and overall observations from the field..."
                  className={cn(
                    'w-full p-3 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all leading-relaxed',
                    feedbackError ? 'border-rose-400 ring-1 ring-rose-200 bg-rose-50/20' : 'border-slate-200 bg-white'
                  )}
                />
                {feedbackError && <p className="text-[11px] text-rose-500 font-semibold mt-1">{feedbackError}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Key Challenges Faced (optional)
                </label>
                <input
                  type="text"
                  value={challengesFaced}
                  onChange={(e) => setChallengesFaced(e.target.value)}
                  placeholder="e.g. Medicine stockouts at PHC, transport delays, connectivity issues..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recommendations for Program Leadership (optional)
                </label>
                <input
                  type="text"
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  placeholder="e.g. Conduct monthly review with BDO, supply additional testing kits..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsHierarchySubmitModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTaskSurveySubmit}
                disabled={isSubmittingFeedback}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer btn-press disabled:opacity-60"
              >
                {isSubmittingFeedback ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Submit to {nextSupervisorInfo.roleName}</span>
                    <ArrowRight size={14} weight="bold" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
