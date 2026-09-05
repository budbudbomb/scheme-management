'use client';

import React from 'react';
import type { OptionDistribution } from '@/lib/utils/surveyAnalytics';

interface VerticalBarChartProps {
  distributions: OptionDistribution[];
  likertScore?: number;
}

/**
 * VerticalBarChart matches the 3rd reference screenshot:
 * Vertical column bars with percentage values placed directly on top of each bar,
 * a clean horizontal baseline, and category labels underneath.
 */
export default function VerticalBarChart({
  distributions,
  likertScore,
}: VerticalBarChartProps) {
  const maxPct = Math.max(...distributions.map(d => d.percentage), 1);
  const chartHeight = 160; // max bar height in px

  return (
    <div className="flex flex-col justify-between w-full h-full p-2">
      {/* ── Score banner if available ── */}
      {likertScore !== undefined && (
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 text-xs">
          <span className="font-semibold text-slate-500">Average Satisfaction Score</span>
          <div className="flex items-center gap-1.5 bg-purple-50 text-purple-700 font-bold px-2.5 py-0.5 rounded-full border border-purple-200">
            <span>⭐ {likertScore} / 5.0</span>
          </div>
        </div>
      )}

      {/* ── Columns & Top Percentages ── */}
      <div className="w-full pt-4 sm:pt-6 pb-2">
        <div className="flex items-end justify-around gap-1 sm:gap-3 h-[150px] sm:h-[180px] w-full px-0.5 sm:px-1">
          {distributions.map((item, idx) => {
            const barHeight = Math.max(10, Math.round((item.percentage / maxPct) * chartHeight));

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
              >
                {/* Floating percentage label on top of bar */}
                <span className="text-[10px] sm:text-sm font-black text-slate-800 mb-1 sm:mb-1.5 transition-transform group-hover:-translate-y-1">
                  {item.percentage}%
                </span>

                {/* Vertical Bar */}
                <div
                  className="w-full max-w-[32px] sm:max-w-[48px] rounded-t-md sm:rounded-t-lg transition-all duration-500 group-hover:brightness-110 shadow-xs relative overflow-hidden"
                  style={{
                    height: `${barHeight}px`,
                    backgroundColor: item.color,
                  }}
                >
                  {/* Subtle top light highlight */}
                  <div className="absolute top-0 inset-x-0 h-1 bg-white/30" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Solid Horizontal Baseline */}
        <div className="w-full h-0.5 bg-slate-300 rounded-full my-1" />

        {/* Labels under baseline */}
        <div className="flex items-start justify-around gap-1 sm:gap-3 w-full px-0.5 sm:px-1 pt-1.5">
          {distributions.map((item, idx) => (
            <div
              key={idx}
              className="flex-1 text-center"
            >
              <p className="text-[9px] sm:text-[11px] font-bold text-slate-700 leading-tight break-words line-clamp-2 sm:line-clamp-none">
                {item.label}
              </p>
              <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium mt-0.5">
                {item.count} ans
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
