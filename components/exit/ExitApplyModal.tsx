'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, ArrowCircleUpRight, X, ShieldWarning } from '@phosphor-icons/react';
import { exitApi } from '@/lib/api/exit';
import { toast } from 'sonner';
import type { AuthUser, ExitPerformanceAudit } from '@/types/models';

interface ExitApplyModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUser: AuthUser;
  // Optional task metrics if known, otherwise sensible realistic defaults
  tasksTotal?: number;
  tasksCompleted?: number;
}

export default function ExitApplyModal({
  open,
  onClose,
  onSuccess,
  currentUser,
  tasksTotal = 15,
  tasksCompleted = 13,
}: ExitApplyModalProps) {
  const [mounted, setMounted] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasAcknowledgedWarning, setHasAcknowledgedWarning] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  const incompleteTasks = Math.max(0, tasksTotal - tasksCompleted);
  const isMidwayExit = incompleteTasks > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Please specify a reason for applying to exit.');
      return;
    }

    setLoading(true);
    try {
      const audit: ExitPerformanceAudit = {
        tasksTotal,
        tasksCompleted,
        tasksPending: incompleteTasks,
        surveysConducted: 28,
      };

      await exitApi.apply({
        reason,
        applicant: {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
        },
        incompleteTasks,
        performanceAudit: audit,
      });

      toast.success(
        currentUser.role === 'fellow'
          ? 'Exit application submitted. Your Program Coordinator has been notified.'
          : 'Exit application submitted. Program Manager (HR) will review your request.'
      );
      setReason('');
      setHasAcknowledgedWarning(false);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit exit application.');
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88dvh] sm:max-h-[85vh]">
        {/* Fixed Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-3.5 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <ArrowCircleUpRight size={18} weight="bold" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">Apply for Program Exit</h2>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">CMYP Tenure Completion & Handover</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Container with scrollable body and fixed footer */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Scrollable Content */}
          <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
            {/* Midway Exit Warning Pop-up Card */}
            {isMidwayExit ? (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-3.5 sm:p-4 shadow-xs">
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-amber-500 text-white rounded-lg sm:rounded-xl shadow-xs shrink-0 mt-0.5">
                    <ShieldWarning size={20} weight="fill" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-amber-950 leading-snug">
                      Are you sure you want to exit because no &ldquo;Certificate of Completion&rdquo; will be issued for you?
                    </h3>
                    <p className="text-[11px] sm:text-xs text-amber-900/90 mt-1 leading-relaxed">
                      You are applying for exit midway before completing all your deliverables. A Certificate of Completion is only awarded when 100% of assigned tasks and milestones are fulfilled.
                    </p>
                  </div>
                </div>

                {/* Task metrics breakdown */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-amber-200/80 text-center">
                  <div className="bg-white/90 rounded-lg p-2 border border-amber-200">
                    <div className="text-[10px] sm:text-xs text-slate-500 font-medium">Tasks Assigned</div>
                    <div className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">{tasksTotal}</div>
                  </div>
                  <div className="bg-emerald-50/90 rounded-lg p-2 border border-emerald-200">
                    <div className="text-[10px] sm:text-xs text-emerald-700 font-medium">Completed</div>
                    <div className="text-sm sm:text-base font-bold text-emerald-700 mt-0.5">{tasksCompleted}</div>
                  </div>
                  <div className="bg-rose-50/90 rounded-lg p-2 border border-rose-200">
                    <div className="text-[10px] sm:text-xs text-rose-700 font-medium">Incomplete</div>
                    <div className="text-sm sm:text-base font-bold text-rose-700 mt-0.5">{incompleteTasks}</div>
                  </div>
                </div>

                {/* Acknowledge Checkbox */}
                <label className="flex items-start gap-2.5 mt-3 pt-2 text-[11px] sm:text-xs text-amber-950 font-medium cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasAcknowledgedWarning}
                    onChange={(e) => setHasAcknowledgedWarning(e.target.checked)}
                    className="mt-0.5 rounded border-amber-400 text-[#162F5E] focus:ring-amber-400 cursor-pointer"
                  />
                  <span>
                    I understand that by proceeding now, I will forfeit the official <strong>Certificate of Completion</strong>.
                  </span>
                </label>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 sm:p-4 flex items-start gap-2.5 sm:gap-3">
                <CheckCircle size={18} className="text-emerald-600 shrink-0 mt-0.5" weight="fill" />
                <div className="text-[11px] sm:text-xs text-emerald-800 leading-relaxed">
                  <strong>All {tasksTotal} assigned tasks completed!</strong> You meet the primary criteria for receiving the Certificate of Completion upon review and approval.
                </div>
              </div>
            )}

            {/* Reason Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Program Exit <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Completed program duration / Higher education / Other commitments..."
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl p-2.5 sm:p-3 focus:outline-none focus:ring-2 focus:ring-[#162F5E] focus:border-[#162F5E] placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Sticky Actions Footer */}
          <div className="flex items-center justify-end gap-2.5 px-4 sm:px-6 py-3 bg-slate-50/90 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 border border-slate-200 sm:border-transparent transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (isMidwayExit && !hasAcknowledgedWarning)}
              className="flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-semibold bg-[#162F5E] text-white hover:bg-[#112447] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
            >
              {loading ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <ArrowCircleUpRight size={16} weight="bold" />
                  <span>Submit Exit Application</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
