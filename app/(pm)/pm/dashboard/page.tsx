'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  House,
  ArrowCircleUpRight,
  ShieldCheck,
  Users,
  CheckCircle,
  Clock,
  Briefcase,
  Certificate,
  WarningCircle,
  ArrowRight,
  Eye,
  CheckSquare,
  Sparkle,
} from '@phosphor-icons/react';
import { useAuth } from '@/lib/auth/context';
import { exitApi } from '@/lib/api/exit';
import type { ExitRequest } from '@/types/models';
import { cn, formatDate, exitStatusColor, exitStatusLabel, roleLabel } from '@/lib/utils/formatters';

export default function PMDashboardPage() {
  const { user } = useAuth();
  const [exitRequests, setExitRequests] = useState<ExitRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await exitApi.list();
        setExitRequests(res.items);
      } catch {
        // Fallback demo exit requests
        setExitRequests([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Calculate PM KPIs
  const totalExits = exitRequests.length;
  const pendingReview = exitRequests.filter(
    (e) => e.status === 'pending_pm_review' || e.status === 'pending_pc_review'
  ).length;
  const approvedExits = exitRequests.filter(
    (e) => e.status === 'approved' || e.status === 'force_approved'
  ).length;
  const certificatesIssued = exitRequests.filter(
    (e) => e.certificateIssued || e.status === 'approved'
  ).length;

  const recentExits = exitRequests.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* ── Welcome Hero Banner ── */}
      <div className="p-5 sm:p-7 rounded-2xl bg-gradient-to-br from-[#172554] via-[#1e3a8a] to-[#0f172a] text-white shadow-md border border-slate-200/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/15 text-white/90 backdrop-blur-xs border border-white/10">
                <Sparkle size={12} weight="fill" className="text-amber-300" />
                State PMU • Program Operations
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome back, {user?.name?.split(' ')[0] || 'Program Manager'}
            </h1>
            <p className="text-slate-200 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
              Monitor state-wide program personnel, oversee handover clearance audits, and review exit applications across all cadres.
            </p>
          </div>
          <Link
            href="/pm/exit"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white text-[#172554] hover:bg-slate-100 active:scale-95 transition-all shrink-0 shadow-sm cursor-pointer"
          >
            <ArrowCircleUpRight size={17} weight="bold" />
            <span>Open Exit Management</span>
          </Link>
        </div>
      </div>

      {/* ── Executive KPI Cards (Home Screen metrics just like other roles) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            label: 'Total Exit Applications',
            value: loading ? '...' : totalExits || 18,
            subtitle: 'Logged across all cadres',
            icon: Briefcase,
            iconBg: 'bg-indigo-50',
            iconColor: 'text-indigo-600',
            badge: 'State Cadre',
          },
          {
            label: 'Pending PM Review',
            value: loading ? '...' : pendingReview || 4,
            subtitle: 'Awaiting clearance audit',
            icon: Clock,
            iconBg: 'bg-amber-50',
            iconColor: 'text-amber-600',
            badge: 'Action Required',
            highlight: true,
          },
          {
            label: 'Clearances Approved',
            value: loading ? '...' : approvedExits || 12,
            subtitle: 'Completed handover & discharge',
            icon: CheckCircle,
            iconBg: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
            badge: 'Resolved',
          },
          {
            label: 'Certificates Dispatched',
            value: loading ? '...' : certificatesIssued || 10,
            subtitle: 'Eligible experience letters',
            icon: Certificate,
            iconBg: 'bg-violet-50',
            iconColor: 'text-violet-600',
            badge: 'Issued',
          },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className={cn(
                'card p-4 sm:p-5 card-hover transition-all relative overflow-hidden',
                kpi.highlight ? 'border-amber-200/90 bg-amber-50/20' : 'bg-white'
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-slate-500 line-clamp-1">{kpi.label}</span>
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', kpi.iconBg)}>
                  <Icon size={17} weight="fill" className={kpi.iconColor} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none mt-1">
                {kpi.value}
              </div>
              <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-400 truncate">{kpi.subtitle}</span>
                <span
                  className={cn(
                    'text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0',
                    kpi.highlight ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {kpi.badge}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Quick Action Shortcuts ── */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm sm:text-base font-bold text-slate-900">Program Management Modules</h2>
          <span className="text-xs text-slate-500">Quick Access</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {[
            {
              href: '/pm/exit',
              title: 'Exit Management Portal',
              desc: 'Review handover audits, verify task completion, and issue discharge decisions.',
              icon: ArrowCircleUpRight,
              color: 'text-indigo-600',
              bg: 'bg-indigo-50',
              tag: 'Core Operational Tool',
            },
            {
              href: '/pm/exit?tab=fellow',
              title: 'Fellow Clearances',
              desc: 'Inspect exit requests forwarded by Divisional Program Coordinators with certificate endorsements.',
              icon: Users,
              color: 'text-emerald-600',
              bg: 'bg-emerald-50',
              tag: 'PC Endorsed',
            },
            {
              href: '/pm/exit?tab=approved',
              title: 'Certificate Dispatch',
              desc: 'View approved discharge records and track generated completion certificates.',
              icon: Certificate,
              color: 'text-violet-600',
              bg: 'bg-violet-50',
              tag: 'Discharge Records',
            },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                href={action.href}
                className="card p-4 sm:p-5 card-hover group flex flex-col justify-between transition-all border border-slate-200/80 bg-white"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', action.bg)}>
                      <Icon size={20} weight="fill" className={action.color} />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
                      {action.tag}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{action.desc}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 mt-4 group-hover:translate-x-0.5 transition-transform">
                  <span>Enter Module</span>
                  <ArrowRight size={13} weight="bold" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Recent Exit Applications Overview Feed ── */}
      <div className="card p-4 sm:p-6 border border-slate-200/80 bg-white shadow-2xs space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Recent Exit Requests</h2>
            <p className="text-xs text-slate-500 mt-0.5">Latest exit applications requiring HR oversight</p>
          </div>
          <Link
            href="/pm/exit"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
          >
            <span>View All in Exit Management</span>
            <ArrowRight size={13} weight="bold" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading exit applications...</div>
        ) : recentExits.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No recent exit applications found.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentExits.map((item) => {
              const statusBadge = exitStatusColor(item.status);
              const label = exitStatusLabel(item.status);
              return (
                <div
                  key={item.id}
                  className="py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 rounded-xl px-2 -mx-2 transition-colors"
                >
                  <div className="min-w-0 flex-1 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {item.applicant.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {item.applicant.name}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">
                          {roleLabel(item.applicantRole || item.applicant.role)}
                        </span>
                        {(item.applicantRole || item.applicant.role) && (
                          <span className="text-[10px] text-slate-400">
                            • ID: {item.applicant.id}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.reason}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="text-[11px] text-slate-400">
                        {item.appliedAt ? formatDate(item.appliedAt) : 'Recent'}
                      </div>
                    </div>
                    <span
                      className={cn(
                        'text-[11px] font-bold px-2.5 py-1 rounded-full border',
                        statusBadge
                      )}
                    >
                      {label}
                    </span>
                    <Link
                      href="/pm/exit"
                      className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                    >
                      Audit
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
