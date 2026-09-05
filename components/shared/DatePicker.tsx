'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import {
  CalendarBlank,
  CaretLeft,
  CaretRight,
  CaretDown,
  X,
  Check,
  Clock,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils/formatters';

interface DatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  minDate?: string; // YYYY-MM-DD
  maxDate?: string; // YYYY-MM-DD
  hasError?: boolean;
  errorMessage?: string;
  className?: string;
  disabled?: boolean;
  presets?: boolean;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Formats YYYY-MM-DD into "15 Aug 2026"
function formatDisplayDate(isoString?: string): string {
  if (!isoString) return '';
  const parts = isoString.split('-');
  if (parts.length !== 3) return isoString;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return isoString;
  return `${day < 10 ? '0' + day : day} ${SHORT_MONTHS[month]} ${year}`;
}

export default function DatePicker({
  value,
  onChange,
  label,
  placeholder = 'Select date…',
  required = false,
  minDate,
  maxDate,
  hasError = false,
  errorMessage,
  className,
  disabled = false,
  presets = true,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial view year and month from value or today
  const initialDate = useMemo(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          return new Date(y, m, d);
        }
      }
    }
    return new Date();
  }, [value]);

  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth());
  const [yearPickerOpen, setYearPickerOpen] = useState(false);

  // Sync view when value changes
  useEffect(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        if (!isNaN(y) && !isNaN(m)) {
          setViewYear(y);
          setViewMonth(m);
        }
      }
    }
  }, [value]);

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setYearPickerOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Month navigation
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  // Days calculations
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], []);

  const selectDay = (day: number) => {
    const mStr = viewMonth + 1 < 10 ? `0${viewMonth + 1}` : `${viewMonth + 1}`;
    const dStr = day < 10 ? `0${day}` : `${day}`;
    const dateStr = `${viewYear}-${mStr}-${dStr}`;

    if (minDate && dateStr < minDate) return;
    if (maxDate && dateStr > maxDate) return;

    onChange(dateStr);
    setIsOpen(false);
    setYearPickerOpen(false);
  };

  const setRelativeDays = (daysOffset: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysOffset);
    const dateStr = target.toISOString().split('T')[0];
    if (minDate && dateStr < minDate) return;
    if (maxDate && dateStr > maxDate) return;
    onChange(dateStr);
    setIsOpen(false);
  };

  // Year range for fast jump (current year - 5 to + 10)
  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(() => {
    const list: number[] = [];
    for (let y = currentYear - 3; y <= currentYear + 10; y++) {
      list.push(y);
    }
    return list;
  }, [currentYear]);

  return (
    <div
      ref={containerRef}
      data-no-keyboard="true"
      data-picker="true"
      className={cn('relative w-full', className)}
    >
      {label && (
        <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 truncate">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(prev => !prev)}
        className={cn(
          'w-full px-3.5 py-2.5 sm:py-3 text-sm rounded-[var(--radius)] border text-left transition-all duration-150',
          'flex items-center justify-between gap-2.5 select-none cursor-pointer',
          'bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500',
          hasError
            ? 'border-rose-400 ring-1 ring-rose-300'
            : isOpen
            ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
            : 'border-slate-200 shadow-2xs',
          disabled && 'opacity-60 cursor-not-allowed bg-slate-50'
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className={cn(
            'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors',
            value ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'
          )}>
            <CalendarBlank size={16} weight={value ? 'bold' : 'regular'} />
          </div>

          <div className="min-w-0 flex-1">
            {value ? (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 text-xs sm:text-sm truncate">
                  {formatDisplayDate(value)}
                </span>
                <span className="hidden sm:inline-block text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                  {value}
                </span>
              </div>
            ) : (
              <span className="text-slate-400 text-xs sm:text-sm truncate">{placeholder}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
              title="Clear date"
            >
              <X size={14} weight="bold" />
            </span>
          )}
          <CaretDown
            size={14}
            className={cn('text-slate-400 transition-transform duration-200', isOpen && 'rotate-180 text-indigo-600')}
          />
        </div>
      </button>

      {hasError && errorMessage && (
        <p className="mt-1 text-[11px] text-rose-600 font-medium">{errorMessage}</p>
      )}

      {/* Popover Calendar Card */}
      {isOpen && (
        <div
          data-no-keyboard="true"
          className={cn(
            'absolute z-50 mt-1.5 w-[320px] max-w-[calc(100vw-24px)] bg-white rounded-2xl border border-slate-200/90 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.18),0_4px_12px_rgba(0,0,0,0.06)] p-3.5',
            'animate-in fade-in zoom-in-95 duration-150',
            // Default alignment
            'left-0'
          )}
        >
          {/* Header Month/Year Selector */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer active:scale-95"
              aria-label="Previous month"
            >
              <CaretLeft size={16} weight="bold" />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setYearPickerOpen(prev => !prev)}
                className="px-2.5 py-1 rounded-lg hover:bg-slate-100 font-bold text-slate-900 text-sm flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>{MONTHS[viewMonth]} {viewYear}</span>
                <CaretDown size={12} className={cn('text-slate-500 transition-transform', yearPickerOpen && 'rotate-180')} />
              </button>

              {/* Fast Year Jump Popover */}
              {yearPickerOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-30 bg-white rounded-xl border border-slate-200 shadow-xl p-2 w-48 max-h-48 overflow-y-auto grid grid-cols-2 gap-1 animate-in fade-in">
                  {yearOptions.map(y => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => {
                        setViewYear(y);
                        setYearPickerOpen(false);
                      }}
                      className={cn(
                        'px-2 py-1.5 rounded-lg text-xs font-semibold text-center transition-colors cursor-pointer',
                        y === viewYear
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-700 hover:bg-slate-100'
                      )}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={nextMonth}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer active:scale-95"
              aria-label="Next month"
            >
              <CaretRight size={16} weight="bold" />
            </button>
          </div>

          {/* Weekday Names Header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DAYS_OF_WEEK.map((d, idx) => (
              <div
                key={d + idx}
                className={cn(
                  'text-[11px] font-bold py-1 select-none',
                  idx === 0 || idx === 6 ? 'text-slate-400' : 'text-slate-500'
                )}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Previous month overflow days */}
            {Array.from({ length: startDayOfWeek }).map((_, idx) => {
              const dayNum = daysInPrevMonth - startDayOfWeek + idx + 1;
              return (
                <div
                  key={`prev-${idx}`}
                  className="h-8 flex items-center justify-center text-[12px] text-slate-300 font-medium select-none pointer-events-none"
                >
                  {dayNum}
                </div>
              );
            })}

            {/* Current month active days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const mStr = viewMonth + 1 < 10 ? `0${viewMonth + 1}` : `${viewMonth + 1}`;
              const dStr = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
              const dateStr = `${viewYear}-${mStr}-${dStr}`;

              const isSelected = value === dateStr;
              const isToday = todayIso === dateStr;

              const isBeforeMin = minDate ? dateStr < minDate : false;
              const isAfterMax = maxDate ? dateStr > maxDate : false;
              const isDisabledDay = isBeforeMin || isAfterMax;

              return (
                <button
                  key={`day-${dayNum}`}
                  type="button"
                  disabled={isDisabledDay}
                  onClick={() => selectDay(dayNum)}
                  className={cn(
                    'h-8 w-8 mx-auto rounded-xl flex items-center justify-center text-xs font-semibold transition-all select-none cursor-pointer',
                    isSelected
                      ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/35 scale-105'
                      : isToday
                      ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                      : 'text-slate-700 hover:bg-indigo-50/70 hover:text-indigo-900',
                    isDisabledDay && 'opacity-25 cursor-not-allowed hover:bg-transparent hover:text-slate-400 line-through'
                  )}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Quick Presets & Bottom Actions */}
          {presets && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1.5">
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => setRelativeDays(0)}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setRelativeDays(7)}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  +1 Wk
                </button>
                <button
                  type="button"
                  onClick={() => setRelativeDays(14)}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  +2 Wks
                </button>
                <button
                  type="button"
                  onClick={() => setRelativeDays(30)}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  +1 Mo
                </button>
              </div>

              {value && (
                <button
                  type="button"
                  onClick={() => {
                    onChange('');
                    setIsOpen(false);
                  }}
                  className="text-[11px] font-semibold text-rose-500 hover:text-rose-700 px-1 py-0.5 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
