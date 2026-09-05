import type { Survey, SurveyQuestion } from '@/types/models';

export interface OptionDistribution {
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface QuestionAnalytics {
  questionId: string;
  questionNumber: number;
  questionText: string;
  questionType: SurveyQuestion['type'];
  totalAnswers: number;
  distributions: OptionDistribution[];
  likertScore?: number; // Average score out of 5 if likert
  topAnswer?: string;
  textResponses?: { id: string; text: string; sentiment: 'positive' | 'neutral' | 'suggestion'; authorLocation?: string }[];
}

export interface SurveyAnalyticsData {
  survey: Survey;
  totalInterviewed: number;
  quotaRequired: number;
  completionRate: number;
  averageTimeMinutes: number;
  questionsAnalytics: QuestionAnalytics[];
}

// Consistent palette matching user screenshots:
// Lime green (#4ade80), Teal (#14b8a6), Sky blue (#0ea5e9), Amber (#f59e0b), Rose red (#ef4444), Purple (#a855f7), Pink (#ec4899), Indigo (#6366f1)
export const CHART_PALETTE = [
  '#4ade80', // vibrant green
  '#14b8a6', // teal
  '#0ea5e9', // sky blue
  '#f59e0b', // amber
  '#ef4444', // coral red
  '#a855f7', // purple
  '#ec4899', // pink
  '#0284c7', // deep sky
  '#d97706', // dark amber
  '#059669', // emerald
  '#6366f1', // indigo
  '#64748b', // slate
];

/**
 * Deterministic pseudo-random based on a string seed so metrics remain consistent on refresh.
 */
function seededRandom(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const x = Math.sin(Math.abs(hash) + 1) * 10000;
  return x - Math.floor(x);
}

/**
 * Generates analytics for a survey and its questions.
 */
export function getSurveyAnalytics(survey: Survey): SurveyAnalyticsData {
  const totalInterviewed = survey.responsesCount || 112;
  const quotaRequired = survey.participantsRequired || 150;
  const completionRate = Math.min(100, Math.round((totalInterviewed / quotaRequired) * 100));

  const questions = survey.questions || [];

  const questionsAnalytics: QuestionAnalytics[] = questions.map((q, idx) => {
    const qNum = idx + 1;
    const seedBase = `${survey.id}-${q.id || idx}`;

    if (q.type === 'likert_scale') {
      const labels = q.likertConfig?.labels || [
        q.likertConfig?.highLabel || 'Very Satisfied',
        'Satisfied',
        q.likertConfig?.midLabel || 'Neutral',
        'Dissatisfied',
        q.likertConfig?.lowLabel || 'Very Dissatisfied',
      ];

      // Realistic bell / satisfaction distribution
      const weights = [38, 32, 18, 8, 4];
      const distributions: OptionDistribution[] = labels.map((label, lIdx) => {
        const pct = weights[lIdx] ?? 10;
        const count = Math.round((pct / 100) * totalInterviewed);
        return {
          label,
          count,
          percentage: pct,
          color: CHART_PALETTE[lIdx % CHART_PALETTE.length],
        };
      });

      // Compute weighted likert score (1 to 5)
      const avgScore = (
        (distributions[0].count * 5 +
          distributions[1].count * 4 +
          distributions[2].count * 3 +
          distributions[3].count * 2 +
          distributions[4].count * 1) /
        totalInterviewed
      ).toFixed(1);

      return {
        questionId: q.id || `q-${idx}`,
        questionNumber: qNum,
        questionText: q.question,
        questionType: q.type,
        totalAnswers: totalInterviewed,
        distributions,
        likertScore: parseFloat(avgScore),
        topAnswer: `${distributions[0].label} (${distributions[0].percentage}%)`,
      };
    }

    if (q.type === 'dichotomous') {
      const labels = q.dichotomousLabels || ['Yes', 'No'];
      const r = Math.round(55 + seededRandom(seedBase) * 25); // 55% - 80%
      const yesPct = r;
      const noPct = 100 - yesPct;
      const distributions: OptionDistribution[] = [
        {
          label: labels[0] || 'Yes',
          count: Math.round((yesPct / 100) * totalInterviewed),
          percentage: yesPct,
          color: '#4ade80', // green
        },
        {
          label: labels[1] || 'No',
          count: Math.round((noPct / 100) * totalInterviewed),
          percentage: noPct,
          color: '#ef4444', // red
        },
      ];

      return {
        questionId: q.id || `q-${idx}`,
        questionNumber: qNum,
        questionText: q.question,
        questionType: q.type,
        totalAnswers: totalInterviewed,
        distributions,
        topAnswer: `${distributions[0].label} (${distributions[0].percentage}%)`,
      };
    }

    if (q.type === 'single_choice' || q.type === 'multiple_choice') {
      const options = q.options && q.options.length > 0 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'];

      // Generate realistic uneven percentages summing to 100
      let rawPcts = options.map((opt, oIdx) => {
        const factor = Math.max(1, options.length - oIdx * 0.7);
        return 10 + Math.round(seededRandom(`${seedBase}-${opt}`) * 25 * factor);
      });
      const sum = rawPcts.reduce((a, b) => a + b, 0);
      let remaining = 100;
      const distributions: OptionDistribution[] = options.map((opt, oIdx) => {
        const isLast = oIdx === options.length - 1;
        const pct = isLast ? remaining : Math.max(3, Math.round((rawPcts[oIdx] / sum) * 100));
        remaining -= pct;
        const count = Math.round((pct / 100) * totalInterviewed);
        return {
          label: opt,
          count,
          percentage: pct,
          color: CHART_PALETTE[oIdx % CHART_PALETTE.length],
        };
      });

      // Sort descending by percentage for ranked representation
      distributions.sort((a, b) => b.percentage - a.percentage);

      return {
        questionId: q.id || `q-${idx}`,
        questionNumber: qNum,
        questionText: q.question,
        questionType: q.type,
        totalAnswers: totalInterviewed,
        distributions,
        topAnswer: `${distributions[0].label} (${distributions[0].percentage}%)`,
      };
    }

    // Descriptive / Text answers
    const sampleResponses = [
      {
        id: 'resp-1',
        text: 'Villagers noted that while Ladli Behna funds are disbursed promptly, youth need local technical coaching centers to qualify for IT and government jobs without migrating.',
        sentiment: 'suggestion' as const,
        authorLocation: 'Bharkhedi Kalan, Ujjain',
      },
      {
        id: 'resp-2',
        text: 'The solar pump installation under PM Kusum was praised by majority of farmer families. Water table issues remain in summer months.',
        sentiment: 'positive' as const,
        authorLocation: 'Ward 4, Indore Urban',
      },
      {
        id: 'resp-3',
        text: 'Primary health sub-center opens irregularly on weekends. Anganwadi worker is actively screening maternal nutrition.',
        sentiment: 'neutral' as const,
        authorLocation: 'Kolar Block, Bhopal',
      },
      {
        id: 'resp-4',
        text: 'Road connectivity improved travel time to block headquarters from 90 mins to 35 mins. Bus frequency could be increased.',
        sentiment: 'positive' as const,
        authorLocation: 'Gwalior Block A',
      },
    ];

    return {
      questionId: q.id || `q-${idx}`,
      questionNumber: qNum,
      questionText: q.question,
      questionType: q.type,
      totalAnswers: totalInterviewed,
      distributions: [
        { label: 'Positive Sentiment', count: Math.round(totalInterviewed * 0.52), percentage: 52, color: '#4ade80' },
        { label: 'Constructive Suggestion', count: Math.round(totalInterviewed * 0.33), percentage: 33, color: '#0ea5e9' },
        { label: 'Critical Issue / Bottleneck', count: Math.round(totalInterviewed * 0.15), percentage: 15, color: '#f59e0b' },
      ],
      textResponses: sampleResponses,
      topAnswer: '52% Positive Sentiment, 33% Policy Suggestions',
    };
  });

  return {
    survey,
    totalInterviewed,
    quotaRequired,
    completionRate,
    averageTimeMinutes: 6.4,
    questionsAnalytics,
  };
}

/**
 * Creates up to 30 synthetic questions for testing high-capacity survey reporting.
 */
export function generateExpandedQuestions(baseQuestions: SurveyQuestion[] = []): SurveyQuestion[] {
  if (baseQuestions.length >= 25) return baseQuestions;

  const templates: Omit<SurveyQuestion, 'id'>[] = [
    { type: 'single_choice', question: 'Primary household source of drinking water:', options: ['Piped Tap Water (Har Ghar Jal)', 'Borewell / Handpump', 'Community Well', 'Water Tanker'], required: true },
    { type: 'likert_scale', question: 'Reliability and voltage stability of rural electricity supply:', likertConfig: { points: 5, lowLabel: 'Very Poor', highLabel: 'Excellent', midLabel: 'Average' }, required: true },
    { type: 'multiple_choice', question: 'Agricultural crops cultivated during the Kharif season:', options: ['Soybean', 'Cotton', 'Paddy', 'Maize', 'Pulses'], required: true },
    { type: 'dichotomous', question: 'Does the household hold an active Ayushman Bharat Golden Card?', dichotomousLabels: ['Yes', 'No'], required: true },
    { type: 'single_choice', question: 'Mode of transport most commonly used for visiting block hospital:', options: ['Two-wheeler (Motorcycle)', 'Public Bus', 'Auto Rickshaw', 'Shared Van', 'Walking'], required: true },
    { type: 'likert_scale', question: 'Accessibility and helpfulness of Panchayat Secretary (Sachiv):', likertConfig: { points: 5, lowLabel: 'Unresponsive', highLabel: 'Highly Responsive', midLabel: 'Moderate' }, required: true },
    { type: 'multiple_choice', question: 'Government direct benefit transfers (DBT) received in last 12 months:', options: ['PM Kisan Samman', 'CM Kisan Kalyan', 'Ladli Behna Yojana', 'Lado Protsahan', 'Old Age Pension'], required: true },
    { type: 'dichotomous', question: 'Has any household member received vocational skill training under PMKVY or MMYSY?', dichotomousLabels: ['Yes', 'No'], required: true },
    { type: 'single_choice', question: 'Average monthly household expenditure on healthcare and medicine:', options: ['Under ₹500', '₹500 – ₹1,500', '₹1,500 – ₹3,000', 'More than ₹3,000'], required: true },
    { type: 'likert_scale', question: 'Quality of Mid-Day Meals served in local government primary school:', likertConfig: { points: 5, lowLabel: 'Substandard', highLabel: 'High Quality', midLabel: 'Acceptable' }, required: true },
    { type: 'single_choice', question: 'Availability of banking / banking correspondent (Bank Mitra) services:', options: ['Within Village', 'Within 2–5 km', 'At Block HQ (5–15 km)', 'Not Available'], required: true },
    { type: 'dichotomous', question: 'Does the household have an operational LPG connection under PM Ujjwala Yojana?', dichotomousLabels: ['Yes', 'No'], required: true },
    { type: 'multiple_choice', question: 'Major challenges faced in selling agricultural produce at Mandi:', options: ['Delayed Payments', 'Transportation Costs', 'Lack of Storage / Godowns', 'Price Volatility', 'Middlemen Margins'], required: true },
    { type: 'likert_scale', question: 'Cleanliness and waste management status under Swachh Bharat Gramin:', likertConfig: { points: 5, lowLabel: 'Very Dirty', highLabel: 'Very Clean', midLabel: 'Average' }, required: true },
    { type: 'descriptive', question: 'Key village infrastructure priority recommended by community elders for the next 3 years:', placeholder: 'Enter observations…', required: false },
  ];

  const expanded = [...baseQuestions];
  let counter = expanded.length + 1;

  for (const tpl of templates) {
    if (expanded.length >= 30) break;
    expanded.push({
      id: `q-ext-${counter}`,
      ...tpl,
    });
    counter++;
  }

  return expanded;
}
