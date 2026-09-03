'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn, taskPriorityLabel, taskStatusLabel } from '@/lib/utils/formatters';
import type { Task } from '@/types/models';
import {
  CaretLeft,
  CaretRight,
  CalendarBlank,
  X,
  User,
  Rows,
  GridFour,
  CalendarDots,
} from '@phosphor-icons/react';

// ─── Types ────────────────────────────────────────────────────────────────────

type CalendarView = 'month' | 'week' | 'day';

interface MobileCalendarProps {
  tasks: Task[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const SHORT_MONTH = MONTH_NAMES.map(m => m.slice(0, 3));
const DAY_NAMES_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_NAMES_MED = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoToDate(str: string) {
  return new Date(str.substring(0, 10));
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function taskActiveOnDay(task: Task, day: Date) {
  const start = isoToDate(task.startDate);
  const end = isoToDate(task.endDate);
  return day >= start && day <= end;
}

function formatShortDate(str: string) {
  const d = isoToDate(str);
  return `${d.getDate()} ${SHORT_MONTH[d.getMonth()]} ${d.getFullYear()}`;
}

function getWeekDates(referenceDate: Date): Date[] {
  const d = new Date(referenceDate);
  const day = d.getDay();
  const startOfWeek = new Date(d);
  startOfWeek.setDate(d.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    return date;
  });
}

function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// ─── Color Helpers ────────────────────────────────────────────────────────────

function priorityColor(priority: Task['priority']): string {
  switch (priority) {
    case 'high':   return '#f43f5e';
    case 'medium': return '#f59e0b';
    case 'low':    return '#10b981';
    default:       return '#94a3b8';
  }
}

function priorityBg(priority: Task['priority']): string {
  switch (priority) {
    case 'high':   return 'bg-rose-500';
    case 'medium': return 'bg-amber-400';
    case 'low':    return 'bg-emerald-500';
    default:       return 'bg-slate-400';
  }
}

function priorityLight(priority: Task['priority']): string {
  switch (priority) {
    case 'high':   return 'bg-rose-50 border-rose-200 text-rose-700';
    case 'medium': return 'bg-amber-50 border-amber-200 text-amber-700';
    case 'low':    return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    default:       return 'bg-slate-50 border-slate-200 text-slate-600';
  }
}

function statusPill(status: Task['status']): string {
  switch (status) {
    case 'completed':   return 'bg-emerald-100 text-emerald-700';
    case 'in_progress': return 'bg-indigo-100 text-indigo-700';
    case 'overdue':     return 'bg-rose-100 text-rose-700';
    default:            return 'bg-slate-100 text-slate-600';
  }
}

// ─── ViewTabs ─────────────────────────────────────────────────────────────────

function ViewTabs({
  view,
  onChange,
}: {
  view: CalendarView;
  onChange: (v: CalendarView) => void;
}) {
  const tabs: { key: CalendarView; label: string; Icon: React.ElementType }[] = [
    { key: 'month', label: 'Month', Icon: GridFour },
    { key: 'week',  label: 'Week',  Icon: CalendarDots },
    { key: 'day',   label: 'Day',   Icon: Rows },
  ];

  return (
    <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
      {tabs.map(({ key, label, Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all duration-200',
            view === key
              ? 'bg-white text-indigo-600 shadow-sm shadow-slate-200'
              : 'text-slate-500 hover:text-slate-700',
          )}
        >
          <Icon size={13} weight={view === key ? 'bold' : 'regular'} />
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── EventChip ────────────────────────────────────────────────────────────────

function EventChip({
  task,
  compact = false,
  onClick,
}: {
  task: Task;
  compact?: boolean;
  onClick: (task: Task) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={e => { e.stopPropagation(); onClick(task); }}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onClick(task); } }}
      style={{ borderLeft: `3px solid ${priorityColor(task.priority)}` }}
      className={cn(
        'w-full text-left rounded-r-md pl-1.5 pr-1 truncate transition-all cursor-pointer',
        'bg-white border border-slate-100 shadow-sm',
        'hover:brightness-95 active:scale-[.98]',
        compact ? 'text-[9px] py-px leading-tight' : 'text-[10px] py-0.5 leading-snug',
      )}
    >
      <span className="font-medium text-slate-700 block truncate">{task.name}</span>
    </div>
  );
}

// ─── TaskSheet ────────────────────────────────────────────────────────────────

function TaskSheet({ task, onClose }: { task: Task; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Lock body and AppShell main scroll while modal is active
    const prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const mainEl = document.querySelector('main');
    const prevMainOverflow = mainEl ? mainEl.style.overflow : '';
    if (mainEl) {
      mainEl.style.overflow = 'hidden';
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      if (mainEl) {
        mainEl.style.overflow = prevMainOverflow;
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center sm:justify-center sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" />
      <div
        className={cn(
          'relative w-full bg-white shadow-2xl transition-all',
          // Mobile: bottom roll-up sheet
          'rounded-t-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300',
          // Desktop: centered modal popup
          'sm:rounded-2xl sm:max-w-lg sm:p-6 sm:space-y-5 sm:max-h-[90vh] sm:slide-in-from-bottom-0 sm:zoom-in-95 sm:border sm:border-slate-100'
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile pull indicator bar */}
        <div className="sm:hidden absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-slate-200" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 pt-1 sm:pt-0">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <span className={cn('w-3 h-3 rounded-full shrink-0', priorityBg(task.priority))} />
            <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-snug break-words">
              {task.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors shrink-0 cursor-pointer"
            title="Close"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn(
            'inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border',
            priorityLight(task.priority),
          )}>
            {taskPriorityLabel(task.priority)} Priority
          </span>
          <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', statusPill(task.status))}>
            {taskStatusLabel(task.status)}
          </span>
          {task.isSurveyTask && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">
              Survey Task
            </span>
          )}
          {task.assignedByPc && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              Assigned by PC
            </span>
          )}
        </div>

        {/* Description */}
        {task.description && (
          <div className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-3.5 border border-slate-100/80">
            {task.description}
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-xl p-3.5 space-y-1.5 border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
              <CalendarBlank size={14} className="text-slate-500" />
              Duration
            </div>
            <div className="text-slate-800 text-xs sm:text-sm font-semibold">{formatShortDate(task.startDate)}</div>
            <div className="text-slate-500 text-xs font-medium">→ {formatShortDate(task.endDate)}</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3.5 space-y-1.5 border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
              <User size={14} className="text-slate-500" />
              Assigned to
            </div>
            {task.assignedTo.length === 0 ? (
              <div className="text-slate-400 italic text-xs">Unassigned</div>
            ) : (
              <div className="space-y-1">
                {task.assignedTo.map(a => (
                  <div key={a.id} className="text-slate-800 text-xs sm:text-sm font-semibold truncate flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {a.name.charAt(0)}
                    </span>
                    <span className="truncate">{a.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop footer with Close button */}
        <div className="hidden sm:flex justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── MonthView ────────────────────────────────────────────────────────────────

function MonthView({
  year,
  month,
  tasks,
  selectedDay,
  onSelectDay,
  onTaskClick,
}: {
  year: number;
  month: number;
  tasks: Task[];
  selectedDay: Date | null;
  onSelectDay: (d: Date) => void;
  onTaskClick: (t: Task) => void;
}) {
  const today = new Date();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const totalCells = Math.ceil((startPad + lastDay.getDate()) / 7) * 7;

  const cells: (Date | null)[] = Array.from({ length: totalCells }, (_, i) => {
    const n = i - startPad + 1;
    if (n < 1 || n > lastDay.getDate()) return null;
    return new Date(year, month, n);
  });

  const cellTasks = useMemo(() => {
    const map = new Map<string, Task[]>();
    cells.forEach(day => {
      if (!day) return;
      map.set(day.toDateString(), tasks.filter(t => taskActiveOnDay(t, day)));
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, year, month]);

  const selectedDayTasks = selectedDay
    ? tasks.filter(t => taskActiveOnDay(t, selectedDay))
    : [];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7">
        {DAY_NAMES_SHORT.map((d, i) => (
          <div
            key={i}
            className={cn(
              'text-center text-[11px] font-bold py-1',
              i === 0 || i === 6 ? 'text-rose-400' : 'text-slate-400',
            )}
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-slate-100 rounded-xl overflow-hidden border border-slate-100">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="bg-white min-h-[68px] sm:min-h-[88px]" />;

          const dayTaskList = cellTasks.get(day.toDateString()) ?? [];
          const isToday = sameDay(day, today);
          const isSel = !!selectedDay && sameDay(day, selectedDay);
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          const MAX_SHOW = 2;

          return (
            <div
              key={day.toDateString()}
              role="button"
              tabIndex={0}
              onClick={() => onSelectDay(day)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSelectDay(day); }}
              className={cn(
                'bg-white min-h-[68px] sm:min-h-[88px] flex flex-col items-stretch p-1 sm:p-1.5 transition-colors text-left cursor-pointer',
                isSel && 'bg-indigo-50',
                !isSel && isToday && 'bg-indigo-50/50',
              )}
            >
              <div className="flex items-center justify-center mb-0.5">
                <span
                  className={cn(
                    'w-7 h-7 flex items-center justify-center rounded-full text-[12px] font-bold',
                    isToday
                      ? 'bg-indigo-600 text-white'
                      : isSel
                      ? 'bg-indigo-200 text-indigo-800'
                      : isWeekend
                      ? 'text-rose-400'
                      : 'text-slate-700',
                  )}
                >
                  {day.getDate()}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 flex-1">
                {dayTaskList.slice(0, 3).map(t => (
                  <EventChip key={t.id} task={t} compact onClick={onTaskClick} />
                ))}
                {dayTaskList.length > 3 && (
                  <span className="text-[9px] text-slate-400 font-semibold pl-1">
                    +{dayTaskList.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedDay && (
        <div className="space-y-2 pt-1">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            {selectedDay.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            {selectedDayTasks.length > 0 && (
              <span className="text-xs font-medium text-slate-400">
                {selectedDayTasks.length} task{selectedDayTasks.length !== 1 ? 's' : ''}
              </span>
            )}
          </h3>

          {selectedDayTasks.length === 0 ? (
            <div className="card p-5 text-center">
              <CalendarBlank size={24} className="mx-auto mb-1.5 text-slate-300" />
              <p className="text-sm text-slate-400">No tasks on this day</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedDayTasks.map(task => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => onTaskClick(task)}
                  className="w-full text-left card p-3.5 flex items-center gap-3 hover:shadow-md transition-shadow active:scale-[.99]"
                >
                  <div className={cn('w-1 self-stretch rounded-full shrink-0', priorityBg(task.priority))} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-900 truncate">{task.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', statusPill(task.status))}>
                        {taskStatusLabel(task.status)}
                      </span>
                    </div>
                  </div>
                  <CaretRight size={14} className="text-slate-300 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── WeekView ─────────────────────────────────────────────────────────────────

function WeekView({
  weekDates,
  tasks,
  selectedDay,
  onSelectDay,
  onTaskClick,
}: {
  weekDates: Date[];
  tasks: Task[];
  selectedDay: Date | null;
  onSelectDay: (d: Date) => void;
  onTaskClick: (t: Task) => void;
}) {
  const today = new Date();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 8 * 56;
    }
  }, []);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    weekDates.forEach(day => {
      map.set(day.toDateString(), tasks.filter(t => taskActiveOnDay(t, day)));
    });
    return map;
  }, [tasks, weekDates]);

  const HOUR_HEIGHT = 56;

  const nowTop = sameDay(today, today)
    ? (today.getHours() + today.getMinutes() / 60) * HOUR_HEIGHT
    : null;

  // Find which column (if any) contains today
  const todayColIdx = weekDates.findIndex(d => sameDay(d, today));

  return (
    <div className="flex flex-col">
      {/* Day headers */}
      <div className="flex border-b border-slate-100 bg-white">
        <div className="w-10 shrink-0" />
        {weekDates.map(day => {
          const isToday = sameDay(day, today);
          const isSel = !!selectedDay && sameDay(day, selectedDay);
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          return (
            <button
              key={day.toDateString()}
              type="button"
              onClick={() => onSelectDay(day)}
              className="flex-1 flex flex-col items-center py-2 sm:py-3 gap-0.5"
            >
              <span className={cn(
                'text-[10px] sm:text-xs font-semibold uppercase hidden sm:block',
                isWeekend ? 'text-rose-400' : 'text-slate-400',
              )}>
                {DAY_NAMES_MED[day.getDay()]}
              </span>
              <span className={cn(
                'text-[10px] font-semibold uppercase sm:hidden',
                isWeekend ? 'text-rose-400' : 'text-slate-400',
              )}>
                {DAY_NAMES_MED[day.getDay()].charAt(0)}
              </span>
              <span className={cn(
                'w-7 h-7 flex items-center justify-center rounded-full text-[13px] font-bold',
                isToday
                  ? 'bg-indigo-600 text-white'
                  : isSel
                  ? 'bg-indigo-100 text-indigo-700'
                  : isWeekend
                  ? 'text-rose-400'
                  : 'text-slate-700',
              )}>
                {day.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      {/* Timed grid */}
      <div
        ref={scrollRef}
        className="overflow-y-auto scroll-hide relative"
        style={{ maxHeight: 'min(440px, 60vh)' }}
      >
        <div className="relative flex" style={{ minHeight: `${24 * HOUR_HEIGHT}px` }}>
          {/* Time gutter */}
          <div className="w-10 shrink-0 relative">
            {HOURS.map(h => (
              <div
                key={h}
                className="absolute left-0 right-0 text-right pr-1.5"
                style={{ top: `${h * HOUR_HEIGHT - 6}px` }}
              >
                {h > 0 && (
                  <span className="text-[9px] text-slate-400 font-medium">
                    {h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Hour grid lines + columns */}
          <div className="flex-1 relative">
            {HOURS.map(h => (
              <div
                key={h}
                className="absolute left-0 right-0 border-t border-slate-100"
                style={{ top: `${h * HOUR_HEIGHT}px` }}
              />
            ))}

            {/* Current time line */}
            {nowTop !== null && todayColIdx >= 0 && (
              <div
                className="absolute z-10 pointer-events-none"
                style={{
                  top: `${nowTop}px`,
                  left: `${(todayColIdx / 7) * 100}%`,
                  width: `${(1 / 7) * 100}%`,
                }}
              >
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 -ml-1" />
                  <div className="flex-1 h-px bg-red-500" />
                </div>
              </div>
            )}

            {/* Day columns */}
            <div className="absolute inset-0 flex">
              {weekDates.map((day, colIdx) => {
                const dayTasks = tasksByDay.get(day.toDateString()) ?? [];
                const isSel = !!selectedDay && sameDay(day, selectedDay);
                return (
                  <div
                    key={day.toDateString()}
                    className={cn(
                      'flex-1 relative border-l border-slate-100 cursor-pointer',
                      isSel && 'bg-indigo-50/30',
                    )}
                    onClick={() => onSelectDay(day)}
                    style={{ minHeight: `${24 * HOUR_HEIGHT}px` }}
                  >
                    {dayTasks.map((task, tIdx) => {
                      const startH = 9 + tIdx * 2;
                      return (
                        <button
                          key={task.id}
                          type="button"
                          onClick={e => { e.stopPropagation(); onTaskClick(task); }}
                          style={{
                            top: `${startH * HOUR_HEIGHT + 2}px`,
                            height: `${2 * HOUR_HEIGHT - 4}px`,
                            left: '2px',
                            right: '2px',
                            borderLeft: `3px solid ${priorityColor(task.priority)}`,
                          }}
                          className="absolute rounded-r-lg px-1.5 py-1 text-left overflow-hidden bg-white border border-slate-100 shadow-sm hover:brightness-95 active:scale-[.99] transition-all"
                        >
                          <span className="text-[9px] font-bold text-slate-700 block truncate leading-tight">
                            {task.name}
                          </span>
                          <span className={cn(
                            'text-[8px] font-semibold mt-0.5 block',
                            task.status === 'completed' ? 'text-emerald-600' :
                            task.status === 'overdue' ? 'text-rose-500' :
                            task.status === 'in_progress' ? 'text-indigo-600' : 'text-slate-400',
                          )}>
                            {taskStatusLabel(task.status)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DayView ──────────────────────────────────────────────────────────────────

function DayView({
  day,
  tasks,
  onTaskClick,
}: {
  day: Date;
  tasks: Task[];
  onTaskClick: (t: Task) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dayTasks = tasks.filter(t => taskActiveOnDay(t, day));
  const today = new Date();
  const isToday = sameDay(day, today);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 8 * 64;
    }
  }, [day]);

  const HOUR_HEIGHT = 64;
  const nowTop = isToday
    ? (today.getHours() + today.getMinutes() / 60) * HOUR_HEIGHT
    : null;

  return (
    <div
      ref={scrollRef}
      className="overflow-y-auto scroll-hide relative"
      style={{ maxHeight: 'min(600px, 65vh)' }}
    >
      <div className="relative flex" style={{ minHeight: `${24 * HOUR_HEIGHT}px` }}>
        {/* Time gutter */}
        <div className="w-14 shrink-0 relative">
          {HOURS.map(h => (
            <div
              key={h}
              className="absolute left-0 right-0 text-right pr-2"
              style={{ top: `${h * HOUR_HEIGHT - 7}px` }}
            >
              {h > 0 && (
                <span className="text-[10px] text-slate-400 font-medium leading-none">
                  {h < 12 ? `${h} am` : h === 12 ? '12 pm' : `${h - 12} pm`}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Main area */}
        <div className="flex-1 relative border-l border-slate-100">
          {HOURS.map(h => (
            <div
              key={h}
              className="absolute left-0 right-0 border-t border-slate-100"
              style={{ top: `${h * HOUR_HEIGHT}px` }}
            />
          ))}

          {/* Current time */}
          {nowTop !== null && (
            <div
              className="absolute left-0 right-0 z-10 pointer-events-none"
              style={{ top: `${nowTop}px` }}
            >
              <div className="flex items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.5 shrink-0" />
                <div className="flex-1 h-px bg-red-500" />
              </div>
            </div>
          )}

          {/* Task blocks */}
          {dayTasks.map((task, idx) => {
            const startH = 9 + idx * 2;
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => onTaskClick(task)}
                style={{
                  top: `${startH * HOUR_HEIGHT + 2}px`,
                  height: `${2 * HOUR_HEIGHT - 4}px`,
                  left: '4px',
                  right: '4px',
                  borderLeft: `4px solid ${priorityColor(task.priority)}`,
                }}
                className="absolute rounded-r-xl px-3 py-2 text-left overflow-hidden bg-white border border-slate-100 shadow-md hover:shadow-lg active:scale-[.99] transition-all"
              >
                <span className="text-xs font-bold text-slate-800 block truncate leading-tight">
                  {task.name}
                </span>
                {task.description && (
                  <span className="text-[10px] text-slate-400 block mt-0.5 line-clamp-2">
                    {task.description}
                  </span>
                )}
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className={cn('text-[9px] font-semibold px-1.5 py-0.5 rounded-full', statusPill(task.status))}>
                    {taskStatusLabel(task.status)}
                  </span>
                  {task.assignedTo.length > 0 && (
                    <span className="flex items-center gap-0.5 text-[9px] text-slate-400 font-medium">
                      <User size={9} />
                      {task.assignedTo[0].name.split(' ')[0]}
                    </span>
                  )}
                </div>
              </button>
            );
          })}

          {dayTasks.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <CalendarBlank size={28} className="mx-auto text-slate-200 mb-1" />
                <p className="text-xs text-slate-300 font-medium">No tasks today</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main MobileCalendar ──────────────────────────────────────────────────────

export default function MobileCalendar({ tasks }: MobileCalendarProps) {
  const today = new Date();

  const [view, setView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState(today);
  const [selectedDay, setSelectedDay] = useState<Date | null>(today);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  const goNext = () => {
    if (view === 'month') {
      setCurrentDate(prev => {
        const d = new Date(prev);
        d.setMonth(d.getMonth() + 1);
        return d;
      });
    } else if (view === 'week') {
      setCurrentDate(prev => addDays(prev, 7));
    } else {
      const next = addDays(selectedDay ?? today, 1);
      setSelectedDay(next);
      setCurrentDate(next);
    }
  };

  const goPrev = () => {
    if (view === 'month') {
      setCurrentDate(prev => {
        const d = new Date(prev);
        d.setMonth(d.getMonth() - 1);
        return d;
      });
    } else if (view === 'week') {
      setCurrentDate(prev => addDays(prev, -7));
    } else {
      const prev = addDays(selectedDay ?? today, -1);
      setSelectedDay(prev);
      setCurrentDate(prev);
    }
  };

  const goToday = () => {
    setCurrentDate(today);
    setSelectedDay(today);
  };

  const monthTaskCount = useMemo(() => tasks.filter(t => {
    const start = isoToDate(t.startDate);
    const end = isoToDate(t.endDate);
    const mStart = new Date(year, month, 1);
    const mEnd = new Date(year, month + 1, 0);
    return start <= mEnd && end >= mStart;
  }).length, [tasks, year, month]);

  const headerTitle = useMemo(() => {
    if (view === 'month') return `${MONTH_NAMES[month]} ${year}`;
    if (view === 'week') {
      const first = weekDates[0];
      const last = weekDates[6];
      if (first.getMonth() === last.getMonth()) {
        return `${SHORT_MONTH[first.getMonth()]} ${first.getFullYear()}`;
      }
      return `${SHORT_MONTH[first.getMonth()]} – ${SHORT_MONTH[last.getMonth()]} ${last.getFullYear()}`;
    }
    const d = selectedDay ?? today;
    return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  }, [view, month, year, weekDates, selectedDay]);

  return (
    <div className="relative">
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-6 pt-4 pb-3 border-b border-slate-100 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">{headerTitle}</h2>
              {view === 'month' && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {monthTaskCount} task{monthTaskCount !== 1 ? 's' : ''} this month
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={goPrev}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <CaretLeft size={14} weight="bold" className="text-slate-500" />
              </button>
              <button
                type="button"
                onClick={goToday}
                className="px-2.5 h-8 rounded-xl bg-indigo-600 text-white text-[11px] font-bold hover:bg-indigo-700 transition-colors"
              >
                Today
              </button>
              <button
                type="button"
                onClick={goNext}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <CaretRight size={14} weight="bold" className="text-slate-500" />
              </button>
            </div>
          </div>

          <div className="sm:max-w-xs">
            <ViewTabs view={view} onChange={setView} />
          </div>
        </div>

        {/* View body */}
        <div className={cn('p-4 sm:p-6', (view === 'week' || view === 'day') && 'p-0 sm:p-0')}>
          {view === 'month' && (
            <MonthView
              year={year}
              month={month}
              tasks={tasks}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              onTaskClick={setActiveTask}
            />
          )}
          {view === 'week' && (
            <WeekView
              weekDates={weekDates}
              tasks={tasks}
              selectedDay={selectedDay}
              onSelectDay={d => { setSelectedDay(d); setCurrentDate(d); }}
              onTaskClick={setActiveTask}
            />
          )}
          {view === 'day' && (
            <DayView
              day={selectedDay ?? today}
              tasks={tasks}
              onTaskClick={setActiveTask}
            />
          )}
        </div>
      </div>

      {/* Priority legend */}
      <div className="flex items-center gap-4 px-1 mt-3">
        {[
          { label: 'High', bg: 'bg-rose-500' },
          { label: 'Medium', bg: 'bg-amber-400' },
          { label: 'Low', bg: 'bg-emerald-500' },
        ].map(p => (
          <span key={p.label} className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className={cn('w-2 h-2 rounded-full', p.bg)} />
            {p.label}
          </span>
        ))}
      </div>

      {/* Task detail bottom sheet */}
      {activeTask && (
        <TaskSheet task={activeTask} onClose={() => setActiveTask(null)} />
      )}
    </div>
  );
}
