'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell,
  CheckCircle,
  Info,
  Warning,
  X,
  Check,
  ClockCounterClockwise,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils/formatters';
import { toast } from 'sonner';

interface NotificationItem {
  id: string;
  type: 'info' | 'success' | 'warning';
  message: string;
  time: string;
  read: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    type: 'info',
    message: 'New task assigned: District Field Survey',
    time: '5 min ago',
    read: false,
  },
  {
    id: '2',
    type: 'success',
    message: 'Your leave request has been approved',
    time: '1 hour ago',
    read: false,
  },
  {
    id: '3',
    type: 'warning',
    message: 'Upcoming training session at 3:00 PM today',
    time: '2 hours ago',
    read: true,
  },
];

const TYPE_CONFIG = {
  info: {
    icon: <Info size={16} weight="fill" />,
    iconBg: 'bg-sky-50 border-sky-100 text-sky-600',
    dot: 'bg-indigo-600',
    unreadBg: 'bg-indigo-50/50',
  },
  success: {
    icon: <CheckCircle size={16} weight="fill" />,
    iconBg: 'bg-emerald-50 border-emerald-100 text-emerald-600',
    dot: 'bg-emerald-500',
    unreadBg: 'bg-emerald-50/40',
  },
  warning: {
    icon: <Warning size={16} weight="fill" />,
    iconBg: 'bg-amber-50 border-amber-100 text-amber-600',
    dot: 'bg-amber-500',
    unreadBg: 'bg-amber-50/30',
  },
} as const;

export default function NotificationDropdown({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
  unreadCount?: number;
}) {
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll and Escape key close
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  const handleToggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:items-start sm:justify-end sm:pt-16 sm:pr-6 animate-in fade-in duration-150">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Notification Panel */}
      <div
        className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-[0_20px_60px_-10px_rgba(15,23,42,0.18),0_4px_16px_-4px_rgba(15,23,42,0.08)] border border-slate-200/80 overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-top-2 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-popup-title"
        style={{ maxHeight: 'min(520px, 85dvh)' }}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="px-5 pt-5 pb-4">
          {/* Top Row: Title + Close */}
          <div className="flex items-center justify-between gap-3 mb-0.5">
            <div className="flex items-center gap-2">
              <h3
                id="notification-popup-title"
                className="text-base font-bold text-slate-900 tracking-tight"
              >
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-600 text-white leading-none tabular-nums shadow-sm">
                  {unreadCount}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              aria-label="Close notifications"
            >
              <X size={16} weight="bold" />
            </button>
          </div>

          {/* Sub row: description + Mark all read */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-slate-400">
              Tasks, leaves &amp; field alerts
            </p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer shrink-0 px-1"
              >
                <Check size={12} weight="bold" />
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Thin accent divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mx-4" />

        {/* ── Notifications List ──────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 custom-scrollbar overscroll-contain py-2 space-y-0.5 px-2">
          {notifications.length === 0 ? (
            <div className="py-14 text-center">
              <Bell size={32} weight="thin" className="text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-medium">You're all caught up!</p>
              <p className="text-xs text-slate-300 mt-1">No notifications right now</p>
            </div>
          ) : (
            notifications.map((n) => {
              const cfg = TYPE_CONFIG[n.type];
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleToggleRead(n.id)}
                  className={cn(
                    'w-full text-left flex items-start gap-3 p-3 rounded-xl transition-all cursor-pointer select-none group',
                    !n.read
                      ? cn(cfg.unreadBg, 'hover:brightness-95')
                      : 'hover:bg-slate-50'
                  )}
                >
                  {/* Icon bubble */}
                  <div
                    className={cn(
                      'w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 transition-transform group-hover:scale-105',
                      cfg.iconBg
                    )}
                  >
                    {cfg.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-xs leading-snug',
                        !n.read
                          ? 'font-bold text-slate-900'
                          : 'font-medium text-slate-600'
                      )}
                    >
                      {n.message}
                    </p>
                    <p className="flex items-center gap-1 text-[11px] text-slate-400 font-medium mt-1">
                      <ClockCounterClockwise size={11} />
                      {n.time}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!n.read && (
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full shrink-0 mt-1.5 shadow-sm',
                        cfg.dot
                      )}
                    />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Thin bottom divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mx-4" />

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <div className="px-5 py-3.5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              toast.info('Viewing all notifications');
              onClose();
            }}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
          >
            View all
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
