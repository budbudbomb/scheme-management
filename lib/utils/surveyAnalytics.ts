import type { Survey, SurveyQuestion } from '@/types/models';
import type { LocationFilterState } from './locationData';

export interface OptionDistribution {
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface ParticipantDescriptiveResponse {
  id: string;
  participantNumber: number;
  participantName: string;
  initials: string;
  division: string;
  district: string;
  block: string;
  gramPanchayat: string;
  village: string;
  interviewDate: string;
  interviewerName: string;
  interviewerRole: 'intern' | 'fellow' | 'pc';
  responseType: 'voice' | 'video' | 'image' | 'text';
  textResponse: string;
  voiceDuration?: string;
  videoDuration?: string;
  videoThumbnail?: string;
  imageUrl?: string;
  imageCaption?: string;
  avatarColor: string;
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
  participantResponses?: ParticipantDescriptiveResponse[];
}

export interface SurveyAnalyticsData {
  survey: Survey;
  totalInterviewed: number;
  quotaRequired: number;
  completionRate: number;
  averageTimeMinutes: number;
  villagesCovered: number;
  overallSentimentScore: number;
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
 * Generates analytics for a survey and its questions with optional 5-level location hierarchy filtering.
 */
export function getSurveyAnalytics(
  survey: Survey,
  locationFilter?: LocationFilterState
): SurveyAnalyticsData {
  const baseTotal = survey.responsesCount || 112;
  const quotaRequired = survey.participantsRequired || 150;

  // Scale total responses realistically if a geographic filter is active
  let totalInterviewed = baseTotal;
  let locSeed = '';
  if (locationFilter?.village) {
    totalInterviewed = Math.max(4, Math.round(baseTotal * 0.06));
    locSeed = `v-${locationFilter.village}`;
  } else if (locationFilter?.gramPanchayat) {
    totalInterviewed = Math.max(8, Math.round(baseTotal * 0.12));
    locSeed = `gp-${locationFilter.gramPanchayat}`;
  } else if (locationFilter?.block) {
    totalInterviewed = Math.max(16, Math.round(baseTotal * 0.25));
    locSeed = `b-${locationFilter.block}`;
  } else if (locationFilter?.district) {
    totalInterviewed = Math.max(28, Math.round(baseTotal * 0.45));
    locSeed = `d-${locationFilter.district}`;
  } else if (locationFilter?.division) {
    totalInterviewed = Math.max(54, Math.round(baseTotal * 0.72));
    locSeed = `div-${locationFilter.division}`;
  }

  const completionRate = Math.min(100, Math.round((totalInterviewed / quotaRequired) * 100));

  const questions = survey.questions || [];

  const questionsAnalytics: QuestionAnalytics[] = questions.map((q, idx) => {
    const qNum = idx + 1;
    const seedBase = `${survey.id}-${q.id || idx}-${locSeed}`;

    if (q.type === 'likert_scale') {
      const labels = q.likertConfig?.labels || [
        q.likertConfig?.highLabel || 'Very Satisfied',
        'Satisfied',
        q.likertConfig?.midLabel || 'Neutral',
        'Dissatisfied',
        q.likertConfig?.lowLabel || 'Very Dissatisfied',
      ];

      // Realistic bell / satisfaction distribution with deterministic local variance
      const shift = Math.floor(seededRandom(seedBase) * 8) - 4;
      const weights = [
        Math.max(18, 38 + shift),
        Math.max(14, 32 - shift),
        18,
        8,
        4,
      ];
      const sumW = weights.reduce((a, b) => a + b, 0);

      const distributions: OptionDistribution[] = labels.map((label, lIdx) => {
        const pct = Math.round((weights[lIdx] / sumW) * 100);
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
        (totalInterviewed || 1)
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
      const r = Math.round(52 + seededRandom(seedBase) * 32); // 52% - 84%
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

    // Descriptive responses (Circle for each participant: voice, video, image, text)
    // 20 participants covering Division -> District -> Block -> Gram Panchayat -> Village
    const participantTemplates: Array<{
      name: string;
      initials: string;
      division: string;
      district: string;
      block: string;
      gramPanchayat: string;
      village: string;
      responseType: 'voice' | 'video' | 'image' | 'text';
      textResponse: string;
      voiceDuration?: string;
      videoDuration?: string;
      videoThumbnail?: string;
      imageUrl?: string;
      imageCaption?: string;
      avatarColor: string;
    }> = [
      {
        name: 'Kamla Bai',
        initials: 'KB',
        division: 'Bhopal Division',
        district: 'Sehore',
        block: 'Ashta',
        gramPanchayat: 'Kothri',
        village: 'Kothri Kalan',
        responseType: 'voice',
        textResponse: 'Voice Recording Transcript: "Elderly pension is credited directly to post office accounts on the 5th of every month without deductions. Extremely satisfied with DBT transfer."',
        voiceDuration: '00:54',
        avatarColor: '#059669',
      },
      {
        name: 'Mohanlal Lodhi',
        initials: 'ML',
        division: 'Bhopal Division',
        district: 'Sehore',
        block: 'Ashta',
        gramPanchayat: 'Kothri',
        village: 'Kothri Khurd',
        responseType: 'text',
        textResponse: 'The newly constructed check dam under Jal Ganga Samvardhan Abhiyan has raised the water table in our borewells significantly before the Kharif sowing cycle.',
        avatarColor: '#2563eb',
      },
      {
        name: 'Sunita Meena',
        initials: 'SM',
        division: 'Bhopal Division',
        district: 'Bhopal',
        block: 'Bhopal Rural',
        gramPanchayat: 'Kolar Ward 3',
        village: 'Kolar Kalan',
        responseType: 'video',
        textResponse: 'Field Video Recording: Community meeting with women SHG members demonstrating their dairy cooperative ledger and requesting government linkage for refrigerated transport milk vans.',
        videoDuration: '02:18',
        videoThumbnail: 'SHG Dairy Cooperative Meeting',
        avatarColor: '#ec4899',
      },
      {
        name: 'Arvind Vishwakarma',
        initials: 'AV',
        division: 'Bhopal Division',
        district: 'Bhopal',
        block: 'Bhopal Rural',
        gramPanchayat: 'Fanda Kalan',
        village: 'Fanda Kalan',
        responseType: 'image',
        textResponse: 'Photo Documentation: Smart classroom equipment installed at the Government Higher Secondary School. Tablets and digital projector are actively utilized.',
        imageUrl: '/smart_classroom.jpg',
        imageCaption: 'Smart classroom setup in Fanda Kalan School',
        avatarColor: '#d97706',
      },
      {
        name: 'Virendra Singh',
        initials: 'VS',
        division: 'Bhopal Division',
        district: 'Bhopal',
        block: 'Berasia',
        gramPanchayat: 'Berasia Dehat',
        village: 'Berasia Gaon',
        responseType: 'text',
        textResponse: 'Mobile internet connectivity is weak in the outer settlements of our village. During online school tests, students have to walk 1 km towards the highway to get 4G coverage.',
        avatarColor: '#4b5563',
      },
      {
        name: 'Babulal Verma',
        initials: 'BV',
        division: 'Bhopal Division',
        district: 'Sehore',
        block: 'Budhni',
        gramPanchayat: 'Shahganj',
        village: 'Shahganj Village',
        responseType: 'voice',
        textResponse: 'Voice Recording Transcript: "Paddy procurement center operates smoothly with electronic weighing. The SMS token system has eliminated long queues at the Mandi."',
        voiceDuration: '02:05',
        avatarColor: '#0284c7',
      },
      {
        name: 'Radhika Kushwaha',
        initials: 'RK',
        division: 'Bhopal Division',
        district: 'Sehore',
        block: 'Budhni',
        gramPanchayat: 'Bakhtra',
        village: 'Bakhtra',
        responseType: 'text',
        textResponse: 'The nutrition kit distribution at Anganwadi center is punctual. Pre-school children are provided hot cooked meals twice daily.',
        avatarColor: '#db2777',
      },
      {
        name: 'Devendra Baghel',
        initials: 'DB',
        division: 'Bhopal Division',
        district: 'Sehore',
        block: 'Sehore Rural',
        gramPanchayat: 'Bilkisganj',
        village: 'Bilkisganj',
        responseType: 'image',
        textResponse: 'Photo Record: Community bio-gas plant (GOBAR-dhan scheme) operational and generating cooking gas for 18 households in the settlement.',
        imageUrl: '/biogas_plant.jpg',
        imageCaption: 'GOBAR-dhan community bio-gas plant',
        avatarColor: '#059669',
      },
      {
        name: 'Anita Lodhi',
        initials: 'AL',
        division: 'Bhopal Division',
        district: 'Raisen',
        block: 'Sanchi',
        gramPanchayat: 'Sanchi Dehat',
        village: 'Sanchi Gaon',
        responseType: 'image',
        textResponse: 'Photo Record: Demonstration of new digital banking kiosk (Bank Mitra) installed inside the Panchayat Bhawan, serving 4 nearby villages with pension withdrawals.',
        imageUrl: '/bank_mitra_kiosk.jpg',
        imageCaption: 'Bank Mitra banking kiosk in Sanchi',
        avatarColor: '#f59e0b',
      },
      {
        name: 'Rameshwar Dhakad',
        initials: 'RD',
        division: 'Ujjain Division',
        district: 'Ujjain',
        block: 'Ujjain Urban',
        gramPanchayat: 'Bharkhedi',
        village: 'Bharkhedi Kalan',
        responseType: 'voice',
        textResponse: 'Voice Recording Transcript: "While Ladli Behna installments are disbursed on time each month, the youth in our village urgently require local skill coaching so they do not have to migrate to Indore or Kota for technical jobs."',
        voiceDuration: '01:42',
        avatarColor: '#6366f1',
      },
      {
        name: 'Suman Malviya',
        initials: 'SM',
        division: 'Ujjain Division',
        district: 'Ujjain',
        block: 'Ujjain Urban',
        gramPanchayat: 'Tajpur',
        village: 'Tajpur',
        responseType: 'voice',
        textResponse: 'Voice Recording Transcript: "The Sub-health center was renovated last month. 24x7 institutional delivery facility is now available within 3 km."',
        voiceDuration: '01:10',
        avatarColor: '#8b5cf6',
      },
      {
        name: 'Pooja Tiwari',
        initials: 'PT',
        division: 'Indore Division',
        district: 'Indore',
        block: 'Sanwer',
        gramPanchayat: 'Sanwer Kalan',
        village: 'Sanwer Kalan',
        responseType: 'voice',
        textResponse: 'Voice Recording Transcript: "The primary health sub-center doctor visits twice a week. The ANM worker is doing excellent work with maternal vaccination, but generic anti-diabetes medicines are frequently stock-out."',
        voiceDuration: '01:15',
        avatarColor: '#f59e0b',
      },
      {
        name: 'Jitendra Sen',
        initials: 'JS',
        division: 'Indore Division',
        district: 'Indore',
        block: 'Sanwer',
        gramPanchayat: 'Chandrawatiganj',
        village: 'Chandrawatiganj',
        responseType: 'text',
        textResponse: 'The Gram Panchayat e-governance kiosk has simplified caste and domicile certificate issuance. We no longer need to travel to Tehsil office.',
        avatarColor: '#0284c7',
      },
      {
        name: 'Kailash Patidar',
        initials: 'KP',
        division: 'Indore Division',
        district: 'Indore',
        block: 'Depalpur',
        gramPanchayat: 'Depalpur Ward 5',
        village: 'Depalpur Ward 5',
        responseType: 'image',
        textResponse: 'Field Photograph: Solar pump installation under PM Kusum scheme operational at cooperative farm field. Farmer reports 40% savings in diesel costs.',
        imageUrl: '/solar_pump_field.jpg',
        imageCaption: 'Solar pump operational in Depalpur village',
        avatarColor: '#10b981',
      },
      {
        name: 'Manish Chouhan',
        initials: 'MC',
        division: 'Indore Division',
        district: 'Dhar',
        block: 'Dhar Rural',
        gramPanchayat: 'Pithampur Sector 2',
        village: 'Pithampur Sector 2',
        responseType: 'text',
        textResponse: 'Our village water pipeline reaches 70% of households, but during summer peak hours the pressure drops severely. A secondary booster pump near the community tank would solve the issue completely.',
        avatarColor: '#0ea5e9',
      },
      {
        name: 'Gopal Yadav',
        initials: 'GY',
        division: 'Gwalior Division',
        district: 'Gwalior',
        block: 'Gwalior Block A',
        gramPanchayat: 'Bhitarwar Khurd',
        village: 'Bhitarwar Khurd',
        responseType: 'image',
        textResponse: 'Photo Documentation: Captured field evidence of recently repaired bridge connecting the primary agricultural storage center to the state highway. Farmers can now transport produce even during rains.',
        imageUrl: '/bridge_inspection.jpg',
        imageCaption: 'Connecting bridge repaired under Gram Sadak Yojana',
        avatarColor: '#14b8a6',
      },
      {
        name: 'Meena Bai Tomar',
        initials: 'MT',
        division: 'Gwalior Division',
        district: 'Gwalior',
        block: 'Gwalior Block A',
        gramPanchayat: 'Dabra Dehat',
        village: 'Dabra Gaon',
        responseType: 'video',
        textResponse: 'Video Interview: Women craft group producing handloom bedsheets and sarees under One District One Product (ODOP) initiative with direct marketing linkages.',
        videoDuration: '02:04',
        videoThumbnail: 'ODOP Handloom Craft Group',
        avatarColor: '#a855f7',
      },
      {
        name: 'Rekha Ahirwar',
        initials: 'RA',
        division: 'Jabalpur Division',
        district: 'Jabalpur',
        block: 'Sihora',
        gramPanchayat: 'Sihora Khurd',
        village: 'Sihora Khurd',
        responseType: 'text',
        textResponse: 'Self-help group tailoring center established in January is running well with 22 women members. We received orders from the local block office for stitching school uniforms.',
        avatarColor: '#f43f5e',
      },
      {
        name: 'Santosh Kevat',
        initials: 'SK',
        division: 'Jabalpur Division',
        district: 'Jabalpur',
        block: 'Sihora',
        gramPanchayat: 'Sihora Khurd',
        village: 'Majholi',
        responseType: 'voice',
        textResponse: 'Voice Recording Transcript: "Fisheries cooperative society received subsidized fingerlings and net kits from District Fisheries office. Yield is up by 30% this year."',
        voiceDuration: '01:28',
        avatarColor: '#0284c7',
      },
      {
        name: 'Deepak Sharma',
        initials: 'DS',
        division: 'Jabalpur Division',
        district: 'Narsinghpur',
        block: 'Gadarwara',
        gramPanchayat: 'Narsinghpur Basti',
        village: 'Narsinghpur Basti',
        responseType: 'video',
        textResponse: 'Video Interview: Village Sarpanch and ward members discussing need for solar streetlights near the primary government school crossing to prevent accidents during foggy winter evenings.',
        videoDuration: '01:54',
        videoThumbnail: 'Interview with Village Sarpanch',
        avatarColor: '#8b5cf6',
      },
    ];

    // Filter participant templates based on active location filter
    const filteredTemplates = participantTemplates.filter(p => {
      if (locationFilter?.division && p.division !== locationFilter.division) return false;
      if (locationFilter?.district && p.district !== locationFilter.district) return false;
      if (locationFilter?.block && p.block !== locationFilter.block) return false;
      if (locationFilter?.gramPanchayat && p.gramPanchayat !== locationFilter.gramPanchayat) return false;
      if (locationFilter?.village && p.village !== locationFilter.village) return false;
      return true;
    });

    const participantResponses: ParticipantDescriptiveResponse[] = filteredTemplates.map((p, pIdx) => ({
      id: `part-resp-${pIdx + 1}`,
      participantNumber: pIdx + 1,
      participantName: p.name,
      initials: p.initials,
      division: p.division,
      district: p.district,
      block: p.block,
      gramPanchayat: p.gramPanchayat,
      village: p.village,
      interviewDate: '2026-08-28',
      interviewerName: pIdx % 2 === 0 ? 'Priya Patel' : 'Rohit Yadav',
      interviewerRole: 'intern' as const,
      responseType: p.responseType,
      textResponse: p.textResponse,
      voiceDuration: p.voiceDuration,
      videoDuration: p.videoDuration,
      imageUrl: p.imageUrl,
      imageCaption: p.imageCaption,
      avatarColor: p.avatarColor,
    }));

    return {
      questionId: q.id || `q-${idx}`,
      questionNumber: qNum,
      questionText: q.question,
      questionType: q.type,
      totalAnswers: totalInterviewed,
      distributions: [], // No graphs for descriptive questions
      participantResponses,
      topAnswer: `${participantResponses.length} Participant Submissions (Voice, Video, Image, Text)`,
    };
  });

  let villagesCovered = 20;
  if (locationFilter?.village) villagesCovered = 1;
  else if (locationFilter?.gramPanchayat) villagesCovered = 3;
  else if (locationFilter?.block) villagesCovered = 6;
  else if (locationFilter?.district) villagesCovered = 10;
  else if (locationFilter?.division) villagesCovered = 14;

  const likertQs = questionsAnalytics.filter(q => q.likertScore !== undefined);
  const overallSentimentScore = likertQs.length > 0
    ? parseFloat((likertQs.reduce((acc, q) => acc + (q.likertScore || 0), 0) / likertQs.length).toFixed(1))
    : 4.2;

  return {
    survey,
    totalInterviewed,
    quotaRequired,
    completionRate,
    averageTimeMinutes: 6.4,
    villagesCovered,
    overallSentimentScore,
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
