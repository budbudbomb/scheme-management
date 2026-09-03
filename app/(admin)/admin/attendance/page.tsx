'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { attendanceApi } from '@/lib/api/attendance';
import { usersApi } from '@/lib/api/users';
import type { AttendanceRecord, Division } from '@/types/models';
import { cn, formatDate } from '@/lib/utils/formatters';
import { SkeletonTable } from '@/components/shared/SkeletonCard';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import { DownloadSimple, Fingerprint } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { downloadBlob } from '@/lib/utils/formatters';

export default function AdminAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [divisionId, setDivisionId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await attendanceApi.list({
        divisionId: divisionId || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setRecords(res.items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, [divisionId, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    usersApi.getDivisions().then(setDivisions).catch(console.error);
  }, []);

  const handleExport = async (format: 'csv' | 'pdf') => {
    const now = new Date();
    setExporting(true);
    try {
      const blob = await attendanceApi.exportReport({
        divisionId: divisionId || undefined,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        format,
      });
      downloadBlob(blob as Blob, `attendance-report-${now.getFullYear()}-${now.getMonth() + 1}.${format}`);
      toast.success('Report exported successfully');
    } catch {
      toast.error('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Attendance Records</h1>
          <p className="text-sm text-slate-500 mt-0.5">State-wide attendance with export for payroll</p>
        </div>

        {/* Export dropdown */}
        <div className="relative group">
          <button
            id="export-attendance-btn"
            disabled={exporting}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius)] text-sm font-medium',
              'border border-slate-200 text-slate-700 hover:bg-slate-50 btn-press',
              'disabled:opacity-60'
            )}
          >
            {exporting ? <span className="w-4 h-4 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" /> : <DownloadSimple size={16} />}
            Export Report
          </button>
          <div className="absolute right-0 top-full mt-1 w-36 card shadow-[var(--shadow-popup)] hidden group-hover:block z-20">
            {(['csv', 'pdf'] as const).map(f => (
              <button
                key={f}
                onClick={() => handleExport(f)}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 first:rounded-t-[inherit] last:rounded-b-[inherit]"
              >
                Export as {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={divisionId}
          onChange={e => setDivisionId(e.target.value)}
          className="text-sm rounded-[var(--radius)] border border-slate-200 bg-white py-2.5 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">All Divisions</option>
          {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="text-sm rounded-[var(--radius)] border border-slate-200 bg-white py-2.5 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          <span className="text-slate-400 text-sm">to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="text-sm rounded-[var(--radius)] border border-slate-200 bg-white py-2.5 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
      </div>

      {loading ? <SkeletonTable rows={8} /> : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !records.length ? (
        <div className="card"><EmptyState icon={Fingerprint} title="No attendance records" description="Attendance records will appear here after Fellows and Interns mark their attendance." /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm hidden md:table">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {['Employee', 'District', 'Block', 'Date', 'Marked At', 'Status'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {records.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3.5 font-medium text-slate-900">{r.userName}</td>
                  <td className="px-5 py-3.5 text-slate-500">{r.district?.name ?? '—'}</td>
                  <td className="px-5 py-3.5 text-slate-500">{r.block?.name ?? '—'}</td>
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

          {/* Mobile */}
          <div className="divide-y divide-slate-100 md:hidden">
            {records.map(r => (
              <div key={r.id} className="p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-slate-900 text-sm">{r.userName}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{formatDate(r.date)} · {r.district?.name}</div>
                </div>
                <span className={cn('badge shrink-0', r.status === 'present' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200')}>
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
