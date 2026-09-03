'use client';

import { useEffect, useState } from 'react';
import { attendanceApi } from '@/lib/api/attendance';
import type { AttendanceRecord } from '@/types/models';
import { cn, formatDate, formatMonth } from '@/lib/utils/formatters';
import { SkeletonTable } from '@/components/shared/SkeletonCard';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import { Fingerprint, DownloadSimple } from '@phosphor-icons/react';
import { downloadBlob } from '@/lib/utils/formatters';
import { toast } from 'sonner';

export default function PCAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const now = new Date();

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await attendanceApi.list();
      setRecords(res.items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await attendanceApi.exportReport({ month: now.getMonth() + 1, year: now.getFullYear(), format: 'csv' });
      downloadBlob(blob as Blob, `attendance-${now.getFullYear()}-${now.getMonth() + 1}.csv`);
      toast.success('Report exported');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Attendance Records</h1>
          <p className="text-sm text-slate-500 mt-0.5">{formatMonth(now.getMonth() + 1, now.getFullYear())} — Your division</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius)] text-sm font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 btn-press disabled:opacity-60"
        >
          {exporting ? <span className="w-4 h-4 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" /> : <DownloadSimple size={16} />}
          Export CSV
        </button>
      </div>

      {loading ? <SkeletonTable rows={8} /> : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !records.length ? (
        <div className="card"><EmptyState icon={Fingerprint} title="No records" description="Attendance records from Fellows in your division will appear here." /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm hidden md:table">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {['Employee', 'District', 'Date', 'Time', 'Status'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {records.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3.5 font-medium text-slate-900">{r.userName}</td>
                  <td className="px-5 py-3.5 text-slate-500">{r.district?.name ?? '—'}</td>
                  <td className="px-5 py-3.5 text-slate-500">{formatDate(r.date)}</td>
                  <td className="px-5 py-3.5 text-slate-500">{r.markedAt}</td>
                  <td className="px-5 py-3.5">
                    <span className={cn('badge', r.status === 'present' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200')}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="divide-y divide-slate-100 md:hidden">
            {records.map(r => (
              <div key={r.id} className="p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-slate-900 text-sm">{r.userName}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{formatDate(r.date)}</div>
                </div>
                <span className={cn('badge', r.status === 'present' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200')}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
