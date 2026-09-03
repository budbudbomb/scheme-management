'use client';

import { useState, useMemo } from 'react';
import { cn, taskPriorityLabel, taskStatusLabel } from '@/lib/utils/formatters';
import type { Task } from '@/types/models';
import { CaretLeft, CaretRight, CalendarBlank, Clock, User, X } from '@phosphor-icons/react';

interface TaskCalendarProps {
  tasks: Task[];
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function priorityDot(priority: Task['priority']) {
  switch (priority) {
    case 'high':   return 'bg-rose-500';
    case 'medium': return 'bg-amber-400';
    case 'low':    return 'bg-emerald-400';
    default:       return 'bg-slate-400';
  }
}

function statusPill(status: Task['status']) {
  switch (status) {
    case 'completed':   return 'bg-emerald-100 text-emerald-700';
    case 'in_progress': return 'bg-indigo-100 text-indigo-700';
    case 'overdue':     return 'bg-rose-100 text-rose-700';
    default:            return 'bg-slate-100 text-slate-600';
  }
}

function isoToDate(str: string) {
  // Parse YYYY-MM-DD or ISO string to local date
  return new Date(str.substring(0, 10));
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function taskActiveOnDay(task: Task, day: Date) {
  const start = isoToDate(task.startDate);
  const end   = isoToDate(task.endDate);
  return day >= start && day <= end;
}

function isTaskStart(task: Task, day: Date) {
  return sameDay(isoToDate(task.startDate), day);
}

function formatShortDate(str: string) {
  const d = isoToDate(str);
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}

export default function TaskCalendar({ tasks }: TaskCalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  // Build calendar grid
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay(); // 0=Sun

  const totalCells = Math.ceil((startPad + lastDay.getDate()) / 7) * 7;
  const cells: (Date | null)[] = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - startPad + 1;
    if (dayNum < 1 || dayNum > lastDay.getDate()) return null;
    return new Date(year, month, dayNum);
  });

  // Group tasks per cell (tasks active on that day)
  const cellTasks = useMemo(() => {
    const map = new Map<string, Task[]>();
    cells.forEach(day => {
      if (!day) return;
      const key = day.toDateString();
      map.set(key, tasks.filter(t => taskActiveOnDay(t, day)));
    });
    return map;
  }, [cells, tasks]);

  const selectedDayTasks = selectedDay
    ? tasks.filter(t => taskActiveOnDay(t, selectedDay))
    : [];

  const isToday = (d: Date) => sameDay(d, today);
  const isSelected = (d: Date) => !!selectedDay && sameDay(d, selectedDay);

  // Count tasks for the month for the summary strip
  const monthTasks = useMemo(() => tasks.filter(t => {
    const start = isoToDate(t.startDate);
    const end   = isoToDate(t.endDate);
    const mStart = new Date(year, month, 1);
    const mEnd   = new Date(year, month + 1, 0);
    return start <= mEnd && end >= mStart;
  }), [tasks, year, month]);

  return (
    <div className="space-y-4">

      {/* Month header */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{MONTH_NAMES[month]} {year}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{monthTasks.length} tasks this month</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors text-slate-600"
            >
              <CaretLeft size={16} weight="bold" />
            </button>
            <button
              onClick={() => { setMonth(today.getMonth()); setYear(today.getFullYear()); }}
              className="px-3 h-9 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors text-slate-600"
            >
              <CaretRight size={16} weight="bold" />
            </button>
          </div>
        </div>

        {/* Priority legend */}
        <div className="flex items-center gap-4 mb-4 text-xs text-slate-500">
          {[
            { label: 'High', cls: 'bg-rose-500' },
            { label: 'Medium', cls: 'bg-amber-400' },
            { label: 'Low', cls: 'bg-emerald-400' },
          ].map(p => (
            <span key={p.label} className="flex items-center gap-1.5">
              <span className={cn('w-2 h-2 rounded-full', p.cls)} />
              {p.label}
            </span>
          ))}
        </div>

        {/* Day-name header */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_NAMES.map(d => (
            <div key={d} className={cn(
              'text-center text-[11px] font-semibold py-1',
              d === 'Sun' || d === 'Sat' ? 'text-slate-400' : 'text-slate-500'
            )}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} />;

            const dayTaskList = cellTasks.get(day.toDateString()) ?? [];
            const MAX_DOTS = 3;

            return (
              <button
                key={day.toDateString()}
                type="button"
                onClick={() => {
                  setSelectedDay(prev => prev && sameDay(prev, day) ? null : day);
                  setSelectedTask(null);
                }}
                className={cn(
                  'relative flex flex-col items-center rounded-xl py-1.5 px-0.5 transition-all select-none min-h-[52px]',
                  isSelected(day) && 'bg-indigo-600 shadow-lg shadow-indigo-200',
                  isToday(day) && !isSelected(day) && 'bg-indigo-50 ring-2 ring-indigo-400 ring-inset',
                  !isSelected(day) && !isToday(day) && dayTaskList.length > 0 && 'bg-slate-50 hover:bg-slate-100',
                  !isSelected(day) && !isToday(day) && dayTaskList.length === 0 && 'hover:bg-slate-50',
                )}
              >
                <span className={cn(
                  'text-[12px] font-semibold leading-tight',
                  isSelected(day) ? 'text-white' : isToday(day) ? 'text-indigo-700' : 'text-slate-700'
                )}>
                  {day.getDate()}
                </span>

                {/* Task dots */}
                {dayTaskList.length > 0 && (
                  <div className="flex items-center justify-center gap-0.5 mt-1 flex-wrap max-w-full">
                    {dayTaskList.slice(0, MAX_DOTS).map((t, i) => (
                      <span
                        key={t.id + i}
                        className={cn(
                          'w-1.5 h-1.5 rounded-full shrink-0',
                          isSelected(day) ? 'bg-white/70' : priorityDot(t.priority)
                        )}
                      />
                    ))}
                    {dayTaskList.length > MAX_DOTS && (
                      <span className={cn(
                        'text-[8px] font-bold leading-none',
                        isSelected(day) ? 'text-white/80' : 'text-slate-400'
                      )}>+{dayTaskList.length - MAX_DOTS}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day task list */}
      {selectedDay && selectedDayTasks.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-slate-700 px-1">
            {selectedDay.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            <span className="ml-2 text-xs font-medium text-slate-400">{selectedDayTasks.length} task{selectedDayTasks.length !== 1 ? 's' : ''}</span>
          </h3>
          <div className="space-y-2">
            {selectedDayTasks.map(task => (
              <button
                key={task.id}
                type="button"
                onClick={() => setSelectedTask(t => t?.id === task.id ? null : task)}
                className={cn(
                  'w-full text-left card p-3.5 flex items-center gap-3 transition-all',
                  selectedTask?.id === task.id && 'ring-2 ring-indigo-400'
                )}
              >
                <div className={cn('w-1 self-stretch rounded-full shrink-0', priorityDot(task.priority))} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-slate-900 truncate">{task.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', statusPill(task.status))}>
                      {taskStatusLabel(task.status)}
                    </span>
                    {isTaskStart(task, selectedDay) && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                        Starts today
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 text-right shrink-0 leading-relaxed">
                  <div>{task.assignedTo.length > 0 ? task.assignedTo.length === 1 ? task.assignedTo[0].name.split(' ')[0] : `${task.assignedTo.length} people` : '—'}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Expanded task detail panel */}
      {selectedTask && (
        <div className="card p-4 space-y-3 border-2 border-indigo-200 shadow-lg shadow-indigo-50 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={cn('w-2 h-2 rounded-full shrink-0', priorityDot(selectedTask.priority))} />
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                  {taskPriorityLabel(selectedTask.priority)} Priority
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm leading-snug">{selectedTask.name}</h4>
            </div>
            <button
              type="button"
              onClick={() => setSelectedTask(null)}
              className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 shrink-0"
            >
              <X size={16} />
            </button>
          </div>

          {selectedTask.description && (
            <p className="text-xs text-slate-500 leading-relaxed">{selectedTask.description}</p>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 rounded-xl p-2.5 space-y-0.5">
              <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                <CalendarBlank size={12} />
                <span>Duration</span>
              </div>
              <div className="text-slate-700 font-semibold">
                {formatShortDate(selectedTask.startDate)}
              </div>
              <div className="text-slate-400">→ {formatShortDate(selectedTask.endDate)}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-2.5 space-y-0.5">
              <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                <User size={12} />
                <span>Assigned to</span>
              </div>
              {selectedTask.assignedTo.length === 0 ? (
                <div className="text-slate-400 italic">Unassigned</div>
              ) : (
                <div className="flex flex-col gap-0.5">
                  {selectedTask.assignedTo.slice(0, 2).map(a => (
                    <div key={a.id} className="text-slate-700 font-semibold truncate">{a.name}</div>
                  ))}
                  {selectedTask.assignedTo.length > 2 && (
                    <div className="text-slate-400">+{selectedTask.assignedTo.length - 2} more</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className={cn('text-xs font-semibold px-3 py-1.5 rounded-full', statusPill(selectedTask.status))}>
              {taskStatusLabel(selectedTask.status)}
            </span>
            {selectedTask.isSurveyTask && (
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-purple-100 text-purple-700">
                Survey Task
              </span>
            )}
          </div>
        </div>
      )}

      {selectedDay && selectedDayTasks.length === 0 && (
        <div className="card p-6 text-center text-sm text-slate-400">
          <CalendarBlank size={28} className="mx-auto mb-2 opacity-40" />
          No tasks on {selectedDay.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}
        </div>
      )}
    </div>
  );
}
