'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import {
  CaretDown,
  Check,
  MagnifyingGlass,
  X,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils/formatters';

export interface SelectOption {
  value: string;
  label: string;
  subtext?: string;
  badge?: string;
  badgeColor?: string;
  icon?: React.ElementType;
  disabled?: boolean;
}

interface CustomSelectProps {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  className?: string;
  searchable?: boolean;
  disabled?: boolean;
}

export default function CustomSelect({
  options,
  value,
  onChange,
  label,
  placeholder = 'Select an option…',
  required = false,
  hasError = false,
  errorMessage,
  className,
  searchable,
  disabled = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-enable search if there are more than 6 options unless explicitly specified
  const isSearchEnabled = searchable ?? options.length > 6;

  // Selected option
  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.subtext && opt.subtext.toLowerCase().includes(q))
    );
  }, [options, search]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Reset search when opening/closing
  useEffect(() => {
    if (!isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearch('');
  };

  const SelectedIcon = selectedOption?.icon;

  return (
    <div
      ref={containerRef}
      data-no-keyboard="true"
      data-dropdown="true"
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
        onClick={() => setIsOpen((prev) => !prev)}
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
          {SelectedIcon && (
            <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <SelectedIcon size={15} weight="bold" />
            </div>
          )}

          <div className="min-w-0 flex-1 truncate">
            {selectedOption ? (
              <div className="flex items-center gap-2 truncate">
                <span className="font-semibold text-slate-900 text-xs sm:text-sm truncate">
                  {selectedOption.label}
                </span>
                {selectedOption.badge && (
                  <span
                    className={cn(
                      'text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider',
                      selectedOption.badgeColor || 'bg-slate-100 text-slate-600'
                    )}
                  >
                    {selectedOption.badge}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-slate-400 text-xs sm:text-sm truncate">{placeholder}</span>
            )}
          </div>
        </div>

        <CaretDown
          size={14}
          className={cn(
            'text-slate-400 shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180 text-indigo-600'
          )}
        />
      </button>

      {hasError && errorMessage && (
        <p className="mt-1 text-[11px] text-rose-600 font-medium">{errorMessage}</p>
      )}

      {/* Dropdown Menu Card */}
      {isOpen && (
        <div
          data-no-keyboard="true"
          className={cn(
            'absolute z-50 mt-1.5 w-full bg-white rounded-2xl border border-slate-200/90 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.18),0_4px_12px_rgba(0,0,0,0.06)] p-1.5',
            'animate-in fade-in zoom-in-95 duration-150',
            'left-0 right-0'
          )}
        >
          {/* Optional Search Filter inside Dropdown */}
          {isSearchEnabled && (
            <div className="p-1.5 border-b border-slate-100 mb-1">
              <div className="relative flex items-center">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <MagnifyingGlass size={14} weight="bold" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  data-no-keyboard="true"
                  placeholder="Filter options…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-slate-400"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={12} weight="bold" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto space-y-0.5 px-0.5 py-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No matching options
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = value === option.value;
                const OptionIcon = option.icon;

                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      'w-full px-3 py-2.5 rounded-xl text-left transition-all duration-150',
                      'flex items-center justify-between gap-2.5 cursor-pointer',
                      isSelected
                        ? 'bg-indigo-50/90 text-indigo-950 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900',
                      option.disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {OptionIcon && (
                        <div
                          className={cn(
                            'w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-500'
                          )}
                        >
                          <OptionIcon size={14} weight={isSelected ? 'bold' : 'regular'} />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-medium truncate">
                            {option.label}
                          </span>
                          {option.badge && (
                            <span
                              className={cn(
                                'text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider',
                                option.badgeColor || 'bg-slate-100 text-slate-600'
                              )}
                            >
                              {option.badge}
                            </span>
                          )}
                        </div>
                        {option.subtext && (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {option.subtext}
                          </p>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Check size={12} weight="bold" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
