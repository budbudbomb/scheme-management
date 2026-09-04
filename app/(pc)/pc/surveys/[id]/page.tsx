import FillSurveyPageContainer from '@/components/surveys/FillSurveyPageContainer';

export function generateStaticParams() {
  return [{ id: 'demo' }];
}

export default function SurveyPage() {
  return <FillSurveyPageContainer backHref="/pc/surveys" />;
}
