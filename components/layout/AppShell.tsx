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
      <div className="flex h-[100dvh] overflow-hidden bg-[hsl(var(--color-bg))]">
        {/* Desktop sidebar */}
        <Sidebar role={role} open={sidebarOpen} />

        {/* Main content area */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <TopBar role={role} onMenuToggle={() => setSidebarOpen((v) => !v)} />

          <main className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6 lg:p-8 page-enter pb-20 lg:pb-8">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav role={role} />
    </ShellContext.Provider>
  );
}
