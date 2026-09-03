'use client';

// Fellow can assign tasks to Interns in their district

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trash } from '@phosphor-icons/react';
import { usersApi } from '@/lib/api/users';
import { tasksApi } from '@/lib/api/tasks';
import type { User } from '@/types/models';
import { cn } from '@/lib/utils/formatters';
import { toast } from 'sonner';

const schema = z.object({
  name: z.string().min(2, 'Task name required'),
  description: z.string().optional(),
  priority: z.enum(['high', 'medium', 'low'] as const),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  assignedToIds: z.array(z.string()).min(1, 'Select at least one intern'),
}).refine(d => d.startDate <= d.endDate, { message: 'End date must be after start', path: ['endDate'] });

type FormData = z.infer<typeof schema>;

function inputCls(err?: boolean) {
  return cn('w-full px-3 py-2.5 text-sm rounded-[var(--radius)] border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500', err ? 'border-rose-400' : 'border-slate-200');
}

export default function FellowNewTaskPage() {
  const router = useRouter();
  const [interns, setInterns] = useState<User[]>([]);
  const [selected, setSelected] = useState<User[]>([]);
  const [search, setSearch] = useState('');

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'medium', assignedToIds: [] },
  });

  useEffect(() => {
    usersApi.list({ role: 'intern', limit: 200 }).then(res => setInterns(res.items)).catch(console.error);
  }, []);

  const filtered = interns.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.block?.name?.toLowerCase().includes(search.toLowerCase()));

  const add = (user: User) => {
    if (selected.find(u => u.id === user.id)) return;
    const updated = [...selected, user];
    setSelected(updated);
    setValue('assignedToIds', updated.map(u => u.id), { shouldValidate: true });
  };

  const remove = (id: string) => {
    const updated = selected.filter(u => u.id !== id);
    setSelected(updated);
    setValue('assignedToIds', updated.map(u => u.id), { shouldValidate: true });
  };

  const onSubmit = async (data: FormData) => {
    try {
      await tasksApi.create(data);
      toast.success('Task assigned to Intern(s)');
      router.push('/fellow/tasks');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create task');
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/fellow/tasks" className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"><ArrowLeft size={18} /></Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Assign Task to Intern</h1>
          <p className="text-sm text-slate-500 mt-0.5">Create a task for Interns in your district</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Task Name *</label>
            <input {...register('name')} placeholder="e.g. Block Health Survey" className={inputCls(!!errors.name)} />
            {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea {...register('description')} rows={2} className={cn(inputCls(), 'resize-none')} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
              <select {...register('priority')} className={inputCls()}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Start *</label>
              <input type="date" {...register('startDate')} className={inputCls()} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">End *</label>
              <input type="date" {...register('endDate')} className={inputCls(!!errors.endDate)} />
              {errors.endDate && <p className="mt-1 text-xs text-rose-600">{errors.endDate.message}</p>}
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-slate-900 text-sm">Assign to Interns</h2>
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selected.map(u => (
                <span key={u.id} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium">
                  {u.name} <button type="button" onClick={() => remove(u.id)}><Trash size={12} /></button>
                </span>
              ))}
            </div>
          )}
          <input type="search" placeholder="Search interns…" value={search} onChange={e => setSearch(e.target.value)} className={inputCls()} />
          <div className="max-h-[180px] overflow-y-auto border border-slate-200 rounded-[var(--radius)] divide-y divide-slate-100">
            {filtered.map(u => (
              <button key={u.id} type="button" onClick={() => add(u)} disabled={!!selected.find(s => s.id === u.id)}
                className={cn('w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm', selected.find(s => s.id === u.id) ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-slate-50 text-slate-700')}>
                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold shrink-0">{u.name.slice(0, 1)}</div>
                <div className="min-w-0"><div className="font-medium truncate">{u.name}</div><div className="text-xs text-slate-400">{u.block?.name}</div></div>
                {selected.find(s => s.id === u.id) && <span className="ml-auto text-xs text-emerald-600 font-medium">Added</span>}
              </button>
            ))}
          </div>
          {errors.assignedToIds && <p className="text-xs text-rose-600">{errors.assignedToIds.message}</p>}
        </div>

        <div className="flex gap-3">
          <Link href="/fellow/tasks" className="flex-1 text-center py-2.5 rounded-[var(--radius)] text-sm font-medium border border-slate-200 text-slate-700">Cancel</Link>
          <button type="submit" disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[var(--radius)] text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 btn-press disabled:opacity-60">
            {isSubmitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            Assign Task
          </button>
        </div>
      </form>
    </div>
  );
}
