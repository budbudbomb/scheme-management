'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usersApi } from '@/lib/api/users';
import { cn, genderLabel, qualificationLabel } from '@/lib/utils/formatters';
import { toast } from 'sonner';
import { UserCircle, PencilSimple, Check, X } from '@phosphor-icons/react';
import DetailList from '@/components/shared/DetailList';

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  phone: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function FellowProfilePage() {
  const { user, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name ?? '', phone: user?.phone ?? '' },
  });

  useEffect(() => {
    if (user) reset({ name: user.name, phone: user.phone });
  }, [user, reset]);

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    try {
      await usersApi.update(user.id, data);
      await refreshUser();
      toast.success('Profile updated');
      setEditing(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900">My Profile</h1>
        <p className="text-sm text-slate-500 mt-0.5">Your personal information and program assignment</p>
      </div>

      {/* Header Profile Card */}
      <div className="card p-6 bg-gradient-to-r from-indigo-900/5 via-slate-50 to-emerald-900/5 border-slate-200 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold shrink-0 shadow-md mx-auto sm:mx-0">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0 w-full">
            {editing ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 max-w-md mx-auto sm:mx-0 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                    <input
                      {...register('name')}
                      className={cn(
                        'w-full px-3 py-2 text-sm rounded-[var(--radius)] border bg-white text-slate-900',
                        'focus:outline-none focus:ring-2 focus:ring-indigo-500',
                        errors.name ? 'border-rose-400' : 'border-slate-200'
                      )}
                    />
                    {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                    <input
                      {...register('phone')}
                      className="w-full px-3 py-2 text-sm rounded-[var(--radius)] border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={isSubmitting} className="flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-sm)] text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 btn-press disabled:opacity-60">
                    <Check size={14} weight="bold" />Save Changes
                  </button>
                  <button type="button" onClick={() => setEditing(false)} className="flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-sm)] text-xs font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
                    <X size={14} />Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 items-center">
                <div className="flex flex-col items-center sm:items-start">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
                    <span className="badge bg-indigo-100 text-indigo-700 border-indigo-200">Fellow (CMYPDP)</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-sm text-slate-500 mt-1">
                    <span>{user.email}</span>
                    {user.phone && <span>• {user.phone}</span>}
                    {user.samagraId && <span>• Samagra ID: <strong className="text-slate-700 font-mono">{user.samagraId}</strong></span>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius)] text-sm font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs transition-colors shrink-0 w-full sm:w-auto"
                >
                  <PencilSimple size={16} />
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid Content for Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Personal & Educational Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">Personal Details</h2>
            <DetailList
              columns={2}
              rows={[
                { label: 'Last Name', value: user.lastName },
                { label: 'Gender', value: genderLabel(user.gender) },
                { label: "Father's Name", value: user.fatherName },
                { label: 'Samagra ID', value: user.samagraId },
                { label: 'Address', value: user.address },
              ]}
            />
          </div>

          <div className="card p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">Educational Qualification</h2>
            <DetailList
              columns={2}
              rows={[
                { label: 'Qualification', value: qualificationLabel(user.qualification) }
              ]}
            />
          </div>
        </div>

        {/* Right Column: Program Assignment */}
        <div className="lg:col-span-1">
          <div className="card p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">Program Assignment</h2>
            <DetailList
              columns={1}
              rows={[
                { label: 'Program', value: 'CMYPDP — Fellow Program' },
                { label: 'State', value: 'Madhya Pradesh' },
                { label: 'Division', value: user.district?.divisionName ?? user.division?.name },
                { label: 'District', value: user.district?.name },
                { label: 'Member Since', value: new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
