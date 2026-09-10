'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { leaveApi } from '@/lib/api/leave';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { LeaveApplication, LeaveBalance } from '@/types/models';
import { cn, formatDate } from '@/lib/utils/formatters';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import {
  Plus,
  ClipboardText,
  X,
  CalendarCheck,
  Clock,
  CheckCircle,
  XCircle,
  Info,
  WarningCircle,
  Calendar,
  CalendarBlank,
  Eye,
  FileText,
  Sparkle,
} from '@phosphor-icons/react';
import { toast } from 'sonner';

const schema = z.object({
  leaveType: z.literal('casual').default('casual'),
  startDate: z.string().min(1, 'Please select a start date'),
  endDate: z.string().min(1, 'Please select an end date'),
  reason: z.string().min(10, 'Please provide a reason (minimum 10 characters)'),
}).refine(d => !d.startDate || !d.endDate || d.startDate <= d.endDate, {
  message: 'End date must be on or after start date',
  path: ['endDate'],
});

type FormData = z.infer<typeof schema>;

function inputCls(err?: boolean) {
  return cn(
    'w-full px-3 py-2.5 text-sm rounded-[var(--radius)] border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors',
    err ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 hover:border-slate-300'
  );
}

function getLeaveDays(startDate?: string, endDate?: string): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0;
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

function statusBadge(status: 'applied' | 'approved' | 'rejected') {
  switch (status) {
    case 'approved':
      return { label: 'Approved', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle };
    case 'rejected':
      return { label: 'Rejected', cls: 'bg-rose-50 text-rose-600 border-rose-200', icon: XCircle };
    case 'applied':
    default:
      return { label: 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock };
  }
}

const QUICK_REASONS = [
  'Family function in home town',
  'Personal domestic work',
  'University examination',
  'Medical rest & recovery',
];

export default function InternLeavePage() {
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'applied' | 'approved' | 'rejected'>('all');
  const [mounted, setMounted] = useState(false);
  const [viewReasonModal, setViewReasonModal] = useState<{
    leaveType: string;
    duration: string;
    reason: string;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      leaveType: 'casual',
      startDate: '',
      endDate: '',
      reason: '',
    },
  });

  const watchedStartDate = watch('startDate');
  const watchedEndDate = watch('endDate');
  const watchedReason = watch('reason');

  const requestedDays = useMemo(() => {
    return getLeaveDays(watchedStartDate, watchedEndDate);
  }, [watchedStartDate, watchedEndDate]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [apps, bal] = await Promise.all([
        leaveApi.getMyApplications(),
        leaveApi.getMyBalance(),
      ]);
      setApplications(apps.items);
      setBalance(bal);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load leave records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onSubmit = async (data: FormData) => {
    try {
      await leaveApi.apply({
        leaveType: 'casual',
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
      });
      toast.success('Casual Leave application submitted successfully');
      reset();
      setShowForm(false);
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to apply for leave');
    }
  };

  // Casual Leave quota calculations
  const totalQuota = balance?.casual ?? 12;
  const usedDays = balance?.casualUsed ?? 0;
  const availableDays = Math.max(0, totalQuota - usedDays);

  // Applications categorized
  const pendingApps = useMemo(
    () => applications.filter(a => a.status === 'applied'),
    [applications]
  );
  const approvedApps = useMemo(
    () => applications.filter(a => a.status === 'approved'),
    [applications]
  );
  const rejectedApps = useMemo(
    () => applications.filter(a => a.status === 'rejected'),
    [applications]
  );

  const pendingDays = useMemo(() => {
    return pendingApps.reduce((acc, app) => acc + getLeaveDays(app.startDate, app.endDate), 0);
  }, [pendingApps]);

  const filteredApplications = useMemo(() => {
    if (activeTab === 'applied') return pendingApps;
    if (activeTab === 'approved') return approvedApps;
    if (activeTab === 'rejected') return rejectedApps;
    return applications;
  }, [activeTab, applications, pendingApps, approvedApps, rejectedApps]);

  const todayStr = new Date().toISOString().split('T')[0];

  const handleToggleForm = () => {
    setShowForm(prev => {
      const next = !prev;
      if (next) {
        const mainEl = document.querySelector('main');
        if (mainEl) {
          mainEl.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
      return next;
    });
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Sticky Header section - stays stable when scrolling */}
      <div className="sticky top-0 z-20 -mt-4 -mx-4 px-4 py-3.5 sm:-mt-6 sm:-mx-6 sm:px-6 sm:py-4 lg:-mt-8 lg:-mx-8 lg:px-8 bg-slate-50/95 lg:bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight truncate">
                Leave Management
              </h1>
              <span className="hidden sm:inline-flex text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                Casual Leave Only
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
              Apply for Casual Leave (CL) and track approvals from your Fellow
            </p>
          </div>

          <button
            id="intern-apply-leave-btn"
            onClick={handleToggleForm}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-[var(--radius)] text-xs sm:text-sm font-semibold transition-all shadow-sm btn-press shrink-0',
              showForm
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            )}
          >
            {showForm ? (
              <>
                <X size={16} weight="bold" />
                <span>Close Form</span>
              </>
            ) : (
              <>
                <Plus size={16} weight="bold" />
                <span>Apply for Leave</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Redesigned Casual Leave Hero Balance Card */}
      {balance && (
        <div className="card overflow-hidden border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/50 shadow-sm">
          {/* Card Top Strip */}
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                  <CalendarCheck size={20} weight="fill" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-900">Casual Leave (CL)</span>
                    <span className="sm:hidden text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Permitted
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">Intern Entitlement Policy</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-medium text-slate-500">Annual Quota</span>
                <div className="text-xs font-bold text-slate-800">{totalQuota} Days / Year</div>
              </div>
            </div>

            {/* Prominent Number & Metric */}
            <div className="flex items-baseline justify-between pt-1 pb-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  {availableDays}
                </span>
                <span className="text-sm font-semibold text-slate-600">
                  of {totalQuota} days left
                </span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {Math.round((availableDays / totalQuota) * 100)}% Available
              </span>
            </div>

            {/* Custom Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden p-0.5 flex">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                  style={{ width: `${Math.max(4, (availableDays / totalQuota) * 100)}%` }}
                  title={`${availableDays} days remaining`}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                <span>{usedDays} days used</span>
                <span>{availableDays} days remaining</span>
              </div>
            </div>

            {/* 3 Metric Pills */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100">
              <div className="bg-slate-50 rounded-lg p-2.5 text-center border border-slate-100">
                <span className="block text-[11px] font-medium text-slate-500">Total Quota</span>
                <span className="text-sm sm:text-base font-bold text-slate-800">{totalQuota} Days</span>
              </div>
              <div className="bg-slate-50 rounded-lg p-2.5 text-center border border-slate-100">
                <span className="block text-[11px] font-medium text-slate-500">Availed</span>
                <span className="text-sm sm:text-base font-bold text-slate-800">{usedDays} Days</span>
              </div>
              <div className="bg-slate-50 rounded-lg p-2.5 text-center border border-slate-100">
                <span className="block text-[11px] font-medium text-slate-500">Under Review</span>
                <span className="text-sm sm:text-base font-bold text-amber-700">
                  {pendingDays} Day{pendingDays === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Policy Callout */}
          <div className="bg-slate-100/70 border-t border-slate-200/70 px-4 py-2.5 flex items-center gap-2">
            <Info size={15} weight="fill" className="text-indigo-600 shrink-0" />
            <p className="text-[11px] sm:text-xs text-slate-600 leading-snug">
              <strong>Intern Policy:</strong> Only Casual Leave is permitted during your internship. Earned, Medical, and Special leaves do not apply.
            </p>
          </div>
        </div>
      )}

      {/* Application Form */}
      {showForm && (
        <div className="card p-4 sm:p-6 border-indigo-200 shadow-md bg-white animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-slate-900 text-base sm:text-lg">Apply for Casual Leave</h2>
              <p className="text-xs text-slate-500">Your application will be routed to your Fellow for approval</p>
            </div>
            <button
              onClick={() => setShowForm(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Dedicated Leave Type Display (Single Casual Leave type) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Leave Type <span className="text-slate-400 font-normal">(Permitted for Interns)</span>
              </label>
              <div className="flex items-center justify-between p-3 rounded-[var(--radius)] bg-indigo-50/50 border border-indigo-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <CalendarCheck size={16} weight="bold" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Casual Leave (CL)</div>
                    <div className="text-[11px] text-slate-500">Standard allowance · {availableDays} days currently available</div>
                  </div>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white text-indigo-700 border border-indigo-200">
                  Fixed
                </span>
              </div>
              <input type="hidden" {...register('leaveType')} value="casual" />
            </div>

            {/* Date Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Start Date *</label>
                <input
                  type="date"
                  min={todayStr}
                  {...register('startDate')}
                  className={inputCls(!!errors.startDate)}
                />
                {errors.startDate && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <WarningCircle size={13} weight="fill" />
                    {errors.startDate.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">End Date *</label>
                <input
                  type="date"
                  min={watchedStartDate || todayStr}
                  {...register('endDate')}
                  className={inputCls(!!errors.endDate)}
                />
                {errors.endDate && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <WarningCircle size={13} weight="fill" />
                    {errors.endDate.message}
                  </p>
                )}
              </div>
            </div>

            {/* Real-time Duration & Balance Impact Preview */}
            {requestedDays > 0 && (
              <div
                className={cn(
                  'p-3 rounded-[var(--radius)] border text-xs flex items-center justify-between flex-wrap gap-2 transition-all',
                  requestedDays > availableDays
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                )}
              >
                <div className="flex items-center gap-2">
                  {requestedDays > availableDays ? (
                    <WarningCircle size={16} weight="fill" className="text-rose-600 shrink-0" />
                  ) : (
                    <CalendarBlank size={16} weight="bold" className="text-emerald-600 shrink-0" />
                  )}
                  <span>
                    Duration:{' '}
                    <strong>
                      {requestedDays} Day{requestedDays > 1 ? 's' : ''}
                    </strong>
                  </span>
                </div>

                <div>
                  {requestedDays > availableDays ? (
                    <span className="font-semibold text-rose-700">
                      ⚠️ Exceeds remaining Casual Leave quota ({availableDays} days left)
                    </span>
                  ) : (
                    <span className="font-medium text-emerald-700">
                      Balance after approval: {availableDays - requestedDays} days remaining
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Reason */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">Reason for Leave *</label>
                <span className="text-[11px] text-slate-400">
                  {watchedReason?.length ?? 0} / 10 min chars
                </span>
              </div>
              <textarea
                {...register('reason')}
                rows={3}
                placeholder="Specify the reason for requesting Casual Leave (minimum 10 characters)..."
                className={cn(inputCls(!!errors.reason), 'resize-none')}
              />
              {errors.reason && (
                <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                  <WarningCircle size={13} weight="fill" />
                  {errors.reason.message}
                </p>
              )}

              {/* Quick suggestion chips */}
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-1">
                  <Sparkle size={12} weight="fill" className="text-amber-500" /> Quick select:
                </span>
                {QUICK_REASONS.map(reasonText => (
                  <button
                    key={reasonText}
                    type="button"
                    onClick={() => setValue('reason', reasonText, { shouldValidate: true })}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                  >
                    {reasonText}
                  </button>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 text-sm font-medium border border-slate-200 rounded-[var(--radius)] text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || (requestedDays > 0 && requestedDays > availableDays)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-indigo-600 text-white rounded-[var(--radius)] hover:bg-indigo-700 btn-press disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
              >
                {isSubmitting && (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                Submit Application
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Applications Section Header & Filter Tabs */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="font-bold text-slate-900 text-base sm:text-lg">Application History</h2>
          <span className="text-xs text-slate-500">
            {applications.length} total application{applications.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 border border-slate-200/80 rounded-full w-fit max-w-full overflow-x-auto scroll-hide shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer select-none',
              activeTab === 'all'
                ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            )}
          >
            All ({applications.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('applied')}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer select-none',
              activeTab === 'applied'
                ? 'bg-white text-amber-800 font-bold shadow-xs border border-amber-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            <span>Under Review</span>
            <span className={cn('text-[11px] font-bold', activeTab === 'applied' ? 'text-amber-700' : 'text-slate-500')}>
              ({pendingApps.length})
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('approved')}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer select-none',
              activeTab === 'approved'
                ? 'bg-white text-emerald-800 font-bold shadow-xs border border-emerald-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Approved</span>
            <span className={cn('text-[11px] font-bold', activeTab === 'approved' ? 'text-emerald-700' : 'text-slate-500')}>
              ({approvedApps.length})
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rejected')}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer select-none',
              activeTab === 'rejected'
                ? 'bg-white text-rose-800 font-bold shadow-xs border border-rose-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
            <span>Rejected</span>
            <span className={cn('text-[11px] font-bold', activeTab === 'rejected' ? 'text-rose-700' : 'text-slate-500')}>
              ({rejectedApps.length})
            </span>
          </button>
        </div>

        {/* Section Title matching Fellow login */}
        <div className="flex items-center justify-between px-1 pt-1">
          <div className="flex items-center gap-2">
            <ClipboardText size={18} weight="fill" className="text-slate-500" />
            <span className="text-sm font-bold text-slate-900">My Leave Applications</span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {filteredApplications.length} record(s)
          </span>
        </div>

        {/* Applications List */}
        {loading ? (
          <SkeletonCard />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : !filteredApplications.length ? (
          <div className="card p-8 text-center">
            <EmptyState
              icon={ClipboardText}
              title={
                activeTab === 'all'
                  ? 'No leave applications yet'
                  : `No ${activeTab} applications`
              }
              description={
                activeTab === 'all'
                  ? 'When you submit a Casual Leave request, it will appear here.'
                  : `You do not have any leave requests marked as ${activeTab}.`
              }
            />
            {activeTab === 'all' && !showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius)] text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 btn-press"
              >
                <Plus size={14} weight="bold" />
                Apply for Casual Leave
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredApplications.map(app => {
              const days = getLeaveDays(app.startDate, app.endDate);
              const sBadge = statusBadge(app.status);
              const StatusIcon = sBadge.icon;

              return (
                <div
                  key={app.id}
                  className="card p-4 sm:p-5 hover:border-slate-300 transition-all space-y-3 shadow-2xs"
                >
                  {/* Top Row: Left = Chips (Leave Type + Days), Right = Status Badge on Top Right Corner */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="badge border text-xs font-semibold bg-indigo-50 text-indigo-700 border-indigo-200">
                        Casual Leave (CL)
                      </span>
                      <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200/70">
                        {days} {days === 1 ? 'Day' : 'Days'}
                      </span>
                    </div>

                    {/* Status Badge in Top Right Corner */}
                    <span
                      className={cn(
                        'badge border text-xs flex items-center gap-1 font-semibold shrink-0',
                        sBadge.cls
                      )}
                    >
                      <StatusIcon size={12} weight="fill" />
                      {sBadge.label}
                    </span>
                  </div>

                  {/* Dates & Applied Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 font-medium text-slate-700">
                      <Calendar size={14} className="text-indigo-600 shrink-0" />
                      <span>
                        {formatDate(app.startDate)} &mdash; {formatDate(app.endDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 sm:before:content-['•'] sm:before:mr-1 sm:before:text-slate-300">
                      <span>Applied on {formatDate(app.appliedAt)}</span>
                    </div>
                  </div>

                  {/* Action Buttons: View details */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 shadow-2xs">
                      <span className="text-xs font-semibold text-slate-700">
                        View details
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setViewReasonModal({
                            leaveType: 'Casual Leave (CL)',
                            duration: `${formatDate(app.startDate)} — ${formatDate(app.endDate)} (${days} ${days === 1 ? 'Day' : 'Days'})`,
                            reason: app.reason,
                          })
                        }
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded transition shadow-2xs cursor-pointer"
                      >
                        <Eye size={13} weight="bold" />
                        View
                      </button>
                    </div>
                  </div>

                  {/* Approver comment if present */}
                  {app.approverComment && (
                    <div className="text-xs text-slate-600 bg-amber-50/70 border border-amber-200/60 rounded px-3 py-2 mt-2">
                      <strong>Approver Comment:</strong> {app.approverComment}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reason for Leave Modal matching Fellow Login */}
      {viewReasonModal && mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm select-none animate-in fade-in"
            onClick={e => {
              if (e.target === e.currentTarget) setViewReasonModal(null);
            }}
          >
            <div
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 select-text animate-in zoom-in-95 duration-150"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
                <div className="flex items-center gap-2">
                  <FileText size={18} weight="fill" className="text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Reason for Leave</h3>
                </div>
                <button
                  onClick={() => setViewReasonModal(null)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
                  aria-label="Close modal"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 pb-1 border-b border-slate-100">
                  <span>Type: <strong className="text-slate-800">{viewReasonModal.leaveType}</strong></span>
                  <span>Duration: <strong className="text-slate-800">{viewReasonModal.duration}</strong></span>
                </div>
                <div className="text-sm text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-200/80 leading-relaxed max-h-60 overflow-y-auto">
                  {viewReasonModal.reason}
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewReasonModal(null)}
                  className="w-full py-2.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-[var(--radius)] transition shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
