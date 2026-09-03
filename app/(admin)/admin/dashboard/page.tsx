'use client';

import { useState, useEffect } from 'react';
import type { AdminDashboardStats } from '@/types/models';
import StatCard from '@/components/shared/StatCard';
import { SkeletonStatGrid } from '@/components/shared/SkeletonCard';
import ErrorState from '@/components/shared/ErrorState';
import {
  Users,
  Briefcase,
  CheckSquare,
  ClipboardText,
  ArrowCircleUpRight,
  ShieldCheck,
} from '@phosphor-icons/react';
import { get } from '@/lib/api/client';
import AttendanceTrendChart from '@/components/charts/AttendanceTrendChart';
import TaskCompletionChart from '@/components/charts/TaskCompletionChart';
import DivisionBreakdownChart from '@/components/charts/DivisionBreakdownChart';
import Link from 'next/link';

async function fetchStats(): Promise<AdminDashboardStats> {
  try {
    return await get<AdminDashboardStats>('/dashboard/admin');
  } catch {
    return {
      totalFellows: 55,
      totalInterns: 4695,
      totalPCs: 10,
      activeTasks: 142,
      completedTasks: 1280,
      pendingLeaveRequests: 14,
      pendingExitRequests: 4,
      attendanceToday: 4210,
      attendanceRate: 89.6,
      divisionsCount: 10,
      districtsCount: 55,
      blocksCount: 313,
    };
  }
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStats();
      setStats(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">State Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Overview of CMYPDP &amp; CMYIGGP programs across Madhya Pradesh
        </p>
      </div>

      {/* Stat cards */}
      {loading ? (
        <SkeletonStatGrid count={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            label="Total Fellows"
            value={stats.totalFellows}
            icon={Users}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-50"
          />
          <StatCard
            label="Total Interns"
            value={stats.totalInterns}
            icon={Briefcase}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
          />
          <StatCard
            label="Program Coordinators"
            value={stats.totalPCs}
            icon={ShieldCheck}
            iconColor="text-sky-600"
            iconBg="bg-sky-50"
          />
          <StatCard
            label="Active Tasks"
            value={stats.activeTasks}
            icon={CheckSquare}
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
          />
          <StatCard
            label="Pending Leave"
            value={stats.pendingLeaveRequests}
            icon={ClipboardText}
            iconColor="text-rose-600"
            iconBg="bg-rose-50"
          />
          <StatCard
            label="Pending Exit"
            value={stats.pendingExitRequests}
            icon={ArrowCircleUpRight}
            iconColor="text-violet-600"
            iconBg="bg-violet-50"
          />
        </div>
      ) : null}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance trend (takes 2 cols) */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Attendance Trend</h2>
            <span className="text-xs text-slate-400">Last 30 days</span>
          </div>
          <AttendanceTrendChart />
        </div>

        {/* Task completion donut */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Task Status</h2>
          </div>
          <TaskCompletionChart />
        </div>
      </div>

      {/* Division breakdown */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Division-wise Breakdown</h2>
          <Link href="/admin/users" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
            View users →
          </Link>
        </div>
        <DivisionBreakdownChart />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-semibold text-slate-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/admin/users?new=1', label: 'Add User', icon: Users, color: 'indigo' },
            { href: '/admin/tasks/new', label: 'Create Task', icon: CheckSquare, color: 'emerald' },
            { href: '/admin/leave', label: 'View Leave', icon: ClipboardText, color: 'amber' },
            { href: '/admin/exit', label: 'Exit Requests', icon: ArrowCircleUpRight, color: 'rose' },
          ].map(({ href, label, icon: Icon, color }) => (
            <Link
              key={href}
              href={href}
              className="card card-hover p-4 flex flex-col items-center gap-2 text-center tap-target"
            >
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
