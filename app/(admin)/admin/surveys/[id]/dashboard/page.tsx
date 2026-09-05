'use client';

import React, { useState, useEffect, useMemo, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ChartBar,
  Users,
  CheckCircle,
  Clock,
  Printer,
  MagnifyingGlass,
  Funnel,
  Sparkle,
  TreeStructure,
  MapPin,
  DownloadSimple,
  Sliders,
  ChatCircleText,
  FileText,
} from '@phosphor-icons/react';
import { surveysApi } from '@/lib/api/surveys';
import type { Survey } from '@/types/models';
import {
  getSurveyAnalytics,
  generateExpandedQuestions,
  type SurveyAnalyticsData,
} from '@/lib/utils/surveyAnalytics';
import QuestionAnalyticsCard from '@/components/surveys/analytics/QuestionAnalyticsCard';
import LocationHierarchyFilter from '@/components/surveys/analytics/LocationHierarchyFilter';
import type { LocationFilterState } from '@/lib/utils/locationData';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { cn, formatDate } from '@/lib/utils/formatters';

interface SurveyDashboardPageProps {
  params: Promise<{ id: string }>;
}

export default function SurveyDashboardPage({ params }: SurveyDashboardPageProps) {
  const resolvedParams = use(params);
  const surveyId = resolvedParams.id;

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [expandTo30, setExpandTo30] = useState<boolean>(true); // Default to enabled so CPM/SPM can immediately see 30-question performance
  const [locationFilter, setLocationFilter] = useState<LocationFilterState>({});

  useEffect(() => {
    async function loadSurvey() {
      setLoading(true);
      setError(null);
      try {
        const found = await surveysApi.getById(surveyId);
        setSurvey(found);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Survey not found');
      } finally {
        setLoading(false);
      }
    }
    loadSurvey();
  }, [surveyId]);

  // Compute analytics data
  const analyticsData: SurveyAnalyticsData | null = useMemo(() => {
    if (!survey) return null;

    const baseQuestions = survey.questions || [];
    const questionsToUse = expandTo30
      ? generateExpandedQuestions(baseQuestions)
      : baseQuestions;

    const effectiveSurvey: Survey = {
      ...survey,
      questions: questionsToUse,
    };

    return getSurveyAnalytics(effectiveSurvey, locationFilter);
  }, [survey, expandTo30, locationFilter]);

  // Filter questions based on search & type filter
  const filteredQuestions = useMemo(() => {
    if (!analyticsData) return [];

    return analyticsData.questionsAnalytics.filter(q => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `q${q.questionNumber}`.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType =
        selectedTypeFilter === 'all' ||
        q.questionType === selectedTypeFilter;

      return matchesSearch && matchesType;
    });
  }, [analyticsData, searchQuery, selectedTypeFilter]);

  const scrollToQuestion = (qNum: number) => {
    const el = document.getElementById(`question-card-${qNum}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-indigo-500');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-indigo-500');
      }, 1500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-20 max-w-7xl mx-auto">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !survey || !analyticsData) {
    return (
      <div className="card p-10 text-center space-y-4 max-w-xl mx-auto my-12">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ChartBar size={24} weight="bold" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Survey Dashboard Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested survey analytics could not be compiled or does not exist.
        </p>
        <Link
          href="/admin/surveys"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          <ArrowLeft size={14} weight="bold" />
          <span>Return to Survey Management</span>
        </Link>
      </div>
    );
  }

  const questionCount = analyticsData.questionsAnalytics.length;

  return (
    <div className="space-y-6 pb-36 sm:pb-32 max-w-7xl mx-auto w-full min-w-0 max-w-full">
      {/* ── Top Back Navigation & Header Bar ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/admin/surveys"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors p-1 -ml-1 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft size={14} weight="bold" />
              <span>Back to Surveys</span>
            </Link>
            <span className="text-slate-300">•</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 uppercase">
              {survey.submissionStatus ? survey.submissionStatus.replace(/_/g, ' ') : 'IN PROGRESS'}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>{survey.title}</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 max-w-3xl">
            {survey.description || 'Comprehensive question-by-question response breakdown and visual distribution analysis.'}
          </p>
        </div>

        {/* Action Buttons: Print / Export */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shadow-2xs transition-colors cursor-pointer"
          >
            <Printer size={15} weight="bold" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* ── Administrative 5-Level Cascading Drilldown Location Filter ── */}
      <LocationHierarchyFilter
        value={locationFilter}
        onChange={setLocationFilter}
        filteredCount={analyticsData.totalInterviewed}
        totalCount={survey.responsesCount || 112}
      />

      {/* ── Executive Metric KPI Strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Stakeholders Interviewed */}
        <div className="card p-4 sm:p-5 border border-slate-200/90 shadow-2xs bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Stakeholders Interviewed
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users size={18} weight="bold" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {analyticsData.totalInterviewed}
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              / {analyticsData.quotaRequired} ({analyticsData.completionRate}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${analyticsData.completionRate}%` }}
            />
          </div>
        </div>

        {/* Survey Scale & Questions */}
        <div className="card p-4 sm:p-5 border border-slate-200/90 shadow-2xs bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Questions Analyzed
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText size={18} weight="bold" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {questionCount}
            </span>
            <span className="text-xs text-indigo-600 font-bold">
              {expandTo30 ? 'Comprehensive (30 Qs)' : 'Standard'}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
            <label className="text-[11px] font-semibold text-slate-500 cursor-pointer flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={expandTo30}
                onChange={e => setExpandTo30(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
              />
              <span>Full 30 Questions</span>
            </label>
          </div>
        </div>

        {/* Average Interview Duration */}
        <div className="card p-4 sm:p-5 border border-slate-200/90 shadow-2xs bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Avg Time / Interview
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock size={18} weight="bold" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {analyticsData.averageTimeMinutes} <span className="text-sm font-semibold text-slate-500">mins</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">High respondent engagement</p>
        </div>

        {/* Geographic Coverage / Field Reach */}
        <div className="card p-4 sm:p-5 border border-slate-200/90 shadow-2xs bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Villages Covered
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <MapPin size={18} weight="bold" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {analyticsData.villagesCovered}
            </span>
            <span className="text-xs text-purple-600 font-bold uppercase">
              Villages
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {locationFilter?.village
              ? `Village: ${locationFilter.village}`
              : locationFilter?.gramPanchayat
              ? `GP: ${locationFilter.gramPanchayat}`
              : locationFilter?.block
              ? `Block: ${locationFilter.block}`
              : locationFilter?.district
              ? `District: ${locationFilter.district}`
              : locationFilter?.division
              ? `Division: ${locationFilter.division}`
              : 'Statewide MP Field Coverage'}
          </p>
        </div>
      </div>

      {/* ── Sticky Question Navigator Strip (handles up to 30 questions) ── */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200/90 shadow-sm space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Jump to Question ({filteredQuestions.length}):
            </span>
          </div>

          {/* Search bar inside navigator */}
          <div className="relative w-full sm:max-w-xs">
            <MagnifyingGlass size={15} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search in questions (e.g. water, road)…"
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Quick jump pills Q1..Q30 */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {analyticsData.questionsAnalytics.map(q => {
            const isMatch = filteredQuestions.some(fq => fq.questionNumber === q.questionNumber);
            return (
              <button
                key={q.questionNumber}
                type="button"
                onClick={() => scrollToQuestion(q.questionNumber)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer',
                  isMatch
                    ? 'bg-slate-100 text-slate-700 hover:bg-indigo-600 hover:text-white border border-slate-200'
                    : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                )}
                title={`Q${q.questionNumber}: ${q.questionText}`}
              >
                Q{q.questionNumber}
              </button>
            );
          })}
        </div>

        {/* Question Type Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-100">
          {[
            { id: 'all', label: 'All Question Types' },
            { id: 'likert_scale', label: 'Likert Scale (Rating)' },
            { id: 'single_choice', label: 'Single Choice' },
            { id: 'multiple_choice', label: 'Multiple Choice' },
            { id: 'dichotomous', label: 'Binary (Yes / No)' },
            { id: 'descriptive', label: 'Descriptive' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedTypeFilter(tab.id)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap',
                selectedTypeFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Question Analytics Cards Grid ── */}
      {filteredQuestions.length === 0 ? (
        <div className="card p-12 text-center space-y-3 bg-white border border-slate-200">
          <p className="text-sm font-bold text-slate-800">No matching questions found</p>
          <p className="text-xs text-slate-400">
            Try adjusting your search query "{searchQuery}" or selected question filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedTypeFilter('all');
            }}
            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full min-w-0 max-w-full">
          {filteredQuestions.map((qAnalytics, idx) => (
            <QuestionAnalyticsCard
              key={qAnalytics.questionId || idx}
              analytics={qAnalytics}
              index={idx}
            />
          ))}
        </div>
      )}
    </div>
  );
}
