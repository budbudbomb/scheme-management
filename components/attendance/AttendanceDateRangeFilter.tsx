'use client';

import { Calendar, CalendarBlank } from '@phosphor-icons/react';
import { cn } from '@/lib/utils/formatters';
import { DatePopup } from '@/components/shared/SelectPopup';

export type DatePreset = 'today' | 'week' | 'month' | 'custom' | 'all';

interface AttendanceDateRangeFilterProps {
  fromDate: string;
  toDate: string;
  onRangeChange: (from: string, to: string) => void;
  className?: string;
}

export default function AttendanceDateRangeFilter({
  fromDate,
  toDate,
  onRangeChange,
  className,
}: AttendanceDateRangeFilterProps) {
  // Determine if current range matches any preset
  // Fixed simulated current anchor date: 2026-09-06
  const TODAY = '2026-09-06';
  const WEEK_START = '2026-08-31';
  const WEEK_END = '2026-09-06';
  const MONTH_START = '2026-09-01';
  const MONTH_END = '2026-09-30';

  const activePreset: DatePreset = (() => {
    if (!fromDate && !toDate) return 'all';
    if (fromDate === TODAY && toDate === TODAY) return 'today';
    if (fromDate === WEEK_START && toDate === WEEK_END) return 'week';
    if (fromDate === MONTH_START && toDate === MONTH_END) return 'month';
    return 'custom';
  })();

  const selectPreset = (preset: DatePreset) => {
    switch (preset) {
      case 'today':
        onRangeChange(TODAY, TODAY);
        break;
      case 'week':
        onRangeChange(WEEK_START, WEEK_END);
        break;
      case 'month':
        onRangeChange(MONTH_START, MONTH_END);
        break;
      case 'all':
        onRangeChange('', '');
        break;
      default:
        break;
    }
  };

  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center gap-2.5', className)}>
      {/* Preset Pills */}
      <div className="flex items-center gap-1 p-1 bg-slate-100/90 border border-slate-200/90 rounded-xl shrink-0 overflow-x-auto select-none">
        <button
          type="button"
          onClick={() => selectPreset('today')}
          className={cn(
            'px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer shrink-0',
            activePreset === 'today'
              ? 'bg-white text-indigo-700 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          )}
        >
          Today
        </button>

        <button
          type="button"
          onClick={() => selectPreset('week')}
          className={cn(
            'px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer shrink-0',
            activePreset === 'week'
              ? 'bg-white text-indigo-700 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          )}
        >
          This Week
        </button>

        <button
          type="button"
          onClick={() => selectPreset('month')}
          className={cn(
            'px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer shrink-0',
            activePreset === 'month'
              ? 'bg-white text-indigo-700 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          )}
        >
          This Month
        </button>

        <button
          type="button"
          onClick={() => selectPreset('all')}
          className={cn(
            'px-2 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer shrink-0',
            activePreset === 'all'
              ? 'bg-white text-indigo-700 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          )}
        >
          All
        </button>
      </div>

      {/* From and To Date Pickers */}
      <div className="grid grid-cols-2 gap-2 flex-1 sm:max-w-[340px]">
        <DatePopup
          label="From"
          value={fromDate}
          placeholder="From Date"
          onChange={(newFrom) => onRangeChange(newFrom, toDate)}
        />
        <DatePopup
          label="To"
          value={toDate}
          placeholder="To Date"
          onChange={(newTo) => onRangeChange(fromDate, newTo)}
        />
      </div>
    </div>
  );
}
