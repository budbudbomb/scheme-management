'use client';

import { useState, useEffect } from 'react';
import type { InternDashboardStats } from '@/types/models';
import StatCard from '@/components/shared/StatCard';
import { SkeletonStatGrid } from '@/components/shared/SkeletonCard';
import ErrorState from '@/components/shared/ErrorState';
import { CheckSquare, ClipboardText, Calendar, MapPin } from '@phosphor-icons/react';
import { get } from '@/lib/api/client';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/context';
import GPSAttendanceWidget from '@/components/attendance/GPSAttendanceWidget';

async function fetchStats(): Promise<InternDashboardStats> {
  try {
    return await get<InternDashboardStats>('/dashboard/intern');
  } catch {
    // Fallback demo data for previewing without backend server
    return {
      myActiveTasks: 4,
      myCompletedTasks: 12,
      leaveBalance: {
        casual: 12,
        casualUsed: 3,
        earned: 15,
        earnedUsed: 2,
        medical: 10,
        medicalUsed: 0,
        special: 5,
        specialUsed: 0,
      },
      upcomingMeetings: 2,
      attendanceThisMonth: 18,
    };
  }
}

export default function InternDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<InternDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try { setStats(await fetchStats()); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          {user?.block?.name ? `${user.block.name} Block` : 'My Dashboard'}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">CMYIGGP Intern — {user?.block?.districtName ?? 'Ujjain'}</p>
      </div>

      {/* GPS attendance — #1 priority for Interns */}
      <GPSAttendanceWidget />

      {loading ? <SkeletonStatGrid count={3} /> : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : stats && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Active Tasks" value={stats.myActiveTasks} icon={CheckSquare} iconColor="text-indigo-600" iconBg="bg-indigo-50" />
          <StatCard label="Leave Balance" value={`${stats.leaveBalance.casual - stats.leaveBalance.casualUsed} CL`} icon={ClipboardText} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
          <StatCard label="Upcoming Meetings" value={stats.upcomingMeetings} icon={Calendar} iconColor="text-amber-600" iconBg="bg-amber-50" />
        </div>
      )}

      {/* Quick links */}
      <div>
        <h2 className="font-semibold text-slate-900 mb-3">Quick Links</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/intern/tasks', label: 'My Tasks', icon: CheckSquare, color: 'indigo' },
            { href: '/intern/surveys', label: 'Surveys', icon: ClipboardText, color: 'emerald' },
            { href: '/intern/leave', label: 'Apply Leave', icon: ClipboardText, color: 'amber' },
            { href: '/intern/training', label: 'Training', icon: Calendar, color: 'sky' },
          ].map(({ href, label, icon: Icon, color }) => (
            <Link key={href} href={href} className="card card-hover p-4 flex flex-col items-center gap-2 text-center tap-target">
              <div className={`w-10 h-10 rounded-xl bg-${color}-50 flex items-center justify-center`}>
                <Icon size={20} weight="fill" className={`text-${color}-600`} />
              </div>
              <span className="text-xs font-medium text-slate-700">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
