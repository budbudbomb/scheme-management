import { cn } from '@/lib/utils/formatters';

interface SkeletonCardProps {
  className?: string;
  rows?: number;
}

export function SkeletonCard({ className, rows = 3 }: SkeletonCardProps) {
  return (
    <div className={cn('card p-5 space-y-3', className)}>
      <div className="flex items-center gap-3">
        <div className="skeleton w-10 h-10 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3.5 w-2/3 rounded" />
          <div className="skeleton h-3 w-1/3 rounded" />
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-3 rounded" style={{ width: `${70 + (i % 3) * 10}%` }} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-100 flex gap-4">
        {[3, 2, 2, 1.5, 1].map((w, i) => (
          <div key={i} className={`skeleton h-3 rounded flex-${Math.round(w)}`} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-5 py-4 border-b border-slate-50 flex gap-4 items-center">
          <div className="skeleton w-8 h-8 rounded-full shrink-0" />
          <div className="skeleton h-3 rounded flex-1 max-w-[180px]" />
          <div className="skeleton h-3 rounded w-20" />
          <div className="skeleton h-3 rounded w-16" />
          <div className="skeleton h-6 rounded-full w-20" />
          <div className="skeleton h-6 rounded w-16 ml-auto" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonStatGrid({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid gap-4 grid-cols-2 lg:grid-cols-${Math.min(count, 4)}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} rows={1} />
      ))}
    </div>
  );
}
