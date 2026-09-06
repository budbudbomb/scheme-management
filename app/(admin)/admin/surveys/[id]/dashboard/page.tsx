import SurveyDashboardClient from '@/components/surveys/analytics/SurveyDashboardClient';

export function generateStaticParams() {
  return [
    { id: 'demo' },
    { id: 'surv-01' },
    { id: 'surv-02' },
    { id: 'surv-03' },
    { id: 'survey-01' },
    { id: 'survey-02' },
    { id: 'survey-03' },
  ];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SurveyDashboardPage({ params }: PageProps) {
  const resolved = await params;
  return <SurveyDashboardClient surveyId={resolved.id} />;
}
