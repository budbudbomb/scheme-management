'use client';

import { useState, useMemo, useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils/formatters';
import type { Task, Meeting } from '@/types/models';
import { trainingApi } from '@/lib/api/training';
import { MOCK_MEETINGS } from '@/lib/api/mockData';
import TaskCard from './TaskCard';
import {
  CaretLeft,
  CaretRight,
  CalendarBlank,
  Rows,
  GridFour,
  CalendarDots,
  X,
} from '@phosphor-icons/react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CalendarView = 'day' | 'week' | 'month';

export interface MobileCalendarProps {
  tasks: Task[];
  meetings?: Meeting[];
  view?: CalendarView;
  onViewChange?: (v: CalendarView) => void;
  onStatusUpdate?: (taskId: string, status: Task['status'], comment?: string) => Promise<void> | void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
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

const emptySubscribe = () => () => {};

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

/** Converts an online meeting into a standard Task entity */
function meetingToTask(meeting: Meeting): Task {
  const mDate = new Date(meeting.scheduledAt);
  const year = mDate.getFullYear();
  const month = String(mDate.getMonth() + 1).padStart(2, '0');
  const day = String(mDate.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  return {
    id: `meeting-${meeting.id}`,
    name: meeting.title,
    description: meeting.agenda || 'Scheduled virtual conference meeting',
    priority: 'medium',
    status: 'pending',
    startDate: dateStr,
    endDate: dateStr,
    createdBy: meeting.organizer,
    assignedTo: meeting.invitees && meeting.invitees.length > 0 ? meeting.invitees : [meeting.organizer],
    isMeetingTask: true,
    meetingData: meeting,
    createdAt: meeting.createdAt,
    updatedAt: meeting.createdAt,
  };
}

// ─── Roll-up Bottom Sheet Modal ───────────────────────────────────────────────

function DateTasksRollupSheet({
  date,
  isOpen,
  onClose,
  tasks,
  onStatusUpdate,
  onEdit,
  onDelete,
}: {
  date: Date | null;
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onStatusUpdate?: (taskId: string, status: Task['status'], comment?: string) => Promise<void> | void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    // Prevent background scrolling while roll-up sheet is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted || !date) return null;

  const dayTasks = tasks.filter(t => taskActiveOnDay(t, date));
  const today = new Date();
  const isToday = sameDay(date, today);

  const sheetContent = (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-rollup-backdrop cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Roll up sheet card */}
      <div
        className="relative z-10 w-full max-w-2xl mx-auto bg-white rounded-t-[28px] shadow-[0_-12px_40px_rgba(0,0,0,0.22)] border-t border-slate-200 flex flex-col max-h-[82vh] animate-rollup-sheet"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="pt-3 pb-1.5 flex justify-center cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Sheet Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h3>
              {isToday && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                  Today
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              {dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'} for this date
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close tasks sheet"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Sheet Body with Task Cards */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-3 overscroll-contain pb-safe pb-8 custom-scrollbar">
          {dayTasks.length === 0 ? (
            <div className="py-12 px-4 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
              <CalendarBlank size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No tasks on this day</p>
              <p className="text-xs text-slate-400 mt-0.5">There are no active tasks assigned for this date.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dayTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusUpdate={onStatusUpdate}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(sheetContent, document.body);
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
}: {
  year: number;
  month: number;
  tasks: Task[];
  selectedDay: Date | null;
  onSelectDay: (d: Date) => void;
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
  }, [tasks, cells]);

  const selectedDayTasks = selectedDay
    ? tasks.filter(t => taskActiveOnDay(t, selectedDay))
    : [];

  return (
    <div className="space-y-3">
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

      {/* Selected Day Status Bar */}
      {selectedDay && (
        <div className="pt-2 px-1 flex items-center justify-between text-xs text-slate-500">
          <span>
            Selected: <strong className="text-slate-800 font-semibold">{selectedDay.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</strong> ({selectedDayTasks.length} {selectedDayTasks.length === 1 ? 'task' : 'tasks'})
          </span>
        </div>
      )}
    </div>
  );
}

// ─── WeekView (Clean Daily Tasks, No Separate Section) ────────────────────────

// ─── WeekView (Clean 7-Day Calendar Strip Only; Tasks open in Roll-up Sheet) ──

function WeekView({
  weekDates,
  tasks,
  selectedDay,
  onSelectDay,
}: {
  weekDates: Date[];
  tasks: Task[];
  selectedDay: Date | null;
  onSelectDay: (d: Date) => void;
}) {
  const today = new Date();

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    weekDates.forEach(day => {
      map.set(day.toDateString(), tasks.filter(t => taskActiveOnDay(t, day)));
    });
    return map;
  }, [tasks, weekDates]);

  return (
    <div className="flex flex-col p-2 sm:p-4">
      {/* 7-Day Header Selector Strip: Just pure task numbers in pill */}
      <div className="grid grid-cols-7 bg-white p-1 sm:p-2 gap-1 sm:gap-2">
        {weekDates.map(day => {
          const isToday = sameDay(day, today);
          const isSel = selectedDay ? sameDay(day, selectedDay) : false;
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          const dayCount = (tasksByDay.get(day.toDateString()) ?? []).length;

          return (
            <button
              key={day.toDateString()}
              type="button"
              onClick={() => onSelectDay(day)}
              className={cn(
                'flex flex-col items-center py-2.5 px-1 rounded-xl transition-all duration-200 cursor-pointer text-center relative border',
                isSel
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-200'
                  : isToday
                  ? 'bg-indigo-50/70 border-indigo-200 text-slate-800'
                  : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-700'
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

              {/* Task count pill or subtle dot - pure count including any meeting task */}
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
    </div>
  );
}

// ─── DayView (Clean Daily Tasks, No Separate Meeting Section) ──────────────────

function DayView({
  day,
  tasks,
  onStatusUpdate,
  onEdit,
  onDelete,
}: {
  day: Date;
  tasks: Task[];
  onStatusUpdate?: (taskId: string, status: Task['status'], comment?: string) => Promise<void> | void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}) {
  const dayTasks = tasks.filter(t => taskActiveOnDay(t, day));

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Task cards list for this day - all rendered via standard TaskCard */}
      {dayTasks.length === 0 ? (
        <div className="py-12 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 p-6">
          <CalendarBlank size={36} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-700">No tasks scheduled for this day</p>
          <p className="text-xs text-slate-400 mt-0.5">There are no active tasks or meetings assigned for this date.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {dayTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusUpdate={onStatusUpdate}
              onEdit={onEdit}
              onDelete={onDelete}
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
  meetings: externalMeetings,
  view: externalView,
  onViewChange,
  onStatusUpdate,
  onEdit,
  onDelete,
}: MobileCalendarProps) {
  const today = new Date();

  const [internalView] = useState<CalendarView>('day');
  const view = externalView ?? internalView;

  const [currentDate, setCurrentDate] = useState(today);
  const [selectedDay, setSelectedDay] = useState<Date | null>(today);
  const [weekSelectedDay, setWeekSelectedDay] = useState<Date | null>(null);

  // Online meetings state
  const [loadedMeetings, setLoadedMeetings] = useState<Meeting[]>(externalMeetings || MOCK_MEETINGS);

  useEffect(() => {
    if (externalMeetings) {
      setLoadedMeetings(externalMeetings);
      return;
    }
    trainingApi.getMyMeetings()
      .then(res => {
        if (res && res.length > 0) setLoadedMeetings(res);
      })
      .catch(() => {
        setLoadedMeetings(MOCK_MEETINGS);
      });
  }, [externalMeetings]);

  // Combine tasks and meeting tasks into a single unified tasks list (strictly deduplicated by ID)!
  const allTasks = useMemo(() => {
    const seen = new Set<string>();
    const unique: Task[] = [];
    for (const t of tasks) {
      if (!seen.has(t.id)) {
        seen.add(t.id);
        unique.push(t);
      }
    }
    const meetingTasks = loadedMeetings.map(meetingToTask);
    for (const mt of meetingTasks) {
      if (!seen.has(mt.id)) {
        seen.add(mt.id);
        unique.push(mt);
      }
    }
    return unique;
  }, [tasks, loadedMeetings]);

  // Roll-up bottom sheet state for Week and Month views
  const [isRollupOpen, setIsRollupOpen] = useState(false);
  const [rollupDate, setRollupDate] = useState<Date | null>(null);

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
      setWeekSelectedDay(null);
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
      setWeekSelectedDay(null);
    } else {
      const prev = addDays(selectedDay ?? today, -1);
      setSelectedDay(prev);
      setCurrentDate(prev);
    }
  };

  const monthTaskCount = useMemo(() => allTasks.filter(t => {
    const start = isoToDate(t.startDate);
    const end = isoToDate(t.endDate);
    const mStart = new Date(year, month, 1);
    const mEnd = new Date(year, month + 1, 0);
    return start <= mEnd && end >= mStart;
  }).length, [allTasks, year, month]);

  const activeDay = selectedDay ?? today;
  const dayTaskCount = useMemo(() => {
    return allTasks.filter(t => taskActiveOnDay(t, activeDay)).length;
  }, [allTasks, activeDay]);

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
    return activeDay.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  }, [view, month, year, weekDates, activeDay]);

  const isTodayInDayView = view === 'day' && sameDay(activeDay, today);

  // When a day is clicked in Month or Week view, select the day and open the roll-up sheet from below
  const handleDateSelect = (d: Date) => {
    setSelectedDay(d);
    setRollupDate(d);
    setIsRollupOpen(true);
  };

  return (
    <div className="relative">
      <div className="card overflow-hidden">
        {/* Header with date on left and only < > buttons on right */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-100">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">{headerTitle}</h2>
                {isTodayInDayView && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white shrink-0">
                    Today
                  </span>
                )}
                {view === 'day' && (
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 inline-flex items-center leading-none">
                    {dayTaskCount} {dayTaskCount === 1 ? 'task' : 'tasks'}
                  </span>
                )}
              </div>
              {view === 'month' && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {monthTaskCount} task{monthTaskCount !== 1 ? 's' : ''} this month
                </p>
              )}
            </div>
            {/* Nav buttons: < > only */}
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

        {/* View body */}
        <div>
          {view === 'month' && (
            <div className="p-4 sm:p-6">
              <MonthView
                year={year}
                month={month}
                tasks={allTasks}
                selectedDay={selectedDay}
                onSelectDay={handleDateSelect}
              />
            </div>
          )}
          {view === 'week' && (
            <WeekView
              weekDates={weekDates}
              tasks={allTasks}
              selectedDay={weekSelectedDay}
              onSelectDay={d => {
                setWeekSelectedDay(d);
                handleDateSelect(d);
              }}
            />
          )}
          {view === 'day' && (
            <DayView
              day={activeDay}
              tasks={allTasks}
              onStatusUpdate={onStatusUpdate}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )}
        </div>
      </div>

      {/* Roll-up Bottom Sheet for Week and Month date selections */}
      <DateTasksRollupSheet
        date={rollupDate}
        isOpen={isRollupOpen}
        onClose={() => {
          setIsRollupOpen(false);
          setWeekSelectedDay(null);
        }}
        tasks={allTasks}
        onStatusUpdate={onStatusUpdate}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}
