import { cn } from '@/lib/utils/formatters';
import { Warning, ArrowClockwise } from '@phosphor-icons/react/dist/ssr';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-6 text-center',
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
        <Warning size={28} weight="fill" className="text-rose-500" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500 mt-1.5 max-w-[280px] leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className={cn(
            'mt-5 flex items-center gap-2 px-4 py-2 rounded-[var(--radius)] text-sm font-medium',
            'border border-slate-200 text-slate-700 hover:bg-slate-50',
            'transition-colors duration-150 btn-press'
          )}
        >
          <ArrowClockwise size={16} />
          Try again
        </button>
      )}
    </div>
  );
}
