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
      className="card p-3.5 sm:p-5 border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all bg-white rounded-2xl flex flex-col justify-between space-y-3 sm:space-y-4 w-full min-w-0 max-w-full overflow-hidden"
    >
      {/* ── Question Header ── */}
      <div className="space-y-2.5 w-full min-w-0">
        {/* Top Meta Row: Question badges on left, chart switcher toolbar on right */}
        <div className="flex items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-indigo-600 text-white font-extrabold text-[11px] sm:text-xs flex items-center justify-center shadow-xs shrink-0">
              Q{analytics.questionNumber}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {analytics.questionType.replace('_', ' ')}
            </span>
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
              {analytics.totalAnswers} Responses
            </span>
          </div>

          {/* ── Compact Chart Type Switcher Toolbar ── */}
          {analytics.questionType !== 'descriptive' && (
            <div className="flex items-center gap-0.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 shrink-0">
              <button
                type="button"
                onClick={() => setActiveChart('bubble')}
                title="Bubble Cluster View"
                className={cn(
                  'p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center',
                  activeChart === 'bubble'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                <CirclesThree size={16} weight={activeChart === 'bubble' ? 'fill' : 'regular'} />
              </button>

              <button
                type="button"
                onClick={() => setActiveChart('donut')}
                title="Donut Metric View"
                className={cn(
                  'p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center',
                  activeChart === 'donut'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                <ChartPie size={16} weight={activeChart === 'donut' ? 'fill' : 'regular'} />
              </button>

              <button
                type="button"
                onClick={() => setActiveChart('vertical_bar')}
                title="Vertical Columns View"
                className={cn(
                  'p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center',
                  activeChart === 'vertical_bar'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                <ChartBar size={16} weight={activeChart === 'vertical_bar' ? 'fill' : 'regular'} />
              </button>

              <button
                type="button"
                onClick={() => setActiveChart('horizontal_bar')}
                title="Horizontal Bars View"
                className={cn(
                  'p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center',
                  activeChart === 'horizontal_bar'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                <Rows size={16} weight={activeChart === 'horizontal_bar' ? 'fill' : 'regular'} />
              </button>

              <button
                type="button"
                onClick={() => setActiveChart('table')}
                title="Data Table View"
                className={cn(
                  'p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center',
                  activeChart === 'table'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                <Table size={16} weight={activeChart === 'table' ? 'fill' : 'regular'} />
              </button>
            </div>
          )}
        </div>

        {/* ── Question Title (Full Width) ── */}
        <h3 className="font-bold text-slate-900 text-xs sm:text-sm md:text-base leading-snug break-words w-full">
          {analytics.questionText}
        </h3>
      </div>

      {/* ── Visual Display Area ── */}
      <div className="min-h-[240px] sm:min-h-[260px] flex items-center justify-center w-full min-w-0 max-w-full overflow-hidden py-2">
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
          <div className="w-full min-w-0 max-w-full overflow-x-auto rounded-xl border border-slate-200">
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
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: dist.color }} />
                      <span className="break-words">{dist.label}</span>
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
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 w-full min-w-0">
          <span className="flex items-center gap-1.5 font-medium flex-wrap">
            <Info size={14} className="text-indigo-600 shrink-0" />
            {analytics.questionType === 'descriptive' ? (
              <span className="break-words">Participant Submissions: <strong className="text-slate-900 font-bold">{analytics.participantResponses?.length || 0} Ground Entries (Voice, Video, Photo, Text)</strong></span>
            ) : (
              <span className="break-words">
                <span>Leading Response: </span>
                <strong className="text-slate-900 font-bold">{analytics.topAnswer}</strong>
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
