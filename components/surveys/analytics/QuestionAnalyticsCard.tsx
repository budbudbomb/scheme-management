'use client';

import React, { useState } from 'react';
import {
  ChartPie,
  ChartBar,
  CirclesThree,
  Rows,
  Table,
  ChatCircleText,
  Info,
} from '@phosphor-icons/react';
import BubbleClusterChart from './BubbleClusterChart';
import DonutMetricChart from './DonutMetricChart';
import VerticalBarChart from './VerticalBarChart';
import HorizontalBarChart from './HorizontalBarChart';
import QualitativeInsightsView from './QualitativeInsightsView';
import type { QuestionAnalytics } from '@/lib/utils/surveyAnalytics';
import { cn } from '@/lib/utils/formatters';

interface QuestionAnalyticsCardProps {
  analytics: QuestionAnalytics;
  index: number;
}

type ChartType = 'bubble' | 'donut' | 'vertical_bar' | 'horizontal_bar' | 'table' | 'qualitative';

export default function QuestionAnalyticsCard({
  analytics,
  index,
}: QuestionAnalyticsCardProps) {
  // Determine default chart type based on question type
  const getDefaultChart = (): ChartType => {
    if (analytics.questionType === 'descriptive') return 'qualitative';
    if (analytics.questionType === 'likert_scale') return 'bubble'; // Screenshot 1 default!
    if (analytics.questionType === 'single_choice') return 'donut'; // Screenshot 2 default!
    if (analytics.questionType === 'multiple_choice') return 'horizontal_bar'; // Screenshot 4 default!
    return 'donut';
  };

  const [activeChart, setActiveChart] = useState<ChartType>(getDefaultChart());

  return (
    <div
      id={`question-card-${analytics.questionNumber}`}
      className="card p-4 sm:p-6 border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all bg-white rounded-2xl flex flex-col justify-between space-y-4"
    >
      {/* ── Question Header ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-1 flex-1 min-w-[240px]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs shrink-0">
              Q{analytics.questionNumber}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {analytics.questionType.replace('_', ' ')}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {analytics.totalAnswers} Responses
            </span>
          </div>

          <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug pt-1">
            {analytics.questionText}
          </h3>
        </div>

        {/* ── Chart Type Switcher Toolbar ── */}
        {analytics.questionType !== 'descriptive' && (
          <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 shrink-0">
            <button
              type="button"
              onClick={() => setActiveChart('bubble')}
              title="Bubble Cluster (Screenshot 1)"
              className={cn(
                'p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1',
                activeChart === 'bubble'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              <CirclesThree size={16} weight={activeChart === 'bubble' ? 'fill' : 'regular'} />
              <span className="hidden md:inline text-[11px]">Bubble</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveChart('donut')}
              title="Donut Metric (Screenshot 2)"
              className={cn(
                'p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1',
                activeChart === 'donut'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              <ChartPie size={16} weight={activeChart === 'donut' ? 'fill' : 'regular'} />
              <span className="hidden md:inline text-[11px]">Donut</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveChart('vertical_bar')}
              title="Vertical Columns (Screenshot 3)"
              className={cn(
                'p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1',
                activeChart === 'vertical_bar'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              <ChartBar size={16} weight={activeChart === 'vertical_bar' ? 'fill' : 'regular'} />
              <span className="hidden md:inline text-[11px]">Columns</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveChart('horizontal_bar')}
              title="Horizontal Bars (Screenshot 4)"
              className={cn(
                'p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1',
                activeChart === 'horizontal_bar'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              <Rows size={16} weight={activeChart === 'horizontal_bar' ? 'fill' : 'regular'} />
              <span className="hidden md:inline text-[11px]">Bars</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveChart('table')}
              title="Data Table"
              className={cn(
                'p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1',
                activeChart === 'table'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              <Table size={16} weight={activeChart === 'table' ? 'fill' : 'regular'} />
              <span className="hidden md:inline text-[11px]">Table</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Visual Display Area ── */}
      <div className="min-h-[260px] flex items-center justify-center w-full py-2">
        {activeChart === 'bubble' && (
          <BubbleClusterChart
            distributions={analytics.distributions}
            questionText={analytics.questionText}
          />
        )}

        {activeChart === 'donut' && (
          <DonutMetricChart
            distributions={analytics.distributions}
            totalAnswers={analytics.totalAnswers}
          />
        )}

        {activeChart === 'vertical_bar' && (
          <VerticalBarChart
            distributions={analytics.distributions}
            likertScore={analytics.likertScore}
          />
        )}

        {activeChart === 'horizontal_bar' && (
          <HorizontalBarChart distributions={analytics.distributions} />
        )}

        {activeChart === 'qualitative' && (
          <QualitativeInsightsView analytics={analytics} />
        )}

        {activeChart === 'table' && (
          <div className="w-full overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-3">Option / Choice</th>
                  <th className="p-3 text-right">Count</th>
                  <th className="p-3 text-right">Share (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analytics.distributions.map((dist, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3 font-medium text-slate-800 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dist.color }} />
                      <span>{dist.label}</span>
                    </td>
                    <td className="p-3 text-right font-semibold text-slate-700">
                      {dist.count}
                    </td>
                    <td className="p-3 text-right font-extrabold text-slate-900">
                      {dist.percentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Key Finding Footer ── */}
      {analytics.topAnswer && (
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <Info size={14} className="text-indigo-600 shrink-0" />
            <span>Leading Response:</span>
            <strong className="text-slate-900 font-bold">{analytics.topAnswer}</strong>
          </span>
        </div>
      )}
    </div>
  );
}
