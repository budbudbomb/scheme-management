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
    <div className="space-y-6 pb-20">
      {/* ── Page Header & Primary Actions ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Survey Management</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              Admin Portal
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Create structured field questionnaires, review hierarchical submissions and supervisor feedbacks, and allocate field surveys.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/surveys/new"
            id="create-survey-btn"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#152033] text-white hover:bg-[#1e2d48] border border-slate-700/60 shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer btn-press"
          >
            <Plus size={16} weight="bold" />
            <span>Create Survey</span>
          </Link>
        </div>
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#152033] text-white hover:bg-[#1e2d48] border border-slate-700/60 shadow-md transition-all"
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[88vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">{selectedSurveyForModal.title}</h3>
                  {selectedSurveyForModal.submissionStatus && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 uppercase">
                      {selectedSurveyForModal.submissionStatus.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Interviewed: {selectedSurveyForModal.responsesCount || 0} / {selectedSurveyForModal.participantsRequired || 100} •{' '}
                  {selectedSurveyForModal.questions?.length || 0} Questions
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSurveyForModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="px-6 border-b border-slate-200 flex gap-4 bg-white">
              <button
                type="button"
                onClick={() => setActiveModalTab('questions')}
                className={cn(
                  'py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer',
                  activeModalTab === 'questions'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                )}
              >
                Survey Questions ({selectedSurveyForModal.questions?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('feedback')}
                className={cn(
                  'py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5',
                  activeModalTab === 'feedback'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                )}
              >
                <span>Hierarchy Feedback & Reviews</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-700 font-bold">
                  {selectedSurveyForModal.feedbacks?.length || 0}
                </span>
              </button>
            </div>

            {/* Modal Tab Content */}
            <div className="p-6 overflow-y-auto space-y-4 max-h-[60vh]">
              {activeModalTab === 'questions' ? (
                (!selectedSurveyForModal.questions || selectedSurveyForModal.questions.length === 0) ? (
                  <p className="text-sm text-slate-400 italic">No questions defined for this survey yet.</p>
                ) : (
                  selectedSurveyForModal.questions.map((q: SurveyQuestion, idx: number) => (
                    <div key={q.id || idx} className="p-4 rounded-xl border border-slate-200 space-y-2 bg-slate-50/50">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800">{q.question}</span>
                          {q.required && <span className="text-rose-500 text-xs">*</span>}
                        </div>
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                          {q.type.replace('_', ' ')}
                        </span>
                      </div>

                      {q.options && q.options.length > 0 && (
                        <div className="pl-7 flex flex-wrap gap-1.5 pt-1">
                          {q.options.map((opt: string, oIdx: number) => (
                            <span key={oIdx} className="text-xs px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700">
                              {opt}
                            </span>
                          ))}
                        </div>
                      )}

                      {q.type === 'likert_scale' && (
                        <div className="pl-7 text-xs text-purple-700 font-medium">
                          5-Point Scale:{' '}
                          {(q.likertConfig?.labels || [
                            q.likertConfig?.lowLabel || 'Very Dissatisfied',
                            'Dissatisfied',
                            q.likertConfig?.midLabel || 'Neutral',
                            'Satisfied',
                            q.likertConfig?.highLabel || 'Very Satisfied',
                          ]).join('  →  ')}
                        </div>
                      )}

                      {q.type === 'dichotomous' && (
                        <div className="pl-7 text-xs text-amber-700 font-medium">
                          Binary Options: {q.dichotomousLabels?.[0] || 'Yes'} / {q.dichotomousLabels?.[1] || 'No'}
                        </div>
                      )}

                      {q.type === 'descriptive' && (
                        <div className="pl-7 text-xs text-slate-400 italic">
                          Open descriptive text response
                        </div>
                      )}
                    </div>
                  ))
                )
              ) : (
                /* Hierarchy Feedback Trail */
                (!selectedSurveyForModal.feedbacks || selectedSurveyForModal.feedbacks.length === 0) ? (
                  <div className="text-center py-8 space-y-2">
                    <p className="text-sm font-semibold text-slate-600">No hierarchy reviews submitted yet</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      When Interns submit to Fellows, Fellows to Program Coordinators, and PCs to CPM/SPM, their field observations and reviews appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedSurveyForModal.feedbacks.map((fb: SurveyFeedback, fIdx: number) => {
                      const roleColors: Record<string, string> = {
                        intern: 'bg-amber-50 text-amber-800 border-amber-200',
                        fellow: 'bg-blue-50 text-blue-800 border-blue-200',
                        pc: 'bg-purple-50 text-purple-800 border-purple-200',
                      };
                      const rolePill = roleColors[fb.role] || 'bg-slate-100 text-slate-800 border-slate-200';

                      return (
                        <div key={fb.id || fIdx} className="p-4 rounded-xl border border-slate-200/90 bg-white space-y-3 shadow-2xs">
                          {/* Author & Header */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">{fb.submittedBy.name}</span>
                              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase', rolePill)}>
                                {fb.role}
                              </span>
                              <span className="text-xs text-slate-400">→</span>
                              <span className="text-[10px] font-semibold text-slate-500 uppercase">
                                To {fb.submittedToRole}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {formatDate(fb.createdAt)}
                            </span>
                          </div>

                          {/* Stakeholders interviewed metric */}
                          {fb.stakeholdersInterviewedCount !== undefined && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
                              <span>👥 Stakeholders Interviewed:</span>
                              <span className="font-bold text-slate-900">{fb.stakeholdersInterviewedCount}</span>
                            </div>
                          )}

                          {/* Observations / Feedback text */}
                          <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-100 text-xs text-slate-700 leading-relaxed">
                            <span className="font-bold text-slate-900 block mb-1">Field Observations / Review:</span>
                            {fb.feedbackText}
                          </div>

                          {/* Challenges */}
                          {fb.challengesFaced && (
                            <div className="bg-rose-50/50 p-3 rounded-lg border border-rose-100 text-xs text-rose-900 leading-relaxed">
                              <span className="font-bold text-rose-950 block mb-1">⚠️ Ground Challenges:</span>
                              {fb.challengesFaced}
                            </div>
                          )}

                          {/* Recommendations */}
                          {fb.recommendations && (
                            <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 text-xs text-emerald-900 leading-relaxed">
                              <span className="font-bold text-emerald-950 block mb-1">💡 Recommendations:</span>
                              {fb.recommendations}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <button
                type="button"
                onClick={() => setSelectedSurveyForModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
              <div className="flex items-center gap-2">
                {!selectedSurveyForModal.isAllocatedAsTask && (selectedSurveyForModal.responsesCount || 0) === 0 && (
                  <Link
                    href={`/admin/tasks/new?surveyId=${selectedSurveyForModal.id}&surveyName=${encodeURIComponent(selectedSurveyForModal.title)}`}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors flex items-center gap-1.5"
                  >
                    <span>Allocate as Task</span>
                    <ArrowRight size={13} weight="bold" />
                  </Link>
                )}
                <Link
                  href={`/admin/surveys/${selectedSurveyForModal.id}/dashboard`}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-indigo-600 transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <ChartBar size={14} weight="bold" />
                  <span>Open Full Dashboard</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

