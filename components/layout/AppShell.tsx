'use client';

import { useState, createContext, useContext } from 'react';
import type { UserRole } from '@/types/models';

interface ShellContextValue {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  role: UserRole | null;
}

const ShellContext = createContext<ShellContextValue>({
  sidebarOpen: true,
  toggleSidebar: () => {},
  role: null,
});

export function useShell() {
  return useContext(ShellContext);
}

import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import TopBar from './TopBar';

export default function AppShell({
  children,
  role,
}: {
  children: React.ReactNode;
  role: UserRole;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <ShellContext.Provider
      value={{ sidebarOpen, toggleSidebar: () => setSidebarOpen((v) => !v), role }}
    >
      <div className="flex h-[100dvh] overflow-hidden bg-slate-100/80">
        {/* Desktop floating sidebar container */}
        <div className="hidden lg:flex p-3 pr-0 shrink-0">
          <Sidebar role={role} open={sidebarOpen} />
        </div>

        {/* Main content area (floating rounded canvas on desktop) */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden lg:m-3 lg:rounded-2xl lg:bg-white lg:border lg:border-slate-200/90 lg:shadow-xs">
          <TopBar role={role} onMenuToggle={() => setSidebarOpen((v) => !v)} />

          <main className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6 lg:p-8 page-enter pb-24 lg:pb-8">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile floating tab bar */}
      <BottomNav role={role} />
    </ShellContext.Provider>
  );
}
