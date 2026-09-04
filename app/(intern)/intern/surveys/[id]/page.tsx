import FillSurveyPageContainer from '@/components/surveys/FillSurveyPageContainer';

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

export default function SurveyPage() {
  return <FillSurveyPageContainer backHref="/intern/surveys" />;
}
