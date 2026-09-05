'use client';

import React from 'react';
import { Star } from '@phosphor-icons/react';
import type { OptionDistribution } from '@/lib/utils/surveyAnalytics';

interface BubbleClusterChartProps {
  distributions: OptionDistribution[];
  questionText?: string;
  theme?: 'dark' | 'light';
}

/**
 * BubbleClusterChart matches the 1st reference screenshot:
 * Organic circular bubbles sized proportionally to percentage,
 * with percentage text centered inside, and a clean star-bullet legend underneath.
 */
export default function BubbleClusterChart({
  distributions,
  theme = 'light',
}: BubbleClusterChartProps) {
  // Sort distributions descending
  const sorted = [...distributions].sort((a, b) => b.percentage - a.percentage);

  // SVG dimensions & coordinate calculations
  const width = 320;
  const height = 240;
  const centerX = width / 2;
  const centerY = height / 2 - 10;

  // Compute radius: scale max percentage to radius ~ 65px, min ~ 22px
  const maxPct = Math.max(...sorted.map(d => d.percentage), 1);
  const getRadius = (pct: number) => {
    const minR = 20;
    const maxR = 64;
    return minR + Math.sqrt(pct / maxPct) * (maxR - minR);
  };

  // Fixed organic cluster layouts based on item count
  // Positions relative to center:
  // Item 0 (biggest): centered-left
  // Item 1: bottom-right
  // Item 2: top-right
  // Item 3, 4: small top bubbles
  const getBubblePosition = (index: number, r: number) => {
    switch (index) {
      case 0:
        return { x: centerX - 35, y: centerY + 15 };
      case 1:
        return { x: centerX + 55, y: centerY + 18 };
      case 2:
        return { x: centerX + 35, y: centerY - 45 };
      case 3:
        return { x: centerX - 10, y: centerY - 65 };
      case 4:
        return { x: centerX - 55, y: centerY - 72 };
      default:
        const angle = (index * 2 * Math.PI) / sorted.length;
        return { x: centerX + Math.cos(angle) * 75, y: centerY + Math.sin(angle) * 75 };
    }
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-2">
      {/* ── SVG Bubble Cluster ── */}
      <div className="relative w-full max-w-[320px] aspect-[4/3] flex items-center justify-center">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible drop-shadow-xs"
        >
          <defs>
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12" />
            </filter>
          </defs>

          {sorted.map((item, idx) => {
            const r = getRadius(item.percentage);
            const pos = getBubblePosition(idx, r);

            return (
              <g
                key={idx}
                className="transition-transform duration-300 hover:scale-105 cursor-pointer origin-center"
                style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
              >
                {/* Bubble Circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={r}
                  fill={item.color}
                  filter="url(#softGlow)"
                  className="transition-all duration-300"
                />

                {/* Percentage label inside bubble */}
                <text
                  x={pos.x}
                  y={pos.y + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#ffffff"
                  fontSize={r > 40 ? '20px' : r > 28 ? '14px' : '11px'}
                  fontWeight="800"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.25)' }}
                >
                  {item.percentage}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── Star-bullet Legend matching Screenshot 1 ── */}
      <div className="w-full pt-4 mt-2 border-t border-slate-100 flex flex-col gap-1.5 px-2">
        {sorted.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs group">
            <div className="flex items-center gap-2">
              <Star
                size={14}
                weight="fill"
                style={{ color: item.color }}
                className="shrink-0 transition-transform group-hover:scale-110"
              />
              <span className="font-medium text-slate-700 truncate max-w-[200px] sm:max-w-none">
                {item.label}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-slate-400 text-[11px]">({item.count})</span>
              <span className="font-bold text-slate-900 w-9 text-right">{item.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
