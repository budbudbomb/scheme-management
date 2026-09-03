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
import type { Survey, SurveyQuestion } from '@/types/models';
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
            Create structured field questionnaires, monitor participant response progress, and allocate surveys as field tasks.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/surveys/new"
            id="create-survey-btn"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer btn-press"
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md transition-all"
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

            return (
              <div
                key={survey.id}
                className="card p-5 border border-slate-200/90 hover:border-indigo-200 hover:shadow-md transition-all flex flex-col justify-between gap-4 bg-white relative group"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle size={12} weight="bold" />
                      Active
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {questionCount} {questionCount === 1 ? 'Question' : 'Questions'}
                    </span>
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

                  {/* Progress Bar (Responses vs Required) */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-600">Responses Progress</span>
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
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSurveyForModal(survey)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <Eye size={15} />
                    <span>View Questions</span>
                  </button>

                  <Link
                    href={`/admin/tasks/new?surveyId=${survey.id}&surveyName=${encodeURIComponent(survey.title)}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                  >
                    <span>Allocate Task</span>
                    <ArrowRight size={13} weight="bold" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Survey Details & Questions Modal ── */}
      {selectedSurveyForModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{selectedSurveyForModal.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Target: {selectedSurveyForModal.participantsRequired || 100} participants •{' '}
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

            {/* Questions List */}
            <div className="p-6 overflow-y-auto space-y-4">
              {(!selectedSurveyForModal.questions || selectedSurveyForModal.questions.length === 0) ? (
                <p className="text-sm text-slate-400 italic">No questions defined for this survey yet.</p>
              ) : (
                selectedSurveyForModal.questions.map((q, idx) => (
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

                    {/* Render preview of options / likert / dichotomous */}
                    {q.options && q.options.length > 0 && (
                      <div className="pl-7 flex flex-wrap gap-1.5 pt-1">
                        {q.options.map((opt, oIdx) => (
                          <span key={oIdx} className="text-xs px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700">
                            {opt}
                          </span>
                        ))}
                      </div>
                    )}

                    {q.type === 'likert_scale' && (
                      <div className="pl-7 text-xs text-purple-700 font-medium">
                        5-Point Scale: {q.likertConfig?.lowLabel || 'Strongly Disagree'} →{' '}
                        {q.likertConfig?.highLabel || 'Strongly Agree'}
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
              <Link
                href={`/admin/tasks/new?surveyId=${selectedSurveyForModal.id}&surveyName=${encodeURIComponent(selectedSurveyForModal.title)}`}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <span>Allocate as Task</span>
                <ArrowRight size={14} weight="bold" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
