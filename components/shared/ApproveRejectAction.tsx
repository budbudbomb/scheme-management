'use client';

import { useState } from 'react';
import { Check, X, ChatText } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/formatters';
import ConfirmModal from './ConfirmModal';

interface ApproveRejectActionProps {
  id: string;
  entityLabel?: string; // e.g. "leave request", "exit request"
  requireComment?: boolean;
  onApprove: (id: string, comment?: string) => Promise<void>;
  onReject: (id: string, comment: string) => Promise<void>;
  disabled?: boolean;
}

export default function ApproveRejectAction({
  id,
  entityLabel = 'request',
  requireComment = false,
  onApprove,
  onReject,
  disabled = false,
}: ApproveRejectActionProps) {
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await onApprove(id, comment || undefined);
      toast.success(`${entityLabel} approved`);
      setApproveOpen(false);
      setComment('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    setLoading(true);
    try {
      await onReject(id, comment);
      toast.success(`${entityLabel} rejected`);
      setRejectOpen(false);
      setComment('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Approve button */}
      <button
        id={`approve-${id}`}
        onClick={() => setApproveOpen(true)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium',
          'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
          'transition-colors btn-press disabled:opacity-40'
        )}
      >
        <Check size={12} weight="bold" />
        Approve
      </button>

      {/* Reject button */}
      <button
        id={`reject-${id}`}
        onClick={() => setRejectOpen(true)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium',
          'bg-rose-100 text-rose-700 hover:bg-rose-200',
          'transition-colors btn-press disabled:opacity-40'
        )}
      >
        <X size={12} weight="bold" />
        Reject
      </button>

      {/* Approve confirm */}
      <ConfirmModal
        open={approveOpen}
        onClose={() => { setApproveOpen(false); setComment(''); }}
        onConfirm={handleApprove}
        title={`Approve ${entityLabel}?`}
        description={`This action will approve the ${entityLabel} and notify the applicant.`}
        confirmLabel="Approve"
        variant="default"
        loading={loading}
      />

      {/* Reject confirm — includes comment field */}
      {rejectOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[2px]"
            onClick={() => { setRejectOpen(false); setComment(''); }}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100vw-2rem)] max-w-[440px] card p-6 shadow-[var(--shadow-popup)]"
          >
            <h2 className="font-semibold text-slate-900 mb-1">Reject {entityLabel}?</h2>
            <p className="text-sm text-slate-500 mb-4">
              Please provide a reason for rejection — this will be shared with the applicant.
            </p>

            <label htmlFor={`reject-comment-${id}`} className="block text-xs font-medium text-slate-700 mb-1.5">
              Reason for rejection <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <ChatText size={16} className="absolute left-3 top-3 text-slate-400" />
              <textarea
                id={`reject-comment-${id}`}
                rows={3}
                placeholder="Enter reason..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className={cn(
                  'w-full pl-9 pr-3 py-2.5 text-sm rounded-[var(--radius)] border',
                  'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400',
                  'focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400',
                  'resize-none'
                )}
              />
            </div>

            <div className="flex gap-3 mt-5 justify-end">
              <button
                onClick={() => { setRejectOpen(false); setComment(''); }}
                className="px-4 py-2 rounded-[var(--radius)] text-sm font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 btn-press"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={loading || !comment.trim()}
                className="px-4 py-2 rounded-[var(--radius)] text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white btn-press disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Reject
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
