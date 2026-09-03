'use client';

import { useState, useEffect } from 'react';
import type { FellowDashboardStats } from '@/types/models';
import StatCard from '@/components/shared/StatCard';
import { SkeletonStatGrid } from '@/components/shared/SkeletonCard';
import ErrorState from '@/components/shared/ErrorState';
import { CheckSquare, ClipboardText, ArrowCircleUpRight, Users, MapPin } from '@phosphor-icons/react';
import { get } from '@/lib/api/client';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/context';
import GPSAttendanceWidget from '@/components/attendance/GPSAttendanceWidget';

async function fetchStats(): Promise<FellowDashboardStats> {
  try {
    return await get<FellowDashboardStats>('/dashboard/fellow');
  } catch {
    // Fallback demo data for local previewing
    return {
      myActiveTasks: 6,
      myCompletedTasks: 24,
      internsUnderMe: 10,
      myPendingLeave: 1,
      pendingInternApprovals: 3,
      attendanceThisMonth: 22,
    };
  }
}

export default function FellowDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<FellowDashboardStats | null>(null);
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
          {user?.district?.name ? `${user.district.name} District` : 'My Dashboard'}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">CMYPDP Fellow — {user?.district?.divisionName ?? 'Indore'}</p>
      </div>

      {/* GPS attendance widget — prominent for field staff */}
      <GPSAttendanceWidget />

      {loading ? <SkeletonStatGrid count={4} /> : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : stats && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="My Active Tasks" value={stats.myActiveTasks} icon={CheckSquare} iconColor="text-indigo-600" iconBg="bg-indigo-50" />
          <StatCard label="Interns Under Me" value={stats.internsUnderMe} icon={Users} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
          <StatCard label="My Leave Status" value={stats.myPendingLeave} icon={ClipboardText} iconColor="text-amber-600" iconBg="bg-amber-50" />
          <StatCard label="Intern Approvals" value={stats.pendingInternApprovals} icon={ArrowCircleUpRight} iconColor="text-rose-600" iconBg="bg-rose-50" />
        </div>
      )}

      {/* Quick links */}
      <div>
        <h2 className="font-semibold text-slate-900 mb-3">Quick Links</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/fellow/tasks', label: 'My Tasks', icon: CheckSquare, color: 'indigo' },
            { href: '/fellow/leave', label: 'Leave & Approvals', icon: ClipboardText, color: 'amber' },
            { href: '/fellow/exit', label: 'Exit', icon: ArrowCircleUpRight, color: 'rose' },
            { href: '/fellow/attendance', label: 'Attendance', icon: MapPin, color: 'emerald' },
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
