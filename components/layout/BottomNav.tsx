'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  House,
  CheckSquare,
  MapPin,
  ClipboardText,
  Calendar,
  Users,
  GearSix,
  ShieldCheck,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils/formatters';
import type { UserRole } from '@/types/models';

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
        { href: '/admin/users', label: 'Users', icon: Users },
        { href: '/admin/tasks', label: 'Tasks', icon: CheckSquare },
        { href: '/admin/surveys', label: 'Surveys', icon: ClipboardText },
        { href: '/admin/config', label: 'Config', icon: GearSix },
      ];
    case 'pc':
      return [
        { href: '/pc/dashboard', label: 'Home', icon: House },
        { href: '/pc/tasks', label: 'Tasks', icon: CheckSquare },
        { href: '/pc/surveys', label: 'Surveys', icon: ClipboardText },
        { href: '/pc/leave', label: 'Leave', icon: ShieldCheck },
        { href: '/pc/training', label: 'Training', icon: Calendar },
      ];
    case 'fellow':
      return [
        { href: '/fellow/dashboard', label: 'Home', icon: House },
        { href: '/fellow/tasks', label: 'Tasks', icon: CheckSquare },
        { href: '/fellow/attendance', label: 'Check In', icon: MapPin },
        { href: '/fellow/leave', label: 'Leave', icon: ShieldCheck },
        { href: '/fellow/training', label: 'Training', icon: Calendar },
      ];
    case 'intern':
      return [
        { href: '/intern/dashboard', label: 'Home', icon: House },
        { href: '/intern/tasks', label: 'Tasks', icon: CheckSquare },
        { href: '/intern/attendance', label: 'Check In', icon: MapPin },
        { href: '/intern/leave', label: 'Leave', icon: ClipboardText },
        { href: '/intern/training', label: 'Training', icon: Calendar },
      ];
    default:
      return [];
  }
}

export default function BottomNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = getPrimaryNav(role);

  if (!items.length) return null;

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 pb-safe"
      aria-label="Mobile navigation"
    >
      <ul className="flex">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5',
                  'py-2 px-1 w-full tap-target',
                  'transition-colors duration-150',
                  isActive ? 'text-indigo-600' : 'text-slate-400'
                )}
              >
                <Icon
                  size={22}
                  weight={isActive ? 'fill' : 'regular'}
                />
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-[2px] w-6 h-0.5 bg-indigo-600 rounded-full" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
