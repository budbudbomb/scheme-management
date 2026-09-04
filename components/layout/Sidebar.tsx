'use client';

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
      { href: `/${prefix}/leave/policy`, label: 'Leave Policy', icon: BookOpen },
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
        'hidden lg:flex flex-col h-full bg-slate-900 text-slate-300 sidebar-transition overflow-hidden shrink-0',
        open ? 'w-[256px]' : 'w-[72px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-800 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
          <ShieldCheck size={18} weight="fill" className="text-white" />
        </div>
        {open && (
          <div className="min-w-0">
            <div className="text-white font-semibold text-sm leading-none">CMYP Portal</div>
            <div className="text-slate-500 text-xs mt-0.5">MP Government</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 scroll-hide">
        <ul className="space-y-0.5 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                    'transition-colors duration-150 tap-target',
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  )}
                  title={!open ? item.label : undefined}
                >
                  <Icon
                    size={20}
                    weight={isActive ? 'fill' : 'regular'}
                    className={cn(
                      'shrink-0',
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
      <div className="border-t border-slate-800 p-3 shrink-0 space-y-1">
        {/* User identity */}
        {open && user && (
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user.name?.slice(0, 1).toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-white text-sm font-medium truncate">{user.name}</div>
              <div className="text-slate-500 text-xs">{roleLabel(user.role)}</div>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm',
            'text-slate-400 hover:text-rose-400 hover:bg-rose-900/20',
            'transition-colors duration-150 tap-target'
          )}
          title={!open ? 'Sign out' : undefined}
        >
          <SignOut size={20} className="shrink-0" />
          {open && 'Sign out'}
        </button>
      </div>
    </aside>
  );
}
