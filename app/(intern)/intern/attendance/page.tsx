'use client';

import GPSAttendanceWidget from '@/components/attendance/GPSAttendanceWidget';
import { useEffect, useState, useCallback } from 'react';
import { attendanceApi } from '@/lib/api/attendance';
import type { AttendanceRecord } from '@/types/models';
import { cn, formatDate, formatMonth } from '@/lib/utils/formatters';
import { SkeletonCard } from '@/components/shared/SkeletonCard';

export default function InternAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.getMyAttendance({ month: now.getMonth() + 1, year: now.getFullYear() });
      setRecords(res);
    } catch {
      // Non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const presentCount = records.filter(r => r.status === 'present').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Attendance</h1>
        <p className="text-sm text-slate-500 mt-0.5">{formatMonth(now.getMonth() + 1, now.getFullYear())}</p>
      </div>

      <GPSAttendanceWidget />

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">This Month</h2>
          <div className="text-sm font-medium text-indigo-600">{presentCount} / {records.length} days</div>
        </div>

        {loading ? <SkeletonCard rows={2} /> : (
          <div className="grid grid-cols-7 gap-1">
            {records.map(r => (
              <div key={r.id} className="flex flex-col items-center gap-0.5">
                <div className="text-[10px] text-slate-400">{formatDate(r.date, 'dd')}</div>
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium',
                  r.status === 'present' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'
                )}>
                  {r.status === 'present' ? 'P' : 'A'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
