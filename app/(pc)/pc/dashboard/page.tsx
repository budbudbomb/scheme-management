'use client';

import { useState, useEffect } from 'react';
import type { PCDashboardStats } from '@/types/models';
import StatCard from '@/components/shared/StatCard';
import { SkeletonStatGrid } from '@/components/shared/SkeletonCard';
import ErrorState from '@/components/shared/ErrorState';
import { Users, CheckSquare, ClipboardText, ArrowCircleUpRight, ShieldCheck, Fingerprint } from '@phosphor-icons/react';
import { get } from '@/lib/api/client';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/context';
import HierarchicalTaskMonitor from '@/components/dashboard/HierarchicalTaskMonitor';

async function fetchStats(): Promise<PCDashboardStats> {
  try {
    return await get<PCDashboardStats>('/dashboard/pc');
  } catch {
    // Fallback demo data for local previewing
    return {
      fellowsInDivision: 6,
      internsInDivision: 470,
      activeTasks: 18,
      completedTasks: 142,
      pendingLeaveApprovals: 5,
      pendingExitApprovals: 2,
      attendanceToday: 432,
    };
  }
}

export default function PCDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<PCDashboardStats | null>(null);
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
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          {user?.division?.name ?? 'Division'} Dashboard
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Program Coordinator overview for your division</p>
      </div>

      {loading ? <SkeletonStatGrid count={5} /> : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard label="Fellows" value={stats.fellowsInDivision} icon={Users} iconColor="text-indigo-600" iconBg="bg-indigo-50" />
          <StatCard label="Interns" value={stats.internsInDivision} icon={Users} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
          <StatCard label="Active Tasks" value={stats.activeTasks} icon={CheckSquare} iconColor="text-amber-600" iconBg="bg-amber-50" />
          <StatCard label="Pending Leave" value={stats.pendingLeaveApprovals} icon={ClipboardText} iconColor="text-rose-600" iconBg="bg-rose-50" />
          <StatCard label="Pending Exit" value={stats.pendingExitApprovals} icon={ArrowCircleUpRight} iconColor="text-violet-600" iconBg="bg-violet-50" />
        </div>
      )}

      {/* Division District & Block Intern Task Monitoring */}
      <div className="pt-2">
        <HierarchicalTaskMonitor
          role="pc"
          divisionId={user?.division?.id}
        />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-semibold text-slate-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { href: '/pc/tasks/new', label: 'Create Task', icon: CheckSquare, color: 'indigo' },
            { href: '/pc/surveys', label: 'Surveys', icon: ClipboardText, color: 'emerald' },
            { href: '/pc/leave', label: 'Review Leave', icon: ShieldCheck, color: 'amber' },
            { href: '/pc/exit', label: 'Review Exit', icon: ArrowCircleUpRight, color: 'rose' },
            { href: '/pc/training', label: 'Schedule Meeting', icon: Users, color: 'sky' },
            { href: '/pc/attendance', label: 'View Attendance', icon: Fingerprint, color: 'slate' },
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
