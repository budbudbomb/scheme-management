import { cn } from '@/lib/utils/formatters';
import type { Icon } from '@phosphor-icons/react';
import { FolderOpen } from '@phosphor-icons/react/dist/ssr';

interface EmptyStateProps {
  icon?: Icon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function EmptyState({
  icon: IconComp = FolderOpen,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <IconComp size={32} weight="light" className="text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500 mt-1.5 max-w-[280px] leading-relaxed">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className={cn(
            'mt-5 px-4 py-2 rounded-[var(--radius)] text-sm font-medium',
            'bg-indigo-600 text-white hover:bg-indigo-700',
            'transition-colors duration-150 btn-press'
          )}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
