'use client';

import { useState, useEffect, useCallback } from 'react';
import { exitApi } from '@/lib/api/exit';
import type { ExitRequest } from '@/types/models';
import { cn, exitStatusColor, exitStatusLabel, formatDate } from '@/lib/utils/formatters';
import { SkeletonTable } from '@/components/shared/SkeletonCard';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import ApproveRejectAction from '@/components/shared/ApproveRejectAction';
import { ArrowCircleUpRight, Warning } from '@phosphor-icons/react';

export default function PCExitPage() {
  const [data, setData] = useState<ExitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await exitApi.list();
      setData(res.items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Exit Approvals</h1>
        <p className="text-sm text-slate-500 mt-0.5">Review and approve exit requests from Fellows in your division</p>
      </div>

      {loading ? <SkeletonTable rows={5} /> : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !data.length ? (
        <div className="card"><EmptyState icon={ArrowCircleUpRight} title="No exit requests" description="Exit applications from Fellows in your division will appear here." /></div>
      ) : (
        <div className="space-y-3">
          {data.map(req => (
            <div key={req.id} className="card p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-900 text-sm">{req.applicant.name}</span>
                    <span className="badge bg-slate-100 text-slate-600 border-slate-200">Fellow</span>
                    <span className={cn('badge', exitStatusColor(req.status))}>{exitStatusLabel(req.status)}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1.5">
                    Applied {formatDate(req.appliedAt)} · {req.incompleteTasks} incomplete tasks
                  </div>
                  {req.incompleteTasks > 0 && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-[var(--radius-sm)] px-3 py-1.5">
                      <Warning size={12} weight="fill" />
                      Applicant has {req.incompleteTasks} incomplete task(s). Approval will mark them as waived.
                    </div>
                  )}
                </div>
                {req.status === 'pending' && (
                  <ApproveRejectAction
                    id={req.id}
                    entityLabel="exit request"
                    onApprove={(id, comment) => exitApi.approve(id, comment).then(() => load())}
                    onReject={(id, comment) => exitApi.reject(id, comment).then(() => load())}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
