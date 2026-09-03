'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthUser, UserRole } from '@/types/models';
import { authApi } from '@/lib/api/auth';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Role → default dashboard path */
export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case 'admin':   return '/admin/dashboard';
    case 'pc':      return '/pc/dashboard';
    case 'fellow':  return '/fellow/dashboard';
    case 'intern':  return '/intern/dashboard';
    case 'pmu':     return '/pmu';
    default:        return '/login';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const me = await authApi.me();
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    // On mount, try to restore session from cookie/token
    const init = async () => {
      setIsLoading(true);
      try {
        const me = await authApi.me();
        setUser(me);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user: loggedIn, token } = await authApi.login({ email, password });
    if (token) {
      localStorage.setItem('cmyp_token', token);
      document.cookie = `cmyp_token=${token}; path=/; max-age=86400; SameSite=Lax`;
    }
    setUser(loggedIn);
    const path = getDashboardPath(loggedIn.role);
    router.replace(path);
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    }
    localStorage.removeItem('cmyp_token');
    localStorage.removeItem('cmyp_user');
    document.cookie = 'cmyp_token=; path=/; max-age=0;';
    document.cookie = 'cmyp_session=; path=/; max-age=0;';
    setUser(null);
    router.replace('/login');
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
