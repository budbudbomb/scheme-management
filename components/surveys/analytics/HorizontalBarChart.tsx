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
    <div className="w-full flex flex-col justify-center space-y-2.5 p-2">
      {sorted.map((item, idx) => {
        const fillWidth = Math.max(4, Math.round((item.percentage / maxPct) * 100));

        return (
          <div key={idx} className="flex items-center gap-2 sm:gap-3 text-xs group">
            {/* Left Category Label */}
            <div className="w-32 sm:w-44 text-right shrink-0 truncate pr-1">
              <span className="font-semibold text-slate-800 text-xs truncate" title={item.label}>
                {item.label}
              </span>
            </div>

            {/* Connecting Tick Line matching Screenshot 4 */}
            <div className="w-3 h-px bg-slate-300 shrink-0" />

            {/* Horizontal Bar Track & Fill */}
            <div className="flex-1 bg-slate-100 h-6 sm:h-7 rounded-r-md overflow-hidden relative flex items-center">
              <div
                className="h-full rounded-r-md transition-all duration-500 group-hover:brightness-105 flex items-center px-2"
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

            {/* Right Percentage Value matching Screenshot 4 */}
            <div className="w-10 sm:w-12 text-right shrink-0">
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
