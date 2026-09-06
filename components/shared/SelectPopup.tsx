'use client';

import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  CaretDown,
  X,
  Check,
  CalendarBlank,
  CaretLeft,
  CaretRight,
  MagnifyingGlass,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils/formatters';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SelectPopupProps {
  title: string;
  value: string;
  options: SelectOption[];
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
}

export default function SelectPopup({
  title,
  value,
  options,
  onChange,
  placeholder = 'Select…',
  className,
  buttonClassName,
}: SelectPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background scroll when popup is open so it remains completely frozen
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const selectedOption = options.find((o) => o.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase().trim();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  return (
    <div className={cn('relative w-full', className)}>
      {/* Trigger button resembling native select but clean */}
      <button
        type="button"
        onClick={() => {
          setSearch('');
          setIsOpen(true);
        }}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white focus:border-indigo-500 focus:outline-none transition-all text-slate-700 cursor-pointer shadow-2xs select-none',
          isOpen && 'border-indigo-500 bg-white ring-2 ring-indigo-500/20 shadow-xs',
          buttonClassName
        )}
      >
        <div className="flex items-center gap-1.5 truncate">
          {selectedOption?.icon}
          <span className="truncate">{displayLabel}</span>
        </div>
        <CaretDown
          size={14}
          className={cn(
            'text-slate-400 shrink-0 ml-1.5 transition-transform duration-200',
            isOpen && 'rotate-180 text-indigo-600'
          )}
        />
      </button>

      {/* Frozen Pop Up Modal rendered in Portal over all layers */}
      {isOpen && mounted && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 select-none"
          style={{ touchAction: 'none' }}
        >
          {/* Backdrop click to dismiss */}
          <div
            className="fixed inset-0"
            onClick={() => setIsOpen(false)}
          />

          {/* Frozen dialog window */}
          <div
            className="relative w-full max-w-[340px] sm:max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-4 space-y-3 z-10 animate-in zoom-in-95 duration-150 max-h-[80vh] flex flex-col pointer-events-auto"
            style={{ touchAction: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
              <h3 className="text-sm font-bold text-slate-900">{title}</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            {/* Optional search when many options */}
            {options.length > 6 && (
              <div className="relative shrink-0 pt-0.5">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${title.toLowerCase()}…`}
                  className="w-full pl-8 pr-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
                  autoFocus
                />
                <MagnifyingGlass size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
              </div>
            )}

            {/* Options list */}
            <div className="overflow-y-auto space-y-1 py-1 custom-scrollbar flex-1 max-h-[50vh]">
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">No options match &ldquo;{search}&rdquo;</div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                      }}
                      className={cn(
                        'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left',
                        isSelected
                          ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/80 shadow-2xs'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {opt.icon}
                        <span className="truncate">{opt.label}</span>
                      </div>
                      {isSelected && (
                        <Check size={15} weight="bold" className="text-indigo-600 shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Date Popup Component (Frozen Modal in Portal)
// ─────────────────────────────────────────────────────────────────────────────

interface DatePopupProps {
  value: string; // YYYY-MM-DD
  onChange: (val: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function DatePopup({
  value,
  onChange,
  label,
  placeholder = 'Select Date',
  className,
  buttonClassName,
}: DatePopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background scroll when popup is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Parse YYYY-MM-DD to date parts
  const parsedDate = useMemo(() => {
    if (value) {
      const [y, m, d] = value.split('-').map(Number);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m - 1, d);
      }
    }
    return new Date(2026, 8, 6); // default to Sep 6, 2026
  }, [value]);

  const [currentYear, setCurrentYear] = useState<number>(parsedDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(parsedDate.getMonth());

  // Formats display date as DD-MM-YYYY (or with label like "From: 01-09-2026")
  const formattedDisplay = useMemo(() => {
    if (!value) return placeholder;
    const parts = value.split('-');
    const formatted = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : value;
    return label ? `${label}: ${formatted}` : formatted;
  }, [value, label, placeholder]);

  const handleOpen = () => {
    setCurrentYear(parsedDate.getFullYear());
    setCurrentMonth(parsedDate.getMonth());
    setIsOpen(true);
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const mm = String(currentMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const iso = `${currentYear}-${mm}-${dd}`;
    onChange(iso);
    setIsOpen(false);
  };

  const handleQuickSelect = (daysOffset: number) => {
    // Current simulated date is 2026-09-06
    const target = new Date(2026, 8, 6);
    target.setDate(target.getDate() + daysOffset);
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  return (
    <div className={cn('relative w-full', className)}>
      <button
        type="button"
        onClick={handleOpen}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white focus:border-indigo-500 focus:outline-none transition-all text-slate-700 cursor-pointer shadow-2xs select-none',
          isOpen && 'border-indigo-500 bg-white ring-2 ring-indigo-500/20 shadow-xs',
          buttonClassName
        )}
      >
        <span className="truncate">{formattedDisplay}</span>
        <CalendarBlank size={15} className="text-slate-400 shrink-0 ml-1.5" />
      </button>

      {isOpen && mounted && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 select-none"
          style={{ touchAction: 'none' }}
        >
          {/* Backdrop click */}
          <div
            className="fixed inset-0"
            onClick={() => setIsOpen(false)}
          />

          {/* Frozen calendar dialog */}
          <div
            className="relative w-full max-w-[320px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-4 space-y-3.5 z-10 animate-in zoom-in-95 duration-150 pointer-events-auto"
            style={{ touchAction: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Title & Close */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {label ? `Select ${label}` : 'Select Date'}
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            {/* Month & Year Navigation */}
            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={prevMonth}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <CaretLeft size={14} weight="bold" />
              </button>

              <span className="text-xs font-bold text-slate-900">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </span>

              <button
                type="button"
                onClick={nextMonth}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <CaretRight size={14} weight="bold" />
              </button>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-400">
              <span>Su</span>
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="h-7 w-7" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const mm = String(currentMonth + 1).padStart(2, '0');
                const dd = String(day).padStart(2, '0');
                const iso = `${currentYear}-${mm}-${dd}`;
                const isSelected = value === iso;

                return (
                  <button
                    key={`day-${day}`}
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    className={cn(
                      'h-7 w-7 mx-auto rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer',
                      isSelected
                        ? 'bg-indigo-600 text-white font-bold shadow-xs'
                        : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-700'
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px]">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickSelect(0)}
                  className="px-2 py-1 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 font-semibold transition-colors cursor-pointer"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect(-1)}
                  className="px-2 py-1 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 font-semibold transition-colors cursor-pointer"
                >
                  Yesterday
                </button>
              </div>

              {value && (
                <button
                  type="button"
                  onClick={() => {
                    onChange('');
                    setIsOpen(false);
                  }}
                  className="text-slate-400 hover:text-rose-500 font-semibold transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
