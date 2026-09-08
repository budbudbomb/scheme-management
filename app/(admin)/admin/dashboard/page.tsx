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
  Timer,
} from '@phosphor-icons/react';
import AttendanceTrendChart from '@/components/charts/AttendanceTrendChart';
import SurveyDistrictChart from '@/components/charts/SurveyDistrictChart';
import { AvgTimeByDivisionCard, WeeklyTrendCard, TimeDistributionCard } from '@/components/charts/SurveyTimeChart';
import Link from 'next/link';
import { cn } from '@/lib/utils/formatters';

// ─── Mock KPI data (replace with real API) ──────────────────────────────────
interface SurveyStats {
  totalDeployed: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  completionRate: number;
  avgSurveyTimeMin: number;
}

async function fetchStats(): Promise<SurveyStats> {
  // TODO: hook to real API
  return {
    totalDeployed: 4500,
    completed: 3240,
    inProgress: 812,
    notStarted: 448,
    completionRate: 72,
    avgSurveyTimeMin: 14.2,
  };
}

const ACCENT_CONFIG: Record<string, { bg: string; border: string }> = {
  indigo: { bg: 'bg-indigo-50', border: 'border-t-indigo-500' },
  sky: { bg: 'bg-sky-50', border: 'border-t-sky-500' },
  emerald: { bg: 'bg-emerald-50', border: 'border-t-emerald-500' },
  violet: { bg: 'bg-violet-50', border: 'border-t-violet-500' },
};

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent: 'indigo' | 'sky' | 'emerald' | 'violet';
  icon: React.ReactNode;
  trend?: { value: number; positive: boolean; label: string };
  badge?: string;
}

function KpiCard({ label, value, sub, icon, trend, badge, accent }: KpiCardProps) {
  const cfg = ACCENT_CONFIG[accent] ?? ACCENT_CONFIG.indigo;

  return (
    <div
      className={cn(
        'card p-4 sm:p-5 card-hover flex flex-col justify-start border-t-[3px] transition-all',
        cfg.border
      )}
    >
      {/* Top row: Icon + Trend/Badge aligned to fixed min-height */}
      <div className="flex items-center justify-between min-h-[32px] sm:min-h-[38px]">
        <div
          className={cn(
            'w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 [&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-5 sm:[&>svg]:h-5',
            cfg.bg
          )}
        >
          {icon}
        </div>
        {trend ? (
          <span
            className={cn(
              'text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1',
              trend.positive
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                : 'bg-rose-50 text-rose-700 border border-rose-200/60'
            )}
          >
            <span>{trend.positive ? '▲' : '▼'}</span>
            <span>{Math.abs(trend.value)}%</span>
          </span>
        ) : badge ? (
          <span className="text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60 shrink-0">
            {badge}
          </span>
        ) : (
          <span className="h-5" />
        )}
      </div>

      {/* Metric content: strict top-down flow so all 4 values share the identical baseline */}
      <div className="mt-3.5 sm:mt-4 min-w-0">
        <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
          {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
        </div>
        <div className="text-xs sm:text-sm font-semibold text-slate-700 mt-2 leading-snug truncate">
          {label}
        </div>
        {sub && (
          <div className="text-[11px] sm:text-xs text-slate-400 mt-1 leading-tight truncate">
            {sub}
          </div>
        )}
        {trend?.label ? (
          <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 leading-tight truncate">
            {trend.label}
          </div>
        ) : (
          <div className="text-[10px] sm:text-xs text-transparent select-none mt-0.5 leading-tight hidden sm:block">
            &nbsp;
          </div>
        )}
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
    <div className="space-y-6 sm:space-y-8">
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
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard
            label="Survey Completion Rate"
            value={`${stats.completionRate}%`}
            sub={`${stats.completed.toLocaleString('en-IN')} of ${stats.totalDeployed.toLocaleString('en-IN')} done`}
            accent="indigo"
            icon={<ChartLine size={20} weight="fill" className="text-indigo-600" />}
            trend={{ value: 6, positive: true, label: 'vs last month' }}
          />
          <KpiCard
            label="Total Surveys Deployed"
            value={stats.totalDeployed}
            sub="Across all 52 districts & blocks"
            accent="sky"
            icon={<ClipboardText size={20} weight="fill" className="text-sky-600" />}
            trend={{ value: 4, positive: true, label: 'vs last month' }}
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
            label="Avg Survey Completion Time"
            value={`${stats.avgSurveyTimeMin} min`}
            sub="Target: 15 min · across all roles"
            accent="violet"
            icon={<Timer size={20} weight="fill" className="text-violet-600" />}
            trend={{ value: 8, positive: true, label: 'faster than last month' }}
          />
        </div>
      ) : null}

      {/* ── Row 1: Drill-Down Chart ────────────────────────────────────── */}
      <ChartCard
        title="Survey Progress by Division"
        subtitle="Division → District → Block · click any bar to drill down"
      >
        <SurveyDistrictChart />
      </ChartCard>

      {/* ── Row 2: Drill-down (left 2 cols) + Weekly/Distribution (right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:items-start">
        {/* Left — drill-down + attendance stacked */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <AvgTimeByDivisionCard />
          <ChartCard
            title="Attendance Trend"
            subtitle="Last 30 days · Present vs Absent"
          >
            <AttendanceTrendChart />
          </ChartCard>
        </div>
        {/* Right — weekly trend + distribution stacked */}
        <div className="flex flex-col gap-5">
          <WeeklyTrendCard />
          <TimeDistributionCard />
        </div>
      </div>

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
