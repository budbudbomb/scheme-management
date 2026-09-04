'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import type { UserRole } from '@/types/models';
import {
  X,
  SignOut,
  User,
  EnvelopeSimple,
  Phone,
  MapPin,
  Buildings,
  GraduationCap,
  IdentificationCard,
  PencilSimple,
  ShieldCheck,
  CalendarBlank,
} from '@phosphor-icons/react';
import {
  cn,
  roleLabel,
  genderLabel,
  qualificationLabel,
  formatDate,
} from '@/lib/utils/formatters';
import { toast } from 'sonner';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: UserRole;
}

const ROLE_FULL_TITLE: Record<UserRole, string> = {
  admin: 'Chief / Senior Program Management (Admin)',
  pc: 'Program Coordinator (Division Level)',
  fellow: 'CMYPDP Fellow (District Level)',
  intern: 'CMYIGGP Intern (Block Level)',
  pmu: 'State PMU Officer',
};

function categoryLabel(cat?: string): string {
  if (!cat) return '—';
  const map: Record<string, string> = {
    general: 'General',
    obc: 'OBC',
    sc: 'SC',
    st: 'ST',
    ews: 'EWS',
  };
  return map[cat.toLowerCase()] ?? cat.toUpperCase();
}

export default function ProfileModal({ isOpen, onClose, role }: ProfileModalProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted || !user) return null;

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      onClose();
      await logout();
      toast.success('Logged out successfully');
      router.push('/login');
    } catch {
      toast.error('Failed to log out');
    } finally {
      setLoggingOut(false);
    }
  };

  const hasDedicatedProfilePage = role === 'intern' || role === 'fellow' || role === 'pc';

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Container: Full screen on mobile, elegant dialog on desktop */}
      <div
        className="w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-xl bg-white sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <User size={18} weight="bold" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">My Profile</h2>
              <p className="text-[11px] text-slate-500">Account overview & official details</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Close profile"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Identity Card Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-slate-50 to-purple-50/50 border border-slate-200/80 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
              {/* Avatar */}
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl sm:text-3xl font-black shadow-md shrink-0 ring-4 ring-white">
                {user.name?.slice(0, 1).toUpperCase() ?? 'U'}
              </div>

              {/* Name & Title */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                    {user.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                    Active
                  </span>
                </div>

                <p className="text-xs font-semibold text-indigo-700 mt-1">
                  {ROLE_FULL_TITLE[role] ?? roleLabel(role)}
                </p>

                {/* Contact Badges */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1.5 mt-2.5 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <EnvelopeSimple size={13} className="text-slate-400" />
                    <span>{user.email}</span>
                  </span>
                  {user.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone size={13} className="text-slate-400" />
                      <span>{user.phone}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Administrative / Posting Details */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Buildings size={15} className="text-indigo-600" weight="bold" />
              <span>Administrative Assignment</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Role</span>
                <span className="font-bold text-slate-900">{roleLabel(role)}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Division</span>
                <span className="font-bold text-slate-900">{user.district?.divisionName ?? user.division?.name ?? 'Indore'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">District</span>
                <span className="font-bold text-slate-900">{user.district?.name ?? 'Indore'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Block</span>
                <span className="font-bold text-slate-900">{user.block?.name ?? 'Ujjain Urban'}</span>
              </div>
              {user.gramPanchayat && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Gram Panchayat</span>
                  <span className="font-bold text-slate-900">{user.gramPanchayat.name}</span>
                </div>
              )}
              {user.village && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Village</span>
                  <span className="font-bold text-slate-900">{user.village.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Personal & Educational Details */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <IdentificationCard size={15} className="text-indigo-600" weight="bold" />
              <span>Personal & Education</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Samagra ID</span>
                <span className="font-bold text-slate-900 font-mono">{user.samagraId ?? '109283746'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Category</span>
                <span className="font-bold text-slate-900">{categoryLabel(user.category ?? 'OBC')}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Gender</span>
                <span className="font-bold text-slate-900">{genderLabel(user.gender ?? 'male')}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Qualification</span>
                <span className="font-bold text-slate-900">{qualificationLabel(user.qualification ?? 'graduate')}</span>
              </div>
              {user.fatherName && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 col-span-2">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Father's Name</span>
                  <span className="font-bold text-slate-900">{user.fatherName}</span>
                </div>
              )}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 col-span-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Registration / Joined Date</span>
                <span className="font-bold text-slate-900">{formatDate(user.createdAt || '2026-01-01')}</span>
              </div>
            </div>
          </div>

          {/* Quick Edit shortcut if dedicated profile page exists */}
          {hasDedicatedProfilePage && (
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push(`/${role}/profile`);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer"
            >
              <PencilSimple size={14} weight="bold" />
              <span>Edit Full Profile Information</span>
            </button>
          )}
        </div>

        {/* Footer with LOG OUT button */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-3 sticky bottom-0 z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            Close
          </button>

          <button
            type="button"
            disabled={loggingOut}
            onClick={handleLogout}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 active:scale-98 transition-all shadow-xs cursor-pointer disabled:opacity-60"
          >
            <SignOut size={16} weight="bold" />
            <span>{loggingOut ? 'Logging Out...' : 'Log Out'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
