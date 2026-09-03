'use client';

import { useState, useEffect, useCallback } from 'react';
import { leaveApi } from '@/lib/api/leave';
import type { LeaveApplication } from '@/types/models';
import { cn, leaveStatusColor, leaveStatusLabel, formatDate } from '@/lib/utils/formatters';
import { SkeletonTable } from '@/components/shared/SkeletonCard';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import ApproveRejectAction from '@/components/shared/ApproveRejectAction';
import { ShieldCheck } from '@phosphor-icons/react';

export default function PCLeavePage() {
  const [data, setData] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('applied');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      // PC sees fellow leave requests in their division
      const res = await leaveApi.list({ status: statusFilter as LeaveApplication['status'] });
      setData(res.items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Leave Approvals</h1>
          <p className="text-sm text-slate-500 mt-0.5">Review and approve/reject Fellow leave requests in your division</p>
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="text-sm rounded-[var(--radius)] border border-slate-200 bg-white py-2.5 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="applied">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? <SkeletonTable rows={6} /> : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !data.length ? (
        <div className="card">
          <EmptyState icon={ShieldCheck} title="No leave applications" description={statusFilter === 'applied' ? 'No pending leave requests from Fellows in your division.' : `No ${statusFilter} leave applications.`} />
        </div>
      ) : (
        <div className="space-y-3">
          {data.map(app => (
            <div key={app.id} className="card p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-900 text-sm">{app.applicant.name}</span>
                    <span className="badge bg-slate-100 text-slate-600 border-slate-200">Fellow</span>
                    <span className={cn('badge', leaveStatusColor(app.status))}>{leaveStatusLabel(app.status)}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1.5 space-y-0.5">
                    <div><strong>Type:</strong> {app.leaveType} leave</div>
                    <div><strong>Duration:</strong> {formatDate(app.startDate)} — {formatDate(app.endDate)}</div>
                    <div><strong>Reason:</strong> {app.reason}</div>
                  </div>
                </div>
                {app.status === 'applied' && (
                  <ApproveRejectAction
                    id={app.id}
                    entityLabel="leave request"
                    onApprove={(id, comment) => leaveApi.approve(id, comment).then(() => load())}
                    onReject={(id, comment) => leaveApi.reject(id, comment).then(() => load())}
                  />
                )}
                {app.approverComment && (
                  <div className="w-full mt-2 text-xs text-slate-500 bg-slate-50 rounded-[var(--radius-sm)] px-3 py-2">
                    <strong>Comment:</strong> {app.approverComment}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
