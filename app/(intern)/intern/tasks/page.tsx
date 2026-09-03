'use client';

import { useState, useEffect, useCallback } from 'react';
import { tasksApi } from '@/lib/api/tasks';
import type { Task } from '@/types/models';
import TaskCard from '@/components/tasks/TaskCard';
import MobileCalendar from '@/components/tasks/MobileCalendar';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import { CheckSquare, CalendarBlank, ListBullets } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/formatters';

type PageView = 'calendar' | 'list';

export default function InternTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageView, setPageView] = useState<PageView>('calendar');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await tasksApi.list({ page: 1, limit: 50 });
      setTasks(res.items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (taskId: string, status: Task['status']) => {
    try {
      await tasksApi.updateStatus(taskId, { status });
      toast.success('Status updated');
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">My Tasks</h1>
        <p className="text-sm text-slate-500 mt-0.5">View and update the status of tasks assigned to you</p>
      </div>

      {/* Calendar / List toggle */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        <button
          type="button"
          onClick={() => setPageView('calendar')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200',
            pageView === 'calendar'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700',
          )}
        >
          <CalendarBlank size={14} weight={pageView === 'calendar' ? 'bold' : 'regular'} />
          Calendar
        </button>
        <button
          type="button"
          onClick={() => setPageView('list')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200',
            pageView === 'list'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700',
          )}
        >
          <ListBullets size={14} weight={pageView === 'list' ? 'bold' : 'regular'} />
          List
        </button>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !tasks.length ? (
        <div className="card">
          <EmptyState icon={CheckSquare} title="No tasks yet" description="Tasks assigned to you by your Fellow or Program Coordinator will appear here." />
        </div>
      ) : (
        <>
          {/* Calendar view */}
          {pageView === 'calendar' && (
            <MobileCalendar tasks={tasks} />
          )}

          {/* List view */}
          {pageView === 'list' && (
            <div className="grid gap-3 sm:grid-cols-2">
              {tasks.map(task => (
                <TaskCard key={task.id} task={task} onStatusUpdate={updateStatus} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
