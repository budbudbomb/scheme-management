'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
type StatusFilter = 'all' | 'pending' | 'in_progress' | 'overdue' | 'completed';

function isTaskOverdue(task: Task): boolean {
  if (task.status === 'overdue') return true;
  if (task.status === 'completed') return false;
  if (!task.endDate) return false;
  const end = new Date(task.endDate);
  end.setHours(23, 59, 59, 999);
  return end.getTime() < Date.now();
}

export default function FellowTasksPage() {
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageView, setPageView] = useState<PageView>('calendar');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [own, byPc] = await Promise.all([
        tasksApi.list({ page: 1, limit: 50 }),
        tasksApi.getAssignedByPc({ page: 1, limit: 50 }),
      ]);
      const pcTasks = byPc.items.map(t => ({ ...t, assignedByPc: true }));
      setMyTasks([...own.items, ...pcTasks]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (taskId: string, status: Task['status'], comment?: string) => {
    try {
      await tasksApi.updateStatus(taskId, { status, comment });
      toast.success('Task status updated');
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const counts = useMemo(() => {
    return {
      all: myTasks.length,
      pending: myTasks.filter(t => t.status === 'pending' && !isTaskOverdue(t)).length,
      in_progress: myTasks.filter(t => t.status === 'in_progress' && !isTaskOverdue(t)).length,
      overdue: myTasks.filter(t => isTaskOverdue(t)).length,
      completed: myTasks.filter(t => t.status === 'completed').length,
    };
  }, [myTasks]);

  const filteredTasks = useMemo(() => {
    if (statusFilter === 'all') return myTasks;
    if (statusFilter === 'pending') return myTasks.filter(t => t.status === 'pending' && !isTaskOverdue(t));
    if (statusFilter === 'in_progress') return myTasks.filter(t => t.status === 'in_progress' && !isTaskOverdue(t));
    if (statusFilter === 'overdue') return myTasks.filter(t => isTaskOverdue(t));
    if (statusFilter === 'completed') return myTasks.filter(t => t.status === 'completed');
    return myTasks;
  }, [myTasks, statusFilter]);

  return (
    <div className="space-y-5">
      {/* Page header */}
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
            'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer',
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
            'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer',
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
      ) : !myTasks.length ? (
        <div className="card">
          <EmptyState
            icon={CheckSquare}
            title="No tasks assigned"
            description="Tasks assigned to you will appear here."
          />
        </div>
      ) : (
        <>
          {/* Calendar view */}
          {pageView === 'calendar' && (
            <MobileCalendar tasks={myTasks} />
          )}

          {/* List view */}
          {pageView === 'list' && (
            <div className="space-y-4">
              {/* Status Selector: To do - In progress - Overdue - Done */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { id: 'all' as const, label: 'All Tasks', count: counts.all },
                  { id: 'pending' as const, label: 'To do', count: counts.pending },
                  { id: 'in_progress' as const, label: 'In progress', count: counts.in_progress },
                  { id: 'overdue' as const, label: 'Overdue', count: counts.overdue },
                  { id: 'completed' as const, label: 'Done', count: counts.completed },
                ].map((f) => {
                  const active = statusFilter === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setStatusFilter(f.id)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border',
                        active
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                      )}
                    >
                      <span>{f.label}</span>
                      <span
                        className={cn(
                          'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                          active
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-600'
                        )}
                      >
                        {f.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {!filteredTasks.length ? (
                <div className="card p-8 text-center text-slate-500 text-sm">
                  No tasks found in this status category.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      showAssignedByPc
                      onStatusUpdate={updateStatus}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
