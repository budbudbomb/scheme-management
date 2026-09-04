'use client';

import Image from 'next/image';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  House,
  Users,
  Briefcase,
  ClipboardText,
  Calendar,
  CheckSquare,
  SignOut,
  GearSix,
  ChartBar,
  UserCircle,
  CaretDoubleLeft,
  CaretDoubleRight,
  ShieldCheck,
  MapPin,
  Fingerprint,
  ArrowCircleUpRight,
  BookOpen,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils/formatters';
import { useAuth } from '@/lib/auth/context';
import { roleLabel } from '@/lib/utils/formatters';
import type { UserRole } from '@/types/models';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

function getNavItems(role: UserRole): NavItem[] {
  const base = (prefix: string) => ({
    admin: [
      { href: `/${prefix}/dashboard`, label: 'Dashboard', icon: House },
      { href: `/${prefix}/users`, label: 'Users', icon: Users },
      { href: `/${prefix}/tasks`, label: 'Tasks', icon: CheckSquare },
      { href: `/${prefix}/attendance`, label: 'Attendance', icon: Fingerprint },
      { href: `/${prefix}/leave`, label: 'Leave', icon: ClipboardText },
      { href: `/${prefix}/exit`, label: 'Exit', icon: ArrowCircleUpRight },
      { href: `/${prefix}/training`, label: 'Training', icon: Calendar },
      { href: `/${prefix}/config`, label: 'Configuration', icon: GearSix },
    ],
    pc: [
      { href: `/${prefix}/dashboard`, label: 'Dashboard', icon: House },
      { href: `/${prefix}/profile`, label: 'Profile', icon: UserCircle },
      { href: `/${prefix}/tasks`, label: 'Tasks', icon: CheckSquare },
      { href: `/${prefix}/surveys`, label: 'Surveys', icon: ClipboardText },
      { href: `/${prefix}/attendance`, label: 'Attendance', icon: Fingerprint },
      { href: `/${prefix}/leave`, label: 'Leave', icon: ShieldCheck },
      { href: `/${prefix}/exit`, label: 'Exit Approvals', icon: ArrowCircleUpRight },
      { href: `/${prefix}/training`, label: 'Training', icon: Calendar },
    ],
    fellow: [
      { href: `/${prefix}/dashboard`, label: 'Dashboard', icon: House },
      { href: `/${prefix}/profile`, label: 'Profile', icon: UserCircle },
      { href: `/${prefix}/tasks`, label: 'My Tasks', icon: CheckSquare },
      { href: `/${prefix}/surveys`, label: 'Surveys', icon: ClipboardText },
      { href: `/${prefix}/attendance`, label: 'Attendance', icon: MapPin },
      { href: `/${prefix}/leave`, label: 'Leave', icon: ShieldCheck },
      { href: `/${prefix}/exit`, label: 'Exit', icon: ArrowCircleUpRight },
      { href: `/${prefix}/training`, label: 'Training', icon: Calendar },
    ],
    intern: [
      { href: `/${prefix}/dashboard`, label: 'Dashboard', icon: House },
      { href: `/${prefix}/profile`, label: 'Profile', icon: UserCircle },
      { href: `/${prefix}/tasks`, label: 'My Tasks', icon: CheckSquare },
      { href: `/${prefix}/surveys`, label: 'Surveys', icon: ClipboardText },
      { href: `/${prefix}/attendance`, label: 'Attendance', icon: MapPin },
      { href: `/${prefix}/leave`, label: 'Leave', icon: ClipboardText },
      { href: `/${prefix}/exit`, label: 'Exit', icon: ArrowCircleUpRight },
      { href: `/${prefix}/training`, label: 'Training', icon: Calendar },
    ],
    pmu: [{ href: '/pmu', label: 'Dashboard', icon: House }],
  } as Record<UserRole, NavItem[]>);

  return base(role)[role] ?? [];
}

export default function Sidebar({
  role,
  open,
}: {
  role: UserRole;
  open: boolean;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const navItems = getNavItems(role);

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col h-full bg-[#152033] text-slate-300 sidebar-transition overflow-hidden shrink-0 rounded-2xl border border-slate-800/80 shadow-[0_8px_30px_rgba(0,0,0,0.3)] shadow-[0_12px_40px_-5px_rgba(0,0,0,0.4)] select-none',
        open ? 'w-[256px]' : 'w-[72px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-800/80 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-sm border border-slate-700/40">
          <Image src="/logo.png" alt="CMYP Logo" width={26} height={26} className="object-contain" />
        </div>
        {open && (
          <div className="min-w-0">
            <div className="text-white font-bold text-sm leading-none">CMYP Portal</div>
            <div className="text-slate-400 text-xs mt-1 font-medium">MP Government</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 scroll-hide">
        <ul className="space-y-1 px-2.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
                    'transition-all duration-150 tap-target',
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-semibold shadow-2xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  )}
                  title={!open ? item.label : undefined}
                >
                  <Icon
                    size={20}
                    weight={isActive ? 'fill' : 'regular'}
                    className={cn(
                      'shrink-0 transition-colors',
                      isActive ? 'text-indigo-400' : 'text-slate-500'
                    )}
                  />
                  {open && <span className="truncate">{item.label}</span>}
                  {isActive && open && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="border-t border-slate-800/80 p-2.5 shrink-0 space-y-1 bg-slate-900/40">
        {/* User identity */}
        {open && user && (
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-slate-800/50 border border-slate-800/70 mb-1">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-2xs">
              {user.name?.slice(0, 1).toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-white text-xs font-semibold truncate">{user.name}</div>
              <div className="text-slate-400 text-[11px] truncate">{roleLabel(user.role)}</div>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer',
            'text-slate-400 hover:text-rose-400 hover:bg-rose-950/30',
            'transition-colors duration-150 tap-target'
          )}
          title={!open ? 'Sign out' : undefined}
        >
          <SignOut size={18} className="shrink-0" />
          {open && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
