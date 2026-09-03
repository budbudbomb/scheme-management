'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { tasksApi } from '@/lib/api/tasks';
import type { Task } from '@/types/models';
import TaskCard from '@/components/tasks/TaskCard';
import MobileCalendar from '@/components/tasks/MobileCalendar';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import { Plus, CheckSquare, Warning, CalendarBlank, ListBullets } from '@phosphor-icons/react';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/formatters';

type MobilePageView = 'calendar' | 'list';

export default function PCTasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [mobileView, setMobileView] = useState<MobilePageView>('calendar');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await tasksApi.list({ status: filter as Task['status'] || undefined });
      setTasks(res.items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleEdit = (task: Task) => {
    router.push('/pc/tasks/new');
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;
    try {
      await tasksApi.delete(taskToDelete.id);
      setTasks(prev => prev.filter(t => t.id !== taskToDelete.id));
      toast.success(`Task "${taskToDelete.name}" deleted successfully`);
    } catch {
      toast.error('Failed to delete task');
    } finally {
      setTaskToDelete(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Tasks</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage tasks for Fellows and Interns in your division</p>
        </div>
        <Link
          href="/pc/tasks/new"
          id="pc-create-task-btn"
          className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius)] text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 btn-press"
        >
          <Plus size={16} weight="bold" />
          Create Task
        </Link>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
        {['', 'pending', 'in_progress', 'completed', 'overdue'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-[var(--radius-full)] text-xs font-medium transition-colors shrink-0 ${
              filter === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {s === '' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Calendar / List toggle */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        <button
          type="button"
          onClick={() => setMobileView('calendar')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200',
            mobileView === 'calendar'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700',
          )}
        >
          <CalendarBlank size={14} weight={mobileView === 'calendar' ? 'bold' : 'regular'} />
          Calendar
        </button>
        <button
          type="button"
          onClick={() => setMobileView('list')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200',
            mobileView === 'list'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700',
          )}
        >
          <ListBullets size={14} weight={mobileView === 'list' ? 'bold' : 'regular'} />
          List
        </button>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !tasks.length ? (
        <div className="card"><EmptyState icon={CheckSquare} title="No tasks" description="Create tasks and assign them to Fellows in your division." action={{ label: 'Create Task', onClick: () => {} }} /></div>
      ) : (
        <>
          {/* Calendar view */}
          {mobileView === 'calendar' && (
            <MobileCalendar tasks={tasks} />
          )}

          {/* List view */}
          {mobileView === 'list' && (
            <div className="grid gap-3 sm:grid-cols-2">
              {tasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={handleEdit}
                  onDelete={() => setTaskToDelete(task)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="card p-6 max-w-sm w-full space-y-4 shadow-xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Warning size={24} weight="bold" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Task</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <strong className="text-slate-800">&quot;{taskToDelete.name}&quot;</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                className="flex-1 py-2.5 rounded-[var(--radius)] text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-[var(--radius)] text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 btn-press"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

