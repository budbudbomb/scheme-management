'use client';

import { useState, useEffect } from 'react';
import { SkeletonStatGrid } from '@/components/shared/SkeletonCard';
import ErrorState from '@/components/shared/ErrorState';
import {
  Users,
  ClipboardText,
  CheckCircle,
  ChartLine,
  ArrowCircleUpRight,
  CheckSquare,
} from '@phosphor-icons/react';
import AttendanceTrendChart from '@/components/charts/AttendanceTrendChart';

import SurveyStatusDonut from '@/components/charts/SurveyStatusDonut';
import SurveyDistrictChart from '@/components/charts/SurveyDistrictChart';
import Link from 'next/link';
import { cn } from '@/lib/utils/formatters';

// ─── Mock KPI data (replace with real API) ──────────────────────────────────
interface SurveyStats {
  totalDeployed: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  completionRate: number;
  // attendance for rate card
  attendanceToday: number;
  attendanceRate: number;
}

async function fetchStats(): Promise<SurveyStats> {
  // TODO: hook to real API
  return {
    totalDeployed: 4500,
    completed: 3240,
    inProgress: 812,
    notStarted: 448,
    completionRate: 72,
    attendanceToday: 4210,
    attendanceRate: 89.6,
  };
}

// ─── Inline KPI Card (more impactful than StatCard for 4-up layout) ──────────
interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent: string;         // Tailwind colour prefix e.g. 'indigo'
  icon: React.ReactNode;
  trend?: { value: number; positive: boolean; label: string };
}

function KpiCard({ label, value, sub, icon, trend, accent }: KpiCardProps) {
  return (
    <div className={cn('card p-5 card-hover flex flex-col gap-3 border-t-4', `border-t-${accent}-600 border-${accent}-100`)}>
      <div className="flex items-start justify-between gap-2">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', `bg-${accent}-50`)}>
          {icon}
        </div>
        {trend && (
          <span
            className={cn(
              'text-[11px] font-bold px-2 py-0.5 rounded-full',
              trend.positive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            )}
          >
            {trend.positive ? '▲' : '▼'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <div>
        <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">
          {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
        </div>
        <div className="text-sm text-slate-500 mt-1 font-medium">{label}</div>
        {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
        {trend && <div className="text-xs text-slate-400 mt-1">{trend.label}</div>}
      </div>
    </div>
  );
}

// ─── Chart card wrapper ───────────────────────────────────────────────────────
function ChartCard({
  title,
  subtitle,
  children,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('card p-5', className)}>
      <div className="flex items-start justify-between mb-4 gap-2">
        <div>
          <h2 className="font-bold text-slate-900 text-sm">{title}</h2>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}



// ─── Page ────────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const [stats, setStats] = useState<SurveyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setStats(await fetchStats());
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
          Survey &amp; attendance overview — CMYPDP &amp; CMYIGGP · Madhya Pradesh
        </p>
      </div>

      {/* ── 4 KPI Cards ─────────────────────────────────────────────────── */}
      {loading ? (
        <SkeletonStatGrid count={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : stats ? (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            label="Survey Completion Rate"
            value={`${stats.completionRate}%`}
            sub={`${stats.completed.toLocaleString('en-IN')} of ${stats.totalDeployed.toLocaleString('en-IN')} surveys done`}
            accent="indigo"
            icon={<ChartLine size={20} weight="fill" className="text-indigo-600" />}
            trend={{ value: 6, positive: true, label: 'vs last month' }}
          />
          <KpiCard
            label="Total Surveys Deployed"
            value={stats.totalDeployed}
            sub="Across all districts & blocks"
            accent="sky"
            icon={<ClipboardText size={20} weight="fill" className="text-sky-600" />}
          />
          <KpiCard
            label="Surveys Completed"
            value={stats.completed}
            sub={`${stats.inProgress.toLocaleString('en-IN')} still in progress`}
            accent="emerald"
            icon={<CheckCircle size={20} weight="fill" className="text-emerald-600" />}
            trend={{ value: 12, positive: true, label: 'vs last week' }}
          />
          <KpiCard
            label="Today's Attendance Rate"
            value={`${stats.attendanceRate}%`}
            sub={`${stats.attendanceToday.toLocaleString('en-IN')} personnel present`}
            accent="amber"
            icon={<Users size={20} weight="fill" className="text-amber-600" />}
            trend={{ value: 2, positive: false, label: 'vs yesterday' }}
          />
        </div>
      ) : null}

      {/* ── Row 1: Drill-Down Chart + Survey Status Donut ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard
          title="Survey Progress by Division"
          subtitle="Division → District → Block · click any bar to drill down"
          className="lg:col-span-2"
        >
          <SurveyDistrictChart />
        </ChartCard>

        <ChartCard title="Survey Status" subtitle="Overall distribution">
          <SurveyStatusDonut />
        </ChartCard>
      </div>

      {/* ── Row 2: Attendance Trend ───────────────────────────────────────── */}
      <ChartCard
        title="Attendance Trend"
        subtitle="Last 30 days · Present vs Absent"
      >
        <AttendanceTrendChart />
      </ChartCard>

      {/* ── Quick Actions ────────────────────────────────────────────────── */}
      <div>
        <h2 className="font-semibold text-slate-900 mb-3 text-sm">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/admin/users?new=1', label: 'Add User', icon: Users, color: 'indigo' },
            { href: '/admin/tasks/new', label: 'Create Task', icon: CheckSquare, color: 'emerald' },
            { href: '/admin/surveys', label: 'View Surveys', icon: ClipboardText, color: 'sky' },
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
