'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, XCircle, ChatText, ArrowBendUpRight } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { complaintApi } from '@/lib/api/complaints';
import { useAuth } from '@/lib/auth/context';
import type { Complaint } from '@/types/models';
import { roleLabel } from '@/lib/utils/formatters';

interface ReviewComplaintModalProps {
  complaint: Complaint | null;
  action: 'resolve' | 'reject' | 'forward' | null;
  reviewerRole: 'fellow' | 'pc' | 'spm_cpm';
  onClose: () => void;
  onSuccess: (updated: Complaint) => void;
}

export default function ReviewComplaintModal({
  complaint,
  action,
  reviewerRole,
  onClose,
  onSuccess,
}: ReviewComplaintModalProps) {
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background scroll when open
  useEffect(() => {
    if (!complaint || !action) return;
    const origOverflow = document.body.style.overflow;
    const origTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    const mainEl = document.querySelector('main');
    const origMainOverflow = mainEl ? mainEl.style.overflow : '';
    if (mainEl) mainEl.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = origOverflow;
      document.body.style.touchAction = origTouchAction;
      if (mainEl) mainEl.style.overflow = origMainOverflow;
    };
  }, [complaint, action]);

  if (!complaint || !action || !mounted) return null;

  const isResolve = action === 'resolve';
  const isReject = action === 'reject';
  const isForward = action === 'forward';

  const nextTargetLabel =
    reviewerRole === 'fellow'
      ? 'Program Coordinator (PC)'
      : reviewerRole === 'pc'
      ? 'Senior Program Manager (SPM / State PMU)'
      : 'State Grievance Committee';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isResolve && !comment.trim()) {
      toast.error(isForward ? 'Please specify the reason for forwarding up the hierarchy' : 'Please specify the reason for rejection');
      return;
    }

    setLoading(true);
    try {
      const reviewer = {
        name: user?.name ?? (reviewerRole === 'fellow' ? 'Assigned Fellow' : reviewerRole === 'pc' ? 'Program Coordinator' : 'Chief Program Manager'),
        role: reviewerRole,
      };

      let updated: Complaint;
      if (isResolve) {
        updated = await complaintApi.resolve(complaint.id, comment.trim() || undefined, reviewer);
        toast.success(`Complaint ${complaint.ticketNumber} marked as Resolved`);
      } else if (isReject) {
        updated = await complaintApi.reject(complaint.id, comment.trim(), reviewer);
        toast.success(`Complaint ${complaint.ticketNumber} has been rejected`);
      } else {
        updated = await complaintApi.forward(complaint.id, comment.trim(), reviewer);
        toast.success(`Complaint ${complaint.ticketNumber} escalated to ${nextTargetLabel}`);
      }

      onSuccess(updated);
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  const lastEsc = complaint.escalations && complaint.escalations.length > 0 ? complaint.escalations[complaint.escalations.length - 1] : null;

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transition-all transform animate-scale-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isResolve
                ? 'bg-emerald-500/10 text-emerald-600'
                : isReject
                ? 'bg-rose-500/10 text-rose-600'
                : 'bg-indigo-500/10 text-indigo-600'
            }`}>
              {isResolve && <CheckCircle size={20} weight="duotone" />}
              {isReject && <XCircle size={20} weight="duotone" />}
              {isForward && <ArrowBendUpRight size={20} weight="bold" />}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                {isResolve && 'Resolve Complaint'}
                {isReject && 'Reject Complaint'}
                {isForward && `Forward to ${nextTargetLabel}`}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-slate-500 font-mono">{complaint.ticketNumber}</p>
                {complaint.isEscalated && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                    <ArrowBendUpRight size={10} weight="bold" /> Forwarded
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
            <p className="font-semibold text-slate-900 mb-0.5">{complaint.subject}</p>
            <p className="text-slate-500">
              Submitted by <span className="font-medium text-slate-700">{complaint.applicantName}</span> ({complaint.assignedLocation})
            </p>
          </div>

          {/* Forwarded Callout Banner in Review Modal */}
          {complaint.isEscalated && (
            <div className="p-3 rounded-xl bg-purple-50/90 border border-purple-200 text-xs text-purple-950 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-bold text-purple-900">
                  <ArrowBendUpRight size={15} weight="bold" className="text-purple-600 shrink-0" />
                  <span>Forwarded Grievance</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-200/70 text-purple-800">
                  Escalated
                </span>
              </div>
              {lastEsc ? (
                <div className="text-purple-900 text-xs space-y-1">
                  <p>
                    Forwarded by <strong>{lastEsc.forwardedBy}</strong> ({roleLabel(lastEsc.forwarderRole)}):
                  </p>
                  <p className="bg-white/80 p-2 rounded-lg border border-purple-200/60 text-purple-800 italic">
                    &ldquo;{lastEsc.reason}&rdquo;
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-purple-800">
                  This complaint was forwarded up the administrative hierarchy for higher review.
                </p>
              )}
            </div>
          )}

          {isForward && (
            <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/80 text-xs text-indigo-900 flex items-start gap-2">
              <ArrowBendUpRight size={18} className="text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Hierarchy Escalation:</span> If this grievance cannot be resolved at your level, it will be reassigned up the management hierarchy to <strong>{nextTargetLabel}</strong> for resolution.
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {isResolve && 'Resolution Remarks / Corrective Actions'}
              {isReject && 'Reason for Rejection *'}
              {isForward && 'Reason for Forwarding / Escalation Justification *'}
            </label>
            <div className="relative">
              <ChatText size={16} className="absolute left-3 top-3 text-slate-400" />
              <textarea
                rows={3}
                required={!isResolve}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  isResolve
                    ? 'Explain the steps taken to address this grievance (e.g. reimbursed allowance, replaced SIM card)...'
                    : isReject
                    ? 'Provide the applicant with clear feedback on why this complaint is not actionable or rejected...'
                    : 'Explain why this complaint requires higher-level action (e.g. budget allocation required, district administration coordination needed)...'
                }
                className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
            {!isResolve && (
              <p className="text-[11px] text-slate-500 mt-1">
                {isReject
                  ? 'This explanation will be permanently visible to the applicant.'
                  : 'This escalation note will be reviewed by the next authority in the hierarchy.'}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl text-white shadow-sm transition-colors disabled:opacity-50 cursor-pointer ${
                isResolve
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : isReject
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {loading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {isResolve && 'Confirm Resolution'}
              {isReject && 'Confirm Rejection'}
              {isForward && 'Forward Up Hierarchy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
