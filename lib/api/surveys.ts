import { get, post, postFormData } from './client';
import type { Survey, SurveyResponse, StakeholderDetails } from '@/types/models';
import { MOCK_PAGINATED_SURVEYS, MOCK_SURVEYS } from './mockData';

export interface SurveysQuery {
  createdById?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedSurveys {
  items: Survey[];
  total: number;
  page: number;
  limit: number;
}

export const surveysApi = {
  list: async (params?: SurveysQuery): Promise<PaginatedSurveys> => {
    try {
      return await get<PaginatedSurveys>('/surveys', params as Record<string, unknown>);
    } catch {
      return MOCK_PAGINATED_SURVEYS;
    }
  },

  getById: async (id: string): Promise<Survey> => {
    try {
      return await get<Survey>(`/surveys/${id}`);
    } catch {
      const normalizedId = id.replace(/^surv-/, 'survey-');
      const found = MOCK_SURVEYS.find(s => s.id === id || s.id === normalizedId || s.id.replace(/^survey-/, 'surv-') === id);
      if (found) return found;
      if (MOCK_SURVEYS.length > 0) return MOCK_SURVEYS[0];
      throw new Error('Survey not found');
    }
  },

  create: async (data: Omit<Survey, 'id' | 'createdBy' | 'isAllocatedAsTask' | 'createdAt'>): Promise<Survey> => {
    try {
      return await post<Survey>('/surveys', data);
    } catch {
      const newSurvey: Survey = {
        id: `survey-${Date.now()}`,
        title: data.title,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        participantsRequired: data.participantsRequired || 50,
        responsesCount: 0,
        status: data.status || 'active',
        questions: data.questions,
        documents: data.documents,
        createdBy: { id: 'u-admin-01', name: 'Admin', role: 'admin' },
        isAllocatedAsTask: false,
        createdAt: new Date().toISOString(),
      };
      MOCK_SURVEYS.unshift(newSurvey);
      MOCK_PAGINATED_SURVEYS.total = MOCK_SURVEYS.length;
      return newSurvey;
    }
  },


  submitResponse: async (
    surveyId: string,
    data: { stakeholder: StakeholderDetails; answers: Record<string, string | string[] | number> } | FormData
  ): Promise<SurveyResponse> => {
    try {
      if (data instanceof FormData) {
        return await postFormData<SurveyResponse>(`/surveys/${surveyId}/respond`, data);
      }
      return await post<SurveyResponse>(`/surveys/${surveyId}/respond`, data);
    } catch {
      // Mock fallback
      const survey = MOCK_SURVEYS.find(s => s.id === surveyId);
      if (survey) {
        survey.responsesCount = (survey.responsesCount || 0) + 1;
      }
      const isFormData = data instanceof FormData;
      const stakeholder: StakeholderDetails = isFormData ? {
        fullName: data.get('stakeholderFullName')?.toString() || 'Respondent',
        contactInfo: data.get('stakeholderContactInfo')?.toString() || undefined,
      } : data.stakeholder;

      const answers = isFormData ? {} : data.answers;

      return {
        id: `resp-${Date.now()}`,
        surveyId,
        respondent: { id: 'u-curr-01', name: 'Field Officer', role: 'intern' },
        stakeholder,
        answers,
        submittedAt: new Date().toISOString(),
      };
    }
  },

  getResponses: (surveyId: string, params?: { respondentId?: string; page?: number }) =>
    get<{ items: SurveyResponse[]; total: number }>(`/surveys/${surveyId}/responses`, params as Record<string, unknown>),

  saveDraftResponse: async (
    surveyId: string,
    data: { stakeholder: StakeholderDetails; answers: Record<string, string | string[] | number> } | FormData
  ): Promise<{ response: SurveyResponse; responsesCount: number }> => {
    const survey = MOCK_SURVEYS.find(s => s.id === surveyId || s.id.replace(/^survey-/, 'surv-') === surveyId);
    if (survey) {
      survey.responsesCount = (survey.responsesCount || 0) + 1;
    }
    const isFormData = data instanceof FormData;
    const stakeholder: StakeholderDetails = isFormData ? {
      fullName: data.get('stakeholderFullName')?.toString() || 'Respondent',
      contactInfo: data.get('stakeholderContactInfo')?.toString() || undefined,
    } : data.stakeholder;

    const answers = isFormData ? {} : data.answers;

    const response: SurveyResponse = {
      id: `resp-${Date.now()}`,
      surveyId,
      respondent: { id: 'u-curr-01', name: 'Field Officer', role: 'intern' },
      stakeholder,
      answers,
      submittedAt: new Date().toISOString(),
    };

    return { response, responsesCount: survey ? survey.responsesCount || 1 : 1 };
  },

  submitHierarchySurvey: async (
    surveyId: string,
    params: {
      submittedBy: import('@/types/models').AssigneeRef;
      role: 'intern' | 'fellow' | 'pc';
      feedbackText: string;
      challengesFaced?: string;
      recommendations?: string;
    }
  ): Promise<{ survey: Survey; feedback: import('@/types/models').SurveyFeedback }> => {
    const survey = MOCK_SURVEYS.find(s => s.id === surveyId || s.id.replace(/^survey-/, 'surv-') === surveyId) || MOCK_SURVEYS[0];
    
    let nextStatus: import('@/types/models').SurveySubmissionStatus = 'submitted_by_intern';
    let targetRole: 'fellow' | 'pc' | 'spm_cpm' = 'fellow';

    if (params.role === 'intern') {
      nextStatus = 'submitted_by_intern';
      targetRole = 'fellow';
    } else if (params.role === 'fellow') {
      nextStatus = 'submitted_by_fellow';
      targetRole = 'pc';
    } else if (params.role === 'pc') {
      nextStatus = 'submitted_by_pc';
      targetRole = 'spm_cpm';
    }

    survey.submissionStatus = nextStatus;
    if (!survey.feedbacks) {
      survey.feedbacks = [];
    }

    const newFeedback: import('@/types/models').SurveyFeedback = {
      id: `fb-${Date.now()}`,
      surveyId: survey.id,
      submittedBy: params.submittedBy,
      role: params.role,
      submittedToRole: targetRole,
      feedbackText: params.feedbackText,
      challengesFaced: params.challengesFaced,
      recommendations: params.recommendations,
      stakeholdersInterviewedCount: survey.responsesCount || 0,
      createdAt: new Date().toISOString(),
    };

    survey.feedbacks.push(newFeedback);
    return { survey, feedback: newFeedback };
  },
};

