import { cn } from '@/lib/utils/formatters';

interface DetailRow {
  label: string;
  value: React.ReactNode;
}

interface DetailListProps {
  rows: DetailRow[];
  columns?: 1 | 2 | 3 | 4;
  variant?: 'grid' | 'list';
}

/** Read-only label/value list used across profile pages (Program Assignment, Personal Details, etc). */
export default function DetailList({ rows, columns = 2, variant = 'grid' }: DetailListProps) {
  if (variant === 'list') {
    return (
      <div className="divide-y divide-slate-100">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between py-3 gap-4">
            <span className="text-sm text-slate-500 shrink-0">{label}</span>
            <span className="text-sm font-semibold text-slate-900 text-right">{value ?? '—'}</span>
          </div>
        ))}
      </div>
    );
  }

  const gridCols = columns === 1 
    ? 'grid-cols-1' 
    : columns === 2 
    ? 'grid-cols-1 sm:grid-cols-2' 
    : columns === 3 
    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <div className={cn('grid gap-3', gridCols)}>
      {rows.map(({ label, value }) => (
        <div key={label} className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</span>
          <span className="text-sm font-semibold text-slate-900 break-words">{value ?? '—'}</span>
        </div>
      ))}
    </div>
  );
}
