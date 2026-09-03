'use client';

import { useState, useEffect, useCallback } from 'react';
import { exitApi } from '@/lib/api/exit';
import type { ExitRequest } from '@/types/models';
import { cn, exitStatusColor, exitStatusLabel, formatDate } from '@/lib/utils/formatters';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import ConfirmModal from '@/components/shared/ConfirmModal';
import { ArrowCircleUpRight, DownloadSimple, Warning } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { downloadBlob } from '@/lib/utils/formatters';

export default function FellowExitPage() {
  const [exit, setExit] = useState<ExitRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applying, setApplying] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await exitApi.list();
      // Find my own exit request
      setExit(res.items[0] ?? null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const applyForExit = async () => {
    setApplying(true);
    try {
      await exitApi.apply({ reason: 'Completed program duration' });
      toast.success('Exit application submitted. Your Program Coordinator has been notified.');
      setApplyOpen(false);
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to apply for exit');
    } finally {
      setApplying(false);
    }
  };

  const downloadCert = async () => {
    if (!exit?.id) return;
    try {
      const blob = await exitApi.downloadCertificate(exit.id);
      downloadBlob(blob as Blob, `completion-certificate.pdf`);
    } catch {
      toast.error('Certificate not available yet');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Program Exit</h1>
        <p className="text-sm text-slate-500 mt-0.5">Apply to exit the CMYPDP program and download your completion certificate</p>
      </div>

      {loading ? <SkeletonCard /> : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : exit ? (
        /* Existing exit request */
        <div className="card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-slate-900">Exit Application</div>
              <div className="text-xs text-slate-500 mt-0.5">Applied {formatDate(exit.appliedAt)}</div>
            </div>
            <span className={cn('badge', exitStatusColor(exit.status))}>{exitStatusLabel(exit.status)}</span>
          </div>

          {exit.incompleteTasks > 0 && exit.status === 'pending' && (
            <div className="mt-4 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-[var(--radius)] px-4 py-3">
              <Warning size={16} className="text-amber-600 shrink-0 mt-0.5" weight="fill" />
              <p className="text-sm text-amber-700">
                You have <strong>{exit.incompleteTasks} incomplete tasks</strong>. Your exit requires task completion or PC/Admin force-approval.
              </p>
            </div>
          )}

          {exit.status === 'approved' && (
            <button
              onClick={downloadCert}
              className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius)] text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 btn-press"
            >
              <DownloadSimple size={16} weight="bold" />
              Download Completion Certificate
            </button>
          )}

          {exit.approverComment && (
            <div className="mt-3 bg-slate-50 rounded-[var(--radius-sm)] px-3 py-2 text-xs text-slate-600">
              <strong>Approver comment:</strong> {exit.approverComment}
            </div>
          )}
        </div>
      ) : (
        /* No exit request yet */
        <div className="space-y-4">
          {/* Info card */}
          <div className="card p-5">
            <h2 className="font-semibold text-slate-900 mb-3">Before You Apply</h2>
            <ul className="space-y-2 text-sm text-slate-600">
              {[
                'All assigned tasks must be marked as completed before exit is approved.',
                'Your Program Coordinator reviews and approves exit requests.',
                'A completion certificate will be generated upon successful exit.',
                'If you have pending tasks, your PC or Admin can force-approve the exit.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold shrink-0">·</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <button
            id="apply-exit-btn"
            onClick={() => setApplyOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-[var(--radius)] text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 btn-press"
          >
            <ArrowCircleUpRight size={18} weight="bold" />
            Apply for Program Exit
          </button>
        </div>
      )}

      <ConfirmModal
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        onConfirm={applyForExit}
        title="Apply for Program Exit?"
        description="This will notify your Program Coordinator to review your exit application. You can only submit one exit application. Ensure all your tasks are completed."
        confirmLabel="Submit Exit Request"
        variant="warning"
        loading={applying}
      />
    </div>
  );
}
