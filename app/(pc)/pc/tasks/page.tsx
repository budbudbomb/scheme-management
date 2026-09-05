'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { tasksApi } from '@/lib/api/tasks';
import type { Task } from '@/types/models';
import TaskCard from '@/components/tasks/TaskCard';
import MobileCalendar, { CalendarView } from '@/components/tasks/MobileCalendar';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import {
  Plus,
  CheckSquare,
  Warning,
  CalendarBlank,
  ListBullets,
  ClipboardText,
  Hourglass,
  Clock,
  CheckCircle,
  WarningCircle,
} from '@phosphor-icons/react';
import Link from 'next/link';
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

export default function PCTasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [pageView, setPageView] = useState<PageView>('calendar');
  const [calendarView, setCalendarView] = useState<CalendarView>('day');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await tasksApi.list({ page: 1, limit: 50 });
      setTasks(res.items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleEdit = (task: Task) => {
    router.push('/pc/tasks/new');
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;
    try {
      await tasksApi.delete(taskToDelete.id);
      setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
      toast.success(`Task "${taskToDelete.name}" deleted successfully`);
    } catch {
      toast.error('Failed to delete task');
    } finally {
      setTaskToDelete(null);
    }
  };

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
      all: tasks.length,
      pending: tasks.filter((t) => t.status === 'pending' && !isTaskOverdue(t)).length,
      in_progress: tasks.filter((t) => t.status === 'in_progress' && !isTaskOverdue(t)).length,
      overdue: tasks.filter((t) => isTaskOverdue(t)).length,
      completed: tasks.filter((t) => t.status === 'completed').length,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (statusFilter === 'all') return tasks;
    if (statusFilter === 'pending') return tasks.filter((t) => t.status === 'pending' && !isTaskOverdue(t));
    if (statusFilter === 'in_progress') return tasks.filter((t) => t.status === 'in_progress' && !isTaskOverdue(t));
    if (statusFilter === 'overdue') return tasks.filter((t) => isTaskOverdue(t));
    if (statusFilter === 'completed') return tasks.filter((t) => t.status === 'completed');
    return tasks;
  }, [tasks, statusFilter]);

  // KPI Items matching CPM / SPM format
  const kpiItems = useMemo(
    () => [
      {
        key: 'all' as const,
        label: 'Total',
        desktopLabel: 'All Tasks',
        value: counts.all,
        icon: ClipboardText,
        color: 'text-indigo-600',
        activeStyle: 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300/60',
        activeText: 'text-white',
        activeSub: 'text-indigo-100',
        activeIcon: 'text-white',
        activeDesktopStyle: 'bg-indigo-50/90 border-indigo-300 text-indigo-950 shadow-xs ring-1 ring-indigo-400/30',
        activeDesktopText: 'text-indigo-950',
        activeDesktopIconBg: 'bg-indigo-600 text-white shadow-xs',
      },
      {
        key: 'pending' as const,
        label: 'To Do',
        desktopLabel: 'To Do',
        value: counts.pending,
        icon: Hourglass,
        color: 'text-amber-500',
        activeStyle: 'bg-amber-500 text-white border-amber-500 shadow-md ring-2 ring-amber-300/60',
        activeText: 'text-white',
        activeSub: 'text-amber-100',
        activeIcon: 'text-white',
        activeDesktopStyle: 'bg-amber-50/90 border-amber-300 text-amber-950 shadow-xs ring-1 ring-amber-400/30',
        activeDesktopText: 'text-amber-950',
        activeDesktopIconBg: 'bg-amber-500 text-white shadow-xs',
      },
      {
        key: 'in_progress' as const,
        label: 'In Progress',
        desktopLabel: 'In Progress',
        value: counts.in_progress,
        icon: Clock,
        color: 'text-sky-500',
        activeStyle: 'bg-sky-500 text-white border-sky-500 shadow-md ring-2 ring-sky-300/60',
        activeText: 'text-white',
        activeSub: 'text-sky-100',
        activeIcon: 'text-white',
        activeDesktopStyle: 'bg-sky-50/90 border-sky-300 text-sky-950 shadow-xs ring-1 ring-sky-400/30',
        activeDesktopText: 'text-sky-950',
        activeDesktopIconBg: 'bg-sky-500 text-white shadow-xs',
      },
      {
        key: 'completed' as const,
        label: 'Done',
        desktopLabel: 'Done',
        value: counts.completed,
        icon: CheckCircle,
        color: 'text-emerald-600',
        activeStyle: 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300/60',
        activeText: 'text-white',
        activeSub: 'text-emerald-100',
        activeIcon: 'text-white',
        activeDesktopStyle: 'bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-xs ring-1 ring-emerald-400/30',
        activeDesktopText: 'text-emerald-950',
        activeDesktopIconBg: 'bg-emerald-600 text-white shadow-xs',
      },
      {
        key: 'overdue' as const,
        label: 'Overdue',
        desktopLabel: 'Overdue',
        value: counts.overdue,
        icon: WarningCircle,
        color: 'text-rose-500',
        activeStyle: 'bg-rose-500 text-white border-rose-500 shadow-md ring-2 ring-rose-300/60',
        activeText: 'text-white',
        activeSub: 'text-rose-100',
        activeIcon: 'text-white',
        activeDesktopStyle: 'bg-rose-50/90 border-rose-300 text-rose-950 shadow-xs ring-1 ring-rose-400/30',
        activeDesktopText: 'text-rose-950',
        activeDesktopIconBg: 'bg-rose-500 text-white shadow-xs',
      },
    ],
    [counts]
  );

  return (
    <div className="space-y-4">
      {/* 1. Header: Title, Subtitle, and Create Task action */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Tasks</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage tasks for Fellows and Interns in your division</p>
        </div>
        <Link
          href="/pc/tasks/new"
          id="pc-create-task-btn"
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shrink-0 transition-all cursor-pointer"
        >
          <Plus size={16} weight="bold" />
          <span>Create Task</span>
        </Link>
      </div>

      {/* 2. FROZEN STICKY HEADER: KPIs + Filter Controls (stays frozen while scrolling up/down) */}
      <div className="sticky top-0 z-20 bg-slate-100/95 lg:bg-white/95 backdrop-blur-md -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-2.5 pb-2.5 sm:pt-3 sm:pb-3 border-b border-slate-200/80 shadow-xs space-y-2.5 sm:space-y-3">
        {/* Phone View: Horizontally Scrollable Circular Cards */}
        <div className="flex sm:hidden items-center gap-2.5 overflow-x-auto no-scrollbar py-1 px-0.5 scroll-smooth snap-x">
          {kpiItems.map((item) => {
            const Icon = item.icon;
            const isSelected = statusFilter === item.key;
            return (
              <button
                key={`phone-${item.label}`}
                type="button"
                onClick={() => setStatusFilter((prev) => (prev === item.key ? 'all' : item.key))}
                title={`Filter by ${item.label}`}
                className={cn(
                  'group shrink-0 w-[72px] h-[72px] rounded-full aspect-square snap-start flex flex-col items-center justify-center p-1 border transition-all duration-200 cursor-pointer select-none text-center',
                  isSelected
                    ? item.activeStyle
                    : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/70 text-slate-700 shadow-2xs'
                )}
              >
                <Icon
                  size={13}
                  weight={isSelected ? 'fill' : 'bold'}
                  className={cn(
                    'shrink-0 mb-0.5 transition-colors',
                    isSelected ? item.activeIcon : item.color
                  )}
                />
                <span
                  className={cn(
                    'text-base font-black tracking-tight leading-none',
                    isSelected ? item.activeText : 'text-slate-800'
                  )}
                >
                  {item.value}
                </span>
                <span
                  className={cn(
                    'text-[8.5px] font-semibold tracking-tight mt-0.5 max-w-[62px] truncate px-0.5 text-center leading-tight',
                    isSelected ? item.activeSub : 'text-slate-500'
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Desktop View: Full 5 Rounded KPI Cards in a Grid */}
        <div className="hidden sm:grid sm:grid-cols-5 sm:gap-3">
          {kpiItems.map((item) => {
            const Icon = item.icon;
            const isSelected = statusFilter === item.key;
            return (
              <button
                key={`desktop-${item.label}`}
                type="button"
                onClick={() => setStatusFilter((prev) => (prev === item.key ? 'all' : item.key))}
                className={cn(
                  'p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between gap-3',
                  isSelected
                    ? item.activeDesktopStyle
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 shadow-2xs'
                )}
              >
                <div>
                  <div
                    className={cn(
                      'text-xs font-semibold',
                      isSelected ? item.activeDesktopText : 'text-slate-500'
                    )}
                  >
                    {item.desktopLabel}
                  </div>
                  <div
                    className={cn(
                      'text-2xl font-black mt-0.5 tracking-tight',
                      isSelected ? item.activeDesktopText : 'text-slate-800'
                    )}
                  >
                    {item.value}
                  </div>
                </div>
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                    isSelected ? item.activeDesktopIconBg : 'bg-slate-100 text-slate-600'
                  )}
                >
                  <Icon
                    size={20}
                    weight={isSelected ? 'fill' : 'bold'}
                    className={isSelected ? 'text-white' : item.color}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* 3. Controls Row: Both Filters On The Exact Same Row */}
        <div className="flex items-center justify-between gap-2 w-full pt-0.5">
          {/* Left: Day-Week-Month on calendar view (no icons) OR Status Indicator on list view */}
          <div className="flex items-center gap-2 min-w-0">
            {pageView === 'calendar' ? (
              <>
                {/* Day-Week-Month selector: NO ICONS */}
                <div className="flex items-center bg-slate-200/60 rounded-xl p-0.5 border border-slate-200/80 shrink-0">
                  {(['day', 'week', 'month'] as const).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setCalendarView(key)}
                      className={cn(
                        'px-2.5 py-1 sm:px-3 sm:py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer select-none',
                        calendarView === key
                          ? 'bg-white text-indigo-600 shadow-xs font-bold'
                          : 'text-slate-500 hover:text-slate-700'
                      )}
                    >
                      {key}
                    </button>
                  ))}
                </div>

                {/* On desktop, show the status filter text beside Day-Week-Month */}
                <div className="hidden md:block text-xs font-semibold text-slate-500 truncate ml-2">
                  {statusFilter === 'all' ? (
                    <span>Showing all tasks</span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      Filtered by: <strong className="text-indigo-700 capitalize">{statusFilter.replace('_', ' ')}</strong>
                      <button
                        type="button"
                        onClick={() => setStatusFilter('all')}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 underline ml-0.5 cursor-pointer font-bold"
                      >
                        Clear
                      </button>
                    </span>
                  )}
                </div>
              </>
            ) : (
              <div className="text-xs font-semibold text-slate-500 truncate">
                {statusFilter === 'all' ? (
                  <span>Showing all tasks</span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <span>Filtered:</span>
                    <strong className="text-indigo-700 capitalize">{statusFilter.replace('_', ' ')}</strong>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('all')}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 underline ml-0.5 cursor-pointer font-bold"
                    >
                      Clear
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right: Calendar / List toggle + Clear Filter button for mobile if filtered */}
          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            {statusFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className="md:hidden flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200 cursor-pointer"
                title="Clear status filter"
              >
                <span>Clear</span>
                <span className="text-indigo-400 font-normal">✕</span>
              </button>
            )}

            <div className="flex items-center bg-slate-200/60 rounded-xl p-0.5 border border-slate-200/80 shrink-0">
              <button
                type="button"
                onClick={() => setPageView('calendar')}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none',
                  pageView === 'calendar'
                    ? 'bg-white text-indigo-600 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                <CalendarBlank size={13} weight={pageView === 'calendar' ? 'bold' : 'regular'} />
                <span>Calendar</span>
              </button>
              <button
                type="button"
                onClick={() => setPageView('list')}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none',
                  pageView === 'list'
                    ? 'bg-white text-indigo-600 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                <ListBullets size={13} weight={pageView === 'list' ? 'bold' : 'regular'} />
                <span>List</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Content Area: Calendar or List view */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 pt-2">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !tasks.length ? (
        <div className="card">
          <EmptyState
            icon={CheckSquare}
            title="No tasks"
            description="Create tasks and assign them to Fellows in your division."
            action={{ label: 'Create Task', onClick: () => router.push('/pc/tasks/new') }}
          />
        </div>
      ) : (
        <>
          {/* Calendar view */}
          {pageView === 'calendar' && (
            <MobileCalendar
              tasks={filteredTasks}
              view={calendarView}
              onViewChange={setCalendarView}
              onStatusUpdate={updateStatus}
            />
          )}

          {/* List view */}
          {pageView === 'list' && (
            <div className="space-y-4 pt-1">
              {!filteredTasks.length ? (
                <div className="card p-8 text-center text-slate-500 text-sm">
                  No tasks found in this status category.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={handleEdit}
                      onDelete={() => setTaskToDelete(task)}
                      onStatusUpdate={updateStatus}
                    />
                  ))}
                </div>
              )}
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
                className="flex-1 py-2.5 rounded-[var(--radius)] text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-[var(--radius)] text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 btn-press cursor-pointer"
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
