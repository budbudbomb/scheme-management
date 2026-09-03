import { cn } from '@/lib/utils/formatters';
import type { Icon } from '@phosphor-icons/react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: Icon;
  iconColor?: string;
  iconBg?: string;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  className?: string;
  loading?: boolean;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  iconColor = 'text-indigo-600',
  iconBg = 'bg-indigo-50',
  trend,
  className,
  loading = false,
}: StatCardProps) {
  if (loading) {
    return (
      <div className={cn('card p-5', className)}>
        <div className="flex items-start justify-between">
          <div className="skeleton w-10 h-10 rounded-xl" />
          <div className="skeleton w-16 h-4 rounded" />
        </div>
        <div className="mt-4 skeleton w-12 h-7 rounded" />
        <div className="mt-1.5 skeleton w-24 h-3 rounded" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'card p-5 card-hover',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconBg)}>
          <Icon size={20} weight="fill" className={iconColor} />
        </div>
        {trend && (
          <span
            className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full',
              trend.positive
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-rose-100 text-rose-700'
            )}
          >
            {trend.positive ? '+' : '-'}{Math.abs(trend.value)}%
          </span>
        )}
      </div>

      <div className="mt-4">
        <div className="text-2xl font-bold text-slate-900">
          {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
        </div>
        <div className="text-sm text-slate-500 mt-0.5">{label}</div>
        {trend && (
          <div className="text-xs text-slate-400 mt-1">{trend.label}</div>
        )}
      </div>
    </div>
  );
}
