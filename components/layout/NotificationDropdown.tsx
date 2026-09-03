'use client';

import { Bell, CheckCircle, Info, Warning } from '@phosphor-icons/react';
import { cn } from '@/lib/utils/formatters';

// TODO: Wire to /notifications API endpoint once backend ready

const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    type: 'info' as const,
    message: 'New task assigned: District Field Survey',
    time: '5 min ago',
    read: false,
  },
  {
    id: '2',
    type: 'success' as const,
    message: 'Your leave request has been approved',
    time: '1 hour ago',
    read: false,
  },
  {
    id: '3',
    type: 'warning' as const,
    message: 'Upcoming training session at 3:00 PM today',
    time: '2 hours ago',
    read: true,
  },
];

const iconMap = {
  info: <Info size={16} className="text-sky-500" weight="fill" />,
  success: <CheckCircle size={16} className="text-emerald-500" weight="fill" />,
  warning: <Warning size={16} className="text-amber-500" weight="fill" />,
};

export default function NotificationDropdown({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />

      {/* Dropdown */}
      <div
        className={cn(
          'absolute right-0 top-full mt-2 w-80 z-50',
          'card shadow-[var(--shadow-popup)]',
          'animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150'
        )}
        style={{ transformOrigin: 'top right' }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
          <button
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            onClick={onClose}
          >
            Mark all read
          </button>
        </div>

        <ul className="divide-y divide-slate-100">
          {MOCK_NOTIFICATIONS.map((n) => (
            <li
              key={n.id}
              className={cn(
                'flex items-start gap-3 px-4 py-3 text-sm transition-colors hover:bg-slate-50',
                !n.read && 'bg-indigo-50/50'
              )}
            >
              <span className="mt-0.5 shrink-0">{iconMap[n.type]}</span>
              <div className="flex-1 min-w-0">
                <p className={cn('text-slate-800 leading-snug', !n.read && 'font-medium')}>
                  {n.message}
                </p>
                <p className="text-slate-400 text-xs mt-0.5">{n.time}</p>
              </div>
              {!n.read && (
                <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1" />
              )}
            </li>
          ))}
        </ul>

        <div className="px-4 py-3 border-t border-slate-100">
          <button className="w-full text-center text-xs text-indigo-600 hover:text-indigo-700 font-medium">
            View all notifications
          </button>
        </div>
      </div>
    </>
  );
}
