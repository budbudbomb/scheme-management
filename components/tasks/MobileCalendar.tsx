'use client';

import { useState, useMemo } from 'react';
import { cn, taskPriorityLabel, taskStatusLabel } from '@/lib/utils/formatters';
import type { Task } from '@/types/models';
import TaskCard from './TaskCard';
import {
  CaretLeft,
  CaretRight,
  CalendarBlank,
  Rows,
  GridFour,
  CalendarDots,
} from '@phosphor-icons/react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CalendarView = 'day' | 'week' | 'month';

export interface MobileCalendarProps {
  tasks: Task[];
  view?: CalendarView;
  onViewChange?: (v: CalendarView) => void;
  onStatusUpdate?: (taskId: string, status: Task['status'], comment?: string) => Promise<void> | void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const SHORT_MONTH = MONTH_NAMES.map(m => m.slice(0, 3));
const DAY_NAMES_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_NAMES_MED = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
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

// ─── ViewTabs (Day - Week - Month) ──────────────────────────────────────────

export function ViewTabs({
  view,
  onChange,
}: {
  view: CalendarView;
  onChange: (v: CalendarView) => void;
}) {
  const tabs: { key: CalendarView; label: string; Icon: React.ElementType }[] = [
    { key: 'day',   label: 'Day',   Icon: Rows },
    { key: 'week',  label: 'Week',  Icon: CalendarDots },
    { key: 'month', label: 'Month', Icon: GridFour },
  ];

  return (
    <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 shadow-2xs border border-slate-200/50">
      {tabs.map(({ key, label, Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer',
            view === key
              ? 'bg-white text-indigo-600 shadow-sm shadow-slate-200'
              : 'text-slate-500 hover:text-slate-700',
          )}
        >
          <Icon size={13} weight={view === key ? 'bold' : 'regular'} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── MonthView ────────────────────────────────────────────────────────────────

function MonthView({
  year,
  month,
  tasks,
  selectedDay,
  onSelectDay,
  onStatusUpdate,
}: {
  year: number;
  month: number;
  tasks: Task[];
  selectedDay: Date | null;
  onSelectDay: (d: Date) => void;
  onStatusUpdate?: (taskId: string, status: Task['status'], comment?: string) => Promise<void> | void;
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
  }, [tasks, year, month]);

  const selectedDayTasks = selectedDay
    ? tasks.filter(t => taskActiveOnDay(t, selectedDay))
    : [];

  return (
    <div className="space-y-4">
      {/* Weekday Header */}
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

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-px bg-slate-100 rounded-2xl overflow-hidden border border-slate-100">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="bg-white min-h-[64px] sm:min-h-[80px]" />;

          const dayTaskList = cellTasks.get(day.toDateString()) ?? [];
          const isToday = sameDay(day, today);
          const isSel = !!selectedDay && sameDay(day, selectedDay);
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;

          return (
            <div
              key={day.toDateString()}
              role="button"
              tabIndex={0}
              onClick={() => onSelectDay(day)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSelectDay(day); }}
              className={cn(
                'bg-white min-h-[64px] sm:min-h-[80px] flex flex-col items-stretch p-1 sm:p-1.5 transition-colors text-left cursor-pointer select-none',
                isSel && 'bg-indigo-50/90 ring-1 ring-inset ring-indigo-300',
                !isSel && isToday && 'bg-indigo-50/40',
              )}
            >
              <div className="flex items-center justify-center mb-1">
                <span
                  className={cn(
                    'w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-[11px] sm:text-[12px] font-bold',
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

              {/* Task badges */}
              <div className="space-y-0.5 min-w-0">
                {dayTaskList.slice(0, 2).map((t) => (
                  <div
                    key={t.id}
                    className="w-full text-[9px] px-1 py-0.5 rounded font-medium truncate bg-slate-100/90 text-slate-700 border-l-2 border-indigo-600"
                  >
                    {t.name}
                  </div>
                ))}
                {dayTaskList.length > 2 && (
                  <span className="text-[8.5px] font-bold text-slate-400 block px-1">
                    +{dayTaskList.length - 2} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Day Task Cards list */}
      {selectedDay && (
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-800">
              {selectedDay.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {selectedDayTasks.length} {selectedDayTasks.length === 1 ? 'task' : 'tasks'}
            </span>
          </div>

          {selectedDayTasks.length === 0 ? (
            <div className="p-6 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
              <CalendarBlank size={28} className="mx-auto mb-1 text-slate-300" />
              <p className="text-xs font-semibold text-slate-500">No tasks on this day</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {selectedDayTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusUpdate={onStatusUpdate}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── WeekView (No Hourly Slots, Clean Daily Tasks) ────────────────────────────

function WeekView({
  weekDates,
  tasks,
  selectedDay,
  onSelectDay,
  onStatusUpdate,
}: {
  weekDates: Date[];
  tasks: Task[];
  selectedDay: Date | null;
  onSelectDay: (d: Date) => void;
  onStatusUpdate?: (taskId: string, status: Task['status'], comment?: string) => Promise<void> | void;
}) {
  const today = new Date();
  const currentDay = selectedDay ?? today;

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    weekDates.forEach(day => {
      map.set(day.toDateString(), tasks.filter(t => taskActiveOnDay(t, day)));
    });
    return map;
  }, [tasks, weekDates]);

  const activeDayTasks = tasksByDay.get(currentDay.toDateString()) ?? [];

  return (
    <div className="flex flex-col">
      {/* 7-Day Header Selector Strip */}
      <div className="grid grid-cols-7 border-b border-slate-100 bg-white p-2 gap-1 sm:gap-2">
        {weekDates.map(day => {
          const isToday = sameDay(day, today);
          const isSel = sameDay(day, currentDay);
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          const dayCount = (tasksByDay.get(day.toDateString()) ?? []).length;

          return (
            <button
              key={day.toDateString()}
              type="button"
              onClick={() => onSelectDay(day)}
              className={cn(
                'flex flex-col items-center py-2 px-1 rounded-xl transition-all duration-200 cursor-pointer text-center relative border',
                isSel
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-200'
                  : isToday
                  ? 'bg-indigo-50/70 border-indigo-200 text-slate-800'
                  : 'bg-white border-transparent hover:bg-slate-50 text-slate-700'
              )}
            >
              <span
                className={cn(
                  'text-[10px] sm:text-xs font-semibold uppercase',
                  isSel ? 'text-indigo-100' : isWeekend ? 'text-rose-400' : 'text-slate-400'
                )}
              >
                {DAY_NAMES_MED[day.getDay()]}
              </span>
              <span
                className={cn(
                  'text-sm sm:text-base font-black my-0.5',
                  isSel ? 'text-white' : 'text-slate-800'
                )}
              >
                {day.getDate()}
              </span>
              {/* Task count pill or subtle dot */}
              {dayCount > 0 ? (
                <span
                  className={cn(
                    'text-[9px] font-extrabold px-1.5 py-0.2 rounded-full leading-tight',
                    isSel ? 'bg-white text-indigo-700' : 'bg-indigo-100 text-indigo-700'
                  )}
                >
                  {dayCount}
                </span>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-200 my-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Week Content Area - Clean Tasks List for the Selected Day */}
      <div className="p-4 sm:p-6 space-y-4">
        {/* Selected day summary banner */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-bold text-slate-900">
              {currentDay.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            {sameDay(currentDay, today) && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                Today
              </span>
            )}
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full shrink-0">
            {activeDayTasks.length} {activeDayTasks.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>

        {/* Selected day tasks */}
        {activeDayTasks.length === 0 ? (
          <div className="py-12 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 p-6">
            <CalendarBlank size={36} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No tasks on this day</p>
            <p className="text-xs text-slate-400 mt-0.5">Select another day in the week above to view its tasks.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {activeDayTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusUpdate={onStatusUpdate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DayView (No Hourly Slots, Clean Daily Tasks) ─────────────────────────────

function DayView({
  day,
  tasks,
  onStatusUpdate,
}: {
  day: Date;
  tasks: Task[];
  onStatusUpdate?: (taskId: string, status: Task['status'], comment?: string) => Promise<void> | void;
}) {
  const dayTasks = tasks.filter(t => taskActiveOnDay(t, day));
  const today = new Date();
  const isToday = sameDay(day, today);

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Day summary header */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-sm sm:text-base font-bold text-slate-900">
            {day.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          {isToday && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
              Today
            </span>
          )}
        </div>
        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full shrink-0">
          {dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'}
        </span>
      </div>

      {/* Task cards list for this day */}
      {dayTasks.length === 0 ? (
        <div className="py-12 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 p-6">
          <CalendarBlank size={36} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-700">No tasks scheduled for this day</p>
          <p className="text-xs text-slate-400 mt-0.5">There are no active tasks or surveys assigned for this date.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {dayTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusUpdate={onStatusUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main MobileCalendar ──────────────────────────────────────────────────────

export default function MobileCalendar({
  tasks,
  view: externalView,
  onViewChange,
  onStatusUpdate,
}: MobileCalendarProps) {
  const today = new Date();

  const [internalView, setInternalView] = useState<CalendarView>('day');
  const view = externalView ?? internalView;
  const setView = onViewChange ?? setInternalView;

  const [currentDate, setCurrentDate] = useState(today);
  const [selectedDay, setSelectedDay] = useState<Date | null>(today);

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
        {/* Header with date on left and only < > buttons on right */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-100">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">{headerTitle}</h2>
              {view === 'month' && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {monthTaskCount} task{monthTaskCount !== 1 ? 's' : ''} this month
                </p>
              )}
            </div>
            {/* Nav buttons: < > only without Today button */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={goPrev}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                title="Previous"
              >
                <CaretLeft size={14} weight="bold" className="text-slate-600" />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                title="Next"
              >
                <CaretRight size={14} weight="bold" className="text-slate-600" />
              </button>
            </div>
          </div>
        </div>

        {/* View body without any hourly timeline */}
        <div>
          {view === 'month' && (
            <div className="p-4 sm:p-6">
              <MonthView
                year={year}
                month={month}
                tasks={tasks}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
                onStatusUpdate={onStatusUpdate}
              />
            </div>
          )}
          {view === 'week' && (
            <WeekView
              weekDates={weekDates}
              tasks={tasks}
              selectedDay={selectedDay}
              onSelectDay={d => { setSelectedDay(d); setCurrentDate(d); }}
              onStatusUpdate={onStatusUpdate}
            />
          )}
          {view === 'day' && (
            <DayView
              day={selectedDay ?? today}
              tasks={tasks}
              onStatusUpdate={onStatusUpdate}
            />
          )}
        </div>
      </div>
    </div>
  );
}
