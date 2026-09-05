'use client';

import { useState, useEffect, useCallback } from 'react';
import { surveysApi } from '@/lib/api/surveys';
import type { Survey } from '@/types/models';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import { ClipboardText, Plus, ArrowRight } from '@phosphor-icons/react';
import { cn, formatDate } from '@/lib/utils/formatters';
import Link from 'next/link';

interface SurveysPageProps {
  canCreate?: boolean;
  createPath?: string;
  fillPathPrefix?: string;
}

export default function SurveysListPage({ canCreate = false, createPath = '', fillPathPrefix = '/surveys' }: SurveysPageProps) {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await surveysApi.list();
      setSurveys(res.items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load surveys');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Surveys</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {canCreate ? 'Create surveys and view responses from your team' : 'Surveys assigned to you for completion'}
          </p>
        </div>
        {canCreate && createPath && (
          <Link
            href={createPath}
            id="create-survey-btn"
            style={{ backgroundColor: '#1e3a8a' }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 shadow-md shadow-blue-900/20 active:scale-95 transition-all btn-press"
          >
            <Plus size={16} weight="bold" />
            Create Survey
          </Link>
        )}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !surveys.length ? (
        <div className="card">
          <EmptyState
            icon={ClipboardText}
            title={canCreate ? 'No surveys yet' : 'No surveys assigned'}
            description={canCreate ? 'Create surveys to collect information from Fellows and Interns in your division.' : 'Surveys assigned by your Program Coordinator will appear here.'}
            action={canCreate && createPath ? { label: 'Create Survey', onClick: () => {} } : undefined}
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {surveys.map(survey => (
            <div key={survey.id} className="card card-hover p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <ClipboardText size={18} className="text-emerald-600" weight="fill" />
                </div>
                {survey.isAllocatedAsTask && (
                  <span className="badge bg-indigo-100 text-indigo-700 border-indigo-200 text-[10px]">Task</span>
                )}
              </div>

              <h3 className="font-medium text-slate-900 text-sm">{survey.title}</h3>
              {survey.description && (
                <p className="text-xs text-slate-500 mt-1 truncate-2">{survey.description}</p>
              )}

              <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
                <span>{survey.questions?.length ?? 0} questions</span>
                <span>{formatDate(survey.createdAt)}</span>
              </div>

              <div className="mt-3 flex gap-2">
                {canCreate ? (
                  <Link
                    href={`/pc/surveys/${survey.id}/responses`}
                    className="flex-1 text-center py-1.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-[var(--radius-sm)] hover:bg-slate-200"
                  >
                    View Responses
                  </Link>
                ) : (
                  <Link
                    href={`${fillPathPrefix}/${survey.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-[var(--radius-sm)] hover:bg-emerald-700"
                  >
                    Fill Survey
                    <ArrowRight size={12} />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
