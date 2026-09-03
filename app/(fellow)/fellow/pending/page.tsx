'use client';

import { useAuth } from '@/lib/auth/context';
import { Clock, SignOut } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';

export default function PendingAllocationPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center">
          <Clock size={32} className="text-amber-500" />
        </div>
        
        <div>
          <h1 className="text-xl font-bold text-slate-900">Registration Under Review</h1>
          <p className="mt-2 text-sm text-slate-500">
            Hi {user?.name}, your registration as a Fellow is complete, but your account is pending district allocation.
          </p>
          <p className="mt-4 text-sm text-slate-600 font-medium">
            The state admin team will review your application and allocate your district soon.
          </p>
        </div>

        <div className="pt-4 flex justify-center">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            <SignOut size={16} /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
