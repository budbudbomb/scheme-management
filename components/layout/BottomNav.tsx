'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  House,
  CheckSquare,
  MapPin,
  Fingerprint,
  ClipboardText,
  Calendar,
  Users,
  GearSix,
  ShieldCheck,
  WarningCircle,
  ArrowCircleUpRight,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils/formatters';
import type { UserRole } from '@/types/models';
import { useVirtualKeyboard } from '@/lib/hooks/useVirtualKeyboard';

interface BottomNavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

function getPrimaryNav(role: UserRole): BottomNavItem[] {
  switch (role) {
    case 'admin':
      return [
        { href: '/admin/dashboard', label: 'Home', icon: House },
        { href: '/admin/tasks', label: 'Tasks', icon: CheckSquare },
        { href: '/admin/surveys', label: 'Surveys', icon: ClipboardText },
        { href: '/admin/complaints', label: 'Complaints', icon: WarningCircle },
        { href: '/admin/leave', label: 'Leave', icon: ShieldCheck },
      ];
    case 'pc':
      return [
        { href: '/pc/dashboard', label: 'Home', icon: House },
        { href: '/pc/tasks', label: 'Tasks', icon: CheckSquare },
        { href: '/pc/attendance', label: 'Attendance', icon: Fingerprint },
        { href: '/pc/complaints', label: 'Complaints', icon: WarningCircle },
        { href: '/pc/leave', label: 'Leave', icon: ShieldCheck },
      ];
    case 'fellow':
      return [
        { href: '/fellow/dashboard', label: 'Home', icon: House },
        { href: '/fellow/tasks', label: 'Tasks', icon: CheckSquare },
        { href: '/fellow/attendance', label: 'Attendance', icon: Fingerprint },
        { href: '/fellow/complaints', label: 'Complaints', icon: WarningCircle },
        { href: '/fellow/leave', label: 'Leave', icon: ShieldCheck },
      ];
    case 'intern':
      return [
        { href: '/intern/dashboard', label: 'Home', icon: House },
        { href: '/intern/tasks', label: 'Tasks', icon: CheckSquare },
        { href: '/intern/attendance', label: 'Attendance', icon: Fingerprint },
        { href: '/intern/complaints', label: 'Complaints', icon: WarningCircle },
        { href: '/intern/leave', label: 'Leave', icon: ClipboardText },
      ];
    case 'pm':
      return [
        { href: '/pm/dashboard', label: 'Home', icon: House },
        { href: '/pm/exit', label: 'Exit', icon: ArrowCircleUpRight },
      ];
    default:
      return [];
  }
}

export default function BottomNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const isKeyboardOpen = useVirtualKeyboard();
  const items = getPrimaryNav(role);

  if (!items.length || isKeyboardOpen) return null;

  return (
    <nav
      className="lg:hidden fixed bottom-3 sm:bottom-4 z-40 bg-white/95 backdrop-blur-xl border border-[#1e3a8a]/35 rounded-[28px] shadow-[0_10px_35px_-5px_rgba(30,58,138,0.14),0_4px_12px_rgba(0,0,0,0.06)] px-2.5 py-1.5 mobile-bottom-nav left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-[440px]"
      aria-label="Mobile navigation"
    >
      <ul className="flex items-center justify-around gap-1">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-0.5',
                  'py-1.5 px-1 w-full rounded-2xl select-none tap-target',
                  'transition-all duration-200 active:scale-95',
                  isActive
                    ? 'bg-[#1e3a8a]/10 text-[#1e3a8a] font-bold shadow-[0_2px_12px_rgba(30,58,138,0.22)]'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50/80 font-medium'
                )}
              >
                <Icon
                  size={20}
                  weight={isActive ? 'fill' : 'regular'}
                  className={cn(
                    'transition-transform duration-200',
                    isActive ? 'scale-110' : ''
                  )}
                />
                <span className="text-[10px] leading-tight tracking-tight">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
