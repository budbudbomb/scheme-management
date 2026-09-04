'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { surveysApi } from '@/lib/api/surveys';
import type { Survey } from '@/types/models';
import SurveyFillForm from '@/components/surveys/SurveyFillForm';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import ErrorState from '@/components/shared/ErrorState';

interface FillSurveyPageContainerProps {
  backHref?: string;
}

export default function FillSurveyPageContainer({ backHref = '/intern/surveys' }: FillSurveyPageContainerProps) {
  const params = useParams();
  const id = (params?.id as string) || '';

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    surveysApi
      .getById(id)
      .then((s) => setSurvey(s))
      .catch((err) => setError(err instanceof Error ? err.message : 'Survey not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 py-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <ErrorState message={error || 'Survey not found'} onRetry={() => {
          setLoading(true);
          surveysApi.getById(id).then(setSurvey).catch(e => setError(e.message)).finally(() => setLoading(false));
        }} />
      </div>
    );
  }

  return <SurveyFillForm survey={survey} backHref={backHref} />;
}
