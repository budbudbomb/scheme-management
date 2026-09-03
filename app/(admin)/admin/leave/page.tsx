'use client';

import { useState, useEffect, useCallback } from 'react';
import { leaveApi } from '@/lib/api/leave';
import type { LeaveApplication } from '@/types/models';
import { cn, leaveStatusColor, leaveStatusLabel, formatDate } from '@/lib/utils/formatters';
import { SkeletonTable } from '@/components/shared/SkeletonCard';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import { ClipboardText } from '@phosphor-icons/react';

export default function AdminLeavePage() {
  const [data, setData] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await leaveApi.list({ status: statusFilter as LeaveApplication['status'] || undefined });
      setData(res.items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load leave applications');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Leave Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">Read-only view of all leave applications state-wide</p>
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="text-sm rounded-[var(--radius)] border border-slate-200 bg-white py-2.5 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">All Status</option>
          <option value="applied">Applied</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? <SkeletonTable rows={8} /> : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !data.length ? (
        <div className="card"><EmptyState icon={ClipboardText} title="No leave applications" description="Leave applications from Fellows and Interns will appear here." /></div>
      ) : (
        <>
          {/* Desktop */}
          <div className="card overflow-hidden hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {['Applicant', 'Role', 'Leave Type', 'Duration', 'Reason', 'Status', 'Applied'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.map(app => (
                  <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-900">{app.applicant.name}</td>
                    <td className="px-5 py-3.5 text-slate-500 capitalize">{app.applicant.role}</td>
                    <td className="px-5 py-3.5 text-slate-500 capitalize">{app.leaveType}</td>
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">{formatDate(app.startDate)} — {formatDate(app.endDate)}</td>
                    <td className="px-5 py-3.5 text-slate-500 max-w-[200px] truncate">{app.reason}</td>
                    <td className="px-5 py-3.5">
                      <span className={cn('badge', leaveStatusColor(app.status))}>{leaveStatusLabel(app.status)}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{formatDate(app.appliedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {data.map(app => (
              <div key={app.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-slate-900 text-sm">{app.applicant.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5 capitalize">{app.applicant.role} · {app.leaveType} leave</div>
                  </div>
                  <span className={cn('badge', leaveStatusColor(app.status))}>{leaveStatusLabel(app.status)}</span>
                </div>
                <div className="text-xs text-slate-500 mt-2">{formatDate(app.startDate)} — {formatDate(app.endDate)}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
