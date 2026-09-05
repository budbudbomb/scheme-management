'use client';

import React from 'react';
import { Gear, Sparkle, SealCheck } from '@phosphor-icons/react';
import type { OptionDistribution } from '@/lib/utils/surveyAnalytics';

interface DonutMetricChartProps {
  distributions: OptionDistribution[];
  totalAnswers: number;
}

/**
 * DonutMetricChart matches the 2nd reference screenshot:
 * Segmented donut ring with percentage slices, center graphic/icon,
 * and an iconography-enhanced legend underneath.
 */
export default function DonutMetricChart({
  distributions,
  totalAnswers,
}: DonutMetricChartProps) {
  const sorted = [...distributions].sort((a, b) => b.percentage - a.percentage);

  // SVG parameters
  const size = 260;
  const center = size / 2;
  const radius = 80;
  const strokeWidth = 26;
  const circumference = 2 * Math.PI * radius;

  // Compute stroke-dasharray offsets
  let accumulatedPercent = 0;
  const slices = sorted.map(item => {
    const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((accumulatedPercent / 100) * circumference);

    // Mid angle for percentage label callout
    const midAngle = (accumulatedPercent + item.percentage / 2) * 3.6 - 90;
    const rad = (midAngle * Math.PI) / 180;
    const labelDistance = radius + 24;
    const labelX = center + Math.cos(rad) * labelDistance;
    const labelY = center + Math.sin(rad) * labelDistance;

    accumulatedPercent += item.percentage;

    return {
      ...item,
      strokeDasharray,
      strokeDashoffset,
      labelX,
      labelY,
    };
  });

  return (
    <div className="flex flex-col items-center justify-between w-full min-w-0 max-w-full h-full p-1 sm:p-2 overflow-hidden">
      {/* ── Donut Chart Ring ── */}
      <div className="relative w-full max-w-[210px] sm:max-w-[250px] aspect-square flex items-center justify-center">
        <svg viewBox="-15 -15 290 290" className="w-full h-full">
          {/* Base Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />

          {/* Slices */}
          <g transform={`rotate(-90 ${center} ${center})`}>
            {slices.map((slice, idx) => (
              <circle
                key={idx}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={strokeWidth}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                strokeLinecap="butt"
                className="transition-all duration-500 hover:opacity-85 cursor-pointer"
              />
            ))}
          </g>

          {/* Callout Percentage Labels outside ring */}
          {slices.map((slice, idx) => {
            if (slice.percentage < 4) return null; // Avoid crowding tiny slices
            return (
              <text
                key={idx}
                x={slice.labelX}
                y={slice.labelY}
                textAnchor="middle"
                dominantBaseline="central"
                fill={slice.color}
                fontSize="12px"
                fontWeight="800"
                fontFamily="system-ui, -apple-system, sans-serif"
                className="drop-shadow-xs select-none"
              >
                {slice.percentage}%
              </text>
            );
          })}
        </svg>

        {/* Center Graphic matching Screenshot 2 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-indigo-600 shadow-inner">
            <Gear size={22} weight="duotone" className="animate-spin-slow" />
          </div>
          <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 mt-0.5 sm:mt-1 uppercase tracking-wider">
            Total
          </span>
          <span className="text-xs sm:text-sm font-black text-slate-800">{totalAnswers}</span>
        </div>
      </div>

      {/* ── Legend matching Screenshot 2 ── */}
      <div className="w-full min-w-0 max-w-full pt-3 mt-1 border-t border-slate-100 flex flex-col gap-1.5 px-0.5 sm:px-2">
        {sorted.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs group w-full min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 pr-2">
              <div
                className="w-4 h-4 rounded-md flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${item.color}20`, color: item.color }}
              >
                <SealCheck size={12} weight="bold" />
              </div>
              <span className="font-medium text-slate-700 truncate text-[11px] sm:text-xs">
                {item.label}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-slate-400 text-[10px] sm:text-[11px]">({item.count})</span>
              <span className="font-bold text-slate-900 w-8 sm:w-9 text-right text-xs sm:text-sm">{item.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
