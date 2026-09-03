'use client';

import { useState, useEffect, useCallback } from 'react';
import { leaveApi } from '@/lib/api/leave';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { LeaveApplication, LeaveBalance } from '@/types/models';
import { cn, leaveStatusColor, leaveStatusLabel, formatDate } from '@/lib/utils/formatters';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import { Plus, ClipboardText, X } from '@phosphor-icons/react';
import { toast } from 'sonner';

const schema = z.object({
  leaveType: z.enum(['casual', 'earned', 'medical', 'special'] as const),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  reason: z.string().min(10, 'Please provide a reason (min 10 characters)'),
}).refine(d => d.startDate <= d.endDate, { message: 'End date must be after start', path: ['endDate'] });

type FormData = z.infer<typeof schema>;

function inputCls(err?: boolean) {
  return cn('w-full px-3 py-2.5 text-sm rounded-[var(--radius)] border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500', err ? 'border-rose-400' : 'border-slate-200');
}

export default function InternLeavePage() {
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [apps, bal] = await Promise.all([
        leaveApi.getMyApplications(),
        leaveApi.getMyBalance(),
      ]);
      setApplications(apps.items);
      setBalance(bal);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onSubmit = async (data: FormData) => {
    try {
      await leaveApi.apply(data);
      toast.success('Leave application submitted');
      reset();
      setShowForm(false);
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to apply');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Leave Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Apply for leave and track approvals from your Fellow</p>
        </div>
        <button
          id="intern-apply-leave-btn"
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius)] text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 btn-press"
        >
          <Plus size={16} weight="bold" />
          Apply for Leave
        </button>
      </div>

      {balance && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([
            { key: 'casual', label: 'Casual Leave', used: balance.casualUsed, total: balance.casual },
            { key: 'earned', label: 'Earned Leave', used: balance.earnedUsed, total: balance.earned },
            { key: 'medical', label: 'Medical Leave', used: balance.medicalUsed, total: balance.medical },
            { key: 'special', label: 'Special Leave', used: balance.specialUsed, total: balance.special },
          ] as const).map(({ key, label, used, total }) => (
            <div key={key} className="card p-4">
              <div className="text-xs font-medium text-slate-500 mb-2">{label}</div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-slate-900">{total - used}</span>
                <span className="text-xs text-slate-400">of {total} left</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-indigo-500" style={{ width: `${((total - used) / total) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">New Leave Application</h2>
            <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Leave Type *</label>
              <select {...register('leaveType')} className={inputCls()}>
                <option value="casual">Casual Leave (CL)</option>
                <option value="earned">Earned Leave (EL)</option>
                <option value="medical">Medical Leave (ML)</option>
                <option value="special">Special Leave (SL)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Start Date *</label>
                <input type="date" {...register('startDate')} className={inputCls(!!errors.startDate)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">End Date *</label>
                <input type="date" {...register('endDate')} className={inputCls(!!errors.endDate)} />
                {errors.endDate && <p className="text-xs text-rose-600 mt-1">{errors.endDate.message}</p>}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Reason *</label>
              <textarea {...register('reason')} rows={3} placeholder="Describe the reason…" className={cn(inputCls(!!errors.reason), 'resize-none')} />
              {errors.reason && <p className="text-xs text-rose-600 mt-1">{errors.reason.message}</p>}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 text-sm font-medium border border-slate-200 rounded-[var(--radius)] text-slate-700">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium bg-indigo-600 text-white rounded-[var(--radius)] hover:bg-indigo-700 btn-press disabled:opacity-60">
                {isSubmitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Submit Application
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? <SkeletonCard /> : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !applications.length ? (
        <div className="card"><EmptyState icon={ClipboardText} title="No leave applications" description="Your leave applications will appear here." /></div>
      ) : (
        <div className="space-y-3">
          {applications.map(app => (
            <div key={app.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-slate-900 text-sm capitalize">{app.leaveType} Leave</div>
                  <div className="text-xs text-slate-500 mt-1">{formatDate(app.startDate)} — {formatDate(app.endDate)}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{app.reason}</div>
                </div>
                <span className={cn('badge shrink-0', leaveStatusColor(app.status))}>{leaveStatusLabel(app.status)}</span>
              </div>
              {app.approverComment && (
                <div className="mt-2 text-xs text-slate-500 bg-slate-50 rounded-[var(--radius-sm)] px-3 py-2">
                  <strong>Comment:</strong> {app.approverComment}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
