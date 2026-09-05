'use client';

import React from 'react';
import type { OptionDistribution } from '@/lib/utils/surveyAnalytics';

interface HorizontalBarChartProps {
  distributions: OptionDistribution[];
}

/**
 * HorizontalBarChart matches the 4th reference screenshot:
 * Category label on the left, connecting tick line, horizontal colored bar,
 * and bold percentage value right-aligned at the end of the row.
 */
export default function HorizontalBarChart({
  distributions,
}: HorizontalBarChartProps) {
  const sorted = [...distributions].sort((a, b) => b.percentage - a.percentage);
  const maxPct = Math.max(...sorted.map(d => d.percentage), 1);

  return (
    <div className="w-full flex flex-col justify-center space-y-3 sm:space-y-2.5 p-1 sm:p-2">
      {sorted.map((item, idx) => {
        const fillWidth = Math.max(4, Math.round((item.percentage / maxPct) * 100));

        return (
          <div key={idx} className="flex flex-col sm:flex-row sm:items-center sm:gap-3 text-xs group space-y-1 sm:space-y-0">
            {/* Phone View: Top row with Label + Percentage */}
            <div className="flex items-center justify-between sm:hidden w-full">
              <span className="font-semibold text-slate-800 text-xs line-clamp-1 pr-2" title={item.label}>
                {item.label}
              </span>
              <span className="font-extrabold text-slate-900 text-xs shrink-0">
                {item.percentage}% <span className="text-[10px] text-slate-400 font-normal">({item.count})</span>
              </span>
            </div>

            {/* Desktop View: Left Category Label */}
            <div className="hidden sm:block w-36 sm:w-44 text-right shrink-0 truncate pr-1">
              <span className="font-semibold text-slate-800 text-xs truncate block" title={item.label}>
                {item.label}
              </span>
            </div>

            {/* Connecting Tick Line matching Screenshot 4 (Desktop only) */}
            <div className="hidden sm:block w-3 h-px bg-slate-300 shrink-0" />

            {/* Horizontal Bar Track & Fill */}
            <div className="w-full sm:flex-1 bg-slate-100 h-5 sm:h-7 rounded-md sm:rounded-r-md overflow-hidden relative flex items-center">
              <div
                className="h-full rounded-md sm:rounded-r-md transition-all duration-500 group-hover:brightness-105 flex items-center px-2"
                style={{
                  width: `${fillWidth}%`,
                  backgroundColor: item.color,
                }}
              >
                {/* Count badge inside bar if wide enough */}
                {fillWidth > 20 && (
                  <span className="text-[10px] text-white/90 font-bold drop-shadow-xs">
                    {item.count}
                  </span>
                )}
              </div>
            </div>

            {/* Desktop View: Right Percentage Value matching Screenshot 4 */}
            <div className="hidden sm:block w-10 sm:w-12 text-right shrink-0">
              <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                {item.percentage}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
