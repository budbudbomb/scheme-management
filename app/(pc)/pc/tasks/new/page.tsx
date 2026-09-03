'use client';

// PC can create tasks for Fellows in their division
// Same form as Admin task creation, scoped to division

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Warning, Trash } from '@phosphor-icons/react';
import { usersApi } from '@/lib/api/users';
import { tasksApi } from '@/lib/api/tasks';
import type { User } from '@/types/models';
import { cn, roleLabel } from '@/lib/utils/formatters';
import { toast } from 'sonner';

const schema = z.object({
  name: z.string().min(2, 'Task name required'),
  description: z.string().optional(),
  priority: z.enum(['high', 'medium', 'low'] as const),
  startDate: z.string().min(1, 'Start date required'),
  endDate: z.string().min(1, 'End date required'),
  assignedToIds: z.array(z.string()).min(1, 'Assign to at least one user'),
}).refine(d => d.startDate <= d.endDate, { message: 'End date must be after start date', path: ['endDate'] });

type FormData = z.infer<typeof schema>;

function inputCls(err?: boolean) {
  return cn('w-full px-3 py-2.5 text-sm rounded-[var(--radius)] border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500', err ? 'border-rose-400' : 'border-slate-200');
}

export default function PCNewTaskPage() {
  const router = useRouter();
  const [fellows, setFellows] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'medium', assignedToIds: [] },
  });

  useEffect(() => {
    // Load only Fellows (PC can only assign to Fellows in their division)
    usersApi.list({ role: 'fellow', limit: 100 }).then(res => setFellows(res.items)).catch(console.error);
  }, []);

  const filteredUsers = fellows.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase())
  );

  const addUser = (user: User) => {
    if (selectedUsers.find(u => u.id === user.id)) return;
    const updated = [...selectedUsers, user];
    setSelectedUsers(updated);
    setValue('assignedToIds', updated.map(u => u.id), { shouldValidate: true });
  };

  const removeUser = (userId: string) => {
    const updated = selectedUsers.filter(u => u.id !== userId);
    setSelectedUsers(updated);
    setValue('assignedToIds', updated.map(u => u.id), { shouldValidate: true });
  };

  const onSubmit = async (data: FormData) => {
    try {
      await tasksApi.create(data);
      toast.success('Task created and assigned to Fellow(s)');
      router.push('/pc/tasks');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create task');
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/pc/tasks" className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Create Task</h1>
          <p className="text-sm text-slate-500 mt-0.5">Assign a task to Fellows in your division</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-slate-900 text-sm">Task Details</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Task Name *</label>
            <input {...register('name')} placeholder="e.g. District Review Q3" className={inputCls(!!errors.name)} />
            {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea {...register('description')} rows={3} placeholder="Task details…" className={cn(inputCls(), 'resize-none')} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
              <select {...register('priority')} className={inputCls()}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Start Date *</label>
              <input type="date" {...register('startDate')} className={inputCls(!!errors.startDate)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">End Date *</label>
              <input type="date" {...register('endDate')} className={inputCls(!!errors.endDate)} />
              {errors.endDate && <p className="mt-1 text-xs text-rose-600">{errors.endDate.message}</p>}
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold text-slate-900 text-sm">Assign to Fellows</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedUsers(fellows);
                  setValue('assignedToIds', fellows.map(u => u.id), { shouldValidate: true });
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-200"
              >
                + Select All Fellows
              </button>
              {selectedUsers.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUsers([]);
                    setValue('assignedToIds', [], { shouldValidate: true });
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors border border-rose-200"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map(u => (
                <span key={u.id} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-medium">
                  {u.name}
                  <button type="button" onClick={() => removeUser(u.id)} className="text-indigo-500 hover:text-indigo-700">
                    <Trash size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <input type="search" placeholder="Search Fellows…" value={userSearch} onChange={e => setUserSearch(e.target.value)} className={inputCls()} />
          <div className="max-h-[220px] overflow-y-auto border border-slate-200 rounded-[var(--radius)] divide-y divide-slate-100">
            {filteredUsers.map(u => {
              const isAdded = !!selectedUsers.find(s => s.id === u.id);
              return (
                <label
                  key={u.id}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors cursor-pointer select-none',
                    isAdded ? 'bg-indigo-50/70 text-indigo-900 font-medium' : 'hover:bg-slate-50 text-slate-700'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isAdded}
                    onChange={() => {
                      if (isAdded) removeUser(u.id);
                      else addUser(u);
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                  />
                  <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold shrink-0">
                    {u.name.slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{u.name}</div>
                    <div className="text-xs text-slate-400">{u.district?.name || 'Fellow'}</div>
                  </div>
                </label>
              );
            })}
          </div>
          {errors.assignedToIds && <p className="text-xs text-rose-600">{errors.assignedToIds.message}</p>}
        </div>

        <div className="flex gap-3">
          <Link href="/pc/tasks" className="flex-1 text-center py-2.5 rounded-[var(--radius)] text-sm font-medium border border-slate-200 text-slate-700">Cancel</Link>
          <button type="submit" id="pc-create-task-submit" disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[var(--radius)] text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 btn-press disabled:opacity-60">
            {isSubmitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            Create &amp; Assign Task
          </button>
        </div>
      </form>
    </div>
  );
}
