'use client';

import { useState, useEffect } from 'react';
import type { FellowDashboardStats } from '@/types/models';
import { CheckSquare, ClipboardText, ArrowCircleUpRight, MapPin } from '@phosphor-icons/react';
import { get } from '@/lib/api/client';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/context';
import HierarchicalTaskMonitor from '@/components/dashboard/HierarchicalTaskMonitor';

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
    <div className="space-y-2">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <MapPin size={22} className="text-indigo-600 shrink-0" weight="duotone" />
          <span>{user?.district?.name ? `${user.district.name} District` : 'My Dashboard'}</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">CMYPDP Fellow — {user?.district?.divisionName ?? 'Indore Division'}</p>
      </div>

      {/* Block-wise Intern Task Monitoring */}
      <div>
        <HierarchicalTaskMonitor
          role="fellow"
          districtId={user?.district?.id}
          districtName={user?.district?.name}
        />
      </div>

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
