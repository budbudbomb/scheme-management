'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/formatters';
import { X, Warning, Check } from '@phosphor-icons/react';

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  loading?: boolean;
}

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading = false,
}: ConfirmModalProps) {
  if (!open) return null;

  const confirmStyle = {
    danger: 'bg-rose-600 hover:bg-rose-700 text-white',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white',
    default: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  }[variant];

  const iconEl = variant === 'danger' || variant === 'warning' ? (
    <div className={cn(
      'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
      variant === 'danger' ? 'bg-rose-100' : 'bg-amber-100'
    )}>
      <Warning
        size={20}
        weight="fill"
        className={variant === 'danger' ? 'text-rose-600' : 'text-amber-600'}
      />
    </div>
  ) : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className={cn(
          'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
          'w-[calc(100vw-2rem)] max-w-[420px]',
          'card p-6 shadow-[var(--shadow-popup)]',
        )}
        style={{ transformOrigin: 'center' }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-4">
          {iconEl}
          <div>
            <h2 id="confirm-modal-title" className="font-semibold text-slate-900">
              {title}
            </h2>
            <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="flex gap-3 mt-6 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className={cn(
              'px-4 py-2 rounded-[var(--radius)] text-sm font-medium',
              'border border-slate-200 text-slate-700 hover:bg-slate-50',
              'transition-colors btn-press disabled:opacity-50'
            )}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'px-4 py-2 rounded-[var(--radius)] text-sm font-medium',
              'flex items-center gap-2',
              'transition-all btn-press disabled:opacity-50',
              confirmStyle
            )}
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Check size={14} weight="bold" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}
