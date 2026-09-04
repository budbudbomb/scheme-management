'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  FunnelSimple,
  Warning,
  Trash,
  PencilSimple,
  MagnifyingGlass,
  CalendarBlank,
  User,
  Users,
  Clock,
  CheckCircle,
  Hourglass,
  WarningCircle,
  X,
  ClipboardText,
  ListBullets,
  SquaresFour,
  CaretDown,
  Eye,
} from '@phosphor-icons/react';
import { tasksApi } from '@/lib/api/tasks';
import type { Task, UserRole, TaskStatus, TaskPriority } from '@/types/models';
import { cn, taskStatusLabel, taskPriorityLabel, formatDate } from '@/lib/utils/formatters';
import { SkeletonTable } from '@/components/shared/SkeletonCard';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import { toast } from 'sonner';

type LayoutMode = 'list' | 'cards';
type TimeFilter = 'all' | 'today' | 'week' | 'month';
type RoleFilter = 'all' | 'pc' | 'fellow' | 'intern';

function priorityBarColor(priority: Task['priority']) {
  switch (priority) {
    case 'high':   return 'bg-rose-500';
    case 'medium': return 'bg-amber-400';
    case 'low':    return 'bg-emerald-400';
    default:       return 'bg-slate-300';
  }
}

function priorityBadge(priority: Task['priority']) {
  switch (priority) {
    case 'high':   return 'text-rose-700 bg-rose-50 border-rose-200';
    case 'medium': return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'low':    return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    default:       return 'text-slate-600 bg-slate-50 border-slate-200';
  }
}

function statusBadge(status: Task['status']) {
  switch (status) {
    case 'completed':   return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'in_progress': return 'text-sky-700 bg-sky-50 border-sky-200';
    case 'overdue':     return 'text-rose-700 bg-rose-50 border-rose-200';
    default:            return 'text-amber-700 bg-amber-50 border-amber-200';
  }
}

function roleBadge(role: string) {
  switch (role) {
    case 'pc':     return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'fellow': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'intern': return 'bg-teal-50 text-teal-700 border-teal-200';
    default:       return 'bg-slate-50 text-slate-600 border-slate-200';
  }
}

function roleName(role: string) {
  switch (role) {
    case 'pc':     return 'PC';
    case 'fellow': return 'Fellow';
    case 'intern': return 'Intern';
    default:       return role;
  }
}

function renderAssigneeBadge(task: Task) {
  const isSelective = task.targetAudience === 'selective';

  if (!isSelective) {
    if (task.targetAudience === 'all_interns' || (!task.targetAudience && task.assignedTo.every(a => a.role === 'intern'))) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200/90 shadow-2xs">
          <Users size={14} weight="bold" className="text-teal-600 shrink-0" />
          <span>All Interns</span>
        </span>
      );
    }
    if (task.targetAudience === 'all_fellows' || (!task.targetAudience && task.assignedTo.every(a => a.role === 'fellow'))) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200/90 shadow-2xs">
          <Users size={14} weight="bold" className="text-indigo-600 shrink-0" />
          <span>All Fellows</span>
        </span>
      );
    }
    if (task.targetAudience === 'all_pcs' || (!task.targetAudience && task.assignedTo.every(a => a.role === 'pc'))) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200/90 shadow-2xs">
          <Users size={14} weight="bold" className="text-purple-600 shrink-0" />
          <span>All Program Coordinators</span>
        </span>
      );
    }
    if (task.targetAudience === 'all') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200/90 shadow-2xs">
          <Users size={14} weight="bold" className="text-blue-600 shrink-0" />
          <span>All Roles</span>
        </span>
      );
    }
  }

  // Selective assignment to specific person(s)
  if (task.assignedTo.length === 0) {
    return <span className="text-slate-400 italic text-[11px]">Unassigned</span>;
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {task.assignedTo.map(a => (
        <div
          key={a.id}
          className="inline-flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 text-xs shadow-2xs"
          title={`Selectively assigned to ${a.name}`}
        >
          <User size={13} className="text-slate-400 shrink-0" />
          <span className="font-semibold text-slate-800 truncate max-w-[120px]">
            {a.name}
          </span>
          <span className={cn('text-[9px] px-1 py-0.2 rounded border font-bold uppercase', roleBadge(a.role))}>
            {roleName(a.role)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AdminTasksPage() {
  const router = useRouter();
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('list');

  // Modals
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await tasksApi.list({ limit: 100 });
      setAllTasks(res.items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleEdit = (task: Task) => {
    router.push('/admin/tasks/new');
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;
    try {
      await tasksApi.delete(taskToDelete.id);
      setAllTasks(prev => prev.filter(t => t.id !== taskToDelete.id));
      if (selectedTask?.id === taskToDelete.id) setSelectedTask(null);
      toast.success(`Task "${taskToDelete.name}" deleted successfully`);
    } catch {
      toast.error('Failed to delete task');
    } finally {
      setTaskToDelete(null);
    }
  };

  // KPI counts across all tasks
  const stats = useMemo(() => {
    const total = allTasks.length;
    const pending = allTasks.filter(t => t.status === 'pending').length;
    const inProgress = allTasks.filter(t => t.status === 'in_progress').length;
    const completed = allTasks.filter(t => t.status === 'completed').length;
    const overdue = allTasks.filter(t => t.status === 'overdue').length;
    return { total, pending, inProgress, completed, overdue };
  }, [allTasks]);

  // Counts by role
  const roleCounts = useMemo(() => {
    const matches = (role: 'pc' | 'fellow' | 'intern') => {
      return allTasks.filter(t => {
        if (role === 'pc' && (t.targetAudience === 'all_pcs' || t.targetAudience === 'all')) return true;
        if (role === 'fellow' && (t.targetAudience === 'all_fellows' || t.targetAudience === 'all')) return true;
        if (role === 'intern' && (t.targetAudience === 'all_interns' || t.targetAudience === 'all')) return true;
        return t.assignedTo.some(a => a.role === role);
      }).length;
    };
    return {
      all: allTasks.length,
      pc: matches('pc'),
      fellow: matches('fellow'),
      intern: matches('intern'),
    };
  }, [allTasks]);

  // Time window filter predicate
  const matchesTime = useCallback((task: Task, filter: TimeFilter) => {
    if (filter === 'all') return true;
    const start = new Date(task.startDate.substring(0, 10));
    const end = new Date(task.endDate.substring(0, 10));
    const now = new Date();

    if (filter === 'today') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      return start <= todayEnd && end >= todayStart;
    }

    if (filter === 'week') {
      const day = now.getDay();
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day, 0, 0, 0);
      const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 6, 23, 59, 59);
      return start <= weekEnd && end >= weekStart;
    }

    if (filter === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      return start <= monthEnd && end >= monthStart;
    }

    return true;
  }, []);

  // Filtered task list
  const filteredTasks = useMemo(() => {
    return allTasks.filter(task => {
      // User type (Role) filter
      if (roleFilter !== 'all') {
        const matchesBroad =
          (roleFilter === 'pc' && (task.targetAudience === 'all_pcs' || task.targetAudience === 'all')) ||
          (roleFilter === 'fellow' && (task.targetAudience === 'all_fellows' || task.targetAudience === 'all')) ||
          (roleFilter === 'intern' && (task.targetAudience === 'all_interns' || task.targetAudience === 'all'));
        const matchesIndividual = task.assignedTo.some(a => a.role === roleFilter);
        if (!matchesBroad && !matchesIndividual) return false;
      }

      // Time filter
      if (!matchesTime(task, timeFilter)) return false;

      // Status filter
      if (statusFilter && task.status !== statusFilter) return false;

      // Priority filter
      if (priorityFilter && task.priority !== priorityFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = task.name.toLowerCase().includes(q);
        const matchesDesc = task.description?.toLowerCase().includes(q) ?? false;
        const matchesAssignee = task.assignedTo.some(a => a.name.toLowerCase().includes(q));
        const matchesTarget = task.targetAudience?.toLowerCase().includes(q) ?? false;
        if (!matchesName && !matchesDesc && !matchesAssignee && !matchesTarget) return false;
      }

      return true;
    });
  }, [allTasks, roleFilter, timeFilter, statusFilter, priorityFilter, searchQuery, matchesTime]);

  const hasActiveFilters = roleFilter !== 'all' || timeFilter !== 'all' || statusFilter !== '' || priorityFilter !== '' || searchQuery !== '';

  const clearAllFilters = () => {
    setRoleFilter('all');
    setTimeFilter('all');
    setStatusFilter('');
    setPriorityFilter('');
    setSearchQuery('');
  };

  return (
    <div className="space-y-4">
      {/* Frozen / Sticky Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md pt-1 pb-3.5 -mx-4 sm:-mx-6 px-4 sm:px-6 border-b border-slate-100 shadow-2xs">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight truncate">
              Task Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 line-clamp-1 sm:line-clamp-none">
              Create, assign, and track tasks across Program Coordinators, Fellows, and Interns state-wide
            </p>
          </div>

          {/* "+ Task" button moved to top right */}
          <Link
            href="/admin/tasks/new"
            id="create-task-btn"
            className="flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all shrink-0 shadow-xs cursor-pointer"
            title="Create Task"
          >
            <Plus size={15} weight="bold" />
            <span>Task</span>
          </Link>
        </div>
      </div>

      {/* Horizontally Scrollable Circular KPI Cards (4 visible on phone, 5th scrollable) */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 overflow-x-auto no-scrollbar py-1 px-0.5 scroll-smooth snap-x">
        {[
          {
            key: '',
            label: 'Total',
            value: stats.total,
            icon: ClipboardText,
            color: 'text-slate-600',
            activeStyle: 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-400/50',
            activeText: 'text-white',
            activeSub: 'text-slate-300',
            activeIcon: 'text-white',
          },
          {
            key: 'pending',
            label: 'Pending',
            value: stats.pending,
            icon: Hourglass,
            color: 'text-amber-500',
            activeStyle: 'bg-amber-500 text-white border-amber-500 shadow-md ring-2 ring-amber-300/60',
            activeText: 'text-white',
            activeSub: 'text-amber-100',
            activeIcon: 'text-white',
          },
          {
            key: 'in_progress',
            label: 'In Progress',
            value: stats.inProgress,
            icon: Clock,
            color: 'text-sky-500',
            activeStyle: 'bg-sky-500 text-white border-sky-500 shadow-md ring-2 ring-sky-300/60',
            activeText: 'text-white',
            activeSub: 'text-sky-100',
            activeIcon: 'text-white',
          },
          {
            key: 'completed',
            label: 'Done',
            value: stats.completed,
            icon: CheckCircle,
            color: 'text-emerald-600',
            activeStyle: 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300/60',
            activeText: 'text-white',
            activeSub: 'text-emerald-100',
            activeIcon: 'text-white',
          },
          {
            key: 'overdue',
            label: 'Overdue',
            value: stats.overdue,
            icon: WarningCircle,
            color: 'text-rose-500',
            activeStyle: 'bg-rose-500 text-white border-rose-500 shadow-md ring-2 ring-rose-300/60',
            activeText: 'text-white',
            activeSub: 'text-rose-100',
            activeIcon: 'text-white',
          },
        ].map(item => {
          const Icon = item.icon;
          const isSelected = statusFilter === item.key;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setStatusFilter(prev => prev === item.key ? '' : item.key);
              }}
              title={`Filter by ${item.label}`}
              className={cn(
                'group shrink-0 w-[74px] h-[74px] sm:w-[82px] sm:h-[82px] rounded-full aspect-square snap-start flex flex-col items-center justify-center p-1 border transition-all duration-200 cursor-pointer select-none text-center',
                isSelected
                  ? item.activeStyle
                  : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/70 text-slate-700 shadow-2xs'
              )}
            >
              {/* Micro Icon */}
              <Icon
                size={12}
                weight={isSelected ? 'fill' : 'bold'}
                className={cn(
                  'shrink-0 mb-0.5 transition-colors',
                  isSelected ? item.activeIcon : item.color
                )}
              />

              {/* Metric Number */}
              <span
                className={cn(
                  'text-base sm:text-lg font-black tracking-tight leading-none',
                  isSelected ? item.activeText : 'text-slate-800'
                )}
              >
                {item.value}
              </span>

              {/* Label Subtext */}
              <span
                className={cn(
                  'text-[8.5px] sm:text-[9.5px] font-semibold tracking-tight mt-0.5 max-w-[62px] truncate px-0.5 text-center leading-tight',
                  isSelected ? item.activeSub : 'text-slate-500'
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Primary Filters Toolbar (Ultra-compact single-row) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-1.5 sm:p-2 shadow-2xs flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
        {/* Search input */}
        <div className="relative flex-1 min-w-[150px] sm:min-w-[220px]">
          <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search tasks, descriptions, assignees..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-7 py-2 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-white focus:bg-white placeholder:text-slate-400 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Role Filter Dropdown */}
        <div className="relative shrink-0">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value as RoleFilter)}
            className={cn(
              "text-xs font-semibold py-2 pl-2.5 pr-7 rounded-xl border appearance-none cursor-pointer transition-colors focus:outline-none focus:ring-1.5 focus:ring-indigo-500",
              roleFilter !== 'all'
                ? "bg-indigo-50 text-indigo-700 border-indigo-200 ring-1 ring-indigo-200"
                : "bg-slate-50/70 hover:bg-white text-slate-700 border-slate-200/90"
            )}
          >
            <option value="all">Role: All ({roleCounts.all})</option>
            <option value="pc">PCs ({roleCounts.pc})</option>
            <option value="fellow">Fellows ({roleCounts.fellow})</option>
            <option value="intern">Interns ({roleCounts.intern})</option>
          </select>
          <CaretDown size={11} weight="bold" className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
        </div>

        {/* Time Period Filter Dropdown */}
        <div className="relative shrink-0">
          <select
            value={timeFilter}
            onChange={e => setTimeFilter(e.target.value as TimeFilter)}
            className={cn(
              "text-xs font-semibold py-2 pl-2.5 pr-7 rounded-xl border appearance-none cursor-pointer transition-colors focus:outline-none focus:ring-1.5 focus:ring-indigo-500",
              timeFilter !== 'all'
                ? "bg-indigo-50 text-indigo-700 border-indigo-200 ring-1 ring-indigo-200"
                : "bg-slate-50/70 hover:bg-white text-slate-700 border-slate-200/90"
            )}
          >
            <option value="all">Time: All</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <CaretDown size={11} weight="bold" className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
        </div>

        {/* Priority Filter Dropdown */}
        <div className="relative shrink-0">
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className={cn(
              "text-xs font-semibold py-2 pl-2.5 pr-7 rounded-xl border appearance-none cursor-pointer transition-colors focus:outline-none focus:ring-1.5 focus:ring-indigo-500",
              priorityFilter !== ''
                ? "bg-indigo-50 text-indigo-700 border-indigo-200 ring-1 ring-indigo-200"
                : "bg-slate-50/70 hover:bg-white text-slate-700 border-slate-200/90"
            )}
          >
            <option value="">Priority: All</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
          <CaretDown size={11} weight="bold" className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
        </div>

        {/* Reset / Clear filters button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            title="Clear all filters"
            className="shrink-0 flex items-center gap-1 text-xs font-semibold px-2.5 py-2 rounded-xl text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-100 transition-colors whitespace-nowrap cursor-pointer"
          >
            <X size={12} weight="bold" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>

      {/* Task List Header & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 px-1">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="text-slate-800">{filteredTasks.length}</strong> of{' '}
            <strong className="text-slate-800">{allTasks.length}</strong> tasks
          </span>
          {hasActiveFilters && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              Filtered view active
            </span>
          )}
        </div>

        {/* Asana-style List / Cards switcher */}
        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200/80 self-start sm:self-auto shadow-2xs">
          <button
            type="button"
            onClick={() => setLayoutMode('list')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer',
              layoutMode === 'list'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            )}
            title="List / Table View"
          >
            <ListBullets size={14} weight={layoutMode === 'list' ? 'bold' : 'regular'} />
            <span>List</span>
          </button>
          <button
            type="button"
            onClick={() => setLayoutMode('cards')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer',
              layoutMode === 'cards'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            )}
            title="Card Grid View"
          >
            <SquaresFour size={14} weight={layoutMode === 'cards' ? 'bold' : 'regular'} />
            <span>Cards</span>
          </button>
        </div>
      </div>

      {/* Tasks Content List */}
      {loading ? (
        <SkeletonTable rows={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !filteredTasks.length ? (
        <div className="card">
          <EmptyState
            title={hasActiveFilters ? 'No matching tasks' : 'No tasks created yet'}
            description={
              hasActiveFilters
                ? 'Try adjusting your role, time, or status filters to find what you need.'
                : 'Get started by assigning your first task to PCs, Fellows, or Interns.'
            }
            action={
              hasActiveFilters
                ? { label: 'Reset all filters', onClick: clearAllFilters }
                : { label: 'Create Task', onClick: () => router.push('/admin/tasks/new') }
            }
          />
        </div>
      ) : layoutMode === 'list' ? (
        /* Asana-style Structured List View */
        <div className="card overflow-hidden border border-slate-200/80 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider select-none">
                  <th className="py-3 px-3.5 sm:px-4">Task Name</th>
                  <th className="py-3 px-4 hidden sm:table-cell min-w-[170px]">Assignee</th>
                  <th className="py-3 px-4 hidden md:table-cell min-w-[130px]">Due Date</th>
                  <th className="py-3 px-4 hidden lg:table-cell min-w-[110px]">Priority</th>
                  <th className="py-3 px-4 hidden sm:table-cell min-w-[120px]">Status</th>
                  <th className="py-3 px-3.5 sm:px-4 text-right w-14 sm:min-w-[80px]">
                    <span className="sm:hidden">View</span>
                    <span className="hidden sm:inline">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredTasks.map(task => (
                  <tr
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                  >
                    {/* Task Name & Description */}
                    <td className="py-3 sm:py-3.5 px-3.5 sm:px-4">
                      <div className="flex items-center gap-2.5">
                        <span className={cn('w-2 h-2 rounded-full shrink-0', priorityBarColor(task.priority))} />
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5 flex-wrap">
                            <span className="truncate">{task.name}</span>
                            {task.isSurveyTask && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded border font-semibold bg-purple-50 text-purple-700 border-purple-200 shrink-0">
                                Survey
                              </span>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-[11px] text-slate-400 truncate max-w-[210px] sm:max-w-md mt-0.5">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Assignees with Role Badges or User Type */}
                    <td className="py-3.5 px-4 hidden sm:table-cell">
                      {renderAssigneeBadge(task)}
                    </td>

                    {/* Due Date */}
                    <td className="py-3.5 px-4 hidden md:table-cell whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <CalendarBlank size={13} className="text-slate-400 shrink-0" />
                        <span>{formatDate(task.endDate, 'dd MMM yyyy')}</span>
                        {task.status === 'overdue' && (
                          <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1 py-0.5 rounded">
                            Overdue
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4 hidden lg:table-cell whitespace-nowrap">
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border', priorityBadge(task.priority))}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', priorityBarColor(task.priority))} />
                        {taskPriorityLabel(task.priority)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 hidden sm:table-cell whitespace-nowrap">
                      <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border', statusBadge(task.status))}>
                        {taskStatusLabel(task.status)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 sm:py-3.5 px-3.5 sm:px-4 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      {/* Phone View: Eye Button */}
                      <div className="flex sm:hidden items-center justify-end">
                        <button
                          type="button"
                          onClick={() => setSelectedTask(task)}
                          className="p-1.5 rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={17} weight="bold" />
                        </button>
                      </div>

                      {/* Desktop View: Actions */}
                      <div className="hidden sm:flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedTask(task)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(task)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          title="Edit Task"
                        >
                          <PencilSimple size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setTaskToDelete(task)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Task"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View (Grid) */
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTasks.map(task => (
            <div
              key={task.id}
              className="card card-hover flex overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer group"
              onClick={() => setSelectedTask(task)}
            >
              {/* Left priority accent bar */}
              <div className={cn('w-1.5 shrink-0', priorityBarColor(task.priority))} />

              <div className="flex-1 min-w-0 p-4 flex flex-col justify-between">
                <div>
                  {/* Top row: Title + Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-900 text-sm leading-snug group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {task.name}
                    </h3>
                    <div className="flex items-center gap-0.5 shrink-0 -mt-1" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleEdit(task)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        title="Edit Task"
                      >
                        <PencilSimple size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaskToDelete(task)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Task"
                      >
                        <Trash size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  {task.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {task.description}
                    </p>
                  )}

                  {/* Chips: Status + Priority + Survey */}
                  <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border', statusBadge(task.status))}>
                      {taskStatusLabel(task.status)}
                    </span>
                    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border', priorityBadge(task.priority))}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', priorityBarColor(task.priority))} />
                      {taskPriorityLabel(task.priority)}
                    </span>
                    {task.isSurveyTask && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-purple-100 text-purple-800 border-purple-300 shadow-2xs">
                        <ClipboardText size={11} weight="fill" className="text-purple-600" />
                        Survey Task
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Section: Assignees with Role/User Type + Date */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-medium">Assigned to:</span>
                    {renderAssigneeBadge(task)}
                  </div>

                  {/* Date Range */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 font-medium">
                      <CalendarBlank size={13} className="text-slate-400" />
                      {formatDate(task.startDate, 'dd MMM')} → {formatDate(task.endDate, 'dd MMM yyyy')}
                    </span>
                    {task.status === 'overdue' && (
                      <span className="text-rose-600 font-bold text-[10px]">Overdue</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedTask(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] sm:max-h-[90vh] flex flex-col shadow-2xl border border-slate-200/90 animate-in zoom-in-95 duration-200 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-slate-100 bg-white shrink-0">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <span className={cn('w-3 h-3 rounded-full shrink-0', priorityBarColor(selectedTask.priority))} />
                <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-snug line-clamp-2">{selectedTask.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors cursor-pointer shrink-0"
                title="Close"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            {/* Modal Scrollable Body with Visible Scrollbar */}
            <div className="overflow-y-auto p-4 sm:p-6 space-y-4 flex-1 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_#f8fafc]">
              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full border', statusBadge(selectedTask.status))}>
                  {taskStatusLabel(selectedTask.status)}
                </span>
                <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full border', priorityBadge(selectedTask.priority))}>
                  {taskPriorityLabel(selectedTask.priority)} Priority
                </span>
                {selectedTask.isSurveyTask && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-300 shadow-2xs">
                    <ClipboardText size={13} weight="fill" className="text-purple-600" />
                    Survey Task
                  </span>
                )}
              </div>

              {/* Description */}
              {selectedTask.description && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Description</span>
                  <div className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-3.5 border border-slate-100 whitespace-pre-wrap">
                    {selectedTask.description}
                  </div>
                </div>
              )}

              {/* Assignees & Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Timeline & Due Date */}
                <div className="bg-slate-50 rounded-xl p-3.5 space-y-1 border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                    <CalendarBlank size={14} />
                    Timeline & Due Date
                  </div>
                  <div className="text-slate-800 text-xs sm:text-sm font-semibold">
                    {formatDate(selectedTask.startDate, 'dd MMM yyyy')}
                  </div>
                  <div className="text-slate-600 text-xs flex items-center gap-1.5">
                    <span>Due: <strong>{formatDate(selectedTask.endDate, 'dd MMM yyyy')}</strong></span>
                    {selectedTask.status === 'overdue' && (
                      <span className="text-rose-600 bg-rose-50 px-1 py-0.2 rounded font-bold text-[10px]">Overdue</span>
                    )}
                  </div>
                </div>

                {/* Target Audience / Assignment Scope */}
                <div className="bg-slate-50 rounded-xl p-3.5 space-y-1 border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                    <Users size={14} />
                    Target Scope
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-slate-800">
                    {selectedTask.targetAudience === 'all' && 'All Program Roles'}
                    {selectedTask.targetAudience === 'all_pcs' && 'All Program Coordinators'}
                    {selectedTask.targetAudience === 'all_fellows' && 'All Fellows'}
                    {selectedTask.targetAudience === 'all_interns' && 'All Interns'}
                    {(!selectedTask.targetAudience || selectedTask.targetAudience === 'selective') && 'Selective Assignees'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {selectedTask.assignedTo?.length ? `${selectedTask.assignedTo.length} person(s) assigned` : 'Broadcasted task'}
                  </div>
                </div>
              </div>

              {/* Assigned Personnel */}
              <div className="bg-slate-50 rounded-xl p-3.5 space-y-2 border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                  <User size={14} />
                  Assigned Personnel ({selectedTask.assignedTo.length})
                </div>
                {renderAssigneeBadge(selectedTask)}
              </div>

              {/* Created By & Timestamps */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex-wrap gap-2">
                <span>Created by: <strong className="text-slate-600">{selectedTask.createdBy?.name || 'Admin'}</strong></span>
                {selectedTask.createdAt && (
                  <span>Created on: {formatDate(selectedTask.createdAt, 'dd MMM yyyy')}</span>
                )}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-between p-4 bg-slate-50/90 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setTaskToDelete(selectedTask);
                  setSelectedTask(null);
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              >
                <Trash size={14} />
                Delete Task
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleEdit(selectedTask);
                    setSelectedTask(null);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
                >
                  <PencilSimple size={14} />
                  Edit Task
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl transition-colors cursor-pointer shadow-2xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
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
