'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-enable search if there are more than 4 options unless explicitly specified
  const isSearchEnabled = searchable ?? options.length > 4;

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

  // Determine if popup mode should be used (on mobile OR whenever the list is long: > 6 options)
  const isPopUp = isMobile || options.length > 6;

  // Lock body scroll when popup modal is open
  useEffect(() => {
    if (isOpen && isPopUp) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isPopUp]);

  // Click outside to close (desktop anchored view for short lists)
  useEffect(() => {
    if (isPopUp) return;
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
  }, [isOpen, isPopUp]);

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

  // Render options list with smooth scrollbar
  const renderOptionsList = (maxHeightClass = 'max-h-64') => (
    <div
      className={cn(
        'overflow-y-auto space-y-1 p-1.5',
        'scrollbar-thin [scrollbar-color:hsl(var(--color-border))_transparent]',
        '[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-100/70 [&::-webkit-scrollbar-thumb]:bg-slate-300 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 [&::-webkit-scrollbar-thumb]:rounded-full',
        maxHeightClass
      )}
    >
      {filteredOptions.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          No matching options found
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
                'w-full px-3.5 py-2.5 rounded-xl text-left transition-all duration-150',
                'flex items-center justify-between gap-3 cursor-pointer',
                isSelected
                  ? 'bg-indigo-50/90 text-indigo-950 font-semibold border border-indigo-200/80 shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent',
                option.disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {OptionIcon && (
                  <div
                    className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-500'
                    )}
                  >
                    <OptionIcon size={15} weight={isSelected ? 'bold' : 'regular'} />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-semibold truncate text-slate-900">
                      {option.label}
                    </span>
                    {option.badge && (
                      <span
                        className={cn(
                          'text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0',
                          option.badgeColor || 'bg-slate-100 text-slate-600'
                        )}
                      >
                        {option.badge}
                      </span>
                    )}
                  </div>
                  {option.subtext && (
                    <p className="text-[11px] text-slate-500 truncate mt-0.5 leading-tight">
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
  );

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
                      'text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0',
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

      {/* ── POPUP MODAL VIEW (Mobile or Long List): WITH FROZEN HEADER, SCROLLBAR & FROZEN FOOTER ── */}
      {isOpen && isPopUp && mounted && createPortal(
        <div
          data-no-keyboard="true"
          data-dropdown="true"
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
          onClick={() => setIsOpen(false)}
        >
          {/* Modal Pop Up Dialog */}
          <div
            className={cn(
              'relative z-[105] w-full max-w-md sm:max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col',
              'max-h-[85dvh] sm:max-h-[80vh] my-auto',
              'animate-in fade-in zoom-in-95 duration-200'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Frozen Header */}
            <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0 sticky top-0 z-10">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-bold text-slate-900 text-sm sm:text-base truncate">
                  {label || 'Select an Option'}
                </span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                  {options.length} options
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                title="Close"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            {/* Frozen Search Filter (if search enabled) */}
            {isSearchEnabled && (
              <div className="p-2.5 border-b border-slate-100 bg-slate-50/80 shrink-0 sticky top-[53px] z-10">
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MagnifyingGlass size={15} weight="bold" />
                  </div>
                  <input
                    type="text"
                    data-no-keyboard="true"
                    placeholder="Search options…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white hover:bg-slate-100/50 focus:bg-white rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-slate-400"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X size={13} weight="bold" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Scrollable Options List with Visible Custom Scrollbar */}
            <div className="flex-1 min-h-0 overflow-y-auto p-1.5 space-y-1 [scrollbar-width:thin] [scrollbar-color:#94a3b8_#f1f5f9] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-100/70 [&::-webkit-scrollbar-thumb]:bg-slate-300 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 [&::-webkit-scrollbar-thumb]:rounded-full">
              {filteredOptions.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  No matching options found
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
                        'w-full px-3.5 py-2.5 rounded-xl text-left transition-all duration-150',
                        'flex items-center justify-between gap-3 cursor-pointer',
                        isSelected
                          ? 'bg-indigo-50/90 text-indigo-950 font-semibold border border-indigo-200/80 shadow-2xs'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent',
                        option.disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {OptionIcon && (
                          <div
                            className={cn(
                              'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-500'
                            )}
                          >
                            <OptionIcon size={15} weight={isSelected ? 'bold' : 'regular'} />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-semibold truncate text-slate-900">
                              {option.label}
                            </span>
                            {option.badge && (
                              <span
                                className={cn(
                                  'text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0',
                                  option.badgeColor || 'bg-slate-100 text-slate-600'
                                )}
                              >
                                {option.badge}
                              </span>
                            )}
                          </div>
                          {option.subtext && (
                            <p className="text-[11px] text-slate-500 truncate mt-0.5 leading-tight">
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

            {/* Frozen Footer */}
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/95 flex items-center justify-between shrink-0 sticky bottom-0 z-10 backdrop-blur-xs">
              <span className="text-xs text-slate-500 font-medium">
                {filteredOptions.length} of {options.length} available
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 shadow-2xs cursor-pointer transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── DESKTOP SHORT LIST VIEW: ANCHORED DROPDOWN CARD (<= 6 options) ── */}
      {isOpen && !isPopUp && (
        <div
          data-no-keyboard="true"
          className={cn(
            'absolute z-50 mt-1.5 w-full bg-white rounded-2xl border border-slate-200/90 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.18),0_4px_12px_rgba(0,0,0,0.06)] overflow-hidden',
            'animate-in fade-in zoom-in-95 duration-150',
            'left-0 right-0'
          )}
        >
          {renderOptionsList('max-h-64')}
        </div>
      )}
    </div>
  );
}
