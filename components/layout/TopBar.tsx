'use client';

import { useState } from 'react';
import { Bell, List } from '@phosphor-icons/react';
import { useAuth } from '@/lib/auth/context';
import { roleLabel } from '@/lib/utils/formatters';
import type { UserRole } from '@/types/models';
import NotificationDropdown from './NotificationDropdown';
import ProfileModal from './ProfileModal';

const ROLE_SCHEME: Record<UserRole, string> = {
  admin: 'CMYP Admin',
  pc: 'Program Coordinator',
  fellow: 'CMYPDP Fellow',
  intern: 'CMYIGGP Intern',
  pmu: 'PMU',
};

export default function TopBar({
  role,
  onMenuToggle,
}: {
  role: UserRole;
  onMenuToggle: () => void;
}) {
  const { user } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="h-16 border-b border-slate-200/90 bg-white flex items-center px-4 sm:px-6 gap-4 shrink-0 z-30 lg:rounded-t-2xl">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors tap-target"
        aria-label="Toggle menu"
        id="topbar-menu-toggle"
      >
        <List size={20} />
      </button>

      {/* Desktop sidebar toggle */}
      <button
        onClick={onMenuToggle}
        className="hidden lg:flex p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
        aria-label="Toggle sidebar"
        id="topbar-sidebar-toggle"
      >
        <List size={18} />
      </button>

      {/* Scheme label */}
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium text-slate-400 hidden sm:inline">
          {ROLE_SCHEME[role]}
        </span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <button
            id="topbar-notifications"
            onClick={() => setNotifOpen((v) => !v)}
            className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors tap-target"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {/* Unread badge — TODO: wire to actual notification count */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>
          <NotificationDropdown open={notifOpen} onClose={() => setNotifOpen(false)} />
        </div>

        {/* User avatar button */}
        <button
          type="button"
          onClick={() => setProfileOpen(true)}
          className="flex items-center gap-2 ml-1 p-1 sm:px-2 sm:py-1 rounded-xl hover:bg-slate-100/80 transition-all cursor-pointer select-none group tap-target"
          title="View Profile & Settings"
          id="topbar-user-profile-button"
          aria-label="Open profile"
        >
          <div className="w-8 h-8 rounded-full bg-indigo-600 group-hover:ring-2 group-hover:ring-indigo-400 group-hover:scale-105 transition-all flex items-center justify-center text-white text-xs font-bold shadow-xs select-none">
            {user?.name?.slice(0, 1).toUpperCase() ?? 'U'}
          </div>
          <div className="hidden sm:block text-right">
            <div className="text-sm font-semibold text-slate-900 leading-none group-hover:text-indigo-600 transition-colors">
              {user?.name ?? '—'}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">{roleLabel(role)}</div>
          </div>
        </button>
      </div>

      {/* Profile Modal Screen */}
      <ProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        role={role}
      />
    </header>
  );
}
