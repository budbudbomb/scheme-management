'use client';

import React from 'react';
import { ChatTeardropText, MapPin, Sparkle, WarningCircle } from '@phosphor-icons/react';
import type { QuestionAnalytics } from '@/lib/utils/surveyAnalytics';

interface QualitativeInsightsViewProps {
  analytics: QuestionAnalytics;
}

export default function QualitativeInsightsView({
  analytics,
}: QualitativeInsightsViewProps) {
  const sentimentBadges = {
    positive: { label: 'Positive', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    suggestion: { label: 'Policy Suggestion', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    neutral: { label: 'Observation', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  };

  return (
    <div className="w-full space-y-4 p-2">
      {/* Sentiment Breakdown Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Community Sentiment Synthesis</span>
          <span className="font-bold text-slate-800">{analytics.totalAnswers} Qualitative Entries</span>
        </div>
        <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100">
          {analytics.distributions.map((dist, idx) => (
            <div
              key={idx}
              className="h-full transition-all duration-500"
              style={{ width: `${dist.percentage}%`, backgroundColor: dist.color }}
              title={`${dist.label}: ${dist.percentage}%`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          {analytics.distributions.map((dist, idx) => (
            <span key={idx} className="flex items-center gap-1.5 font-semibold">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dist.color }} />
              <span>{dist.label} ({dist.percentage}%)</span>
            </span>
          ))}
        </div>
      </div>

      {/* Field Quotes / Qualitative Entries */}
      <div className="space-y-2.5 pt-2">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          Key Representative Field Voices:
        </span>
        <div className="grid gap-2 sm:grid-cols-2">
          {analytics.textResponses?.map((resp) => {
            const badge = sentimentBadges[resp.sentiment];
            return (
              <div
                key={resp.id}
                className="p-3 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:shadow-xs transition-all flex flex-col justify-between gap-2"
              >
                <p className="text-xs text-slate-800 leading-relaxed italic">
                  "{resp.text}"
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                  <span className={`px-2 py-0.5 rounded-full border font-bold ${badge.bg}`}>
                    {badge.label}
                  </span>
                  {resp.authorLocation && (
                    <span className="flex items-center gap-1 text-slate-400 font-medium">
                      <MapPin size={11} className="text-slate-400" />
                      {resp.authorLocation}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
