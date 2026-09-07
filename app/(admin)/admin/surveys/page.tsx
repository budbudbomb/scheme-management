'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ClipboardText,
  Plus,
  CheckCircle,
  Clock,
  Users,
  Calendar,
  MagnifyingGlass,
  ArrowRight,
  Eye,
  Sliders,
  CheckSquare,
  RadioButton,
  ToggleLeft,
  TextT,
  ChartBar,
  X,
  FilePlus,
  Sparkle,
} from '@phosphor-icons/react';
import { cn, formatDate } from '@/lib/utils/formatters';
import { surveysApi } from '@/lib/api/surveys';
import type { Survey, SurveyQuestion, SurveyFeedback } from '@/types/models';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';

export default function AdminSurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed' | 'draft'>('all');
  const [selectedSurveyForModal, setSelectedSurveyForModal] = useState<Survey | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'questions' | 'feedback'>('questions');

  const fetchSurveys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await surveysApi.list();
      setSurveys(res.items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load surveys');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);

  // Calculations for KPI stats
  const totalSurveys = surveys.length;
  const activeSurveys = surveys.filter(s => s.status !== 'closed').length;
  const totalRequired = surveys.reduce((acc, s) => acc + (s.participantsRequired || 100), 0);
  const totalResponses = surveys.reduce((acc, s) => acc + (s.responsesCount || 0), 0);
  const overallRate = totalRequired > 0 ? Math.round((totalResponses / totalRequired) * 100) : 0;

  const filteredSurveys = surveys.filter(s => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && s.status !== 'closed') ||
      (statusFilter === 'closed' && s.status === 'closed') ||
      (statusFilter === 'draft' && s.status === 'draft');
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (subStatus?: string, surveyStatus?: string) => {
    if (subStatus === 'approved') {
      return { label: 'Approved', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (subStatus === 'submitted_by_pc') {
      return { label: 'Submitted by PC', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
    }
    if (subStatus === 'submitted_by_fellow') {
      return { label: 'Submitted by Fellow', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
    if (subStatus === 'submitted_by_intern') {
      return { label: 'Submitted by Intern', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    if (surveyStatus === 'closed') {
      return { label: 'Closed', bg: 'bg-slate-100 text-slate-600 border-slate-200' };
    }
    return { label: 'Active (Draft)', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  return (
    <div className="space-y-4 sm:space-y-5 pb-20">
      {/* ── Frozen Sticky Header & Full-Width Subheader ── */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md pt-2.5 pb-3 -mx-4 sm:-mx-6 px-4 sm:px-6 border-b border-slate-100 shadow-2xs space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Survey Management
          </h1>
          <Link
            href="/admin/surveys/new"
            id="create-survey-btn"
            style={{ backgroundColor: '#1e3a8a' }}
            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 shadow-md shadow-blue-900/20 active:scale-95 transition-all cursor-pointer btn-press"
          >
            <Plus size={16} weight="bold" />
            <span>Create Survey</span>
          </Link>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 w-full leading-relaxed">
          Create structured field questionnaires, review hierarchical submissions and supervisor feedbacks, and allocate field surveys.
        </p>
      </div>

      {/* ── Executive KPI Metric Strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="card p-4 sm:p-5 border border-slate-200/80 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Surveys</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ClipboardText size={18} weight="bold" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">{totalSurveys}</div>
          <p className="text-[11px] text-slate-400 mt-1">Created state-wide</p>
        </div>

        <div className="card p-4 sm:p-5 border border-slate-200/80 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Surveys</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle size={18} weight="bold" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-2">{activeSurveys}</div>
          <p className="text-[11px] text-slate-400 mt-1">Currently open for responses</p>
        </div>

        <div className="card p-4 sm:p-5 border border-slate-200/80 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Target</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users size={18} weight="bold" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">{totalRequired}</div>
          <p className="text-[11px] text-slate-400 mt-1">Participants required</p>
        </div>

        <div className="card p-4 sm:p-5 border border-slate-200/80 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Responses Collected</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ChartBar size={18} weight="bold" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalResponses}</span>
            <span className="text-xs font-semibold text-emerald-600">({overallRate}%)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">From Fellows and Interns</p>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="card p-3 sm:p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between flex-wrap gap-3">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Surveys', count: surveys.length },
            { id: 'active', label: 'Active', count: activeSurveys },
            { id: 'closed', label: 'Closed', count: surveys.filter(s => s.status === 'closed').length },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as any)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap',
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  'ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                  statusFilter === tab.id ? 'bg-slate-700 text-white' : 'bg-white text-slate-500'
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-xs">
          <MagnifyingGlass size={16} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by survey name…"
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* ── Surveys List / Grid ── */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchSurveys} />
      ) : filteredSurveys.length === 0 ? (
        <div className="card p-10 text-center space-y-4">
          <EmptyState
            icon={ClipboardText}
            title="No surveys found"
            description={
              searchTerm
                ? `No surveys matched your search "${searchTerm}".`
                : 'Get started by creating your first structured survey questionnaire.'
            }
          />
          <div className="pt-2">
            <Link
              href="/admin/surveys/new"
              style={{ backgroundColor: '#1e3a8a' }}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 shadow-md shadow-blue-900/20 transition-all"
            >
              <Plus size={16} weight="bold" />
              <span>Create Survey Now</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSurveys.map(survey => {
            const req = survey.participantsRequired || 100;
            const resCount = survey.responsesCount || 0;
            const percent = Math.min(100, Math.round((resCount / req) * 100));
            const questionCount = survey.questions?.length || 0;
            const feedbackCount = survey.feedbacks?.length || 0;
            const badge = getStatusBadge(survey.submissionStatus, survey.status);

            return (
              <div
                key={survey.id}
                className="card p-5 border border-slate-200/90 hover:border-indigo-200 hover:shadow-md transition-all flex flex-col justify-between gap-4 bg-white relative group"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className={cn('text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1', badge.bg)}>
                      <CheckCircle size={12} weight="bold" />
                      {badge.label}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {feedbackCount > 0 && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                          💬 {feedbackCount} {feedbackCount === 1 ? 'Review' : 'Reviews'}
                        </span>
                      )}
                      <span className="text-xs text-slate-400 font-medium">
                        {questionCount} {questionCount === 1 ? 'Q' : 'Qs'}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-indigo-600 transition-colors">
                      {survey.title}
                    </h3>
                    {survey.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {survey.description}
                      </p>
                    )}
                  </div>

                  {/* Date Range */}
                  {(survey.startDate || survey.endDate) && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <Calendar size={14} className="text-indigo-500 shrink-0" />
                      <span>
                        {survey.startDate ? formatDate(survey.startDate) : 'Open'} →{' '}
                        {survey.endDate ? formatDate(survey.endDate) : 'Ongoing'}
                      </span>
                    </div>
                  )}

                  {/* Progress Bar (Stakeholders Interviewed vs Required) */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-600">Stakeholders Interviewed</span>
                      <span className="font-bold text-slate-900">
                        {resCount} / {req} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full transition-all duration-500 rounded-full',
                          percent >= 100
                            ? 'bg-emerald-500'
                            : percent >= 50
                            ? 'bg-indigo-600'
                            : 'bg-amber-500'
                        )}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSurveyForModal(survey);
                      setActiveModalTab(survey.feedbacks && survey.feedbacks.length > 0 ? 'feedback' : 'questions');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200"
                  >
                    <Eye size={14} />
                    <span>Details {feedbackCount > 0 && `(${feedbackCount})`}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Only show Allocate Task if survey is fresh/unallocated and has 0 responses */}
                    {!survey.isAllocatedAsTask && (survey.responsesCount || 0) === 0 && (
                      <Link
                        href={`/admin/tasks/new?surveyId=${survey.id}&surveyName=${encodeURIComponent(survey.title)}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                      >
                        <span>Allocate</span>
                        <ArrowRight size={13} weight="bold" />
                      </Link>
                    )}

                    {/* Primary View Dashboard button requested on each Survey Card */}
                    <Link
                      href={`/admin/surveys/${survey.id}/dashboard`}
                      id={`view-dashboard-btn-${survey.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-indigo-600 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                    >
                      <ChartBar size={14} weight="bold" />
                      <span>View Dashboard</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Survey Details & Hierarchy Reviews Modal ── */}
      {selectedSurveyForModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden border border-slate-200/80 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">

            {/* ── Modal Header ── */}
            <div className="relative px-5 pt-5 pb-4 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 overflow-hidden shrink-0">
              {/* Decorative blobs */}
              <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-8 w-20 h-20 rounded-full bg-purple-500/15 blur-2xl pointer-events-none" />

              {/* Drag handle — mobile only */}
              <div className="sm:hidden w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />

              <div className="flex items-start justify-between gap-3 relative z-10">
                <div className="flex items-start gap-3 min-w-0">
                  {/* Icon badge */}
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center shrink-0 mt-0.5">
                    <ClipboardText size={20} weight="bold" className="text-indigo-200" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-base leading-snug line-clamp-2">
                      {selectedSurveyForModal.title}
                    </h3>
                    <div className="flex items-center flex-wrap gap-2 mt-1.5">
                      {selectedSurveyForModal.submissionStatus && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-400/25 text-purple-200 border border-purple-400/30 uppercase tracking-wide">
                          {selectedSurveyForModal.submissionStatus.replace(/_/g, ' ')}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 font-medium">
                        {selectedSurveyForModal.questions?.length || 0} questions
                      </span>
                      <span className="text-slate-600 text-[11px]">•</span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {selectedSurveyForModal.responsesCount || 0} / {selectedSurveyForModal.participantsRequired || 100} interviewed
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSurveyForModal(null)}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer shrink-0 mt-0.5"
                  aria-label="Close"
                >
                  <X size={16} weight="bold" />
                </button>
              </div>
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-1 px-4 py-2.5 bg-slate-50 border-b border-slate-200 shrink-0">
              {[
                {
                  key: 'questions',
                  label: 'Survey Questions',
                  count: selectedSurveyForModal.questions?.length || 0,
                  countColor: 'bg-slate-200 text-slate-700',
                },
                {
                  key: 'feedback',
                  label: 'Hierarchy Reviews',
                  count: selectedSurveyForModal.feedbacks?.length || 0,
                  countColor: 'bg-purple-100 text-purple-700',
                },
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveModalTab(tab.key as 'questions' | 'feedback')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer',
                    activeModalTab === tab.key
                      ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
                  )}
                >
                  <span>{tab.label}</span>
                  <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center', tab.countColor)}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* ── Tab Content ── */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
              {activeModalTab === 'questions' ? (
                (!selectedSurveyForModal.questions || selectedSurveyForModal.questions.length === 0) ? (
                  <div className="text-center py-10 space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
                      <ClipboardText size={24} className="text-slate-400" />
                    </div>
                    <p className="text-sm font-semibold text-slate-500">No questions yet</p>
                  </div>
                ) : (
                  selectedSurveyForModal.questions.map((q: SurveyQuestion, idx: number) => (
                    <div key={q.id || idx} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                      {/* Question header strip */}
                      <div className="flex items-start gap-3 px-4 py-3">
                        <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 leading-snug">
                            {q.question}
                            {q.required && <span className="text-rose-500 ml-0.5">*</span>}
                          </p>
                          <span className="inline-block mt-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 tracking-wide">
                            {q.type.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>

                      {(q.options && q.options.length > 0) && (
                        <div className="px-4 pb-3 pt-0 flex flex-wrap gap-1.5">
                          {q.options.map((opt: string, oIdx: number) => (
                            <span key={oIdx} className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 font-medium">
                              {opt}
                            </span>
                          ))}
                        </div>
                      )}

                      {q.type === 'likert_scale' && (
                        <div className="px-4 pb-3 text-[11px] text-purple-700 font-medium">
                          {(q.likertConfig?.labels || [
                            q.likertConfig?.lowLabel || 'Very Dissatisfied',
                            'Dissatisfied',
                            q.likertConfig?.midLabel || 'Neutral',
                            'Satisfied',
                            q.likertConfig?.highLabel || 'Very Satisfied',
                          ]).join(' → ')}
                        </div>
                      )}

                      {q.type === 'dichotomous' && (
                        <div className="px-4 pb-3 flex gap-1.5">
                          {[q.dichotomousLabels?.[0] || 'Yes', q.dichotomousLabels?.[1] || 'No'].map((lbl, i) => (
                            <span key={i} className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-semibold">{lbl}</span>
                          ))}
                        </div>
                      )}

                      {q.type === 'descriptive' && (
                        <div className="px-4 pb-3 text-[11px] text-slate-400 italic">Open text response</div>
                      )}
                    </div>
                  ))
                )
              ) : (
                /* ── Hierarchy Feedback Tab ── */
                (!selectedSurveyForModal.feedbacks || selectedSurveyForModal.feedbacks.length === 0) ? (
                  <div className="text-center py-10 space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
                      <Users size={24} className="text-slate-400" />
                    </div>
                    <p className="text-sm font-semibold text-slate-500">No reviews submitted yet</p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                      Field observations from Interns, Fellows, and PCs will appear here as the survey progresses.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedSurveyForModal.feedbacks.map((fb: SurveyFeedback, fIdx: number) => {
                      const roleConfig: Record<string, { pill: string; border: string; avatar: string; initials: string }> = {
                        intern:  { pill: 'bg-amber-50 text-amber-700 border-amber-200',  border: 'border-l-amber-400',  avatar: 'bg-amber-100 text-amber-700',  initials: 'IN' },
                        fellow:  { pill: 'bg-blue-50 text-blue-700 border-blue-200',     border: 'border-l-blue-400',   avatar: 'bg-blue-100 text-blue-700',    initials: 'FL' },
                        pc:      { pill: 'bg-purple-50 text-purple-700 border-purple-200', border: 'border-l-purple-400', avatar: 'bg-purple-100 text-purple-700', initials: 'PC' },
                      };
                      const cfg = roleConfig[fb.role] || { pill: 'bg-slate-100 text-slate-700 border-slate-200', border: 'border-l-slate-400', avatar: 'bg-slate-100 text-slate-700', initials: '??' };
                      const nameInitials = fb.submittedBy.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

                      return (
                        <div key={fb.id || fIdx} className={cn('rounded-xl bg-white border border-slate-200/80 border-l-4 shadow-sm overflow-hidden', cfg.border)}>

                          {/* Card Header */}
                          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
                            {/* Avatar */}
                            <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-extrabold shrink-0', cfg.avatar)}>
                              {nameInitials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center flex-wrap gap-1.5">
                                <span className="text-xs font-bold text-slate-900 truncate">{fb.submittedBy.name}</span>
                                <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full border uppercase tracking-wide', cfg.pill)}>
                                  {fb.role}
                                </span>
                                <span className="text-[10px] text-slate-400">→</span>
                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{fb.submittedToRole.replace(/_/g, ' ')}</span>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(fb.createdAt)}</p>
                            </div>
                            {fb.stakeholdersInterviewedCount !== undefined && (
                              <div className="flex flex-col items-center shrink-0 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                                <span className="text-base font-extrabold text-slate-900 leading-none">{fb.stakeholdersInterviewedCount}</span>
                                <span className="text-[9px] text-slate-400 font-semibold mt-0.5 text-center leading-tight">Stakeholders<br/>Interviewed</span>
                              </div>
                            )}
                          </div>

                          {/* Card Body */}
                          <div className="p-4 space-y-2.5">
                            {/* Field Observations */}
                            <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">📋 Field Observations</p>
                              <p className="text-xs text-slate-700 leading-relaxed">{fb.feedbackText}</p>
                            </div>

                            {/* Ground Challenges */}
                            {fb.challengesFaced && (
                              <div className="rounded-lg bg-rose-50 border border-rose-100 p-3">
                                <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-1.5">⚠️ Ground Challenges</p>
                                <p className="text-xs text-rose-800 leading-relaxed">{fb.challengesFaced}</p>
                              </div>
                            )}

                            {/* Recommendations */}
                            {fb.recommendations && (
                              <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3">
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1.5">💡 Recommendations</p>
                                <p className="text-xs text-emerald-800 leading-relaxed">{fb.recommendations}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>

            {/* ── Modal Footer ── */}
            <div className="px-4 sm:px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedSurveyForModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close
              </button>
              <div className="flex items-center gap-2">
                {!selectedSurveyForModal.isAllocatedAsTask && (selectedSurveyForModal.responsesCount || 0) === 0 && (
                  <Link
                    href={`/admin/tasks/new?surveyId=${selectedSurveyForModal.id}&surveyName=${encodeURIComponent(selectedSurveyForModal.title)}`}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Allocate as Task</span>
                    <ArrowRight size={13} weight="bold" />
                  </Link>
                )}
                <Link
                  href={`/admin/surveys/${selectedSurveyForModal.id}/dashboard`}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <ChartBar size={14} weight="bold" />
                  <span>Full Dashboard</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

