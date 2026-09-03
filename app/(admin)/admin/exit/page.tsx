'use client';

import { useState, useEffect, useCallback } from 'react';
import { exitApi } from '@/lib/api/exit';
import type { ExitRequest } from '@/types/models';
import { cn, exitStatusColor, exitStatusLabel, formatDate } from '@/lib/utils/formatters';
import { SkeletonTable } from '@/components/shared/SkeletonCard';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import ConfirmModal from '@/components/shared/ConfirmModal';
import { ArrowCircleUpRight, Lightning, DownloadSimple } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { downloadBlob } from '@/lib/utils/formatters';

export default function AdminExitPage() {
  const [data, setData] = useState<ExitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forceApproveId, setForceApproveId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await exitApi.list();
      setData(res.items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load exit requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleForceApprove = async () => {
    if (!forceApproveId) return;
    setActionLoading(true);
    try {
      await exitApi.forceApprove(forceApproveId, 'Force approved by Admin');
      toast.success('Exit request force-approved');
      setForceApproveId(null);
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to force approve');
    } finally {
      setActionLoading(false);
    }
  };

  const downloadCert = async (id: string) => {
    try {
      const blob = await exitApi.downloadCertificate(id);
      downloadBlob(blob as Blob, `completion-certificate-${id}.pdf`);
    } catch {
      toast.error('Failed to download certificate');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Exit Management</h1>
        <p className="text-sm text-slate-500 mt-0.5">State-wide exit requests with force-approve capability</p>
      </div>

      {loading ? <SkeletonTable rows={6} /> : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !data.length ? (
        <div className="card"><EmptyState icon={ArrowCircleUpRight} title="No exit requests" description="Exit requests from Fellows and Interns will appear here." /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm hidden md:table">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {['Applicant', 'Role', 'Incomplete Tasks', 'Status', 'Applied', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.map(req => (
                <tr key={req.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3.5 font-medium text-slate-900">{req.applicant.name}</td>
                  <td className="px-5 py-3.5 text-slate-500 capitalize">{req.applicant.role}</td>
                  <td className="px-5 py-3.5">
                    <span className={cn('badge', req.incompleteTasks > 0 ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200')}>
                      {req.incompleteTasks} pending
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={cn('badge', exitStatusColor(req.status))}>{exitStatusLabel(req.status)}</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{formatDate(req.appliedAt)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {req.status === 'pending' && (
                        <button
                          id={`force-approve-${req.id}`}
                          onClick={() => setForceApproveId(req.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 btn-press"
                        >
                          <Lightning size={12} weight="fill" />
                          Force Approve
                        </button>
                      )}
                      {req.certificateUrl && (
                        <button
                          onClick={() => downloadCert(req.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 btn-press"
                        >
                          <DownloadSimple size={12} weight="bold" />
                          Certificate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile */}
          <div className="divide-y divide-slate-100 md:hidden">
            {data.map(req => (
              <div key={req.id} className="p-4">
                <div className="flex justify-between gap-2">
                  <div className="font-medium text-slate-900 text-sm">{req.applicant.name}</div>
                  <span className={cn('badge', exitStatusColor(req.status))}>{exitStatusLabel(req.status)}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">{req.incompleteTasks} incomplete tasks · {formatDate(req.appliedAt)}</div>
                {req.status === 'pending' && (
                  <button
                    onClick={() => setForceApproveId(req.id)}
                    className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium bg-amber-100 text-amber-700 btn-press"
                  >
                    <Lightning size={12} weight="fill" /> Force Approve
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!forceApproveId}
        onClose={() => setForceApproveId(null)}
        onConfirm={handleForceApprove}
        title="Force approve exit request?"
        description="This will override pending tasks and approve the exit immediately. A completion certificate will be generated. This action cannot be undone."
        confirmLabel="Force Approve"
        variant="warning"
        loading={actionLoading}
      />
    </div>
  );
}
